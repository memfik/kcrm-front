import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ALL_SECTIONS, NAV_GROUPS, findSection } from "@/config/nav"
import { PageHero } from "@/components/shared/page-hero"

export function generateStaticParams() {
  return ALL_SECTIONS.map((s) => ({ section: s.slug }))
}

/** Заглушка раздела. Заменять по мере переноса макета (номер = файл в архиве дизайна). */
export default function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  return (
    <Suspense fallback={<PageHero title="" crumbs={[]} />}>
      <SectionContent params={params} />
    </Suspense>
  )
}

async function SectionContent({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const s = findSection(section)
  if (!s) notFound()
  const group = NAV_GROUPS.find((g) => g.sections.includes(s))
  return (
    <>
      <PageHero title={s.title} crumbs={group ? [group.title] : []} />
      <p className="page text-sm text-muted-foreground">
        Раздел в разработке · макет {s.num}
      </p>
    </>
  )
}
