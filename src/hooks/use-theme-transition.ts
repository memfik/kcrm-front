"use client"

import { useCallback, useRef } from "react"
import { useTheme } from "next-themes"

type WithViewTransition = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

/** Смена темы кругом от кнопки (View Transitions), как в kezdesu-front. */
export function useThemeTransition() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const busy = useRef(false)

  const toggleTheme = useCallback(
    (event?: { clientX: number; clientY: number }) => {
      const next = (resolvedTheme ?? theme) === "dark" ? "light" : "dark"
      const doc = document as WithViewTransition
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      if (busy.current || reduced || typeof doc.startViewTransition !== "function") {
        setTheme(next)
        return
      }
      const x = event ? (event.clientX / window.innerWidth) * 100 : 50
      const y = event ? (event.clientY / window.innerHeight) * 100 : 50
      document.documentElement.style.setProperty("--theme-x", `${x}%`)
      document.documentElement.style.setProperty("--theme-y", `${y}%`)

      busy.current = true
      const transition = doc.startViewTransition(() => setTheme(next))
      transition.finished.finally(() => {
        busy.current = false
      })
    },
    [theme, resolvedTheme, setTheme]
  )

  return { toggleTheme, theme, resolvedTheme }
}
