import Link from "next/link"

/** Логотип по теме: белый на тёмной, чёрный на светлой (файлы из cabinet_front). */
export function Logo() {
  return (
    <Link href="/" aria-label="kCRM — на главную" className="flex flex-none items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-white.png" alt="QMobile" className="hidden h-6 w-auto sm:h-9 dark:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-black.png" alt="QMobile" className="h-6 w-auto sm:h-9 dark:hidden" />
      <i className="block h-[26px] w-px bg-[var(--dd-line)]" />
      <b className="text-base font-bold tracking-[-0.02em] sm:text-[17px]">kCRM</b>
    </Link>
  )
}
