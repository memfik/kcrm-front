"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { STAGE_REPORT } from "@/config/lists/stage-report"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={STAGE_REPORT} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={STAGE_REPORT} id={id} />
