import { SmartLink } from "./smart-link"
import { cn } from "@/lib/utils"

/* Кнопки списков и карточек — как .btn в макетах. Непрозрачные: стекло только в шапке. */

const base =
  "inline-flex h-10 flex-none cursor-pointer items-center justify-center gap-2 rounded-full border px-4 text-[13.5px] font-semibold whitespace-nowrap transition-[background-color,filter,transform] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4"
const tone = {
  default: "border-border bg-card text-foreground hover:bg-[var(--soft)]",
  primary: "border-[#085eff] bg-[#085eff] text-white shadow-[0_8px_24px_rgba(8,94,255,0.32)] hover:brightness-110",
  red: "border-[#ff3b30] bg-[#ff3b30] text-white hover:brightness-110",
  danger: "border-border bg-card text-[#dc2626] hover:bg-[var(--soft)] dark:text-[#ff6b6b]",
}

type BtnProps = { primary?: boolean; red?: boolean; danger?: boolean }
const cls = ({ primary, red, danger }: BtnProps, className?: string) =>
  cn(base, primary ? tone.primary : red ? tone.red : danger ? tone.danger : tone.default, className)

export function Btn({ primary, red, danger, className, type = "button", ...props }: React.ComponentProps<"button"> & BtnProps) {
  return <button type={type} className={cls({ primary, red, danger }, className)} {...props} />
}

/** Кнопка-ссылка; адреса форм («/deals/new») открывают панель формы — см. SmartLink. */
export function BtnLink({ primary, red, danger, className, ...props }: React.ComponentProps<typeof SmartLink> & BtnProps) {
  return <SmartLink className={cls({ primary, red, danger }, className)} {...props} />
}

/** Круглая кнопка действия в строке таблицы / карточке. */
export const roundAction =
  "grid size-8 flex-none cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-[#085eff] hover:bg-[#085eff] hover:text-white dark:bg-white/6 [&_svg]:size-[15px]"
