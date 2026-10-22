"use client"

import { ThemeProvider as NextThemes } from "next-themes"

/*
 * Скрипт темы нужен только в HTML с сервера. На клиенте React 19 ругается на <script> в компоненте —
 * там отдаём его как данные (text/plain): не исполняется и не вызывает предупреждения.
 */
const scriptProps = typeof window === "undefined" ? undefined : { type: "text/plain" }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange scriptProps={scriptProps}>
      {children}
    </NextThemes>
  )
}
