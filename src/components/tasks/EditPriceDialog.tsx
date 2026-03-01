"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RussianRuble, Loader2 } from "lucide-react";
import type { Task } from "@/types";
import { toast } from "sonner";

interface EditPriceDialogProps {
  task: Task | null;
  onClose: () => void;
  onSave: (id: string, maxPrice: number) => Promise<void>;
}

export function EditPriceDialog({ task, onClose, onSave }: EditPriceDialogProps) {
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task) setPrice(String(task.max_price));
  }, [task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;
    const maxPrice = parseInt(price, 10);
    if (!maxPrice || maxPrice <= 0) {
      toast.error("Введите корректную цену");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(task.id, maxPrice);
      toast.success("Цена обновлена");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Ошибка обновления");
    } finally {
      setSubmitting(false);
    }
  }

  const priceNum = parseInt(price, 10);

  return (
    <Dialog open={!!task} onOpenChange={() => !submitting && onClose()}>
      <DialogContent className="surface-1 border-border rounded-2xl max-w-sm mx-auto p-6">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-base font-bold">Изменить порог цены</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-price" className="text-sm font-medium">
              Максимальная цена, ₽
            </Label>
            <div className="relative">
              <RussianRuble className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="edit-price"
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-9 surface-2 border-border font-mono h-11 rounded-xl"
                autoFocus
                disabled={submitting}
              />
            </div>
            {task && priceNum > 0 && priceNum !== task.max_price && (
              <p className="text-xs text-muted-foreground font-mono">
                Было: {task.max_price.toLocaleString("ru-RU")} ₽ →{" "}
                <span className="text-primary-accent">{priceNum.toLocaleString("ru-RU")} ₽</span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl surface-2 border-border"
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={!priceNum || priceNum <= 0 || submitting}
              className="flex-1 h-10 rounded-xl font-semibold"
              style={{ background: "oklch(0.78 0.18 195)", color: "oklch(0.10 0.005 240)" }}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
