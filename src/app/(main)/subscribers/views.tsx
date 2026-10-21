"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordForm } from "@/components/list/record-form"
import { RecordPage } from "@/components/list/record-page"
import { SUBSCRIBERS } from "@/config/lists/subscribers"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={SUBSCRIBERS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={SUBSCRIBERS} id={id} />
export const Form = ({ id }: { id?: number }) => <RecordForm cfg={SUBSCRIBERS} id={id} />
