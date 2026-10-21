"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { CONTRACTS } from "@/config/lists/contracts"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={CONTRACTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={CONTRACTS} id={id} />
