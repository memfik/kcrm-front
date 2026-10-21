import { useState } from "react"
import { CircleCheck, ClipboardCheck, FileText, MapPin, Search, Upload, Wrench } from "lucide-react"
import { Kv, NameCell, Pill, Section, Status } from "@/components/list/cells"
import { MapBlock } from "@/components/list/map-block"
import { Btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { CITY, pick, rnd } from "@/lib/demo-names"
import { STREETS } from "@/lib/dippp"
import { exportCsv } from "@/lib/list/query"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig } from "@/lib/list/types"
import { fmt } from "@/lib/period"
import { OPERATORS, TECH } from "./addresses"

/*
 * 37 Предварительная проверка ТВ (ОТПП ТК ДИППП, п. 16): адреса из поля ввода или файла сверяются и проверяются
 * по истории адресов и карте сети ЕСТУ. Вывод — по формуле от текста адреса, как в макете.
 * TODO: API — выделение адресов из документа, геокодер 2ГИС / Яндекс / Google, история адресов (36), карта сети ЕСТУ.
 */

type Verdict = "yes" | "likely" | "maybe" | "no"

export type Precheck = {
  id: number
  /** Как введено. */
  src: string
  norm: string
  city: string
  /** История адреса: 0 — ТВ была, 1 — проверок не было, 2 — ТВ не было. */
  hist: number
  /** До узла сети ЕСТУ, м. */
  node: number
  v: Verdict
  so: string[]
  tech: string
  /** Исправлена опечатка. */
  fixed: boolean
}

const SAMPLE = [
  "Алматы, пр. Абая, 52",
  "Астана, пр. Мангилик Ел, 55/20",
  "Шымкент, ул. Байтурсынова, 14",
  "43.2389, 76.9455",
  "Караганда, ул. Ерубаева 35",
  "Актобе, пр. Санкибай батыра, 1",
  "Атырау, ул. Сатпаева, 19А",
  "Костанай, пр. Аль-Фараби, 119",
]
const VERDICT: Record<Verdict, [string, string]> = {
  yes: ["ТВ есть (по истории)", "#34c759"],
  likely: ["Вероятно есть", "#5ac8fa"],
  maybe: ["Нужна стройка", "#ff9f0a"],
  no: ["Нужна детальная проверка", "#8a93a6"],
}
const HIST = ["ТВ подтверждалась ранее", "Проверок не было", "Ранее ТВ не было"]

function check(lines: string[]): Precheck[] {
  return lines.map((s, i) => {
    const id = 9000 + [...s].reduce((a, c) => a + c.charCodeAt(0), 0)
    const coord = /^\s*\d+[.,]\d+\s*,\s*\d+[.,]\d+\s*$/.test(s)
    const city = CITY.find((c) => s.includes(c)) ?? (coord ? "Алматы" : pick(CITY, id, 1))
    const hist = rnd(id, 2) % 3
    const node = (rnd(id, 3) % 1400) + 30
    return {
      id: i + 1,
      src: s.trim(),
      norm: coord
        ? `${city}, ${pick(STREETS, id, 4)}, ${(rnd(id, 5) % 90) + 1} (по координатам)`
        : `${city}, ${s.replace(city, "").replace(/^[,\s]+/, "").trim()}`,
      city,
      hist,
      node,
      v: hist === 0 ? "yes" : node < 350 ? "likely" : node < 900 ? "maybe" : "no",
      so: OPERATORS.filter((_, k) => rnd(id, 20 + k) % 5 === 0),
      tech: pick(TECH, id, 6),
      fixed: !coord && rnd(id, 7) % 3 === 0,
    }
  })
}

const verdict = (x: Precheck) => <Status text={VERDICT[x.v][0]} color={VERDICT[x.v][1]} />
const good = (x: Precheck) => x.v === "yes" || x.v === "likely"

