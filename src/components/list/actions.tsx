"use client"

import { useState } from "react"
import Link from "next/link"
import { Dialog, DropdownMenu } from "radix-ui"
import { CircleX, Copy, Ellipsis, Eye, Pencil, Share2, Trash2 } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Row } from "@/lib/list/types"
import { DateField } from "./date-field"
import { FormSelect } from "./select"
import { Btn, roundAction } from "./ui"

export const recordHref = (key: string, id: number) => `/${key}/${id}`

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
          <DropdownMenu.Item asChild className={item}>
            <Link href={`${recordHref(cfg.key, row.id)}/edit`}>
              <Pencil />
              Изменить
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => shareLink(cfg, row)}>
            <Share2 />
            Поделиться ссылкой
          </DropdownMenu.Item>
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
          <DropdownMenu.Item className={`${item} text-[#ff5257]`} onSelect={onDelete}>
            {cfg.archive ? <CircleX /> : <Trash2 />}
            {removeLabel(cfg)}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
