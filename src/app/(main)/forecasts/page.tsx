import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Прогнозы — kCRM" }

/** 19 Прогнозы. */
export default function ForecastsPage() {
  return <List />
}
