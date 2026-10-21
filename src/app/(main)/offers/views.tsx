"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordForm } from "@/components/list/record-form"
import { RecordPage } from "@/components/list/record-page"
import { OFFERS_LIST } from "@/config/lists/offers"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={OFFERS_LIST} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={OFFERS_LIST} id={id} />
export const Form = ({ id }: { id?: number }) => <RecordForm cfg={OFFERS_LIST} id={id} />
