import { Suspense } from "react"
import type { Metadata } from "next"
import { Form } from "../../views"

export const metadata: Metadata = { title: "Редактирование контрагента — kCRM" }

type Props = PageProps<"/counterparties/[id]/edit">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function EditCounterpartyPage({ params }: Props) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<Props, "params">) {
  const { id } = await params
  return <Form id={+id} />
}