function run(text: string) {
  const lines = text
    .split(/\n|;/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4)
  if (!lines.length) return toast("Адресов не найдено")
  rowsStore.replace(TV_PRECHECK, check(lines))
  toast(`Проверено адресов: ${lines.length}`)
}

/** Поле ввода адресов над результатами. */
function Tool() {
  const [text, setText] = useState(SAMPLE.join("\n"))
  const [file, setFile] = useState("")
  const load = (f: File | undefined) => {
    if (!f) return
    setFile(f.name)
    if (/\.(txt|csv)$/i.test(f.name)) {
      f.text().then((t) => {
        setText(t)
        run(t)
      })
      return
    }
    // TODO: выделение адресов из .docx / .xlsx / .pdf на сервере — пока пример, как в макете
    const lines = SAMPLE.slice(0, 5)
    setText(`Из файла «${f.name}» выделено адресов: ${lines.length}\n${lines.join("\n")}`)
    run(lines.join("\n"))
  }
  return (
    <section className="rounded-3xl border border-border bg-card px-6 py-5 shadow-[var(--panel-shadow)] max-sm:rounded-[20px] max-sm:px-4">
      <h3 className="text-[17px] font-bold tracking-[-0.015em]">Адреса для проверки</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">Например: «Алматы, пр. Абая, 52» или «43.2389, 76.9455». Можно вставить целый текст СЗ — адреса найдутся сами.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        aria-label="Адреса для проверки"
        className="mt-3 w-full resize-y rounded-2xl border border-border bg-[var(--soft)] px-4 py-3 font-mono text-[13px] leading-[1.6] outline-none focus:border-[#085eff]"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <Btn primary onClick={() => run(text)}>
          <Search />
          Проверить
        </Btn>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-dashed border-border px-4 text-[13px] text-muted-foreground hover:bg-[var(--soft)] [&_svg]:size-4">
          <Upload />
          {file || "Приложить документ (.docx, .xlsx, .pdf, .txt)"}
          <input type="file" hidden accept=".txt,.csv,.docx,.xlsx,.pdf" onChange={(e) => load(e.target.files?.[0])} />
        </label>
        <span className="flex-1" />
        <span className="text-[12.5px] text-muted-foreground">Источники: история адресов · карта сети ЕСТУ · сети СО</span>
      </div>
    </section>
  )
}

/** Заключение — CSV текущих результатов. TODO: печатная форма заключения. */
const conclusion = () => {
  const rows = rowsStore.all(TV_PRECHECK)
  exportCsv({ title: "Заключение о предварительной ТВ", cols: TV_PRECHECK.cols }, rows)
  toast(`Заключение по ${rows.length} адресам выгружено (CSV)`)
}

