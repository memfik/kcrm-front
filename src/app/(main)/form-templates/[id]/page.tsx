import { Suspense } from "react"
import type { Metadata } from "next"
import { Record } from "../views"

export const metadata: Metadata = { title: "Шаблон формы — kCRM" }

type Props = PageProps<"/form-templates/[id]">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function FormTemplatesRecordPage({ params }: Props) {
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
