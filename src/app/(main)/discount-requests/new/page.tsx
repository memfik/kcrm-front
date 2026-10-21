import type { Metadata } from "next"
import { Form } from "../views"

export const metadata: Metadata = { title: "Новый запрос скидки — kCRM" }

export default function NewDiscountRequestPage() {
  return <Form />
}
