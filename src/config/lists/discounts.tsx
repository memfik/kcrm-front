import Link from "next/link"
import { Check, CircleCheck, CircleDollarSign, CircleX, Clock, Download, Percent } from "lucide-react"
import { DateCell, NameCell, Owner, Section, Status, Timeline } from "@/components/list/cells"
import raw from "@/data/discounts-demo.json"
import prices from "@/data/offers-demo.json"
import { counterpartyName, managerName, ownerColor, pick, rnd } from "@/lib/demo-names"
import type { ListConfig, Option } from "@/lib/list/types"
import { fmt, inRange, money } from "@/lib/period"

/*
 * 06 Запросы скидки — очередь согласования скидок в КП (флаг coapp у согласующего).
 * Строки — копия базы kCRM; решение (новый / частично / подтверждён / отклонён) — заглушка по ID. TODO: API.
 */

type State = "new" | "part" | "ok" | "rej"

export type Discount = {
  /** № КП. */
  id: number
  cs: number
  u: string
  date: string
  /** Позиций на скидку / из них одобрено. */
  req: number
  ok: number
  /** По прейскуранту и с учётом скидки, ₸. */
  s: number
  es: number
  state: State
}

const ALL: Discount[] = raw.map(([id, cs, u, date, , req, ok, s, es]) => ({
  id: +id,
  cs: +cs,
  u,
  date,
  req: +req,
  ok: +ok,
  s: +s,
  es: +es,
  state: +ok >= +req ? (rnd(id, 1) % 7 ? "ok" : "part") : rnd(id, 2) % 3 ? "new" : "rej",
}))

const STATE: Record<State, [string, string]> = {
  new: ["Ожидает", "#ff9f0a"],
  part: ["Частично", "#5ac8fa"],
  ok: ["Подтверждена", "#34c759"],
  rej: ["Отклонена", "#ff375f"],
}
const tenge = (n: number) => `${money(n)} ₸`
/** В копии базы сумма со скидкой часто пустая — считаем 10%. */
const withDiscount = (x: Discount) => x.es || x.s * 0.9
const share = (x: Discount) => 1 - withDiscount(x) / Math.max(1, x.s)
const state = (x: Discount) => <Status text={STATE[x.state][0]} color={STATE[x.state][1]} />
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const initiatorOpts: Option[] = [...new Set(raw.map((d) => d[2]))].slice(0, 25).map((v) => ({ v, label: managerName(v) }))
const stateOpts: Option[] = (Object.keys(STATE) as State[]).map((v) => ({ v, label: STATE[v][0], color: STATE[v][1] }))
const madeIn = (r: string[]) => ALL.filter((x) => inRange(x.date, r))
const discountSum = (rows: Discount[]) => rows.reduce((a, x) => a + x.s - withDiscount(x), 0)

