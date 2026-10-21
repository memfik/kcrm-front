"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Printer, Save, Signature, Upload } from "lucide-react"
import { DateField } from "@/components/list/date-field"
import { FormSelect } from "@/components/list/select"
import { Btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { GlassInput } from "@/components/ui/opaline/glass-input"
import { CATALOG_ITEMS } from "@/config/lists/catalog"
import { CONTRACTS } from "@/config/lists/contracts"
import { OFFERS_LIST } from "@/config/lists/offers"
import { binOf, counterpartyName, rnd } from "@/lib/demo-names"
import { rowsStore } from "@/lib/list/store"
import { fmt } from "@/lib/period"
import { cn } from "@/lib/utils"

/*
 * 30 Конструктор договора: документ собирается из КП — платежи, реквизиты, подписанты; текст правится прямо на листе.
 * ?kp=<id> — договор из этого КП. Сохранение — в «Договоры» (25) в памяти вкладки. TODO: API, шаблоны из СЭД, LD.
 */

type Lang = "ru" | "kz" | "both"
type Item = { d: string; ms: string; mon: boolean; q: number; pr: number }

const TYPES = [
  { v: "in-new", label: "Доходный · Новый", t: 1, cust: false },
  { v: "in-old", label: "Доходный · Существующий", t: 1, cust: true },
  { v: "out", label: "Расходный", t: 2, cust: false },
  { v: "mix", label: "Доходно-расходный", t: 3, cust: false },
]
const TEMPLATES = ["Договор на услуги связи (B2B)", "Договор с гос. учреждением (B2G)", "Доп. соглашение"]
const OPERATOR_SIGNERS = [
  { v: "Сапаров Д.А.", label: "Директор филиала — Сапаров Д.А." },
  { v: "Ахметова Г.Б.", label: "Директор ДКП — Ахметова Г.Б." },
]

const card = "rounded-3xl border border-border bg-card px-6 py-[22px] shadow-[var(--panel-shadow)] max-sm:rounded-[20px] max-sm:px-4"
const lbl = "flex flex-col gap-1.5 text-[12.5px] text-muted-foreground"
const field = "h-11 rounded-xl px-3.5 text-foreground"

export function ContractBuilder() {
  const router = useRouter()
  const params = useSearchParams()
  const doc = useRef<HTMLDivElement>(null)
  // КП с контрагентом и суммой — основа договора (как в макете, первые 80)
  const offers = useMemo(() => rowsStore.all(OFFERS_LIST).filter((o) => o.cs && o.s > 0).slice(0, 80), [])
  const fromQuery = params.get("kp") ? rowsStore.find(OFFERS_LIST, +params.get("kp")!) : undefined
  const list = fromQuery && !offers.includes(fromQuery) ? [fromQuery, ...offers] : offers

  const [kp, setKp] = useState(String(fromQuery?.id ?? list[0]?.id ?? ""))
  const [lang, setLang] = useState<Lang>("ru")
  const [num, setNum] = useState("412/КД-2018")
  const [date, setDate] = useState("2018-03-16")
  const [type, setType] = useState(TYPES[0].v)
  const [tpl, setTpl] = useState(TEMPLATES[0])
  const [sg1, setSg1] = useState(OPERATOR_SIGNERS[0].v)
  const [sg2, setSg2] = useState("Нурланов Ержан Касымович")
  const [sg2p, setSg2p] = useState("Директор")

  const offer = list.find((o) => String(o.id) === kp)
  const cs = offer?.cs ?? 0
  const items: Item[] = offer
    ? Array.from({ length: Math.max(2, Math.min(5, offer.n || 2)) }, (_, k) => {
        const p = CATALOG_ITEMS[rnd(offer.id, k + 3) % CATALOG_ITEMS.length]
        return { d: p.d.slice(0, 80), ms: p.ms === "—" ? "шт" : p.ms, mon: p.mon, q: (rnd(offer.id, k + 9) % 3) + 1, pr: p.price || 1000 }
      })
    : []
  const when = new Date(`${date}T00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })

  const save = () => {
    if (!offer) return toast("Выберите КП")
    const t = TYPES.find((x) => x.v === type)!
    const id = rowsStore.nextId(CONTRACTS)
    rowsStore.save(CONTRACTS, { id, num: num.trim() || "б/н", cs, deal: offer.deal, u: offer.u, t: t.t, date, cust: t.cust })
    toast(`Договор № ${num} сохранён`)
    router.push(`/contracts/${id}`)
  }

  const print = () => {
    const w = window.open("", "_blank")
    if (!w || !doc.current) return toast("Разрешите всплывающие окна")
    w.document.write(`<title>Договор № ${num}</title><style>${PRINT_CSS}</style><body>${doc.current.innerHTML}</body>`)
    w.document.close()
    w.print()
  }

  // текст на листе правится прямо в документе (contentEditable)
  const edit = { contentEditable: true, suppressContentEditableWarning: true }
  const ru = (
    <div>
      <h2>
        ДОГОВОР № <span {...edit}>{num}</span>
      </h2>
      <div className="c">на оказание услуг связи</div>
      <p className="flex justify-between">
        <span>г. Астана</span>
        <span>{when}</span>
      </p>
      <p {...edit}>
        <b>АО «QMobile»</b>, именуемое в дальнейшем «Оператор», в лице {sg1}, действующего на основании доверенности, с одной стороны, и <b>{counterpartyName(cs)}</b>,
        именуемое в дальнейшем «Абонент», в лице {sg2p.toLowerCase()}а {sg2}, с другой стороны, заключили настоящий Договор о нижеследующем:
      </p>
      <h4>1. Предмет договора</h4>
      <p {...edit}>
        Оператор оказывает Абоненту услуги связи согласно Приложению № 1, а Абонент обязуется принимать и оплачивать услуги в порядке и сроки, установленные Договором.
      </p>
      <PaymentsTable rows={items.filter((i) => i.mon)} title="2. Ежемесячные платежи, тенге" />
      <PaymentsTable rows={items.filter((i) => !i.mon)} title="3. Единовременные платежи, тенге" />
      <h4>4. Срок действия</h4>
      <p {...edit}>
        Договор вступает в силу с момента подписания и действует до <mark>31 декабря 2018 года</mark> с автоматической пролонгацией.
      </p>
    </div>
  )
  const kz = (
    <div className="kz">
      <h2>
        № <span>{num}</span> ШАРТ
      </h2>
      <div className="c">байланыс қызметтерін көрсетуге</div>
      <p {...edit}>
        Бұдан әрі «Оператор» деп аталатын <b>«QMobile» АҚ</b>, бір тараптан, және бұдан әрі «Абонент» деп аталатын <b>{counterpartyName(cs)}</b>, екінші тараптан, осы
        Шартты төмендегілер туралы жасасты:
      </p>
      <h4>1. Шарттың мәні</h4>
      <p {...edit}>Оператор Абонентке №1 Қосымшаға сәйкес байланыс қызметтерін көрсетеді.</p>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-[1760px] px-[34px] pb-10 max-sm:px-3">
      <section className="rise pt-1.5 pb-4">
        <p className="flex items-center gap-2 text-sm text-[#085eff] dark:text-[#9db8ff]">
          <Signature className="size-4" />
          <Link href="/contracts">Справочники · Договоры</Link> · Конструктор
        </p>
        <h1 className="mt-1.5 text-[34px] leading-[1.1] font-medium tracking-[-0.025em] max-sm:text-[26px]">Договор № {num}</h1>
        <p className="mt-1.5 max-w-[760px] text-sm text-muted-foreground">
          Документ собирается из коммерческого предложения: платежи, реквизиты и подписанты. Текст в документе можно править прямо на листе.
        </p>
      </section>

      <div className="grid grid-cols-[380px_minmax(0,1fr)] items-start gap-[18px] max-[1100px]:grid-cols-1">
        <aside className="flex flex-col gap-[18px]">
          <section className={card}>
            <h3 className="mb-3.5 text-[17px] font-bold">Основа</h3>
            <div className="flex flex-col gap-3">
              <div className={lbl}>
                Коммерческое предложение
                <FormSelect
                  value={kp}
                  onChange={setKp}
                  aria-label="Коммерческое предложение"
                  options={list.map((o) => ({ v: String(o.id), label: `КП № ${o.id} · ${counterpartyName(o.cs)} · ${fmt(o.s)} ₸` }))}
                />
              </div>
              <div className="flex gap-0.5 rounded-full bg-[var(--soft)] p-[3px]">
                {(
                  [
                    ["ru", "Русский"],
                    ["kz", "Қазақша"],
                    ["both", "Оба"],
                  ] as const
                ).map(([k, t]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLang(k)}
                    className={cn("h-8 flex-1 cursor-pointer rounded-full text-[13px] text-muted-foreground", lang === k && "bg-card font-semibold text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.2)]")}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <label className={lbl}>
                  Номер договора
                  <GlassInput value={num} onChange={(e) => setNum(e.target.value)} className={field} inputClassName="text-sm" />
                </label>
                <div className={lbl}>
                  Дата
                  <DateField value={date} onChange={setDate} />
                </div>
              </div>
              <div className={lbl}>
                Тип договора
                <FormSelect value={type} onChange={setType} options={TYPES} aria-label="Тип договора" />
              </div>
              <div className={lbl}>
                Шаблон
                {/* TODO: шаблоны договоров — разный текст для B2B / B2G / доп. соглашения */}
                <FormSelect value={tpl} onChange={setTpl} options={TEMPLATES.map((v) => ({ v, label: v }))} aria-label="Шаблон" />
              </div>
            </div>
          </section>
          <section className={card}>
            <h3 className="mb-3.5 text-[17px] font-bold">Подписанты</h3>
            <div className="flex flex-col gap-3">
              <div className={lbl}>
                От оператора
                <FormSelect value={sg1} onChange={setSg1} options={OPERATOR_SIGNERS} aria-label="От оператора" />
              </div>
              <label className={lbl}>
                От клиента (ФИО)
                <GlassInput value={sg2} onChange={(e) => setSg2(e.target.value)} className={field} inputClassName="text-sm" />
              </label>
              <label className={lbl}>
                Должность
                <GlassInput value={sg2p} onChange={(e) => setSg2p(e.target.value)} className={field} inputClassName="text-sm" />
              </label>
            </div>
          </section>
          <section className={cn(card, "flex flex-col gap-2 [&>*]:h-[46px] [&>*]:justify-center")}>
            <h3 className="mb-1.5 text-[17px] font-bold">Действия</h3>
            <Btn primary onClick={save}>
              <Save />
              Сохранить договор
            </Btn>
            {/* TODO: создание договора в LD */}
            <Btn onClick={() => toast("Создание договора в LD — после подключения API")}>
              <Upload />
              Создать договор в LD
            </Btn>
            <Btn onClick={print}>
              <Printer />
              Печать / PDF
            </Btn>
          </section>
        </aside>

        <div className="overflow-auto rounded-3xl bg-[var(--soft)] p-7 max-sm:bg-transparent max-sm:p-0">
          {/* key: при смене любого поля лист собирается заново (правки на листе сбрасываются, как в макете) —
              иначе React столкнётся с текстом, изменённым вручную в contentEditable */}
          <div
            ref={doc}
            key={[kp, lang, tpl, num, date, sg1, sg2, sg2p].join("|")}
            className="contract-doc mx-auto max-w-[860px] rounded-md bg-white px-16 py-14 text-[14px] leading-[1.55] text-[#111] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] max-sm:px-5 max-sm:py-7"
          >
            {lang === "ru" ? ru : lang === "kz" ? kz : <div className="two">{kz}{ru}</div>}
            <h4>{lang === "kz" ? "Тараптардың деректемелері" : "Реквизиты сторон"}</h4>
            <div className="two">
              <div>
                <b>Оператор:</b>
                <br />
                АО «QMobile»
                <br />
                БИН 990740000683
                <br />
                ИИК KZ75 6010 0000 0000 1234
                <br />
                БИК HSBKKZKX, КБЕ 17
                <br />
                <br />
                _______________ / {sg1} /
              </div>
              <div>
                <b>Абонент:</b>
                <br />
                {counterpartyName(cs)}
                <br />
                БИН {binOf(cs)}
                <br />
                ИИК KZ{String(rnd(cs, 51)).padStart(10, "0").slice(0, 10)} {String(rnd(cs, 52)).slice(0, 8)}
                <br />
                КБЕ 17
                <br />
                <br />
                _______________ / {sg2} /
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


/** Таблица платежей листа: позиции, сумма и НДС 12%, итог. */
function PaymentsTable({ rows, title }: { rows: Item[]; title: string }) {
  if (!rows.length) return null
  return (
    <>
      <h4>{title}</h4>
      <table>
        <tbody>
          <tr>
            <th>№</th>
            <th>Услуга</th>
            <th>Ед.</th>
            <th>Кол-во</th>
            <th className="r">Цена</th>
            <th className="r">Сумма</th>
            <th className="r">НДС 12%</th>
          </tr>
          {rows.map((i, j) => (
            <tr key={j}>
              <td>{j + 1}</td>
              <td>{i.d}</td>
              <td>{i.ms}</td>
              <td>{i.q}</td>
              <td className="r">{fmt(i.pr)}</td>
              <td className="r">{fmt(i.pr * i.q)}</td>
              <td className="r">{fmt(i.pr * i.q * 0.12)}</td>
            </tr>
          ))}
          <tr>
            <th colSpan={5}>ИТОГО</th>
            <th className="r">{fmt(rows.reduce((s, i) => s + i.pr * i.q, 0))}</th>
            <th className="r">{fmt(rows.reduce((s, i) => s + i.pr * i.q * 0.12, 0))}</th>
          </tr>
        </tbody>
      </table>
    </>
  )
}

/** Стили листа для окна печати (те же, что у .contract-doc в globals.css). */
const PRINT_CSS = `body{font-family:"Times New Roman",Georgia,serif;font-size:14px;line-height:1.55;color:#111;padding:40px}
h2{text-align:center;font-size:17px;margin:0 0 4px}.c{text-align:center}h4{font-size:14px;margin:18px 0 6px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:24px}.kz{color:#444}.flex{display:flex}.justify-between{justify-content:space-between}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}td,th{border:1px solid #999;padding:6px 8px;text-align:left}th{background:#f1f3f7}.r{text-align:right}
mark{background:#fff3b0;padding:0 2px}`
