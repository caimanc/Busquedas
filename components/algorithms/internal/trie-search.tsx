"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResultDialog } from "@/components/result-dialog"
import { ChevronLeft, ChevronRight, RotateCcw, Save, Search, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TrieNode {
  char: string
  isEndOfWord: boolean
  children: Map<string, TrieNode>
  isHighlighted: boolean
  isFound: boolean
  isLinkNode: boolean
  x: number
  y: number
  id: string
  binaryPath: string
  level: number
}

interface DialogState {
  open: boolean
  title: string
  description: string
  type: "success" | "error" | "info"
}

interface InsertionStep {
  nodeId: string
  char: string
  bit: string
  level: number
  isEndOfWord: boolean
  isLinkNode: boolean
  description: string
}

export function TrieSearch() {
  const [root, setRoot] = useState<TrieNode | null>(null)
  const [nodes, setNodes] = useState<TrieNode[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [insertionSteps, setInsertionSteps] = useState<InsertionStep[]>([])
  const [explanation, setExplanation] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [searchValue, setSearchValue] = useState<string>("")
  const [insertedLetters, setInsertedLetters] = useState<string[]>([])
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    type: "info",
  })
  const [binaryValues, setBinaryValues] = useState<{ char: string; binary: string; decimal: number }[]>([])

  // Inicializar con trie vacío
  useEffect(() => {
    createEmptyStructure()
  }, [])

  const createEmptyStructure = () => {
    const newRoot: TrieNode = {
      char: "RAIZ",
      isEndOfWord: false,
      children: new Map(),
      isHighlighted: false,
      isFound: false,
      isLinkNode: false,
      x: 0,
      y: 0,
      id: `node-root-${Math.random().toString(36).substring(2, 9)}`,
      binaryPath: "",
      level: 0,
    }

    setRoot(newRoot)
    setNodes([newRoot])
    setCurrentStep(-1)
    setInsertionSteps([])
    setExplanation("")
    setInsertedLetters([])
    setBinaryValues([])
  }

  // Función para crear un nuevo nodo
  const createNode = (char: string, binaryPath: string, level: number, isLinkNode = false): TrieNode => {
    return {
      char: isLinkNode ? "" : char,
      isEndOfWord: false,
      children: new Map(),
      isHighlighted: false,
      isFound: false,
      isLinkNode,
      x: 0,
      y: 0,
      id: `node-${char}-${Math.random().toString(36).substring(2, 9)}`,
      binaryPath,
      level,
    }
  }

  // Función para convertir un carácter a su valor decimal (posición en el alfabeto)
  const charToDecimal = (char: string): number => {
    const upperChar = char.toUpperCase()
    if (upperChar === "Ñ") return 27
    return upperChar.charCodeAt(0) - "A".charCodeAt(0) + 1
  }

  // Función para convertir un número decimal a binario con un número fijo de bits
  const decimalToBinary = (decimal: number, bits = 5): string => {
    return decimal.toString(2).padStart(bits, "0")
  }

  // Función para insertar una palabra en el trie
  const insertWord = (word: string) => {
    if (!word || word.trim() === "") {
      setExplanation("Por favor ingrese una palabra válida")
      setDialogState({
        open: true,
        title: "Palabra inválida",
        description: "Por favor ingrese una palabra válida.",
        type: "error",
      })
      return
    }

    word = word.toUpperCase()
    clearSearch()

    if (!root) {
      createEmptyStructure()
    }

    // Convertir cada carácter a su representación binaria
    const letters = word.split("").filter((char) => /[a-zA-ZñÑ]/.test(char))
    const charBinaries: { char: string; binary: string; decimal: number }[] = []

    for (const char of letters) {
      const upperChar = char.toUpperCase()
      const decimal = charToDecimal(upperChar)
      const binary = decimalToBinary(decimal)

      charBinaries.push({
        char: upperChar,
        binary,
        decimal,
      })
    }

    setBinaryValues(charBinaries)

    // Preparar para la inserción paso a paso
    const steps: InsertionStep[] = []
    const newRoot = root!
    const newNodes = [newRoot]

    steps.push({
      nodeId: newRoot.id,
      char: "",
      bit: "",
      level: 0,
      isEndOfWord: false,
      isLinkNode: false,
      description: `Iniciando inserción de la palabra "${word}" en el Trie`,
    })

    // Insertar cada letra
    for (let letterIndex = 0; letterIndex < letters.length; letterIndex++) {
      const char = letters[letterIndex]
      const upperChar = char.toUpperCase()
      const decimal = charToDecimal(upperChar)
      const binary = decimalToBinary(decimal)

      steps.push({
        nodeId: newRoot.id,
        char: upperChar,
        bit: binary,
        level: 0,
        isEndOfWord: false,
        isLinkNode: false,
        description: `Insertando letra "${upperChar}" (${binary})`,
      })

      let current = newRoot
      let bitIndex = 0

      // Navegar por el árbol siguiendo los bits
      while (bitIndex < binary.length) {
        const bit = binary[bitIndex]
        const direction = bit === "1" ? "right" : "left"
        const nextLevel = bitIndex + 1

        steps.push({
          nodeId: current.id,
          char: upperChar,
          bit: binary,
          level: bitIndex,
          isEndOfWord: false,
          isLinkNode: current.isLinkNode,
          description: `Procesando bit ${bitIndex + 1} de "${upperChar}": ${bit} (${bit === "1" ? "derecha" : "izquierda"})`,
        })

        // Verificar si existe un hijo en esa dirección
        if (current.children.has(direction)) {
          const existingChild = current.children.get(direction)!

          // Si el nodo existente tiene una letra y no es nodo de enlace
          if (!existingChild.isLinkNode && existingChild.char !== "" && existingChild.char !== upperChar) {
            // Hay colisión, convertir en nodo de enlace
            existingChild.char = ""
            existingChild.isLinkNode = true

            steps.push({
              nodeId: existingChild.id,
              char: "",
              bit: binary,
              level: nextLevel,
              isEndOfWord: false,
              isLinkNode: true,
              description: `Colisión detectada en nivel ${nextLevel}, creando nodo de enlace`,
            })
          }

          current = existingChild
          bitIndex++
        } else {
          // No existe hijo en esa dirección, crear nuevo nodo
          const newNode = createNode(upperChar, binary, nextLevel, false)
          current.children.set(direction, newNode)
          newNodes.push(newNode)

          steps.push({
            nodeId: newNode.id,
            char: upperChar,
            bit: binary,
            level: nextLevel,
            isEndOfWord: true,
            isLinkNode: false,
            description: `Creando nodo para "${upperChar}" en nivel ${nextLevel} como ${direction === "right" ? "hijo derecho" : "hijo izquierdo"}`,
          })

          break
        }
      }

      // Si llegamos al final del binario y el nodo actual es de enlace, crear hijo final
      if (bitIndex >= binary.length && current.isLinkNode) {
        // Buscar una posición libre para colocar la letra
        const finalDirection = "right" // Por defecto derecha, pero podríamos usar lógica adicional
        if (!current.children.has(finalDirection)) {
          const finalNode = createNode(upperChar, binary, current.level + 1, false)
          current.children.set(finalDirection, finalNode)
          newNodes.push(finalNode)

          steps.push({
            nodeId: finalNode.id,
            char: upperChar,
            bit: binary,
            level: current.level + 1,
            isEndOfWord: true,
            isLinkNode: false,
            description: `Colocando "${upperChar}" como nodo final`,
          })
        }
      }
    }

    setNodes(newNodes)
    setInsertedLetters(letters.map((c) => c.toUpperCase()))
    calculateNodePositions(newNodes)
    setInsertionSteps(steps)
    setCurrentStep(-1)
    setExplanation(`Preparando inserción de la palabra "${word}" en el Trie`)
  }

  // Función para calcular posiciones de los nodos para visualización
  const calculateNodePositions = (nodes: TrieNode[]) => {
    if (!root) return

    const levelHeight = 80
    const baseWidth = 60

    // Función para calcular el ancho de un subárbol
    const calculateSubtreeWidth = (node: TrieNode): number => {
      if (node.children.size === 0) return 1

      let totalWidth = 0
      for (const child of node.children.values()) {
        totalWidth += calculateSubtreeWidth(child)
      }
      return Math.max(1, totalWidth)
    }

    // Función para asignar posiciones
    const assignPositions = (node: TrieNode, level: number, leftPos: number): number => {
      node.y = level * levelHeight

      const children = Array.from(node.children.entries()).sort((a, b) => {
        // Ordenar: izquierda (left) antes que derecha (right)
        if (a[0] === "left" && b[0] === "right") return -1
        if (a[0] === "right" && b[0] === "left") return 1
        return 0
      })

      if (children.length === 0) {
        node.x = leftPos * baseWidth
        return leftPos + 1
      }

      let currentPos = leftPos
      const childPositions: number[] = []

      for (const [direction, child] of children) {
        const childPos = assignPositions(child, level + 1, currentPos)
        childPositions.push((currentPos * baseWidth + (childPos - 1) * baseWidth) / 2)
        currentPos = childPos
      }

      // Centrar el nodo sobre sus hijos
      if (childPositions.length > 0) {
        node.x = childPositions.reduce((sum, pos) => sum + pos, 0) / childPositions.length
      } else {
        node.x = leftPos * baseWidth
      }

      return currentPos
    }

    assignPositions(root, 0, 0)
  }

  // Función para buscar una letra en el trie
  const searchLetter = (letter: string) => {
    if (!letter || letter.trim() === "") {
      setExplanation("Por favor ingrese una letra válida")
      setDialogState({
        open: true,
        title: "Letra inválida",
        description: "Por favor ingrese una letra válida.",
        type: "error",
      })
      return
    }

    if (!root || nodes.length <= 1) {
      setExplanation("El trie está vacío")
      setDialogState({
        open: true,
        title: "Trie vacío",
        description: "El trie está vacío. Inserte una palabra primero.",
        type: "error",
      })
      return
    }

    const upperLetter = letter.toUpperCase()

    // Limpiar búsqueda anterior
    clearSearch()

    // Buscar la letra en el árbol
    let found = false
    const searchInNode = (node: TrieNode): boolean => {
      if (node.char === upperLetter && !node.isLinkNode) {
        node.isFound = true
        found = true
        return true
      }

      for (const child of node.children.values()) {
        if (searchInNode(child)) {
          return true
        }
      }

      return false
    }

    searchInNode(root)

    if (found) {
      setNodes([...nodes])
      setExplanation(`¡Letra "${upperLetter}" encontrada en el trie!`)
      setDialogState({
        open: true,
        title: "Letra encontrada",
        description: `¡La letra "${upperLetter}" ha sido encontrada en el trie!`,
        type: "success",
      })
    } else {
      setExplanation(`La letra "${upperLetter}" no existe en el trie`)
      setDialogState({
        open: true,
        title: "Letra no encontrada",
        description: `La letra "${upperLetter}" no existe en el trie.`,
        type: "error",
      })
    }
  }

  // Función para limpiar la búsqueda
  const clearSearch = () => {
    const resetNodes = nodes.map((node) => ({
      ...node,
      isFound: false,
      isHighlighted: false,
    }))
    setNodes(resetNodes)
  }

  const nextStep = () => {
    if (currentStep < insertionSteps.length - 1) {
      const nextStepIndex = currentStep + 1
      const step = insertionSteps[nextStepIndex]

      // Actualizar visualización
      const newNodes = nodes.map((node) => ({
        ...node,
        isHighlighted: node.id === step.nodeId,
      }))

      setNodes(newNodes)
      setCurrentStep(nextStepIndex)
      setExplanation(step.description)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1
      const step = insertionSteps[prevStepIndex]

      const newNodes = nodes.map((node) => ({
        ...node,
        isHighlighted: node.id === step.nodeId,
      }))

      setNodes(newNodes)
      setCurrentStep(prevStepIndex)
      setExplanation(step.description)
    } else if (currentStep === 0) {
      const resetNodes = nodes.map((node) => ({
        ...node,
        isHighlighted: false,
      }))

      setNodes(resetNodes)
      setCurrentStep(-1)
      setExplanation("Preparando inserción en el Trie")
    }
  }

  const showFinalResult = () => {
    if (insertionSteps.length > 0) {
      const finalStep = insertionSteps[insertionSteps.length - 1]

      const newNodes = nodes.map((node) => ({
        ...node,
        isHighlighted: false,
      }))

      setNodes(newNodes)
      setCurrentStep(insertionSteps.length - 1)
      setExplanation("Construcción del Trie completada")
    }
  }

  const resetSearch = () => {
    clearSearch()
    setCurrentStep(-1)
    setExplanation("")
  }

  const saveStructure = () => {
    setExplanation("Estructura guardada correctamente")
    setDialogState({
      open: true,
      title: "Estructura guardada",
      description: "La estructura ha sido guardada correctamente.",
      type: "success",
    })
  }

  // Renderizar conexiones entre nodos
  const renderConnections = () => {
    const connections = []

    for (const node of nodes) {
      for (const [direction, childNode] of node.children) {
        const isLeft = direction === "left"
        connections.push(
          <g key={`${node.id}-${childNode.id}`}>
            <line
              x1={node.x + 25}
              y1={node.y + 25}
              x2={childNode.x + 25}
              y2={childNode.y + 25}
              stroke="#2E2E2E"
              strokeWidth="2"
            />
            <text
              x={(node.x + childNode.x) / 2 + 25}
              y={(node.y + childNode.y) / 2 + 20}
              textAnchor="middle"
              className="text-xs fill-carbon font-medium"
            >
              {isLeft ? "0" : "1"}
            </text>
          </g>,
        )
      }
    }

    return connections
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trie (Árbol de Prefijos con Bits Binarios)</CardTitle>
          <CardDescription>
            El Trie es una estructura de datos de árbol que utiliza bits binarios para determinar la posición de
            inserción. Los nodos de enlace se crean cuando hay colisiones, y la navegación se basa en los bits: 0 =
            izquierda, 1 = derecha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Controles de entrada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="word-input">Palabra a insertar</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="word-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ingrese una palabra (ej: PRUEBA)"
                  />
                  <Button onClick={() => insertWord(inputValue)}>Insertar</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-input">Buscar letra</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="search-input"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Ingrese una letra"
                    maxLength={1}
                  />
                  <Button onClick={() => searchLetter(searchValue)}>
                    <Search className="h-4 w-4 mr-1" />
                    Buscar
                  </Button>
                  <Button variant="outline" onClick={clearSearch}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de valores binarios */}
            {binaryValues.length > 0 && (
              <div className="border rounded-lg p-4 bg-marfil/50">
                <h3 className="text-sm font-medium mb-3">Tabla de códigos binarios</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate/20">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-carbon/70 uppercase tracking-wider">
                          Letra
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-carbon/70 uppercase tracking-wider">
                          Posición (decimal)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-carbon/70 uppercase tracking-wider">
                          Código binario
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate/10">
                      {binaryValues.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-marfil/30"}>
                          <td className="px-4 py-2 font-medium">{item.char}</td>
                          <td className="px-4 py-2">{item.decimal}</td>
                          <td className="px-4 py-2 font-mono">{item.binary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Lista de letras insertadas */}
            {insertedLetters.length > 0 && (
              <div className="border rounded-lg p-4 bg-marfil/50">
                <h3 className="text-sm font-medium mb-3">Letras insertadas</h3>
                <div className="flex flex-wrap gap-2">
                  {insertedLetters.map((letter, index) => (
                    <div key={index} className="px-3 py-1 bg-slate/10 rounded-md text-sm font-medium">
                      {letter}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visualización del trie */}
            <div className="border rounded-lg p-4 bg-marfil/50">
              <h3 className="text-sm font-medium mb-3">Árbol de Búsqueda Binaria (Trie)</h3>

              <div className="flex justify-center">
                <div className="relative w-full h-[500px] overflow-auto">
                  <svg width="1000" height="600">
                    {/* Conexiones entre nodos */}
                    {renderConnections()}

                    {/* Nodos */}
                    {nodes.map((node) => (
                      <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                        <circle
                          cx="25"
                          cy="25"
                          r="25"
                          className={`
                            ${node.isHighlighted ? "fill-petroleo stroke-white" : "fill-white stroke-slate/20"}
                            ${node.isFound ? "fill-green-500 stroke-white" : ""}
                            ${node.isLinkNode ? "fill-gray-200 stroke-gray-400" : ""}
                          `}
                          strokeWidth="2"
                        />
                        <text
                          x="25"
                          y="30"
                          textAnchor="middle"
                          className={`text-sm font-bold ${
                            node.isHighlighted || node.isFound
                              ? "fill-white"
                              : node.isLinkNode
                                ? "fill-gray-600"
                                : "fill-carbon"
                          }`}
                        >
                          {node.isLinkNode ? "○" : node.char === "RAIZ" ? "RAIZ" : node.char}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Explicación del paso actual */}
              {explanation && <div className="mt-4 p-3 bg-petroleo/10 rounded-md text-sm">{explanation}</div>}
            </div>

            {/* Controles de navegación */}
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={prevStep} disabled={currentStep <= -1} variant="outline">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Paso anterior
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Retrocede un paso en la visualización</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={nextStep} disabled={currentStep >= insertionSteps.length - 1}>
                      Paso siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Avanza un paso en la visualización</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={showFinalResult} disabled={insertionSteps.length === 0} variant="secondary">
                      Ver resultado final
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Muestra el resultado final sin pasos intermedios</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={resetSearch} variant="outline">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reiniciar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reinicia la visualización</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={saveStructure} variant="secondary">
                      <Save className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Guarda el estado actual de la estructura</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

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
