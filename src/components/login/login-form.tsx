"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react"
import { GlassButton } from "@/components/ui/opaline/glass-button"
import { GlassSwitch } from "@/components/ui/opaline/glass-switch"

const fieldClass =
  "flex h-11 items-center gap-2 rounded-xl border border-[#d3d9e6] bg-white px-3 text-[#5b6475] transition-[border-color,box-shadow] has-[input:focus-visible]:border-primary has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-primary/25 dark:border-[#2a3446] dark:bg-[#0f141d] dark:text-[#98a2b5] [&>svg]:size-4 [&>svg]:shrink-0"
const inputClass =
  "h-full min-w-0 flex-1 bg-transparent px-1 text-base text-[#0b111c] outline-none md:text-sm dark:text-[#eef1f7]"

/**
 * Форма входа учётной записью домена.
 * TODO(§7): отправка в API AD/SSO. Пароль не логировать и не хранить в состоянии дольше отправки.
 */
export function LoginForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        // Пока нет API — как в макете, ведём на главную.
        router.push("/")
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="login" className="w-fit text-sm font-semibold">
            Логин
          </label>
          <div className={fieldClass}>
            <User />
            <input id="login" name="login" autoComplete="username" autoFocus required className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="w-fit text-sm font-semibold">
            Пароль
          </label>
          <div className={fieldClass}>
            <Lock />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              className="grid h-6 place-items-center rounded-md px-1.5 outline-none hover:bg-black/5 hover:text-[#0b111c] focus-visible:ring-3 focus-visible:ring-primary/30 dark:hover:bg-white/8 dark:hover:text-[#eef1f7] [&_svg]:size-3.5"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassSwitch
            id="remember"
            name="remember"
            checked={remember}
            onCheckedChange={setRemember}
            className="data-[state=checked]:bg-[#085eff]!"
          />
          <label htmlFor="remember" className="text-sm select-none">
            Запомнить меня
          </label>
        </div>

        <GlassButton type="submit" variant="prominent" className="w-full">
          Войти
          <ArrowRight />
        </GlassButton>
      </div>
    </form>
  )
}
