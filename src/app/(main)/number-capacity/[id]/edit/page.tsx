import { Suspense } from "react"
import type { Metadata } from "next"
import { Form } from "../../views"

export const metadata: Metadata = { title: "Редактирование заявки на номера — kCRM" }

type Props = PageProps<"/number-capacity/[id]/edit">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function EditNumberRequestPage({ params }: Props) {
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
