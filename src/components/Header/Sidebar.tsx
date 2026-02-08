import { Link } from "@tanstack/react-router"
import { Home, Heart, Ticket, MapPinned } from "lucide-react"
import { useAuth } from "@/integrations/auth-context"

const baseItem =
  "flex items-center gap-3 p-3 rounded-lg transition-colors mb-2"

const hoverItem = "hover:bg-muted"

const activeItem =
  "bg-muted text-[var(--encore-accent-warm)]"

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="app-sidebar theme-test-sidebar w-80 text-card-foreground border-r-[3px] border-border shadow-2xl flex flex-col">
      <nav className="theme-test-nav flex-1 p-4 overflow-y-auto">
        <Link
          to="/"
          className={`theme-test-nav-link ${baseItem} ${hoverItem}`}
          activeProps={{ className: `theme-test-nav-link ${baseItem} ${activeItem}` }}
        >
          <Home size={20} />
          <span className="theme-test-nav-text">
            <span className="theme-test-nav-main">Home</span>
            <span className="theme-test-nav-sub">catalog</span>
          </span>
        </Link>

        <Link
          to="/followed"
          className={`theme-test-nav-link ${baseItem} ${hoverItem}`}
          activeProps={{ className: `theme-test-nav-link ${baseItem} ${activeItem}` }}
        >
          <Heart size={20} />
          <span className="theme-test-nav-text">
            <span className="theme-test-nav-main">Followed</span>
            <span className="theme-test-nav-sub">saved</span>
          </span>
        </Link>

        <Link
          to="/tickets"
          className={`theme-test-nav-link ${baseItem} ${hoverItem}`}
          activeProps={{ className: `theme-test-nav-link ${baseItem} ${activeItem}` }}
        >
          <Ticket size={20} />
          <span className="theme-test-nav-text">
            <span className="theme-test-nav-main">Tickets</span>
            <span className="theme-test-nav-sub">buy</span>
          </span>
        </Link>

        <Link
          to="/map"
          className={`theme-test-nav-link ${baseItem} ${hoverItem}`}
          activeProps={{ className: `theme-test-nav-link ${baseItem} ${activeItem}` }}
        >
          <MapPinned size={20} />
          <span className="theme-test-nav-text">
            <span className="theme-test-nav-main">Concerts</span>
            <span className="theme-test-nav-sub">near</span>
          </span>
        </Link>

        {user?.is_admin && (
          <Link
            to="/admin-dashboard"
            className={`theme-test-nav-link ${baseItem} ${hoverItem} mt-6`}
            activeProps={{ className: `theme-test-nav-link ${baseItem} ${activeItem} mt-6` }}
          >
            <Home size={20} />
            <span className="theme-test-nav-text">
              <span className="theme-test-nav-main">Admin</span>
              <span className="theme-test-nav-sub">manage</span>
            </span>
          </Link>
        )}
      </nav>
    </aside>
  )
}
