"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { PRICE_BUILDER } from "@/config/lists/price-builder"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={PRICE_BUILDER} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={PRICE_BUILDER} id={id} />
