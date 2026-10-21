"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, Camera, Image as ImageIcon, Lock, PenLine, UserRound, type LucideIcon } from "lucide-react"
import { Avatar } from "@/components/layout/header-popovers"
import { Pill } from "@/components/list/cells"
import { FormSelect } from "@/components/list/select"
import { Btn } from "@/components/list/ui"
import { toast } from "@/components/shared/toast"
import { GlassInput } from "@/components/ui/opaline/glass-input"
import { GlassSwitch } from "@/components/ui/opaline/glass-switch"
import { GlassTextarea } from "@/components/ui/opaline/glass-textarea"
import { CURRENT_USER } from "@/lib/current-user"
import { setProfile, useProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"

/*
 * 29 Профиль: контакты, подпись для КП и договоров, фото и обложка, уведомления, безопасность.
 * Разделы — якорями (#main, #sign, #photo, #ntf, #sec): на них ссылаются шапка и меню. TODO: API профиля.
 */

const SECTIONS: { k: string; t: string; icon: LucideIcon }[] = [
  { k: "main", t: "Контакты", icon: UserRound },
  { k: "sign", t: "Подпись", icon: PenLine },
  { k: "photo", t: "Фото и обложка", icon: ImageIcon },
  { k: "ntf", t: "Уведомления", icon: Bell },
  { k: "sec", t: "Безопасность", icon: Lock },
]
const COVERS = [
  "linear-gradient(135deg,#001a9f,#085eff 60%,#3d7bff)",
  "linear-gradient(135deg,#0b1340,#3a1c71 60%,#d76d77)",
  "linear-gradient(135deg,#032b2b,#0f9b8e)",
  "linear-gradient(135deg,#1c1c1e,#3a3a3c)",
  "linear-gradient(135deg,#ff9f0a,#ff375f)",
  "linear-gradient(135deg,#34c759,#085eff)",
  "linear-gradient(135deg,#5ac8fa,#af52de)",
  "linear-gradient(135deg,#0a0b0e,#001a9f)",
]
const NOTICES = [
  { t: "Новые заявки ТВ и ТР", s: "в колокольчик и на почту", on: true },
  { t: "Запросы скидки", s: "если вы согласующий", on: true },
  { t: "Сроки задач", s: "за час до срока", on: true },
  { t: "Новые тендеры", s: "ежедневная сводка", on: false },
]

const card = "scroll-mt-5 rounded-3xl border border-border bg-card px-6 py-[22px] shadow-[var(--panel-shadow)] max-sm:rounded-[20px] max-sm:px-4"
const lbl = "flex flex-col gap-1.5 text-[12.5px] text-muted-foreground"
const field = "h-11 rounded-xl px-3.5 text-foreground"

export function ProfilePage() {
  const [active, setActive] = useState("main")
  const cover = useProfile("cover")
  const file = useRef<HTMLInputElement>(null)
  const [dept, setDept] = useState("Администрация")
  const [sign, setSign] = useState("С уважением,\nАдминистратор системы\nАО «QMobile» · +7 717 255 00 00")
  const [notices, setNotices] = useState(NOTICES.map((n) => n.on))
  const [sessions, setSessions] = useState([
    { t: "MacBook · Chrome", s: "Астана · сейчас", current: true },
    { t: "iPhone · Safari", s: "Астана · вчера, 18:20" },
    { t: "Windows · Edge", s: "Алматы · 12 мар" },
  ])
  const [pass, setPass] = useState({ old: "", next: "" })

  const go = (k: string, smooth = true) => {
    setActive(k)
    document.getElementById(k)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" })
    history.replaceState(null, "", `#${k}`)
  }

  // якорь из адреса (/profile#ntf) и подсветка раздела при прокрутке
  useEffect(() => {
    const fromHash = () => {
      const k = location.hash.slice(1)
      if (SECTIONS.some((s) => s.k === k)) go(k, false)
    }
    fromHash()
    addEventListener("hashchange", fromHash)
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-30% 0px -60% 0px" })
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.k)
      if (el) io.observe(el)
    })
    return () => {
      removeEventListener("hashchange", fromHash)
      io.disconnect()
    }
  }, [])

  const coverIndex = cover !== null ? +cover : 0
  const pickPhoto = () => file.current?.click()

  return (
    <div className="mx-auto w-full max-w-[1760px] px-[34px] pb-10 max-sm:px-3">
      <section className="rise pt-1.5 pb-4">
        <p className="flex items-center gap-2 text-sm text-[#085eff] dark:text-[#9db8ff]">
          <UserRound className="size-4" />
          Профиль
        </p>
        <h1 className="mt-1.5 text-[34px] leading-[1.1] font-medium tracking-[-0.025em] max-sm:text-[26px]">Мой профиль</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Контакты, подпись для КП и договоров, фото, уведомления и безопасность.</p>
      </section>

      <div className="grid grid-cols-[320px_minmax(0,1fr)] items-start gap-[18px] max-[1100px]:grid-cols-1">
        <aside className={cn(card, "sticky top-5 p-3.5 max-[1100px]:static max-sm:p-3.5")}>
          <div className="relative h-[120px] overflow-hidden rounded-[18px]" style={{ background: COVERS[coverIndex] ?? COVERS[0] }}>
            <button
              type="button"
              onClick={() => go("photo")}
              className="absolute top-2.5 right-2.5 h-8 cursor-pointer rounded-full bg-black/35 px-3 text-[12.5px] text-white"
            >
              Сменить обложку
            </button>
          </div>
          <div className="relative mx-auto -mt-12 w-fit">
            <Avatar className="size-24 border-4 border-card text-[30px]" />
            <button
              type="button"
              title="Сменить фото"
              onClick={pickPhoto}
              className="absolute -right-0.5 -bottom-0.5 grid size-8 cursor-pointer place-items-center rounded-full border-[3px] border-card bg-[#085eff] text-white"
            >
              <Camera className="size-3.5" />
            </button>
            <input
              ref={file}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const r = new FileReader()
                r.onload = () => {
                  setProfile("avatar", String(r.result))
                  toast("Фото обновлено")
                }
                r.readAsDataURL(f)
                e.target.value = ""
              }}
            />
          </div>
          <div className="mt-3 text-center">
            <b className="block text-[19px]">{CURRENT_USER.name}</b>
            <span className="text-[13px] text-muted-foreground">
              {CURRENT_USER.login} · {CURRENT_USER.department}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {["Полный доступ", "ТВ/ТР", "Скидки", "Прейскурант"].map((p) => (
              <Pill key={p}>{p}</Pill>
            ))}
          </div>
          {/* TODO: цифры из API */}
          <div className="mt-[18px] grid grid-cols-3 gap-2">
            {(
              [
                [4, "задачи"],
                [12, "КП за месяц"],
                [3, "договора"],
              ] as const
            ).map(([n, t]) => (
              <div key={t} className="rounded-[14px] bg-[var(--soft)] p-2.5 text-center text-[11.5px] text-muted-foreground">
                <b className="block text-lg text-foreground tabular-nums">{n}</b>
                {t}
              </div>
            ))}
          </div>
          <nav className="mt-4 flex flex-col gap-0.5 max-[1100px]:sticky max-[1100px]:top-0 max-[1100px]:z-[5] max-[1100px]:flex-row max-[1100px]:overflow-x-auto max-[1100px]:bg-card max-[1100px]:py-1.5 max-[1100px]:[scrollbar-width:none]">
            {SECTIONS.map((s) => (
              <button
                key={s.k}
                type="button"
                onClick={() => go(s.k)}
                className={cn(
                  "flex flex-none cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-[var(--soft)] hover:text-foreground",
                  active === s.k && "bg-[var(--soft)] text-foreground"
                )}
              >
                <s.icon className="size-[17px]" />
                {s.t}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-[18px]">
          <section id="main" className={card}>
            <Head t="Контакты" s="Видны коллегам и подставляются в КП" />
            <div className="mt-4 grid grid-cols-2 gap-x-3.5 gap-y-3 max-sm:grid-cols-1">
              <label className={lbl}>
                Фамилия
                <GlassInput defaultValue={CURRENT_USER.name} className={field} inputClassName="text-sm" />
              </label>
              <label className={lbl}>
                Имя Отчество
                <GlassInput className={field} inputClassName="text-sm" />
              </label>
              <label className={lbl}>
                Должность
                <GlassInput defaultValue="Администратор системы" className={field} inputClassName="text-sm" />
              </label>
              <div className={lbl}>
                Подразделение
                <FormSelect value={dept} onChange={setDept} aria-label="Подразделение" options={["Администрация", "ГО-ДКП", "АФ", "АС"].map((v) => ({ v, label: v }))} />
              </div>
              <label className={lbl}>
                Рабочий телефон
                <GlassInput defaultValue="+7 717 255 00 00" className={field} inputClassName="text-sm" />
              </label>
              <label className={lbl}>
                Мобильный
                <GlassInput defaultValue="+7 701 000 00 00" className={field} inputClassName="text-sm" />
              </label>
              <label className={cn(lbl, "col-span-full")}>
                Почта
                <GlassInput defaultValue="admin@qmobile.kz" className={field} inputClassName="text-sm" />
              </label>
            </div>
            <Footer>
              <Btn primary onClick={() => toast("Сохранено")}>
                Сохранить
              </Btn>
            </Footer>
          </section>

          <section id="sign" className={card}>
            <Head t="Подпись в КП и договорах" s="Добавляется в конец документа" />
            <GlassTextarea value={sign} onChange={(e) => setSign(e.target.value)} minRows={3} containerClassName="mt-4 rounded-xl" className="text-sm text-foreground" />
            <div className="mt-3.5 mb-2 text-[13px] text-muted-foreground">Предпросмотр</div>
            <div className="rounded-[14px] border border-border bg-[var(--soft)] p-4 text-[13.5px] leading-[1.6] whitespace-pre-line">{sign}</div>
            <Footer>
              <Btn primary onClick={() => toast("Сохранено")}>
                Сохранить
              </Btn>
            </Footer>
          </section>

          <section id="photo" className={card}>
            <Head t="Фото и обложка" s="Выберите обложку профиля или загрузите своё фото" />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {COVERS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Обложка ${i + 1}`}
                  aria-pressed={i === coverIndex}
                  onClick={() => {
                    setProfile("cover", String(i))
                    toast("Обложка изменена")
                  }}
                  className={cn("h-[54px] cursor-pointer rounded-xl border-2 border-transparent", i === coverIndex && "border-foreground")}
                  style={{ background: c }}
                />
              ))}
            </div>
            <Footer>
              <Btn onClick={pickPhoto}>Загрузить фото</Btn>
              <Btn
                red
                onClick={() => {
                  setProfile("avatar", null)
                  toast("Фото удалено")
                }}
              >
                Удалить фото
              </Btn>
            </Footer>
          </section>

          <section id="ntf" className={card}>
            <Head t="Уведомления" s="Что приходит в колокольчик и на почту" />
            {NOTICES.map((n, i) => (
              <label key={n.t} className="flex cursor-pointer items-center justify-between gap-3 border-b border-border py-3 text-sm last:border-0">
                <div>
                  {n.t}
                  <span className="block text-[12.5px] text-muted-foreground">{n.s}</span>
                </div>
                <GlassSwitch
                  checked={notices[i]}
                  onCheckedChange={(on) => {
                    setNotices(notices.map((v, k) => (k === i ? on : v)))
                    toast(on ? "Включено" : "Выключено")
                  }}
                />
              </label>
            ))}
          </section>

          <section id="sec" className={card}>
            <Head t="Безопасность" s="Пароль от домена JusanMobile меняется в Active Directory" />
            {/* §7: пароль не логируем и не храним — поля очищаются сразу; смена — в AD */}
            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault()
                setPass({ old: "", next: "" })
                toast("Смена пароля — через Active Directory после подключения SSO")
              }}
            >
              <div className="grid grid-cols-2 gap-x-3.5 gap-y-3 max-sm:grid-cols-1">
                <label className={lbl}>
                  Текущий пароль
                  <GlassInput type="password" autoComplete="current-password" value={pass.old} onChange={(e) => setPass({ ...pass, old: e.target.value })} className={field} inputClassName="text-sm" />
                </label>
                <label className={lbl}>
                  Новый пароль
                  <GlassInput type="password" autoComplete="new-password" value={pass.next} onChange={(e) => setPass({ ...pass, next: e.target.value })} className={field} inputClassName="text-sm" />
                </label>
              </div>
              <Footer>
                <Btn primary type="submit" disabled={!pass.old || !pass.next}>
                  Сменить пароль
                </Btn>
              </Footer>
            </form>
            <div className="mt-[22px] mb-1.5 text-[13px] text-muted-foreground">Активные сеансы</div>
            {sessions.map((x) => (
              <div key={x.t} className="flex items-center gap-3 border-b border-border py-3 text-[13.5px] last:border-0">
                <div>
                  {x.t}
                  <span className="block text-[12.5px] text-muted-foreground">{x.s}</span>
                </div>
                <span className="flex-1" />
                {x.current ? (
                  <Pill className="text-[#34c759]">Этот сеанс</Pill>
                ) : (
                  <Btn
                    onClick={() => {
                      setSessions(sessions.filter((v) => v !== x))
                      toast("Сеанс завершён")
                    }}
                  >
                    Завершить
                  </Btn>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}

function Head({ t, s }: { t: string; s: string }) {
  return (
    <>
      <h3 className="text-[17px] font-bold">{t}</h3>
      <div className="mt-1 text-[13px] text-muted-foreground">{s}</div>
    </>
  )
}

const Footer = ({ children }: { children: React.ReactNode }) => <div className="mt-4 flex justify-end gap-2.5">{children}</div>
