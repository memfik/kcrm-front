"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TECH_REQUESTS } from "@/config/lists/tech-requests"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TECH_REQUESTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TECH_REQUESTS} id={id} />
