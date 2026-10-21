"use client"

import { useState } from "react"
import Link from "next/link"
import { Dialog, DropdownMenu } from "radix-ui"
import { Check, CircleX, Copy, Ellipsis, Eye, Pencil, Share2, Trash2, Users } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { GlassTextarea } from "@/components/ui/opaline/glass-textarea"
import { ownerColor, pick, STAFF } from "@/lib/demo-names"
import { openForm } from "@/lib/list/form-store"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { Avatar, Pill } from "./cells"
import { DateField } from "./date-field"
import { FormSelect } from "./select"
import { Btn, roundAction } from "./ui"

export const recordHref = (key: string, id: number) => `/${key}/${id}`

/** У раздела есть форма (/new, /<id>/edit). */
export const editable = <T extends Row>(cfg: ListConfig<T>) => !!cfg.fields?.length && !!cfg.blank

export async function shareLink<T extends Row>(cfg: ListConfig<T>, x: T) {
  const url = `${location.origin}${recordHref(cfg.key, x.id)}`
  try {
    await navigator.clipboard.writeText(url)
    toast(`Ссылка на «${cfg.name(x)}» скопирована`)
  } catch {
    toast("Не удалось скопировать ссылку")
  }
}

/** Надпись кнопки удаления: «Удалить» или, у разделов с архивом, «Расторгнуть». */
export const removeLabel = <T extends Row>(cfg: ListConfig<T>) => cfg.archive?.verb ?? "Удалить"

/**
 * Подтверждение удаления; после — тост с «Отменить».
 * У разделов с `archive` (сделки) — «Расторгнуть»: дата и причина обязательны, запись остаётся во вкладке «Расторгнутые».
 */
