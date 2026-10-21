"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TV_TR_REPORT } from "@/config/lists/tv-tr-report"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TV_TR_REPORT} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TV_TR_REPORT} id={id} />
