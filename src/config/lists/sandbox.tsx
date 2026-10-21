import { Box, Download, Phone, Signature, Users } from "lucide-react"
import { Kv, NameCell, Owner, Section } from "@/components/list/cells"
import { Btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import raw from "@/data/counterparties-demo.json"
import { binOf, CITY, counterpartyName, managerName, ownerColor, pick } from "@/lib/demo-names"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig } from "@/lib/list/types"
import { COUNTERPARTIES, ME } from "./counterparties"

/*
 * 07 Песочница — контрагенты без активного менеджера (в копии базы — без КП, первые 800).
 * Любой менеджер может взять клиента себе: он пропадает отсюда и появляется в «Контрагентах». TODO: API.
 */

export type Free = {
  id: number
  /** Последний владелец. */
  u: string
  ct: number
  cc: number
  city: string
}

const ALL: Free[] = raw
  .filter((c) => +c[2] === 0)
  .slice(0, 800)
  .map(([id, uid, , , ct, , , cc]) => ({ id: +id, u: uid, ct: +ct, cc: +cc, city: pick(CITY, id, 14) }))

const owner = (u: string) => <Owner name={managerName(u)} color={ownerColor(u)} />
const name = (x: Free) => counterpartyName(x.id)

/** Взять себе: владелец в «Контрагентах» — текущий пользователь, из песочницы запись уходит. Возвращает отмену. */
function take(rows: Free[]) {
  const before = rows.map((x) => rowsStore.find(COUNTERPARTIES, x.id))
  before.forEach((c) => c && rowsStore.save(COUNTERPARTIES, { ...c, uid: ME }))
  const back = rowsStore.remove(SANDBOX, rows.map((x) => x.id))
  return () => {
    back()
    before.forEach((c) => c && rowsStore.save(COUNTERPARTIES, c))
  }
}

function TakeButton({ x }: { x: Free }) {
  return (
    <Btn
      className="h-8 px-3.5 text-[13px]"
      onClick={(e) => {
        e.stopPropagation()
        toast(`«${name(x)}» — теперь в ваших контрагентах`, take([x]))
      }}
    >
      Взять себе
    </Btn>
  )
}

export const SANDBOX: ListConfig<Free> = {
  key: "sandbox",
  title: "Песочница",
  crumb: "Продажи · Песочница",
  icon: Box,
  search: "Название, БИН или ID",
  buttons: [
    { icon: Users, label: "Взять в работу", onClick: "bulk" },
    { icon: Download, label: "Выгрузить", onClick: "export" },
  ],
  rows: () => ALL.map((x) => ({ ...x })),
  text: (x) => `${name(x)} ${x.id} ${binOf(x.id)}`,
  tabs: [
    { k: "a", t: "Все свободные", f: () => true },
    { k: "c", t: "С контактами", f: (x) => x.cc > 0 },
    { k: "n", t: "Без контактов", f: (x) => !x.cc },
  ],
  sort: ["id", -1],
  cols: [
    { k: "id", t: "Контрагент", value: name, render: (x) => <NameCell name={name(x)} sub={`БИН ${binOf(x.id)} · ID ${x.id}`} /> },
    { k: "city", t: "Город", value: (x) => x.city, render: (x) => x.city },
    { k: "cc", t: "Контакты", num: true, value: (x) => x.cc, render: (x) => x.cc || "—" },
    { k: "ct", t: "Договоры", num: true, value: (x) => x.ct, render: (x) => x.ct || "—" },
    { k: "u", t: "Последний владелец", value: (x) => managerName(x.u), render: (x) => owner(x.u) },
    { k: "take", t: "", noSort: true, value: () => null, render: (x) => <TakeButton x={x} /> },
  ],
  owner: { t: "Последний владелец", get: (x) => x.u, name: managerName, render: (x) => owner(x.u) },
  kpis: () => [
    { t: "Свободных контрагентов", icon: Box, c: ALL.length, note: "без активного менеджера" },
    { t: "С договорами", icon: Signature, c: ALL.filter((x) => x.ct).length, note: "есть история работы" },
    { t: "С контактами", icon: Users, c: ALL.filter((x) => x.cc).length, note: "можно звонить" },
    { t: "Без контактов", icon: Phone, c: ALL.filter((x) => !x.cc).length, note: "нужно найти ЛПР" },
  ],
  sub: () => "Контрагенты без активного менеджера. Любой менеджер может взять клиента себе — после этого он появится в «Контрагентах».",
  bulk: { done: "Взято в работу", run: take },
  record: (x) => {
    const info = [
      { t: "Город", v: x.city },
      { t: "Договоров", v: x.ct || "—" },
      { t: "Контактов", v: x.cc || "—" },
      { t: "Последний владелец", v: managerName(x.u) },
    ]
    return {
      title: name(x),
      meta: [`БИН ${binOf(x.id)}`, `ID ${x.id}`].map((t) => (
        <span key={t} className="inline-block h-[26px] rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2.5 leading-[26px]">
          {t}
        </span>
      )),
      actions: [
        {
          icon: Users,
          label: "Взять в работу",
          run: () => {
            toast(`«${name(x)}» — теперь в ваших контрагентах`, take([x]))
            return `/counterparties/${x.id}`
          },
        },
      ],
      stats: [
        { t: "Договоров", v: x.ct || "—" },
        { t: "Контактов", v: x.cc || "—" },
      ],
      facts: info,
      tabs: [
        {
          t: "Информация",
          body: (
            <Section title="Основное">
              <Kv items={info} />
            </Section>
          ),
        },
      ],
    }
  },
  name,
}
