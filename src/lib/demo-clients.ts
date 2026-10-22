import clients from "@/data/counterparties-demo.json"
import { rnd } from "./demo-names"

/** В копии базы почти все сделки и заявки висят на тестовом контрагенте 22291 — раскидываем по реальным. Отдельно от demo-names: тянет справочник контрагентов (128 КБ). */
export const fixClient = (cs: string, seed: string | number) => (cs === "22291" ? +clients[rnd(seed, 55) % clients.length][0] : +cs)
