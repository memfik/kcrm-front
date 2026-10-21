"use client"

import { useMemo, useState } from "react"
import { Dialog, Popover } from "radix-ui"
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react"
import { applyQuery, dateCol, extraCount, numCol, type Query } from "@/lib/list/query"
import type { ListConfig, Row } from "@/lib/list/types"
import { range, ymStr } from "@/lib/period"
import { cn } from "@/lib/utils"
import { GlassInput } from "@/components/ui/opaline/glass-input"
import { DateField } from "./date-field"
import { Btn } from "./ui"

const chip =
  "inline-flex h-11 flex-none cursor-pointer items-center gap-[7px] rounded-full border border-border px-4 text-sm whitespace-nowrap not-dark:bg-white max-sm:h-[38px] max-sm:px-3 max-sm:text-[13px]"
const chipOn = "border-[color-mix(in_srgb,#085eff_55%,transparent)] text-[#0047d4] dark:text-[#9db8ff]"
const count = "inline-grid h-5 min-w-5 place-items-center rounded-full bg-[#085eff] px-1.5 text-[11px] font-semibold text-white"

/** Фильтр-чип со списком значений. Галочки применяются сразу. */
export function FilterChip<T extends Row>({
  filter,
  value,
  onChange,
}: {
  filter: NonNullable<ListConfig<T>["filters"]>[number]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const on = value.length > 0
  return (
    <Popover.Root>
      <Popover.Trigger className={cn(chip, on && chipOn)}>
        {filter.t}
        {on && <b className={count}>{value.length}</b>}
        <ChevronDown className="size-3.5 opacity-60" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-[90] max-h-[60vh] min-w-[250px] overflow-auto rounded-[20px] bg-[var(--dd-bg)] p-2 shadow-[var(--glass-rim),0_24px_60px_-18px_rgba(0,0,0,0.55)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
        >
          {filter.opts.map((o) => {
            const checked = value.includes(o.v)
            return (
              <label key={o.v} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-[9px] text-sm whitespace-nowrap hover:bg-[color-mix(in_srgb,var(--foreground)_7%,transparent)]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(checked ? value.filter((v) => v !== o.v) : [...value, o.v])}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "grid size-5 flex-none place-items-center rounded-[7px] border-[1.5px] border-[color-mix(in_srgb,var(--foreground)_28%,transparent)] transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[#085eff]/40",
                    checked && "border-[#085eff] bg-[#085eff] shadow-[0_4px_12px_-3px_rgba(8,94,255,0.6)]"
                  )}
                >
                  {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
                </span>
                {o.color && <i className="size-2.5 rounded-full" style={{ background: o.color }} />}
                {o.label}
              </label>
            )
          })}
          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border px-1.5 pt-2 pb-0.5">
            <button type="button" onClick={() => onChange([])} className="h-8 rounded-full px-3 text-[12.5px] font-semibold text-muted-foreground">
              Сбросить
            </button>
            <Popover.Close className="h-8 rounded-full bg-[#085eff] px-3 text-[12.5px] font-semibold text-white">Готово</Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function MoreButton({ q, onClick }: { q: Query; onClick: () => void }) {
  const n = extraCount(q)
  return (
    <button type="button" onClick={onClick} className={cn(chip, "gap-2", n > 0 && chipOn)}>
      <SlidersHorizontal className="size-4 opacity-70" />
      Ещё
      {n > 0 && <b className={count}>{n}</b>}
    </button>
  )
}

/** Плашки активных условий + «Сбросить всё». */
export function ActiveChips<T extends Row>({ cfg, q, setQ }: { cfg: ListConfig<T>; q: Query; setQ: (q: Query) => void }) {
  const out: { label: string; clear: () => void }[] = []
  for (const f of cfg.filters ?? [])
    for (const v of q.f[f.k] ?? [])
      out.push({
        label: `${f.t}: ${f.opts.find((o) => o.v === v)?.label ?? v}`,
        clear: () => setQ({ ...q, f: { ...q.f, [f.k]: q.f[f.k].filter((x) => x !== v) } }),
      })
  const d = (s: string) => (s ? s.split("-").reverse().join(".") : "…")
  if (q.from || q.to) out.push({ label: `${dateCol(cfg)?.t ?? "Дата"}: ${d(q.from)} – ${d(q.to)}`, clear: () => setQ({ ...q, from: "", to: "" }) })
  if (q.min !== "" || q.max !== "")
    out.push({ label: `${numCol(cfg)?.t ?? "Сумма"}: ${q.min || 0} – ${q.max || "∞"}`, clear: () => setQ({ ...q, min: "", max: "" }) })
  for (const u of q.own) out.push({ label: `${cfg.owner?.t}: ${cfg.owner?.name(u)}`, clear: () => setQ({ ...q, own: q.own.filter((x) => x !== u) }) })
  if (q.q) out.push({ label: `Поиск: «${q.q}»`, clear: () => setQ({ ...q, q: "" }) })
  if (!out.length) return null

  const chipCls = "inline-flex h-[30px] items-center gap-1.5 rounded-full border text-[12.5px] font-medium"
  return (
    <div className="mx-1.5 mb-2 flex flex-wrap gap-1.5 max-sm:mx-1">
      {out.map((c) => (
        <span key={c.label} className={cn(chipCls, "border-[rgba(8,94,255,0.45)] bg-[rgba(8,94,255,0.06)] pr-1.5 pl-3 text-[#0047d4] dark:text-[#9db8ff]")}>
          {c.label}
          <button type="button" aria-label="Убрать" onClick={c.clear} className="grid size-5 place-items-center rounded-full hover:bg-[rgba(8,94,255,0.15)]">
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      {out.length > 1 && (
        <button
          type="button"
          onClick={() => setQ({ ...q, q: "", f: {}, from: "", to: "", min: "", max: "", own: [] })}
          className={cn(chipCls, "border-border px-3 text-muted-foreground")}
        >
          Сбросить всё
        </button>
      )}
    </div>
  )
}

/** Панель «Ещё»: все фильтры, период по дате, диапазон числа, ответственные. Применяется по «Показать». */
export function MoreFilters<T extends Row>({
  cfg,
  rows,
  q,
  open,
  onOpenChange,
  onApply,
}: {
  cfg: ListConfig<T>
  rows: T[]
  q: Query
  open: boolean
  onOpenChange: (o: boolean) => void
  onApply: (q: Query) => void
}) {
  const [draft, setDraft] = useState(q)
  const [preset, setPreset] = useState<number | null>(null)
  const found = useMemo(() => applyQuery(cfg, rows, draft).length, [cfg, rows, draft])
  const dc = dateCol(cfg)
  const nc = numCol(cfg)
  const owners = useMemo(() => (cfg.owner ? [...new Set(rows.map(cfg.owner.get))].slice(0, 24) : []), [cfg, rows])

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  const quick = (months: number) => {
    // 0 — этот месяц, 1 — прошлый, 3 — квартал, 12 — год (до опорного месяца)
    const r = months === 1 ? range("m", 1) : months === 0 ? range("m") : Array.from({ length: months }, (_, i) => ymStr(ymNum(range("m")[0]) - months + 1 + i))
    const [y, m] = r[r.length - 1].split("-").map(Number)
    setPreset(months)
    setDraft({ ...draft, from: `${r[0]}-01`, to: `${r[r.length - 1]}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}` })
  }

  const opt = "inline-flex h-[34px] cursor-pointer items-center gap-[7px] rounded-full border border-border bg-card px-[13px] text-[13px] transition-colors"
  const optOn = "border-[#085eff] bg-[#085eff] text-white"
  const input = "h-11 rounded-xl px-3.5 text-foreground"
  const h = "mt-[18px] mb-2 text-[13px] font-semibold first:mt-0"

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setDraft(q)
          setPreset(null)
        }
        onOpenChange(o)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[94] bg-[rgba(5,6,9,0.35)] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-2.5 right-2.5 bottom-2.5 z-[95] flex w-[min(560px,calc(100vw-20px))] flex-col rounded-[28px] border border-border bg-background shadow-[0_30px_80px_rgba(0,0,0,0.45)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 max-sm:inset-0 max-sm:w-screen max-sm:rounded-none"
        >
          <div className="flex items-start gap-3 border-b border-border px-6 pt-[22px] pb-3.5 max-sm:px-4">
            <span className="cav grid size-11 place-items-center rounded-xl">
              <SlidersHorizontal className="size-5" />
            </span>
            <div className="flex-1">
              <Dialog.Title className="text-[21px] font-semibold">Фильтры</Dialog.Title>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {cfg.title} · найдено <b className="text-foreground tabular-nums">{found}</b> из {rows.length}
              </p>
            </div>
            <Dialog.Close className="grid size-10 place-items-center rounded-full border border-border bg-card" aria-label="Закрыть">
              <X className="size-[18px]" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-auto px-6 py-[18px] max-sm:px-4">
            {(cfg.filters ?? []).map((f) => (
              <div key={f.k}>
                <div className={h}>{f.t}</div>
                <div className="flex flex-wrap gap-1.5">
                  {f.opts.map((o) => {
                    const on = draft.f[f.k]?.includes(o.v)
                    return (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setDraft({ ...draft, f: { ...draft.f, [f.k]: toggle(draft.f[f.k] ?? [], o.v) } })}
                        className={cn(opt, on && optOn)}
                      >
                        {o.color && <i className="size-2 rounded-full" style={{ background: o.color }} />}
                        {o.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {dc && (
              <>
                <div className={h}>{dc.t}</div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {(
                    [
                      ["Этот месяц", 0],
                      ["Прошлый месяц", 1],
                      ["Квартал", 3],
                      ["Год", 12],
                    ] as const
                  ).map(([t, m]) => (
                    <button key={t} type="button" onClick={() => quick(m)} className={cn(opt, preset === m && optOn)}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <DateField placeholder="С" value={draft.from} onChange={(v) => setDraft({ ...draft, from: v })} />
                  <DateField placeholder="По" value={draft.to} onChange={(v) => setDraft({ ...draft, to: v })} />
                </div>
              </>
            )}

            {nc && (
              <>
                <div className={h}>{nc.t}</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <GlassInput inputMode="numeric" placeholder="от" value={draft.min} onChange={(e) => setDraft({ ...draft, min: e.target.value.replace(/\D/g, "") })} className={input} inputClassName="text-sm" />
                  <GlassInput inputMode="numeric" placeholder="до" value={draft.max} onChange={(e) => setDraft({ ...draft, max: e.target.value.replace(/\D/g, "") })} className={input} inputClassName="text-sm" />
                </div>
              </>
            )}

            {cfg.owner && (
              <>
                <div className={h}>{cfg.owner.t}</div>
                <div className="flex flex-wrap gap-1.5">
                  {owners.map((u) => (
                    <button key={u} type="button" onClick={() => setDraft({ ...draft, own: toggle(draft.own, u) })} className={cn(opt, draft.own.includes(u) && optOn)}>
                      {cfg.owner!.name(u)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-border px-6 pt-3.5 pb-5 max-sm:px-4">
            <Btn
              className="mr-auto"
              onClick={() => {
                setDraft({ ...draft, f: {}, from: "", to: "", min: "", max: "", own: [] })
                setPreset(null)
              }}
            >
              Сбросить
            </Btn>
            <Dialog.Close asChild>
              <Btn>Отмена</Btn>
            </Dialog.Close>
            <Btn
              primary
              onClick={() => {
                onApply(draft)
                onOpenChange(false)
              }}
            >
              <Check className="size-4" />
              Показать
            </Btn>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const ymNum = (s: string) => {
  const [y, m] = s.split("-").map(Number)
  return y * 12 + m - 1
}
