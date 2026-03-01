"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import {
  Pause, Play, Trash2, ExternalLink,
  AlertTriangle, CheckCircle2, Clock, Edit3,
} from "lucide-react";
import type { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onPause: (id: string) => Promise<void>;
  onResume: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEditPrice: (task: Task) => void;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  active: {
    label: "Активен",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: "status-active",
  },
  paused: {
    label: "Пауза",
    icon: <Clock className="w-3 h-3" />,
    className: "status-paused",
  },
  broken: {
    label: "Ошибка",
    icon: <AlertTriangle className="w-3 h-3" />,
    className: "status-broken",
  },
  deleted: {
    label: "Удалён",
    icon: null,
    className: "status-broken",
  },
};

function formatURL(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.slice(0, 32);
    return u.hostname.replace("www.", "") + path + (u.pathname.length > 32 ? "…" : "");
  } catch {
    return url.slice(0, 40);
  }
}

function formatDate(iso?: string) {
  if (!iso) return "Ещё не проверялась";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export function TaskCard({ task, onPause, onResume, onDelete, onEditPrice }: TaskCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.broken;

  const handlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      // Clamp: left up to -80px (delete reveal), right up to 80px (edit reveal)
      setSwipeOffset(Math.max(-80, Math.min(80, deltaX)));
    },
    onSwipedLeft: ({ absX }) => {
      if (absX > 60) {
        // Delete action
        wrap(() => onDelete(task.id));
      }
      setSwipeOffset(0);
    },
    onSwipedRight: ({ absX }) => {
      if (absX > 60) {
        onEditPrice(task);
      }
      setSwipeOffset(0);
    },
    onTouchEndOrOnMouseUp: () => setSwipeOffset(0),
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 10,
  });

  async function wrap(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  const isActive = task.status === "active";
  const isBroken = task.status === "broken";

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe action backgrounds */}
      <div className="absolute inset-0 flex">
        {/* Right side: edit */}
        <div className="flex-1 flex items-center justify-start pl-5 surface-2">
          <Edit3 className="w-5 h-5 text-primary-accent opacity-80" />
        </div>
        {/* Left side: delete */}
        <div
          className="flex items-center justify-end pr-5"
          style={{ background: "oklch(0.65 0.21 25 / 20%)" }}
        >
          <Trash2 className="w-5 h-5 text-destructive opacity-80" />
        </div>
      </div>

      {/* Card content */}
      <div
        {...handlers}
        style={{ transform: `translateX(${swipeOffset}px)`, transition: swipeOffset === 0 ? "transform 0.2s ease" : "none" }}
        className={cn(
          "relative surface-1 border rounded-xl p-4 select-none",
          isBroken && "border-destructive/30",
          !isBroken && "border-border",
          busy && "opacity-60 pointer-events-none"
        )}
      >
        {/* Top row: status + actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-mono",
                status.className
              )}
            >
              {status.icon}
              {status.label}
            </span>
          </div>

          {/* Desktop / tap actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEditPrice(task)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:surface-3 transition-colors"
              title="Изменить цену"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            {isActive ? (
              <button
                onClick={() => wrap(() => onPause(task.id))}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:surface-3 transition-colors"
                title="Приостановить"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => wrap(() => onResume(task.id))}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:surface-3 transition-colors"
                title="Возобновить"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => wrap(() => onDelete(task.id))}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:surface-3 transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* URL row */}
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary-accent transition-colors mb-3 group font-mono"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3 shrink-0 group-hover:text-primary-accent" />
          <span className="truncate">{formatURL(task.url)}</span>
        </a>

        {/* Price display */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Порог цены</p>
            <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {task.max_price.toLocaleString("ru-RU")}
              <span className="text-base font-normal text-primary-accent ml-1">₽</span>
            </p>
          </div>

          {/* Last checked */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground/50 font-mono">
              {formatDate(task.last_checked_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
