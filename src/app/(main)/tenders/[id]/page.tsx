import { Suspense } from "react"
import type { Metadata } from "next"
import { Record } from "../views"

export const metadata: Metadata = { title: "Тендер — kCRM" }

type Props = PageProps<"/tenders/[id]">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function TenderPage({ params }: Props) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<Props, "params">) {
  const { id } = await params
  return <Record id={+id} />
}
