"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ChartLine, CircleX, Eye, FileText, LayoutGrid, List, Pencil, Search, Trash2 } from "lucide-react"
import { Kpi } from "@/components/shared/kpi"
import { PeriodSwitch } from "@/components/shared/period-switch"
import { toast } from "@/components/shared/toast"
import { applyQuery, emptyQuery, exportCsv, type Query } from "@/lib/list/query"
import { useRows, viewStore } from "@/lib/list/store"
import type { Action, ListConfig, Row } from "@/lib/list/types"
import { delta, fmt, prevLabel, range, type Period } from "@/lib/period"
import { cn } from "@/lib/utils"
import { recordHref, removeLabel, RowMenu, useDeleteDialog } from "./actions"
import { ActiveChips, FilterChip, MoreButton, MoreFilters } from "./filters"
import { Btn, roundAction } from "./ui"

const PAGE_SIZE = 20

type View = { q: Query; page: number; period: Period }

/** Список раздела по конфигу (макеты 03…47): шапка с KPI, вкладки, поиск, фильтры, таблица / карточки. */
export function ListPage<T extends Row>({ cfg }: { cfg: ListConfig<T> }) {
  const router = useRouter()
  const rows = useRows(cfg)
  const saved = viewStore.get<View>(cfg.key)
  const [q, setQState] = useState<Query>(saved?.q ?? emptyQuery(cfg))
  const [page, setPage] = useState(saved?.page ?? 0)
  const [period, setPeriod] = useState<Period>(saved?.period ?? "m")
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [more, setMore] = useState(false)
  const mode = useViewMode()
  const [tabView, setTabView] = useSectionView(cfg.key, !!cfg.analytics)
  const del = useDeleteDialog(cfg)

  const setQ = (next: Query) => {
    setQState(next)
    setPage(0)
  }
  useEffect(() => viewStore.set<View>(cfg.key, { q, page, period }), [cfg.key, q, page, period])

  // Поиск — отложенно: ввод не ждёт пересчёта 2,5 тыс. строк.
  const search = useDeferredValue(q.q)
  const list = useMemo(() => applyQuery(cfg, rows, { ...q, q: search }), [cfg, rows, q, search])
  useEffect(() => viewStore.setOrder(cfg.key, list.map((x) => x.id)), [cfg.key, list])

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const pg = Math.min(page, pages - 1)
  const view = list.slice(pg * PAGE_SIZE, pg * PAGE_SIZE + PAGE_SIZE)

  const tabCounts = useMemo(() => Object.fromEntries((cfg.tabs ?? []).map((t) => [t.k, rows.filter(t.f).length])), [cfg, rows])
  const r = range(period, 0, cfg.anchor)
  const rp = range(period, 1, cfg.anchor)
  const kpis = useMemo(() => cfg.kpis(range(period, 0, cfg.anchor), range(period, 1, cfg.anchor)), [cfg, period])

  const open = (x: T) => router.push(recordHref(cfg.key, x.id))
  const toggle = (id: number) => {
    const s = new Set(checked)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setChecked(s)
  }
  const allOnPage = view.length > 0 && view.every((x) => checked.has(x.id))
  const action = (a: Action) => {
    if (a.onClick === "export") {
      const target = checked.size ? rows.filter((x) => checked.has(x.id)) : list
      exportCsv(cfg, target)
      toast(`Выгружено ${target.length} записей в Excel (CSV)`)
    }
    // TODO: импорт из Excel/CSV — разбор и проверка строк на сервере
    if (a.onClick === "import") toast("Импорт из файла — после подключения API")
  }
  const Icon = cfg.icon

  return (
    <div className="relative isolate mx-auto w-full max-w-[1760px]">
      {/* фон раздела, как в макете */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-90px] -z-10 h-[520px] bg-[radial-gradient(900px_420px_at_75%_10%,rgba(8,94,255,0.16),transparent_70%),radial-gradient(700px_360px_at_10%_0%,rgba(0,26,159,0.22),transparent_70%)] [mask-image:linear-gradient(180deg,#000_60%,transparent)]"
      />

      <section className="flex flex-wrap items-center justify-between gap-5 px-[34px] pt-1.5 pb-4 max-sm:px-4 max-sm:pt-1 max-sm:pb-3">
        <div className="rise min-w-0">
          <p className="flex items-center gap-2 text-sm text-[#085eff] dark:text-[#9db8ff]">
            <Icon className="size-4" />
            {cfg.crumb}
          </p>
          <h1 className="mt-1.5 text-[34px] leading-[1.1] font-medium tracking-[-0.025em] max-sm:text-[26px]">
            {cfg.title}
            {cfg.badge && <PageBadge kind={cfg.badge} />}
          </h1>
          {cfg.req && (
            <p className="mt-2 flex max-w-[900px] items-start gap-2 text-[12.5px] text-muted-foreground">
              <FileText className="mt-px size-[15px] flex-none" />
              {cfg.req}
            </p>
          )}
          <p className="mt-1.5 max-w-[760px] text-sm leading-[1.6] text-muted-foreground">{cfg.sub(r, rp, period)}</p>
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            {cfg.buttons.map((b, i) => (
              <QuickButton key={b.label} a={b} primary={i === 0} onClick={() => action(b)} />
            ))}
          </div>
        </div>
        <PeriodSwitch value={period} onChange={setPeriod} />
      </section>

      <div className="grid grid-cols-4 gap-[18px] px-[34px] max-[1240px]:grid-cols-2 max-sm:gap-2.5 max-sm:px-3">
        {kpis.map((k, i) => {
          const f = k.f ?? fmt
          return (
            <Kpi
              key={k.t}
              i={i}
              compact
              title={k.t}
              icon={k.icon}
              value={f(k.c)}
              d={k.p !== undefined ? delta(k.c, k.p, true) : undefined}
              caption={k.p !== undefined ? `${prevLabel(period, cfg.anchor)} · было ${f(k.p)}` : k.note}
            />
          )
        })}
      </div>

      <div className="px-[34px] pb-10 max-sm:px-3 max-sm:pb-7">
        <div className="mt-[18px] flex flex-wrap items-center gap-2.5 max-sm:gap-2">
          {cfg.analytics && (
            <div className="flex gap-1 rounded-full border border-border bg-card p-1">
              {(
                [
                  ["list", "Список", List],
                  ["ana", "Аналитика", ChartLine],
                ] as const
              ).map(([k, t, I]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTabView(k)}
                  className={cn(
                    "flex h-[38px] cursor-pointer items-center gap-2 rounded-full px-4 text-sm text-muted-foreground max-sm:h-[34px] max-sm:px-3 max-sm:text-[13px]",
                    tabView === k && "bg-foreground font-semibold text-background"
                  )}
                >
                  <I className="size-4" />
                  {t}
                </button>
              ))}
            </div>
          )}
          {cfg.tabs && tabView === "list" && (
            <div className="flex w-max max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-[var(--panel-shadow)] [scrollbar-width:none]">
              {cfg.tabs.map((t) => {
                const on = q.tab === t.k
                return (
                  <button
                    key={t.k}
                    type="button"
                    onClick={() => setQ({ ...q, tab: t.k })}
                    className={cn(
                      "flex h-9 flex-none cursor-pointer items-center gap-[7px] rounded-full px-[15px] text-[13.5px] text-muted-foreground",
                      on && "bg-foreground font-semibold text-background"
                    )}
                  >
                    {t.t}
                    <span className={cn("rounded-full bg-[var(--soft)] px-[7px] py-px text-[11px] font-bold tabular-nums", on && "bg-background/20 text-inherit")}>
                      {fmt(tabCounts[t.k] ?? 0)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {cfg.analytics && tabView === "ana" && (
          <section className="rise mt-3 rounded-3xl border border-border bg-card px-6 py-5 shadow-[var(--panel-shadow)] max-sm:rounded-[20px] max-sm:px-4">
            {cfg.analytics.render({ r, p: period })}
          </section>
        )}

        <section hidden={tabView !== "list"} className="mt-3 min-w-0 rounded-3xl border border-border bg-card px-3 pt-4 pb-2 shadow-[var(--panel-shadow)] max-sm:rounded-[20px] max-sm:px-2 max-sm:pt-3 max-sm:pb-1.5">
          <div className="mx-1.5 mb-2 flex flex-wrap items-center gap-2.5 max-sm:mx-1 max-sm:grid max-sm:grid-cols-[1fr_auto_auto] max-sm:gap-2">
            <label className="flex h-11 min-w-[200px] flex-[0_1_320px] items-center gap-2.5 rounded-full border border-border bg-[var(--soft)] px-4 max-sm:col-span-full max-sm:h-[42px] max-sm:min-w-0 dark:bg-white/4">
              <Search className="size-[18px] text-muted-foreground" />
              <input
                value={q.q}
                onChange={(e) => setQ({ ...q, q: e.target.value })}
                placeholder={cfg.search}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <div className="contents max-sm:col-span-full max-sm:flex max-sm:gap-1.5 max-sm:overflow-x-auto max-sm:pb-0.5 max-sm:[scrollbar-width:none]">
              {(cfg.filters ?? []).map((f) => (
                <FilterChip key={f.k} filter={f} value={q.f[f.k] ?? []} onChange={(v) => setQ({ ...q, f: { ...q.f, [f.k]: v } })} />
              ))}
            </div>
            <MoreButton q={q} onClick={() => setMore(true)} />
            <span className="flex-1 max-sm:hidden" />
            <Btn danger disabled={!checked.size} onClick={() => del.ask(rows.filter((x) => checked.has(x.id)), () => setChecked(new Set()))} className="max-sm:h-[38px] max-sm:px-3">
              {cfg.archive ? <CircleX /> : <Trash2 />}
              <span className="max-sm:hidden">
                {removeLabel(cfg)} (<b className="font-semibold tabular-nums">{checked.size}</b>)
              </span>
              <span className="sm:hidden">{checked.size || ""}</span>
            </Btn>
            <ViewSwitch mode={mode.value} onChange={mode.set} />
          </div>

          <ActiveChips cfg={cfg} q={q} setQ={setQ} />

          {mode.value === "r" ? (
            <div className="max-h-[calc(100vh-120px)] overflow-auto max-sm:max-h-none">
              <table className="ltbl w-full text-[13.5px] max-sm:text-[13px]">
                <thead>
                  <tr>
                    <th className="sl w-[44px] max-sm:static">
                      <Check on={allOnPage} label="Выбрать страницу" onClick={() => {
                        const s = new Set(checked)
                        view.forEach((x) => (allOnPage ? s.delete(x.id) : s.add(x.id)))
                        setChecked(s)
                      }} />
                    </th>
                    <th className="sl left-[44px] w-[40px] max-sm:static">№</th>
                    {cfg.cols.map((c, i) => {
                      const sorted = q.sort[0] === c.k
                      return (
                        <th
                          key={c.k}
                          onClick={() => !c.noSort && setQ({ ...q, sort: sorted ? [c.k, q.sort[1] === 1 ? -1 : 1] : [c.k, c.num || c.date ? -1 : 1] })}
                          className={cn("group cursor-pointer", c.num && "text-right", i === 0 && "sl left-[84px] max-sm:static")}
                        >
                          {c.t}
                          {!c.noSort && (
                            <span className={cn("ml-1 opacity-0 transition-opacity group-hover:opacity-100", sorted && "text-[#085eff] opacity-100")}>
                              {sorted ? (q.sort[1] > 0 ? "↑" : "↓") : "↕"}
                            </span>
                          )}
                        </th>
                      )
                    })}
                    <th className="sr text-right max-sm:static">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {view.map((x, i) => (
                    <tr key={x.id} onClick={() => open(x)}>
                      <td className="sl max-sm:static" onClick={(e) => e.stopPropagation()}>
                        <Check on={checked.has(x.id)} label="Выбрать" onClick={() => toggle(x.id)} />
                      </td>
                      <td className="sl left-[44px] text-muted-foreground tabular-nums max-sm:static">{pg * PAGE_SIZE + i + 1}</td>
                      {cfg.cols.map((c, ci) => (
                        <td key={c.k} className={cn(c.num && "text-right font-semibold tabular-nums", ci === 0 && "sl left-[84px] max-sm:static")}>
                          {c.render(x)}
                        </td>
                      ))}
                      <td className="sr max-sm:static" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <Link href={recordHref(cfg.key, x.id)} className={roundAction} title="Открыть">
                            <Eye />
                          </Link>
                          <Link href={`${recordHref(cfg.key, x.id)}/edit`} className={roundAction} title="Изменить">
                            <Pencil />
                          </Link>
                          <RowMenu cfg={cfg} row={x} onDelete={() => del.ask([x])} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!view.length && (
                    <tr>
                      <td colSpan={cfg.cols.length + 3} className="!cursor-default py-10 text-center text-muted-foreground">
                        Ничего не найдено — измените вкладку или фильтры
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <Cards cfg={cfg} rows={view} all={rows} checked={checked} toggle={toggle} onDelete={(x) => del.ask([x])} />
          )}

          <Pager total={list.length} page={pg} pages={pages} onPage={(p) => {
            setPage(p)
            scrollTo({ top: 0, behavior: "smooth" })
          }} />
        </section>
      </div>

      <MoreFilters cfg={cfg} rows={rows} q={q} open={more} onOpenChange={setMore} onApply={(next) => {
        setQ(next)
        toast(`Фильтры применены · ${applyQuery(cfg, rows, next).length} записей`)
      }} />
      {del.dialog}
    </div>
  )
}

function PageBadge({ kind }: { kind: "new" | "upd" }) {
  return (
    <span
      className={cn(
        "ml-3.5 inline-flex h-7 -translate-y-1 items-center rounded-full px-3 align-middle text-[13px] font-bold tracking-[0.02em] max-sm:ml-2 max-sm:h-6 max-sm:text-[11.5px]",
        kind === "new" ? "bg-[rgba(52,199,89,0.16)] text-[#22a447] dark:text-[#4cd964]" : "bg-[rgba(8,94,255,0.14)] text-[#085eff] dark:text-[#6b9dff]"
      )}
    >
      {kind === "new" ? "Новое" : "Доработано"}
    </span>
  )
}

function QuickButton({ a, primary, onClick }: { a: Action; primary: boolean; onClick: () => void }) {
  const cls = cn(
    "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border py-0 pr-5 pl-1.5 text-sm font-semibold transition-[background-color,filter] max-sm:h-10 max-sm:text-[13px]",
    primary
      ? "border-[#085eff] bg-[#085eff] text-white shadow-[0_8px_24px_rgba(8,94,255,0.32)] hover:brightness-110"
      : "border-[rgba(15,23,42,0.1)] bg-white text-[#0f172a] shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:bg-[var(--soft)] dark:border-white/8 dark:bg-white/5 dark:text-[#d5d8de] dark:shadow-none"
  )
  const inner = (
    <>
      <span className={cn("grid size-8 place-items-center rounded-full max-sm:size-7", primary ? "bg-white/20" : "bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]")}>
        <a.icon className="size-4" />
      </span>
      {a.label}
    </>
  )
  return a.href ? (
    <Link href={a.href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

function Check({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "grid size-[18px] cursor-pointer place-items-center rounded-md border-[1.5px] border-[color-mix(in_srgb,var(--foreground)_25%,transparent)] bg-card",
        on && "border-[#085eff] bg-[#085eff] after:h-1 after:w-2 after:translate-x-px after:-translate-y-px after:-rotate-45 after:border-b-2 after:border-l-2 after:border-white"
      )}
    />
  )
}

/** Список / карточки; на телефоне по умолчанию карточки. Выбор помнится. */
function useViewMode() {
  const [value, setValue] = useState<"r" | "c">("r")
  useEffect(() => {
    let v: string | null = null
    try {
      v = localStorage.getItem("kcrm:view")
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage доступен только после монтирования
    setValue(v === "c" || v === "r" ? v : innerWidth <= 640 ? "c" : "r")
  }, [])
  const set = (v: "r" | "c") => {
    setValue(v)
    try {
      localStorage.setItem("kcrm:view", v)
    } catch {}
  }
  return { value, set }
}

/** «Список / Аналитика» у раздела — помнится для каждого раздела. */
function useSectionView(key: string, has: boolean) {
  const [v, setV] = useState<"list" | "ana">("list")
  useEffect(() => {
    if (!has) return
    try {
      const saved = localStorage.getItem(`kcrm:v:${key}`)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage доступен только после монтирования
      if (saved === "ana" || saved === "list") setV(saved)
    } catch {}
  }, [key, has])
  const set = (next: "list" | "ana") => {
    setV(next)
    try {
      localStorage.setItem(`kcrm:v:${key}`, next)
    } catch {}
  }
  return [has ? v : "list", set] as const
}

function ViewSwitch({ mode, onChange }: { mode: "r" | "c"; onChange: (m: "r" | "c") => void }) {
  const b = "grid h-[34px] w-9 cursor-pointer place-items-center rounded-full text-muted-foreground [&_svg]:size-4"
  return (
    <div className="flex gap-0.5 rounded-full border border-border bg-card p-1 max-sm:justify-self-end">
      <button type="button" title="Список" aria-pressed={mode === "r"} onClick={() => onChange("r")} className={cn(b, mode === "r" && "bg-foreground text-background")}>
        <List />
      </button>
      <button type="button" title="Карточки" aria-pressed={mode === "c"} onClick={() => onChange("c")} className={cn(b, mode === "c" && "bg-foreground text-background")}>
        <LayoutGrid />
      </button>
    </div>
  )
}

function Pager({ total, page, pages, onPage }: { total: number; page: number; pages: number; onPage: (p: number) => void }) {
  const nums: number[] = []
  for (let i = Math.max(0, page - 2); i < Math.min(pages, page + 3); i++) nums.push(i)
  const b = "h-[34px] min-w-[34px] cursor-pointer rounded-[10px] border border-border bg-card px-2 font-semibold tabular-nums disabled:cursor-default disabled:opacity-40"
  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 pt-2.5 pb-1 text-[13px] text-muted-foreground max-sm:gap-2">
      <span>
        Найдено записей: <b className="text-foreground tabular-nums">{fmt(total)}</b>
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" className={b} disabled={!page} onClick={() => onPage(page - 1)} aria-label="Назад">
          ‹
        </button>
        {nums.map((i) => (
          <button key={i} type="button" className={cn(b, i === page && "border-foreground bg-foreground text-background")} onClick={() => onPage(i)}>
            {i + 1}
          </button>
        ))}
        <button type="button" className={b} disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Вперёд">
          ›
        </button>
        <span className="ml-1">из {fmt(pages)}</span>
      </div>
    </div>
  )
}

/** Карточки (как в ЕСТУ): статус, название, полоса по первой числовой колонке. */
function Cards<T extends Row>({
  cfg,
  rows,
  all,
  checked,
  toggle,
  onDelete,
}: {
  cfg: ListConfig<T>
  rows: T[]
  all: T[]
  checked: Set<number>
  toggle: (id: number) => void
  onDelete: (x: T) => void
}) {
  const nc = cfg.cols.find((c) => c.num)
  const max = useMemo(() => (nc ? Math.max(1, ...all.map((x) => Number(nc.value(x) ?? 0))) : 1), [nc, all])
  const status = cfg.cols.find((c) => c.k === (cfg.cardStatus ?? "st"))
  const router = useRouter()
  const Icon = cfg.icon
  if (!rows.length) return <div className="py-10 text-center text-muted-foreground">Ничего не найдено — измените вкладку или фильтры</div>

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5 px-1 py-1.5 max-sm:grid-cols-1">
      {rows.map((x) => {
        const on = checked.has(x.id)
        const v = nc ? Number(nc.value(x) ?? 0) : 0
        const pct = Math.round((v / max) * 100)
        return (
          <div
            key={x.id}
            onClick={() => router.push(recordHref(cfg.key, x.id))}
            className={cn(
              "relative flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[20px] border border-border bg-[var(--row-s)] transition-[transform,box-shadow] duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-[3px] hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.5)]",
              on && "border-[#085eff] shadow-[0_0_0_1px_#085eff]"
            )}
          >
            <div className="relative h-24 overflow-hidden bg-[radial-gradient(260px_120px_at_85%_0%,rgba(8,94,255,0.22),transparent_70%),linear-gradient(180deg,color-mix(in_srgb,#085eff_8%,var(--row-s)),var(--row-s))] max-sm:h-[76px]">
              <Icon className="absolute -right-[18px] -bottom-[30px] size-[120px] text-[#085eff] opacity-16 dark:text-[#6b9dff]" strokeWidth={1.1} />
              <span className="absolute top-3 left-3">{status?.render(x)}</span>
              <span className="absolute top-3 right-3">
                <Check on={on} label="Выбрать" onClick={() => toggle(x.id)} />
              </span>
            </div>
            <div className="flex flex-1 flex-col px-4 pt-3 pb-3.5">
              <div className="truncate text-base font-semibold text-[#085eff] dark:text-[#9db8ff]">{cfg.name(x)}</div>
              <div className="mt-1 truncate text-[12.5px] text-muted-foreground">{cfg.text(x).replace(cfg.name(x), "").trim()}</div>
              {nc && (
                <>
                  <div className="mt-3 flex justify-between text-[12.5px] text-muted-foreground">
                    <span>{nc.t}</span>
                    <b className="font-semibold text-foreground tabular-nums">{nc.render(x)}</b>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]">
                    <i className="block h-full rounded-full" style={{ width: `${Math.max(4, pct)}%`, background: pct > 85 ? "#ff5257" : pct > 60 ? "#ffb340" : "#085eff" }} />
                  </div>
                </>
              )}
              <div className="mt-3.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <Link href={`${recordHref(cfg.key, x.id)}/edit`} className={roundAction} title="Изменить">
                  <Pencil />
                </Link>
                <button type="button" className={cn(roundAction, "hover:border-[#ff3b30] hover:bg-[#ff3b30]")} title={removeLabel(cfg)} onClick={() => onDelete(x)}>
                  {cfg.archive ? <CircleX /> : <Trash2 />}
                </button>
                <RowMenu cfg={cfg} row={x} onDelete={() => onDelete(x)} />
                <Link
                  href={recordHref(cfg.key, x.id)}
                  className="ml-auto inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-[13.5px] font-semibold transition-colors hover:border-[#085eff] hover:bg-[#085eff] hover:text-white"
                >
                  <ArrowRight className="size-4" />
                  Открыть
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
