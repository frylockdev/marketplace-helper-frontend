"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw, LogOut, Bot, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { EditPriceDialog } from "@/components/tasks/EditPriceDialog";
import { usersAPI } from "@/lib/api";
import type { Task } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <Suspense fallback={<FullScreenSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: authLoading, signOut } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [telegramLinked, setTelegramLinked] = useState<boolean | null>(null);
  const [linkingTelegram, setLinkingTelegram] = useState(false);

  // Web Share Target: URL pre-filled from share action
  const sharedUrl = searchParams.get("url") ?? undefined;

  const { tasks, loading, refreshing, refresh, createTask, pauseTask, resumeTask, deleteTask, updatePrice } =
    useTasks(token);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !token) router.replace("/");
  }, [authLoading, token, router]);

  // Check Telegram link status
  useEffect(() => {
    if (!token) return;
    usersAPI.getMe(token).then((u) => setTelegramLinked(u.telegram_linked)).catch(() => {});
  }, [token]);

  // Open create dialog if coming from Web Share Target
  useEffect(() => {
    if (sharedUrl) setCreateOpen(true);
  }, [sharedUrl]);

  // Pull-to-refresh (touch)
  const [pullStart, setPullStart] = useState<number | null>(null);
  const [pulling, setPulling] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) setPullStart(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback(
    async (e: React.TouchEvent) => {
      if (pullStart === null) return;
      const delta = e.changedTouches[0].clientY - pullStart;
      if (delta > 60) {
        setPulling(true);
        await refresh();
        setPulling(false);
      }
      setPullStart(null);
    },
    [pullStart, refresh]
  );

  async function handleLinkTelegram() {
    if (!token) return;
    setLinkingTelegram(true);
    try {
      const { deep_link } = await usersAPI.getTelegramToken(token);
      window.open(deep_link, "_blank");
      toast.info("Откройте бот и нажмите Start", {
        description: "После привязки обновите страницу",
      });
    } catch {
      toast.error("Не удалось получить токен");
    } finally {
      setLinkingTelegram(false);
    }
  }

  if (authLoading) return <FullScreenSpinner />;

  const activeTasks = tasks.filter((t) => t.status === "active");
  const hasAny = tasks.length > 0;

  return (
    <div
      className="min-h-screen bg-background bg-grid"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pulling || refreshing) && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3">
          <div className="surface-2 border border-border rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Обновляем...
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 surface-1 border-b border-border backdrop-blur-sm">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.78 0.18 195 / 20%)" }}
            >
              <Activity className="w-4 h-4 text-primary-accent" />
            </div>
            <span className="font-bold text-sm tracking-tight">Мои воркеры</span>
            {activeTasks.length > 0 && (
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded-md"
                style={{
                  background: "oklch(0.78 0.18 195 / 15%)",
                  color: "var(--primary)",
                }}
              >
                {activeTasks.length} активных
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:surface-2 transition-colors"
              title="Обновить"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </button>
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:surface-2 transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Telegram link banner */}
      {telegramLinked === false && (
        <div className="max-w-xl mx-auto px-4 pt-4">
          <button
            onClick={handleLinkTelegram}
            disabled={linkingTelegram}
            className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:surface-3 animate-slide-up"
            style={{
              background: "oklch(0.52 0.19 220 / 10%)",
              borderColor: "oklch(0.52 0.19 220 / 30%)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.52 0.19 220 / 25%)" }}
            >
              <Bot className="w-4 h-4" style={{ color: "oklch(0.70 0.19 220)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Подключить Telegram</p>
              <p className="text-xs text-muted-foreground truncate">
                Для получения уведомлений о ценах — необходимо
              </p>
            </div>
            <span className="text-xs font-mono text-primary-accent shrink-0 ml-auto">
              {linkingTelegram ? "…" : "→"}
            </span>
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-xl mx-auto px-4 pb-28 pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="surface-1 border border-border rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : !hasAny ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="space-y-3 stagger">
            {tasks.map((task) => (
              <div key={task.id} className="animate-slide-up">
                <TaskCard
                  task={task}
                  onPause={pauseTask}
                  onResume={resumeTask}
                  onDelete={async (id) => {
                    await deleteTask(id);
                    toast.success("Воркер удалён");
                  }}
                  onEditPrice={setEditTask}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-6 right-4 sm:right-6 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-95 hover:scale-105 z-40"
        style={{
          background: "oklch(0.78 0.18 195)",
          boxShadow: "0 4px 24px oklch(0.78 0.18 195 / 40%)",
        }}
        aria-label="Создать воркер"
      >
        <Plus className="w-6 h-6" style={{ color: "oklch(0.10 0.005 240)" }} />
      </button>

      {/* Dialogs */}
      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (payload) => { await createTask(payload); }}
        prefillUrl={sharedUrl}
      />
      <EditPriceDialog
        task={editTask}
        onClose={() => setEditTask(null)}
        onSave={updatePrice}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "oklch(0.78 0.18 195 / 12%)" }}
      >
        <Activity className="w-8 h-8 text-primary-accent opacity-60" />
      </div>
      <h2 className="text-lg font-bold mb-2">Нет активных воркеров</h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
        Создайте первый воркер, чтобы не пропустить скидку на WB. Мы пришлём уведомление в Telegram.
      </p>
      <button
        onClick={onCreate}
        className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "oklch(0.78 0.18 195)",
          color: "oklch(0.10 0.005 240)",
        }}
      >
        Создать воркер
      </button>
    </div>
  );
}

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <RefreshCw className="w-6 h-6 text-primary-accent animate-spin" />
    </div>
  );
}
