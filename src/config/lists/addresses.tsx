import { CircleCheck, ClipboardCheck, Download, FileText, MapPin, Network, Plus, Upload } from "lucide-react"
import { Banner, DateCell, Dash, Kv, Line, NameCell, Pill, Section, Status, Timeline } from "@/components/list/cells"
import { MapBlock } from "@/components/list/map-block"
import requests from "@/data/tech-requests-demo.json"
import { CITY, counterpartyName, fixClient, managerName, pick, rnd, STAFF } from "@/lib/demo-names"
import { DEPARTMENTS, STREETS } from "@/lib/dippp"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange } from "@/lib/period"

/*
 * 36 Адреса и история ТВ (ОТПП ТК ДИППП, пп. 8, 12, 14, 15). В копии базы истории адресов нет — 160 адресов
 * с проверками, ТР и сетями сторонних операторов собраны по заявкам ТВ, как в макете. TODO: API — история из заявок
 * (галочка «Занести в историю адреса»), нормализация через 2ГИС / Яндекс / Google, импорт сетей СО.
 */

type Res = "yes" | "no" | "part"

export type Address = {
  id: number
  city: string
  addr: string
  /** Проверок по адресу. */
  n: number
  res: Res
  last: string
  tech: string
  /** Сети сторонних операторов. */
  so: string[]
  /** Разработанных ТР. */
  tr: number
  cs: number
  src: string
  /** До ближайшего узла, м. */
  node: number
}

export const OPERATORS = ["Казахтелеком", "Транстелеком", "Beeline Business", "Kcell", "Алма ТВ", "2Day Telecom", "Jusan Mobile"]
export const TECH = ["ВОЛС · FTTB", "ВОЛС · GPON", "РРЛ", "Радиомост", "Спутник VSAT", "Медь xDSL"]
const SERV = ["Интернет", "VPN L2", "VPN L3", "Аренда канала", "IP-телефония", "Видеонаблюдение", "kCloud"]
const SOURCES = ["2ГИС", "Яндекс", "Google"]
const REMARKS = ["Узел в здании, ВОЛС до этажа", "Нет кабельной канализации", "Только РРЛ, прямая видимость есть", "Строительство 120 м ВОЛС", "Ёмкость муфты исчерпана"]
const RES: Record<Res, [string, string]> = { yes: ["ТВ есть", "#34c759"], no: ["ТВ нет", "#ff375f"], part: ["Частично", "#ff9f0a"] }
const TODAY = "2018-03-30"

