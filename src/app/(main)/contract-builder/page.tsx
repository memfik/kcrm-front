import { Suspense } from "react"
import type { Metadata } from "next"
import { ContractBuilder } from "@/components/contract-builder/contract-builder"

export const metadata: Metadata = { title: "Конструктор договора — kCRM" }

/** 30 Конструктор договора. ?kp известен только при запросе — внутри Suspense (cacheComponents). */
export default function ContractBuilderPage() {
  return (
    <Suspense>
      <ContractBuilder />
    </Suspense>
  )
}
