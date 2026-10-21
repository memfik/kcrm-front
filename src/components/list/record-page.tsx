"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, CircleX, Pencil, Phone, Share2, Trash2, Users } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { rowsStore, useRows, viewStore } from "@/lib/list/store"
import type { ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { editable, recordHref, removeLabel, shareLink, useDeleteDialog } from "./actions"
import { Fresh } from "./cells"
import { Btn, BtnLink } from "./ui"

/** Карточка записи отдельной страницей: /<раздел>/<id>. */
export function RecordPage<T extends Row>({ cfg, id }: { cfg: ListConfig<T>; id: number }) {
  const router = useRouter()
  const rows = useRows(cfg)
  const x = rows.find((r) => r.id === id)
  const [tab, setTab] = useState(0)
  const del = useDeleteDialog(cfg)

  if (!x)
    return (
      <div className="mx-auto max-w-[1760px] px-[34px] py-16 text-center max-sm:px-4">
        <p className="text-lg font-semibold">Запись не найдена</p>
        <p className="mt-1 text-sm text-muted-foreground">Возможно, она удалена.</p>
        <BtnLink href={`/${cfg.key}`} className="mt-5">
          <ChevronLeft />
          {cfg.title}
        </BtnLink>
      </div>
    )

  const v = cfg.record(x)
  const order = viewStore.order(cfg.key) ?? rows.map((r) => r.id)
  const p = order.indexOf(id)
  const prev = p > 0 ? order[p - 1] : null
  const next = p >= 0 && p < order.length - 1 ? order[p + 1] : null
  const t = Math.min(tab, v.tabs.length - 1)
  const Icon = cfg.icon
  const go = (rid: number) => router.push(recordHref(cfg.key, rid))

  return (
    <div className="mx-auto w-full max-w-[1760px] px-[34px] pb-[50px] max-sm:px-3.5 max-sm:pb-[30px]">
      <div className="mt-1.5 mb-[18px] flex items-center gap-3">
        <BtnLink href={`/${cfg.key}`} className="h-[38px] pl-2.5">
          <ChevronLeft />
          {cfg.title}
        </BtnLink>
        <span className="truncate text-[13px] text-muted-foreground max-sm:hidden">
          {cfg.crumb} · {v.title}
        </span>
        <span className="flex-1" />
        <div className="flex flex-none items-center gap-0.5 rounded-full border border-border bg-card p-1">
          <PagerBtn disabled={prev === null} onClick={() => prev !== null && go(prev)} title="Предыдущая">
            <ChevronLeft />
            <span className="max-sm:hidden">Предыдущая</span>
          </PagerBtn>
          {p >= 0 && (
            <span className="px-2 text-[12.5px] whitespace-nowrap text-muted-foreground tabular-nums">
              {p + 1} / {order.length}
            </span>
          )}
          <PagerBtn disabled={next === null} onClick={() => next !== null && go(next)} title="Следующая">
            <span className="max-sm:hidden">Следующая</span>
            <ChevronRight />
          </PagerBtn>
        </div>
      </div>

      <section className="relative isolate mb-[18px] overflow-hidden rounded-[28px] border border-border bg-[linear-gradient(135deg,color-mix(in_srgb,#085eff_14%,var(--card)),var(--card)_55%)] px-7 pt-[26px] pb-[22px] shadow-[var(--panel-shadow)] before:absolute before:-top-40 before:-right-30 before:-z-10 before:size-[420px] before:rounded-full before:bg-[radial-gradient(circle,rgba(8,94,255,0.35),transparent_65%)] max-sm:rounded-[22px] max-sm:px-4 max-sm:py-[18px]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 flex-none place-items-center rounded-[18px] bg-[linear-gradient(145deg,#2f6bff,#001a9f)] text-white shadow-[0_12px_30px_-10px_rgba(8,94,255,0.7)] max-sm:hidden">
            <Icon className="size-7" />
          </span>
          <div className="min-w-0 flex-1 max-sm:basis-full">
            <h2 className="text-[30px] leading-tight font-semibold tracking-[-0.02em] max-sm:text-[22px]">{v.title}</h2>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">{v.meta}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn className="h-[42px] max-sm:h-[38px]" onClick={() => shareLink(cfg, x)}>
              <Share2 />
              Поделиться
            </Btn>
            {editable(cfg) && (
              <BtnLink href={`${recordHref(cfg.key, x.id)}/edit`} className="h-[42px] max-sm:h-[38px]">
                <Pencil />
                Редактировать
              </BtnLink>
            )}
            <Btn className="h-[42px] text-[#ff5257] max-sm:h-[38px]" onClick={() => del.ask([x], cfg.archive ? undefined : () => router.push(`/${cfg.key}`))}>
              {cfg.archive ? <CircleX /> : <Trash2 />}
              {removeLabel(cfg)}
            </Btn>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pt-[18px] [scrollbar-width:none] max-sm:flex-nowrap">
          {v.actions.map((a, i) =>
            a.href ? (
              <BtnLink key={a.label} href={a.href} primary={i === 0}>
                <a.icon />
                {a.label}
              </BtnLink>
            ) : (
              <Btn
                key={a.label}
                primary={i === 0}
                onClick={() => {
                  if (a.run) {
                    const href = a.run()
                    if (href) router.push(href)
                    return
                  }
                  if (!a.apply) return toast(`«${a.label}» — раздел в работе`)
                  rowsStore.save(cfg, a.apply() as T)
                  toast(`«${a.label}» — ${v.title}`, () => rowsStore.save(cfg, x))
                }}
              >
                <a.icon />
                {a.label}
              </Btn>
            )
          )}
        </div>

        {v.stats.length >= 2 && (
          <div className={cn("mt-[18px] grid gap-2.5 max-sm:grid-cols-2", ["", "", "grid-cols-2", "grid-cols-3", "grid-cols-4"][v.stats.length])}>
            {v.stats.map((s) => (
              <div key={s.t} className="min-w-0 rounded-2xl border border-border bg-[color-mix(in_srgb,var(--background)_55%,transparent)] px-3.5 py-3">
                <span className="mb-1 block text-xs text-muted-foreground">{s.t}</span>
                <b className="block truncate text-lg font-semibold tabular-nums">{s.v}</b>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_360px] items-start gap-[18px] max-[1100px]:grid-cols-1">
        <div className="min-w-0">
          {v.tabs.length > 1 && (
            <div className="mb-3.5 flex w-max max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 [scrollbar-width:none]">
              {v.tabs.map((tb, i) => (
                <button
                  key={tb.t}
                  type="button"
                  onClick={() => setTab(i)}
                  className={cn("flex h-9 flex-none cursor-pointer items-center rounded-full px-3.5 text-[13.5px] text-muted-foreground", i === t && "bg-foreground font-semibold text-background")}
                >
                  {tb.t}
                  {tb.fresh && <Fresh />}
                </button>
              ))}
            </div>
          )}
          <div key={t}>{v.tabs[t].body}</div>
        </div>

        <aside className="sticky top-4 flex flex-col gap-3 max-[1100px]:static">
          {v.facts.length > 0 && (
            <div className="rounded-[22px] border border-border bg-[linear-gradient(160deg,color-mix(in_srgb,#085eff_8%,var(--card)),var(--card))] px-[22px] py-5">
              <h4 className="mb-2 text-[15px] font-bold">Кратко</h4>
              {v.facts.map((f) => (
                <div key={f.t} className="flex justify-between gap-3 border-b border-border py-[9px] text-[13.5px] last:border-0">
                  <span className="text-muted-foreground">{f.t}</span>
                  <b className="text-right font-medium">{f.v}</b>
                </div>
              ))}
            </div>
          )}
          {cfg.owner && (
            <div className="rounded-[22px] border border-border bg-card px-[22px] py-5">
              <h4 className="mb-3 text-[15px] font-bold">Ответственный</h4>
              {cfg.owner.render(x)}
              <div className="mt-3 flex gap-2">
                <Btn className="h-[38px] flex-1" onClick={() => toast("Передача ответственного — после подключения API")}>
                  <Users />
                  Передать
                </Btn>
                <BtnLink href="/calls" className="h-[38px] flex-1">
                  <Phone />
                  Позвонить
                </BtnLink>
              </div>
            </div>
          )}
        </aside>
      </div>
      {del.dialog}
    </div>
  )
}

function PagerBtn({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium hover:bg-[var(--soft)] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent max-sm:px-2 [&_svg]:size-[15px] max-sm:[&_svg]:size-[17px]",
        className
      )}
      {...props}
    />
  )
}
