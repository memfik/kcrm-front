"use client"

import { useSyncExternalStore } from "react"

/*
 * Фото и обложка профиля — в localStorage (`kcrm:avatar`, `kcrm:cover`), как в макете. Фото видно и в шапке.
 * TODO: хранить в профиле пользователя через API.
 */

const listeners = new Set<() => void>()
const read = (k: string) => {
  try {
    return localStorage.getItem(`kcrm:${k}`)
  } catch {
    return null
  }
}

export function setProfile(k: "avatar" | "cover", v: string | null) {
  try {
    if (v === null) localStorage.removeItem(`kcrm:${k}`)
    else localStorage.setItem(`kcrm:${k}`, v)
  } catch {}
  listeners.forEach((l) => l())
}

export function useProfile(k: "avatar" | "cover") {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => read(k),
    () => null
  )
}
