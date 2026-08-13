import { createFileRoute } from "@tanstack/react-router";
import nodemailer from "nodemailer";
import { adminAuth } from "@/lib/firebase.server";

const ACTION_URL = "https://streamflix-e91bc.web.app/";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Payload = {
  kind?: unknown;
  email?: unknown;
};

function serverEnv(name: string): string {
  return ((import.meta.env as Record<string, string | undefined>)[name] ?? "").trim();
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ ok: false, error: message }, { status });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function emailHtml(title: string, intro: string, link: string, buttonText: string): string {
  const safeLink = escapeHtml(link);
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#171717;border:1px solid rgba(255,255,255,0.1);border-radius:10px;">
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#dc2626;">STREAM<span style="color:#fafafa;">FLIX</span></p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;">
                <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#fafafa;">${escapeHtml(title)}</h1>
                <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#a1a1aa;">${escapeHtml(intro)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 32px 8px;">
                <a href="${safeLink}" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;padding:12px 28px;border-radius:6px;">${escapeHtml(buttonText)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#a1a1aa;word-break:break-all;"><a href="${safeLink}" style="color:#a1a1aa;">${safeLink}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">If you didn't request this, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function templateFor(
  kind: "verifyEmail" | "resetPassword",
  link: string,
  displayName?: string,
): { subject: string; html: string } {
  const name = displayName?.trim() || "there";
  if (kind === "verifyEmail") {
    return {
      subject: "Verify your email for StreamFlix",
      html: emailHtml(
        "Verify your email",
        `Hi ${escapeHtml(name)}, confirm your email address to finish setting up your StreamFlix account.`,
        link,
        "Verify Email",
      ),
    };
  }
  return {
    subject: "Reset your password for StreamFlix",
    html: emailHtml(
      "Reset your password",
      "We received a request to reset your StreamFlix password. Click below to choose a new one.",
      link,
      "Reset Password",
    ),
  };
}

async function smtpTransport() {
  const host = serverEnv("SMTP_HOST");
  if (!host) throw new Error("SMTP is not configured.");
  const secure = serverEnv("SMTP_SECURE") === "true";
  const user = serverEnv("SMTP_USER");
  return nodemailer.createTransport({
    host,
    port: Number(serverEnv("SMTP_PORT") || (secure ? 465 : 587)),
    secure,
    auth: user ? { user, pass: serverEnv("SMTP_PASS") } : undefined,
  });
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const from = serverEnv("SMTP_FROM") || "StreamFlix <noreply@streamflix.dpdns.org>";
  const transport = await smtpTransport();
  await transport.sendMail({ from, to, subject, html });
}

async function handleVerifyEmail(request: Request): Promise<Response> {
  const authHeader = request.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) return errorResponse("Missing authorization.", 401);

  let email: string;
  let displayName: string | undefined;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    email = decoded.email ?? "";
    displayName = decoded.name ?? undefined;
  } catch {
    return errorResponse("Invalid authorization.", 401);
  }
  if (!email) return errorResponse("This account has no email address.", 400);

  const link = await adminAuth.generateEmailVerificationLink(email, {
    url: ACTION_URL,
    handleCodeInApp: true,
  });
  const template = templateFor("verifyEmail", link, displayName);
  await sendMail(email, template.subject, template.html);
  return Response.json({ ok: true });
}

async function handleResetPassword(email: string): Promise<Response> {
  const link = await adminAuth.generatePasswordResetLink(email, {
    url: ACTION_URL,
    handleCodeInApp: true,
  });
  const template = templateFor("resetPassword", link);
  await sendMail(email, template.subject, template.html);
  return Response.json({ ok: true });
}

async function handler({ request }: { request: Request }): Promise<Response> {
  let payload: Payload | null = null;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  try {
    if (payload?.kind === "verifyEmail") {
      return await handleVerifyEmail(request);
    }
    if (payload?.kind === "resetPassword") {
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      if (!EMAIL_RE.test(email)) return errorResponse("Invalid email.", 400);
      return await handleResetPassword(email);
    }
    return errorResponse("Unsupported email kind.", 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(message, 500);
  }
}

export const Route = createFileRoute("/api/email/action")({
  server: {
    handlers: {
      POST: handler,
    },
  },
});
