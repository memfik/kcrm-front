"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { IPR } from "@/config/lists/ipr"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={IPR} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={IPR} id={id} />
