"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordForm } from "@/components/list/record-form"
import { RecordPage } from "@/components/list/record-page"
import { IPR } from "@/config/lists/ipr"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={IPR} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={IPR} id={id} />
export const Form = ({ id }: { id?: number }) => <RecordForm cfg={IPR} id={id} />
