import { Suspense } from "react"
import type { Metadata } from "next"
import { Form } from "../../views"

export const metadata: Metadata = { title: "Редактирование лида — kCRM" }

type Props = PageProps<"/leads/[id]/edit">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function EditLeadPage({ params }: Props) {
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
