import { Avatar, AvatarFallback, AvatarImage, } from '@/components/ui/avatar'

import SearchBar from '@/features/search/components/SearchBar'
import Sidebar from './Sidebar'

export default function Header({ onSelectArtist }: { onSelectArtist?: (a: any) => void }) {
  return (
    <>
      <header className="fixed top-0 left-0 z-50 h-16 w-full px-4 bg-background text-foreground border-b-[3px] border-border grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center justify-start">
          <a href="/" className="flex items-center">
            <img src="" alt="Encore Logo" className="h-10 w-auto block" />
          </a>
        </div>

        <div className="flex items-center justify-center">
          <SearchBar onSelectArtist={onSelectArtist} />
        </div>

        <div className="flex items-center justify-end">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>PH</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <Sidebar />
    </>
  )
}
