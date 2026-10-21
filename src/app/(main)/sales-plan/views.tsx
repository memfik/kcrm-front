"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { SALES_PLAN } from "@/config/lists/sales-plan"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={SALES_PLAN} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={SALES_PLAN} id={id} />
