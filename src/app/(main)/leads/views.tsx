"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { LEADS } from "@/config/lists/leads"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={LEADS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={LEADS} id={id} />
