"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TENDERS } from "@/config/lists/tenders"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TENDERS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TENDERS} id={id} />
