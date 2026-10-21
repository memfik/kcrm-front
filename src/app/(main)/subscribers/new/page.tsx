import type { Metadata } from "next"
import { Form } from "../views"

export const metadata: Metadata = { title: "Новый абонент — kCRM" }

export default function NewSubscriberPage() {
  return <Form />
}
