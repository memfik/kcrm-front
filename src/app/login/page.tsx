import type { Metadata } from "next"
import { Briefcase, Lightbulb } from "lucide-react"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LoginForm } from "@/components/login/login-form"
import { LoginTiles } from "@/components/login/login-tiles"
import { LoginWallpaper } from "@/components/login/wallpaper"
import { GlassBadge } from "@/components/ui/opaline/glass-badge"
import { GlassNotification } from "@/components/ui/opaline/glass-notification"
import { LiquidGlassProvider } from "@/components/ui/opaline/liquid-glass"

export const metadata: Metadata = { title: "Вход — kCRM" }

const card =
  "w-full border border-[#e3e7f0] bg-white text-[#0b111c] dark:border-[#232c3b] dark:bg-[#141a24] dark:text-[#eef1f7]"

/** Вход (макет 01): живые обои, плитки слева, форма AD справа. */
export default function LoginPage() {
  return (
    // Без SVG-преломления: стекло поверх анимированного фона пересчитывалось бы каждый кадр.
    <LiquidGlassProvider refract={false}>
      <div className="p-1.5">
        <div className="stage-blue relative isolate flex min-h-[calc(100dvh-12px)] flex-col overflow-clip rounded-[24px] sm:rounded-[32px]">
          <LoginWallpaper />

          <div className="absolute top-6 left-6 z-10 flex items-center gap-3 md:top-7 md:left-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="QMobile" className="h-10 w-auto" />
            <span className="h-7 w-px bg-white/30" />
            <span className="text-lg leading-none font-semibold tracking-tight text-white">kCRM</span>
          </div>
          <div className="absolute top-5 right-5 z-10 text-white">
            <ThemeToggle size="icon" className="text-white" />
          </div>

          <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 pt-24 pb-12 sm:px-6 lg:grid-cols-[1fr_30rem] lg:gap-16 lg:pt-16 lg:pb-16">
            <div className="login-rise relative order-2 text-white lg:order-none">
              <GlassBadge dot="#34c759" className="mb-6 h-8 px-3.5 text-[12.5px] text-white">
                CRM · сервис QMobile
              </GlassBadge>
              <h2 className="text-[2.2rem] leading-[1.04] font-semibold tracking-[-0.045em] drop-shadow-[0_2px_24px_oklch(0_0_0/0.25)] sm:text-[2.6rem] lg:text-[2.9rem]">
                Клиенты и продажи
                <span className="block opacity-60">под контролем.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80 lg:text-base">
                Контрагенты, сделки, коммерческие предложения, заявки ТВ/ТР и тендеры — в одной системе.
              </p>
              <div className="mt-8 w-full max-w-[340px]">
                <LoginTiles />
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-[30rem] flex-col gap-4 xl:mt-20">
              <GlassNotification
                title="Новая сделка"
                time="сейчас"
                icon={
                  <span className="grid place-items-center bg-[#085eff] text-white">
                    <Briefcase className="size-5!" />
                  </span>
                }
                className="login-rise absolute -top-[5.5rem] -left-20 z-10 hidden w-[20rem] text-white [--glass-tint-frosted:rgb(10_20_70/0.72)] [animation-delay:350ms] xl:flex"
              >
                Интернет 100 Мбит/с · 3 точки · этап «Договор»
              </GlassNotification>

              <section className={`login-rise rounded-[1.5rem] p-8 shadow-[0_30px_80px_-24px_oklch(0.1_0.1_265/0.7)] sm:p-10 ${card}`}>
                <h1 className="text-[1.65rem] leading-tight font-bold tracking-[-0.015em]">Вход в kCRM</h1>
                <p className="mt-1.5 mb-8 text-[15px] text-[#5b6475] dark:text-[#98a2b5]">
                  Используйте логин и пароль от домена JusanMobile.
                </p>
                <LoginForm />
              </section>

              <aside className={`login-rise rounded-[1.25rem] px-7 py-5 [animation-delay:90ms] ${card}`}>
                <p className="mb-1 flex items-center gap-2 text-sm font-bold">
                  <Lightbulb className="size-4 text-primary" />
                  Совет по безопасности
                </p>
                <p className="text-sm leading-relaxed text-[#5b6475] dark:text-[#98a2b5]">
                  Входите только с доверенных устройств. Не сохраняйте пароль на общих компьютерах и выходите, когда
                  закончили работу.
                </p>
              </aside>
            </div>
          </main>

          <footer className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5 text-sm text-white/70 md:px-8">
            <span>© АО «QMobile» · kCRM</span>
            <span className="inline-flex items-center gap-2" role="status">
              <span className="relative flex size-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative size-2.5 rounded-full bg-emerald-400" />
              </span>
              Служба работает
            </span>
          </footer>
        </div>
      </div>
    </LiquidGlassProvider>
  )
}
