# kCRM (QMobile) — фронтенд на Next.js

Перенос HTML-макетов в рабочий фронтенд. Описание дизайна: `docs/design-handoff.md` (копия README-для-фронтенда.md).
Макеты: `~/Downloads/QMobile-kCRM-дизайн/` (старт — `00-Меню.html`; тема и телефон переключаются внутри страниц).

- Стек: Next.js (App Router, `src/`), Tailwind v4, shadcn + **Opaline** (liquid glass, `src/components/ui/opaline/`), lucide-react. Каркас взят из `../ectu-front`.
- Разделы и маршруты: `src/config/nav.ts` (номер = номер макета, группы = мега-меню макета). Заглушка: `src/app/(main)/[section]/page.tsx`. Вход — `/login` (01), главная — `/` (02).
- Токены тем: конец `src/app/globals.css`. Тёмная по умолчанию (`html.dark`), переключатель `ThemeToggle`. Ширина контента — класс `.page` (max 1760 px).
- Все списки — один шаблон по конфигу (`const PAGE = {...}` в макетах): `src/components/list/`, конфиги — `src/config/lists/`. Запись — маршрутом `/deals/29741`; создание и правка — панель справа поверх текущей страницы без смены адреса (`openForm()` в `src/lib/list/form-store.ts`; ссылки вида `/deals/new`, `/deals/29741/edit` в конфигах понимает `SmartLink`).
- Порядок работ: docs/design-handoff.md §8. Бренд только синий `#085eff`. Вход через AD/SSO, пароли не логировать (§7).
- Что осталось после переноса (заглушки, отличия от макета, что ждёт API): `docs/backlog.md` — дополнять с каждой страницей.
