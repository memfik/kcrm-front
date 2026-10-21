"use client"

import { useSyncExternalStore } from "react"

/*
 * Открытая форма записи (создание / правка) — панель поверх текущей страницы, без смены адреса.
 * Показывает её список или карточка этого раздела, что сейчас на экране.
 */

type Open = { key: string; id?: number } | null
let open: Open = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function openForm(key: string, id?: number) {
  open = { key, id }
  emit()
}

export function closeForm() {
  if (!open) return
  open = null
  emit()
}

// «Назад» / «Вперёд» в браузере уводит со страницы — панель закрываем
if (typeof window !== "undefined") addEventListener("popstate", closeForm)

/** Открытая форма этого раздела или null. */
export function useOpenForm(key: string) {
  const v = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => open,
    () => null
  )
  return v && v.key === key ? v : null
}

/** «/deals/new…» или «/deals/29826/edit» — ссылка на форму: раздел и запись. */
export function formTarget(href: string): { key: string; id?: number } | null {
  const m = href.match(/^\/([\w-]+)\/(?:new|(\d+)\/edit)(?:[?#]|$)/)
  return m ? { key: m[1], id: m[2] ? +m[2] : undefined } : null
}
