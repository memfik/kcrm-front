import { Globe, MapPin } from "lucide-react"
import { rnd } from "@/lib/demo-names"

function geo(id: number, city: string): [number, number] {
  const LL: Record<string, [number, number]> = {
    Алматы: [43.2389, 76.8897], Астана: [51.1282, 71.4304], Шымкент: [42.3417, 69.5901], Караганда: [49.8047, 73.1094], Атырау: [47.0945, 51.9238],
    Актобе: [50.2839, 57.167], Павлодар: [52.2873, 76.9674], "Усть-Каменогорск": [49.9483, 82.6275], Костанай: [53.2198, 63.6354], Актау: [43.6481, 51.1722],
  }
  const c = LL[city] ?? LL["Астана"]
  return [c[0] + ((rnd(id, 40) % 1000) / 1000 - 0.5) * 0.05, c[1] + ((rnd(id, 41) % 1000) / 1000 - 0.5) * 0.08]
}

/** Карта точки: встроенная OpenStreetMap (без библиотек, грузится только на вкладке) + ссылки в 2ГИС / Google / Яндекс. */
export function MapBlock({ id, city, address, label }: { id: number; city: string; address: string; label: string }) {
  const [lat, lng] = geo(id, city)
  const q = encodeURIComponent(`${city}, ${address}`)
  const bbox = [lng - 0.006, lat - 0.003, lng + 0.006, lat + 0.003].join(",")
  const link = "inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-[13px] font-semibold hover:bg-[var(--soft)] [&_svg]:size-4"
  return (
    <>
      <iframe
        title={`Карта: ${label}`}
        loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
        className="mb-3 h-80 w-full rounded-2xl border-0 bg-[var(--soft)] dark:[filter:invert(0.9)_hue-rotate(180deg)_saturate(0.6)]"
      />
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <a className={link} target="_blank" rel="noopener noreferrer" href={`https://2gis.kz/search/${q}?m=${lng},${lat}/16`}>
          <MapPin />
          2ГИС
        </a>
        <a className={link} target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}>
          <Globe />
          Google Maps
        </a>
        <a className={link} target="_blank" rel="noopener noreferrer" href={`https://yandex.kz/maps/?pt=${lng},${lat}&z=16&l=map`}>
          <MapPin />
          Яндекс
        </a>
        <span className="flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
      </div>
    </>
  )
}
