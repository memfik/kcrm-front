import { ChartColumn, CircleCheck, CircleDollarSign, CircleX, Download, FilePlus, Gavel, Send, Users } from "lucide-react"
import { DateCell, Kv, MiniTable, NameCell, Owner, Section, Status } from "@/components/list/cells"
import { CITY, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange, money } from "@/lib/period"

/*
 * 20 Тендеры — объявления госзакупок, решения об участии, заявки, лоты и итоги.
 * В копии базы таблицы тендеров нет — 140 закупок, как в макете. TODO: API, автораспределение по менеджерам.
 */

type Decision = "yes" | "no" | "none"

export type Tender = {
  id: number
  num: string
  name: string
  /** Заказчик. */
  org: string
  /** Способ закупки. */
  sp: string
  /** Срок решения об участии и дата вскрытия. */
  date: string
  open: string
  u: string
  lots: number
  budget: number
  dec: Decision
  /** Заявка: «Подана», «Не подана» или «—». */
  sub: string
  tv: boolean
  /** Итог: победа / проигрыш / "" — итогов нет. */
  res: "" | "win" | "lose"
  /** ТК / ТО / СИ. */
  ks: string
}

const METHODS = ["Открытый конкурс", "Запрос ценовых предложений", "Из одного источника", "Электронные закупки", "Аукцион"]
const ORGS = [
  "ГУ «Управление цифровизации г. Астаны»",
  "АО «КазМунайГаз»",
  "АО «Казахтелеком»",
  "ГУ «Аппарат акима Карагандинской обл.»",
  "РГП «Казгидромет»",
  "АО «НК КТЖ»",
  "ГУ «Управление образования г. Алматы»",
  "АО «Самрук-Энерго»",
  "ТОО «Тенгизшевройл»",
  "АО «KEGOC»",
]
const SUBJECTS = ["Услуги доступа к сети Интернет", "Аренда каналов связи", "Услуги IP-VPN", "Услуги телефонной связи", "Организация видеоконференцсвязи", "Услуги ЦОД", "Аренда волокон ВОЛС"]
const DECISION: Record<Decision, [string, string]> = {
  yes: ["Участвуем", "#34c759"],
  no: ["Не участвуем", "#ff375f"],
  none: ["Решение не принято", "#ff9f0a"],
}
const p2 = (n: number) => String(n).padStart(2, "0")
const iso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`

const ALL: Tender[] = Array.from({ length: 140 }, (_, i) => {
  const id = 8800 + i
  // по 2 объявления в день, от 30 марта 2018 назад; вскрытие — через 5–24 дня
  const day = 30 - Math.floor(i / 2)
  const s = rnd(id, 1) % 10
  return {
    id,
    num: `№${(rnd(id, 2) % 9000000) + 1000000}`,
    name: pick(SUBJECTS, id, 3),
    org: pick(ORGS, id, 4),
    sp: pick(METHODS, id, 5),
    date: iso(new Date(2018, 2, day)),
    open: iso(new Date(2018, 2, day + (rnd(id, 6) % 20) + 5)),
    u: STAFF[rnd(id, 7) % STAFF.length],
    lots: (rnd(id, 8) % 5) + 1,
    budget: ((rnd(id, 9) % 900) + 30) * 100000,
    dec: s < 4 ? "yes" : s < 6 ? "no" : "none",
    sub: s < 3 ? "Подана" : s < 4 ? "Не подана" : "—",
    tv: rnd(id, 10) % 3 !== 0,
    res: s < 1 ? "win" : s < 3 ? "lose" : "",
    ks: pick(["ТК", "ТО", "СИ"], id, 11),
  }
})

const tenge = (n: number) => `${money(n)} ₸`
const decision = (x: Tender) => <Status text={DECISION[x.dec][0]} color={DECISION[x.dec][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const announced = (r: string[]) => ALL.filter((x) => inRange(x.date, r)).length
const opts = (list: string[]): Option[] => list.map((v) => ({ v, label: v }))
const managerOpts: Option[] = STAFF.slice(0, 30).map((v) => ({ v, label: managerName(v) }))
const submitted = ALL.filter((x) => x.sub === "Подана").length

export const TENDERS: ListConfig<Tender> = {
  key: "tenders",
  title: "Тендеры",
  crumb: "Тендеры · Госзакупки",
  icon: Gavel,
  search: "Наименование, номер закупки или организатор",
  foot: "тендеры — пример данных: в копии базы таблицы тендеров нет",
  buttons: [
    { icon: FilePlus, label: "Новый тендер", href: "/tenders/new" },
    { icon: ChartColumn, label: "Отчёты", href: "/tender-reports" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.name} ${x.num} ${x.org}`,
  tabs: [
    { k: "ann", t: "Объявления", f: (x) => x.dec === "none" },
    { k: "w", t: "Не отработанные", f: (x) => x.dec === "yes" && x.sub === "—" },
    { k: "s", t: "Подана заявка", f: (x) => x.sub === "Подана" },
    { k: "r", t: "Отказ от участия", f: (x) => x.dec === "no" },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "sp", t: "Способ закупки", get: (x) => x.sp, opts: opts(METHODS) },
    { k: "ks", t: "ТК / ТО / СИ", get: (x) => x.ks, opts: opts(["ТК", "ТО", "СИ"]) },
  ],
  sort: ["date", -1],
  cols: [
    { k: "name", t: "Закупка", value: (x) => x.name, render: (x) => <NameCell icon={Gavel} name={x.name} sub={`${x.num} · ${x.sp}`} /> },
    { k: "org", t: "Заказчик", value: (x) => x.org, render: (x) => <b className="font-semibold">{x.org}</b> },
    { k: "date", t: "Дата", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "open", t: "Вскрытие", value: (x) => x.open, render: (x) => <DateCell d={x.open} /> },
    { k: "budget", t: "Бюджет", num: true, value: (x) => x.budget, render: (x) => tenge(x.budget) },
    { k: "u", t: "Ответственный", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "dec", t: "Решение", value: (x) => DECISION[x.dec][0], render: decision },
    { k: "tv", t: "ТВ/ТР", value: (x) => (x.tv ? "Есть" : "Нет"), render: (x) => (x.tv ? <Status text="Есть" color="#34c759" /> : <Status text="Нет" color="#8a93a6" />) },
  ],
  owner: { t: "Ответственный", get: (x) => x.u, name: managerName, render: (x) => owner(x.u), set: (x, u) => ({ ...x, u }) },
  kpis: (r) => [
    // в примере данных нет прошлого периода — сравнение условное, как в макете
    { t: "Объявлений", icon: Gavel, c: announced(r), p: Math.round(announced(r) * 1.15) },
    { t: "Подано заявок", icon: Send, c: submitted, p: submitted - 3 },
    { t: "Выиграно", icon: CircleCheck, c: ALL.filter((x) => x.res === "win").length, note: `из ${ALL.filter((x) => x.res).length} с итогами` },
    { t: "Бюджет в работе", icon: CircleDollarSign, c: ALL.filter((x) => x.dec === "yes").reduce((a, x) => a + x.budget, 0), f: tenge },
  ],
  sub: () => "Объявления госзакупок, решения об участии, заявки, лоты и итоги. Тендеры распределяются по менеджерам автоматически.",
  cardStatus: "dec",
  record: (x) => {
    const info = [
      { t: "Наименование", v: x.name, wide: true },
      { t: "Номер закупки", v: x.num },
      { t: "Способ закупки", v: x.sp },
      { t: "Заказчик", v: x.org, wide: true },
      { t: "Дата вскрытия", v: <DateCell d={x.open} /> },
      { t: "Срок решения об участии", v: <DateCell d={x.date} /> },
      { t: "ТК / ТО / СИ", v: x.ks },
      { t: "Ответственный ДРТП", v: managerName(x.u) },
    ]
    return {
      title: x.name,
      meta: (
        <>
          {decision(x)}
          {[x.num, x.org].map((t) => (
            <span key={t} className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
              {t}
            </span>
          ))}
        </>
      ),
      actions: [
        { icon: CircleCheck, label: "Участвуем", apply: () => ({ ...x, dec: "yes" as Decision }) },
        { icon: CircleX, label: "Не участвуем", apply: () => ({ ...x, dec: "no" as Decision, sub: "—" }) },
        { icon: Users, label: "Делегировать", delegate: true },
      ],
      stats: [
        { t: "Бюджет", v: tenge(x.budget) },
        { t: "Лотов", v: x.lots },
        { t: "Вскрытие", v: <DateCell d={x.open} /> },
        { t: "Заявка", v: x.sub },
      ],
      facts: info.filter((i) => !i.wide),
      tabs: [
        {
          t: "Тендер",
          body: (
            <Section title="Закупка">
              <Kv items={info} />
            </Section>
          ),
        },
        {
          t: "Лоты",
          body: (
            <Section title="Лоты">
              <MiniTable
                head={[{ t: "Лот" }, { t: "Бюджет", right: true }, { t: "Место поставки" }]}
                rows={Array.from({ length: x.lots }, (_, k) => [`Лот ${k + 1}`, tenge(x.budget / x.lots), pick(CITY, x.id, 20 + k)])}
              />
            </Section>
          ),
        },
        {
          t: "Итоги",
          body: (
            <Section title="Итоги закупки">
              {x.res ? (
                <Kv
                  items={[
                    { t: "Результат", v: x.res === "win" ? <Status text="Победа" color="#34c759" /> : <Status text="Проигрыш" color="#ff375f" /> },
                    { t: "Наша цена", v: tenge(x.budget * 0.92) },
                    { t: "Цена победителя", v: tenge(x.budget * (x.res === "win" ? 0.92 : 0.85)) },
                    { t: "Причина", v: x.res === "win" ? "—" : "По ценовой части" },
                  ]}
                />
              ) : (
                <span className="text-sm text-muted-foreground">Итогов пока нет</span>
              )}
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => `${x.name} ${x.num}`,
  blank: () => ({
    id: 0, num: "", name: "", org: ORGS[0], sp: METHODS[0], date: "2018-03-30", open: "2018-04-15", u: managerOpts[0].v,
    lots: 1, budget: 0, dec: "none", sub: "—", tv: false, res: "", ks: "ТК",
  }),
  fields: [
    { k: "name", t: "Наименование", type: "text", required: true, wide: true, get: (x) => x.name, set: (x, v) => ({ ...x, name: v.trim() }) },
    { k: "num", t: "Номер закупки", type: "text", get: (x) => x.num, set: (x, v) => ({ ...x, num: v.trim() }) },
    { k: "sp", t: "Способ закупки", type: "select", opts: opts(METHODS), get: (x) => x.sp, set: (x, v) => ({ ...x, sp: v }) },
    { k: "org", t: "Заказчик", type: "text", wide: true, get: (x) => x.org, set: (x, v) => ({ ...x, org: v.trim() }) },
    { k: "date", t: "Срок решения об участии", type: "date", get: (x) => x.date, set: (x, v) => ({ ...x, date: v || x.date }) },
    { k: "open", t: "Дата вскрытия", type: "date", get: (x) => x.open, set: (x, v) => ({ ...x, open: v || x.open }) },
    { k: "budget", t: "Бюджет, ₸", type: "number", get: (x) => (x.budget ? String(x.budget) : ""), set: (x, v) => ({ ...x, budget: +v || 0 }) },
    { k: "lots", t: "Лотов", type: "number", get: (x) => String(x.lots), set: (x, v) => ({ ...x, lots: +v || 1 }) },
    { k: "ks", t: "ТК / ТО / СИ", type: "select", opts: opts(["ТК", "ТО", "СИ"]), get: (x) => x.ks, set: (x, v) => ({ ...x, ks: v }) },
    { k: "u", t: "Ответственный", type: "select", opts: managerOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
  ],
}
