"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { CHANNEL_IDS } from "@/config/lists/channel-ids"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={CHANNEL_IDS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={CHANNEL_IDS} id={id} />
