"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { TASKS } from "@/config/lists/tasks"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={TASKS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={TASKS} id={id} />
