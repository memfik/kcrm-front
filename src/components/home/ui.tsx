import Link from "next/link"
import type { Delta } from "@/lib/home-stats"
import { cn } from "@/lib/utils"

/** Карточка блока главной. Непрозрачная — без стекла, чтобы страница не тормозила. */
export function Card({ className, style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <section
      style={style}
      className={cn(
        "rise min-w-0 rounded-3xl border border-border bg-card px-6 py-[22px] shadow-[var(--panel-shadow)] max-sm:rounded-[20px] max-sm:px-4 max-sm:py-[18px]",
        className
      )}
    >
      {children}
    </section>
  )
}

export function CardHead({ title, sub, more, children }: { title: string; sub?: React.ReactNode; more?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-[17px] font-bold tracking-[-0.015em]">{title}</h3>
        {sub && <div className="mt-1 text-[13px] text-muted-foreground">{sub}</div>}
      </div>
      {children}
      {more && (
        <Link href={more.href} className="text-[13px] font-semibold text-[var(--accent-link)]">
          {more.label}
        </Link>
      )}
    </div>
  )
}

export function DeltaPill({ d, label, className }: { d: Delta; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-[3px] rounded-full px-2 text-xs font-bold tabular-nums",
        d.tone === "up" && "bg-[color-mix(in_srgb,var(--trend-up)_14%,transparent)] text-[var(--trend-up)]",
        d.tone === "down" && "bg-[color-mix(in_srgb,var(--trend-down)_14%,transparent)] text-[var(--trend-down)]",
        d.tone === "eq" && "bg-[var(--soft)] text-muted-foreground",
        className
      )}
    >
      {label ?? d.text}
    </span>
  )
}

/** Легенда графика: квадрат цвета или пунктир «год назад». */
export function Legend({ items }: { items: { label: string; color?: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-muted-foreground">
      {items.map((x) => (
        <span key={x.label} className="inline-flex items-center gap-1.5">
          {x.dashed ? (
            <i className="inline-block w-4 border-t-2 border-dashed border-[var(--faint)]" />
          ) : (
            <i className="inline-block size-3 rounded-[4px]" style={{ background: x.color }} />
          )}
          {x.label}
        </span>
      ))}
    </div>
  )
}
