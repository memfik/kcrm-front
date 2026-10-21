"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TV_REGISTRY } from "@/config/lists/tv-registry"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TV_REGISTRY} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TV_REGISTRY} id={id} />
