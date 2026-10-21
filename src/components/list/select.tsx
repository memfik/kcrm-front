"use client"

import { GlassSelect, GlassSelectContent, GlassSelectItem, GlassSelectTrigger, GlassSelectValue } from "@/components/ui/opaline/glass-select"
import type { Option } from "@/lib/list/types"
import { cn } from "@/lib/utils"

/**
 * Стекло выпадающих списков форм (селект, календарь): плотнее стандартного frosted, чтобы текст под ним не мешал;
 * в светлой теме --glass-highlight почти белый — подсветку пункта задаём синей.
 */
export const DROPDOWN_GLASS =
  "z-[130] [--glass-tint-frosted:oklch(0.2_0.005_286/0.92)] not-dark:[--glass-tint-frosted:oklch(1_0_0/0.94)] not-dark:[--glass-highlight:rgba(8,94,255,0.1)]"

/** Выбор из списка для форм и диалогов — Opaline GlassSelect по нашим опциям. */
export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  invalid,
  className,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  invalid?: boolean
  className?: string
  "aria-label"?: string
}) {
  return (
    <GlassSelect value={value} onValueChange={onChange}>
      <GlassSelectTrigger
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className={cn("h-11 min-w-0 rounded-xl text-sm text-foreground aria-invalid:ring-2 aria-invalid:ring-[#ff5257]", className)}
      >
        <GlassSelectValue placeholder={placeholder} />
      </GlassSelectTrigger>
      {/* выше диалогов (z-111) — список открывается и внутри них */}
      <GlassSelectContent className={DROPDOWN_GLASS}>
        {options.map((o) => (
          <GlassSelectItem key={o.v} value={o.v} className="text-sm">
            {o.color && <i className="size-2.5 flex-none rounded-full" style={{ background: o.color }} />}
            {o.label}
          </GlassSelectItem>
        ))}
      </GlassSelectContent>
    </GlassSelect>
  )
}
