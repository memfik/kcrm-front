"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { NavGroup, Section } from "@/config/nav"
import { cn } from "@/lib/utils"

/** Мега-меню группы: разделы · быстрые действия · карточка-превью. Позиция — под пунктом навигации. */
export function MegaMenu({
  group,
  anchor,
  onClose,
  onSearch,
}: {
  group: NavGroup
  anchor: DOMRect
  onClose: () => void
  onSearch: () => void
}) {
  const many = group.sections.length > 7
  const width = Math.min(many ? 1180 : 900, window.innerWidth - 24)
  const left = Math.max(12, Math.min(window.innerWidth - width - 12, anchor.left - 40))

  return (
    <>
      <div className="fixed inset-0 z-[59] bg-[var(--dd-dim)] animate-in fade-in duration-150" onClick={onClose} />
      <div
        role="menu"
        className="fixed z-[70] rounded-[26px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-[22px] shadow-[var(--dd-shadow)] animate-in fade-in slide-in-from-top-1.5 duration-150"
        style={{ width, left, top: anchor.bottom + 12 }}
      >
        <div className={cn("grid gap-x-[18px] gap-y-2", many ? "grid-cols-[2.6fr_1fr]" : "grid-cols-[1fr_1fr_1.1fr]")}>
          <div className={cn(many && "grid grid-cols-2 content-start gap-x-2")}>
            <GroupTitle className={cn(many && "col-span-full")}>{group.title}</GroupTitle>
            {group.sections.map((x) => (
              <SectionLink key={x.slug} section={x} onClick={onClose} />
            ))}
          </div>
          <div>
            <GroupTitle>Быстрые действия</GroupTitle>
            {group.quick.map((x) => (
              <MenuLink key={x.title} href={x.href} icon={x.icon} title={x.title} hint={x.hint} onClick={onClose} />
            ))}
          </div>
          {!many && (
            <Link
              href={`/${group.sections[0].slug}`}
              onClick={onClose}
              className="block self-start overflow-hidden rounded-[18px] border border-[var(--dd-line)] bg-[var(--feat-bg)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5"
            >
              <FeaturePic kind={group.feature.pic} />
              <div className="px-4 py-3.5">
                <b className="block text-sm">{group.feature.title}</b>
                <span className="mt-[3px] block text-xs leading-[1.45] text-muted-foreground">{group.feature.text}</span>
              </div>
            </Link>
          )}
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="mt-3.5 flex w-full items-center gap-2 border-t border-[var(--dd-line)] px-3 pt-3.5 text-[13px] text-muted-foreground"
        >
          Поиск по контрагентам, БИН и ID
          <Kbd className="ml-auto">⌘</Kbd>
          <Kbd>K</Kbd>
        </button>
      </div>
    </>
  )
}

export function GroupTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h5
      className={cn(
        "mx-2.5 mt-1.5 mb-2 text-[11.5px] font-semibold tracking-[1px] whitespace-nowrap text-[var(--mg-dim)] uppercase",
        className
      )}
    >
      {children}
    </h5>
  )
}

export function Thumb({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 flex-none place-items-center rounded-[10px] border border-[var(--thumb-line)] bg-[var(--thumb-bg)] text-[var(--thumb-ic)] transition-colors duration-200",
        className
      )}
    >
      <Icon className="size-[17px]" strokeWidth={2} />
    </span>
  )
}

export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-lg border border-[var(--kbd-line)] px-2 py-[3px] text-[11px] whitespace-nowrap text-[var(--nav-text)]",
        className
      )}
    >
      {children}
    </span>
  )
}

/** Метки из макетов: «Новое» — страницы по требованиям ДИППП/ТБ, «Доработано» — расширенные. */
export function SectionBadge({ kind }: { kind: Section["badge"] }) {
  if (!kind) return null
  return (
    <span
      className={cn(
        "ml-auto flex-none rounded-full px-[7px] py-0.5 text-[10px] font-bold tracking-[0.03em] uppercase",
        kind === "new"
          ? "bg-[rgba(52,199,89,0.16)] text-[#22a447] dark:text-[#4cd964]"
          : "bg-[rgba(8,94,255,0.14)] text-[#085eff] dark:text-[#6b9dff]"
      )}
    >
      {kind === "new" ? "Новое" : "Доработано"}
    </span>
  )
}

export function SectionLink({ section: x, onClick }: { section: Section; onClick?: () => void }) {
  return (
    <MenuLink href={`/${x.slug}`} icon={x.icon} title={x.title} hint={x.hint} onClick={onClick}>
      <SectionBadge kind={x.badge} />
      {x.count && (
        <span
          className={cn(
            "rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums",
            x.badge ? "ml-1.5" : "ml-auto"
          )}
        >
          {x.count}
        </span>
      )}
    </MenuLink>
  )
}

function MenuLink({
  href,
  icon,
  title,
  hint,
  onClick,
  children,
}: {
  href: string
  icon: LucideIcon
  title: string
  hint?: string
  onClick?: () => void
  children?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="group/mi flex items-center gap-3 rounded-[14px] p-2.5 text-sm text-[var(--mg-text)] transition-[background-color,transform] duration-150 hover:bg-[var(--mg-on)] active:scale-[0.97]"
    >
      <Thumb icon={icon} className="group-hover/mi:border-[#085eff] group-hover/mi:bg-[#085eff] group-hover/mi:text-white" />
      <span className="min-w-0">
        {title}
        {hint && <span className="mt-px block text-[11.5px] text-muted-foreground">{hint}</span>}
      </span>
      {children}
      <ChevronRight
        className={cn(
          "size-4 flex-none -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover/mi:translate-x-0 group-hover/mi:opacity-100",
          children ? "ml-2" : "ml-auto"
        )}
      />
    </Link>
  )
}

const BRAND = "#085eff"

function FeaturePic({ kind }: { kind: NavGroup["feature"]["pic"] }) {
  const cls = "block h-[180px] w-full"
  if (kind === "funnel")
    return (
      <svg className={cls} viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="mm-fg" x1="0" x2="1">
            <stop offset="0" stopColor={BRAND} />
            <stop offset="1" stopColor="#6b9dff" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={60 + i * 22} y={28 + i * 26} width={280 - i * 44} height={18} rx={9} fill="url(#mm-fg)" opacity={1 - i * 0.15} />
        ))}
      </svg>
    )
  if (kind === "bars")
    return (
      <svg className={cls} viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {[60, 90, 72, 120, 100, 140, 118, 150].map((h, i) => (
          <rect
            key={i}
            x={40 + i * 42}
            y={160 - h}
            width={24}
            height={h}
            rx={7}
            fill={i === 7 ? BRAND : `color-mix(in srgb, ${BRAND} 28%, transparent)`}
          />
        ))}
      </svg>
    )
  const line = "M20 140 L80 118 L140 126 L200 84 L260 96 L320 52 L380 40"
  return (
    <svg className={cls} viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <path d={line} fill="none" stroke={BRAND} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${line} L380 180 L20 180Z`} fill={BRAND} opacity={0.12} />
      <path d="M20 150 L80 140 L140 132 L200 120 L260 112 L320 100 L380 92" fill="none" stroke="#94a3b8" strokeWidth={2.5} strokeDasharray="6 6" />
      <circle cx={380} cy={40} r={7} fill={BRAND} />
    </svg>
  )
}
