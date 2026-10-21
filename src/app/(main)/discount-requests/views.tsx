"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { DISCOUNTS } from "@/config/lists/discounts"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={DISCOUNTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={DISCOUNTS} id={id} />
