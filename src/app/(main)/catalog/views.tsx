"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { CATALOG } from "@/config/lists/catalog"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={CATALOG} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={CATALOG} id={id} />
