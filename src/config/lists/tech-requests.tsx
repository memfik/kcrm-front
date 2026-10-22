import { useState } from "react"
import Link from "next/link"
import { CircleCheck, CircleX, Clock, Download, FileCheck, FilePlus, FileText, List, MapPin, Paperclip, Search, Send, Undo2, Users } from "lucide-react"
import { Banner, DateCell, Dash, Flow, Kv, Line, MiniTable, NameCell, Owner, Pill, Section, Status, Timeline } from "@/components/list/cells"
import { MapBlock } from "@/components/list/map-block"
import { MonthChart } from "@/components/list/month-chart"
import { Btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { GlassSwitch } from "@/components/ui/opaline/glass-switch"
import { GlassTextarea } from "@/components/ui/opaline/glass-textarea"
import raw from "@/data/tech-requests-demo.json"
import { CITY, counterpartyName, fixClient, managerName, ownerColor, pick, rnd, STAFF } from "@/lib/demo-names"
import { BRANCHES, CATEGORIES, CATEGORIES_SHORT, STREETS } from "@/lib/dippp"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Option } from "@/lib/list/types"
import { delta, fmt, inRange, periodLabel, prevLabel, signed, type Series } from "@/lib/period"

/*
 * 09 Запросы ТВ и ТР. Доработано по требованиям ОТПП ТК ДИППП (п. 5, 7, 14, 15, 17, 20).
 * Строки — копия базы kCRM; категория, конечный клиент, «на доработке» и комментарии — заглушки по ID. TODO: API.
 */

export type TechRequest = {
  id: number
  type: string
  num: string
  /** Заказчик услуг и конечный клиент (п. 5). */
  cs: number
  end: number
  deal: number
  /** Инициатор и ответственный исполнитель ("" — не назначен). */
  u: string
  ex: string
  date: string
  /** Взята в работу / отработана. */
  stw: string
  fin: string
  comp: number
  tsol: number
  succ: number
  cancel: number
  center: number
  tender: number
  /** Категория (п. 20) — индекс в CATEGORIES. */
  cat: number
  /** Возвращена инициатору на доработку (п. 7). */
  back: number
  cm: string
}

const TYPE: Record<string, string> = Object.fromEntries(raw.types)
const p2 = (n: number) => String(n).padStart(2, "0")
const localDate = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
const today = () => localDate(new Date())

const ALL: TechRequest[] = raw.rows.map((t) => {
  const [id, type, num, cs, deal, u, ex, date, stw, fin, comp, tsol, succ, cancel, center, , tender, cm] = t
  return {
    id: +id,
    type: TYPE[type] || "ТК",
    num: +num ? num : id,
    cs: fixClient(cs, id),
    // у трети заявок конечный клиент — другой контрагент
    end: rnd(id, 202) % 3 === 0 ? fixClient(raw.rows[(+id * 7) % raw.rows.length][3], +id + 5) : fixClient(cs, id),
    deal: +deal,
    u,
    ex: +ex ? ex : "",
    // в копии базы у части заявок нет даты — ставим в пределах года до марта 2018
    date: date > "2000" ? date : localDate(new Date(2018, 2, 28 - (rnd(id, 77) % 330))),
    stw,
    fin,
    comp: +comp,
    tsol: +tsol,
    succ: +succ,
    cancel: +cancel,
    center: +center,
    tender: +tender,
    cat: rnd(id, 201) % 6,
    back: !+comp && !+cancel && rnd(id, 203) % 5 === 0 ? 1 : 0,
    cm: /тест|трогать/i.test(cm)
      ? pick(["Нужен интернет 50 Мбит/с в новый офис", "Проверить ТВ по ВОЛС до БЦ", "Подключение второй точки", "Перенос услуги на новый адрес"], id, 1)
      : cm,
  }
})

const status = (x: TechRequest): [string, string] =>
  x.back ? ["На доработке", "#ff9f0a"] : x.cancel ? ["Отклонена", "#ff375f"] : x.succ ? ["Отработана", "#34c759"] : x.comp ? ["В работе", "#085eff"] : ["Новая", "#ff9f0a"]
