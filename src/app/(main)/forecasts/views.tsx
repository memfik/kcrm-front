"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { FORECASTS } from "@/config/lists/forecasts"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={FORECASTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={FORECASTS} id={id} />
