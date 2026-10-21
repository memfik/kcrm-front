"use client"

import { useSyncExternalStore } from "react"
import type { ListConfig, Row } from "./types"

/*
 * Записи разделов в памяти вкладки: создание, правка и удаление видны и в списке, и в карточке.
 * TODO: API — загрузка, сохранение и удаление на сервере; это хранилище станет кешем.
 */

type Slot = { rows: Row[]; listeners: Set<() => void> }
const slots = new Map<string, Slot>()

function slot<T extends Row>(cfg: ListConfig<T>): Slot {
  let s = slots.get(cfg.key)
  if (!s) {
    s = { rows: cfg.rows(), listeners: new Set() }
    slots.set(cfg.key, s)
  }
  return s
}

function commit(s: Slot, rows: Row[]) {
  s.rows = rows
  s.listeners.forEach((l) => l())
}

export function useRows<T extends Row>(cfg: ListConfig<T>): T[] {
  const s = slot(cfg)
  return useSyncExternalStore(
    (l) => {
      s.listeners.add(l)
      return () => s.listeners.delete(l)
    },
    () => s.rows,
    () => s.rows
  ) as T[]
}

export const rowsStore = {
  find<T extends Row>(cfg: ListConfig<T>, id: number) {
    return (slot(cfg).rows as T[]).find((x) => x.id === id)
  },
  nextId<T extends Row>(cfg: ListConfig<T>) {
    return Math.max(0, ...slot(cfg).rows.map((x) => x.id)) + 1
  },
  save<T extends Row>(cfg: ListConfig<T>, row: T) {
    const s = slot(cfg)
    const i = s.rows.findIndex((x) => x.id === row.id)
    commit(s, i < 0 ? [row, ...s.rows] : s.rows.map((x) => (x.id === row.id ? row : x)))
  },
  /** Удаляет и возвращает функцию отмены. */
  remove<T extends Row>(cfg: ListConfig<T>, ids: number[]) {
    const s = slot(cfg)
    const drop = new Set(ids)
    const removed = s.rows.flatMap((x, i) => (drop.has(x.id) ? [[i, x] as const] : []))
    commit(s, s.rows.filter((x) => !drop.has(x.id)))
    return () => {
      const rows = [...s.rows]
      for (const [i, x] of removed) rows.splice(i, 0, x)
      commit(s, rows)
    }
  },
  duplicate<T extends Row>(cfg: ListConfig<T>, row: T) {
    const s = slot(cfg)
    const copy = { ...row, id: rowsStore.nextId(cfg) }
    const i = s.rows.indexOf(row)
    commit(s, [...s.rows.slice(0, i + 1), copy, ...s.rows.slice(i + 1)])
    return copy
  },
}

/*
 * Состояние списка (вкладка, фильтры, страница…) переживает переход в карточку и обратно.
 * Порядок отфильтрованных записей нужен карточке для «Предыдущая / Следующая».
 */
const views = new Map<string, unknown>()
const orders = new Map<string, number[]>()

export const viewStore = {
  get: <V,>(key: string) => views.get(key) as V | undefined,
  set: <V,>(key: string, v: V) => void views.set(key, v),
  order: (key: string) => orders.get(key),
  setOrder: (key: string, ids: number[]) => void orders.set(key, ids),
}
