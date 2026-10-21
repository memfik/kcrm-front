import { Briefcase, Clock, Download, FilePlus, Phone, Users } from "lucide-react"
import { DateCell, Kv, Line, NameCell, Owner, Pill, Section, Status } from "@/components/list/cells"
import { CONTACT_NAMES, counterpartyName, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange } from "@/lib/period"

/*
 * 08 Лиды — входящие звонки колл-центра (Oktell). В копии базы таблица звонков пустая,
 * поэтому 240 звонков — детерминированный пример, как в макете. TODO: API Oktell.
 */

export type Lead = {
  id: number
  /** «YYYY-MM-DD HH:MM». */
  date: string
  tel: string
  cs: number
  topic: string
  kind: "ком" | "тех"
  ul: "ЮЛ" | "ФЛ"
  op: string
  /** Длительность, с. */
  dur: number
  /** Кому передан; "" — не назначен. */
  mgr: string
}

const TOPICS = ["Подключение интернета", "Стоимость услуг", "Перенос точки", "Техническая проблема", "Увеличение скорости", "IP-телефония", "Счёт и оплата", "Видеонаблюдение"]
const COMPANIES = [4187, 22513, 39542, 30535, 37944, 39252, 40840, 44570]
const p2 = (n: number) => String(n).padStart(2, "0")

