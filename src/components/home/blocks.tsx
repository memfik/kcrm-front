import Link from "next/link"
import { Briefcase, MessageSquare } from "lucide-react"
import {
  ACCOUNTS,
  ACCOUNT_STATUS,
  FEED,
  RECENT_OFFERS,
  delta,
  fmt,
  initials,
  money,
  type OfferStatus,
  type topManagers,
} from "@/lib/home-stats"
import { cn } from "@/lib/utils"
import { DeltaPill } from "@/components/shared/ui"

/* ---------- Лицевые счета ---------- */

export const ACCOUNTS_TOTAL = ACCOUNTS.reduce((a, b) => a + b.count, 0)

/** Дуги кольца — данные статичные, считаем один раз. Активные доминируют — доли по корню, чтобы были видны и малые. */
const ARCS = (() => {
  const w = ACCOUNTS.map((x) => Math.sqrt(x.count))
  const wt = w.reduce((a, b) => a + b, 0)
  const R = 62, r = 44
  const p = (a: number, rr: number) => `${75 + Math.cos(a) * rr} ${75 + Math.sin(a) * rr}`
  let a0 = -Math.PI / 2
  return ACCOUNTS.map((x, i) => {
    const a1 = a0 + (w[i] / wt) * Math.PI * 2 - 0.02
    const lg = a1 - a0 > Math.PI ? 1 : 0
    const d = `M${p(a0, R)}A${R} ${R} 0 ${lg} 1 ${p(a1, R)}L${p(a1, r)}A${r} ${r} 0 ${lg} 0 ${p(a0, r)}Z`
    a0 = a1 + 0.02
    return { d, ...x }
  })
})()
const FUNNEL = [1, 2, 3].map((s) => ({ status: s, count: ACCOUNTS.find((x) => x.status === s)?.count ?? 0 }))
const FUNNEL_MAX = Math.max(...FUNNEL.map((x) => x.count))

