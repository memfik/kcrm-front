"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { CALLS } from "@/config/lists/calls"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={CALLS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={CALLS} id={id} />
