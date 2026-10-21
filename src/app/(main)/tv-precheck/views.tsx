"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TV_PRECHECK } from "@/config/lists/tv-precheck"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TV_PRECHECK} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TV_PRECHECK} id={id} />
