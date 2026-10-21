"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { LEADS_REPORT } from "@/config/lists/leads-report"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={LEADS_REPORT} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={LEADS_REPORT} id={id} />
