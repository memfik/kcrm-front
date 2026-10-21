"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { ACTS } from "@/config/lists/acts"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={ACTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={ACTS} id={id} />
