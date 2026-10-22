import { CircleCheck, Download, FileText, Layers, Link as LinkIcon, Pencil, Plus } from "lucide-react"
import { DateCell, Kv, Line, NameCell, Section, Timeline } from "@/components/list/cells"
import { pick, rnd } from "@/lib/demo-names"
import { shiftDate, TECH, TODAY, TV_SERVICES } from "@/lib/dippp"
import { briefFacts, briefStats, type BriefItem } from "@/lib/list/brief"
import type { ListConfig, Option } from "@/lib/list/types"
import { shortDate } from "@/lib/period"

/*
 * 46 Типовые ТР (ОТПП ТК ДИППП, пп. 9, 10, 12): перечень типовых ТР ДИППП и ТР ДЦРС / ДРС, на которые они ссылаются.
 * В копии базы перечня нет — 64 ТР собраны по номеру, как в макете. TODO: API — справочник ТР, вложения, версии, выбор ТР в заявке (09).
 */

export type TypicalTr = {
  id: number
  code: string
  /** ТР ДЦРС / ДРС (внешнее), а не ДИППП. */
  ext: boolean
  name: string
  tech: string
  serv: string
  ver: number
  upd: string
  /** Применений в заявках. */
  used: number
  /** Код ТР ДЦРС / ДРС, на который ссылается ТР ДИППП. */
  ref: string
}

const NAMES = ["Подключение по ВОЛС в БЦ", "Подключение по GPON", "Резервирование по РРЛ", "L2 VPN между филиалами", "Интернет через СО", "Спутниковый канал VSAT", "Организация узла в здании", "Подключение ЦОД kCloud", "Радиомост до 5 км", "Медный доступ xDSL"]

const ALL: TypicalTr[] = Array.from({ length: 64 }, (_, i) => {
  const id = 100 + i
  const ext = i >= 44
  return {
    id,
    code: ext ? `${pick(["ДЦРС", "ДРС"], id, 1)}-ТР-${10 + i}` : `ТР-${id}`,
    ext,
    name: pick(NAMES, id, 2),
    tech: pick(TECH, id, 3),
    serv: pick(TV_SERVICES, id, 4),
    ver: 1 + (rnd(id, 5) % 4),
    upd: shiftDate(TODAY, -(rnd(id, 6) % 500)),
    used: rnd(id, 7) % 120,
    ref: ext ? "" : rnd(id, 8) % 3 ? `ДЦРС-ТР-${50 + (rnd(id, 9) % 14)}` : "",
  }
})

const opts = (list: readonly string[]): Option[] => list.map((v) => ({ v, label: v }))

function record(x: TypicalTr) {
  const params: BriefItem[] = [
    { t: "Название", v: x.name, wide: true },
    { t: "Технология", v: x.tech },
    { t: "Услуга", v: x.serv },
    { t: "Ссылается на", v: x.ref || "—" },
    { t: "Версия", v: `v${x.ver}` },
    { t: "Обновлено", v: <DateCell d={x.upd} />, s: shortDate(x.upd) },
    { t: "Использовано в заявках", v: x.used },
  ]
  return {
    title: x.code,
    meta: (
      <>
        <span>{x.name}</span>
        <span>v{x.ver}</span>
      </>
    ),
    actions: [
      { icon: Pencil, label: "Изменить ТР", href: `/typical-tr/${x.id}/edit` },
      // TODO: подставить ТР в новую заявку ТВ/ТР
      { icon: CircleCheck, label: "Применить в заявке", href: "/tech-requests/new" },
    ],
    // как в макете: числовые колонки (версия, в заявках), затем поля карточки
    stats: briefStats(x.code, [{ t: "Версия", v: `v${x.ver}` }, { t: "В заявках", v: x.used }, ...params]),
    facts: briefFacts(params),
    tabs: [
      {
        t: "ТР",
        body: (
          <>
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
            <Section title="Вложения">
              <Line icon={FileText}>
                <b>{x.code} — схема.pdf</b>
              </Line>
              <Line icon={FileText}>
                <b>{x.code} — спецификация.xlsx</b>
              </Line>
            </Section>
          </>
        ),
      },
      {
        t: "Версии",
        body: (
          <Section title="История версий">
            <Timeline items={Array.from({ length: x.ver }, (_, k) => ({ t: `Версия ${x.ver - k}`, p: k ? "архив" : "текущая", d: shiftDate(x.upd, -k * 90) }))} />
          </Section>
        ),
      },
    ],
  }
}