export function useDeleteDialog<T extends Row>(cfg: ListConfig<T>) {
  const [items, setItems] = useState<{ rows: T[]; done?: () => void } | null>(null)
  const [reason, setReason] = useState("")
  const [date, setDate] = useState("")
  const [invalid, setInvalid] = useState(false)
  const ask = (rows: T[], done?: () => void) => {
    if (!rows.length) return
    setReason("")
    setDate(new Date().toISOString().slice(0, 10))
    setInvalid(false)
    setItems({ rows, done })
  }

  const arc = cfg.archive
  const n = items?.rows.length ?? 0
  const one = n === 1
  const name = items ? (one ? cfg.name(items.rows[0]) : `${n} записей`) : ""
  const Icon = arc ? CircleX : Trash2

  const confirm = () => {
    if (!items) return
    if (arc) {
      if (!reason) return setInvalid(true)
      const before = items.rows
      before.forEach((x) => rowsStore.save(cfg, arc.apply(x, reason, date)))
      items.done?.()
      setItems(null)
      toast(`${arc.verb === "Расторгнуть" ? "Расторгнуто" : arc.verb}: ${n} · ${arc.reasons.find((r) => r.v === reason)?.label}`, () => {
        before.forEach((x) => rowsStore.save(cfg, x))
        toast("Восстановлено")
      })
      return
    }
    const undo = rowsStore.remove(cfg, items.rows.map((x) => x.id))
    items.done?.()
    setItems(null)
    toast(`Удалено: ${name}`, () => {
      undo()
      toast("Восстановлено")
    })
  }

  const dialog = (
    <Dialog.Root open={!!items} onOpenChange={(o) => !o && setItems(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-[rgba(5,6,9,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[111] w-[min(460px,calc(100vw-32px))] -translate-1/2 rounded-[26px] border border-border bg-background p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 max-sm:p-5"
        >
          <div className="mb-3.5 grid size-[52px] place-items-center rounded-2xl bg-[rgba(255,82,87,0.12)] text-[#ff5257]">
            <Icon className="size-6" />
          </div>
          <Dialog.Title className="text-[19px] font-bold">
            {arc ? `${arc.verb} ${one ? arc.one : `${n} ${arc.many}`}?` : `Удалить ${one ? "запись" : `${n} записей`}?`}
          </Dialog.Title>
          <p className="mt-1.5 mb-4 text-[13.5px] leading-normal text-muted-foreground">
            <b className="text-foreground">{name}</b>
            <br />
            {arc ? arc.note : "Удаление можно отменить сразу после него."}
          </p>
          {arc && (
            <>
              <div className="mb-3 flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                Дата
                <DateField value={date} onChange={setDate} />
              </div>
              <div className="mb-3 flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                Причина
                <FormSelect
                  value={reason}
                  aria-label="Причина"
                  placeholder="Выберите причину…"
                  invalid={invalid}
                  options={arc.reasons}
                  onChange={(v) => {
                    setReason(v)
                    setInvalid(false)
                  }}
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2.5">
            <Dialog.Close asChild>
              <Btn>Отмена</Btn>
            </Dialog.Close>
            <Btn red onClick={confirm}>
              <Icon />
              {removeLabel(cfg)}
            </Btn>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
  return { ask, dialog }
}

const item =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-[9px] text-left text-[13.5px] outline-none data-[highlighted]:bg-[var(--mg-on)] [&_svg]:size-4"

/** Меню «Ещё» у записи. */
export function RowMenu<T extends Row>({ cfg, row, onDelete }: { cfg: ListConfig<T>; row: T; onDelete: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={roundAction} aria-label="Ещё" onClick={(e) => e.stopPropagation()}>
        <Ellipsis />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={12}
          onClick={(e) => e.stopPropagation()}
          className="z-[100] min-w-[200px] rounded-2xl border border-[var(--dd-line)] bg-[var(--dd-bg)] p-1.5 shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in"
        >
          <DropdownMenu.Item asChild className={item}>
            <Link href={recordHref(cfg.key, row.id)}>
              <Eye />
              Открыть
            </Link>
          </DropdownMenu.Item>
          {editable(cfg) && (
            <DropdownMenu.Item className={item} onSelect={() => openForm(cfg.key, row.id)}>
              <Pencil />
              Изменить
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item className={item} onSelect={() => shareLink(cfg, row)}>
            <Share2 />
            Поделиться ссылкой
          </DropdownMenu.Item>
          {editable(cfg) && (
            <DropdownMenu.Item
              className={item}
              onSelect={() => {
                rowsStore.duplicate(cfg, row)
                toast("Копия создана")
              }}
            >
              <Copy />
              Дублировать
            </DropdownMenu.Item>
          )}
          {!cfg.noDelete && (
            <DropdownMenu.Item className={`${item} text-[#ff5257]`} onSelect={onDelete}>
              {cfg.archive ? <CircleX /> : <Trash2 />}
              {removeLabel(cfg)}
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** «Передать»: выбор нового ответственного из сотрудников + комментарий; после — тост с «Отменить». */
export function useDelegateDialog<T extends Row>(cfg: ListConfig<T>) {
  const [row, setRow] = useState<T | null>(null)
  const [to, setTo] = useState("")
  const own = cfg.owner
  const people = STAFF.slice(0, 14)
  const ask = (x: T) => {
    setTo(people[0])
    setRow(x)
  }

  const dialog = own?.set ? (
    <Dialog.Root open={!!row} onOpenChange={(o) => !o && setRow(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-[rgba(5,6,9,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[111] w-[min(460px,calc(100vw-32px))] -translate-1/2 rounded-[26px] border border-border bg-background p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 max-sm:p-5"
        >
          <div className="mb-3.5 grid size-[52px] place-items-center rounded-2xl bg-[rgba(8,94,255,0.12)] text-[#085eff]">
            <Users className="size-6" />
          </div>
          <Dialog.Title className="text-[19px] font-bold">Передать</Dialog.Title>
          <p className="mt-1.5 mb-3 text-[13.5px] text-muted-foreground">{row && cfg.name(row)}</p>
          <div role="radiogroup" aria-label={own.t} className="mb-3 flex max-h-[260px] flex-col gap-0.5 overflow-auto">
            {people.map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={to === u}
                onClick={() => setTo(u)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13.5px] hover:bg-[var(--soft)]",
                  to === u && "bg-[color-mix(in_srgb,#085eff_10%,transparent)]"
                )}
              >
                <Avatar name={own.name(u)} color={ownerColor(u)} />
                {own.name(u)}
                <span className="flex-1" />
                <Pill>{pick(BRANCHES, u, 2)}</Pill>
                {to === u && <Check className="size-4 text-[#085eff]" />}
              </button>
            ))}
          </div>
          <div className="mb-4 flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
            Комментарий
            <GlassTextarea placeholder="Например: клиент в зоне вашего филиала" minRows={2} containerClassName="rounded-xl" className="text-sm text-foreground" />
          </div>
          <div className="flex justify-end gap-2.5">
            <Dialog.Close asChild>
              <Btn>Отмена</Btn>
            </Dialog.Close>
            <Btn
              primary
              onClick={() => {
                if (!row || !own.set) return
                const before = row
                rowsStore.save(cfg, own.set(row, to))
                setRow(null)
                toast(`Передано: ${own.name(to)}`, () => rowsStore.save(cfg, before))
              }}
            >
              <Check />
              Передать
            </Btn>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : null
  return { ask, dialog, can: !!own?.set }
}

const BRANCHES = ["АФ", "АС", "ВФ", "ЗФ", "МФ", "УФ", "ЮФ", "КФ", "ШФ", "ГО-ДКП", "ГО-ДУКО"]