const statusCell = (x: TechRequest) => <Status text={status(x)[0]} color={status(x)[1]} />
const tv = (x: TechRequest) => (x.succ ? <Status text="Имеется" color="#34c759" /> : x.comp ? <Status text="Проверяется" color="#5ac8fa" /> : <Dash />)
const tr = (x: TechRequest) => (x.tsol ? <Status text="Приложено" color="#085eff" /> : <span className="text-[var(--faint)]">не приложено</span>)
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const executor = (x: TechRequest) => (x.ex ? owner(x.ex) : <span className="text-muted-foreground">не назначен</span>)
const made = (r: string[]) => ALL.filter((x) => inRange(x.date, r)).length
const BY_MONTH: Series = ALL.reduce<Series>((o, x) => ((o[x.date.slice(0, 7)] = (o[x.date.slice(0, 7)] || 0) + 1), o), {})
const save = (x: TechRequest) => rowsStore.save(TECH_REQUESTS, x)

const typeOpts: Option[] = [
  { v: "ТК", label: "ТК — телекоммуникации" },
  { v: "ТО", label: "ТО — оборудование" },
  { v: "СИ", label: "СИ — системная интеграция" },
  { v: "kCloud", label: "kCloud" },
  { v: "kSpot", label: "kSpot" },
]
const catOpts: Option[] = CATEGORIES.map((label, i) => ({ v: String(i), label }))
const centerOpts: Option[] = [
  { v: "1", label: "Централизованная" },
  { v: "0", label: "Локальная" },
]
const initiatorOpts: Option[] = [...new Set([...ALL.map((x) => x.u), ...STAFF.slice(0, 20)])].map((v) => ({ v, label: managerName(v) }))

/** Комментарий к заявке: «Занести в историю адреса» (п. 15). */
function CommentBox() {
  const [text, setText] = useState("")
  const [history, setHistory] = useState(true)
  return (
    <div className="mt-3 flex flex-col gap-3">
      <GlassTextarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Комментарий к заявке…" minRows={3} containerClassName="rounded-xl" className="text-sm text-foreground" />
      <label className="flex cursor-pointer items-center gap-3 text-[13px]">
        <GlassSwitch checked={history} onCheckedChange={setHistory} />
        Занести в историю адреса
      </label>
      <div>
        <Btn
          primary
          disabled={!text.trim()}
          onClick={() => {
            // TODO: сохранить комментарий (и запись в истории адреса) через API
            setText("")
            toast(history ? "Комментарий добавлен и занесён в историю адреса" : "Комментарий добавлен")
          }}
        >
          <Send />
          Отправить
        </Btn>
      </div>
    </div>
  )
}

