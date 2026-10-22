import { CircleCheck, Download, Pencil, Plus, Route, UserCheck, Users } from "lucide-react"
import { Fresh, Line, MiniTable, NameCell, Owner, Pill, Section } from "@/components/list/cells"
import { toast } from "@/components/shared/toast"
import { managerName, ownerColor, rnd, STAFF } from "@/lib/demo-names"
import { DEPARTMENTS } from "@/lib/dippp"
import type { ListConfig, Option } from "@/lib/list/types"

/*
 * 45 Подразделения (ОТПП ТК ДИППП, пп. 1–4): участники процесса ТВ, видимость блоков интерфейса по отделу и должности,
 * делегирование по регламенту. Перечень — справочник ДИППП, руководители и численность — заглушки по номеру, как в макете.
 * TODO: API — справочник подразделений из AD, права на блоки, правила делегирования.
 */

type Role = "Инициатор" | "Исполнитель" | "Исполнитель (зона ДРС)"

export type Department = {
  id: number
  name: string
  full: string
  role: Role
  lvl: "Филиал" | "ГО"
  /** Руководитель — сотрудник из справочника. */
  head: string
  n: number
  /** Подключено к процессу ТВ по новым требованиям (ДПЛО, ДМПО). */
  fresh: boolean
}

const FULL: Record<string, string> = {
  "ОРиП ФО": "Отдел развития и продаж филиала",
  "ОУСД ФО": "Отдел управления сетью доступа филиала",
  "КБ ФО": "Коммерческий блок филиала",
  ДКП: "Департамент корпоративных продаж",
  ДПЛО: "Департамент продаж ЛО",
  ДМПО: "Департамент продаж МПО",
  СТС: "Служба технического сопровождения",
  "ОТПП ТК ДИППП": "Отдел ТПП ТК ДИППП",
  "ОТУП ДИППП": "Отдел ТУП ДИППП",
  ДРС: "Департамент развития сети",
  ДЦРС: "Департамент цифрового развития сети",
}
const BLOCKS = ["Заявки ТВ и ТР", "Реестр КТС-РФ-ДППП-26", "Предварительная проверка", "Адреса и история", "Наряд-заказы", "Наряды", "Заявки IP / ID / номера", "Отчёты", "Справочники"]

const ALL: Department[] = DEPARTMENTS.map((name, i) => ({
  id: i + 1,
  name,
  full: FULL[name] ?? name,
  role: i < 7 ? "Инициатор" : i < 9 ? "Исполнитель" : "Исполнитель (зона ДРС)",
  lvl: /ФО/.test(name) ? "Филиал" : "ГО",
  head: STAFF.slice(0, 24)[(i + 2) % 24],
  n: 6 + (rnd(i, 1) % 40),
  fresh: name === "ДПЛО" || name === "ДМПО",
}))

const initiator = (x: Department) => x.role === "Инициатор"
const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const staffOpts: Option[] = STAFF.slice(0, 60).map((v) => ({ v, label: managerName(v) }))

/** Кому можно передать заявку — по регламенту, «всеми на всех» нельзя. */
const delegateTo = (x: Department) =>
  initiator(x)
    ? ["ОТПП ТК ДИППП (централизованные)", "ОУСД ФО своего филиала (локальные)"]
    : x.name === "ОТПП ТК ДИППП"
      ? ["Филиалы Общества (ОУСД ФО)", "Сторонние операторы (СО)", "ДРС — исходящие СЗ"]
      : ["Внутри отдела"]

function Access({ x }: { x: Department }) {
  const cell = (on: boolean, text: string) => <span className={on ? "font-bold text-[#34c759]" : "text-muted-foreground"}>{on ? text : "скрыт"}</span>
  return (
    <MiniTable
      head={[{ t: "Блок" }, { t: "Сотрудник" }, { t: "Начальник отдела" }]}
      rows={BLOCKS.map((b, k) => {
        const seen = initiator(x) ? k === 0 || k === 2 || k === 4 || k === 6 : k !== 8
        const edit = !initiator(x) || k < 3
        return [b, cell(seen, edit ? "просмотр и правка" : "просмотр"), cell(seen || k === 7, "всё по отделу")]
      })}
    />
  )
}

