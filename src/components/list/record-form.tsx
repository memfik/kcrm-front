"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, Trash2 } from "lucide-react"
import { toast } from "@/components/shared/toast"
import { rowsStore, useRows } from "@/lib/list/store"
import type { Field, ListConfig, Row } from "@/lib/list/types"
import { cn } from "@/lib/utils"
import { recordHref, useDeleteDialog } from "./actions"
import { Btn, BtnLink } from "./ui"

const control =
  "h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus:border-[#085eff] focus:ring-4 focus:ring-[#085eff]/15 aria-invalid:border-[#ff5257]"

/** Создание (/<раздел>/new) и редактирование (/<раздел>/<id>/edit) записи. */
export function RecordForm<T extends Row>({ cfg, id }: { cfg: ListConfig<T>; id?: number }) {
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
  const back = isNew ? `/${cfg.key}` : recordHref(cfg.key, id)

  if (!isNew && !current)
    return (
      <div className="mx-auto max-w-[760px] px-4 py-16 text-center">
        <p className="text-lg font-semibold">Запись не найдена</p>
        <BtnLink href={`/${cfg.key}`} className="mt-5">
          <ChevronLeft />
          {cfg.title}
        </BtnLink>
      </div>
    )

  const save = () => {
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
    router.push(recordHref(cfg.key, row.id))
  }

  const Icon = cfg.icon
  const title = isNew ? (cfg.buttons[0]?.label ?? "Новая запись") : "Редактирование"

  return (
    <div className="mx-auto w-full max-w-[860px] px-[34px] pb-[50px] max-sm:px-3">
      <BtnLink href={back} className="mt-1.5 mb-[18px] h-[38px] pl-2.5">
        <ChevronLeft />
        {isNew ? cfg.title : cfg.name(current!)}
      </BtnLink>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="rounded-[28px] border border-border bg-card shadow-[var(--panel-shadow)] max-sm:rounded-[22px]"
      >
        <div className="flex items-start gap-3 border-b border-border px-6 pt-[22px] pb-3.5 max-sm:px-4">
          <span className="cav grid size-11 flex-none place-items-center rounded-xl">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-[21px] font-semibold">{title}</h1>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">{isNew ? cfg.title : cfg.name(current!)}</p>
          </div>
        </div>

        <div className="px-6 py-[18px] max-sm:px-4">
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
              <textarea placeholder="Комментарий к записи" className={cn(control, "h-[90px] resize-y py-3")} />
            </label>
            <label className="col-span-full flex flex-col gap-1.5 text-[12.5px] text-muted-foreground">
              Вложения
              {/* TODO: загрузка файлов через API */}
              <input
                type="file"
                multiple
                className={cn(
                  control,
                  "h-auto cursor-pointer py-3 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#085eff] file:px-3.5 file:py-1.5 file:text-[12.5px] file:font-semibold file:text-white"
                )}
              />
            </label>
          </Group>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-border px-6 pt-3.5 pb-5 max-sm:px-4">
          {!isNew && (
            <Btn className="mr-auto h-11 text-[#ff5257]" onClick={() => del.ask([current!], () => router.push(`/${cfg.key}`))}>
              <Trash2 />
              Удалить
            </Btn>
          )}
          <BtnLink href={back} className="h-11">
            Отмена
          </BtnLink>
          <Btn primary type="submit" className="h-11">
            <Check />
            {isNew ? "Создать" : "Сохранить"}
          </Btn>
        </div>
      </form>
      {del.dialog}
    </div>
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
        <select value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} className={cn(control, "kselect cursor-pointer")}>
          {f.opts?.map((o) => (
            <option key={o.v} value={o.v}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={f.type === "number" ? "text" : f.type}
          inputMode={f.type === "number" ? "numeric" : undefined}
          value={value}
          placeholder={f.t}
          autoFocus={f.required}
          aria-invalid={invalid}
          onChange={(e) => onChange(f.type === "number" ? e.target.value.replace(/\D/g, "") : e.target.value)}
          className={control}
        />
      )}
    </label>
  )
}
