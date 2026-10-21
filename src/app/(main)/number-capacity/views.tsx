"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { NUMBER_CAPACITY } from "@/config/lists/number-capacity"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={NUMBER_CAPACITY} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={NUMBER_CAPACITY} id={id} />
