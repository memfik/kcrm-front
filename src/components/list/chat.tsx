"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { GlassInput } from "@/components/ui/opaline/glass-input"
import { CURRENT_USER } from "@/lib/current-user"
import { Timeline } from "./cells"
import { Btn } from "./ui"

type Message = { t: string; p: string; d: string }

/** Чат по записи: история + поле «Написать сообщение…». TODO: сообщения через API. */
export function Chat({ items }: { items: Message[] }) {
  const [list, setList] = useState(items)
  const [text, setText] = useState("")
  const send = () => {
    const v = text.trim()
    if (!v) return
    setList([...list, { t: CURRENT_USER.name, p: v, d: "сейчас" }])
    setText("")
  }
  return (
    <>
      <Timeline items={list} />
      <form
        className="mt-3.5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <GlassInput value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать сообщение…" className="h-11 flex-1 rounded-full px-4 text-foreground" inputClassName="text-sm" />
        <Btn primary type="submit" className="h-11" disabled={!text.trim()}>
          <Send />
          Отправить
        </Btn>
      </form>
    </>
  )
}
