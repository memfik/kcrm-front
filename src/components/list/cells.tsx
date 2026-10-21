import type { LucideIcon } from "lucide-react"
import { shortDate } from "@/lib/period"
import { cn } from "@/lib/utils"

/* Ячейки списков и блоки карточки записи — общие для всех разделов. */

export const AVATAR_COLORS = ["#085eff", "#34c759", "#ff9f0a", "#af52de", "#ff375f", "#5ac8fa", "#ffcc00", "#30b0c7"]

const initialsOf = (name: string) =>
  name
    .replace(/[«»"—]/g, "")
    .split(" ")
    .filter((w) => w && !/^(ТОО|АО|ИП|ГУ|КГП|КГУ|№)$/.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

/** Название записи с плашкой-аватаром и подписью. */
export function NameCell({ name, sub, icon: Icon }: { name: string; sub: string; icon?: LucideIcon }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="cav grid size-9 flex-none place-items-center rounded-[10px] text-[12.5px] font-bold">
        {Icon ? <Icon className="size-[18px]" /> : initialsOf(name)}
      </span>
      <div className="min-w-0">
        <b className="block max-w-[230px] truncate font-semibold text-[#085eff] hover:underline max-sm:max-w-[180px] dark:text-[#9db8ff]">{name}</b>
        <span className="text-[11.5px] text-muted-foreground">{sub}</span>
      </div>
    </div>
  )
}

export function Avatar({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span className={cn("grid size-[26px] flex-none place-items-center rounded-full text-[10px] font-bold text-white", className)} style={{ background: color }}>
      {name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)}
    </span>
  )
}

export function Owner({ name, color }: { name: string; color: string }) {
  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <Avatar name={name} color={color} />
      {name}
    </span>
  )
}

/** Статус: цветная плашка с точкой. */
export function Status({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap not-dark:brightness-[0.78] not-dark:saturate-[1.35]"
      style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
    >
      <i className="size-1.5 rounded-full bg-current" />
      {text}
    </span>
  )
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full bg-[var(--soft)] px-2.5 text-xs font-semibold whitespace-nowrap text-muted-foreground", className)}>
      {children}
    </span>
  )
}

export function Dot({ text, color }: { text: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] whitespace-nowrap">
      <i className="size-2 rounded-full" style={{ background: color }} />
      {text}
    </span>
  )
}

export const Dash = () => <span className="font-normal text-[var(--faint)]">—</span>

export function DateCell({ d }: { d: string | null }) {
  if (!d) return <Dash />
  return (
    <>
      {shortDate(d)}
      {d.length > 10 && <span className="text-muted-foreground"> {d.slice(11)}</span>}
    </>
  )
}

/** Метка «новое» у вкладок и полей по требованиям ДИППП/ТБ. */
export const Fresh = () => (
  <i className="ml-1.5 inline-flex rounded-full bg-[rgba(52,199,89,0.16)] px-1.5 align-middle text-[9.5px] leading-4 font-bold tracking-[0.04em] text-[#22a447] uppercase not-italic dark:text-[#4cd964]">
    новое
  </i>
)

/* ---------- блоки карточки ---------- */

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 rounded-[22px] border border-border bg-card px-[22px] py-5 max-sm:px-4 max-sm:py-3.5">
      <h4 className="mb-4 flex items-center gap-2.5 text-[15px] font-bold before:size-2 before:rounded-[3px] before:bg-[#085eff] before:shadow-[0_0_0_4px_rgba(8,94,255,0.15)]">
        {title}
      </h4>
      {children}
    </div>
  )
}

export type KvItem = { t: string; v: React.ReactNode; wide?: boolean; fresh?: boolean }

