import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachFirebaseAuth } from "@/lib/auth-attacher";

// Global error logging for debugging iOS 12 / browser issues
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    console.error("[Global Error]", e.message, e.filename, e.lineno, e.colno, e.error);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[Unhandled Rejection]", e.reason);
  });
  console.log("[Debug] Global error handlers attached");
  console.log("[Debug] User Agent:", navigator.userAgent);
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachFirebaseAuth],
  requestMiddleware: [csrfMiddleware, errorMiddleware],
}));
