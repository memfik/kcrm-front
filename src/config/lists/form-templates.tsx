import { CircleCheck, Clock, Download, Eye, FileText, Upload, Users } from "lucide-react"
import { DateCell, Kv, NameCell, Pill, Section } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import { rnd } from "@/lib/demo-names"
import { shiftDate, TODAY } from "@/lib/dippp"
import { exportCsv } from "@/lib/list/query"
import type { ListConfig, Option } from "@/lib/list/types"
import { shortDate } from "@/lib/period"

/*
 * 47 Шаблоны форм (ОТПП ТК ДИППП, п. 6): утверждённые рабочие формы подразделений — из них создаются заявки и выгрузки.
 * Перечень — как в макете (13 форм); версии и даты — заглушки по номеру. TODO: API — хранение файлов шаблонов, версии, скачивание.
 */

export type FormTemplate = {
  id: number
  code: string
  name: string
  /** Подразделение — владелец формы. */
  dep: string
  fmt: "xlsx" | "docx"
  ver: number
  upd: string
}

const FORMS: [string, string, string, FormTemplate["fmt"]][] = [
  ["КТС-РФ-ДППП-26", "Реестр заявок на определение ТВ и разработку ТР", "ОТПП ТК ДИППП", "xlsx"],
  ["СЗ-ТВ-Д", "СЗ на детальную проверку ТВ", "ОТПП ТК ДИППП", "docx"],
  ["СЗ-ТВ-П", "СЗ на предварительную проверку ТВ", "ОТПП ТК ДИППП", "docx"],
  ["СЗ-ДРС", "Исходящая СЗ в ДРС", "ОТПП ТК ДИППП", "docx"],
  ["ЗФ-IP", "Заявка на выделение / изъятие IP-адресов", "ОТУП ДИППП", "docx"],
  ["ЗФ-ID", "Заявка на присвоение ID-канала", "ОТУП ДИППП", "docx"],
  ["ЗФ-ТН", "Заявка на выделение телефонной нумерации", "ОТУП ДИППП", "docx"],
  ["НЗ-01", "Наряд-заказ на выполнение работ", "ОТУП ДИППП", "docx"],
  ["Н-01", "Наряд на работы", "ОТУП ДИППП", "docx"],
  ["ТП-01", "Заявка на тестовое подключение", "Коммерческий блок", "docx"],
  ["ВУ-01", "Временное увеличение объёма услуг", "Коммерческий блок", "docx"],
  ["ОРиП-01", "Рабочая форма ОРиП ФО", "ОРиП ФО", "xlsx"],
  ["ОУСД-01", "Рабочая форма ОУСД ФО", "ОУСД ФО", "xlsx"],
]

const ALL: FormTemplate[] = FORMS.map(([code, name, dep, fmt], i) => ({ id: i + 1, code, name, dep, fmt, ver: 1 + (rnd(i, 1) % 3), upd: shiftDate(TODAY, -(rnd(i, 2) % 300)) }))

const DEPS = [...new Set(ALL.map((x) => x.dep))]
const depOpts: Option[] = DEPS.map((v) => ({ v, label: v }))
const daysTo = (d: string) => Math.round((Date.parse(d) - Date.parse(TODAY)) / 864e5)

export const FORM_TEMPLATES: ListConfig<FormTemplate> = {
  key: "form-templates",
  title: "Шаблоны форм",
  crumb: "Справочники · Рабочие формы подразделений",
  icon: FileText,
  badge: "new",
  req: "ОТПП ТК ДИППП, п. 6 — шаблоны рабочих форм подразделений Общества в системе",
  search: "Код или название",
  foot: "шаблоны форм — перечень по требованиям ДИППП; файлы шаблонов не загружены",
  buttons: [
    { icon: Upload, label: "Загрузить шаблон", href: "/form-templates/new" },
    { icon: Download, label: "Выгрузить список", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.code} ${x.name} ${x.dep}`,
  filters: [{ k: "dep", t: "Подразделение", get: (x) => x.dep, opts: depOpts }],
  sort: ["id", 1],
  cols: [
    { k: "code", t: "Форма", value: (x) => x.code, render: (x) => <NameCell icon={FileText} name={x.code} sub={x.name} /> },
    { k: "dep", t: "Владелец", value: (x) => x.dep, render: (x) => <Pill>{x.dep}</Pill> },
    { k: "fmt", t: "Формат", value: (x) => x.fmt.toUpperCase(), render: (x) => x.fmt.toUpperCase() },
    { k: "ver", t: "Версия", num: true, value: (x) => x.ver, render: (x) => `v${x.ver}` },
    { k: "upd", t: "Обновлён", date: true, value: (x) => x.upd, render: (x) => <DateCell d={x.upd} /> },
  ],
  kpis: (_r, _rp, rows) => [
    { t: "Шаблонов", icon: FileText, c: rows.length },
    { t: "Подразделений", icon: Users, c: new Set(rows.map((x) => x.dep)).size },
    { t: "Обновлено за квартал", icon: Clock, c: rows.filter((x) => daysTo(x.upd) > -90).length },
    // связи шаблонов с заявками в примере нет — число из макета
    { t: "Используются в заявках", icon: CircleCheck, c: 9 },
  ],
  sub: () => "Утверждённые формы: из них создаются заявки и выгрузки. Новую версию загружает владелец формы.",
  noCards: true,
  record: (x) => {
    const params = [
      { t: "Название", v: x.name, wide: true },
      { t: "Владелец", v: x.dep },
      { t: "Формат", v: x.fmt.toUpperCase() },
      { t: "Версия", v: `v${x.ver}` },
      { t: "Обновлён", v: <DateCell d={x.upd} /> },
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
        // TODO: просмотр файла шаблона
        { icon: Eye, label: "Просмотр" },
        { icon: Upload, label: "Загрузить новую версию", href: `/form-templates/${x.id}/edit` },
        {
          icon: Download,
          label: "Скачать",
          run: () => {
            exportCsv(FORM_TEMPLATES, [x])
            toast(`${x.code} — файл шаблона появится с подключением хранилища; выгружена карточка (CSV)`)
          },
        },
      ],
      stats: [
        { t: "Версия", v: `v${x.ver}` },
        { t: "Владелец", v: x.dep },
        { t: "Формат", v: x.fmt.toUpperCase() },
        { t: "Обновлён", v: shortDate(x.upd) },
      ],
      facts: params,
      tabs: [
        {
          t: "Форма",
          body: (
            <Section title="Параметры">
              <Kv items={params} />
            </Section>
          ),
        },
      ],
    }
  },
  name: (x) => `Шаблон ${x.code}`,
  // форма — по колонкам (см. formOf); дата — при сохранении, а не при рендере: страница пререндерится
  blank: () => ({ id: 0, code: "", name: "", dep: DEPS[0], fmt: "docx", ver: 1, upd: "" }),
  fields: [
    { k: "code", t: "Форма", type: "text", required: true, get: (x) => x.code, set: (x, v) => ({ ...x, code: v.trim(), name: x.name || "Новая рабочая форма" }) },
    { k: "fmt", t: "Формат", type: "select", opts: [{ v: "docx", label: "DOCX" }, { v: "xlsx", label: "XLSX" }], get: (x) => x.fmt, set: (x, v) => ({ ...x, fmt: v as FormTemplate["fmt"] }) },
    { k: "upd", t: "Обновлён", type: "date", get: (x) => x.upd, set: (x, v) => ({ ...x, upd: v || new Date().toISOString().slice(0, 10) }) },
  ],
}
