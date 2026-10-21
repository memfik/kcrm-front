"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog } from "radix-ui"
import { CircleAlert, CircleCheck, FilePlus, FileText, Paperclip, Pencil, Percent, Printer, Save, Search, Signature, Trash2, X } from "lucide-react"
import { DateField } from "@/components/list/date-field"
import { FormSelect } from "@/components/list/select"
import { Btn, BtnLink } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { GlassInput } from "@/components/ui/opaline/glass-input"
import { GlassTextarea } from "@/components/ui/opaline/glass-textarea"
import { CATALOG_ITEMS, type CatalogItem } from "@/config/lists/catalog"
import { COUNTERPARTIES } from "@/config/lists/counterparties"
import { DISCOUNTS } from "@/config/lists/discounts"
import { OFFERS_LIST } from "@/config/lists/offers"
import { binOf, counterpartyName, managerName, pick, rnd } from "@/lib/demo-names"
import { BRANCHES } from "@/lib/dippp"
import { rowsStore } from "@/lib/list/store"
import { fmt } from "@/lib/period"
import { cn } from "@/lib/utils"

/*
 * 28 Конструктор КП: шапка (клиент), позиции из прейскуранта, доп. затраты, итого с НДС, запрос скидки.
 * ?kp=<id> — правка КП из реестра, ?cs=<id> — новое КП для контрагента, ?pos=<id> — с позицией каталога.
 * Сохранение — в реестр КП (05) в памяти вкладки. TODO: API, версии КП, печатная форма.
 */

type Line = Pick<CatalogItem, "id" | "pos" | "d" | "ms" | "mon"> & { price: number; qty: number; disc: number; /** допустимая скидка, % */ max: number }

const PRICE = CATALOG_ITEMS.filter((p) => p.price > 0)
const toLine = (p: CatalogItem, qty = 1, disc = 0): Line => ({ id: p.id, pos: p.pos, d: p.d, ms: p.ms, mon: p.mon, price: p.price, qty, disc, max: p.disc || 10 })
const lineSum = (x: Line) => x.qty * x.price * (1 - x.disc / 100)
const today = "2018-03-16"

const card = "rounded-3xl border border-border bg-card px-6 py-[22px] shadow-[var(--panel-shadow)] max-sm:rounded-[20px] max-sm:px-4"
const ro = "flex h-11 items-center truncate rounded-xl bg-[var(--soft)] px-3.5 text-sm"
const lbl = "flex flex-col gap-1.5 text-[12.5px] text-muted-foreground"

