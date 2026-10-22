import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Временное увеличение объёма — kCRM" }

/** 42 Временное увеличение объёма. */
export default function TempIncreasePage() {
  return <List />
}
