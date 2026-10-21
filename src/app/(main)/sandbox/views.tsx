"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { SANDBOX } from "@/config/lists/sandbox"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. Формы у песочницы нет. */

export const List = () => <ListPage cfg={SANDBOX} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={SANDBOX} id={id} />