export function OfferBuilder() {
  const router = useRouter()
  const params = useSearchParams()
  const kp = params.get("kp") ? rowsStore.find(OFFERS_LIST, +params.get("kp")!) : undefined
  const clients = useMemo(() => rowsStore.all(COUNTERPARTIES).slice(0, 300), [])

  const [cs, setCs] = useState(() => String(kp?.cs || params.get("cs") || clients[0]?.id || ""))
  const [br, setBr] = useState(() => pick(BRANCHES, +cs, 2))
  const [cur, setCur] = useState("KZT")
  const [date, setDate] = useState(kp?.date.slice(0, 10) || today)
  const [until, setUntil] = useState("2018-04-15")
  const [lines, setLines] = useState<Line[]>(() => {
    if (kp) {
      // позиции КП из реестра — те же, что во вкладке «Позиции» его карточки
      return Array.from({ length: Math.max(1, Math.min(6, kp.n)) }, (_, k) =>
        toLine(CATALOG_ITEMS[rnd(kp.id, 20 + k) % CATALOG_ITEMS.length], (rnd(kp.id, 30 + k) % 3) + 1, rnd(kp.id, 40 + k) % 12)
      )
    }
    const pos = params.get("pos") && PRICE.find((p) => p.id === +params.get("pos")!)
    if (pos) return [toLine(pos)]
    if (params.get("cs")) return []
    // пример, как в макете: три позиции, одна — со скидкой выше допустимой
    return [0, 5, 12].map((i) => {
      const p = PRICE[(i * 7) % PRICE.length]
      return toLine(p, i ? 2 : 1, i === 12 ? Math.min(25, (p.disc || 10) + 8) : 0)
    })
  })
  const [extra, setExtra] = useState({ mat: "0", work: "0", eq: "0" })
  const [comment, setComment] = useState("")
  const [files, setFiles] = useState<string[]>([])
  const [picker, setPicker] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(kp?.id ?? null)

  const client = clients.find((c) => String(c.id) === cs) ?? rowsStore.find(COUNTERPARTIES, +cs)
  const clientOpts = useMemo(() => {
    const list = client && !clients.includes(client) ? [client, ...clients] : clients
    return list.map((c) => ({ v: String(c.id), label: `${counterpartyName(c.id)} · ID ${c.id}` }))
  }, [clients, client])

  const monthly = lines.filter((x) => x.mon).reduce((a, x) => a + lineSum(x), 0)
  const once = lines.filter((x) => !x.mon).reduce((a, x) => a + lineSum(x), 0)
  const full = lines.reduce((a, x) => a + x.qty * x.price, 0)
  const extras = (+extra.mat || 0) + (+extra.work || 0) + (+extra.eq || 0)
  const discount = full - monthly - once
  const vat = (monthly + once + extras) * 0.12
  const total = monthly + once + extras + vat
  const over = lines.filter((x) => x.disc > x.max)

  const setLine = (i: number, patch: Partial<Line>) => setLines(lines.map((x, k) => (k === i ? { ...x, ...patch } : x)))
  const toggle = (p: CatalogItem) => setLines(lines.some((x) => x.id === p.id) ? lines.filter((x) => x.id !== p.id) : [...lines, toLine(p)])

  /** Сохранить в реестр КП; возвращает № КП. */
  const save = () => {
    const id = savedId ?? rowsStore.nextId(OFFERS_LIST)
    const base = rowsStore.find(OFFERS_LIST, id)
    rowsStore.save(OFFERS_LIST, { ...(base ?? { deal: +(params.get("deal") || 0) }), id, cs: +cs, u: client?.uid ?? "1", date, act: over.length ? 0 : 1, n: lines.length, s: Math.round(total) })
    setSavedId(id)
    return id
  }

  const steps: { b: string; s: string; done: boolean }[] = [
    { b: "Клиент", s: cs ? "выбран" : "—", done: !!cs },
    { b: "Позиции", s: lines.length ? `${lines.length} шт.` : "добавьте", done: lines.length > 0 },
    { b: "Скидка", s: over.length ? "нужно согласование" : "в пределах", done: lines.length > 0 && !over.length },
    { b: "Отправка", s: "клиенту / договор", done: false },
  ]
  const current = steps.findIndex((s) => !s.done)

  return (
    <div className="mx-auto w-full max-w-[1760px] px-[34px] pb-10 max-sm:px-3">
      <section className="rise pt-1.5 pb-4">
        <p className="flex items-center gap-2 text-sm text-[#085eff] dark:text-[#9db8ff]">
          <FileText className="size-4" />
          <Link href="/offers">Продажи · КП</Link> · Конструктор
        </p>
        <h1 className="mt-1.5 text-[34px] leading-[1.1] font-medium tracking-[-0.025em] max-sm:text-[26px]">{savedId ? `КП № ${savedId}` : "Новое коммерческое предложение"}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Выберите контрагента, добавьте услуги из прейскуранта, при необходимости запросите скидку.</p>
      </section>

      <div className="mb-4 flex gap-1.5 max-sm:flex-wrap">
        {steps.map((s, i) => (
          <div
            key={s.b}
            className={cn(
              "flex-1 rounded-xl bg-[var(--soft)] px-3 py-2.5 text-xs text-muted-foreground max-sm:min-w-[40%]",
              s.done && "bg-[color-mix(in_srgb,#34c759_12%,var(--card))]",
              !s.done && i === current && "bg-[color-mix(in_srgb,#085eff_14%,var(--card))] shadow-[inset_0_0_0_1px_rgba(8,94,255,0.5)]"
            )}
          >
            <b className="block text-[13px] text-foreground">
              {i + 1}. {s.b}
            </b>
            {s.s}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_380px] items-start gap-[18px] max-[1100px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-bold">Клиент</h3>
                <div className="mt-1 text-[13px] text-muted-foreground">Шапка КП</div>
              </div>
              <Seg value={cur} options={["KZT", "USD", "EUR"]} onChange={setCur} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-3.5 gap-y-3 max-sm:grid-cols-1">
              <div className={cn(lbl, "col-span-full")}>
                Контрагент
                <FormSelect
                  value={cs}
                  options={clientOpts}
                  aria-label="Контрагент"
                  onChange={(v) => {
                    setCs(v)
                    setBr(pick(BRANCHES, +v, 2))
                  }}
                />
              </div>
              <div className={lbl}>
                БИН/ИИН
                <div className={ro}>{cs ? binOf(+cs) : "—"}</div>
              </div>
              <div className={lbl}>
                Менеджер клиента
                <div className={ro}>{client ? managerName(client.uid) : "—"}</div>
              </div>
              <div className={lbl}>
                Филиал
                <FormSelect value={br} options={BRANCHES.map((v) => ({ v, label: v }))} onChange={setBr} aria-label="Филиал" />
              </div>
              <div className={lbl}>
                Статус в биллинге
                <div className={ro}>
                  {client?.st === 3 ? (
                    <span className="rounded-full bg-[rgba(52,199,89,0.15)] px-2 text-[11.5px] leading-[22px] font-semibold text-[#34c759]">Активный</span>
                  ) : (
                    <span className="rounded-full bg-[rgba(255,159,10,0.15)] px-2 text-[11.5px] leading-[22px] font-semibold text-[#ff9f0a]">Не подключён</span>
                  )}
                </div>
              </div>
              <div className={lbl}>
                Дата КП
                <DateField value={date} onChange={setDate} />
              </div>
              <div className={lbl}>
                Действует до
                <DateField value={until} onChange={setUntil} />
              </div>
              <div className={lbl}>
                Прейскурант
                <div className={ro}>версия 12 · с 12.07.2017</div>
              </div>
            </div>
          </section>

          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-bold">Позиции</h3>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  {lines.length
                    ? `${lines.length} позиций · ${lines.filter((x) => x.mon).length} ежемесячных, ${lines.filter((x) => !x.mon).length} единовременных`
                    : "Ежемесячные, единовременные и за трафик"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn
                  onClick={() =>
                    setLines([...lines, { id: -Date.now(), pos: "вручную", d: "Новая услуга", ms: "услуга", mon: true, price: 10000, qty: 1, disc: 0, max: 0 }])
                  }
                >
                  <Pencil />
                  Вручную
                </Btn>
                <Btn primary onClick={() => setPicker(true)}>
                  <FilePlus />
                  Из прейскуранта
                </Btn>
              </div>
            </div>
            {lines.length ? (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-1.5 text-[13.5px]">
                  <thead>
                    <tr className="text-left text-[12.5px] text-muted-foreground [&>th]:px-2.5 [&>th]:py-1 [&>th]:font-medium [&>th]:whitespace-nowrap">
                      <th>Услуга</th>
                      <th className="text-right">Кол-во</th>
                      <th className="text-right">Цена, ₸</th>
                      <th className="text-right">Скидка, %</th>
                      <th className="text-right">Сумма, ₸</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        [true, "Ежемесячные платежи"],
                        [false, "Единовременные платежи"],
                      ] as const
                    ).map(([mon, title]) => {
                      const group = lines.filter((x) => x.mon === mon)
                      if (!group.length) return null
                      return [
                        <tr key={title}>
                          <td colSpan={6} className="px-1 pt-3.5 pb-0.5 text-[11.5px] font-semibold tracking-[1px] text-[var(--faint)] uppercase">
                            {title}
                          </td>
                        </tr>,
                        ...group.map((x) => {
                          const i = lines.indexOf(x)
                          const bad = x.disc > x.max
                          const cell = "bg-[var(--row-s)] p-2.5 align-middle first:rounded-l-[14px] last:rounded-r-[14px]"
                          return (
                            <tr key={x.id}>
                              <td className={cn(cell, "min-w-[260px] leading-[1.35]")}>
                                {x.pos === "вручную" ? (
                                  <GlassInput value={x.d} onChange={(e) => setLine(i, { d: e.target.value })} className="h-9 rounded-[10px] px-2.5" inputClassName="text-sm" />
                                ) : (
                                  x.d
                                )}
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {x.pos} · {x.ms}
                                  {bad && <span className="ml-1 rounded-full bg-[rgba(255,159,10,0.15)] px-2 font-semibold text-[#ff9f0a]">выше допустимой {x.max}%</span>}
                                </span>
                              </td>
                              <td className={cn(cell, "text-right")}>
                                <Num value={x.qty} onChange={(qty) => setLine(i, { qty })} w="w-16" />
                              </td>
                              <td className={cn(cell, "text-right")}>
                                <Num value={x.price} onChange={(price) => setLine(i, { price })} w="w-24" />
                              </td>
                              <td className={cn(cell, "text-right")}>
                                <Num value={x.disc} onChange={(disc) => setLine(i, { disc })} w="w-16" warn={bad} />
                              </td>
                              <td className={cn(cell, "text-right font-semibold whitespace-nowrap tabular-nums")}>{fmt(lineSum(x))}</td>
                              <td className={cell}>
                                <button
                                  type="button"
                                  title="Удалить позицию"
                                  onClick={() => {
                                    setLines(lines.filter((_, k) => k !== i))
                                    toast(`Позиция удалена: ${x.d.slice(0, 40)}`)
                                  }}
                                  className="grid size-8 cursor-pointer place-items-center rounded-full border border-border bg-card text-muted-foreground hover:border-[#ff3b30] hover:bg-[#ff3b30] hover:text-white"
                                >
                                  <Trash2 className="size-[15px]" />
                                </button>
                              </td>
                            </tr>
                          )
                        }),
                      ]
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">Позиций пока нет. Нажмите «Из прейскуранта», чтобы добавить услуги.</div>
            )}
          </section>

          <section className={card}>
            <h3 className="text-[17px] font-bold">Доп. затраты и вложения</h3>
            <div className="mt-1 text-[13px] text-muted-foreground">Материалы, работы и файлы к КП</div>
            <div className="mt-4 grid grid-cols-3 gap-3.5 max-sm:grid-cols-1">
              {(
                [
                  ["mat", "Материалы, ₸"],
                  ["work", "Работы, ₸"],
                  ["eq", "Оборудование, ₸"],
                ] as const
              ).map(([k, t]) => (
                <label key={k} className={lbl}>
                  {t}
                  <GlassInput
                    inputMode="numeric"
                    value={extra[k]}
                    onChange={(e) => setExtra({ ...extra, [k]: e.target.value.replace(/\D/g, "") })}
                    className="h-11 rounded-xl px-3.5 text-foreground"
                    inputClassName="text-sm"
                  />
                </label>
              ))}
              <label className={cn(lbl, "col-span-full")}>
                Комментарий по скидке
                <GlassTextarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Например: клиент сравнивает с предложением другого оператора"
                  minRows={2}
                  containerClassName="rounded-xl"
                  className="text-sm text-foreground"
                />
              </label>
            </div>
            <label className="mt-3.5 block cursor-pointer rounded-[18px] border-2 border-dashed border-[color-mix(in_srgb,#085eff_45%,transparent)] bg-[color-mix(in_srgb,#085eff_5%,transparent)] p-6 text-center text-[13.5px] text-muted-foreground transition-colors hover:bg-[color-mix(in_srgb,#085eff_12%,transparent)] hover:text-foreground">
              <Paperclip className="mx-auto mb-1 size-5" />
              Перетащите файлы или нажмите, чтобы прикрепить
              {/* TODO: загрузка файлов через API */}
              <input
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  setFiles([...files, ...[...(e.target.files ?? [])].map((f) => f.name)])
                  toast("Файлы прикреплены")
                }}
              />
            </label>
            {files.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {files.map((f, i) => (
                  <span key={i} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[var(--soft)] px-3 text-[12.5px]">
                    <Paperclip className="size-3.5" />
                    {f}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="sticky top-5 flex flex-col gap-3.5 max-[1100px]:static">
          <section className={card}>
            <h3 className="text-[17px] font-bold">Итого</h3>
            <div className="mt-2.5">
              {(
                [
                  ["Ежемесячно", monthly],
                  ["Единовременно", once],
                  ["Доп. затраты", extras],
                ] as const
              ).map(([t, v]) => (
                <Total key={t} t={t} v={`${fmt(v)} ₸`} />
              ))}
              <Total t="Скидка" v={`${discount ? "−" : ""}${fmt(discount)} ₸`} green />
              <Total t="НДС 12%" v={`${fmt(vat)} ₸`} />
              <div className="mt-1.5 flex items-end justify-between">
                <span className="text-[13px] text-muted-foreground">
                  Ожидаемая стоимость
                  <br />с НДС
                </span>
                <b className="text-[30px] font-semibold tracking-[-0.03em] tabular-nums">{fmt(total)} ₸</b>
              </div>
            </div>
          </section>
          <div
            className={cn(
              "flex gap-2.5 rounded-[14px] px-3.5 py-3 text-[13px] leading-[1.45]",
              over.length ? "bg-[rgba(255,159,10,0.12)] text-[#ff9f0a]" : "bg-[rgba(52,199,89,0.12)] text-[#34c759]"
            )}
          >
            {over.length ? <CircleAlert className="mt-px size-[18px] flex-none" /> : <CircleCheck className="mt-px size-[18px] flex-none" />}
            {over.length ? "Цена ниже прейскуранта. Нужно согласование скидки." : lines.length ? "КП может быть отправлено клиенту" : "Добавьте позиции"}
          </div>
          <div className="flex flex-col gap-2 [&>*]:h-[46px] [&>*]:justify-center">
            <Btn
              primary
              onClick={() => {
                if (!lines.length) return toast("Добавьте хотя бы одну позицию")
                const id = save()
                toast(`КП № ${id} сохранено`)
              }}
            >
              <Save />
              Сохранить КП
            </Btn>
            {over.length > 0 && (
              <Btn
                className="border-[#ff9f0a] text-[#ff9f0a]"
                onClick={() => {
                  if (!comment.trim()) return toast("Укажите комментарий по скидке")
                  const id = save()
                  rowsStore.save(DISCOUNTS, { id, cs: +cs, u: client?.uid ?? "1", date, req: over.length, ok: 0, s: Math.round(full), es: Math.round(monthly + once), state: "new" as const })
                  toast("Запрос на скидку отправлен согласующему")
                  router.push(`/discount-requests/${id}`)
                }}
              >
                <Percent />
                Запрос на скидку
              </Btn>
            )}
            <Btn onClick={() => printOffer(+cs, lines, total)}>
              <Printer />
              Печать / PDF
            </Btn>
            <BtnLink href={`/contract-builder${savedId ? `?kp=${savedId}` : ""}`}>
              <Signature />
              Сформировать договор
            </BtnLink>
          </div>
        </aside>
      </div>

      <PricePicker open={picker} onOpenChange={setPicker} lines={lines} onToggle={toggle} />
    </div>
  )
}

function Seg({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-0.5 rounded-full bg-[var(--soft)] p-[3px]">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn("h-8 cursor-pointer rounded-full px-3.5 text-[13px] text-muted-foreground", value === o && "bg-card font-semibold text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.2)]")}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function Num({ value, onChange, w, warn }: { value: number; onChange: (v: number) => void; w: string; warn?: boolean }) {
  return (
    <GlassInput
      inputMode="decimal"
      value={String(value)}
      onChange={(e) => onChange(Math.max(0, +e.target.value.replace(",", ".") || 0))}
      className={cn("ml-auto h-9 rounded-[10px] px-2.5", w, warn && "ring-2 ring-[#ff9f0a]/60")}
      inputClassName="text-right text-sm tabular-nums"
    />
  )
}

function Total({ t, v, green }: { t: string; v: string; green?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-2.5 text-sm">
      <span className="text-muted-foreground">{t}</span>
      <b className={cn("font-semibold tabular-nums", green && "text-[#34c759]")}>{v}</b>
    </div>
  )
}

/** Окно прейскуранта: поиск, «Все / Ежемесячные / Единовременные», клик — добавить или убрать позицию. */
function PricePicker({ open, onOpenChange, lines, onToggle }: { open: boolean; onOpenChange: (o: boolean) => void; lines: Line[]; onToggle: (p: CatalogItem) => void }) {
  const [q, setQ] = useState("")
  const [t, setT] = useState("Все")
  const needle = q.trim().toLowerCase()
  const found = PRICE.filter((p) => (t === "Все" || (t === "Ежемесячные") === p.mon) && (!needle || `${p.d} ${p.sv} ${p.pos}`.toLowerCase().includes(needle))).slice(0, 120)
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (o) setQ("")
        onOpenChange(o)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-[rgba(5,6,9,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[8vh] left-1/2 z-[111] flex max-h-[80vh] w-[min(860px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-[26px] border border-border bg-background shadow-[0_30px_80px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">Прейскурант</Dialog.Title>
          <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-5 py-[18px]">
            <GlassInput
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск услуги: интернет, VPN, телефония…"
              startIcon={<Search />}
              className="h-11 min-w-[200px] flex-1 rounded-full px-4 text-foreground"
              inputClassName="text-sm"
            />
            <Seg value={t} options={["Все", "Ежемесячные", "Единовременные"]} onChange={setT} />
            <Dialog.Close className="grid size-10 place-items-center rounded-full border border-border bg-card" aria-label="Закрыть">
              <X className="size-[18px]" />
            </Dialog.Close>
          </div>
          <div className="overflow-auto p-2">
            {found.map((p) => {
              const added = lines.some((x) => x.id === p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggle(p)}
                  className="grid w-full cursor-pointer grid-cols-[70px_minmax(0,1fr)_auto_110px_40px] items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[13.5px] hover:bg-[var(--soft)] max-sm:grid-cols-[minmax(0,1fr)_auto_40px]"
                >
                  <span className="text-[12.5px] text-muted-foreground max-sm:hidden">{p.pos}</span>
                  <b className="leading-[1.35] font-medium">
                    {p.d}
                    <span className="block text-[12.5px] font-normal text-muted-foreground">
                      {p.sv} · {p.mon ? "ежемесячно" : "единовременно"}
                    </span>
                  </b>
                  <span className="text-[12.5px] text-muted-foreground max-sm:hidden">{p.ms}</span>
                  <span className="text-right font-semibold tabular-nums">{fmt(p.price)} ₸</span>
                  <span className={cn("grid size-8 place-items-center rounded-full text-white", added ? "bg-[#34c759]" : "bg-[#085eff]")}>{added ? "✓" : "+"}</span>
                </button>
              )
            })}
            {!found.length && <div className="p-8 text-center text-muted-foreground">Ничего не найдено</div>}
          </div>
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[13px] text-muted-foreground">
            Показано {found.length} из {PRICE.length} · добавлено {lines.length}
            <Dialog.Close asChild>
              <Btn primary>Готово</Btn>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Печатная форма — простая, до шаблона КП из API. */
function printOffer(cs: number, lines: Line[], total: number) {
  const w = window.open("", "_blank")
  if (!w) return toast("Разрешите всплывающие окна")
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)
  w.document.write(
    `<title>КП ${esc(counterpartyName(cs))}</title><body style="font-family:Inter,Arial;padding:40px;color:#111"><h2>Коммерческое предложение</h2>` +
      `<p>АО «QMobile» · ${new Date().toLocaleDateString("ru-RU")}<br>Клиент: <b>${esc(counterpartyName(cs))}</b> · БИН ${binOf(cs)}</p>` +
      `<table style="width:100%;border-collapse:collapse" border="1" cellpadding="8"><tr><th>Услуга</th><th>Кол-во</th><th>Цена</th><th>Скидка</th><th>Сумма</th></tr>` +
      lines.map((x) => `<tr><td>${esc(x.d)}</td><td>${x.qty}</td><td>${fmt(x.price)}</td><td>${x.disc}%</td><td>${fmt(lineSum(x))}</td></tr>`).join("") +
      `</table><h3>Итого с НДС: ${fmt(total)} ₸</h3>`
  )
  w.document.close()
  w.print()
}
