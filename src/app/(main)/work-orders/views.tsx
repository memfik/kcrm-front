"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { WORK_ORDERS } from "@/config/lists/work-orders"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={WORK_ORDERS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={WORK_ORDERS} id={id} />
