import type { Metadata } from "next"
import { Form } from "../views"

export const metadata: Metadata = { title: "Новое КП — kCRM" }

// TODO: КП создаётся в Конструкторе КП (макет 28) — переадресовать на /offer-builder, когда он будет готов.
export default function NewOfferPage() {
  return <Form />
}
