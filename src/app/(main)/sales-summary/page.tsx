import type { Metadata } from "next"
import { SalesSummary } from "@/components/reports/sales-summary"

export const metadata: Metadata = { title: "Свод по продажам — kCRM" }

/** 31 Свод по продажам. */
export default function SalesSummaryPage() {
  return <SalesSummary />
}
