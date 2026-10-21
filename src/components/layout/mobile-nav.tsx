"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Dialog } from "radix-ui"
import { Briefcase, ChevronDown, ChevronRight, House, List, ListTodo, LogOut, Moon, Search, SlidersHorizontal, Users, X } from "lucide-react"
import { NAV_GROUPS } from "@/config/nav"
import { cn } from "@/lib/utils"
import { CURRENT_USER } from "@/lib/current-user"
import { Avatar } from "./header-popovers"
import { SectionLink, Thumb } from "./mega-menu"

/** Нижнее меню телефона (≤ 640 px). «Ещё» открывает все разделы. */
export function TabBar({ onMore }: { onMore: () => void }) {
  const path = usePathname()
  const tabs = [
    { href: "/", title: "Главная", icon: House },
    { href: "/counterparties", title: "Клиенты", icon: Users },
    { href: "/deals", title: "Сделки", icon: Briefcase },
    { href: "/tasks", title: "Задачи", icon: ListTodo, count: 4 },
  ]
  const inTabs = tabs.some((t) => (t.href === "/" ? path === "/" : path.startsWith(t.href)))
  const item = "relative flex flex-col items-center justify-center gap-[3px] rounded-[18px] text-[10.5px] font-medium text-muted-foreground"
  const on = "bg-[color-mix(in_srgb,#085eff_12%,transparent)] text-[#085eff] dark:text-[#6b9dff]"

  return (
    <nav className="fixed inset-x-2.5 bottom-[calc(10px+env(safe-area-inset-bottom,0px))] z-[140] grid h-16 grid-cols-5 rounded-3xl bg-[color-mix(in_srgb,var(--background)_88%,transparent)] p-1.5 shadow-[var(--glass-rim),0_14px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-[20px] sm:hidden">
      {tabs.map((t) => {
        const active = t.href === "/" ? path === "/" : path.startsWith(t.href)
        return (
          <Link key={t.href} href={t.href} className={cn(item, active && on)}>
            {t.count && (
              <i className="absolute top-1.5 left-[calc(50%+6px)] grid h-4 min-w-4 place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white not-italic">
                {t.count}
              </i>
            )}
            <t.icon className="size-[22px]" strokeWidth={1.9} />
            {t.title}
          </Link>
        )
      })}
      <button type="button" onClick={onMore} className={cn(item, !inTabs && on)}>
        <List className="size-[22px]" strokeWidth={1.9} />
        Ещё
      </button>
    </nav>
  )
}

/** Все разделы: на планшете — во весь экран (бургер), на телефоне — шторка снизу («Ещё»). */
export function MobileNav({
  open,
  onOpenChange,
  onSearch,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSearch: () => void
}) {
  const path = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const close = () => onOpenChange(false)
  const foot = "flex items-center gap-3 rounded-xl px-2 py-3 text-[15px]"

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[149] bg-black/40 max-sm:block sm:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[150] flex flex-col bg-background data-[state=open]:animate-in data-[state=open]:fade-in max-sm:top-10 max-sm:rounded-t-[26px] max-sm:shadow-[0_-20px_60px_rgba(0,0,0,0.5)] max-sm:data-[state=open]:slide-in-from-bottom-10 sm:data-[state=open]:slide-in-from-top-2"
        >
          <span className="absolute top-2 left-1/2 h-[5px] w-10 -translate-x-1/2 rounded-[3px] bg-[var(--dd-line)] sm:hidden" />
          <div className="flex items-center gap-2.5 border-b border-[var(--dd-line)] px-4 pt-[calc(12px+env(safe-area-inset-top,0px))] pb-3 max-sm:border-0 max-sm:pt-5">
            <Dialog.Title className="flex-1 text-[17px] font-bold">Все разделы</Dialog.Title>
            <Dialog.Close className="grid size-[42px] place-items-center rounded-full border border-[var(--dd-line)]" aria-label="Закрыть">
              <X className="size-[17px]" />
            </Dialog.Close>
          </div>

          <Link
            href="/profile"
            onClick={close}
            className="mx-4 mb-1.5 flex items-center gap-3 rounded-[18px] border border-[var(--dd-line)] p-3 sm:hidden"
          >
            <Avatar className="size-11" />
            <div>
              <b className="block text-[15px]">{CURRENT_USER.name}</b>
              <span className="text-[12.5px] text-muted-foreground">
                {CURRENT_USER.login} · {CURRENT_USER.department}
              </span>
            </div>
            <ChevronRight className="ml-auto size-[18px] text-muted-foreground" />
          </Link>
          <button
            type="button"
            onClick={() => {
              close()
              onSearch()
            }}
            className="mx-4 mt-3 mb-1 flex h-[46px] items-center gap-2.5 rounded-[14px] border border-[var(--dd-line)] px-4 text-sm text-muted-foreground max-sm:mt-0"
          >
            <Search className="size-[17px]" />
            Поиск по системе…
          </button>

          <div className="flex-1 overflow-auto px-2.5 pt-1 pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
            <Link href="/" onClick={close} className={cn("flex items-center gap-3 rounded-xl px-2 py-2.5 text-[15px]", path === "/" && "bg-[var(--mg-on)]")}>
              <Thumb icon={House} />
              <span>
                Главная
                <span className="block text-xs text-muted-foreground">Сводка и аналитика</span>
              </span>
            </Link>
            {NAV_GROUPS.map((g) => (
              <details key={g.key} open={g.sections.some((x) => path.startsWith(`/${x.slug}`))} className="group/d border-b border-[var(--dd-line)]">
                <summary className="flex cursor-pointer list-none items-center justify-between px-2 py-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
                  {g.title}
                  <ChevronDown className="size-[18px] opacity-60 transition-transform group-open/d:rotate-180" />
                </summary>
                {g.sections.map((x) => (
                  <SectionLink key={x.slug} section={x} onClick={close} />
                ))}
                <div className="mx-2 mt-2 mb-1 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">Быстрые действия</div>
                {g.quick.map((x) => (
                  <Link key={x.title} href={x.href} onClick={close} className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-[15px]">
                    <Thumb icon={x.icon} />
                    <span>
                      {x.title}
                      <span className="block text-xs text-muted-foreground">{x.hint}</span>
                    </span>
                  </Link>
                ))}
              </details>
            ))}
            <div className="flex flex-col gap-0.5 pt-2.5 pb-5">
              <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className={foot}>
                <Thumb icon={Moon} />
                Сменить тему
              </button>
              <Link href="/profile#ntf" onClick={close} className={foot}>
                <Thumb icon={SlidersHorizontal} />
                Настройки
              </Link>
              <Link href="/login" onClick={close} className={cn(foot, "text-[#ff5257]")}>
                <Thumb icon={LogOut} className="border-[rgba(255,82,87,0.2)] bg-[rgba(255,82,87,0.1)] text-[#ff5257]" />
                Выйти
              </Link>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
