"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [visible, setVisible] = useState(false);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem("pwa-install-dismissed")) return;

    const p = detectPlatform();
    setPlatform(p);

    if (p === "ios") {
      // iOS Safari doesn't fire beforeinstallprompt — show our own guide
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setInstallEvent(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!visible || dismissed) return null;

  return (
    <>
      {/* Install banner */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "px-4 pb-safe-bottom",
          "animate-in slide-in-from-bottom-4 duration-300"
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-md mb-4 rounded-2xl",
            "bg-[#13161e] border border-[#1e2333]",
            "shadow-[0_-4px_32px_rgba(0,0,0,0.5)]",
            "p-4"
          )}
        >
          <div className="flex items-start gap-3">
            {/* App icon */}
            <img
              src="/icon-192.png"
              alt="WB Monitor"
              className="w-14 h-14 rounded-2xl flex-shrink-0 shadow-md"
            />

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] text-white leading-tight">
                Установить приложение
              </p>
              <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">
                WB Monitor — быстрый доступ без браузера
              </p>

              {platform === "ios" ? (
                <button
                  onClick={() => setIosGuideOpen(true)}
                  className="mt-2.5 text-[13px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Как установить?
                </button>
              ) : (
                <div className="flex gap-2 mt-2.5">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="text-[13px] h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Установить
                  </Button>
                </div>
              )}
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              aria-label="Закрыть"
              className="text-gray-500 hover:text-gray-300 transition-colors mt-0.5 flex-shrink-0"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* iOS instruction sheet */}
      {iosGuideOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIosGuideOpen(false)}
        >
          <div
            className={cn(
              "w-full max-w-md rounded-t-3xl p-6 pb-10",
              "bg-[#13161e] border-t border-x border-[#1e2333]",
              "animate-in slide-in-from-bottom-4 duration-300"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5" />
            <p className="font-semibold text-white text-[16px] mb-4 text-center">
              Установка на iPhone / iPad
            </p>

            <ol className="space-y-4 text-[14px] text-gray-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[12px] font-bold mt-0.5">
                  1
                </span>
                <span>
                  Нажмите на кнопку{" "}
                  <strong className="text-white">«Поделиться»</strong>{" "}
                  <svg
                    className="inline w-4 h-4 text-blue-400 mb-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>{" "}
                  внизу экрана Safari
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[12px] font-bold mt-0.5">
                  2
                </span>
                <span>
                  Выберите{" "}
                  <strong className="text-white">
                    «На экран «Домой»»
                  </strong>{" "}
                  в меню
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-[12px] font-bold mt-0.5">
                  3
                </span>
                <span>
                  Нажмите{" "}
                  <strong className="text-white">«Добавить»</strong> —
                  иконка появится на рабочем столе
                </span>
              </li>
            </ol>

            <button
              onClick={() => {
                setIosGuideOpen(false);
                handleDismiss();
              }}
              className="mt-6 w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[15px] transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}
