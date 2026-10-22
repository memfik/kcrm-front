import Link from "next/link"
import { Box, Clock, Eye, FilePlus, FileText, Send } from "lucide-react"
import { DateCell, Kv, MiniTable, NameCell, Pill, Section, Status } from "@/components/list/cells"
import requests from "@/data/tech-requests-demo.json"
import { counterpartyName, fixClient, managerName, pick, rnd } from "@/lib/demo-names"
import { BRANCHES } from "@/lib/dippp"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange } from "@/lib/period"

/*
 * 14 Акты монтажа и демонтажа — по наряду, с отправкой на подпись в СЭДО.
 * В копии базы актов монтажа нет — 90 актов собраны из нарядов, как в макете. TODO: API, интеграция с СЭДО.
 */

export type InstallAct = {
  id: number
  /** № наряда. */
  wo: string
  cs: number
  u: string
  date: string
  kind: string
  br: string
  /** Единиц оборудования. */
  eq: number
  /** Отправлен в СЭДО. */
  sent: boolean
}

const KINDS = ["Монтаж", "Демонтаж", "Модернизация"]
const EQUIPMENT = ["Маршрутизатор MikroTik hEX", "Коммутатор D-Link DGS-1100", "Медиаконвертер", "ИБП APC 650"]
const p2 = (n: number) => String(n).padStart(2, "0")

const ALL: InstallAct[] = Array.from({ length: 90 }, (_, i) => {
  const wid = 4100 + i
  const t = requests.rows[i % requests.rows.length]
  // по 2 акта в день, от 30 марта 2018 назад
  const d = new Date(2018, 2, 30 - Math.floor(i / 2))
  return {
    id: 500 + i,
    wo: `Н-${18000 + i}`,
    cs: fixClient(t[3], +t[0] + i),
    u: t[5],
    date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
    kind: pick(KINDS, wid, 1),
    br: pick(BRANCHES, wid, 2),
    eq: (rnd(wid, 3) % 4) + 1,
    sent: rnd(wid, 4) % 4 !== 0,
  }
})

const sedo = (x: InstallAct) => (x.sent ? <Status text="Отправлен" color="#34c759" /> : <Status text="Черновик" color="#8a93a6" />)
const made = (r: string[]) => ALL.filter((x) => inRange(x.date, r)).length
const opts = (list: string[]): Option[] => list.map((v) => ({ v, label: v }))
const staffOpts: Option[] = [...new Set(ALL.map((x) => x.u))].map((v) => ({ v, label: managerName(v) }))
/** Номер наряда «Н-18003» → его ID в «Нарядах». */
const woId = (wo: string) => +wo.slice(2) - 18000 + 4100

