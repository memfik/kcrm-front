"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { LOTS_LIST } from "@/config/lists/lots"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={LOTS_LIST} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={LOTS_LIST} id={id} />
