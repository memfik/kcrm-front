import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Box,
  Briefcase,
  Calendar,
  ChartColumn,
  CircleUser,
  ClipboardCheck,
  Clock,
  Download,
  FileCheck,
  FilePlus,
  FileText,
  Funnel,
  Gavel,
  Globe,
  Hash,
  IdCard,
  Layers,
  Link,
  List,
  ListTodo,
  MapPin,
  Percent,
  Phone,
  Search,
  Signature,
  SlidersHorizontal,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react"

/** Разделы kCRM. Номера соответствуют макетам 01…47 в архиве QMobile-kCRM-дизайн; группы — как в мега-меню макета. */
export type Section = {
  slug: string
  num: string
  title: string
  icon: LucideIcon
  hint?: string
  badge?: "new" | "upd"
  /** Счётчик записей справа в мега-меню. TODO: из API. */
  count?: string
}
/** Пункт «Быстрые действия» мега-меню и ⌘K. */
export type QuickAction = { title: string; hint: string; href: string; icon: LucideIcon }
export type NavGroup = {
  key: string
  title: string
  sections: Section[]
  quick: QuickAction[]
  /** Карточка-превью в правой колонке мега-меню. */
  feature: { title: string; text: string; pic: "funnel" | "bars" | "line" }
}

const s = (
  num: string,
  slug: string,
  title: string,
  icon: LucideIcon,
  hint?: string,
  badge?: Section["badge"],
  count?: string
): Section => ({ num, slug, title, icon, hint, badge, count })

