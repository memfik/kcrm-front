import type { Metadata } from "next"
import { Form } from "../views"

export const metadata: Metadata = { title: "Новый прогноз — kCRM" }

export default function NewForecastPage() {
  return <Form />
}
