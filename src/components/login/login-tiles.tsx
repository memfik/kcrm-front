"use client"

import { useState } from "react"
import { Briefcase, FileCheck, FileScan, Gauge, Gavel, Phone, Users } from "lucide-react"
import { GlassClock } from "@/components/ui/opaline/glass-clock"
import {
  GlassControlButton,
  GlassControlCenter,
  GlassControlSlider,
  GlassControlTile,
  GlassControlToggle,
} from "@/components/ui/opaline/glass-control-center"
import { cn } from "@/lib/utils"

/** Плитки в стиле Control Center слева от формы (макет 01). Декоративные — состояние локальное. */
export function LoginTiles() {
  const [method, setMethod] = useState<"call" | "doc">("call")
  const [plan, setPlan] = useState(72)

  return (
    <GlassControlCenter className="w-full text-white">
      <GlassControlTile cols={2} rows={2} className="login-rise justify-around [animation-delay:150ms]">
        <GlassControlToggle icon={<Users />} label="Контрагенты" status="Клиенты" defaultPressed />
        <GlassControlToggle icon={<Briefcase />} label="Сделки" status="Воронка продаж" defaultPressed />
        <GlassControlToggle icon={<FileCheck />} label="Заявки ТВ/ТР" status="Техвозможность" defaultPressed />
      </GlassControlTile>

      <GlassControlTile cols={2} rows={2} className="login-rise items-center justify-center gap-1 [animation-delay:240ms]">
        <GlassClock size={118} timeZone="Asia/Almaty" />
        <span className="text-[11px] font-medium opacity-70">Астана</span>
      </GlassControlTile>

      <GlassControlTile cols={2} className="login-rise [animation-delay:330ms]">
        <GlassControlToggle icon={<Gavel />} label="Тендеры" status="Госзакупки" color="#ff9f0a" defaultPressed />
      </GlassControlTile>

      <MethodTile icon={<Phone />} label="Вход звонком" active={method === "call"} onClick={() => setMethod("call")} delay={420} />
      <MethodTile icon={<FileScan />} label="Вход по документу" active={method === "doc"} onClick={() => setMethod("doc")} delay={510} />

      <GlassControlTile cols={4} className="login-rise px-4 [animation-delay:600ms]">
        <div className="relative">
          <span className="absolute top-0 right-1 text-[13px] font-semibold tabular-nums opacity-80">
            {plan}% плана
          </span>
          <GlassControlSlider
            label="План продаж"
            icon={<Gauge />}
            value={plan}
            onValueChange={(v) => setPlan(Math.max(8, v))}
          />
        </div>
      </GlassControlTile>
    </GlassControlCenter>
  )
}

function MethodTile({
  icon,
  label,
  active,
  onClick,
  delay,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  delay: number
}) {
  return (
    <GlassControlTile cols={1} className="login-rise" style={{ animationDelay: `${delay}ms` }}>
      <GlassControlButton aria-label={label} title={label} aria-pressed={active} onClick={onClick}>
        <span
          className={cn(
            "grid size-11 place-items-center rounded-full transition-[background-color,color,box-shadow] duration-300 [&_svg]:size-5!",
            active ? "bg-white text-[#085eff] shadow-[0_0_20px_-4px_oklch(1_0_0/0.6)]" : "bg-white/12 text-white"
          )}
        >
          {icon}
        </span>
      </GlassControlButton>
    </GlassControlTile>
  )
}
