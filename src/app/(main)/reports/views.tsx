"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { REPORTS_LIST } from "@/config/lists/reports"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={REPORTS_LIST} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={REPORTS_LIST} id={id} />
