import { ChartColumn, CircleCheck, CircleX, Clock, Download, FilePlus, Globe, Hash, Lock, Mail, TriangleAlert, Undo2 } from "lucide-react"
import { Banner, DateCell, Kv, Line, NameCell, Owner, Pill, Section, Status } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import requests from "@/data/tech-requests-demo.json"
import { counterpartyName, fixClient, managerName, ownerColor, pick, rnd } from "@/lib/demo-names"
import { BRANCHES } from "@/lib/dippp"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { inRange } from "@/lib/period"

/*
 * 11 Заявки IP — выдача, изъятие, переоформление и изменение публичных IP-адресов. Доработано по требованиям ОТУП ДИППП.
 * В копии базы таблица пустая — 120 заявок собраны из заявок ТВ/ТР, как в макете. TODO: API, синхронизация с ЕСТУ «IP-адреса».
 */

type State = "dr" | "rv" | "w" | "p" | "d" | "r" | "o"

export type IpRequest = {
  id: number
  cs: number
  deal: number
  u: string
  act: string
  /** Размер блока, адресов. */
  block: number
  tech: string
  speed: number
  br: string
  date: string
  st: State
  /** Создана автоматически по наряду на отключение. */
  auto: boolean
}

const ACTIONS = ["Выдача", "Изъятие", "Переоформление", "Изменение"]
const TECH = ["ВОЛС", "РРЛ", "Радиомост", "Спутник", "БШД"]
const STATE: Record<State, [string, string]> = {
  dr: ["Черновик", "#8a93a6"],
  rv: ["На рассмотрении", "#5ac8fa"],
  w: ["В ожидании", "#ff9f0a"],
  p: ["В процессе", "#085eff"],
  d: ["Готово", "#34c759"],
  r: ["Отклонено", "#ff375f"],
  o: ["Отозвано", "#8a93a6"],
}
const FINAL: State[] = ["d", "r", "o"]
const p2 = (n: number) => String(n).padStart(2, "0")

const ALL: IpRequest[] = Array.from({ length: 120 }, (_, i) => {
  const id = 700 + i
  const t = requests.rows[(i * 5) % requests.rows.length]
  // по 2 заявки в день, от 30 марта 2018 назад
  const d = new Date(2018, 2, 30 - Math.floor(i / 2))
  const act = ACTIONS[rnd(id, 1) % 4]
  return {
    id,
    cs: fixClient(t[3], +t[0] + i),
    deal: +t[4],
    u: t[5],
    act,
    block: [4, 8, 16, 32, 64][rnd(id, 2) % 5],
    tech: pick(TECH, id, 3),
    speed: [10, 20, 50, 100][rnd(id, 6) % 4],
    br: pick(BRANCHES, id, 4),
    date: `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`,
    st: (["dr", "rv", "w", "p", "d", "d", "d", "r", "o"] as State[])[rnd(id, 5) % 9],
    auto: act === "Изъятие" && rnd(id, 11) % 2 === 0,
  }
})