export function Kv({ items }: { items: KvItem[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5 max-sm:grid-cols-1">
      {items.map((x) => (
        <div key={x.t} className={cn("min-w-0 rounded-[14px] bg-[var(--soft)] px-3.5 py-3", x.wide && "col-span-full")}>
          <span className="mb-1 block text-xs text-muted-foreground">
            {x.t}
            {x.fresh && <Fresh />}
          </span>
          <b className="block text-sm leading-[1.4] font-medium break-words">{x.v}</b>
        </div>
      ))}
    </div>
  )
}

/** Строка списка внутри блока: иконка, текст, справа — метки. */
export function Line({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 text-[13.5px] last:border-0">
      {Icon && <Icon className="size-[18px] flex-none text-muted-foreground" />}
      {children}
    </div>
  )
}

export function Timeline({ items }: { items: { t: string; p: string; d: string }[] }) {
  return (
    <div className="relative mt-1 pl-[30px] before:absolute before:top-2.5 before:bottom-2.5 before:left-2 before:w-0.5 before:bg-border">
      {items.map((e, i) => (
        <div
          key={i}
          className={cn(
            "relative min-h-5 pb-[18px] last:pb-0 before:absolute before:top-0.5 before:-left-[30px] before:size-[18px] before:rounded-full before:border-[3px] before:border-[#085eff] before:bg-card before:shadow-[0_0_0_4px_var(--card)]",
            i === 0 && "before:bg-[#085eff]"
          )}
        >
          <time className="float-right ml-3 text-xs text-[var(--faint)] tabular-nums">
            <DateCell d={e.d} />
          </time>
          <b className="block text-sm leading-[1.35]">{e.t}</b>
          <p className="mt-[3px] text-[12.5px] text-muted-foreground">{e.p}</p>
        </div>
      ))}
    </div>
  )
}

/** Этап воронки: заливка цветом этапа + расшифровка. */
export function Stage({ code, text, color, short }: { code: string; text: string; color: string; short?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-flex h-6 items-center rounded-lg px-2.5 text-xs font-bold text-white" style={{ background: color }}>
        {code}
      </span>
      {!short && <span className="text-[12.5px] text-muted-foreground">{text}</span>}
    </span>
  )
}

/** Путь по этапам: пройденные — зелёные, текущий — синий. */
export function Flow({ steps }: { steps: { code: string; text: React.ReactNode; state: "done" | "on" | "todo" }[] }) {
  return (
    <div className="my-1.5 flex flex-wrap gap-2">
      {steps.map((s) => (
        <div
          key={s.code}
          className={cn(
            "min-w-[90px] flex-1 rounded-xl bg-[var(--soft)] px-3 py-2.5 text-xs text-muted-foreground",
            s.state === "on" && "bg-[color-mix(in_srgb,#085eff_14%,var(--card))] text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,#085eff_50%,transparent)]",
            s.state === "done" && "bg-[color-mix(in_srgb,#34c759_12%,var(--card))]"
          )}
        >
          <b className="block text-[13px] text-foreground">{s.code}</b>
          {s.text}
        </div>
      ))}
    </div>
  )
}

/** Плашка-предупреждение в карточке: «Возвращена на доработку», «Расторгнута»… */
export function Banner({ icon: Icon, title, tone = "warn", fresh, children }: { icon: LucideIcon; title: string; tone?: "warn" | "red" | "blue" | "green"; fresh?: boolean; children?: React.ReactNode }) {
  const tones = {
    warn: ["bg-[rgba(255,159,10,0.12)]", "text-[#ff9f0a]"],
    red: ["bg-[rgba(255,55,95,0.1)]", "text-[#ff375f]"],
    blue: ["bg-[rgba(8,94,255,0.1)]", "text-[#085eff]"],
    green: ["bg-[rgba(52,199,89,0.12)]", "text-[#34c759]"],
  }[tone]
  return (
    <div className={cn("mb-3 flex items-start gap-3 rounded-2xl px-4 py-3.5 text-[13.5px]", tones[0])}>
      <Icon className={cn("size-5 flex-none", tones[1])} />
      <div>
        <b className="mb-0.5 block">
          {title}
          {fresh && <Fresh />}
        </b>
        {children}
      </div>
    </div>
  )
}

/** Небольшая таблица внутри блока карточки (позиции, затраты). */
export function MiniTable({ head, rows }: { head: { t: string; right?: boolean }[]; rows: React.ReactNode[][] }) {
  const th = "border-b border-border px-2.5 pb-2.5 text-left text-[11.5px] font-semibold tracking-[0.04em] text-[var(--faint)] uppercase first:pl-0 last:pr-0"
  const td = "border-b border-border px-2.5 py-3 align-top first:pl-0 last:pr-0 group-last:border-0"
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h.t} className={cn(th, h.right && "text-right")}>
                {h.t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="group">
              {r.map((c, k) => (
                <td key={k} className={cn(td, head[k]?.right && "text-right whitespace-nowrap tabular-nums")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
