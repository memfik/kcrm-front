import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Реестр заявок КТС-РФ-ДППП-26 — kCRM" }

/** 38 Реестр заявок КТС-РФ-ДППП-26. */
export default function TvRegistryPage() {
  return <List />
}
