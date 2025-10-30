"use client"

import { useState } from "react"
import { ResultDialog } from "@/components/result-dialog"
import { DigitalSearchTree } from "@/components/algorithms/internal/digital-search-tree"
import { TrieSearch } from "@/components/algorithms/internal/trie-search"
import { MultipleResidueTree } from "@/components/algorithms/internal/multiple-residue-tree"

interface DataItem {
  value: number
  isHighlighted: boolean
  isFound: boolean
  calculation?: string
}

interface DialogState {
  open: boolean
  title: string
  description: string
  type: "success" | "error" | "info"
}

export function ResidueSearch({ type }: { type: "digital" | "multiple" | "tries" }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    type: "info",
  })

  // Renderizar el componente correspondiente según el tipo
  const renderComponent = () => {
    switch (type) {
      case "digital":
        return <DigitalSearchTree />
      case "multiple":
        return <MultipleResidueTree />
      case "tries":
        return <TrieSearch />
      default:
        return <div>Tipo de búsqueda no reconocido</div>
    }
  }

  return (
    <div className="space-y-6">
      {renderComponent()}

      {/* Diálogo de resultados */}
      <ResultDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ ...dialogState, open })}
        title={dialogState.title}
        description={dialogState.description}
        type={dialogState.type}
      />
    </div>
  )
}