const prefix = (x: IpRequest) => 32 - Math.log2(x.block)
const subnet = (x: IpRequest) => `185.${rnd(x.id, 1) % 200}.${rnd(x.id, 2) % 250}`
const state = (x: IpRequest) => <Status text={STATE[x.st][0]} color={STATE[x.st][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const made = (r: string[]) => ALL.filter((x) => inRange(x.date, r)).length
const opts = (list: string[]): Option[] => list.map((v) => ({ v, label: v }))
const staffOpts: Option[] = [...new Set(ALL.map((x) => x.u))].map((v) => ({ v, label: managerName(v) }))
const save = (x: IpRequest) => rowsStore.save(IP_REQUESTS, x)

function MailLine({ who, what, d }: { who: string; what: string; d: string }) {
  return (
    <Line icon={Mail}>
      <b>{who}</b>
      <span className="text-[12.5px] text-muted-foreground">{what}</span>
      <span className="flex-1" />
      <Pill>
        <DateCell d={d} />
      </Pill>
    </Line>
  )
}

function record(x: IpRequest) {
  const final = FINAL.includes(x.st)
  const params = [
    { t: "Наименование", v: counterpartyName(x.cs), wide: true },
    { t: "Договор", v: `${(rnd(x.id, 3) % 900) + 100}/КД-2018` },
    { t: "Требуемое действие", v: x.act },
    { t: "Тип подключения", v: pick(["Новое", "Дополнительное", "Тестовое"], x.id, 9) },
    { t: "Последняя миля", v: x.tech },
    { t: "Скорость", v: `${x.speed} Мбит/с` },
    { t: "Требуемый блок", v: `${x.block} адресов` },
    { t: "Тип адреса", v: "Публичный" },
    { t: "Филиал", v: x.br },
    { t: "Инициатор", v: managerName(x.u) },
  ]
  const to = (st: State) => () => ({ ...x, st })

  return {
    title: `Заявка IP-${x.id}`,
    meta: (
      <>
        {state(x)}
        <Pill>{x.act}</Pill>
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{counterpartyName(x.cs)}</span>
      </>
    ),
    // после финального статуса заявку не двигают (п. ОТУП: блокировка)
    actions: final
      ? []
      : [
          { icon: CircleCheck, label: "В работу", apply: to("p") },
          { icon: CircleCheck, label: "Готово", apply: to("d") },
          { icon: CircleX, label: "Отклонить", apply: to("r") },
          {
            icon: Undo2,
            label: "Отозвать заявку",
            run: () => {
              if (x.st !== "dr" && x.st !== "rv") return void toast("Отозвать можно только черновик или заявку на рассмотрении")
              save({ ...x, st: "o" })
              toast("Заявка отозвана — письмо отправлено исполнителю", () => save(x))
            },
          },
        ],
    stats: [
      { t: "Действие", v: x.act },
      { t: "Блок", v: `/${prefix(x)} · ${x.block} адр.` },
      { t: "Последняя миля", v: `${x.tech} · ${x.speed} Мбит/с` },
      { t: "Создана", v: <DateCell d={x.date} /> },
    ],
    facts: params.filter((p) => !p.wide),
    tabs: [
      {
        t: "Заявка",
        body: (
          <>
            {final && (
              <Banner icon={Lock} tone="blue" title="Финальный статус" fresh>
                Поля заявки заблокированы для редактирования.
              </Banner>
            )}
            {x.auto && (
              <Banner icon={TriangleAlert} title="Создана автоматически" fresh>
                По наряду на отключение Н-{18000 + (x.id % 180)}. Данные взяты из исходной заявки на выделение IP-{x.id - 40}.
              </Banner>
            )}
            <Section title="Параметры (подтянуты из базы)" fresh>
              <Kv items={params} />
            </Section>
          </>
        ),
      },
      {
        t: "Ответ",
        body: (
          <>
            <Section title="Ответ исполнителя">
              {x.st === "d" ? (
                <Kv
                  items={[
                    { t: "Выделенный блок", v: `${subnet(x)}.0/${prefix(x)}` },
                    { t: "Шлюз", v: `${subnet(x)}.1` },
                  ]}
                />
              ) : (
                <span className="text-sm text-muted-foreground">Ответа пока нет</span>
              )}
            </Section>
            <Section title="ЕСТУ «IP-адреса»" fresh>
              <Kv items={[{ t: "Синхронизация", v: x.st === "d" ? <Status text="Синхронизировано" color="#34c759" /> : "после исполнения" }]} />
            </Section>
          </>
        ),
      },
      {
        t: "Уведомления",
        fresh: true,
        body: (
          <Section title="Письма инициатору и исполнителю">
            <MailLine who={managerName(x.u)} what="создана заявка" d={x.date} />
            {x.st !== "dr" && <MailLine who="ОТУП ДИППП" what="заявка на рассмотрении" d={x.date} />}
            {x.st === "d" && <MailLine who={managerName(x.u)} what={x.auto ? "IP-адрес изъят" : "заявка исполнена"} d={x.date} />}
          </Section>
        ),
      },
      {
        t: "Связанные",
        fresh: true,
        body: (
          <Section title="Связанные IP-ресурсы клиента">
            {[`Выдача /29 · IP-${x.id - 40}`, `Изменение · IP-${x.id - 12}`, x.auto ? `Изъятие · IP-${x.id} (авто)` : ""].filter(Boolean).map((t) => (
              <Line key={t} icon={Globe}>
                <b>{t}</b>
                <span className="flex-1" />
                <Status text="Исполнено" color="#34c759" />
              </Line>
            ))}
          </Section>
        ),
      },
    ],
  }
}

export const IP_REQUESTS: ListConfig<IpRequest> = {
  key: "ip-requests",
  title: "Заявки IP",
  crumb: "Заявки · Публичные IP-адреса",
  icon: Globe,
  badge: "upd",
  req: "Доработано по требованиям ОТУП ДИППП: статусы Черновик → На рассмотрении → В работе → Исполнено, отзыв заявки, блокировка полей после финального статуса, уведомления по e-mail, авто-изъятие IP при наряде на отключение, синхронизация с ЕСТУ «IP-адреса», отчёт",
  search: "Контрагент, сделка или инициатор",
  foot: "заявки IP — пример данных: в копии базы таблица пустая",
  buttons: [
    { icon: FilePlus, label: "Новая заявка", href: "/ip-requests/new" },
    { icon: ChartColumn, label: "Отчёт по IP", href: "/ip-report" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${counterpartyName(x.cs)} ${x.deal} ${managerName(x.u)}`,
  tabs: [
    { k: "w", t: "Текущие", f: (x) => ["w", "p", "dr", "rv"].includes(x.st) },
    { k: "d", t: "Готово", f: (x) => x.st === "d" },
    { k: "r", t: "Отклонено / отозвано", f: (x) => x.st === "r" || x.st === "o" },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "act", t: "Действие", get: (x) => x.act, opts: opts(ACTIONS) },
    { k: "tech", t: "Технология", get: (x) => x.tech, opts: opts(TECH) },
  ],
  sort: ["date", -1],
  cols: [
    { k: "id", t: "Заявка", value: (x) => x.id, render: (x) => <NameCell icon={Globe} name={`IP-${x.id}`} sub={`${x.act} · блок /${prefix(x)}${x.auto ? " · авто из наряда" : ""}`} /> },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "deal", t: "Сделка", value: (x) => x.deal, render: (x) => (x.deal ? `№ ${x.deal}` : "—") },
    { k: "tech", t: "Последняя миля", value: (x) => x.tech, render: (x) => `${x.tech} · ${x.speed} Мбит/с` },
    { k: "u", t: "Инициатор", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "br", t: "Филиал", value: (x) => x.br, render: (x) => <Pill>{x.br}</Pill> },
    { k: "date", t: "Создана", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "st", t: "Статус", value: (x) => STATE[x.st][0], render: state },
  ],
  owner: { t: "Инициатор", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: (r) => [
    // в примере данных нет прошлого периода — сравнение условное, как в макете
    { t: "Заявок", icon: Globe, c: made(r), p: Math.round(made(r) * 0.9) },
    { t: "Выдано адресов", icon: Hash, c: ALL.filter((x) => x.st === "d" && x.act === "Выдача").reduce((a, x) => a + x.block, 0), note: "публичных IPv4" },
    { t: "В ожидании", icon: Clock, c: ALL.filter((x) => x.st === "w").length, note: "ждут исполнителя" },
    { t: "Отклонено", icon: CircleX, c: ALL.filter((x) => x.st === "r").length },
  ],
  sub: () => "Выдача, переоформление, изменение и изъятие публичных IP-адресов. Готовую заявку можно прикрепить к наряду.",
  locked: (x) => FINAL.includes(x.st),
  record,
  name: (x) => `Заявка IP-${x.id}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, cs: 0, deal: 0, u: staffOpts[0].v, act: ACTIONS[0], block: 8, tech: TECH[0], speed: 50, br: BRANCHES[0], date: "", st: "dr", auto: false }),
  fields: [
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0, date: x.date || new Date().toISOString().slice(0, 10) }) },
    { k: "deal", t: "№ сделки", type: "number", get: (x) => (x.deal ? String(x.deal) : ""), set: (x, v) => ({ ...x, deal: +v || 0 }) },
    { k: "act", t: "Требуемое действие", type: "select", opts: opts(ACTIONS), get: (x) => x.act, set: (x, v) => ({ ...x, act: v }) },
    {
      k: "block",
      t: "Требуемый блок",
      type: "select",
      opts: [4, 8, 16, 32, 64].map((n) => ({ v: String(n), label: `/${32 - Math.log2(n)} · ${n} адресов` })),
      get: (x) => String(x.block),
      set: (x, v) => ({ ...x, block: +v }),
    },
    { k: "tech", t: "Последняя миля", type: "select", opts: opts(TECH), get: (x) => x.tech, set: (x, v) => ({ ...x, tech: v }) },
    { k: "speed", t: "Скорость, Мбит/с", type: "select", opts: opts(["10", "20", "50", "100"]), get: (x) => String(x.speed), set: (x, v) => ({ ...x, speed: +v }) },
    { k: "br", t: "Филиал", type: "select", opts: opts(BRANCHES), get: (x) => x.br, set: (x, v) => ({ ...x, br: v }) },
    { k: "u", t: "Инициатор", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    {
      k: "st",
      t: "Статус",
      type: "select",
      opts: (["dr", "rv"] as State[]).map((v) => ({ v, label: STATE[v][0], color: STATE[v][1] })),
      get: (x) => (x.st === "rv" ? "rv" : "dr"),
      // форма меняет только «Черновик / На рассмотрении»; дальше статус двигают действия карточки
      set: (x, v) => (x.st === "dr" || x.st === "rv" ? { ...x, st: v as State } : x),
    },
  ],
}
