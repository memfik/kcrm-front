"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { formTarget, openForm } from "@/lib/list/form-store"

const inSection = (key: string) => location.pathname === `/${key}` || location.pathname.startsWith(`/${key}/`)

/**
 * Ссылка, понимающая адреса форм «/<раздел>/new» и «/<раздел>/<id>/edit»: открывает панель формы,
 * а если раздел другой — сначала переходит в его список. Остальные адреса — обычная ссылка.
 */
export function SmartLink({ href, onClick, ...props }: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const router = useRouter()
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e)
        const t = formTarget(href)
        if (!t || e.defaultPrevented) return
        e.preventDefault()
        openForm(t.key, t.id)
        if (!inSection(t.key)) router.push(`/${t.key}`)
      }}
      {...props}
    />
  )
}

/** То же для переходов из кода (поиск ⌘K). */
export function useGo() {
  const router = useRouter()
  return (href: string) => {
    const t = formTarget(href)
    if (!t) return router.push(href)
    openForm(t.key, t.id)
    if (!inSection(t.key)) router.push(`/${t.key}`)
  }
}
