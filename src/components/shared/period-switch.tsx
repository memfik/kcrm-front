"use client"

import { GlassSegmented, GlassSegmentedItem } from "@/components/ui/opaline/glass-segmented"
import type { Period } from "@/lib/period"
import { cn } from "@/lib/utils"

const PERIODS: { value: Period; label: string }[] = [
  { value: "m", label: "Месяц" },
  { value: "q", label: "Квартал" },
  { value: "y", label: "Год" },
]

/** «Месяц / Квартал / Год» — единственное стекло на странице сводки. */
export function PeriodSwitch({ value, onChange, className }: { value: Period; onChange: (p: Period) => void; className?: string }) {
  return (
    <GlassSegmented
      aria-label="Период"
      value={value}
      onValueChange={(v) => onChange(v as Period)}
      className={cn("rise text-foreground [animation-delay:80ms] max-sm:flex max-sm:w-full max-sm:[&>div]:w-full", className)}
    >
      {PERIODS.map((p) => (
        <GlassSegmentedItem
          key={p.value}
          value={p.value}
          label={p.label}
          className="h-[38px] px-5 text-sm text-muted-foreground opacity-100 data-[state=active]:text-foreground max-sm:flex-1"
        />
      ))}
    </GlassSegmented>
  )
}
