"use client"

import { useEffect, useRef, useState } from "react"

/** Ширина элемента; обновляется не чаще раза в кадр. */
export function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const ro = new ResizeObserver(([e]) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setWidth(Math.round(e.contentRect.width)))
    })
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])
  return [ref, width] as const
}
