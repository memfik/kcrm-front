import { Suspense } from "react"
import type { Metadata } from "next"
import { Form } from "../../views"

export const metadata: Metadata = { title: "Редактирование прогноза — kCRM" }

type Props = PageProps<"/forecasts/[id]/edit">

/** id известен только при запросе — читаем его внутри Suspense (cacheComponents). */
export default function EditForecastPage({ params }: Props) {
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
