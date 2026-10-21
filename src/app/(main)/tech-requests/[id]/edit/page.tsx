import { Suspense } from "react"
import type { Metadata } from "next"
import { Form } from "../../views"

export const metadata: Metadata = { title: "Редактирование заявки ТВ и ТР — kCRM" }

type Props = PageProps<"/tech-requests/[id]/edit">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function EditTechRequestPage({ params }: Props) {
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
