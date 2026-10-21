"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, Briefcase, ChartLine, CircleDollarSign, FileCheck, FilePlus, FileText, Sparkles, Users, type LucideIcon } from "lucide-react"
import { PeriodSwitch } from "@/components/shared/period-switch"
import { CURRENT_USER } from "@/lib/current-user"
import {
  ACTIVITY,
  CONTRACTS,
  OFFERS,
  SUMS,
  delta,
  fmt,
  money,
  periodLabel,
  prevLabel,
  prevShort,
  range,
  signed,
  sumOf,
  topManagers,
  yearAgo,
  type Period,
} from "@/lib/home-stats"
import { cn } from "@/lib/utils"
import { ACCOUNTS_TOTAL, AccountsDonut, DealsFeed, ManagersList, RecentOffersTable } from "./blocks"
import { ContractsChart, OffersChart } from "./charts"
import { Kpi } from "@/components/shared/kpi"
import { Card, CardHead, DeltaPill, Legend } from "@/components/shared/ui"

const QUICK: { href: string; title: string; icon: LucideIcon; primary?: boolean }[] = [
  { href: "/counterparties", title: "Контрагенты", icon: Users, primary: true },
  { href: "/deals", title: "Сделки", icon: Briefcase },
  { href: "/offer-builder", title: "Новое КП", icon: FilePlus },
  { href: "/tech-requests", title: "Запросы ТВ и ТР", icon: FileCheck },
  { href: "/sales-plan", title: "План продаж", icon: ChartLine },
]

