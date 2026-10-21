"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Popover } from "radix-ui"
import {
  BookOpen,
  FileCheck,
  Gavel,
  Image as ImageIcon,
  ListTodo,
  LogOut,
  Percent,
  ShieldCheck,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import { CURRENT_USER } from "@/lib/current-user"
import { useProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"
import { GroupTitle, Thumb } from "./mega-menu"


const panel =
  "z-[90] w-[360px] max-w-[calc(100vw-24px)] rounded-[22px] border border-[var(--dd-line)] bg-[var(--dd-bg)] p-2.5 text-[var(--mg-text)] shadow-[var(--dd-shadow)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-1.5"

function HeaderPopover({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={10} collisionPadding={12} className={panel}>
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function Row({
  href,
  icon,
  title,
  text,
  unread,
  danger,
}: {
  href: string
  icon: LucideIcon
  title: string
  text: string
  unread?: boolean
  danger?: boolean
}) {
  return (
    <Popover.Close asChild>
      <Link
        href={href}
        className={cn(
          "flex items-start gap-3 rounded-[14px] p-2.5 text-[13.5px] hover:bg-[var(--mg-on)]",
          unread && "bg-[color-mix(in_srgb,#085eff_7%,transparent)]",
          danger && "text-[#ff5257]"
        )}
      >
        <Thumb
          icon={icon}
          className={cn(
            "size-[34px] [&_svg]:size-4",
            danger && "border-[rgba(255,82,87,0.2)] bg-[rgba(255,82,87,0.1)] text-[#ff5257]"
          )}
        />
        <span className="min-w-0">
          <b className="font-semibold">
            {title}
            {unread && <i className="ml-1.5 inline-block size-[7px] rounded-full bg-[#085eff] align-[1px]" />}
          </b>
          <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
        </span>
      </Link>
    </Popover.Close>
  )
}

/* ---------- Уведомления ---------- */

type Notice = { id: number; day: "Сегодня" | "Вчера"; icon: LucideIcon; title: string; text: string; href: string }

/** TODO: уведомления из API. */
const NOTICES: Notice[] = [
  { id: 1, day: "Сегодня", icon: FileCheck, title: "Новая заявка на ТВ и ТР", text: "№ 106 · ТОО «Каспий Инвест» · 5 мин назад", href: "/tech-requests" },
  { id: 2, day: "Сегодня", icon: Percent, title: "Запрос скидки на согласование", text: "КП № 5253 · скидка 22% · 1 ч назад", href: "/discount-requests" },
  { id: 3, day: "Сегодня", icon: ListTodo, title: "Срок задачи истекает", text: "«Подготовить КП на интернет 100 Мбит/с» · сегодня 18:00", href: "/tasks" },
  { id: 4, day: "Вчера", icon: Wrench, title: "Наряд выполнен", text: "Н-18003 · акт не приложен · вчера", href: "/work-orders" },
  { id: 5, day: "Вчера", icon: Gavel, title: "Новое объявление о закупке", text: "Услуги доступа к сети Интернет · вчера", href: "/tenders" },
]

export function NotificationsPopover({ trigger }: { trigger: (unread: number) => React.ReactNode }) {
  const [unread, setUnread] = useState<number[]>([1, 2, 3])
  const [onlyUnread, setOnlyUnread] = useState(false)
  const list = NOTICES.filter((n) => !onlyUnread || unread.includes(n.id))

  return (
    <HeaderPopover trigger={trigger(unread.length)}>
      <div className="flex items-center justify-between px-2.5 pt-2 pb-2.5">
        <b className="text-base">Уведомления</b>
        <button type="button" onClick={() => setUnread([])} className="text-[12.5px] text-[var(--link)]">
          Прочитать все
        </button>
      </div>
      <div className="mx-1.5 mb-1 flex gap-1 rounded-full bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)] p-[3px]">
        {[false, true].map((only) => (
          <button
            key={String(only)}
            type="button"
            onClick={() => setOnlyUnread(only)}
            className={cn(
              "flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] text-muted-foreground",
              onlyUnread === only && "bg-card font-semibold text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
            )}
          >
            {only ? "Непрочитанные" : "Все"}
            {only && unread.length > 0 && (
              <i className="rounded-full bg-[#ff3b30] px-1.5 text-[10.5px] leading-4 font-bold text-white not-italic">
                {unread.length}
              </i>
            )}
          </button>
        ))}
      </div>
      {(["Сегодня", "Вчера"] as const).map((day) => {
        const items = list.filter((n) => n.day === day)
        if (!items.length) return null
        return (
          <div key={day}>
            {!onlyUnread && <GroupTitle className="mt-2">{day}</GroupTitle>}
            {items.map((n) => (
              <Row key={n.id} href={n.href} icon={n.icon} title={n.title} text={n.text} unread={unread.includes(n.id)} />
            ))}
          </div>
        )
      })}
      {list.length === 0 && <p className="px-2.5 py-6 text-center text-[13px] text-muted-foreground">Новых уведомлений нет</p>}
      <div className="mt-1 flex justify-between border-t border-[var(--dd-line)] px-2.5 pt-2.5 pb-1 text-[13px] text-[var(--link)]">
        <Popover.Close asChild>
          <Link href="/tasks">Все уведомления →</Link>
        </Popover.Close>
        <Popover.Close asChild>
          <Link href="/profile#ntf">Настроить</Link>
        </Popover.Close>
      </div>
    </HeaderPopover>
  )
}

/* ---------- Настройки ---------- */

/** Переключатели хранятся в localStorage (`kcrm:*`); compact / noanim — классы на <html>. */
const PREFS = [
  { key: "compact", title: "Компактные таблицы", html: true, def: false },
  { key: "ntask", title: "Уведомления о задачах", html: false, def: true },
  { key: "sound", title: "Звук уведомлений", html: false, def: false },
  { key: "noanim", title: "Без анимаций", html: true, def: false },
] as const
type PrefKey = (typeof PREFS)[number]["key"]

function readPref(key: PrefKey, def: boolean) {
  try {
    const v = localStorage.getItem(`kcrm:${key}`)
    return v === null ? def : v === "1"
  } catch {
    return def
  }
}

/** Применяет сохранённые compact / noanim при загрузке. */
export function usePrefsOnHtml() {
  useEffect(() => {
    for (const p of PREFS) if (p.html) document.documentElement.classList.toggle(p.key, readPref(p.key, p.def))
  }, [])
}

export function SettingsPopover({ trigger }: { trigger: React.ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean> | null>(null)

  return (
    <Popover.Root onOpenChange={(o) => o && setPrefs(Object.fromEntries(PREFS.map((p) => [p.key, readPref(p.key, p.def)])) as Record<PrefKey, boolean>)}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={10} collisionPadding={12} className={panel}>
          <GroupTitle className="mt-2">Настройки</GroupTitle>
          <div className="flex items-center justify-between rounded-[14px] p-2.5 text-[13.5px]">
            Тема
            <div className="flex rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] p-[3px]">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={cn(
                    "h-7 rounded-full px-3 text-[12.5px] text-muted-foreground",
                    resolvedTheme === t && "bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                  )}
                >
                  {t === "light" ? "Светлая" : "Тёмная"}
                </button>
              ))}
            </div>
          </div>
          {PREFS.map((p) => {
            const on = prefs?.[p.key] ?? p.def
            return (
              <label key={p.key} className="flex cursor-pointer items-center justify-between rounded-[14px] p-2.5 text-[13.5px]">
                {p.title}
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => {
                    const next = !on
                    setPrefs((s) => ({ ...(s as Record<PrefKey, boolean>), [p.key]: next }))
                    try {
                      localStorage.setItem(`kcrm:${p.key}`, next ? "1" : "0")
                    } catch {}
                    if (p.html) document.documentElement.classList.toggle(p.key, next)
                  }}
                  className={cn(
                    "relative h-[26px] w-[42px] flex-none rounded-full bg-[color-mix(in_srgb,var(--foreground)_18%,transparent)] transition-colors duration-200 after:absolute after:top-[3px] after:left-[3px] after:size-5 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.3)] after:transition-transform after:duration-250 after:ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                    on && "bg-[#34c759] after:translate-x-4"
                  )}
                />
              </label>
            )
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/* ---------- Профиль ---------- */

/** Аватар пользователя: фото из профиля или инициалы. */
export function Avatar({ className }: { className?: string }) {
  const photo = useProfile("avatar")
  return (
    <span
      className={cn(
        "grid size-[38px] flex-none place-items-center rounded-full bg-[linear-gradient(135deg,#085eff,#001a9f)] bg-cover bg-center text-sm font-bold text-white",
        className
      )}
      style={photo ? { backgroundImage: `url(${photo})` } : undefined}
    >
      {!photo && CURRENT_USER.initials}
    </span>
  )
}

export function UserPopover({ trigger }: { trigger: React.ReactNode }) {
  const u = CURRENT_USER
  return (
    <HeaderPopover trigger={trigger}>
      <div className="flex items-center gap-3 p-2.5">
        <Avatar className="size-11 text-base" />
        <div>
          <b className="block text-[15px]">{u.name}</b>
          <span className="text-[12.5px] text-muted-foreground">
            {u.login} · {u.department}
          </span>
        </div>
      </div>
      <div className="mx-1 my-1.5 h-px bg-[var(--dd-line)]" />
      <Row href="/profile" icon={UserRound} title="Мой профиль" text="Контакты, подпись" />
      <Row href="/profile#photo" icon={ImageIcon} title="Фото и фон" text="Сменить аватар и обложку" />
      <Row href="/profile#sec" icon={ShieldCheck} title="Безопасность" text="Пароль и сеансы" />
      <Row href="/tasks" icon={ListTodo} title="Мои задачи" text="4 актуальные" />
      <Popover.Close asChild>
        <a
          href="https://docs.kaztranscom.kz/storage/goto/kcrm"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-[14px] p-2.5 text-[13.5px] hover:bg-[var(--mg-on)]"
        >
          <Thumb icon={BookOpen} className="size-[34px] [&_svg]:size-4" />
          <span>
            <b className="font-semibold">Инструкции</b>
            <span className="mt-0.5 block text-xs text-muted-foreground">docs.kaztranscom.kz</span>
          </span>
        </a>
      </Popover.Close>
      <div className="mx-1 my-1.5 h-px bg-[var(--dd-line)]" />
      {/* TODO(§7): выход — завершение сеанса SSO */}
      <Row href="/login" icon={LogOut} title="Выйти" text="Завершить сеанс" danger />
    </HeaderPopover>
  )
}
