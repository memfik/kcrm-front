"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { DEPARTMENTS_LIST } from "@/config/lists/departments"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={DEPARTMENTS_LIST} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={DEPARTMENTS_LIST} id={id} />
