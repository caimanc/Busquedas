"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  toggleSidebar: () => void
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="bg-carbon text-marfil p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden text-marfil hover:text-marfil hover:bg-carbon/80"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menú</span>
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-center w-full uppercase">
          BÚSQUEDAS-CIENCIAS II
        </h1>

        {/* Espacio para equilibrar el layout */}
        <div className="w-6 md:hidden"></div>
      </div>
    </header>
  )
}
