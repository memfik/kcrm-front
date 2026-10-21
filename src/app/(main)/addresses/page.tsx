import type { Metadata } from "next"
import { List } from "./views"

export const metadata: Metadata = { title: "Адреса и история ТВ — kCRM" }

/** 36 Адреса и история ТВ. */
export default function AddressesPage() {
  return <List />
}
