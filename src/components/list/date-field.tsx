"use client"

import { GlassDatePicker } from "@/components/ui/opaline/glass-date-picker"
import { cn } from "@/lib/utils"

const toDate = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number)
  return y ? new Date(y, m - 1, d) : undefined
}
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

/** Дата «YYYY-MM-DD» для форм и фильтров — Opaline GlassDatePicker на русском, неделя с понедельника. */
export function DateField({
  value,
  onChange,
  placeholder = "Выберите дату",
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <GlassDatePicker
      // пикер помнит последнюю дату сам — при сбросе снаружи пересоздаём
      key={value ? "set" : "empty"}
      value={toDate(value)}
      onValueChange={(d) => onChange(toIso(d))}
      placeholder={placeholder}
      locale="ru-RU"
      format={{ day: "numeric", month: "long", year: "numeric" }}
      className={cn("h-11 w-full rounded-xl text-sm text-foreground", className)}
      // выше диалогов (z-111) — календарь открывается и внутри них
      calendarProps={{ weekStartsOn: 1, className: "z-[130] not-dark:[--glass-highlight:rgba(8,94,255,0.1)]" }}
    />
  )
}
