"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TYPICAL_TR } from "@/config/lists/typical-tr"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TYPICAL_TR} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TYPICAL_TR} id={id} />
