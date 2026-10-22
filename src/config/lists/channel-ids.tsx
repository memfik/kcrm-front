import { CircleCheck, Clock, Download, Link as LinkIcon, Lock, Plus, RefreshCw, Send, TriangleAlert, Undo2 } from "lucide-react"
import { Banner, DateCell, Kv, MailLine, NameCell, Owner, Pill, Section, Status } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import requests from "@/data/tech-requests-demo.json"
import { fixClient } from "@/lib/demo-clients"
import { CITY, counterpartyName, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import { BRANCHES, shiftDate, STREETS, TECH, TODAY, TV_SERVICES } from "@/lib/dippp"
import { briefFacts, briefStats, type BriefItem } from "@/lib/list/brief"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange, shortDate } from "@/lib/period"
import { todayLocal } from "@/lib/today"

/*
 * 40 ID-каналы (ОТУП ДИППП, модуль «ID-канала»): заявки на выделение и изменение статуса ID-канала.
 * В копии базы модуля нет — 110 заявок собраны по заявкам ТВ/ТР (контрагент, инициатор), как в макете.
 * TODO: API — данные из базы по точке подключения, синхронизация с ЕСТУ «ID-каналы», письма, авто-заявки из нарядов на отключение (10).
 */

type State = "dr" | "rv" | "w" | "ok" | "rej" | "rc"
type Act = "Выделение" | "Изменение статуса"

export type ChannelId = {
  id: number
  cs: number
  u: string
  act: Act
  /** Создана автоматически из наряда на отключение. */
  auto: boolean
  ch: string
  serv: string
  speed: number
  tech: string
  br: string
  date: string
  st: State
  /** Статус ID-канала после исполнения. */
  newst: string
  /** Сверено с ЕСТУ. */
  sync: boolean
}

const STATE: Record<State, [string, string]> = {
  dr: ["Черновик", "#8a93a6"],
  rv: ["На рассмотрении", "#5ac8fa"],
  w: ["В работе", "#085eff"],
  ok: ["Исполнено", "#34c759"],
  rej: ["Отклонено", "#ff375f"],
  rc: ["Отозвано", "#8a93a6"],
}
const FLOW: State[] = ["dr", "rv", "w", "w", "ok", "ok", "ok", "rej", "rc"]
const SPEEDS = [10, 20, 50, 100, 200]
const ACTS: Act[] = ["Выделение", "Изменение статуса"]

const channel = (id: number) =>
  `KZ-${pick(["ALM", "AST", "SHM", "KRG", "ATR"], id, 3)}-${pick(["ETH", "L2VPN", "INET", "MPLS"], id, 4)}-${String(100000 + (rnd(id, 5) % 899999)).slice(0, 6)}`

const ALL: ChannelId[] = Array.from({ length: 110 }, (_, i) => {
  const id = 800 + i
  const t = requests.rows[(i * 5) % requests.rows.length]
  const st = FLOW[rnd(id, 1) % FLOW.length]
  const off = rnd(id, 2) % 7 === 0
  return {
    id,
    cs: fixClient(t[3], id),
    u: t[5],
    act: off ? "Изменение статуса" : "Выделение",
    auto: off,
    ch: channel(id),
    serv: pick(TV_SERVICES, id, 6),
    speed: SPEEDS[rnd(id, 7) % SPEEDS.length],
    tech: pick(TECH, id, 8),
    br: pick(BRANCHES, id, 9),
    date: shiftDate(TODAY, -Math.floor(i * 1.3)),
    st,
    newst: off ? pick(["Приостановлен", "Отключён"], id, 10) : "Активен",
    sync: st === "ok",
  }
})

