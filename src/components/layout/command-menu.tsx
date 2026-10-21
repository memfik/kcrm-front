"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Dialog } from "radix-ui"
import { CornerDownLeft, House, Search } from "lucide-react"
import { NAV_GROUPS } from "@/config/nav"
import { Kbd, Thumb } from "./mega-menu"

/** Поиск ⌘K: все разделы и быстрые действия из меню. TODO: поиск по контрагентам, БИН и ID через API. */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-[rgba(5,6,9,0.45)] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-[121] w-[min(680px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-[26px] border border-[var(--dd-line)] bg-[var(--dd-bg)] shadow-[var(--dd-shadow)] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-2"
        >
          <Dialog.Title className="sr-only">Поиск по системе</Dialog.Title>
          <Command loop className="text-[var(--mg-text)]">
            <div className="flex items-center gap-3 border-b border-[var(--dd-line)] px-5 py-[18px]">
              <Search className="size-5 text-muted-foreground" />
              <Command.Input
                autoFocus
                placeholder="Разделы, действия, контрагенты…"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[420px] overflow-auto p-2">
              <Command.Empty className="mx-3 mt-2.5 mb-1.5 text-[11.5px] font-semibold tracking-[1px] text-[var(--mg-dim)] uppercase">
                Ничего не найдено
              </Command.Empty>
              <Group heading="Разделы">
                <Item value="Главная Сводка и аналитика" icon={House} title="Главная" hint="Сводка и аналитика" onSelect={() => go("/")} />
              </Group>
              {NAV_GROUPS.map((g) => (
                <Group key={g.key} heading={g.title}>
                  {g.sections.map((x) => (
                    <Item
                      key={x.slug}
                      value={`${x.title} ${x.hint ?? ""} ${g.title}`}
                      icon={x.icon}
                      title={x.title}
                      hint={x.hint}
                      onSelect={() => go(`/${x.slug}`)}
                    />
                  ))}
                </Group>
              ))}
              <Group heading="Быстрые действия">
                {NAV_GROUPS.flatMap((g) =>
                  g.quick.map((x) => (
                    <Item
                      key={x.title}
                      value={`${x.title} ${x.hint} ${g.title} действие`}
                      icon={x.icon}
                      title={x.title}
                      hint={x.hint}
                      onSelect={() => go(x.href)}
                    />
                  ))
                )}
              </Group>
            </Command.List>
            <div className="flex gap-3.5 border-t border-[var(--dd-line)] px-5 py-3 text-xs text-muted-foreground">
              <span>↑ ↓ — выбор</span>
              <span>Enter — открыть</span>
              <span>Esc — закрыть</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:mx-3 [&_[cmdk-group-heading]]:mt-2.5 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:text-[11.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[1px] [&_[cmdk-group-heading]]:text-[var(--mg-dim)] [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  )
}

function Item({
  value,
  icon,
  title,
  hint,
  onSelect,
}: {
  value: string
  icon: React.ComponentProps<typeof Thumb>["icon"]
  title: string
  hint?: string
  onSelect: () => void
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group/ci flex cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm data-[selected=true]:bg-[var(--mg-on)]"
    >
      <Thumb icon={icon} className="size-[34px]" />
      <span className="min-w-0">
        {title}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Kbd className="ml-auto hidden px-1.5 py-0.5 group-data-[selected=true]/ci:inline-flex">
        <CornerDownLeft className="size-3" />
      </Kbd>
    </Command.Item>
  )
}
