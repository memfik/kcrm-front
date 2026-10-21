import type { Metadata } from "next"
import { Form } from "../views"

export const metadata: Metadata = { title: "Новое событие — kCRM" }

export default function NewCalendarEventPage() {
  return <Form />
}
