"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TEMP_INCREASE } from "@/config/lists/temp-increase"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TEMP_INCREASE} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TEMP_INCREASE} id={id} />