export const INSTALL_ACTS: ListConfig<InstallAct> = {
  key: "install-acts",
  title: "Акты монтажа и демонтажа",
  crumb: "Заявки · Акты в СЭДО",
  icon: FileText,
  search: "№ наряда или контрагент",
  foot: "пример данных: в копии базы актов монтажа нет",
  buttons: [
    { icon: FilePlus, label: "Создать акт", href: "/install-acts/new" },
    { icon: Send, label: "Отправить в СЭДО", onClick: "bulk" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.wo} ${counterpartyName(x.cs)}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "s", t: "Отправлены в СЭДО", f: (x) => x.sent },
    { k: "d", t: "Черновики", f: (x) => !x.sent },
  ],
  sort: ["date", -1],
  cols: [
    { k: "id", t: "Акт", value: (x) => x.id, render: (x) => <NameCell icon={FileText} name={`Акт № ${x.id}`} sub={x.kind} /> },
    { k: "wo", t: "Наряд", value: (x) => x.wo, render: (x) => x.wo },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "br", t: "Филиал", value: (x) => x.br, render: (x) => <Pill>{x.br}</Pill> },
    { k: "eq", t: "Оборудование", num: true, value: (x) => x.eq, render: (x) => `${x.eq} ед.` },
    { k: "date", t: "Дата", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "sent", t: "СЭДО", value: (x) => (x.sent ? "Отправлен" : "Черновик"), render: sedo },
  ],
  kpis: (r) => [
    // в примере данных нет прошлого периода — сравнение условное, как в макете
    { t: "Актов", icon: FileText, c: made(r), p: made(r) + 3 },
    { t: "Отправлено в СЭДО", icon: Send, c: ALL.filter((x) => x.sent).length },
    { t: "Черновики", icon: Clock, c: ALL.filter((x) => !x.sent).length },
    { t: "Единиц оборудования", icon: Box, c: ALL.reduce((a, x) => a + x.eq, 0) },
  ],
  sub: () => "Создание актов монтажа, демонтажа и модернизации по наряду и отправка на подпись в СЭДО.",
  bulk: {
    done: "Отправлено в СЭДО",
    run: (rows) => {
      // TODO: отправка в СЭДО через API
      const drafts = rows.filter((x) => !x.sent)
      drafts.forEach((x) => rowsStore.save(INSTALL_ACTS, { ...x, sent: true }))
      return () => drafts.forEach((x) => rowsStore.save(INSTALL_ACTS, x))
    },
  },
  cardStatus: "sent",
  record: (x) => {
    const signers = [
      { t: "Согласующий", v: managerName(String(+x.u + 2)) },
      { t: "Утверждающий", v: managerName(String(+x.u + 4)) },
      { t: "Получатели", v: managerName(x.u), wide: true },
    ]
    return {
      title: `Акт № ${x.id} · ${x.kind}`,
      meta: (
        <>
          {sedo(x)}
          <Pill>{x.br}</Pill>
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
            Наряд{" "}
            <Link href={`/work-orders/${woId(x.wo)}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
              {x.wo}
            </Link>
          </span>
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{counterpartyName(x.cs)}</span>
        </>
      ),
      actions: [
        ...(x.sent ? [] : [{ icon: Send, label: "Отправить в СЭДО", apply: () => ({ ...x, sent: true }) }]),
        // TODO: превью акта (PDF)
        { icon: Eye, label: "Просмотр" },
      ],
      stats: [
        { t: "Вид работ", v: x.kind },
        { t: "Оборудование", v: `${x.eq} ед.` },
        { t: "СЭДО", v: x.sent ? "Отправлен" : "Черновик" },
        { t: "Дата", v: <DateCell d={x.date} /> },
      ],
      facts: signers.filter((s) => !s.wide),
      tabs: [
        {
          t: "Оборудование",
          body: (
            <Section title="Таблица 1. Оборудование">
              <MiniTable
                head={[{ t: "Наименование" }, { t: "Инв. №" }, { t: "S/N" }, { t: "Кол-во" }]}
                rows={Array.from({ length: x.eq }, (_, k) => [
                  pick(EQUIPMENT, x.id, k),
                  (rnd(x.id, k + 10) % 900000) + 100000,
                  rnd(x.id, k + 20).toString(16).toUpperCase().slice(0, 8),
                  1,
                ])}
              />
            </Section>
          ),
        },
        {
          t: "Подписанты",
          body: (
            <Section title="Подписанты и исполнители">
              <Kv items={signers} />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => `Акт № ${x.id}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, wo: "", cs: 0, u: staffOpts[0].v, date: "", kind: KINDS[0], br: BRANCHES[0], eq: 1, sent: false }),
  fields: [
    { k: "wo", t: "№ наряда", type: "text", required: true, get: (x) => x.wo, set: (x, v) => ({ ...x, wo: v.trim(), date: x.date || new Date().toISOString().slice(0, 10) }) },
    { k: "cs", t: "ID контрагента", type: "number", get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "br", t: "Филиал", type: "select", opts: opts(BRANCHES), get: (x) => x.br, set: (x, v) => ({ ...x, br: v }) },
    { k: "eq", t: "Единиц оборудования", type: "number", get: (x) => String(x.eq), set: (x, v) => ({ ...x, eq: +v || 1 }) },
  ],
}