const fin = (x: ChannelId) => x.st === "ok" || x.st === "rej" || x.st === "rc"
const state = (x: ChannelId) => <Status text={STATE[x.st][0]} color={STATE[x.st][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const point = (x: ChannelId) => `${pick(CITY, x.id, 33)}, ${pick(STREETS, x.id, 31)}, ${(rnd(x.id, 32) % 180) + 1}`
const opts = (list: readonly (string | number)[]): Option[] => list.map((v) => ({ v: String(v), label: String(v) }))
const staffOpts: Option[] = STAFF.slice(0, 30).map((v) => ({ v, label: managerName(v) }))

/** Отозвать можно только черновик или заявку на рассмотрении. */
function revoke(x: ChannelId) {
  if (x.st !== "dr" && x.st !== "rv") return void toast("Отозвать можно только черновик или заявку на рассмотрении")
  rowsStore.save(CHANNEL_IDS, { ...x, st: "rc" as State })
  toast("Заявка отозвана — инициатор и исполнитель получат письмо", () => rowsStore.save(CHANNEL_IDS, x))
}

function record(x: ChannelId) {
  const params: BriefItem[] = [
    { t: "Контрагент", v: counterpartyName(x.cs), fresh: true },
    { t: "Точка подключения", v: point(x), wide: true, fresh: true },
    { t: "Услуга", v: x.serv },
    { t: "Скорость", v: `${x.speed} Мбит/с` },
    { t: "Технология", v: x.tech },
    { t: "Требуемое действие", v: x.act },
    { t: "Новый статус ID", v: x.newst },
    { t: "Филиал", v: x.br },
    { t: "Инициатор", v: managerName(x.u) },
  ]
  const estu: BriefItem[] = [
    { t: "ID-канал", v: x.sync ? x.ch : "будет присвоен после исполнения" },
    { t: "Статус в ЕСТУ", v: x.sync ? x.newst : "—" },
    { t: "Обязательные поля", v: "заполнены автоматически" },
    { t: "Последняя сверка", v: x.sync ? `${shortDate(x.date)} 10:4${x.id % 10}` : "—" },
  ]
  const sync = { icon: RefreshCw, label: "Синхронизировать с ЕСТУ", apply: () => ({ ...x, sync: true }) }
  return {
    title: x.ch,
    meta: (
      <>
        {state(x)}
        <Pill>{x.act}</Pill>
        <Pill>{counterpartyName(x.cs)}</Pill>
      </>
    ),
    actions: fin(x)
      ? [sync]
      : [
          { icon: Send, label: "Отправить на рассмотрение", apply: () => ({ ...x, st: x.st === "dr" ? ("rv" as State) : x.st }) },
          { icon: Undo2, label: "Отозвать заявку", run: () => revoke(x) },
          sync,
        ],
    // как в макете: поля всех вкладок, затем дата создания
    stats: briefStats(x.ch, [...params, ...estu, { t: "Создана", v: <DateCell d={x.date} />, s: shortDate(x.date) }]),
    facts: briefFacts(params),
    tabs: [
      {
        t: "Заявка",
        body: (
          <>
            {fin(x) && (
              <Banner icon={Lock} tone="blue" title="Заявка в финальном статусе">
                Редактирование полей заблокировано.
              </Banner>
            )}
            {x.auto && (
              <Banner icon={TriangleAlert} title="Создана автоматически" fresh>
                Для точки подключения оформлен наряд на отключение Н-{18000 + (rnd(x.id, 30) % 180)} — статус ID-канала будет изменён на «{x.newst}».
              </Banner>
            )}
            <Section title="Параметры (подтянуты из базы)">
              <Kv items={params} />
            </Section>
          </>
        ),
      },
      {
        t: "ЕСТУ",
        fresh: true,
        body: (
          <Section title="Синхронизация с ЕСТУ «ID-каналы»">
            <Kv items={estu} />
          </Section>
        ),
      },
      {
        t: "Уведомления",
        fresh: true,
        body: (
          <Section title="Письма по заявке">
            <MailLine who={managerName(x.u)} what="создана заявка" d={x.date} />
            {x.st !== "dr" && <MailLine who="ОТУП ДИППП" what="заявка на рассмотрении" d={shiftDate(x.date, 1)} />}
            {x.st === "ok" && <MailLine who={`${managerName(x.u)}, ОТУП ДИППП`} what={`ID-канал присвоен — ${x.ch}`} d={shiftDate(x.date, 2)} />}
            {x.st === "rej" && <MailLine who={managerName(x.u)} what="заявка отклонена с комментарием" d={shiftDate(x.date, 2)} />}
          </Section>
        ),
      },
    ],
  }
}

export const CHANNEL_IDS: ListConfig<ChannelId> = {
  key: "channel-ids",
  title: "ID-каналы",
  crumb: "Заявки · Присвоение ID-канала",
  icon: LinkIcon,
  badge: "new",
  req: "ОТУП ДИППП, модуль «ID-канала» — заявки на выделение и изменение статуса ID-каналов по утверждённой форме, данные подтягиваются из базы, отзыв на этапах «Черновик» и «На рассмотрении», синхронизация с ЕСТУ, автоматическая заявка при наряде на отключение, уведомления по e-mail",
  search: "ID-канал, контрагент или инициатор",
  foot: "заявки на ID-каналы — пример данных: в копии базы модуля нет",
  buttons: [
    { icon: Plus, label: "Заявка на ID-канал", href: "/channel-ids/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.ch} ${counterpartyName(x.cs)} ${managerName(x.u)}`,
  tabs: [
    { k: "w", t: "Текущие", f: (x) => !fin(x) },
    { k: "ok", t: "Исполнено", f: (x) => x.st === "ok" },
    { k: "r", t: "Отклонено / отозвано", f: (x) => x.st === "rej" || x.st === "rc" },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "act", t: "Действие", get: (x) => x.act, opts: opts(ACTS) },
    { k: "st", t: "Статус", get: (x) => x.st, opts: (Object.keys(STATE) as State[]).map((v) => ({ v, label: STATE[v][0], color: STATE[v][1] })) },
  ],
  sort: ["date", -1],
  cols: [
    { k: "ch", t: "ID-канал", value: (x) => x.ch, render: (x) => <NameCell icon={LinkIcon} name={x.ch} sub={x.act + (x.auto ? " · авто из наряда на отключение" : "")} /> },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "serv", t: "Услуга", value: (x) => x.serv, render: (x) => `${x.serv} · ${x.speed} Мбит/с` },
    { k: "u", t: "Инициатор", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "br", t: "Филиал", value: (x) => x.br, render: (x) => <Pill>{x.br}</Pill> },
    { k: "date", t: "Создана", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    {
      k: "sync",
      t: "ЕСТУ",
      fresh: true,
      value: (x) => (x.sync ? "Синхронизировано" : "ожидает"),
      render: (x) => (x.sync ? <Status text="Синхронизировано" color="#34c759" /> : <span className="text-muted-foreground">ожидает</span>),
    },
    { k: "st", t: "Статус", value: (x) => STATE[x.st][0], render: state },
  ],
  owner: { t: "Инициатор", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: (r, rp) => [
    { t: "Заявок", icon: LinkIcon, c: ALL.filter((x) => inRange(x.date, r)).length, p: ALL.filter((x) => inRange(x.date, rp)).length },
    { t: "Присвоено ID", icon: CircleCheck, c: ALL.filter((x) => x.st === "ok" && x.act === "Выделение").length },
    { t: "Авто при отключении", icon: RefreshCw, c: ALL.filter((x) => x.auto).length, note: "созданы из нарядов" },
    { t: "На рассмотрении", icon: Clock, c: ALL.filter((x) => x.st === "rv").length },
  ],
  sub: () =>
    "Данные о клиенте, точке подключения и параметрах услуги подтягиваются автоматически. Заявку можно отозвать, пока она в черновике или на рассмотрении. После исполнения ID-канал присваивается в ЕСТУ.",
  record,
  locked: fin,
  name: (x) => `Заявка на ID-канал ${x.ch}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, cs: 0, u: staffOpts[0].v, act: "Выделение", auto: false, ch: "", serv: TV_SERVICES[0], speed: 50, tech: TECH[0], br: BRANCHES[0], date: "", st: "dr", newst: "Активен", sync: false }),
  fields: [
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "serv", t: "Услуга", type: "select", opts: opts(TV_SERVICES), get: (x) => x.serv, set: (x, v) => ({ ...x, serv: v }) },
    { k: "br", t: "Филиал", type: "select", opts: opts(BRANCHES), get: (x) => x.br, set: (x, v) => ({ ...x, br: v }) },
    { k: "u", t: "Инициатор", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v, date: x.date || todayLocal() }) },
  ],
}
