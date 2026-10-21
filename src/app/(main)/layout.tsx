import { Header } from "@/components/layout/header"
import { Toaster } from "@/components/shared/toast"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {/* На телефоне снизу — меню вкладок (TabBar), оставляем под него место. */}
      <main className="flex-1 overflow-x-clip pb-16 max-sm:pb-[calc(90px+env(safe-area-inset-bottom,0px))]">{children}</main>
      <Toaster />
    </>
  )
}
