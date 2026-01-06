import { Link } from '@tanstack/react-router'
import { SearchInput, ShowResults } from "./search"
import type { Artist } from './artist'


import { Search, MapPinned, Heart, Home, Ticket } from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import { useState } from 'react'



export default function Header(){
  const [results, setResults] = useState<Artist[]>([]);
  return (
    <>
      <header className="fixed top-0 left-0 h-16 w-full p-4 flex items-center bg-gray-800 text-white shadow-lg basis-auto">
        <h1 className="ml-4 text-xl font-semibold flex-1 flex items-center justify-start">
          <Link to="/">
            <img
              src=""
              alt="Encore Logo"
              className="h-10"
            />
          </Link>
        </h1>
        <div className="relative flex flex-col items-center w-[min(20rem,100%)]">
          <InputGroup className="w-full relative h-10 rounded-full bg-card brutal overflow-hidden">
            <InputGroupAddon align="inline-end" className="absolute left-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-muted-foreground pointer-events-none">
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." className="text-black h-10 w-full rounded-full bg-transparent border-0 shadow-none pl-10 pr-4 focus-visible:ring-0 focus-visible:ring-offset-0" onChange={(e) => SearchInput(e.target.value, { setResults })}/>
          </InputGroup>
          < ShowResults results={results} />
        </div>
        <h1 className="flex-1 flex items-center justify-end">Profile Picture</h1>
      </header>

      <aside
        className={`fixed tp-16 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col translate-x-full'`}
      >
        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          {/* Placeholders start */}

          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Heart size={20} />
            <span className="font-medium">Followed</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Ticket size={20} />
            <span className="font-medium">Tickets</span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
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
