"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordForm } from "@/components/list/record-form"
import { RecordPage } from "@/components/list/record-page"
import { COUNTERPARTIES } from "@/config/lists/counterparties"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={COUNTERPARTIES} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={COUNTERPARTIES} id={id} />
export const Form = ({ id }: { id?: number }) => <RecordForm cfg={COUNTERPARTIES} id={id} />
