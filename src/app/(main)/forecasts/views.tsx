"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordForm } from "@/components/list/record-form"
import { RecordPage } from "@/components/list/record-page"
import { FORECASTS } from "@/config/lists/forecasts"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={FORECASTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={FORECASTS} id={id} />
export const Form = ({ id }: { id?: number }) => <RecordForm cfg={FORECASTS} id={id} />