function record(x: TechRequest) {
  const s = status(x)
  const city = pick(CITY, x.cs, 14)
  const address = `${pick(STREETS.slice(0, 4), x.cs, 21)}, ${(rnd(x.cs, 22) % 200) + 1}`
  const link = "text-[#085eff] hover:underline dark:text-[#9db8ff]"
  const params = [
    {
      t: "Категория",
      fresh: true,
      wide: true,
      v: (
        <>
          {CATEGORIES[x.cat]} ·{" "}
          <button
            type="button"
            className={`${link} cursor-pointer`}
            onClick={() => {
              const cat = (x.cat + 1) % CATEGORIES.length
              save({ ...x, cat })
              toast(`Категория: ${CATEGORIES[cat]}`)
            }}
          >
            изменить
          </button>
        </>
      ),
    },
    {
      t: "Заказчик услуг",
      fresh: true,
      v: (
        <Link href={`/counterparties/${x.cs}`} className={link}>
          {counterpartyName(x.cs)}
        </Link>
      ),
    },
    {
      t: "Конечный клиент",
      fresh: true,
      v: (
        <Link href={`/counterparties/${x.end}`} className={link}>
          {counterpartyName(x.end)}
        </Link>
      ),
    },
    { t: "Тип заявки", v: x.type },
    { t: "Тип обработки", v: x.center ? "Централизованная" : "Локальная" },
    { t: "Инициатор", v: managerName(x.u) },
    { t: "Подразделение", v: pick(BRANCHES, x.u, 2) },
    { t: "Ответственный", v: x.ex ? managerName(x.ex) : "не назначен" },
    { t: "Тендерная процедура", v: x.tender ? "Да" : "Нет" },
    { t: "Комментарий инициатора", v: x.cm || "—", wide: true },
  ]

  return {
    title: `Заявка ТВ и ТР № ${x.num}`,
    meta: (
      <>
        <Status text={s[0]} color={s[1]} />
        <Pill>{x.type}</Pill>
        {[counterpartyName(x.cs)].map((t) => (
          <span key={t} className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
            {t}
          </span>
        ))}
        <span className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
          <DateCell d={x.date} />
        </span>
      </>
    ),
    actions: [
      { icon: CircleCheck, label: "Взять в работу", apply: () => ({ ...x, comp: 1, back: 0, stw: x.stw || today() }) },
      { icon: Users, label: "Делегировать", delegate: true },
      { icon: Paperclip, label: "Приложить ТР", apply: () => ({ ...x, tsol: 1 }) },
      {
        icon: Undo2,
        label: "Вернуть на доработку",
        run: () => {
          if (x.comp) return void toast("Вернуть можно только до принятия в работу")
          save({ ...x, back: 1 })
          toast("Заявка возвращена инициатору — он получит уведомление", () => save(x))
        },
      },
      // TODO: отклонение с обязательным комментарием (п. 7) — диалог
      { icon: CircleX, label: "Отклонить с комментарием", apply: () => ({ ...x, cancel: 1, back: 0 }) },
      { icon: FileCheck, label: "Согласовать ТР", apply: () => ({ ...x, comp: 1, succ: 1, tsol: 1, fin: x.fin || today() }) },
    ],
    stats: [
      { t: "ТВ", v: x.succ ? "Имеется" : x.comp ? "Проверяется" : "—" },
      { t: "ТР", v: x.tsol ? "Приложено" : "не приложено" },
      { t: "Категория", v: CATEGORIES_SHORT[x.cat] },
      { t: "Сформирована", v: <DateCell d={x.date} /> },
    ],
    facts: params.filter((p) => !p.wide),
    tabs: [
      {
        t: "Заявка",
        body: (
          <>
            <Section title="Ход заявки">
              <Flow
                steps={[
                  { code: "Сформирован", text: x.date ? shortDay(x.date) : "—", state: "done" },
                  { code: "В работе", text: x.stw ? shortDay(x.stw) : "—", state: x.comp ? "done" : "on" },
                  { code: "Отработан", text: x.fin ? shortDay(x.fin) : "—", state: x.succ ? "done" : x.comp ? "on" : "todo" },
                ]}
              />
            </Section>
            {!!x.back && (
              <Banner icon={Undo2} title="Возвращена инициатору на доработку">
                «Не указан конечный клиент и точный адрес второй точки» — {managerName(x.ex || x.u)}
              </Banner>
            )}
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          </>
        ),
      },
      {
        t: "Точка подключения",
        body: (
          <>
            <Section title="Местоположение">
              <MapBlock id={x.cs} city={city} address={address} label={counterpartyName(x.cs)} />
              <Kv
                items={[
                  { t: "Город", v: city },
                  { t: "Адрес", v: address },
                  { t: "Проверка адреса", fresh: true, v: "2ГИС ✓ совпадение 97%" },
                  {
                    t: "История адреса",
                    fresh: true,
                    v: (
                      <Link href="/addresses" className={link}>
                        {1 + (rnd(x.cs, 9) % 5)} проверок · открыть
                      </Link>
                    ),
                  },
                ]}
              />
            </Section>
            <Section title="Предварительная оценка ТВ">
              {["Узел связи", "Муфта ВОЛС", "Линия ВОЛС"].map((n, k) => (
                <Line key={n} icon={MapPin}>
                  <b>
                    {n} {pick(["ast", "alm", "krg", "shm"], x.cs, k)}
                    {(rnd(x.cs, k + 50) % 90) + 10}.0{k + 1}
                  </b>
                  <span className="flex-1" />
                  <Pill>{(rnd(x.id, k + 60) % 900) + 40} м</Pill>
                </Line>
              ))}
            </Section>
          </>
        ),
      },
      {
        t: "Результат",
        body: (
          <>
            <Section title="Результат ТВ и ТР">
              <Kv
                items={[
                  { t: "ТВ", v: x.succ ? <Status text="Имеется" color="#34c759" /> : <Status text="Не определена" color="#8a93a6" /> },
                  { t: "ТР", v: tr(x) },
                  { t: "Технология", v: "ВОЛС · FTTB" },
                  { t: "Типовое ТР", v: `ТР-${(rnd(x.id, 70) % 40) + 1}` },
                ]}
              />
            </Section>
            <Section title="Вложения">
              {x.tsol ? (
                ["Схема организации подключения.pdf", "Типовое техническое решение.pdf"].map((f) => (
                  <Line key={f} icon={FileText}>
                    <b>{f}</b>
                  </Line>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Файлов нет</span>
              )}
            </Section>
          </>
        ),
      },
      {
        t: "Комментарии",
        fresh: true,
        body: (
          <Section title="Комментарии">
            <Timeline
              items={[
                { t: "Заявка создана", p: `${managerName(x.u)} · «${x.cm}»`, d: x.date },
                { t: "Взята в работу", p: `${x.ex ? managerName(x.ex) : "ОТПП ТК ДИППП"} · «Проверяем по карте сети»`, d: x.stw || x.date },
              ]}
            />
            <CommentBox />
          </Section>
        ),
      },
      {
        t: "Согласование ТР",
        fresh: true,
        body: (
          <>
            <Section title="Согласование внутри команды ДИППП">
              <Flow
                steps={[
                  { code: "Разработал", text: managerName(x.ex || x.u), state: "done" },
                  { code: "Проверил", text: managerName(STAFF[rnd(x.id, 301) % 24]), state: x.tsol ? "done" : "on" },
                  { code: "Утвердил", text: "Начальник ОТПП ТК", state: x.tsol && x.succ ? "done" : "todo" },
                ]}
              />
            </Section>
            <Section title="ТР">
              <Kv
                items={[
                  {
                    t: "Типовое ТР",
                    v: (
                      <>
                        ТР-{(rnd(x.id, 70) % 40) + 100} ·{" "}
                        <Link href="/typical-tr" className={link}>
                          справочник
                        </Link>
                      </>
                    ),
                  },
                  { t: "Ссылка на ТР ДЦРС", v: `ДЦРС-ТР-${50 + (rnd(x.id, 71) % 14)}` },
                ]}
              />
            </Section>
          </>
        ),
      },
      {
        t: "Доп. затраты",
        body: (
          <Section title="Дополнительные затраты">
            <MiniTable
              head={[{ t: "Статья" }, { t: "Сумма", right: true }]}
              rows={["Материалы", "Оборудование", "Работы", "Транспорт"].map((n, k) => [n, `${fmt(((rnd(x.id, 80 + k) % 300) + 20) * 1000)} ₸`])}
            />
          </Section>
        ),
      },
    ],
  }
}

const shortDay = (d: string) => <DateCell d={d.slice(0, 10)} />

export const TECH_REQUESTS: ListConfig<TechRequest> = {
  key: "tech-requests",
  title: "Запросы ТВ и ТР",
  crumb: "Заявки · Техническая возможность и техрешение",
  icon: FileCheck,
  badge: "upd",
  req: "Доработано по требованиям ОТПП ТК ДИППП: категории заявок (п. 20), заказчик и конечный клиент (п. 5), возврат на доработку и отклонение с комментарием (п. 7), «Занести в историю адреса» (п. 15), согласование ТР внутри команды (п. 17), проверка адреса 2ГИС / Яндекс / Google (п. 14)",
  search: "№ заявки, контрагент или инициатор",
  buttons: [
    { icon: FilePlus, label: "Заявка на ТВ и ТР", href: "/tech-requests/new" },
    { icon: Search, label: "Предварительная проверка", href: "/tv-precheck" },
    { icon: List, label: "Реестр КТС-РФ-ДППП-26", href: "/tv-registry" },
    // TODO: массовое «Делегировать» отмеченных заявок — сейчас передача только из карточки
    { icon: Users, label: "Делегировать" },
    { icon: Download, label: "Выгрузить в Excel", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.num} ${counterpartyName(x.cs)} ${managerName(x.u)} ${x.cm}`,
  tabs: [
    { k: "n", t: "Новые", f: (x) => !x.comp && !x.cancel && !x.back },
    { k: "b", t: "На доработке", fresh: true, f: (x) => !!x.back },
    { k: "w", t: "В работе", f: (x) => !!x.comp && !x.succ && !x.cancel },
    { k: "d", t: "Отработанные", f: (x) => !!x.succ },
    { k: "r", t: "Отклонённые", f: (x) => !!x.cancel },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [
    { k: "cat", t: "Категория", get: (x) => String(x.cat), opts: catOpts },
    { k: "type", t: "Тип", get: (x) => x.type, opts: typeOpts },
    { k: "center", t: "Обработка", get: (x) => String(x.center), opts: centerOpts },
  ],
  sort: ["date", -1],
  cols: [
    { k: "num", t: "Заявка", value: (x) => +x.num, render: (x) => <NameCell icon={FileCheck} name={`№ ${x.num} · ${x.type}`} sub={x.deal ? `Сделка № ${x.deal}` : "без сделки"} /> },
    { k: "cat", t: "Категория", fresh: true, value: (x) => x.cat, render: (x) => CATEGORIES_SHORT[x.cat] },
    { k: "cs", t: "Заказчик услуг", value: (x) => counterpartyName(x.cs), render: (x) => <b className="font-semibold">{counterpartyName(x.cs)}</b> },
    {
      k: "end",
      t: "Конечный клиент",
      fresh: true,
      value: (x) => counterpartyName(x.end),
      render: (x) => (x.end === x.cs ? <span className="text-muted-foreground">тот же</span> : counterpartyName(x.end)),
    },
    { k: "u", t: "Инициатор", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "date", t: "Сформирована", date: true, value: (x) => x.date, render: (x) => <DateCell d={x.date} /> },
    { k: "tv", t: "ТВ", value: (x) => x.succ, render: tv },
    { k: "tsol", t: "ТР", value: (x) => x.tsol, render: tr },
    { k: "st", t: "Статус", value: (x) => status(x)[0], render: statusCell },
  ],
  owner: { t: "Ответственный", get: (x) => x.ex, name: managerName, render: executor, set: (x, ex) => ({ ...x, ex }) },
  kpis: (r, rp) => [
    { t: "Новых заявок", icon: FileCheck, c: made(r), p: made(rp) },
    { t: "Ждут исполнителя", icon: Clock, c: ALL.filter((x) => !x.comp && !x.cancel).length, note: "не взяты в работу" },
    { t: "ТВ подтверждена", icon: CircleCheck, c: ALL.filter((x) => x.succ).length, note: `из ${ALL.length} заявок` },
    // TODO: средний срок отработки из API (в макете — константа)
    { t: "Срок отработки", icon: Clock, c: 3.4, p: 4.1, f: (v) => `${String(v).replace(".", ",")} дн` },
  ],
  sub: (r, rp, p) => `За ${periodLabel(p, r)} сформировано ${made(r)} заявок — ${signed(delta(made(r), made(rp)))} ${prevLabel(p)}.`,
  analytics: { title: "По месяцам", render: ({ r, p }) => <MonthChart title="Заявки на ТВ и ТР по месяцам" series={BY_MONTH} r={r} p={p} /> },
  record,
  name: (x) => `Заявка ТВ и ТР № ${x.num}`,
  // дата — при сохранении (сегодня), а не при рендере: страница пререндерится
  blank: () => ({
    id: 0, type: "ТК", num: "", cs: 0, end: 0, deal: 0, u: initiatorOpts[0].v, ex: "", date: "", stw: "", fin: "",
    comp: 0, tsol: 0, succ: 0, cancel: 0, center: 1, tender: 0, cat: 0, back: 0, cm: "",
  }),
  fields: [
    { k: "cs", t: "ID заказчика услуг", type: "number", required: true, get: (x) => (x.cs ? String(x.cs) : ""), set: (x, v) => ({ ...x, cs: +v || 0, date: x.date || today() }) },
    { k: "end", t: "ID конечного клиента", type: "number", get: (x) => (x.end ? String(x.end) : ""), set: (x, v) => ({ ...x, end: +v || x.cs }) },
    { k: "cat", t: "Категория", type: "select", opts: catOpts, get: (x) => String(x.cat), set: (x, v) => ({ ...x, cat: +v }) },
    { k: "u", t: "Инициатор", type: "select", opts: initiatorOpts, get: (x) => x.u, set: (x, v) => ({ ...x, u: v }) },
  ],
}
