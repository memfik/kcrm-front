import Link from "next/link"
import { CircleCheck, CircleX, Clock, Download, Users } from "lucide-react"
import { DateCell, Kv, NameCell, Owner, Section, Status } from "@/components/list/cells"
import { MonthChart } from "@/components/list/month-chart"
import raw from "@/data/subscribers-demo.json"
import { binOf, counterpartyName, managerName, ownerColor } from "@/lib/demo-names"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { delta, inRange, periodLabel, prevLabel, signed, type Series } from "@/lib/period"

/*
 * 13 Абоненты — очередь абонентского отдела на заведение клиентов в биллинг. Строки — копия базы kCRM. TODO: API биллинга.
 */

export type Subscriber = {
  id: number
  cs: number
  deal: string
  /** Исполнитель абонотдела. */
  u: string
  /** Взята в работу / завершена ("" — ещё нет). */
  stw: string
  fin: string
  cm: string
  /** Заведён (1) или отклонён (0) — смысл есть только при fin. */
  succ: number
}

const ALL: Subscriber[] = raw.map(([id, cs, deal, u, stw, fin, cm, succ]) => ({ id: +id, cs: +cs, deal, u, stw, fin, cm, succ: +succ }))

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
const statusOf = (x: Subscriber): [string, string] =>
  x.fin ? (x.succ ? ["Заведён в биллинг", "#34c759"] : ["Отклонена", "#ff375f"]) : x.stw ? ["В работе", "#085eff"] : ["Новая", "#ff9f0a"]
