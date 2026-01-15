import { Link } from "@tanstack/react-router"
import { Home, Heart, Ticket, MapPinned } from "lucide-react"

const baseItem =
  "flex items-center gap-3 p-3 rounded-lg transition-colors mb-2"

const hoverItem = "hover:bg-muted"

const activeItem =
  "bg-muted text-[var(--encore-accent-warm)]"

export default function Sidebar() {
  return (
    <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-card text-card-foreground border-r-[3px] border-border shadow-2xl z-50 flex flex-col">
      <nav className="flex-1 p-4 overflow-y-auto">
        <Link
          to="/"
          className={`${baseItem} ${hoverItem}`}
          activeProps={{ className: `${baseItem} ${activeItem}` }}
        >
          <Home size={20} />
          <span className="font-medium">Home</span>
        </Link>

        <Link
          to="/followed"
          className={`${baseItem} ${hoverItem}`}
          activeProps={{ className: `${baseItem} ${activeItem}` }}
        >
          <Heart size={20} />
          <span className="font-medium">Followed</span>
        </Link>

        <Link
          to="/tickets"
          className={`${baseItem} ${hoverItem}`}
          activeProps={{ className: `${baseItem} ${activeItem}` }}
        >
          <Ticket size={20} />
          <span className="font-medium">Tickets</span>
        </Link>

        <Link
          to="/map"
          className={`${baseItem} ${hoverItem}`}
          activeProps={{ className: `${baseItem} ${activeItem}` }}
        >
          <MapPinned size={20} />
          <span className="font-medium">Concerts Map</span>
        </Link>
      </nav>
    </aside>
  )
}
