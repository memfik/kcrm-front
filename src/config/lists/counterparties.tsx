import { Box, Briefcase, Calendar, Check, Download, FileCheck, FilePlus, FileText, Globe, Phone, TrendingUp, Users } from "lucide-react"
import { DateCell, Dash, Dot, Kv, Line, NameCell, Owner, Pill, Section, Status, Timeline, AVATAR_COLORS, Avatar } from "@/components/list/cells"
import { MapBlock } from "@/components/list/map-block"
import raw from "@/data/counterparties-demo.json"
import { CITY, CONTACT_NAMES, FORM, STAFF, binOf, counterpartyName, managerName, ownerColor, pick, rnd } from "@/lib/demo-names"
import { OFFERS } from "@/lib/home-stats"
import type { ListConfig, Option } from "@/lib/list/types"
import { delta, fmt, inRange, periodLabel, prevLabel, signed, sumOf } from "@/lib/period"

/*
 * 03 Контрагенты. Строки — копия базы kCRM (ID, владелец, КП, последнее КП, договоры, сделки, статус, контакты);
 * названия, БИН, сегменты и реквизиты — детерминированные заглушки. TODO: API.
 */

export type Counterparty = {
  id: number
  uid: string
  name: string
  form: string
  bin: string
  seg: string
  ind: string
  cat: number
  typ: string
  st: number
  kp: number
  ct: number
  dl: number
  cc: number
  last: string | null
  city: string
}

const SEG = ["B2B", "B2B", "B2B", "B2G", "B2C", "B2O", "КМГ"]
const IND = ["Промышленный сектор", "Финансовый сектор", "Строительный сектор", "Коммерческий сектор", "Государственный сектор", "Мобильные операторы РК", "Фиксированные операторы РК", "Иностранный сектор"]
const CAT: [string, string][] = [["Потенциальный", "#afafe9"], ["Периодический", "#80b3ff"], ["Постоянный", "#87de87"], ["VIP", "#ff80b2"], ["TOP 500", "#ffb340"]]
const TYP = ["Корпоративные клиенты", "SMB", "Партнеры", "Операторы связи", "Физические лица"]
const STA: Record<number, [string, string]> = {
  0: ["Не определён", "#8a93a6"],
  1: ["Перспективный", "#ff9f0a"],
  2: ["Есть интерес", "#5ac8fa"],
  3: ["Активный", "#34c759"],
  4: ["Неактивный", "#af52de"],
  5: ["Приостановлен", "#ffcc00"],
  6: ["Отказ", "#ff375f"],
}

const ALL: Counterparty[] = raw.map(([id, uid, kp, last, ct, dl, s, cc]) => {
  const n = +id
  return {
    id: n,
    uid,
    name: counterpartyName(n),
    form: FORM[rnd(n, 1) % FORM.length],
    bin: binOf(n),
    seg: SEG[rnd(n, 10) % SEG.length],
    ind: IND[rnd(n, 11) % IND.length],
    cat: rnd(n, 12) % CAT.length,
    typ: TYP[rnd(n, 13) % TYP.length],
    st: +s,
    kp: +kp,
    ct: +ct,
    dl: +dl,
    cc: +cc,
    last: last === "NULL" ? null : last,
    city: CITY[rnd(n, 14) % CITY.length],
  }
})

/** «Мои» — TODO: текущий пользователь из сессии; в макете — владелец первой записи. */
export const ME = raw[0][1]

const opts = (list: string[]): Option[] => [...new Set(list)].map((v) => ({ v, label: v }))
const statusOpts: Option[] = Object.entries(STA).map(([v, [label, color]]) => ({ v, label, color }))
const catOpts: Option[] = CAT.map(([label, color], i) => ({ v: String(i), label, color }))
const ownerOpts: Option[] = [...new Set([...STAFF, ...ALL.map((x) => x.uid)])].slice(0, 60).map((v) => ({ v, label: managerName(v) }))