const ALL: Lead[] = Array.from({ length: 240 }, (_, i) => {
  const id = 91000 + i * 7
  // по 6 звонков в день, от 31 марта 2018 назад
  const d = new Date(2018, 2, 31 - Math.floor(i / 6))
  return {
    id,
    date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(9 + (rnd(id, 1) % 9))}:${p2(rnd(id, 2) % 60)}`,
    tel: `+7 7${(rnd(id, 3) % 90) + 10} ${String(rnd(id, 4) % 1000).padStart(3, "0")} ${p2(rnd(id, 5) % 100)} ${p2(rnd(id, 6) % 100)}`,
    cs: COMPANIES[rnd(id, 7) % COMPANIES.length],
    topic: pick(TOPICS, id, 8),
    kind: rnd(id, 9) % 3 ? "ком" : "тех",
    ul: rnd(id, 10) % 4 ? "ЮЛ" : "ФЛ",
    op: CONTACT_NAMES[rnd(id, 11) % CONTACT_NAMES.length],
    dur: (rnd(id, 12) % 600) + 30,
    mgr: rnd(id, 13) % 3 ? STAFF[rnd(id, 14) % STAFF.length] : "",
  }
})

const KIND = { ком: "Коммерческий", тех: "Технический" }
const duration = (s: number) => `${Math.floor(s / 60)}:${p2(Math.round(s % 60))}`
const passed = (x: Lead) =>
  x.mgr ? <Owner name={managerName(x.mgr)} color={ownerColor(x.mgr)} /> : <Status text="Менеджер не назначен" color="#ff9f0a" />
const calls = (r: string[]) => ALL.filter((x) => inRange(x.date, r)).length
const opts = (list: string[]): Option[] => list.map((v) => ({ v, label: v }))
// Radix Select не принимает пустое значение — «не назначен» хранится как "" и выбирается как "none"
const managerOpts: Option[] = [{ v: "none", label: "Не назначен" }, ...STAFF.slice(0, 30).map((v) => ({ v, label: managerName(v) }))]

export const LEADS: ListConfig<Lead> = {
  key: "leads",
  title: "Лиды",
  crumb: "Продажи · Лиды колл-центра",
  icon: Phone,
  search: "Телефон, компания или тема",
  buttons: [
    { icon: FilePlus, label: "Новый лид", href: "/leads/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  foot: "лиды — пример данных: в копии базы таблица звонков пустая",
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.tel} ${counterpartyName(x.cs)} ${x.topic}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "n", t: "Не в работе", f: (x) => !x.mgr },
    { k: "c", t: "Коммерческие", f: (x) => x.kind === "ком" },
    { k: "t", t: "Технические", f: (x) => x.kind === "тех" },
  ],
  filters: [
    {
      k: "ul",
      t: "ЮЛ / ФЛ",
      get: (x) => x.ul,
      opts: [
        { v: "ЮЛ", label: "Юридические лица" },
        { v: "ФЛ", label: "Физические лица" },
      ],
    },
    { k: "topic", t: "Тема", get: (x) => x.topic, opts: opts(TOPICS) },
  ],
  sort: ["date", -1],
  cols: [
    { k: "date", t: "Звонок", date: true, value: (x) => x.date, render: (x) => <NameCell icon={Phone} name={x.tel} sub={`ID вызова ${x.id}`} /> },
    { k: "date2", t: "Дата", value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "cs", t: "Компания", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "topic", t: "Тема обращения", value: (x) => x.topic, render: (x) => x.topic },
    { k: "kind", t: "Характер", value: (x) => KIND[x.kind], render: (x) => <Pill>{KIND[x.kind]}</Pill> },
    { k: "op", t: "Оператор", value: (x) => x.op, render: (x) => x.op },
    { k: "dur", t: "Длит.", num: true, value: (x) => x.dur, render: (x) => duration(x.dur) },
    { k: "mgr", t: "Передан", value: (x) => (x.mgr ? managerName(x.mgr) : ""), render: passed },
  ],
  owner: { t: "Передан", get: (x) => x.mgr, name: managerName, render: passed, set: (x, mgr) => ({ ...x, mgr }) },
  kpis: (r) => [
    // в примере данных нет прошлого периода — сравнение условное, как в макете
    { t: "Звонков", icon: Phone, c: calls(r), p: Math.round(calls(r) * 0.86) },
    { t: "Передано менеджерам", icon: Users, c: ALL.filter((x) => x.mgr).length, note: `из ${ALL.length}` },
    { t: "Не в работе", icon: Clock, c: ALL.filter((x) => !x.mgr).length, note: "нужно распределить" },
    { t: "Средняя длительность", icon: Clock, c: ALL.reduce((a, x) => a + x.dur, 0) / ALL.length, f: duration },
  ],
  sub: () => "Входящие звонки колл-центра (Oktell). Коммерческие обращения передаются менеджерам.",
  cardStatus: "mgr",
  record: (x) => {
    const details = [
      { t: "Компания", v: counterpartyName(x.cs), wide: true },
      { t: "Контакт", v: CONTACT_NAMES[rnd(x.id, 20) % CONTACT_NAMES.length] },
      { t: "Классификация", v: `${KIND[x.kind]} характер` },
      { t: "Оператор", v: x.op },
      { t: "Длительность", v: `${Math.floor(x.dur / 60)} мин ${x.dur % 60} с` },
      { t: "Тема", v: x.topic, wide: true },
    ]
    return {
      title: `Звонок ${x.tel}`,
      meta: [
        <span key="d" className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
          <DateCell d={x.date} />
        </span>,
        ...[x.ul, x.topic].map((t) => (
          <span key={t} className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
            {t}
          </span>
        )),
      ],
      actions: [
        { icon: Users, label: "Передать менеджеру", delegate: true },
        { icon: Briefcase, label: "Создать сделку", href: `/deals/new?lead=${x.id}` },
        { icon: Phone, label: "Перезвонить", href: "/calls" },
      ],
      stats: [
        { t: "Длительность", v: duration(x.dur) },
        { t: "Характер", v: KIND[x.kind] },
        { t: "Клиент", v: x.ul === "ЮЛ" ? "Юр. лицо" : "Физ. лицо" },
      ],
      facts: details.filter((d) => d.t !== "Тема"),
      tabs: [
        {
          t: "Детали",
          body: (
            <>
              <Section title="Обращение">
                <Kv items={details} />
              </Section>
              <Section title="Запись разговора">
                {/* TODO: запись из Oktell */}
                <Line icon={Phone}>
                  <b>Запись {x.id}.mp3</b>
                  <span className="flex-1" />
                  <span className="text-[12.5px] text-muted-foreground tabular-nums">{duration(x.dur)}</span>
                </Line>
              </Section>
            </>
          ),
        },
      ],
    }
  },
  name: (x) => `Звонок ${x.tel}`,
  // дата — при сохранении (сейчас), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, date: "", tel: "", cs: 0, topic: TOPICS[0], kind: "ком", ul: "ЮЛ", op: "", dur: 0, mgr: "" }),
  fields: [
    { k: "tel", t: "Телефон", type: "text", required: true, get: (x) => x.tel, set: (x, v) => ({ ...x, tel: v.trim(), date: x.date || new Date().toISOString().slice(0, 16).replace("T", " ") }) },
    { k: "cs", t: "ID компании", type: "number", get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "topic", t: "Тема обращения", type: "select", opts: opts(TOPICS), get: (x) => x.topic, set: (x, v) => ({ ...x, topic: v }) },
    {
      k: "kind",
      t: "Характер",
      type: "select",
      opts: [
        { v: "ком", label: "Коммерческий" },
        { v: "тех", label: "Технический" },
      ],
      get: (x) => x.kind,
      set: (x, v) => ({ ...x, kind: v as Lead["kind"] }),
    },
    {
      k: "ul",
      t: "ЮЛ / ФЛ",
      type: "select",
      opts: [
        { v: "ЮЛ", label: "Юридическое лицо" },
        { v: "ФЛ", label: "Физическое лицо" },
      ],
      get: (x) => x.ul,
      set: (x, v) => ({ ...x, ul: v as Lead["ul"] }),
    },
    { k: "op", t: "Оператор", type: "text", get: (x) => x.op, set: (x, v) => ({ ...x, op: v.trim() }) },
    { k: "mgr", t: "Передан", type: "select", opts: managerOpts, get: (x) => x.mgr || "none", set: (x, v) => ({ ...x, mgr: v === "none" ? "" : v }) },
  ],
}