const status = (x: Subscriber) => <Status text={statusOf(x)[0]} color={statusOf(x)[1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const entered = (r: string[]) => ALL.filter((x) => x.succ && inRange(x.fin, r)).length
const taken = (r: string[]) => ALL.filter((x) => inRange(x.stw, r)).length
const BY_MONTH: Series = ALL.filter((x) => x.succ && x.fin).reduce<Series>((o, x) => ((o[x.fin.slice(0, 7)] = (o[x.fin.slice(0, 7)] || 0) + 1), o), {})
const staffOpts: Option[] = [...new Set(ALL.map((x) => x.u))].map((v) => ({ v, label: managerName(v) }))

export const SUBSCRIBERS: ListConfig<Subscriber> = {
  key: "subscribers",
  title: "Абоненты",
  crumb: "Заявки · Заведение в биллинг",
  icon: Users,
  search: "Контрагент, сделка или комментарий",
  buttons: [
    { icon: CircleCheck, label: "Взять в работу", onClick: "bulk" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${counterpartyName(x.cs)} ${x.deal} ${x.cm}`,
  tabs: [
    { k: "n", t: "Новые", f: (x) => !x.stw },
    { k: "w", t: "В работе", f: (x) => !!x.stw && !x.fin },
    { k: "d", t: "Заведены", f: (x) => !!x.fin && !!x.succ },
    { k: "r", t: "Отклонены", f: (x) => !!x.fin && !x.succ },
    { k: "a", t: "Все", f: () => true },
  ],
  sort: ["fin", -1],
  cols: [
    { k: "id", t: "Абонент", value: (x) => counterpartyName(x.cs), render: (x) => <NameCell name={counterpartyName(x.cs)} sub={`ID ${x.cs} · БИН ${binOf(x.cs)}`} /> },
    { k: "deal", t: "Сделка", value: (x) => +x.deal, render: (x) => `№ ${x.deal}` },
    { k: "u", t: "Исполнитель", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "stw", t: "Начало", date: true, value: (x) => x.stw, render: (x) => <DateCell d={x.stw} /> },
    { k: "fin", t: "Завершение", date: true, value: (x) => x.fin, render: (x) => <DateCell d={x.fin} /> },
    { k: "cm", t: "Последнее действие", value: (x) => x.cm, render: (x) => <span className="text-muted-foreground">{x.cm || "—"}</span> },
    { k: "succ", t: "Статус", value: (x) => statusOf(x)[0], render: status },
  ],
  owner: { t: "Исполнитель", get: (x) => x.u, name: managerName, render: (x) => owner(x.u), set: (x, u) => ({ ...x, u }) },
  kpis: (r, rp) => [
    { t: "Заведено в биллинг", icon: CircleCheck, c: entered(r), p: entered(rp) },
    { t: "Взято в работу", icon: Clock, c: taken(r), p: taken(rp) },
    { t: "Отклонено", icon: CircleX, c: ALL.filter((x) => x.fin && !x.succ).length, note: "за всё время" },
    { t: "Всего абонентов", icon: Users, c: ALL.length, note: "в очереди абонотдела" },
  ],
  sub: (r, rp, p) => `Абонентский отдел: за ${periodLabel(p, r)} заведено ${entered(r)} абонентов — ${signed(delta(entered(r), entered(rp)))} ${prevLabel(p)}.`,
  analytics: { title: "По месяцам", render: ({ r, p }) => <MonthChart title="Заведено в биллинг по месяцам" series={BY_MONTH} r={r} p={p} /> },
  bulk: {
    done: "Взято в работу",
    run: (rows) => {
      // берём только новые — у остальных уже есть исполнитель и дата начала
      const fresh = rows.filter((x) => !x.stw)
      fresh.forEach((x) => rowsStore.save(SUBSCRIBERS, { ...x, stw: today() }))
      return () => fresh.forEach((x) => rowsStore.save(SUBSCRIBERS, x))
    },
  },
  cardStatus: "succ",
  record: (x) => {
    const info = [
      {
        t: "Контрагент",
        wide: true,
        v: (
          <Link href={`/counterparties/${x.cs}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
            {counterpartyName(x.cs)}
          </Link>
        ),
      },
      {
        t: "Сделка",
        v: (
          <Link href={`/deals/${x.deal}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
            № {x.deal}
          </Link>
        ),
      },
      { t: "Исполнитель", v: managerName(x.u) },
      { t: "Начало", v: <DateCell d={x.stw} /> },
      { t: "Завершение", v: <DateCell d={x.fin} /> },
      { t: "Комментарий", v: x.cm || "—", wide: true },
    ]
    return {
      title: counterpartyName(x.cs),
      meta: (
        <>
          {status(x)}
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">Сделка № {x.deal}</span>
          <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
            {x.fin ? <DateCell d={x.fin} /> : "в очереди"}
          </span>
        </>
      ),
      actions: x.fin
        ? []
        : [
            { icon: CircleCheck, label: "Завести в биллинг", apply: () => ({ ...x, stw: x.stw || today(), fin: today(), succ: 1 }) },
            { icon: CircleX, label: "Отклонить", apply: () => ({ ...x, stw: x.stw || today(), fin: today(), succ: 0 }) },
          ],
      stats: [
        { t: "Начало", v: <DateCell d={x.stw} /> },
        { t: "Завершение", v: <DateCell d={x.fin} /> },
        { t: "Статус", v: statusOf(x)[0] },
      ],
      facts: info.filter((i) => !i.wide),
      tabs: [
        {
          t: "Абонент",
          body: (
            <Section title="Заявка">
              <Kv items={info} />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => counterpartyName(x.cs),
  blank: () => ({ id: 0, cs: 0, deal: "", u: staffOpts[0].v, stw: "", fin: "", cm: "", succ: 0 }),
  fields: [
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "deal", t: "№ сделки", type: "number", required: true, get: (x) => x.deal, set: (x, v) => ({ ...x, deal: v }) },
    { k: "u", t: "Исполнитель", type: "select", opts: staffOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    { k: "cm", t: "Комментарий", type: "text", wide: true, get: (x) => x.cm, set: (x, v) => ({ ...x, cm: v.trim() }) },
  ],
}
