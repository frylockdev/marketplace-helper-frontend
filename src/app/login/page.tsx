"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { token, loading, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && token) router.replace("/dashboard");
  }, [token, loading, router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background bg-grid">
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.78 0.18 195) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center max-w-sm w-full animate-slide-up">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-2xl surface-2 border border-border" />
            <div
              className="absolute inset-0 rounded-2xl opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.78 0.18 195 / 30%) 0%, transparent 100%)",
              }}
            />
            <svg
              viewBox="0 0 56 56"
              className="absolute inset-0 w-full h-full p-3"
              fill="none"
            >
              <path
                d="M10 40 L20 20 L28 32 L36 14 L46 40"
                stroke="oklch(0.78 0.18 195)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="46"
                cy="40"
                r="3"
                fill="oklch(0.72 0.17 155)"
                className="animate-pulse-ring"
              />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              WB Monitor
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              marketplace-helper
            </p>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Следи за скидками<br />
            <span className="text-primary-accent">на Wildberries</span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Создай воркер — получай уведомления в Telegram,<br />
            когда цена упадёт до твоего порога.
          </p>
        </div>

        {/* Auth button */}
        <div className="w-full">
          <Button
            onClick={signIn}
            className="w-full h-12 text-sm font-semibold gap-2.5 rounded-xl"
            style={{
              background: "oklch(0.78 0.18 195)",
              color: "#000",
            }}
          >
            <CasdoorIcon />
            Войти
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          Продолжая, вы соглашаетесь с условиями использования.
          <br />Данные используются только для мониторинга цен.
        </p>
      </div>

      {/* Feature hints at the bottom */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 px-6 animate-fade-in">
        {[
          { icon: "⚡", label: "Уведомления < 10 мин" },
          { icon: "🔒", label: "Безопасно" },
          { icon: "📱", label: "PWA" },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CasdoorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
    </svg>
  );
}