/** Кольцо по статусам биллинга + воронка «от первого контакта до активного». */
export function AccountsDonut() {
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-[18px]">
        <svg viewBox="0 0 150 150" className="size-[150px] flex-none">
          {ARCS.map((a) => (
            <path key={a.status} d={a.d} fill={ACCOUNT_STATUS[a.status].color}>
              <title>{`${ACCOUNT_STATUS[a.status].name}: ${fmt(a.count)}`}</title>
            </path>
          ))}
          <text x={75} y={74} textAnchor="middle" className="fill-foreground text-[17px] font-bold">
            {fmt(ACCOUNTS_TOTAL)}
          </text>
          <text x={75} y={92} textAnchor="middle" className="fill-muted-foreground text-[10.5px]">
            счетов
          </text>
        </svg>
        <div className="flex min-w-[150px] flex-1 flex-col gap-[9px]">
          {ACCOUNTS.slice(0, 5).map((x) => (
            <div key={x.status} className="flex items-center gap-2 text-[13px]">
              <i className="size-[9px] flex-none rounded-[3px]" style={{ background: ACCOUNT_STATUS[x.status].color }} />
              <span className="flex-1 text-muted-foreground">{ACCOUNT_STATUS[x.status].name}</span>
              <b className="font-semibold tabular-nums">{fmt(x.count)}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-[18px] flex flex-col gap-1.5">
        <div className="mb-1 text-[13px] text-muted-foreground">Воронка: от первого контакта до активного</div>
        {FUNNEL.map((x) => (
          <div key={x.status} className="flex items-center gap-2.5 text-[12.5px]">
            <span className="w-24 text-muted-foreground">{ACCOUNT_STATUS[x.status].name}</span>
            <div className="relative h-[22px] flex-1 overflow-hidden rounded-lg bg-[var(--soft)]">
              <i
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{ width: `${Math.max(4, Math.sqrt(x.count / FUNNEL_MAX) * 100)}%`, background: ACCOUNT_STATUS[x.status].color }}
              />
            </div>
            <b className="w-[54px] text-right tabular-nums">{fmt(x.count)}</b>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- Лучшие менеджеры ---------- */

const AVATAR_COLORS = ["#085eff", "#34c759", "#ff9f0a", "#af52de", "#ff375f", "#5ac8fa", "#ffcc00", "#30b0c7"]

export function ManagersList({ items }: { items: ReturnType<typeof topManagers> }) {
  if (!items.length) return <div className="mt-4 text-[13px] text-muted-foreground">Нет данных за период</div>
  const mx = items[0].count
  return (
    <div className="mt-4 flex flex-col gap-3">
      {items.map((m, i) => (
        <div key={m.id} className="grid grid-cols-[34px_1fr_auto] items-center gap-3">
          <span className="grid size-[34px] place-items-center rounded-full text-xs font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
            {initials(m.name)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold">{m.name}</div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--soft)]">
              <i className="block h-full rounded-full bg-[linear-gradient(90deg,#085eff,#34c759)]" style={{ width: `${(m.count / mx) * 100}%` }} />
            </div>
          </div>
          <div className="text-right text-[13px]">
            <b className="block text-[15px] tabular-nums">{m.count}</b>
            <DeltaPill d={delta(m.count, m.prev)} label={m.prev ? undefined : "новый"} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Последние КП ---------- */

const STATUS: Record<OfferStatus, { label: string; cls: string }> = {
  ok: { label: "Согласовано", cls: "bg-[color-mix(in_srgb,var(--trend-up)_14%,transparent)] text-[var(--trend-up)]" },
  wait: { label: "На согласовании", cls: "bg-[color-mix(in_srgb,#ff9f0a_16%,transparent)] text-[#d98200]" },
  off: { label: "Черновик", cls: "bg-[var(--soft)] text-muted-foreground" },
}

export function RecentOffersTable() {
  const th = "border-b border-border px-2.5 py-2 text-left text-[11.5px] font-semibold tracking-[0.04em] text-[var(--faint)] uppercase"
  const td = "border-b border-border px-2.5 py-[11px] whitespace-nowrap group-last:border-0"
  return (
    <div className="overflow-x-auto">
      <table className="mt-3 w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className={th}>№</th>
            <th className={th}>Контрагент</th>
            <th className={th}>Менеджер</th>
            <th className={th}>Дата</th>
            <th className={cn(th, "text-right")}>Сумма</th>
            <th className={th}>Статус</th>
          </tr>
        </thead>
        <tbody>
          {RECENT_OFFERS.map((o) => (
            <tr key={o.id} className="group transition-colors hover:bg-[var(--soft)]">
              <td className={cn(td, "text-xs text-muted-foreground")}>
                <Link href={`/offers/${o.id}`}>№ {o.id}</Link>
              </td>
              <td className={td}>
                <div className="font-semibold">{o.company}</div>
                <div className="text-xs text-muted-foreground">ID {o.companyId}</div>
              </td>
              <td className={td}>{o.manager}</td>
              <td className={td}>{o.date}</td>
              <td className={cn(td, "text-right font-semibold tabular-nums")}>{o.sum ? `${money(o.sum)} ₸` : "—"}</td>
              <td className={td}>
                <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold", STATUS[o.status].cls)}>
                  <i className="size-1.5 rounded-full bg-current" />
                  {STATUS[o.status].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Обращения и сделки ---------- */

export function DealsFeed() {
  return (
    <div className="mt-2.5 flex flex-col">
      {FEED.map((f) => (
        <Link
          key={f.id}
          href={`/deals/${f.id}`}
          className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-border py-2.5 last:border-0"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--soft)] text-[var(--accent-link)]">
            {f.isRequest ? <MessageSquare className="size-[18px]" /> : <Briefcase className="size-[18px]" />}
          </span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold">{f.title}</div>
            <div className="truncate text-[12.5px] text-muted-foreground">{f.text}</div>
          </div>
          <span className="text-xs text-[var(--faint)]">{f.date}</span>
        </Link>
      ))}
    </div>
  )
}
