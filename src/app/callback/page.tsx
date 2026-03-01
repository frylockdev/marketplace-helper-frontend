"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/casdoor";

/**
 * OIDC callback page.
 * Casdoor redirects here with ?code=...&state=... after login.
 * We exchange the code for an access token via the backend proxy
 * (avoids CORS and keeps client_secret server-side).
 */
export default function CallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    console.log("[callback] code:", code);

    if (!code) {
      console.warn("[callback] no code in URL, redirecting to /login");
      router.replace("/login");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    console.log("[callback] API URL:", apiUrl);
    console.log("[callback] fetching:", `${apiUrl}/api/v1/auth/callback`);

    fetch(`${apiUrl}/api/v1/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        console.log("[callback] response status:", res.status);
        if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
        return res.json() as Promise<{ access_token: string }>;
      })
      .then(({ access_token }) => {
        if (!access_token) throw new Error("no access_token in response");
        console.log("[callback] token received, redirecting to /dashboard");
        setToken(access_token);
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("[callback] auth failed:", err);
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-mono">Выполняется вход...</p>
      </div>
    </div>
  );
}
