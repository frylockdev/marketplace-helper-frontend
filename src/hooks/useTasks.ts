"use client";

import { useState, useEffect, useCallback } from "react";
import { tasksAPI } from "@/lib/api";
import type { Task, CreateTaskPayload } from "@/types";
import { toast } from "sonner";

export function useTasks(token: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await tasksAPI.list(token);
      setTasks(data ?? []);
    } catch {
      toast.error("Не удалось загрузить воркеры");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (payload: CreateTaskPayload) => {
    if (!token) return;
    const task = await tasksAPI.create(payload, token);
    setTasks((prev) => [task, ...prev]);
    return task;
  }, [token]);

  const pauseTask = useCallback(async (id: string) => {
    if (!token) return;
    const updated = await tasksAPI.pause(id, token);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, [token]);

  const resumeTask = useCallback(async (id: string) => {
    if (!token) return;
    const updated = await tasksAPI.resume(id, token);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, [token]);

  const deleteTask = useCallback(async (id: string) => {
    if (!token) return;
    await tasksAPI.delete(id, token);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [token]);

  const updatePrice = useCallback(async (id: string, maxPrice: number) => {
    if (!token) return;
    const updated = await tasksAPI.updatePrice(id, { max_price: maxPrice }, token);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, [token]);

  return {
    tasks,
    loading,
    refreshing,
    refresh: () => fetchTasks(true),
    createTask,
    pauseTask,
    resumeTask,
    deleteTask,
    updatePrice,
  };
}