export const DEPARTMENTS_LIST: ListConfig<Department> = {
  key: "departments",
  title: "Подразделения",
  crumb: "Справочники · Подразделения и права",
  icon: Users,
  badge: "new",
  req: "ОТПП ТК ДИППП, пп. 1–4 — все подразделения в одном процессе (в т. ч. ДПЛО и ДМПО), изменение перечня подразделений, видимость блоков интерфейса по отделу и должности, делегирование только по регламенту",
  search: "Подразделение",
  foot: "подразделения — справочник ДИППП; руководители и численность — пример данных",
  buttons: [
    { icon: Plus, label: "Добавить подразделение", href: "/departments/new" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${x.name} ${x.full}`,
  tabs: [
    { k: "a", t: "Все", f: () => true },
    { k: "i", t: "Инициаторы", f: initiator },
    { k: "e", t: "Исполнители", f: (x) => !initiator(x) },
  ],
  sort: ["id", 1],
  cols: [
    { k: "name", t: "Подразделение", value: (x) => x.name, render: (x) => <NameCell icon={Users} name={x.name} sub={x.full} /> },
    { k: "lvl", t: "Уровень", value: (x) => x.lvl, render: (x) => <Pill>{x.lvl}</Pill> },
    {
      k: "role",
      t: "Роль в процессе ТВ",
      value: (x) => x.role,
      render: (x) => (
        <>
          {x.role}
          {x.fresh && <Fresh />}
        </>
      ),
    },
    { k: "head", t: "Руководитель", value: (x) => managerName(x.head), render: (x) => owner(x.head) },
    { k: "n", t: "Сотрудников", num: true, value: (x) => x.n, render: (x) => x.n },
  ],
  owner: { t: "Руководитель", get: (x) => x.head, name: managerName, render: (x) => owner(x.head), set: (x, head) => ({ ...x, head }) },
  kpis: (_r, _rp, rows) => [
    { t: "Подразделений", icon: Users, c: rows.length },
    { t: "Инициаторов", icon: Plus, c: rows.filter(initiator).length },
    { t: "Исполнителей", icon: UserCheck, c: rows.filter((x) => !initiator(x)).length },
    { t: "Подключены к процессу ТВ", icon: CircleCheck, c: rows.filter((x) => x.fresh).length, note: "ДПЛО и ДМПО — новые" },
  ],
  sub: () => "Перечень подразделений можно менять при изменении структуры. Для каждого задаются видимые блоки интерфейса и кому разрешено делегировать заявки по регламенту.",
  noCards: true,
  record: (x) => ({
    title: x.name,
    meta: (
      <>
        <Pill>{x.lvl}</Pill>
        <span>{x.role}</span>
      </>
    ),
    actions: [
      // как в макете: «Изменить права» открывает форму подразделения
      { icon: Pencil, label: "Изменить права", href: `/departments/${x.id}/edit` },
      // TODO: список сотрудников подразделения из AD
      { icon: Users, label: "Сотрудники", run: () => toast(`Сотрудников в ${x.name}: ${x.n} — список появится с подключением AD`) },
    ],
    stats: [
      { t: "Уровень", v: x.lvl },
      { t: "Роль в процессе ТВ", v: x.role },
      { t: "Сотрудников", v: x.n },
    ],
    facts: [
      { t: "Полное название", v: x.full },
      { t: "Уровень", v: x.lvl },
      { t: "Роль в процессе ТВ", v: x.role },
      { t: "Руководитель", v: managerName(x.head) },
      { t: "Сотрудников", v: x.n },
    ],
    tabs: [
      {
        t: "Права доступа",
        body: (
          <Section title="Видимость блоков интерфейса">
            <Access x={x} />
          </Section>
        ),
      },
      {
        t: "Делегирование",
        body: (
          <Section title="Кому можно передать заявку (по регламенту)">
            {delegateTo(x).map((s) => (
              <Line key={s} icon={Route}>
                <b>{s}</b>
              </Line>
            ))}
            <p className="mt-2.5 text-[12.5px] text-muted-foreground">Назначение «всеми на всех» запрещено.</p>
          </Section>
        ),
      },
    ],
  }),
  name: (x) => `Подразделение ${x.name}`,
  blank: () => ({ id: 0, name: "", full: "", role: "Инициатор", lvl: "ГО", head: staffOpts[0].v, n: 0, fresh: false }),
  // форма — по колонкам (см. formOf); руководитель — из сотрудников
  fields: [
    { k: "name", t: "Подразделение", type: "text", required: true, get: (x) => x.name, set: (x, v) => ({ ...x, name: v.trim(), full: x.full || v.trim() }) },
    { k: "lvl", t: "Уровень", type: "select", opts: [{ v: "ГО", label: "ГО" }, { v: "Филиал", label: "Филиал" }], get: (x) => x.lvl, set: (x, v) => ({ ...x, lvl: v as Department["lvl"] }) },
    { k: "role", t: "Роль в процессе ТВ", type: "select", opts: (["Инициатор", "Исполнитель", "Исполнитель (зона ДРС)"] as Role[]).map((v) => ({ v, label: v })), get: (x) => x.role, set: (x, v) => ({ ...x, role: v as Role }) },
    { k: "head", t: "Руководитель", type: "select", opts: staffOpts, get: (x) => x.head, set: (x, v) => ({ ...x, head: v }) },
  ],
}
