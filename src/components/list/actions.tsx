"use client"

import { useState } from "react"
import Link from "next/link"
import { Dialog, DropdownMenu } from "radix-ui"
import { Copy, Ellipsis, Eye, Pencil, Share2, Trash2 } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { rowsStore } from "@/lib/list/store"
import type { ListConfig, Row } from "@/lib/list/types"
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

/** Подтверждение удаления; после — тост с «Отменить». */
export function useDeleteDialog<T extends Row>(cfg: ListConfig<T>) {
  const [items, setItems] = useState<{ rows: T[]; done?: () => void } | null>(null)
  const ask = (rows: T[], done?: () => void) => rows.length && setItems({ rows, done })

  const one = items?.rows.length === 1
  const name = items ? (one ? cfg.name(items.rows[0]) : `${items.rows.length} записей`) : ""
  const dialog = (
    <Dialog.Root open={!!items} onOpenChange={(o) => !o && setItems(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-[rgba(5,6,9,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-[111] w-[min(460px,calc(100vw-32px))] -translate-1/2 rounded-[26px] border border-border bg-background p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 max-sm:p-5"
        >
          <div className="mb-3.5 grid size-[52px] place-items-center rounded-2xl bg-[rgba(255,82,87,0.12)] text-[#ff5257]">
            <Trash2 className="size-6" />
          </div>
          <Dialog.Title className="text-[19px] font-bold">Удалить {one ? "запись" : `${items?.rows.length} записей`}?</Dialog.Title>
          <p className="mt-1.5 mb-4 text-[13.5px] leading-normal text-muted-foreground">
            <b className="text-foreground">{name}</b>
            <br />
            Удаление можно отменить сразу после него.
          </p>
          <div className="flex justify-end gap-2.5">
            <Dialog.Close asChild>
              <Btn>Отмена</Btn>
            </Dialog.Close>
            <Btn
              red
              onClick={() => {
                if (!items) return
                const undo = rowsStore.remove(cfg, items.rows.map((x) => x.id))
                items.done?.()
                setItems(null)
                toast(`Удалено: ${name}`, () => {
                  undo()
                  toast("Восстановлено")
                })
              }}
            >
              <Trash2 />
              Удалить
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
            <Trash2 />
            Удалить
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
