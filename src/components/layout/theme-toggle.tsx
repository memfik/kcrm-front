"use client"

import { Moon, Sun } from "lucide-react"
import { GlassButton, type GlassButtonProps } from "@/components/ui/opaline/glass-button"
import { useThemeTransition } from "@/hooks/use-theme-transition"

export function ThemeToggle({ size = "sm", className }: Pick<GlassButtonProps, "size" | "className">) {
  const { toggleTheme } = useThemeTransition()
  return (
    <GlassButton size={size} className={className} onClick={(e) => toggleTheme(e)} aria-label="Сменить тему" title="Сменить тему">
      <Sun className="hidden size-5 dark:block" strokeWidth={1.75} />
      <Moon className="size-5 dark:hidden" strokeWidth={1.75} />
    </GlassButton>
  )
}
