"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TENDER_REPORTS } from "@/config/lists/tender-reports"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. Формы у каталога отчётов нет. */

export const List = () => <ListPage cfg={TENDER_REPORTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TENDER_REPORTS} id={id} />
