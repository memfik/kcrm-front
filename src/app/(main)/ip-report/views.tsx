"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { IP_REPORT } from "@/config/lists/ip-report"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={IP_REPORT} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={IP_REPORT} id={id} />