function record(x: Discount) {
  const items = Array.from({ length: Math.max(1, Math.min(5, x.req)) }, (_, k) => {
    const [name, price] = prices.price[rnd(x.id, 50 + k) % prices.price.length]
    return { name: name.slice(0, 60), price: +price, disc: (rnd(x.id, 60 + k) % 20) + 5 }
  })
  const th = "border-b border-border px-2.5 pb-2.5 text-left text-[11.5px] font-semibold tracking-[0.04em] text-[var(--faint)] uppercase first:pl-0 last:pr-0"
  const td = "border-b border-border px-2.5 py-3 align-top first:pl-0 last:pr-0 group-last:border-0"
  const decide = (s: State) => () => ({ ...x, state: s })

  return {
    title: `Запрос скидки · КП № ${x.id}`,
    meta: (
      <>
        {state(x)}
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">{counterpartyName(x.cs)}</span>
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
          <DateCell d={x.date} />
        </span>
      </>
    ),
    actions: [
      { icon: Check, label: "Подтвердить", apply: decide("ok") },
      { icon: Percent, label: "Частично", apply: decide("part") },
      { icon: CircleX, label: "Отклонить", apply: decide("rej") },
    ],
    stats: [
      { t: "По прейскуранту", v: tenge(x.s) },
      { t: "С учётом скидки", v: tenge(withDiscount(x)) },
      { t: "Скидка", v: `${Math.round(share(x) * 100)}%` },
      { t: "Составлено", v: <DateCell d={x.date} /> },
    ],
    facts: [
      {
        t: "КП",
        v: (
          <Link href={`/offers/${x.id}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
            № {x.id}
          </Link>
        ),
      },
      {
        t: "Контрагент",
        v: x.cs ? (
          <Link href={`/counterparties/${x.cs}`} className="text-[#085eff] hover:underline dark:text-[#9db8ff]">
            {counterpartyName(x.cs)}
          </Link>
        ) : (
          counterpartyName(0)
        ),
      },
      { t: "Позиций на скидку", v: x.req },
      { t: "Решение", v: state(x) },
    ],
    tabs: [
      {
        t: "Позиции",
        body: (
          <>
            <Section title="Запрошенные скидки">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13.5px]">
                  <thead>
                    <tr>
                      <th className={th}>Услуга</th>
                      <th className={`${th} text-right`}>Цена</th>
                      <th className={th}>Скидка</th>
                      <th className={th}>Допустимая</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, k) => (
                      <tr key={k} className="group">
                        <td className={td}>{it.name}</td>
                        <td className={`${td} text-right whitespace-nowrap tabular-nums`}>{fmt(it.price)} ₸</td>
                        <td className={`${td} font-bold tabular-nums ${it.disc > 10 ? "text-[#ff5257]" : ""}`}>{it.disc}%</td>
                        <td className={`${td} tabular-nums`}>10%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="Комментарий по скидке">
              <p className="text-sm text-muted-foreground">
                {pick(["Клиент сравнивает с предложением другого оператора", "Крупный клиент, 3 точки подключения", "Тендерная цена", "Продление договора на 3 года"], x.id, 7)}
              </p>
            </Section>
          </>
        ),
      },
      {
        t: "Маршрут",
        body: (
          <Section title="Согласование">
            <Timeline
              items={[
                { t: "Запрос отправлен", p: managerName(x.u), d: x.date },
                { t: "Первый согласующий", p: managerName(String(+x.u + 5)), d: x.date },
                { t: "Второй согласующий", p: managerName(String(+x.u + 9)), d: x.date },
              ]}
            />
          </Section>
        ),
      },
    ],
  }
}

export const DISCOUNTS: ListConfig<Discount> = {
  key: "discount-requests",
  title: "Запросы скидки",
  crumb: "Продажи · Запросы скидки",
  icon: Percent,
  search: "ID КП или название контрагента",
  buttons: [
    { icon: Check, label: "Согласовать выбранные", onClick: "bulk" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.id} ${counterpartyName(x.cs)} ${managerName(x.u)}`,
  tabs: [
    { k: "new", t: "Новые", f: (x) => x.state === "new" },
    { k: "part", t: "Частично", f: (x) => x.state === "part" },
    { k: "ok", t: "Согласованные", f: (x) => x.state === "ok" },
    { k: "rej", t: "Отклонённые", f: (x) => x.state === "rej" },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [{ k: "u", t: "Инициатор", get: (x) => x.u, opts: initiatorOpts }],
  sort: ["date", -1],
  cols: [
    { k: "id", t: "ID КП", value: (x) => x.id, render: (x) => <NameCell icon={Percent} name={`КП № ${x.id}`} sub={`${x.req} позиц. на скидку`} /> },
    { k: "cs", t: "Контрагент", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    { k: "u", t: "Инициатор", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "date", t: "Составлено", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "s", t: "По прейскуранту", num: true, value: (x) => x.s, render: (x) => tenge(x.s) },
    { k: "es", t: "С учётом скидки", num: true, value: (x) => withDiscount(x), render: (x) => tenge(withDiscount(x)) },
    { k: "dsc", t: "Скидка", num: true, value: (x) => Math.round(share(x) * 100), render: (x) => `${Math.round(share(x) * 100)}%` },
    { k: "state", t: "Решение", value: (x) => STATE[x.state][0], render: state },
  ],
  owner: { t: "Инициатор", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: (r, rp) => [
    { t: "Запросов", icon: Percent, c: madeIn(r).length, p: madeIn(rp).length },
    { t: "Сумма скидок", icon: CircleDollarSign, c: discountSum(madeIn(r)), p: discountSum(madeIn(rp)), f: tenge },
    { t: "Ожидают решения", icon: Clock, c: ALL.filter((x) => x.state === "new").length, note: "нужно рассмотреть" },
    {
      t: "Подтверждено",
      icon: CircleCheck,
      c: Math.round((ALL.filter((x) => x.state === "ok" || x.state === "part").length / ALL.length) * 100),
      f: (v) => `${v}%`,
      note: "доля одобренных",
    },
  ],
  sub: () => "Очередь согласования скидок в КП. Решение принимает согласующий (флаг coapp).",
  bulk: { done: "Согласовано", apply: (x) => ({ ...x, state: "ok" }) },
  cardStatus: "state",
  record,
  name: (x) => `Запрос скидки · КП № ${x.id}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({ id: 0, cs: 0, u: initiatorOpts[0].v, date: "", req: 1, ok: 0, s: 0, es: 0, state: "new" }),
  // № КП — это ID записи, его не правят: запрос скидки создаётся из КП. TODO: /discount-requests/new?kp=<id> — подставлять КП.
  fields: [
    { k: "cs", t: "ID контрагента", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0 }) },
    { k: "u", t: "Инициатор", type: "select", opts: initiatorOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
    { k: "date", t: "Составлено", type: "date", get: (x) => x.date, set: (x, v) => ({ ...x, date: v || x.date || new Date().toISOString().slice(0, 10) }) },
    { k: "req", t: "Позиций на скидку", type: "number", get: (x) => String(x.req), set: (x, v) => ({ ...x, req: +v || 1 }) },
    { k: "s", t: "По прейскуранту, ₸", type: "number", get: (x) => (x.s ? String(x.s) : ""), set: (x, v) => ({ ...x, s: +v || 0 }) },
    { k: "es", t: "С учётом скидки, ₸", type: "number", get: (x) => (x.es ? String(x.es) : ""), set: (x, v) => ({ ...x, es: +v || 0 }) },
    { k: "state", t: "Решение", type: "select", opts: stateOpts, get: (x) => x.state, set: (x, v) => ({ ...x, state: v as State }) },
  ],
}