/** Дата «YYYY-MM-DD» со сдвигом в днях (UTC — без сдвига часового пояса). */
const shift = (base: string, days: number) => {
  const d = new Date(`${base}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const ALL: Address[] = Array.from({ length: 160 }, (_, i) => {
  const id = 5000 + i
  const r = rnd(id, 2) % 10
  return {
    id,
    city: pick(CITY, id, 33),
    addr: `${pick(STREETS, id, 31)}, ${(rnd(id, 32) % 180) + 1}`,
    n: 1 + (rnd(id, 1) % 6),
    res: r < 6 ? "yes" : r < 8 ? "no" : "part",
    last: shift(TODAY, -(rnd(id, 3) % 400)),
    tech: pick(TECH, id, 4),
    so: OPERATORS.filter((_, k) => rnd(id, 10 + k) % 4 === 0),
    tr: rnd(id, 5) % 4,
    cs: fixClient(requests.rows[(i * 7) % requests.rows.length][3], i),
    src: pick(SOURCES, id, 6),
    node: (rnd(id, 7) % 900) + 40,
  }
})

const result = (x: Address) => <Status text={RES[x.res][0]} color={RES[x.res][1]} />
const opts = (list: string[]): Option[] => list.map((v) => ({ v, label: v }))
const resOpts: Option[] = (Object.keys(RES) as Res[]).map((v) => ({ v, label: RES[v][0], color: RES[v][1] }))

function record(x: Address) {
  const history = Array.from({ length: x.n }, (_, k) => ({
    t: `${k === 0 ? RES[x.res][0] : pick(["ТВ есть", "ТВ есть", "ТВ нет", "Частично"], x.id, 40 + k)} · заявка № ${26000 + (rnd(x.id, 50 + k) % 900)}`,
    p: `${pick([...DEPARTMENTS.slice(0, 3), "ОТПП ТК ДИППП"], x.id, 60 + k)} — ${managerName(STAFF[rnd(x.id, 70 + k) % STAFF.length])} · «${pick(REMARKS, x.id, 80 + k)}»`,
    d: shift(x.last, -k * 47),
  }))
  return {
    title: x.addr,
    meta: (
      <>
        {result(x)}
        <Pill>{x.city}</Pill>
        <span className="text-[13px]">{x.n} проверок</span>
      </>
    ),
    actions: [
      // TODO: запись в историю, отметка сети СО — API
      { icon: Plus, label: "Добавить запись в историю" },
      { icon: ClipboardCheck, label: "Новая заявка на ТВ", href: "/tech-requests/new" },
      { icon: Network, label: "Отметить сеть СО" },
    ],
    stats: [
      { t: "Последний результат", v: RES[x.res][0] },
      { t: "Проверок", v: x.n },
      { t: "Последняя проверка", v: <DateCell d={x.last} /> },
    ],
    facts: [
      { t: "Город", v: x.city },
      { t: "Технология", v: x.tech },
      { t: "Ближайший узел", v: `${x.node} м` },
      { t: "Контрагент", v: counterpartyName(x.cs) },
    ],
    tabs: [
      {
        t: "Адрес",
        body: (
          <>
            <Section title="На карте">
              <MapBlock id={x.id} city={x.city} address={x.addr} label={x.addr} />
            </Section>
            <Section title="Нормализация адреса" fresh>
              <Kv
                items={[
                  { t: "Введено в заявке", v: `${x.addr.replace("пр.", "проспект").replace("ул.", "улица")} ${x.city.toLowerCase()}`, wide: true },
                  { t: "Нормализованный адрес", v: `${x.city}, ${x.addr}`, wide: true },
                  { t: "Источник", v: `${x.src} ✓ совпадение 98%` },
                  { t: "Ближайший узел", v: `${x.node} м · ${x.tech}` },
                ]}
              />
            </Section>
          </>
        ),
      },
      {
        t: "История проверок",
        fresh: true,
        body: (
          <>
            <Section title="Проверки по адресу">
              <Timeline items={history} />
            </Section>
            <Banner icon={FileText} tone="blue" title="Историю можно поправить">
              Каждую запись можно изменить или удалить — изменения сохраняются в журнале.
            </Banner>
          </>
        ),
      },
      {
        t: "ТР по адресу",
        fresh: true,
        body: (
          <Section title="Ранее разработанные ТР">
            {x.tr ? (
              Array.from({ length: x.tr }, (_, k) => (
                <Line key={k} icon={FileText}>
                  <b>
                    ТР-{(rnd(x.id, 90 + k) % 400) + 100} · {pick(SERV, x.id, 95 + k)}
                  </b>
                  <span className="text-[12.5px] text-muted-foreground">{counterpartyName(x.cs)}</span>
                  <span className="flex-1" />
                  <Pill>
                    <DateCell d={shift(x.last, -k * 60)} />
                  </Pill>
                </Line>
              ))
            ) : (
              <span className="text-muted-foreground">ТР по адресу ещё не разрабатывались</span>
            )}
          </Section>
        ),
      },
      {
        t: "Сети СО",
        fresh: true,
        body: (
          <Section title="Присутствие сторонних операторов">
            {x.so.length ? (
              x.so.map((s, k) => (
                <Line key={s} icon={Network}>
                  <b>{s}</b>
                  <span className="text-[12.5px] text-muted-foreground">{rnd(x.id, 100 + k) % 2 ? "внесено вручную" : "загружено автоматически"}</span>
                  <span className="flex-1" />
                  <Pill>{pick(TECH, x.id, 110 + k)}</Pill>
                </Line>
              ))
            ) : (
              <span className="text-muted-foreground">Сетей СО по адресу не отмечено</span>
            )}
          </Section>
        ),
      },
    ],
  }
}

export const ADDRESSES: ListConfig<Address> = {
  key: "addresses",
  title: "Адреса и история ТВ",
  crumb: "Заявки · База адресов",
  icon: MapPin,
  badge: "new",
  req: "ОТПП ТК ДИППП, пп. 8, 12, 14, 15 — консолидация ТВ по адресам, история проверок, ранее разработанные ТР, присутствие сетей СО, проверка адреса через 2ГИС / Яндекс / Google",
  search: "Город, улица, дом или контрагент",
  foot: "адреса и история проверок — пример данных",
  buttons: [
    { icon: Plus, label: "Добавить адрес", href: "/addresses/new" },
    { icon: Upload, label: "Импорт сетей СО", onClick: "import" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.city} ${x.addr} ${counterpartyName(x.cs)} ${x.so.join(" ")}`,
  tabs: [
    { k: "a", t: "Все адреса", f: () => true },
    { k: "y", t: "ТВ есть", f: (x) => x.res === "yes" },
    { k: "n", t: "ТВ нет", f: (x) => x.res === "no" },
    { k: "s", t: "Есть сети СО", f: (x) => x.so.length > 0, fresh: true },
  ],
  filters: [
    { k: "city", t: "Город", get: (x) => x.city, opts: opts(CITY) },
    { k: "tech", t: "Технология", get: (x) => x.tech, opts: opts(TECH) },
  ],
  sort: ["last", -1],
  cols: [
    { k: "addr", t: "Адрес", value: (x) => x.city + x.addr, render: (x) => <NameCell icon={MapPin} name={x.addr} sub={`${x.city} · проверен в ${x.src} ✓`} /> },
    { k: "res", t: "Последний результат", value: (x) => x.res, render: result },
    { k: "n", t: "Проверок", num: true, value: (x) => x.n, render: (x) => x.n },
    { k: "tr", t: "ТР", num: true, fresh: true, value: (x) => x.tr, render: (x) => x.tr || <Dash /> },
    { k: "tech", t: "Технология", value: (x) => x.tech, render: (x) => x.tech },
    {
      k: "so",
      t: "Сети СО",
      fresh: true,
      value: (x) => x.so.length,
      render: (x) =>
        x.so.length ? (
          <span className="inline-flex items-center gap-1">
            {x.so.slice(0, 2).map((s) => (
              <Pill key={s}>{s}</Pill>
            ))}
            {x.so.length > 2 && <span className="text-xs text-muted-foreground">+{x.so.length - 2}</span>}
          </span>
        ) : (
          <Dash />
        ),
    },
    { k: "last", t: "Последняя проверка", date: true, value: (x) => x.last, render: (x) => <DateCell d={x.last} /> },
  ],
  kpis: (r, rp) => [
    // прошлого периода по базе адресов нет — сравнение условное, как в макете
    { t: "Адресов в базе", icon: MapPin, c: ALL.length, p: ALL.length - 14 },
    { t: "ТВ есть", icon: CircleCheck, c: Math.round((ALL.filter((x) => x.res === "yes").length / ALL.length) * 100), p: 58, f: (v) => `${v}%` },
    { t: "Проверок за период", icon: ClipboardCheck, c: ALL.filter((x) => inRange(x.last, r)).length, p: ALL.filter((x) => inRange(x.last, rp)).length },
    { t: "С сетями СО", icon: Network, c: ALL.filter((x) => x.so.length).length, note: "сторонние операторы" },
  ],
  sub: () =>
    "История проверок ТВ по каждому адресу: результаты из заявок (галочка «Занести в историю адреса»), разработанные ТР и сети сторонних операторов. Адрес при вводе сверяется с 2ГИС, Яндекс и Google.",
  record,
  cardStatus: "res",
  name: (x) => `${x.city}, ${x.addr}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, city: CITY[0], addr: "", n: 0, res: "yes", last: "", tech: TECH[0], so: [], tr: 0, cs: 0, src: "2ГИС", node: 0 }),
  fields: [
    { k: "city", t: "Город", type: "select", opts: opts(CITY), get: (x) => x.city, set: (x, v) => ({ ...x, city: v }) },
    { k: "addr", t: "Улица, дом", type: "text", required: true, get: (x) => x.addr, set: (x, v) => ({ ...x, addr: v }) },
    { k: "res", t: "Результат проверки", type: "select", opts: resOpts, get: (x) => x.res, set: (x, v) => ({ ...x, res: v as Res, n: x.n || 1 }) },
    { k: "tech", t: "Технология", type: "select", opts: opts(TECH), get: (x) => x.tech, set: (x, v) => ({ ...x, tech: v }) },
    { k: "cs", t: "ID контрагента", type: "number", get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "last", t: "Дата проверки", type: "date", get: (x) => x.last, set: (x, v) => ({ ...x, last: v || x.last || new Date().toISOString().slice(0, 10) }) },
  ],
}
