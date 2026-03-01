"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, RussianRuble, AlertCircle, Loader2 } from "lucide-react";
import type { CreateTaskPayload } from "@/types";
import { toast } from "sonner";

const OFFLINE_DRAFT_KEY = "mh_draft_task";
const ALLOWED_DOMAIN = "wildberries.ru";

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateTaskPayload) => Promise<void>;
  prefillUrl?: string; // Web Share Target API
}

function validateUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes(ALLOWED_DOMAIN)) {
      return `Принимаем только ссылки с ${ALLOWED_DOMAIN}`;
    }
    return null;
  } catch {
    return "Некорректная ссылка";
  }
}

export function CreateTaskDialog({ open, onClose, onCreate, prefillUrl }: CreateTaskDialogProps) {
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  // Restore offline draft on open
  useEffect(() => {
    if (open) {
      if (prefillUrl) {
        setUrl(prefillUrl);
      } else {
        const draft = localStorage.getItem(OFFLINE_DRAFT_KEY);
        if (draft) {
          try {
            const { url: u, price: p } = JSON.parse(draft);
            setUrl(u ?? "");
            setPrice(p ?? "");
          } catch {}
        }
      }
      setTimeout(() => urlRef.current?.focus(), 50);
    }
  }, [open, prefillUrl]);

  // Persist draft to localStorage as user types (offline support)
  useEffect(() => {
    if (url || price) {
      localStorage.setItem(OFFLINE_DRAFT_KEY, JSON.stringify({ url, price }));
    }
  }, [url, price]);

  function handleUrlBlur() {
    if (url) setUrlError(validateUrl(url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urlErr = validateUrl(url);
    if (urlErr) { setUrlError(urlErr); return; }
    const maxPrice = parseInt(price, 10);
    if (!maxPrice || maxPrice <= 0) {
      toast.error("Введите корректную цену");
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({ url: url.trim(), max_price: maxPrice });
      localStorage.removeItem(OFFLINE_DRAFT_KEY);
      toast.success("Воркер создан! Начнём мониторинг.", {
        description: `Порог: ${maxPrice.toLocaleString("ru-RU")} ₽`,
      });
      setUrl("");
      setPrice("");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Не удалось создать воркер";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (!submitting) {
      setUrlError(null);
      onClose();
    }
  }

  const priceNum = parseInt(price, 10);
  const isValidForm = !urlError && url.length > 0 && priceNum > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="surface-1 border-border rounded-2xl max-w-md mx-auto p-0 overflow-hidden">
        {/* Header accent bar */}
        <div
          className="h-1 w-full"
          style={{
            background: "linear-gradient(90deg, oklch(0.78 0.18 195), oklch(0.72 0.17 155))",
          }}
        />

        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-lg font-bold tracking-tight">
              Новый воркер
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Вставьте ссылку на категорию или поиск WB и укажите максимальную цену.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* URL field */}
            <div className="space-y-2">
              <Label htmlFor="task-url" className="text-sm font-medium">
                Ссылка на WB
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={urlRef}
                  id="task-url"
                  type="url"
                  placeholder="https://www.wildberries.ru/catalog/..."
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
                  onBlur={handleUrlBlur}
                  className={`pl-9 surface-2 border-border font-mono text-sm h-11 rounded-xl focus:ring-primary-glow transition-all ${
                    urlError ? "border-destructive/60" : ""
                  }`}
                  disabled={submitting}
                />
              </div>
              {urlError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {urlError}
                </div>
              )}
            </div>

            {/* Price field */}
            <div className="space-y-2">
              <Label htmlFor="task-price" className="text-sm font-medium">
                Максимальная цена
              </Label>
              <div className="relative">
                <RussianRuble className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="task-price"
                  type="number"
                  min={1}
                  placeholder="3 500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-9 surface-2 border-border font-mono text-sm h-11 rounded-xl focus:ring-primary-glow transition-all"
                  disabled={submitting}
                />
              </div>
              {priceNum > 0 && (
                <p className="text-xs text-muted-foreground font-mono">
                  ≤ {priceNum.toLocaleString("ru-RU")} ₽ — уведомим при любом совпадении
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 rounded-xl surface-2 border-border"
                disabled={submitting}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={!isValidForm || submitting}
                className="flex-1 h-11 rounded-xl font-semibold"
                style={
                  isValidForm
                    ? {
                        background: "oklch(0.78 0.18 195)",
                        color: "oklch(0.10 0.005 240)",
                      }
                    : {}
                }
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Создать воркер"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
