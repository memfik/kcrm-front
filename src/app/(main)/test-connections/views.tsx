"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TEST_CONNECTIONS } from "@/config/lists/test-connections"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TEST_CONNECTIONS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TEST_CONNECTIONS} id={id} />
