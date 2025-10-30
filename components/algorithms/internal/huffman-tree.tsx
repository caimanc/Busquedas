"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, RotateCcw, Copy, Play, Pause } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Definición de tipos
interface HuffmanNode {
  symbol: string | null
  frequency: number
  left: HuffmanNode | null
  right: HuffmanNode | null
  isLeaf: boolean
  id: string
  x: number
  y: number
  isHighlighted?: boolean
  originalIndex?: number // Para mantener el orden original en caso de empate
}

interface CodeTableEntry {
  symbol: string
  frequency: number
  code: string
  totalBits: number
}

interface BuildStep {
  description: string
  nodes: HuffmanNode[]
  mergedNodes?: { left: HuffmanNode; right: HuffmanNode; parent: HuffmanNode }
  frequencyTable: string // Tabla de frecuencias en este paso
}

export function HuffmanTree() {
  // Estados
  const [inputText, setInputText] = useState<string>("")
  const [frequencyMap, setFrequencyMap] = useState<Map<string, number>>(new Map())
  const [huffmanTree, setHuffmanTree] = useState<HuffmanNode | null>(null)
  const [codeTable, setCodeTable] = useState<CodeTableEntry[]>([])
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1)
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false)
  const [totalBitsHuffman, setTotalBitsHuffman] = useState<number>(0)
  const [totalBitsRegular, setTotalBitsRegular] = useState<number>(0)
  const [savingPercentage, setSavingPercentage] = useState<number>(0)
  const [explanation, setExplanation] = useState<string>("")
  const [showFinalTree, setShowFinalTree] = useState<boolean>(false)

  // Función para calcular la frecuencia de cada símbolo en el texto
  const calculateFrequencies = (text: string): Map<string, number> => {
    const frequencies = new Map<string, number>()

    // Convertir a mayúsculas y mantener guiones bajos
    const cleanText = text.toUpperCase()

    for (const char of cleanText) {
      frequencies.set(char, (frequencies.get(char) || 0) + 1)
    }

    return frequencies
  }

  // Función para crear un nodo de Huffman
  const createNode = (symbol: string | null, frequency: number, originalIndex = 0): HuffmanNode => {
    return {
      symbol,
      frequency,
      left: null,
      right: null,
      isLeaf: symbol !== null,
      id: `node-${symbol || "internal"}-${Math.random().toString(36).substring(2, 9)}`,
      x: 0,
      y: 0,
      originalIndex,
    }
  }

  // Función para construir el árbol de Huffman paso a paso
  const buildHuffmanTree = (
    frequencies: Map<string, number>,
    totalChars: number,
  ): { tree: HuffmanNode | null; steps: BuildStep[] } => {
    if (frequencies.size === 0) return { tree: null, steps: [] }

    // Crear nodos hoja para cada símbolo
    let index = 0
    const nodes: HuffmanNode[] = Array.from(frequencies.entries()).map(([symbol, freq]) => {
      return createNode(symbol, freq, index++)
    })

    // Ordenar nodos por frecuencia (mayor a menor) y en caso de empate por orden original
    nodes.sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency
      }
      return (a.originalIndex || 0) - (b.originalIndex || 0)
    })

    const steps: BuildStep[] = []

    // Generar tabla de frecuencias inicial
    let initialTable = "Tabla de frecuencias inicial:\n\n"
    nodes.forEach((node) => {
      initialTable += `${node.symbol} = ${node.frequency}/${totalChars}\n`
    })

    // Paso inicial: mostrar todos los nodos ordenados por frecuencia
    steps.push({
      description: "Nodos iniciales ordenados por frecuencia (mayor a menor)",
      nodes: [...nodes],
      frequencyTable: initialTable,
    })

    // Copia de los nodos para construir el árbol
    const workingNodes = [...nodes].reverse() // Invertimos para trabajar de menor a mayor frecuencia

    // Construir el árbol
    while (workingNodes.length > 1) {
      // Tomar los dos nodos con menor frecuencia
      const left = workingNodes.shift()!
      const right = workingNodes.shift()!

      // Crear un nuevo nodo interno con la suma de frecuencias
      const parent = createNode(null, left.frequency + right.frequency)
      parent.left = left
      parent.right = right

      // Insertar el nuevo nodo en la posición correcta (ordenado por frecuencia)
      // Si la frecuencia agrupada coincide con otra, colocar en la parte superior de esa frecuencia
      let insertIndex = 0
      while (insertIndex < workingNodes.length && workingNodes[insertIndex].frequency < parent.frequency) {
        insertIndex++
      }

      workingNodes.splice(insertIndex, 0, parent)

      // Generar tabla de frecuencias actualizada
      const leftSymbol = left.symbol || getNodeSymbols(left)
      const rightSymbol = right.symbol || getNodeSymbols(right)

      // Determinar si necesitamos paréntesis para los símbolos
      const needsLeftParenthesis = !left.symbol && left.left && left.right
      const needsRightParenthesis = !right.symbol && right.left && right.right

      const formattedLeft = needsLeftParenthesis ? `(${leftSymbol})` : leftSymbol
      const formattedRight = needsRightParenthesis ? `(${rightSymbol})` : rightSymbol

      let updatedTable = `Paso: Agrupar ${formattedLeft}+${formattedRight} = ${parent.frequency}/${totalChars}\n\n`
      updatedTable += "Tabla actualizada:\n"

      // Ordenar para mostrar de mayor a menor
      const sortedForDisplay = [...workingNodes].sort((a, b) => b.frequency - a.frequency)
      sortedForDisplay.forEach((node) => {
        if (node.symbol) {
          updatedTable += `${node.symbol} = ${node.frequency}/${totalChars}\n`
        } else {
          // Para nodos internos, mostrar la agrupación con paréntesis apropiados
          const symbols = getNodeSymbols(node)
          updatedTable += `${symbols} = ${node.frequency}/${totalChars}\n`
        }
      })

      // Registrar este paso
      steps.push({
        description: `Combinando nodos: ${left.symbol || getNodeSymbols(left)} (${left.frequency}/${totalChars}) y ${right.symbol || getNodeSymbols(right)} (${right.frequency}/${totalChars}) → Nuevo nodo: (${parent.frequency}/${totalChars})`,
        nodes: [...workingNodes],
        mergedNodes: { left, right, parent },
        frequencyTable: updatedTable,
      })
    }

    // El árbol final es el único nodo que queda
    const tree = workingNodes.length > 0 ? workingNodes[0] : null

    return { tree, steps }
  }

  // Función para obtener los símbolos de un nodo interno
  const getNodeSymbols = (node: HuffmanNode): string => {
    if (node.symbol) return node.symbol

    // Si es un nodo interno, necesitamos mostrar la agrupación con paréntesis
    if (node.left && node.right) {
      const leftSymbol = node.left.symbol || getNodeSymbols(node.left)
      const rightSymbol = node.right.symbol || getNodeSymbols(node.right)

      // Si alguno de los hijos ya es una agrupación, mantener sus paréntesis
      const needsLeftParenthesis = !node.left.symbol && node.left.left && node.left.right
      const needsRightParenthesis = !node.right.symbol && node.right.left && node.right.right

      const formattedLeft = needsLeftParenthesis ? `(${leftSymbol})` : leftSymbol
      const formattedRight = needsRightParenthesis ? `(${rightSymbol})` : rightSymbol

      return `${formattedLeft}+${formattedRight}`
    }

    return "nodo"
  }

  // Función para generar los códigos de Huffman recorriendo el árbol
  const generateHuffmanCodes = (root: HuffmanNode | null): Map<string, string> => {
    const codes = new Map<string, string>()

    const traverse = (node: HuffmanNode | null, code: string) => {
      if (!node) return

      // Si es un nodo hoja, guardar el código
      if (node.isLeaf && node.symbol) {
        codes.set(node.symbol, code)
      }

      // Recorrer subárbol izquierdo (0)
      traverse(node.left, code + "0")

      // Recorrer subárbol derecho (1)
      traverse(node.right, code + "1")
    }

    traverse(root, "")
    return codes
  }

  // Función para calcular las posiciones de los nodos para visualización
  const calculateNodePositions = (root: HuffmanNode | null): void => {
    if (!root) return

    const levelWidth = 80
    const levelHeight = 70

    // Calcular la profundidad del árbol
    const getDepth = (node: HuffmanNode | null): number => {
      if (!node) return 0
      return 1 + Math.max(getDepth(node.left), getDepth(node.right))
    }

    const depth = getDepth(root)

    // Calcular posiciones
    const setPositions = (node: HuffmanNode | null, level: number, left: number, right: number) => {
      if (!node) return

      const x = (left + right) / 2

      node.x = x * levelWidth
      node.y = level * levelHeight

      // Calcular posiciones para los hijos
      if (node.left) {
        setPositions(node.left, level + 1, left, x)
      }

      if (node.right) {
        setPositions(node.right, level + 1, x, right)
      }
    }

    setPositions(root, 0, 0, Math.pow(2, depth))
  }

  // Función para procesar el texto de entrada
  const processInput = () => {
    if (!inputText.trim()) {
      setExplanation("Por favor ingrese un texto para analizar")
      return
    }

    // Calcular frecuencias
    const frequencies = calculateFrequencies(inputText)
    setFrequencyMap(frequencies)

    // Calcular total de caracteres
    const totalChars = Array.from(frequencies.values()).reduce((sum, freq) => sum + freq, 0)

    // Construir árbol de Huffman
    const { tree, steps } = buildHuffmanTree(frequencies, totalChars)
    setHuffmanTree(tree)
    setBuildSteps(steps)

    // Calcular posiciones para visualización
    if (tree) {
      calculateNodePositions(tree)
    }

    // Generar códigos
    const codes = generateHuffmanCodes(tree)

    // Crear tabla de codificación
    const table: CodeTableEntry[] = []
    let totalBits = 0

    for (const [symbol, frequency] of frequencies.entries()) {
      const code = codes.get(symbol) || ""
      const bitsForSymbol = code.length * frequency
      totalBits += bitsForSymbol

      table.push({
        symbol,
        frequency,
        code,
        totalBits: bitsForSymbol,
      })
    }

    // Ordenar tabla por frecuencia (mayor a menor)
    table.sort((a, b) => b.frequency - a.frequency)

    setCodeTable(table)
    setTotalBitsHuffman(totalBits)

    // Calcular bits sin compresión (5 bits por símbolo)
    const regularBits = inputText.length * 5
    setTotalBitsRegular(regularBits)

    // Calcular porcentaje de ahorro
    const saving = ((regularBits - totalBits) / regularBits) * 100
    setSavingPercentage(saving)

    // Iniciar visualización paso a paso
    setCurrentStepIndex(0)
    setExplanation("Análisis completado. Utilice los controles para ver la construcción paso a paso.")
    setShowFinalTree(false)
  }

  // Función para copiar un código al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setExplanation(`Código "${text}" copiado al portapapeles`)
  }

  // Funciones para controlar la visualización paso a paso
  const goToNextStep = () => {
    if (currentStepIndex < buildSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      setExplanation(buildSteps[currentStepIndex + 1].description)
    } else if (currentStepIndex === buildSteps.length - 1 && !showFinalTree) {
      setShowFinalTree(true)
      setExplanation("Árbol de Huffman completo construido")
    }
  }

  const goToPrevStep = () => {
    if (showFinalTree) {
      setShowFinalTree(false)
      setExplanation(buildSteps[currentStepIndex].description)
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
      setExplanation(buildSteps[currentStepIndex - 1].description)
    }
  }

  const resetVisualization = () => {
    setCurrentStepIndex(0)
    setShowFinalTree(false)
    if (buildSteps.length > 0) {
      setExplanation(buildSteps[0].description)
    }
  }

  // Función para alternar reproducción automática
  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  // Efecto para reproducción automática
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isAutoPlaying) {
      if (currentStepIndex < buildSteps.length - 1) {
        timer = setTimeout(() => {
          goToNextStep()
        }, 1500) // Avanzar cada 1.5 segundos
      } else if (currentStepIndex === buildSteps.length - 1 && !showFinalTree) {
        timer = setTimeout(() => {
          setShowFinalTree(true)
          setExplanation("Árbol de Huffman completo construido")
        }, 1500)
      } else {
        setIsAutoPlaying(false)
      }
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isAutoPlaying, currentStepIndex, buildSteps.length, showFinalTree])

  // Renderizar conexiones entre nodos
  const renderConnections = (node: HuffmanNode | null) => {
    if (!node) return []

    const connections: JSX.Element[] = []

    const traverse = (n: HuffmanNode | null) => {
      if (!n) return

      if (n.left) {
        connections.push(
          <g key={`${n.id}-${n.left.id}`}>
            <line
              x1={n.x + 25}
              y1={n.y + 25}
              x2={n.left.x + 25}
              y2={n.left.y + 25}
              stroke="#2E2E2E"
              strokeWidth="1.5"
            />
            <text
              x={(n.x + n.left.x) / 2 + 25}
              y={(n.y + n.left.y) / 2 + 20}
              textAnchor="middle"
              className="text-xs fill-carbon"
            >
              0
            </text>
          </g>,
        )
        traverse(n.left)
      }

      if (n.right) {
        connections.push(
          <g key={`${n.id}-${n.right.id}`}>
            <line
              x1={n.x + 25}
              y1={n.y + 25}
              x2={n.right.x + 25}
              y2={n.right.y + 25}
              stroke="#2E2E2E"
              strokeWidth="1.5"
            />
            <text
              x={(n.x + n.right.x) / 2 + 25}
              y={(n.y + n.right.y) / 2 + 20}
              textAnchor="middle"
              className="text-xs fill-carbon"
            >
              1
            </text>
          </g>,
        )
        traverse(n.right)
      }
    }

    traverse(node)
    return connections
  }

  // Renderizar nodos del árbol
  const renderNodes = (node: HuffmanNode | null) => {
    if (!node) return []

    const nodes: JSX.Element[] = []

    const traverse = (n: HuffmanNode | null) => {
      if (!n) return

      nodes.push(
        <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
          <circle cx="25" cy="25" r="25" className="fill-white stroke-slate/20" strokeWidth="1.5" />
          <text x="25" y="20" textAnchor="middle" className="text-sm font-medium fill-carbon">
            {n.symbol || ""}
          </text>
          <text x="25" y="35" textAnchor="middle" className="text-xs fill-carbon/70">
            {n.frequency}
          </text>
        </g>,
      )

      traverse(n.left)
      traverse(n.right)
    }

    traverse(node)
    return nodes
  }

  // Renderizar conexiones entre nodos para pasos intermedios
  const renderStepConnections = (nodes: HuffmanNode[]) => {
    const connections = []

    for (const node of nodes) {
      if (node.left) {
        const leftNode = findNodeById(nodes, node.left.id)
        if (leftNode) {
          connections.push(
            <g key={`${node.id}-${leftNode.id}`}>
              <line
                x1={node.x + 25}
                y1={node.y + 25}
                x2={leftNode.x + 25}
                y2={leftNode.y + 25}
                stroke="#2E2E2E"
                strokeWidth="1.5"
              />
              <text
                x={(node.x + leftNode.x) / 2 + 25}
                y={(node.y + leftNode.y) / 2 + 20}
                textAnchor="middle"
                className="text-xs fill-carbon"
              >
                0
              </text>
            </g>,
          )
        }
      }

      if (node.right) {
        const rightNode = findNodeById(nodes, node.right.id)
        if (rightNode) {
          connections.push(
            <g key={`${node.id}-${rightNode.id}`}>
              <line
                x1={node.x + 25}
                y1={node.y + 25}
                x2={rightNode.x + 25}
                y2={rightNode.y + 25}
                stroke="#2E2E2E"
                strokeWidth="1.5"
              />
              <text
                x={(node.x + rightNode.x) / 2 + 25}
                y={(node.y + rightNode.y) / 2 + 20}
                textAnchor="middle"
                className="text-xs fill-carbon"
              >
                1
              </text>
            </g>,
          )
        }
      }
    }

    return connections
  }

  // Función auxiliar para encontrar un nodo por ID
  const findNodeById = (nodes: HuffmanNode[], id: string): HuffmanNode | undefined => {
    return nodes.find((n) => n.id === id)
  }

  // Renderizar nodos del árbol para pasos intermedios
  const renderStepNodes = (nodes: HuffmanNode[]) => {
    return nodes.map((node) => {
      // Determinar si este nodo está involucrado en la fusión actual
      const isMerged =
        buildSteps[currentStepIndex]?.mergedNodes &&
        (node.id === buildSteps[currentStepIndex].mergedNodes?.parent.id ||
          node.id === buildSteps[currentStepIndex].mergedNodes?.left.id ||
          node.id === buildSteps[currentStepIndex].mergedNodes?.right.id)

      return (
        <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
          <circle
            cx="25"
            cy="25"
            r="25"
            className={`
              ${isMerged ? "fill-petroleo stroke-white" : "fill-white stroke-slate/20"}
              ${node.isHighlighted ? "fill-slate stroke-white" : ""}
            `}
            strokeWidth="1.5"
          />
          <text
            x="25"
            y="20"
            textAnchor="middle"
            className={`text-sm font-medium ${isMerged ? "fill-white" : "fill-carbon"}`}
          >
            {node.symbol || ""}
          </text>
          <text x="25" y="35" textAnchor="middle" className={`text-xs ${isMerged ? "fill-white" : "fill-carbon/70"}`}>
            {node.frequency}
          </text>
        </g>
      )
    })
  }

  // Renderizar el árbol
  const renderTree = (): JSX.Element => {
    if (currentStepIndex < 0 || buildSteps.length === 0) {
      return <div className="text-center p-4">Ingrese un texto para generar el árbol</div>
    }

    if (showFinalTree && huffmanTree) {
      // Calcular dimensiones del SVG basado en los nodos
      const getMaxDimensions = (node: HuffmanNode | null): { maxX: number; maxY: number } => {
        if (!node) return { maxX: 0, maxY: 0 }

        const leftDims = getMaxDimensions(node.left)
        const rightDims = getMaxDimensions(node.right)

        return {
          maxX: Math.max(node.x, leftDims.maxX, rightDims.maxX),
          maxY: Math.max(node.y, leftDims.maxY, rightDims.maxY),
        }
      }

      const { maxX, maxY } = getMaxDimensions(huffmanTree)

      return (
        <div className="overflow-auto border rounded-lg p-2 bg-white">
          <h3 className="text-center font-medium mb-2">Árbol de Huffman Final</h3>
          <svg width={maxX + 150} height={maxY + 100}>
            {renderConnections(huffmanTree)}
            {renderNodes(huffmanTree)}
          </svg>
        </div>
      )
    } else {
      const currentStep = buildSteps[currentStepIndex]
      const nodes = currentStep.nodes

      // Calcular posiciones para los nodos de este paso
      nodes.forEach((node, index) => {
        node.x = index * 80
        node.y = 50
      })

      // Calcular dimensiones del SVG basado en los nodos
      const maxX = Math.max(...nodes.map((n) => n.x)) + 100
      const maxY = Math.max(...nodes.map((n) => n.y)) + 100

      return (
        <div className="overflow-auto border rounded-lg p-2 bg-white">
          <h3 className="text-center font-medium mb-2">Construcción Paso a Paso</h3>
          <svg width={maxX} height={maxY}>
            {renderStepConnections(nodes)}
            {renderStepNodes(nodes)}
          </svg>
        </div>
      )
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Árboles de Huffman</CardTitle>
          <CardDescription>
            Visualización paso a paso de la construcción de un árbol de Huffman y su tabla de codificación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Formulario de entrada */}
            <div className="space-y-2">
              <Label htmlFor="input-text">Texto a codificar</Label>
              <div className="flex gap-2">
                <Input
                  id="input-text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ej: EL_REY_DE_CONSTANTINOPLA"
                  className="flex-1"
                />
                <Button onClick={processInput}>Procesar</Button>
              </div>
              <p className="text-xs text-slate-500">
                Ingrese un texto para generar su árbol de Huffman y tabla de codificación.
              </p>
            </div>

            {/* Visualización del árbol */}
            <div className="border rounded-lg p-4 bg-marfil/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Construcción del Árbol de Huffman</h3>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={goToPrevStep}
                          disabled={currentStepIndex <= 0 && !showFinalTree}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Paso anterior</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={toggleAutoPlay} variant="outline" size="sm">
                          {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isAutoPlaying ? "Pausar reproducción" : "Reproducción automática"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={goToNextStep}
                          disabled={currentStepIndex >= buildSteps.length - 1 && showFinalTree}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Paso siguiente</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={resetVisualization} variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reiniciar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Paso actual */}
              {currentStepIndex >= 0 && buildSteps.length > 0 && (
                <div className="mb-4 p-3 bg-petroleo/10 rounded-md text-sm">
                  <p>
                    <strong>
                      {showFinalTree ? "Árbol Final" : `Paso ${currentStepIndex + 1} de ${buildSteps.length}`}:
                    </strong>{" "}
                    {showFinalTree ? "Árbol de Huffman completo construido" : buildSteps[currentStepIndex].description}
                  </p>
                </div>
              )}

              {/* Árbol */}
              <div className="h-[300px] overflow-auto">{renderTree()}</div>

              {/* Tabla de frecuencias paso a paso */}
              {currentStepIndex >= 0 && buildSteps.length > 0 && (
                <div className="mt-4 p-3 bg-slate/10 rounded-md">
                  <h4 className="font-medium mb-2">Generación paso a paso del árbol de Huffman:</h4>
                  <pre className="text-xs whitespace-pre-wrap">
                    {showFinalTree
                      ? "Árbol de Huffman completado. Ahora puede asignar códigos recorriendo el árbol (0 para izquierda, 1 para derecha)."
                      : buildSteps[currentStepIndex].frequencyTable}
                  </pre>
                </div>
              )}

              {/* Explicación */}
              {explanation && !buildSteps[currentStepIndex]?.frequencyTable && (
                <div className="mt-4 p-3 bg-slate/10 rounded-md text-sm">{explanation}</div>
              )}
            </div>

            {/* Tabla de codificación */}
            {codeTable.length > 0 && (
              <div className="border rounded-lg p-4 bg-white">
                <h3 className="text-sm font-medium mb-3">Tabla de Codificación</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border p-2 text-left">Símbolo</th>
                        <th className="border p-2 text-left">Frecuencia</th>
                        <th className="border p-2 text-left">Código Huffman</th>
                        <th className="border p-2 text-left">Bits Totales</th>
                        <th className="border p-2 text-left">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codeTable.map((entry) => (
                        <tr key={entry.symbol} className="hover:bg-slate-50">
                          <td className="border p-2">{entry.symbol}</td>
                          <td className="border p-2">{entry.frequency}</td>
                          <td className="border p-2 font-mono">{entry.code}</td>
                          <td className="border p-2">{entry.totalBits}</td>
                          <td className="border p-2">
                            <Button onClick={() => copyToClipboard(entry.code)} variant="ghost" size="sm">
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Estadísticas */}
            {totalBitsHuffman > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="text-sm font-medium mb-2">Bits con Huffman</h3>
                  <p className="text-2xl font-bold">{totalBitsHuffman}</p>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="text-sm font-medium mb-2">Bits sin Huffman (5 bits/símbolo)</h3>
                  <p className="text-2xl font-bold">{totalBitsRegular}</p>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="text-sm font-medium mb-2">Ahorro de espacio</h3>
                  <p className="text-2xl font-bold text-green-600">{savingPercentage.toFixed(2)}%</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
