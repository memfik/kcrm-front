"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { CALENDAR } from "@/config/lists/calendar"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={CALENDAR} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={CALENDAR} id={id} />
