"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { REQUESTS_REPORT } from "@/config/lists/requests-report"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={REQUESTS_REPORT} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={REQUESTS_REPORT} id={id} />
