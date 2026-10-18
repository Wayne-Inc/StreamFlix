import { createFileRoute } from "@tanstack/react-router";
import { getAdminDb } from "@/lib/firebase.server";

const VIP_PRICE = "1.99";
const VIP_CURRENCY = "USD";
type PayPalAction = "create-order" | "capture-order";

type PayPalOrder = {
  id?: string;
  status?: string;
  links?: Array<{ rel: string; href: string }>;
  purchase_units?: Array<{
    custom_id?: string;
    payments?: {
      captures?: Array<{
        status?: string;
        amount?: { value?: string; currency_code?: string };
      }>;
    };
  }>;
};

async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("VITE_FIREBASE_API_KEY is not configured.");

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );
  if (!response.ok) return null;
  const result = (await response.json()) as { users?: Array<{ localId?: string }> };
  return result.users?.[0]?.localId ?? null;
}

function getPayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const siteUrl = process.env.VITE_SITE_URL;
  const mode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
  if (!clientId || !clientSecret || !siteUrl) {
    throw new Error("PayPal server configuration is incomplete.");
  }
  const parsedSiteUrl = new URL(siteUrl);
  if (parsedSiteUrl.protocol !== "https:" && parsedSiteUrl.hostname !== "localhost") {
    throw new Error("VITE_SITE_URL must use HTTPS.");
  }
  return {
    clientId,
    clientSecret,
    siteUrl: parsedSiteUrl.origin,
    apiBase: mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
  };
}

async function getPayPalAccessToken(apiBase: string, clientId: string, clientSecret: string) {
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new Error("PayPal authentication failed.");
  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token) throw new Error("PayPal did not return an access token.");
  return result.access_token;
}

async function handlePayPalRequest(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uid = await verifyFirebaseIdToken(authHeader.slice(7));
    if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as { action?: PayPalAction; orderId?: string };
    const db = await getAdminDb();
    const vipRef = db.collection("vip").doc(uid);

    if (body.action === "create-order") {
      if ((await vipRef.get()).exists) {
        return Response.json({ error: "This account already has VIP." }, { status: 409 });
      }

      const { apiBase, clientId, clientSecret, siteUrl } = getPayPalConfig();
      const accessToken = await getPayPalAccessToken(apiBase, clientId, clientSecret);
      const response = await fetch(`${apiBase}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": crypto.randomUUID(),
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              custom_id: uid,
              description: "StreamFlix VIP membership",
              amount: { currency_code: VIP_CURRENCY, value: VIP_PRICE },
            },
          ],
          application_context: {
            brand_name: "StreamFlix",
            user_action: "PAY_NOW",
            return_url: `${siteUrl}/settings?paypal=success`,
            cancel_url: `${siteUrl}/settings?paypal=cancelled`,
          },
        }),
      });
      if (!response.ok) {
        console.error("PayPal create order failed:", response.status, await response.text());
        return Response.json({ error: "Could not start PayPal checkout." }, { status: 502 });
      }

      const order = (await response.json()) as PayPalOrder;
      const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;
      if (!order.id || !approvalUrl) {
        return Response.json({ error: "PayPal returned an invalid checkout order." }, { status: 502 });
      }

      await db.collection("paypal_orders").doc(order.id).set({
        userId: uid,
        amount: VIP_PRICE,
        currency: VIP_CURRENCY,
        status: "created",
        createdAt: new Date(),
      });
      return Response.json({ approvalUrl });
    }

    if (body.action === "capture-order") {
      const orderId = body.orderId?.trim();
      if (!orderId || !/^[A-Z0-9-]{10,}$/i.test(orderId)) {
        return Response.json({ error: "Invalid PayPal order." }, { status: 400 });
      }

      const orderRef = db.collection("paypal_orders").doc(orderId);
      const [orderSnap, vipSnap] = await Promise.all([orderRef.get(), vipRef.get()]);
      const orderData = orderSnap.data();
      if (!orderSnap.exists || orderData?.userId !== uid) {
        return Response.json({ error: "PayPal order not found." }, { status: 404 });
      }
      if (orderData.status === "captured" && vipSnap.exists) {
        return Response.json({ ok: true, vip: true });
      }
      if (orderData.status !== "created") {
        return Response.json({ error: "This PayPal order cannot be captured." }, { status: 409 });
      }

      const { apiBase, clientId, clientSecret } = getPayPalConfig();
      const accessToken = await getPayPalAccessToken(apiBase, clientId, clientSecret);
      const response = await fetch(
        `${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "PayPal-Request-Id": `capture-${orderId}`,
          },
        },
      );
      if (!response.ok) {
        console.error("PayPal capture failed:", response.status, await response.text());
        return Response.json({ error: "PayPal payment capture failed." }, { status: 502 });
      }

      const capturedOrder = (await response.json()) as PayPalOrder;
      const purchaseUnit = capturedOrder.purchase_units?.[0];
      const capture = purchaseUnit?.payments?.captures?.[0];
      const paid =
        capturedOrder.id === orderId &&
        capturedOrder.status === "COMPLETED" &&
        purchaseUnit?.custom_id === uid &&
        capture?.status === "COMPLETED" &&
        capture.amount?.value === VIP_PRICE &&
        capture.amount.currency_code === VIP_CURRENCY &&
        orderData.amount === VIP_PRICE &&
        orderData.currency === VIP_CURRENCY;
      if (!paid) {
        return Response.json({ error: "PayPal payment could not be verified." }, { status: 402 });
      }

      await db.runTransaction(async (transaction) => {
        const currentOrder = await transaction.get(orderRef);
        if (
          !currentOrder.exists ||
          currentOrder.data()?.userId !== uid ||
          currentOrder.data()?.status !== "created"
        ) {
          throw new Error("PayPal order ownership or status check failed.");
        }
        transaction.set(vipRef, {
          provider: "paypal",
          orderId,
          amount: VIP_PRICE,
          currency: VIP_CURRENCY,
          grantedAt: new Date(),
        });
        transaction.update(orderRef, { status: "captured", capturedAt: new Date() });
      });

      return Response.json({ ok: true, vip: true });
    }

    return Response.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("PayPal API error:", error);
    return Response.json({ error: "PayPal checkout is unavailable." }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/paypal")({
  server: {
    handlers: {
      POST: ({ request }: { request: Request }) => handlePayPalRequest(request),
    },
  },
});