const status = (s: number) => <Status text={STA[s][0]} color={STA[s][1]} />
const owner = (uid: string) => <Owner name={managerName(uid)} color={ownerColor(uid)} />
const zero = (n: number) => (n ? n : <Dash />)

/* ---------- карточка ---------- */

const phone = (id: number, k: number) =>
  `+7 7${String(rnd(id, 31 + k) % 100).padStart(2, "0")} ${String(rnd(id, 32 + k) % 1000).padStart(3, "0")} ${String(rnd(id, 33 + k) % 100).padStart(2, "0")} ${String(rnd(id, 34 + k) % 100).padStart(2, "0")}`

function record(x: Counterparty) {
  const fio = (n: number) => CONTACT_NAMES[rnd(x.id, n) % CONTACT_NAMES.length]
  const address = `${pick(["пр. Абая", "ул. Кунаева", "пр. Республики", "ул. Сатпаева"], x.id, 21)}, ${(rnd(x.id, 22) % 200) + 1}`
  const info = [
    { t: "ЮЛ форма собственности", v: x.form },
    { t: "БИН/ИИН", v: x.bin },
    { t: "Тип", v: x.typ },
    { t: "Сегмент", v: x.seg },
    { t: "Потреб. сегмент", v: x.ind },
    { t: "Категория", v: CAT[x.cat][0] },
    { t: "Статус", v: status(x.st) },
    { t: "Владелец контакта", v: managerName(x.uid) },
    { t: "Источник обращения", v: pick(["Гос. закупки", "Холодный звонок", "Сайт qmobile.kz", "Рекомендация"], x.id, 20) },
  ]
  const meta = (
    <>
      {status(x.st)}
      <Pill>{x.seg}</Pill>
      {[`БИН ${x.bin}`, `ID ${x.id}`, x.city].map((t) => (
        <span key={t} className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
          {t}
        </span>
      ))}
    </>
  )

  return {
    title: x.name,
    meta,
    actions: [
      { icon: FilePlus, label: "Составить КП", href: `/offer-builder?cs=${x.id}` },
      { icon: Briefcase, label: "Новая сделка", href: `/deals/new?cs=${x.id}` },
      { icon: FileCheck, label: "Заявка на ТВ и ТР", href: `/tech-requests/new?cs=${x.id}` },
      { icon: Calendar, label: "Событие", href: "/calendar" },
    ],
    stats: [
      { t: "Сделок", v: zero(x.dl) },
      { t: "КП", v: zero(x.kp) },
      { t: "Договоров", v: zero(x.ct) },
      { t: "Последнее КП", v: <DateCell d={x.last} /> },
    ],
    facts: info,
    tabs: [
      {
        t: "Информация",
        body: (
          <>
            <Section title="Основное">
              <Kv items={info} />
            </Section>
            <Section title="Показатели">
              <Kv
                items={[
                  { t: "Сделок", v: x.dl || "—" },
                  { t: "КП", v: x.kp || "—" },
                  { t: "Договоров", v: x.ct || "—" },
                  { t: "Последнее КП", v: <DateCell d={x.last} /> },
                ]}
              />
            </Section>
          </>
        ),
      },
      {
        t: "Контакты",
        body: (
          <Section title="Контактные лица">
            {Array.from({ length: Math.max(1, x.cc) }, (_, k) => {
              const nm = fio(30 + k)
              return (
                <div key={k} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-border py-3 last:border-0">
                  <Avatar name={nm} color={AVATAR_COLORS[(x.id + k) % AVATAR_COLORS.length]} className="size-11 text-sm" />
                  <div>
                    <b className="block text-sm">{nm}</b>
                    <span className="text-[12.5px] text-muted-foreground">
                      {["Директор", "Главный бухгалтер", "IT-менеджер", "Менеджер по закупкам", "Юрист"][(x.id + k) % 5]} · {phone(x.id, k)}
                    </span>
                  </div>
                  <a href={`tel:${phone(x.id, k).replace(/\s/g, "")}`} aria-label="Позвонить" className="grid size-[34px] place-items-center rounded-full bg-[var(--soft)] text-[#085eff]">
                    <Phone className="size-4" />
                  </a>
                </div>
              )
            })}
          </Section>
        ),
      },
      {
        t: "Местоположение",
        body: (
          <Section title="Точка подключения">
            <MapBlock id={x.id} city={x.city} address={address} label={x.name} />
            <Kv
              items={[
                { t: "Город", v: x.city },
                { t: "Адрес", v: address },
                { t: "Точка подключения", v: "Да" },
                { t: "Доставка СФ", v: "Да" },
              ]}
            />
          </Section>
        ),
      },
      {
        t: "Связанные IP-ресурсы",
        fresh: true,
        body: (
          <Section title="IP-ресурсы по точкам подключения">
            {Array.from({ length: 1 + (rnd(x.id, 401) % 3) }, (_, k) => (
              <Line key={k} icon={Globe}>
                <b>
                  IP-{700 + (rnd(x.id, 410 + k) % 120)} · {["Выдача /29", "Изменение", "Переоформление"][k % 3]}
                </b>
                <span className="text-[12.5px] text-muted-foreground">
                  {x.city}, {["пр. Абая", "ул. Кунаева", "пр. Республики"][k % 3]}
                </span>
                <span className="flex-1" />
                {k === 0 && rnd(x.id, 420) % 2 ? <Status text="В работе" color="#085eff" /> : <Status text="Исполнено" color="#34c759" />}
              </Line>
            ))}
          </Section>
        ),
      },
      {
        t: "Реквизиты",
        body: (
          <Section title="Банковские реквизиты">
            <Kv
              items={[
                { t: "Банк", v: pick(["АО «Halyk Bank»", "АО «Kaspi Bank»", "АО «ForteBank»", "АО «Банк ЦентрКредит»"], x.id, 50), wide: true },
                { t: "ИИК", v: "KZ" + String(rnd(x.id, 51)).padStart(10, "0") + String(rnd(x.id, 52)).slice(0, 8) },
                { t: "КБЕ", v: "17" },
              ]}
            />
          </Section>
        ),
      },
      {
        t: "Доступ",
        body: (
          <Section title="Права доступа">
            {[managerName(x.uid), fio(60), fio(61)].map((n, k) => (
              <Line key={k}>
                <b>{n}</b>
                <span className="flex-1" />
                <Pill>{["ГО-ДКП", "АФ", "ГО-ДУКО"][k]}</Pill>
                <Pill>{k ? "только чтение" : "полный доступ"}</Pill>
              </Line>
            ))}
          </Section>
        ),
      },
      {
        t: "История",
        body: (
          <Section title="История работы">
            <Timeline
              items={[
                { t: "КП отправлено клиенту", p: "Интернет 100 Мбит/с · 3 точки", d: x.last ?? "2018-03-12" },
                { t: "Заявка на ТВ и ТР", p: "ТВ имеется · ТР приложено", d: "2018-02-27" },
                { t: "Контрагент создан", p: `Владелец — ${managerName(x.uid)}`, d: "2016-05-11" },
              ]}
            />
          </Section>
        ),
      },
    ],
  }
}