const q = (title: string, hint: string, href: string, icon: LucideIcon): QuickAction => ({ title, hint, href, icon })

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "sales",
    title: "Продажи",
    sections: [
      s("03", "counterparties", "Контрагенты", Users, "Клиенты, профили, доступ", "upd", "7 683"),
      s("07", "sandbox", "Песочница", Box, "Свободные контрагенты"),
      s("04", "deals", "Сделки", Briefcase, "Этапы и действия по сделке", undefined, "47"),
      s("32", "calls", "История звонков", Phone, "Звонки и записи разговоров"),
      s("08", "leads", "Лиды", Phone, "Звонки колл-центра"),
      s("05", "offers", "КП", FileText, "Коммерческие предложения"),
      s("28", "offer-builder", "Конструктор КП", FilePlus, "Создание КП"),
      s("06", "discount-requests", "Запросы скидки", Percent, "Согласование КП"),
    ],
    quick: [
      q("Новый контрагент", "Мастер создания", "/counterparties/new", UserPlus),
      q("Создать КП", "Конструктор КП", "/offer-builder", FilePlus),
      q("Новая сделка", "Новая / доп. соглашение", "/deals/new", Briefcase),
    ],
    feature: { title: "Воронка продаж", text: "11 этапов: от первичных переговоров до подключения · 3 499 КП", pic: "funnel" },
  },
  {
    key: "requests",
    title: "Заявки",
    sections: [
      s("09", "tech-requests", "Запросы ТВ и ТР", FileCheck, "Техвозможность и техрешение", "upd", "72"),
      s("10", "work-orders", "Наряды", Wrench, "12 типов работ", "upd"),
      s("11", "ip-requests", "Заявки IP", Globe, "Выдача публичных адресов", "upd"),
      s("12", "number-capacity", "Номерная ёмкость", Hash, "Выделение номеров", "upd"),
      s("13", "subscribers", "Абоненты", IdCard, "Заведение в биллинг", undefined, "577"),
      s("14", "install-acts", "Акты монтажа", ClipboardCheck, "Отправка в СЭДО"),
      s("37", "tv-precheck", "Предварительная проверка ТВ", Search, "Адреса из текста или файла", "new"),
      s("36", "addresses", "Адреса и история ТВ", MapPin, "Проверки, ТР и сети СО по адресу", "new"),
      s("38", "tv-registry", "Реестр заявок КТС-РФ-ДППП-26", List, "Локальные и централизованные", "new"),
      s("44", "job-orders", "Наряд-заказы", FileText, "Централизованный / локальный", "new"),
      s("40", "channel-ids", "ID-каналы", Link, "Выделение и смена статуса", "new"),
      s("41", "test-connections", "Тестовые подключения", Clock, "Срок, пролонгация, переход к договору", "new"),
      s("42", "temp-increase", "Временное увеличение", TrendingUp, "Объём услуги на срок", "new"),
    ],
    quick: [
      q("Заявка на ТВ и ТР", "Новый запрос", "/tech-requests/new", FilePlus),
      q("Акт монтажа", "Отправка в СЭДО", "/install-acts/new", ClipboardCheck),
    ],
    feature: { title: "Заявки в работе", text: "ТВ/ТР, наряды и IP — статусы и согласования по филиалам", pic: "bars" },
  },
  {
    key: "planning",
    title: "Планирование",
    sections: [
      s("15", "tasks", "Задачи", ListTodo, "Поручения и чаты", undefined, "8 045"),
      s("16", "calendar", "Календарь", Calendar, "События и напоминания"),
      s("17", "sales-plan", "План продаж", Target, "План / факт по месяцам"),
      s("18", "ipr", "ИПР", List, "Индивидуальный план работ", undefined, "264"),
      s("19", "forecasts", "Прогнозы", TrendingUp, "Вероятность и бюджет проектов"),
    ],
    quick: [
      q("Добавить задачу", "Себе или коллеге", "/tasks/new", FilePlus),
      q("Добавить в план", "Строка плана продаж", "/sales-plan", Target),
    ],
    feature: { title: "План продаж", text: "План, факт и ИПР по менеджерам и услугам", pic: "line" },
  },
  {
    key: "tenders",
    title: "Тендеры",
    sections: [
      s("20", "tenders", "Тендеры", Gavel, "Объявления и решения об участии"),
      s("21", "lots", "Лоты", Layers, "Бюджет, обеспечение, конкуренты"),
      s("22", "tender-reports", "Отчёты по тендерам", ChartColumn, "По лотам и конкурентам"),
    ],
    quick: [q("Новый тендер", "Карточка закупки", "/tenders/new", FilePlus)],
    feature: { title: "Госзакупки", text: "Не отработанные, поданные и отказы — в одной ленте", pic: "bars" },
  },
  {
    key: "catalogs",
    title: "Справочники",
    sections: [
      s("23", "catalog", "Продукт-каталог", BookOpen, "Услуги B2B / B2C / B2G"),
      s("24", "price-builder", "Конструктор прейскуранта", SlidersHorizontal, "Версии прейскуранта"),
      s("25", "contracts", "Договоры", Signature, "По шаблонам из КП", undefined, "2 896"),
      s("30", "contract-builder", "Конструктор договора", Signature, "Договор из КП"),
      s("26", "acts", "Акты", FileText, "Выполненных работ", undefined, "908"),
      s("45", "departments", "Подразделения", Users, "Структура, права, делегирование", "new"),
      s("46", "typical-tr", "Типовые ТР", Layers, "ДИППП, ДЦРС / ДРС", "new"),
      s("47", "form-templates", "Шаблоны форм", FileText, "Рабочие формы подразделений", "new"),
    ],
    quick: [q("Текущая версия прейскуранта", "Просмотр", "/catalog", FileText)],
    feature: { title: "Прейскурант", text: "Ежемесячные, единовременные платежи и трафик", pic: "line" },
  },
  {
    key: "reports",
    title: "Отчёты",
    sections: [
      s("27", "reports", "Все отчёты", ChartColumn, "11 отчётов kCRM"),
      s("31", "sales-summary", "Свод по продажам", ChartColumn, "Подразделение × месяцы"),
      s("33", "stage-report", "Отчёт по этапам", Funnel, "Воронка сделок"),
      s("34", "requests-report", "Заявки и наряды", Download, "Выгрузка Excel"),
      s("35", "leads-report", "Лиды и сделки", Phone, "Входящие лиды, конверсия"),
      s("39", "tv-tr-report", "Отчёт ТВ/ТР и наряды", ChartColumn, "Локальные и централизованные по филиалам", "new"),
      s("43", "ip-report", "Отчёт по IP", Globe, "Выдача, изменение, изъятие", "new"),
    ],
    quick: [q("Экспресс-отчёт", "За выбранный период", "/reports", Download)],
    feature: { title: "Аналитика", text: "Все отчёты со сравнением с прошлым периодом", pic: "line" },
  },
]

/** Вне меню: 01 Вход → /login, 02 Главная → /, 29 Профиль. */
export const PROFILE_SECTION = s("29", "profile", "Профиль", CircleUser)

export const ALL_SECTIONS = [...NAV_GROUPS.flatMap((g) => g.sections), PROFILE_SECTION]

export function findSection(slug: string) {
  return ALL_SECTIONS.find((x) => x.slug === slug)
}
