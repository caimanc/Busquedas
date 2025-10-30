"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, X } from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onSelectAlgorithm: (algorithm: string) => void
  selectedAlgorithm: string | null
}

interface AlgorithmSection {
  title: string
  id: string
  subsections?: AlgorithmSection[]
}

const algorithms: AlgorithmSection[] = [
  {
    title: "Búsquedas Internas",
    id: "internal",
    subsections: [
      { title: "Búsqueda Lineal", id: "internal-linear" },
      { title: "Búsqueda Binaria", id: "internal-binary" },
      {
        title: "Funciones Hash",
        id: "internal-hash",
        subsections: [
          { title: "Módulo", id: "internal-hash-mod" },
          { title: "Cuadrado", id: "internal-hash-square" },
          { title: "Plegamiento", id: "internal-hash-folding" },
          { title: "Truncamiento", id: "internal-hash-truncation" },
          { title: "Cambio de Base", id: "internal-hash-base-change" },
        ],
      },
      {
        title: "Búsqueda por Residuos",
        id: "internal-residue",
        subsections: [
          { title: "Árbol de B. Binaria", id: "internal-residue-digital" },
          { title: "Árbol de Residuos Múltiples", id: "internal-residue-multiple" },
          { title: "Tries", id: "internal-residue-tries" },
        ],
      },
      { title: "Árbol de Huffman", id: "internal-huffman" },
    ],
  },
  {
    title: "Búsquedas Externas",
    id: "external",
    subsections: [
      { title: "Búsqueda Lineal", id: "external-linear" },
      { title: "Búsqueda Binaria", id: "external-binary" },
      {
        title: "Funciones Hash",
        id: "external-hash",
        subsections: [
          { title: "Módulo", id: "external-hash-mod" },
          { title: "Cuadrado", id: "external-hash-square" },
          { title: "Plegamiento", id: "external-hash-folding" },
          { title: "Truncamiento", id: "external-hash-truncation" },
          { title: "Cambio de Base", id: "external-hash-base-change" },
        ],
      },
      {
        title: "Búsquedas Dinámicas",
        id: "external-dynamic",
        subsections: [
          { title: "Expansiones-Reducciones Totales", id: "external-dynamic-total" },
          { title: "Expansiones-Reducciones Parciales", id: "external-dynamic-partial" },
        ],
      },
    ],
  },
]

export function Sidebar({ isOpen, onClose, onSelectAlgorithm, selectedAlgorithm }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["internal", "external"]))

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const renderSection = (section: AlgorithmSection, level = 0) => {
    const isExpanded = expandedSections.has(section.id)
    const hasSubsections = section.subsections && section.subsections.length > 0
    const isSelected = selectedAlgorithm === section.id

    return (
      <div key={section.id} className={`${level > 0 ? "ml-4" : ""}`}>
        <Button
          variant={isSelected ? "secondary" : "ghost"}
          className={`w-full justify-start text-left font-normal ${level === 0 ? "font-semibold" : ""}`}
          onClick={() => {
            if (hasSubsections) {
              toggleSection(section.id)
            } else {
              onSelectAlgorithm(section.id)
              if (window.innerWidth < 768) {
                onClose()
              }
            }
          }}
        >
          {hasSubsections &&
            (isExpanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />)}
          <span className={!hasSubsections ? "ml-6" : ""}>{section.title}</span>
        </Button>

        {hasSubsections && isExpanded && (
          <div className="mt-1">{section.subsections?.map((subsection) => renderSection(subsection, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-64 bg-background border-r
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <h2 className="font-semibold">Menú</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-2">{algorithms.map((section) => renderSection(section))}</div>
        </ScrollArea>
      </aside>
    </>
  )
}