export const TV_PRECHECK: ListConfig<Precheck> = {
  key: "tv-precheck",
  title: "Предварительная проверка ТВ",
  crumb: "Заявки · Автоматическая проверка",
  icon: Search,
  badge: "new",
  req: "ОТПП ТК ДИППП, п. 16 — автоматическая предварительная проверка ТВ по полю ввода или текстовому документу: адреса выделяются, сверяются и проверяются по истории адресов и карте сети ЕСТУ",
  search: "Адрес",
  buttons: [
    { icon: FileText, label: "Скачать заключение", run: conclusion },
    { icon: ClipboardCheck, label: "Создать заявку на детальную проверку", href: "/tech-requests/new" },
  ],
  rows: () => check(SAMPLE),
  text: (x) => `${x.src} ${x.norm}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "y", t: "ТВ есть / вероятно", f: good },
    { k: "n", t: "Нужна проверка", f: (x) => !good(x) },
  ],
  sort: ["id", 1],
  cols: [
    { k: "src", t: "Адрес", value: (x) => x.id, render: (x) => <NameCell icon={MapPin} name={x.norm} sub={`введено: «${x.src}»${x.fixed ? " · исправлено" : ""}`} /> },
    { k: "v", t: "Предварительная ТВ", value: (x) => VERDICT[x.v][0], render: verdict },
    { k: "node", t: "До узла сети (ЕСТУ)", num: true, value: (x) => x.node, render: (x) => `${fmt(x.node)} м` },
    { k: "tech", t: "Технология", value: (x) => x.tech, render: (x) => x.tech },
    {
      k: "so",
      t: "Сети СО",
      noSort: true,
      value: (x) => x.so.join(", "),
      render: (x) =>
        x.so.length ? (
          <span className="inline-flex flex-wrap gap-1">
            {x.so.map((s) => (
              <Pill key={s}>{s}</Pill>
            ))}
          </span>
        ) : (
          "—"
        ),
    },
    {
      k: "hist",
      t: "История адреса",
      value: (x) => HIST[x.hist],
      render: (x) => (x.hist === 0 ? <Status text="ТВ была" color="#34c759" /> : x.hist === 1 ? "проверок не было" : <Status text="ТВ не было" color="#ff375f" />),
    },
  ],
  kpis: (_r, _rp, rows) => [
    { t: "Адресов проверено", icon: MapPin, c: rows.length },
    { t: "ТВ есть / вероятно", icon: CircleCheck, c: rows.filter(good).length },
    { t: "Нужна стройка", icon: Wrench, c: rows.filter((x) => x.v === "maybe").length },
    { t: "На детальную проверку", icon: ClipboardCheck, c: rows.filter((x) => x.v === "no").length },
  ],
  top: () => <Tool />,
  sub: () =>
    "Вставьте адреса или координаты (по одному в строке) или приложите документ — система выделит адреса, сверит их с 2ГИС / Яндекс / Google и даст предварительный ответ по истории адресов и карте сети ЕСТУ.",
  noCards: true,
  noDelete: true,
  record: (x) => ({
    title: x.norm,
    meta: (
      <>
        {verdict(x)}
        <Pill>{x.tech}</Pill>
      </>
    ),
    actions: [
      { icon: ClipboardCheck, label: "Создать заявку на детальную проверку", href: "/tech-requests/new" },
      { icon: MapPin, label: "История адреса", href: "/addresses" },
    ],
    stats: [
      { t: "Вывод", v: VERDICT[x.v][0] },
      { t: "До узла сети", v: `${fmt(x.node)} м` },
      { t: "Технология", v: x.tech },
    ],
    facts: [
      { t: "Город", v: x.city },
      { t: "До узла сети (ЕСТУ)", v: `${fmt(x.node)} м` },
      { t: "История адреса", v: HIST[x.hist] },
      { t: "Сети СО", v: x.so.join(", ") || "нет" },
      { t: "Введено", v: x.src },
    ],
    tabs: [
      {
        t: "Результат",
        body: (
          <>
            <Section title="Распознанный адрес">
              <Kv
                items={[
                  { t: "Введено", v: x.src, wide: true },
                  { t: "Нормализовано", v: x.norm, wide: true },
                  { t: "Исправление", v: x.fixed ? "Опечатка в названии улицы — предложен вариант 2ГИС" : "Не требуется", wide: true },
                ]}
              />
            </Section>
            <Section title="Предварительная ТВ">
              <Kv
                items={[
                  { t: "Вывод", v: verdict(x) },
                  { t: "До узла сети", v: `${fmt(x.node)} м` },
                  { t: "Технология", v: x.tech },
                  { t: "История адреса", v: HIST[x.hist] },
                  { t: "Сети СО", v: x.so.join(", ") || "нет", wide: true },
                ]}
              />
            </Section>
          </>
        ),
      },
      {
        t: "Карта",
        body: (
          <Section title="Точка и сеть ЕСТУ">
            <MapBlock id={9000 + x.id} city={x.city} address={x.norm.split(", ").slice(1).join(", ")} label={x.norm} />
          </Section>
        ),
      },
    ],
  }),
  name: (x) => x.norm,
}