/** Главная (макет 02): сводка со сравнением периодов. Данные — демо из копии базы (src/data/home-demo.json). */
export function HomeDashboard() {
  const [period, setPeriod] = useState<Period>("m")
  const data = useMemo(() => {
    const r = range(period)
    const rp = range(period, 1)
    return { r, rp, label: periodLabel(period, r), managers: topManagers(r, rp) }
  }, [period])
  const { r, rp, label } = data

  const offers = sumOf(OFFERS, r)
  const contracts = sumOf(CONTRACTS, r)
  const dOffers = delta(offers, sumOf(OFFERS, rp))
  const dContracts = delta(contracts, sumOf(CONTRACTS, rp))
  const offersYearAgo = sumOf(OFFERS, r.map(yearAgo))
  const contractsPrev = sumOf(CONTRACTS, rp)

  return (
    <div className="mx-auto w-full max-w-[1760px]">
      <section className="flex flex-wrap items-end justify-between gap-5 px-[34px] pt-[26px] pb-[22px] max-sm:px-4 max-sm:pt-3.5 max-sm:pb-4">
        <div className="rise">
          <Greeting />
          <p className="mt-3.5 max-w-[680px] text-base leading-[1.6] text-muted-foreground">
            За {label} выставлено {fmt(offers)} КП на {money(sumOf(SUMS, r))} ₸ и подписано {fmt(contracts)} договоров. К{" "}
            {prevShort(period)}: КП {signed(dOffers)}, договоры {signed(dContracts)}.
          </p>
          <div className="mt-[26px] flex flex-wrap gap-2.5">
            {QUICK.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full border py-0 pr-5 pl-1.5 text-sm font-semibold transition-[background-color,filter] max-sm:h-10 max-sm:text-[13px]",
                  q.primary
                    ? "border-[#085eff] bg-[#085eff] text-white shadow-[0_8px_24px_rgba(8,94,255,0.32)] hover:brightness-110"
                    : "border-[rgba(15,23,42,0.1)] bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:bg-[var(--soft)] dark:border-white/8 dark:bg-white/5 dark:text-[#d5d8de] dark:shadow-none"
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full max-sm:size-7",
                    q.primary ? "bg-white/20" : "bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
                  )}
                >
                  <q.icon className="size-4" />
                </span>
                {q.title}
              </Link>
            ))}
          </div>
        </div>
        <PeriodSwitch value={period} onChange={setPeriod} />
      </section>

      <div className="grid grid-cols-4 gap-[18px] px-[34px] max-[1240px]:grid-cols-2 max-sm:gap-2.5 max-sm:px-3">
        <Kpi i={0} title="КП выставлено" icon={FileText} value={fmt(offers)} d={dOffers} caption={`${prevLabel(period)} · было ${fmt(sumOf(OFFERS, rp))}`} />
        <Kpi
          i={1}
          title="Сумма КП"
          icon={CircleDollarSign}
          value={
            <>
              {money(sumOf(SUMS, r))}
              <small className="ml-1 text-base font-medium text-muted-foreground">₸</small>
            </>
          }
          d={delta(sumOf(SUMS, r), sumOf(SUMS, rp))}
          caption={`${prevLabel(period)} · было ${money(sumOf(SUMS, rp))} ₸`}
        />
        <Kpi i={2} title="Новые договоры" icon={FileCheck} value={fmt(contracts)} d={dContracts} caption={`${prevLabel(period)} · было ${fmt(contractsPrev)}`} />
        <Kpi
          i={3}
          title="Активность в ленте"
          icon={Activity}
          value={fmt(sumOf(ACTIVITY, r))}
          d={delta(sumOf(ACTIVITY, r), sumOf(ACTIVITY, rp))}
          caption={`${prevLabel(period)} · было ${fmt(sumOf(ACTIVITY, rp))}`}
        />
      </div>

      <div className="grid grid-cols-12 gap-[18px] px-[34px] pt-[22px] pb-10 max-sm:gap-3 max-sm:px-3 max-sm:pt-4 max-sm:pb-7">
        <Card className="col-span-12 min-[1241px]:col-span-8" style={{ animationDelay: "120ms" }}>
          <CardHead
            title="Коммерческие предложения"
            sub={
              <>
                За {label}: <b className="text-foreground">{fmt(offers)}</b> КП ·{" "}
                <DeltaPill d={delta(offers, offersYearAgo)} /> к тому же периоду год назад
              </>
            }
          >
            <Legend
              items={[
                { label: "Выбранный период", color: "#085eff" },
                { label: "Остальные месяцы", color: "color-mix(in srgb, #085eff 30%, transparent)" },
                { label: "Год назад", dashed: true },
              ]}
            />
          </CardHead>
          <OffersChart selected={r} />
        </Card>

        <Card className="col-span-12 min-[1241px]:col-span-4" style={{ animationDelay: "160ms" }}>
          <CardHead title="Лицевые счета по статусам" sub={`Статус в биллинге · всего ${fmt(ACCOUNTS_TOTAL)}`} />
          <AccountsDonut />
        </Card>

        <Card className="col-span-12 min-[1241px]:col-span-5" style={{ animationDelay: "200ms" }}>
          <CardHead title="Лучшие менеджеры" sub={`По числу КП за ${label}`} more={{ href: "/sales-plan", label: "Все →" }} />
          <ManagersList items={data.managers} />
        </Card>

        <Card className="col-span-12 min-[1241px]:col-span-7" style={{ animationDelay: "240ms" }}>
          <CardHead title="Последние КП" sub="Свежие коммерческие предложения" more={{ href: "/offers", label: "Открыть реестр →" }} />
          <RecentOffersTable />
        </Card>

        <Card className="flex flex-col col-span-12 min-[1241px]:col-span-6" style={{ animationDelay: "280ms" }}>
          <CardHead title="Договоры" sub={`Подписано за ${label}: ${contracts} · было ${contractsPrev}`}>
            <div className="flex items-center gap-3.5">
              <Legend items={[{ label: "Подписано", color: "#34c759" }, { label: "Год назад", dashed: true }]} />
              <DeltaPill d={dContracts} />
            </div>
          </CardHead>
          <ContractsChart selected={r} />
        </Card>

        <Card className="col-span-12 min-[1241px]:col-span-6" style={{ animationDelay: "320ms" }}>
          <CardHead title="Обращения и сделки" sub="Последние события по клиентам" more={{ href: "/deals", label: "Воронка →" }} />
          <DealsFeed />
        </Card>
      </div>

      <footer className="flex flex-wrap justify-between gap-3 px-[34px] pt-1 pb-[30px] text-[12.5px] text-[var(--faint)] max-sm:px-4 max-sm:pb-6">
        <span>© АО «QMobile» · kCRM · данные из копии базы kCRM (2016–2018), названия компаний и ФИО — примеры</span>
        <span className="flex items-center gap-2">
          <i className="size-2 rounded-full bg-[#34c759]" />
          Служба работает
        </span>
      </footer>
    </div>
  )
}

/** Дата и приветствие по времени Астаны. Только на клиенте — иначе расходится с серверным рендером. */
function Greeting() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const t = setInterval(tick, 30_000)
    return () => clearInterval(t)
  }, [])

  const tz = "Asia/Almaty"
  const h = now ? +new Intl.DateTimeFormat("ru-RU", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now) : 12
  const hello = h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер"
  const when = now
    ? new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: tz }).format(now)
    : ""

  return (
    <>
      <p className="flex min-h-5 items-center gap-2 text-sm text-[#085eff] dark:text-[#9db8ff]">
        <Sparkles className="size-4" />
        <span className="first-letter:uppercase">{when && `${when} · Астана`}</span>
      </p>
      <h1 className={cn("mt-3 text-[44px] leading-[1.1] font-medium tracking-[-0.025em] transition-opacity max-sm:text-[32px]", !now && "opacity-0")}>
        {hello}, {CURRENT_USER.name}
      </h1>
    </>
  )
}
