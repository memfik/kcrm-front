"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { ADDRESSES } from "@/config/lists/addresses"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={ADDRESSES} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={ADDRESSES} id={id} />
