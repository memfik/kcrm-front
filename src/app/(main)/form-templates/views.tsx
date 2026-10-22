"use client"

import { ListPage } from "@/components/list/list-page"
import { RecordPage } from "@/components/list/record-page"
import { FORM_TEMPLATES } from "@/config/lists/form-templates"

/* Конфиг с функциями живёт только на клиенте — страницы маршрута отдают эти обёртки. */

export const List = () => <ListPage cfg={FORM_TEMPLATES} />
export const Record = ({ id }: { id: number }) => <RecordPage cfg={FORM_TEMPLATES} id={id} />
