"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordForm } from "@/components/list/record-form"
import { RecordPage } from "@/components/list/record-page"
import { IP_REQUESTS } from "@/config/lists/ip-requests"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={IP_REQUESTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={IP_REQUESTS} id={id} />
export const Form = ({ id }: { id?: number }) => <RecordForm cfg={IP_REQUESTS} id={id} />
