"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { INSTALL_ACTS } from "@/config/lists/install-acts"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={INSTALL_ACTS} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={INSTALL_ACTS} id={id} />
