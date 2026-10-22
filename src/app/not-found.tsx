import type { Metadata } from "next"
import Link from "next/link"
import { House } from "lucide-react"
import { Header } from "@/components/layout/header"
import { BtnLink } from "@/components/list/ui"
import { NAV_GROUPS } from "@/config/nav"

export const metadata: Metadata = { title: "Страница не найдена — kCRM" }

/** 404 — неизвестный адрес. Вне группы (main), поэтому шапку подключаем сами: меню остаётся под рукой. */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-x-clip pb-16 max-sm:pb-[calc(90px+env(safe-area-inset-bottom,0px))]">
        <section className="page pt-16 pb-10 text-center max-sm:pt-10">
          <p className="text-[96px] leading-none font-bold tracking-tight text-[#085eff] tabular-nums max-sm:text-[72px]">404</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight max-sm:text-2xl">Страница не найдена</h1>
          <p className="mx-auto mt-2 max-w-[460px] text-sm text-muted-foreground">
            Адрес набран с ошибкой или раздел перенесён. Вернитесь на главную или выберите раздел ниже.
          </p>
          <BtnLink primary href="/" className="mt-6">
            <House />
            На главную
          </BtnLink>
        </section>

        <section className="page grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {NAV_GROUPS.map((g) => (
            <div key={g.key} className="rounded-[22px] border border-border bg-card px-[22px] py-5 max-sm:px-4 max-sm:py-3.5">
              <div className="mb-2.5 text-[11.5px] font-semibold tracking-[1px] text-[var(--faint)] uppercase">{g.title}</div>
              <ul className="flex flex-col gap-0.5">
                {g.sections.slice(0, 5).map((s) => (
                  <li key={s.slug}>
                    <Link href={`/${s.slug}`} className="-mx-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-[13.5px] hover:bg-[var(--soft)]">
                      <s.icon className="size-4 flex-none text-muted-foreground" />
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
    </>
  )
}
