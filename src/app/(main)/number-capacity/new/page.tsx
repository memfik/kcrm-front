import type { Metadata } from "next"
import { Form } from "../views"

export const metadata: Metadata = { title: "Новая заявка на номера — kCRM" }

export default function NewNumberRequestPage() {
  return <Form />
}
