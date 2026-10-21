"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ChevronDown, House, Menu, Search, Settings } from "lucide-react"
import { NAV_GROUPS } from "@/config/nav"
import { GlassButton } from "@/components/ui/opaline/glass-button"
import { LiquidGlass } from "@/components/ui/opaline/liquid-glass"
import { cn } from "@/lib/utils"
import { CommandMenu } from "./command-menu"
import { CURRENT_USER } from "@/lib/current-user"
import { Avatar, NotificationsPopover, SettingsPopover, UserPopover, usePrefsOnHtml } from "./header-popovers"
import { Logo } from "./logo"
import { Kbd, MegaMenu } from "./mega-menu"
import { MobileNav, TabBar } from "./mobile-nav"
import { ThemeToggle } from "./theme-toggle"

const round = "size-[46px] text-foreground max-sm:size-10"

/**
 * Шапка (макет 02): навигация-пилюля с мега-меню, ⌘K, уведомления, тема, настройки, профиль.
 * < 1240 px — бургер, ≤ 640 px — нижнее меню. Не липкая, как в макете: стекло не пересчитывается при прокрутке.
 */
export function Header() {
  const path = usePathname()
  const [menu, setMenu] = useState<{ key: string; rect: DOMRect } | null>(null)
  const [search, setSearch] = useState(false)
  const [mobile, setMobile] = useState(false)
  usePrefsOnHtml()

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    addEventListener("keydown", onKey)
    addEventListener("resize", close)
    return () => {
      removeEventListener("keydown", onKey)
      removeEventListener("resize", close)
    }
  }, [menu])

  const group = menu && NAV_GROUPS.find((g) => g.key === menu.key)
  const openSearch = () => {
    setMenu(null)
    setSearch(true)
  }

  return (
    <>
      <header className="relative z-[60] mx-auto flex w-full max-w-[1760px] items-center gap-5 px-[34px] pt-4 pb-5 max-sm:gap-2 max-sm:px-3.5 max-sm:pt-2.5 max-sm:pb-3">
        <Logo />

        <LiquidGlass
          bezel={10}
          className="hidden min-w-0 gap-1 overflow-x-auto rounded-full p-[5px] [scrollbar-width:none] min-[1240px]:flex"
        >
          <Link
            href="/"
            title="Главная"
            className={cn(navItem, "px-[13px]", path === "/" && navOn)}
          >
            <House className="size-[17px]" />
          </Link>
          {NAV_GROUPS.map((g) => {
            const active = g.sections.some((x) => path === `/${x.slug}` || path.startsWith(`/${x.slug}/`))
            const open = menu?.key === g.key
            return (
              <button
                key={g.key}
                type="button"
                aria-expanded={open}
                onClick={(e) => setMenu(open ? null : { key: g.key, rect: e.currentTarget.getBoundingClientRect() })}
                className={cn(navItem, active && navOn, open && !active && "bg-[var(--nav-hover)]")}
              >
                {g.title}
                <ChevronDown className={cn("hidden size-[13px] opacity-55 transition-transform duration-200 min-[1440px]:block", open && "rotate-180")} />
              </button>
            )
          })}
        </LiquidGlass>

        <div className="ml-auto flex flex-none items-center gap-2.5 max-sm:gap-2">
          <GlassButton
            onClick={openSearch}
            aria-label="Поиск по системе (⌘K)"
            className={cn(round, "min-[1620px]:w-[260px] min-[1620px]:justify-start min-[1620px]:gap-2.5 min-[1620px]:pr-2.5 min-[1620px]:pl-4")}
          >
            <Search className="size-[17px]" />
            <span className="hidden text-sm font-normal text-muted-foreground min-[1620px]:inline">Поиск по системе…</span>
            <Kbd className="ml-auto hidden min-[1620px]:inline">⌘ K</Kbd>
          </GlassButton>

          <NotificationsPopover
            trigger={(unread) => (
              <GlassButton aria-label="Уведомления" className={round}>
                <Bell className="size-[17px]" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 h-[18px] min-w-[18px] rounded-full bg-[#ff3b30] px-[5px] text-center text-[10.5px] leading-[18px] font-bold text-white shadow-[0_0_0_2px_var(--background)]">
                    {unread}
                  </span>
                )}
              </GlassButton>
            )}
          />

          <ThemeToggle size="icon" className={cn(round, "max-sm:hidden")} />

          <SettingsPopover
            trigger={
              <GlassButton aria-label="Настройки" className={cn(round, "max-sm:hidden")}>
                <Settings className="size-[17px]" />
              </GlassButton>
            }
          />

          <GlassButton aria-label="Меню" onClick={() => setMobile(true)} className={cn(round, "max-sm:hidden min-[1240px]:hidden")}>
            <Menu className="size-[17px]" />
          </GlassButton>

          <UserPopover
            trigger={
              <GlassButton aria-label="Профиль" className="h-[46px] gap-2.5 p-1 text-foreground max-sm:hidden min-[1760px]:pr-4">
                <Avatar />
                <span className="hidden text-left leading-[1.2] min-[1760px]:block">
                  <b className="block text-[13.5px] font-semibold">{CURRENT_USER.name}</b>
                  <span className="text-[11.5px] font-normal text-muted-foreground">{CURRENT_USER.department}</span>
                </span>
              </GlassButton>
            }
          />
        </div>
      </header>

      {group && menu && <MegaMenu group={group} anchor={menu.rect} onClose={() => setMenu(null)} onSearch={openSearch} />}
      <CommandMenu open={search} onOpenChange={setSearch} />
      <MobileNav open={mobile} onOpenChange={setMobile} onSearch={() => setSearch(true)} />
      <TabBar onMore={() => setMobile(true)} />
    </>
  )
}

const navItem =
  "flex h-[42px] cursor-pointer items-center gap-[7px] rounded-full px-3 min-[1440px]:px-[15px] text-[14.5px] whitespace-nowrap text-[var(--nav-text)] transition-[background-color,color,transform] duration-150 select-none hover:bg-[var(--nav-hover)] active:scale-[0.96]"
const navOn = "bg-[var(--nav-on-bg)] font-semibold text-[var(--nav-on)] hover:bg-[var(--nav-on-bg)]"