/* ---------- конфиг ---------- */

const received = (r: string[]) => ALL.filter((c) => inRange(c.last, r)).length
const withContracts = ALL.filter((c) => c.ct > 0).length

export const COUNTERPARTIES: ListConfig<Counterparty> = {
  key: "counterparties",
  title: "Контрагенты",
  crumb: "Продажи · Контрагенты",
  icon: Users,
  badge: "upd",
  req: "Доработано по требованиям ОТУП ДИППП: в карточке клиента — виджет «Связанные IP-ресурсы» со всеми заявками по точкам подключения",
  search: "Название, БИН/ИИН или ID контрагента",
  buttons: [
    { icon: FilePlus, label: "Новый контрагент", href: "/counterparties/new" },
    { icon: Box, label: "Песочница", href: "/sandbox" },
    { icon: Download, label: "Выгрузить в Excel", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.name} ${x.bin} ${x.id}`,
  tabs: [
    { k: "all", t: "Все", f: () => true },
    { k: "my", t: "Мои", f: (x) => x.uid === ME },
    { k: "other", t: "Чужие", f: (x) => x.uid !== ME },
    { k: "ct", t: "С договорами", f: (x) => x.ct > 0 },
  ],
  filters: [
    { k: "st", t: "Статус", get: (x) => String(x.st), opts: statusOpts },
    { k: "seg", t: "Сегмент", get: (x) => x.seg, opts: opts(SEG) },
    { k: "cat", t: "Категория", get: (x) => String(x.cat), opts: catOpts },
    { k: "typ", t: "Тип клиента", get: (x) => x.typ, opts: opts(TYP) },
  ],
  sort: ["last", -1],
  cols: [
    { k: "name", t: "Контрагент", value: (x) => x.name, render: (x) => <NameCell name={x.name} sub={`${x.form} · БИН ${x.bin} · ID ${x.id}`} /> },
    { k: "seg", t: "Сегмент", value: (x) => x.seg, render: (x) => x.seg },
    { k: "cat", t: "Категория", value: (x) => CAT[x.cat][0], render: (x) => <Dot text={CAT[x.cat][0]} color={CAT[x.cat][1]} /> },
    { k: "st", t: "Статус", value: (x) => STA[x.st][0], render: (x) => status(x.st) },
    { k: "uid", t: "Владелец", value: (x) => managerName(x.uid), render: (x) => owner(x.uid) },
    { k: "kp", t: "КП", num: true, value: (x) => x.kp, render: (x) => zero(x.kp) },
    { k: "ct", t: "Договоры", num: true, value: (x) => x.ct, render: (x) => zero(x.ct) },
    { k: "last", t: "Последнее КП", date: true, value: (x) => x.last, render: (x) => <DateCell d={x.last} /> },
  ],
  owner: { t: "Владелец", get: (x) => x.uid, name: managerName, render: (x) => owner(x.uid), set: (x, uid) => ({ ...x, uid }) },
  kpis: (r, rp) => [
    { t: "Всего в работе", icon: Users, c: ALL.length, note: "с КП или договором из 7 683" },
    { t: "Получили КП", icon: FileText, c: received(r), p: received(rp) },
    { t: "КП выставлено", icon: TrendingUp, c: sumOf(OFFERS, r), p: sumOf(OFFERS, rp) },
    { t: "С договорами", icon: Check, c: withContracts, note: `доля ${Math.round((withContracts / ALL.length) * 100)}% от работающих` },
  ],
  sub: (r, rp, p) => {
    const a = received(r)
    return `В работе ${fmt(ALL.length)} контрагентов. За ${periodLabel(p, r)} КП получили ${fmt(a)} — ${signed(delta(a, received(rp)))} ${prevLabel(p)}.`
  },
  record,
  name: (x) => x.name,
  blank: () => ({ id: 0, uid: ME, name: "", form: "ТОО", bin: "", seg: "B2B", ind: IND[0], cat: 0, typ: TYP[0], st: 0, kp: 0, ct: 0, dl: 0, cc: 1, last: null, city: "Астана" }),
  fields: [
    { k: "name", t: "Контрагент", type: "text", required: true, wide: true, get: (x) => x.name, set: (x, v) => ({ ...x, name: v.trim() }) },
    { k: "seg", t: "Сегмент", type: "select", opts: opts(SEG), get: (x) => x.seg, set: (x, v) => ({ ...x, seg: v }) },
    { k: "cat", t: "Категория", type: "select", opts: catOpts, get: (x) => String(x.cat), set: (x, v) => ({ ...x, cat: +v }) },
    { k: "st", t: "Статус", type: "select", opts: statusOpts, get: (x) => String(x.st), set: (x, v) => ({ ...x, st: +v }) },
    { k: "uid", t: "Владелец", type: "select", opts: ownerOpts, get: (x) => x.uid, set: (x, v) => ({ ...x, uid: v }) },
  ],
}
