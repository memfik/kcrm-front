import { Suspense } from "react"
import type { Metadata } from "next"
import { OfferBuilder } from "@/components/offer-builder/offer-builder"

export const metadata: Metadata = { title: "Конструктор КП — kCRM" }

/** 28 Конструктор КП. ?kp / ?cs / ?pos известны только при запросе — внутри Suspense (cacheComponents). */
export default function OfferBuilderPage() {
  return (
    <Suspense>
      <OfferBuilder />
    </Suspense>
  )
}
