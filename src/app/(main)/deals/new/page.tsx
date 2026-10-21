import type { Metadata } from "next"
import { Form } from "../views"

export const metadata: Metadata = { title: "Новая сделка — kCRM" }

export default function NewDealPage() {
  return <Form />
}
