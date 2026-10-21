import type { Metadata } from "next"
import { Form } from "../views"

export const metadata: Metadata = { title: "Новая задача — kCRM" }

export default function NewTaskPage() {
  return <Form />
}