export const TYPICAL_TR: ListConfig<TypicalTr> = {
  key: "typical-tr",
  title: "Типовые ТР",
  crumb: "Справочники · Типовые технические решения",
  icon: Layers,
  badge: "new",
  req: "ОТПП ТК ДИППП, пп. 9, 10, 12 — ручное ведение перечня типовых ТР и ТР ДЦРС / ДРС, на которые ссылаются ТР ДИППП; ссылки на ранее разработанные ТР",
  search: "Код, название или технология",
  foot: "типовые ТР — пример данных: в копии базы перечня нет",
  buttons: [
    { icon: Plus, label: "Добавить ТР", href: "/typical-tr/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.code} ${x.name} ${x.tech}`,
  tabs: [
    { k: "d", t: "Типовые ТР ДИППП", f: (x) => !x.ext },
    { k: "e", t: "ТР ДЦРС / ДРС", f: (x) => x.ext },
    { k: "a", t: "Все", f: () => true },
  ],
  filters: [{ k: "tech", t: "Технология", get: (x) => x.tech, opts: opts(TECH) }],
  sort: ["used", -1],
  cols: [
    { k: "code", t: "ТР", value: (x) => x.code, render: (x) => <NameCell icon={Layers} name={`${x.code} · ${x.name}`} sub={x.serv} /> },
    { k: "tech", t: "Технология", value: (x) => x.tech, render: (x) => x.tech },
    { k: "ref", t: "Ссылается на", value: (x) => x.ref, render: (x) => x.ref || "—" },
    { k: "ver", t: "Версия", num: true, value: (x) => x.ver, render: (x) => `v${x.ver}` },
    { k: "used", t: "В заявках", num: true, value: (x) => x.used, render: (x) => x.used },
    { k: "upd", t: "Обновлено", date: true, value: (x) => x.upd, render: (x) => <DateCell d={x.upd} /> },
  ],
  kpis: () => [
    { t: "Типовых ТР ДИППП", icon: Layers, c: ALL.filter((x) => !x.ext).length },
    { t: "ТР ДЦРС / ДРС", icon: FileText, c: ALL.filter((x) => x.ext).length },
    // применений за месяц в примере нет — числа из макета
    { t: "Применений за месяц", icon: CircleCheck, c: 212, p: 188 },
    { t: "Со ссылками", icon: LinkIcon, c: ALL.filter((x) => x.ref).length },
  ],
  sub: () => "Перечень ведётся вручную ответственными ДИППП. ТР ДИППП могут ссылаться на ТР ДЦРС / ДРС; в заявке ТР выбирается из этого списка.",
  record,
  name: (x) => `ТР ${x.code}`,
  // форма — по колонкам (см. formOf); дата обновления — при сохранении, а не при рендере: страница пререндерится
  blank: () => ({ id: 0, code: "", ext: false, name: "", tech: TECH[0], serv: TV_SERVICES[0], ver: 1, upd: "", used: 0, ref: "" }),
  fields: [
    // название в форме не правится (в макете тоже — поле по колонке «ТР»): у нового ТР — заглушка
    { k: "code", t: "ТР", type: "text", required: true, get: (x) => x.code, set: (x, v) => ({ ...x, code: v.trim(), name: x.name || "Новое типовое ТР", ext: /^(ДЦРС|ДРС)/.test(v.trim()) }) },
    { k: "upd", t: "Обновлено", type: "date", get: (x) => x.upd, set: (x, v) => ({ ...x, upd: v || new Date().toISOString().slice(0, 10) }) },
  ],
}
