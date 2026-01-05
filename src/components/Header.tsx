import { Link } from '@tanstack/react-router'

import { Search, MapPinned, Heart, Home, Ticket } from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export default function Header() {


  return (
    <>
      <header className="fixed top-0 left-0 z-50 h-16 w-full px-4 bg-background text-foreground border-b-[3px] border-border grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Left - Logo */}
        <div className="flex items-center justify-start">
          <Link to="/" className="flex items-center">
            <img src="" alt="Encore Logo" className="h-10 w-auto block" />
          </Link>
        </div>

        {/* Center - Search */}
        <div className="flex items-center justify-center">
          <InputGroup className="relative w-[min(20rem,100%)] h-10 rounded-full bg-card brutal overflow-hidden">
            <InputGroupAddon align="inline-end" className="absolute left-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-muted-foreground pointer-events-none">
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." className="h-10 w-full rounded-full bg-transparent border-0 shadow-none pl-10 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0"/>
          </InputGroup>
        </div>

        {/* Right - Avatar */}
        <div className="flex items-center justify-end">
          <Avatar className="h-10 w-10">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>PH</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <aside className={`fixed top-16 left-0 h-full w-80 bg-card text-card-foreground border-r-[3px] border-border shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col translate-x-full'`}
      > 

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors mb-2"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-accent text-accent-foreground transition-colors mb-2",
            }}
          >

            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {/* Placeholders start */}

          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2 border-l-[3px] border-l-transparent"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-secondary transition-colors mb-2 border-l-[3px] border-l-[var(--encore-accent-warm)] text-[var(--encore-accent-warm)]",
            }}
          >
            <Heart size={20} />
            <span className="font-medium">Followed</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2 border-l-[3px] border-l-transparent"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-secondary transition-colors mb-2 border-l-[3px] border-l-[var(--encore-accent-warm)] text-[var(--encore-accent-warm)]",
            }}
          >
            <Ticket size={20} />
            <span className="font-medium">Tickets</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors mb-2 border-l-[3px] border-l-transparent"
            activeProps={{
              className:
                "flex items-center gap-3 p-3 rounded-lg bg-secondary transition-colors mb-2 border-l-[3px] border-l-[var(--encore-accent-warm)] text-[var(--encore-accent-warm)]",
            }}
          >
            <MapPinned size={20} />
            <span className="font-medium">Concerts Map</span>
          </Link>

          {/* Placeholders end */}
        </nav>
      </aside>
    </>
  )
}
