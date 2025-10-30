"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LinearSearch } from "@/components/algorithms/internal/linear-search"
import { BinarySearch } from "@/components/algorithms/internal/binary-search"
import { HashSearch } from "@/components/algorithms/internal/hash-search"
import { DigitalSearchTree } from "@/components/algorithms/internal/digital-search-tree"
import { TrieSearch } from "@/components/algorithms/internal/trie-search"
import { MultipleResidueTree } from "@/components/algorithms/internal/multiple-residue-tree"
import { HuffmanTree } from "@/components/algorithms/internal/huffman-tree"
import { ExternalLinearSearch } from "@/components/algorithms/external/linear-search"
import { ExternalBinarySearch } from "@/components/algorithms/external/binary-search"
import { ExternalHashSearch } from "@/components/algorithms/external/hash-search"
import { DynamicSearch } from "@/components/algorithms/external/dynamic-search"

export default function AlgorithmVisualizer() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const renderAlgorithm = () => {
    switch (selectedAlgorithm) {
      // Búsquedas internas
      case "internal-linear":
        return <LinearSearch />
      case "internal-binary":
        return <BinarySearch />
      case "internal-hash-mod":
        return <HashSearch type="mod" />
      case "internal-hash-square":
        return <HashSearch type="square" />
      case "internal-hash-folding":
        return <HashSearch type="folding" />
      case "internal-hash-truncation":
        return <HashSearch type="truncation" />
      case "internal-hash-base-change":
        return <HashSearch type="base-change" />
      case "internal-residue-digital":
        return <DigitalSearchTree />
      case "internal-residue-multiple":
        return <MultipleResidueTree />
      case "internal-residue-tries":
        return <TrieSearch />
      case "internal-huffman":
        return <HuffmanTree />

      // Búsquedas externas
      case "external-linear":
        return <ExternalLinearSearch />
      case "external-binary":
        return <ExternalBinarySearch />
      case "external-hash-mod":
        return <ExternalHashSearch type="mod" />
      case "external-hash-square":
        return <ExternalHashSearch type="square" />
      case "external-hash-folding":
        return <ExternalHashSearch type="folding" />
      case "external-hash-truncation":
        return <ExternalHashSearch type="truncation" />
      case "external-hash-base-change":
        return <ExternalHashSearch type="base-change" />
      case "external-dynamic-total":
        return <DynamicSearch type="total" />
      case "external-dynamic-partial":
        return <DynamicSearch type="partial" />

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-2xl">
              <h2 className="text-2xl font-semibold mb-4">Bienvenido al Visualizador de Algoritmos de Búsqueda</h2>
              <p className="mb-4">
                Esta aplicación te permite visualizar y comprender el funcionamiento de diversos algoritmos de búsqueda
                tanto internos como externos.
              </p>
              <p>Selecciona un algoritmo del menú lateral para comenzar.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectAlgorithm={setSelectedAlgorithm}
          selectedAlgorithm={selectedAlgorithm}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6">{renderAlgorithm()}</main>
      </div>

      <Footer />
    </div>
  )
}
