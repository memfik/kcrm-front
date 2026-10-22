"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { JOB_ORDERS } from "@/config/lists/job-orders"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={JOB_ORDERS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={JOB_ORDERS} id={id} />
