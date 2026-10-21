"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordForm } from "@/components/list/record-form"
import { RecordPage } from "@/components/list/record-page"
import { DEALS } from "@/config/lists/deals"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={DEALS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={DEALS} id={id} />
export const Form = ({ id }: { id?: number }) => <RecordForm cfg={DEALS} id={id} />
