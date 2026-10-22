import { Suspense } from "react"
import type { Metadata } from "next"
import { Record } from "../views"

export const metadata: Metadata = { title: "Тестовое подключение — kCRM" }

type Props = PageProps<"/test-connections/[id]">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function TestConnectionsRecordPage({ params }: Props) {
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
