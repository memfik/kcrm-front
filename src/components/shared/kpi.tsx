import type { LucideIcon } from "lucide-react"
import type { Delta } from "@/lib/period"
import { cn } from "@/lib/utils"
import { DeltaPill } from "./ui"

/** KPI-плитка (как StatTile в kSpot): подпись, значение, «▲ % к прошлому периоду · было N», иконка-водяной знак. */
export function Kpi({
  i = 0,
  title,
  icon: Icon,
  value,
  d,
  caption,
  compact,
}: {
  i?: number
  title: string
  icon: LucideIcon
  value: React.ReactNode
  d?: Delta
  caption?: React.ReactNode
  /** Плотнее — для шапки разделов. */
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "kpi rise relative isolate min-w-0 overflow-hidden rounded-[22px] border border-border bg-card shadow-[var(--panel-shadow)] after:pointer-events-none after:absolute after:-right-10 after:-bottom-10 after:-z-10 after:size-40 after:rounded-full after:bg-[rgba(8,94,255,0.07)] after:blur-[40px] max-sm:rounded-[20px] max-sm:px-3.5 max-sm:pt-3.5 max-sm:pb-3",
        compact ? "px-[18px] pt-3.5 pb-3" : "px-5 pt-[18px] pb-4"
      )}
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <Icon
        aria-hidden
        strokeWidth={1.1}
        className={cn(
          "pointer-events-none absolute -z-10 text-[#085eff] opacity-[0.09] dark:text-[#6b9dff] dark:opacity-[0.12]",
          compact ? "-right-3.5 -bottom-5.5 size-24" : "-right-6 -bottom-8 size-36"
        )}
      />
      <div className="text-[13px] whitespace-nowrap text-muted-foreground">{title}</div>
      <div
        className={cn(
          "leading-[1.25] font-medium tracking-[-0.6px] whitespace-nowrap tabular-nums max-sm:text-2xl",
          compact ? "mt-1 text-2xl" : "mt-2 text-[30px]"
        )}
      >
        {value}
      </div>
      <div className={cn("flex flex-wrap items-center gap-2 text-xs text-muted-foreground max-sm:text-[11.5px]", compact ? "mt-0.5" : "mt-1")}>
        {d && <DeltaPill d={d} />}
        {caption}
      </div>
    </div>
  )
}
