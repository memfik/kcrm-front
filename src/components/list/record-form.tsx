"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog } from "radix-ui"
import { Check, Lock, Trash2, X } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { formOf } from "@/lib/list/auto-form"
import { closeForm } from "@/lib/list/form-store"
import { rowsStore, useRows } from "@/lib/list/store"
import type { Field, ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { recordHref, removeLabel, useDeleteDialog } from "./actions"
import { GlassInput } from "@/components/ui/opaline/glass-input"
import { GlassTextarea } from "@/components/ui/opaline/glass-textarea"
import { LiquidGlass } from "@/components/ui/opaline/liquid-glass"
import { Banner } from "./cells"
import { DateField } from "./date-field"
import { FormSelect } from "./select"
import { Btn } from "./ui"

/** Поля формы — Opaline (GlassInput / GlassTextarea / GlassSelect / GlassDatePicker), одного размера. */
const glassField = "h-11 rounded-xl px-3.5 text-foreground has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-[#ff5257]"

/**
 * Создание и редактирование записи — панелью справа поверх текущей страницы, как в макетах (адрес не меняется).
 * Открывается через openForm(), закрывается крестиком, «Отменой», кликом мимо, Esc или «Назад» в браузере.
 */
export function RecordForm<T extends Row>({ cfg: full, id }: { cfg: ListConfig<T>; id?: number }) {
  // поля — свои у раздела или собранные по колонкам, как в макетах
  // собираем один раз на открытие панели: formOf проходит по всем строкам раздела
  const cfg = useMemo(() => ({ ...full, ...formOf(full) }), [full])
  const router = useRouter()
  const rows = useRows(cfg)
  const current = id !== undefined ? rows.find((r) => r.id === id) : undefined
  const isNew = id === undefined
  const [values, setValues] = useState<Record<string, string>>(() => {
    const base = current ?? cfg.blank()
    return Object.fromEntries(cfg.fields.map((f) => [f.k, f.get(base)]))
  })
  const [error, setError] = useState<string | null>(null)
  const del = useDeleteDialog(cfg)
  const close = closeForm

  // запись удалили, пока панель была открыта
  if (!isNew && !current) return null

  const locked = !!current && !!cfg.locked?.(current)
  const save = () => {
    if (locked) return
    const missing = cfg.fields.find((f) => f.required && !values[f.k]?.trim())
    if (missing) {
      setError(missing.k)
      toast(`Заполните обязательное поле «${missing.t}»`)
      return
    }
    let row = current ?? { ...cfg.blank(), id: rowsStore.nextId(cfg) }
    for (const f of cfg.fields) row = f.set(row, values[f.k] ?? "")
    rowsStore.save(cfg, row)
    toast(isNew ? "Запись создана" : "Изменения сохранены")
    close()
    // новую — открываем в карточке, после правки остаёмся на месте
    if (isNew) router.push(recordHref(cfg.key, row.id))
  }

  const Icon = cfg.icon
  const title = isNew ? (cfg.buttons[0]?.label ?? "Новая запись") : "Редактирование"

  return (
    <Dialog.Root open onOpenChange={(o) => !o && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[94] bg-[rgba(5,6,9,0.35)] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-2.5 right-2.5 bottom-2.5 z-[95] flex w-[min(560px,calc(100vw-20px))] flex-col rounded-[28px] border border-border bg-background shadow-[0_30px_80px_rgba(0,0,0,0.45)] data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 max-sm:inset-0 max-sm:w-screen max-sm:rounded-none"
        >
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-start gap-3 border-b border-border px-6 pt-[22px] pb-3.5 max-sm:px-4">
              <span className="cav grid size-11 flex-none place-items-center rounded-xl">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-[21px] font-semibold">{title}</Dialog.Title>
                <p className="mt-1 truncate text-[13px] text-muted-foreground">{isNew ? cfg.title : cfg.name(current!)}</p>
              </div>
              <Dialog.Close className="grid size-10 flex-none place-items-center rounded-full border border-border bg-card" aria-label="Закрыть">
                <X className="size-[18px]" />
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-auto px-6 py-[18px] max-sm:px-4">
              {locked && (
                <Banner icon={Lock} tone="blue" title="Финальный статус">
                  Поля записи заблокированы для редактирования.
                </Banner>
              )}
              <fieldset disabled={locked} className="contents">
                <Group title="Основное">
                  {cfg.fields.map((f) => (
                    <FieldInput
                      key={f.k}
                      f={f}
                      value={values[f.k] ?? ""}
                      invalid={error === f.k}
                      onChange={(v) => {
                        setValues({ ...values, [f.k]: v })
                        if (error === f.k) setError(null)
                      }}
                    />
                  ))}
                </Group>
                <Group title="Дополнительно">
                  <label className="col-span-full flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                    Комментарий
                    <GlassTextarea placeholder="Комментарий к записи" minRows={3} containerClassName="rounded-xl" className="text-sm text-foreground" />
                  </label>
                  <label className="col-span-full flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
                    Вложения
                    {/* TODO: загрузка файлов через API */}
                    <LiquidGlass className="flex rounded-xl px-3.5 py-3">
                      <input
                        type="file"
                        multiple
                        className="w-full cursor-pointer text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#085eff] file:px-3.5 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-white"
                      />
                    </LiquidGlass>
                  </label>
                </Group>
              </fieldset>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border px-6 pt-3.5 pb-5 max-sm:px-4">
              {!isNew && (
                <Btn
                  className="mr-auto h-11 text-[#ff5257]"
                  onClick={() =>
                    del.ask([current!], () => {
                      close()
                      if (location.pathname !== `/${cfg.key}`) router.push(`/${cfg.key}`)
                    })
                  }
                >
                  <Trash2 />
                  {removeLabel(cfg)}
                </Btn>
              )}
              <Dialog.Close asChild>
                <Btn className="h-11">Отмена</Btn>
              </Dialog.Close>
              <Btn primary type="submit" className="h-11" disabled={locked}>
                <Check />
                {isNew ? "Создать" : "Сохранить"}
              </Btn>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
      {del.dialog}
    </Dialog.Root>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="mt-1.5 mb-2.5 text-[11.5px] font-semibold tracking-[1px] text-[var(--faint)] uppercase">{title}</div>
      <div className="mb-[18px] grid grid-cols-2 gap-x-3.5 gap-y-3 max-sm:grid-cols-1">{children}</div>
    </>
  )
}

function FieldInput<T>({ f, value, invalid, onChange }: { f: Field<T>; value: string; invalid: boolean; onChange: (v: string) => void }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-[12.5px] text-muted-foreground", f.wide && "col-span-full")}>
      <span>
        {f.t}
        {f.required && <b className="font-semibold text-[#ff5257]"> *</b>}
      </span>
      {f.type === "select" ? (
        <FormSelect value={value} onChange={onChange} options={f.opts ?? []} invalid={invalid} aria-label={f.t} />
      ) : f.type === "date" ? (
        <DateField value={value} onChange={onChange} />
      ) : (
        <GlassInput
          inputMode={f.type === "number" ? "numeric" : undefined}
          value={value}
          placeholder={f.t}
          autoFocus={f.required}
          readOnly={f.readOnly}
          aria-invalid={invalid}
          onChange={(e) => onChange(f.type === "number" ? e.target.value.replace(/\D/g, "") : e.target.value)}
          className={cn(glassField, f.readOnly && "opacity-60")}
          inputClassName="text-sm"
        />
      )}
    </label>
  )
}
