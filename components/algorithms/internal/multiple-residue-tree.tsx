"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TreeNode {
  label: string
  level: number
  value: string | null
  children: TreeNode[]
  isHighlighted: boolean
  isFound: boolean
  x: number
  y: number
  id: string
  path: string
  isLeaf: boolean
}

interface DialogState {
  open: boolean
  title: string
  description: string
  type: "success" | "error" | "info"
}

interface SearchStep {
  nodeId: string
  level: number
  isTerminal: boolean
  description: string
}

interface InsertionStep {
  nodeId: string
  char: string
  bitGroup: string
  level: number
  isTerminal: boolean
  description: string
}

export function MultipleResidueTree() {
  const [root, setRoot] = useState<TreeNode | null>(null)
  const [nodes, setNodes] = useState<TreeNode[]>([])
  const [visibleNodes, setVisibleNodes] = useState<TreeNode[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [searchValue, setSearchValue] = useState<string | null>(null)
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([])
  const [insertionSteps, setInsertionSteps] = useState<InsertionStep[]>([])
  const [explanation, setExplanation] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [bitGroupSize, setBitGroupSize] = useState<number>(2)
  const [insertedWords, setInsertedWords] = useState<string[]>([])
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    type: "info",
  })
  const [binaryValues, setBinaryValues] = useState<
    { char: string; binary: string; decimal: number; groups: string[] }[]
  >([])
  const [isInserting, setIsInserting] = useState<boolean>(false)
  const [searchChar, setSearchChar] = useState<string>("")
  const [svgDimensions, setSvgDimensions] = useState({ width: 1200, height: 600 })

  // Inicializar con árbol vacío
  useEffect(() => {
    createEmptyStructure()
  }, [])

  useEffect(() => {
    // Filtrar los nodos vacíos que son hojas
    if (nodes.length > 0) {
      const filtered = nodes.filter((node) => {
        // Siempre mostrar la raíz
        if (node.level === 0) return true

        // Siempre mostrar nodos con valores
        if (node.value !== null) return true

        // Mostrar nodos internos (que tienen hijos)
        if (node.children.length > 0) return true

        // Ocultar nodos hoja sin valor
        return false
      })

      setVisibleNodes(filtered)
    } else {
      setVisibleNodes([])
    }
  }, [nodes])

  const createEmptyStructure = () => {
    const newRoot: TreeNode = {
      label: "RAIZ",
      level: 0,
      value: null,
      children: [],
      isHighlighted: false,
      isFound: false,
      x: 0,
      y: 0,
      id: `node-root-${Math.random().toString(36).substring(2, 9)}`,
      path: "",
      isLeaf: true,
    }

    setRoot(newRoot)
    setNodes([newRoot])
    setVisibleNodes([newRoot])
    setCurrentStep(-1)
    setSearchSteps([])
    setInsertionSteps([])
    setSearchValue(null)
    setExplanation("")
    setInsertedWords([])
    setBinaryValues([])
    setIsInserting(false)
    setSvgDimensions({ width: 1200, height: 600 })
  }

  // Función para crear un nuevo nodo
  const createNode = (label: string, level: number, path: string): TreeNode => {
    return {
      label,
      level,
      value: null,
      children: [],
      isHighlighted: false,
      isFound: false,
      x: 0,
      y: 0,
      id: `node-${label}-${level}-${Math.random().toString(36).substring(2, 9)}`,
      path,
      isLeaf: true,
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

  // Función para agrupar bits según el tamaño especificado
  const groupBits = (binary: string, groupSize: number): string[] => {
    const groups = []
    for (let i = 0; i < binary.length; i += groupSize) {
      groups.push(binary.substring(i, i + groupSize))
    }
    return groups
  }

  // Función para generar todas las combinaciones posibles para un nivel
  const generateCombinations = (length: number): string[] => {
    const combinations = []
    const total = Math.pow(2, length)
    for (let i = 0; i < total; i++) {
      combinations.push(i.toString(2).padStart(length, "0"))
    }
    return combinations
  }

  // Función para construir el árbol completo con todos los nodos posibles
  const buildCompleteTree = (word: string) => {
    if (!word || word.trim() === "" || bitGroupSize < 2) {
      return
    }

    word = word.toUpperCase()

    if (insertedWords.includes(word)) {
      setExplanation(`La palabra "${word}" ya existe en el árbol`)
      setDialogState({
        open: true,
        title: "Palabra duplicada",
        description: `La palabra "${word}" ya existe en el árbol.`,
        type: "error",
      })
      return
    }

    // Convertir cada carácter a su representación binaria
    const charBinaries: { char: string; binary: string; decimal: number; groups: string[] }[] = []
    for (let i = 0; i < word.length; i++) {
      const char = word[i]
      if (/[a-zA-ZñÑ]/.test(char)) {
        const decimal = charToDecimal(char)
        const binary = decimalToBinary(decimal)
        const groups = groupBits(binary, bitGroupSize)

        charBinaries.push({
          char: char.toUpperCase(),
          binary,
          decimal,
          groups,
        })
      }
    }

    setBinaryValues([
      ...binaryValues,
      ...charBinaries.filter((item) => !binaryValues.some((existing) => existing.char === item.char)),
    ])

    // Crear nuevo árbol
    const newRoot: TreeNode = {
      label: "RAIZ",
      level: 0,
      value: null,
      children: [],
      isHighlighted: false,
      isFound: false,
      x: 0,
      y: 0,
      id: `node-root-${Math.random().toString(36).substring(2, 9)}`,
      path: "",
      isLeaf: true,
    }

    const newNodes = [newRoot]

    // Determinar el número máximo de niveles necesarios
    const maxGroups = Math.max(...charBinaries.map((item) => item.groups.length))

    // Construir el árbol completo nivel por nivel
    const buildLevel = (parentNode: TreeNode, level: number, currentPath: string) => {
      if (level > maxGroups) return

      // Determinar el tamaño del grupo para este nivel
      let groupSizeForLevel = bitGroupSize
      for (const charBinary of charBinaries) {
        if (level - 1 < charBinary.groups.length) {
          groupSizeForLevel = charBinary.groups[level - 1].length
          break
        }
      }

      const combinations = generateCombinations(groupSizeForLevel)

      for (const combination of combinations) {
        const childNode = createNode(combination, level, currentPath + combination)
        parentNode.children.push(childNode)
        parentNode.isLeaf = false // Si tiene hijos, ya no es hoja
        newNodes.push(childNode)

        // Continuar construyendo niveles hijos
        buildLevel(childNode, level + 1, currentPath + combination)
      }
    }

    // Construir todos los niveles
    buildLevel(newRoot, 1, "")

    // Ahora asignar las letras a sus nodos correspondientes
    const steps: InsertionStep[] = []
    steps.push({
      nodeId: newRoot.id,
      char: "",
      bitGroup: "",
      level: 0,
      isTerminal: false,
      description: `Iniciando inserción de la palabra "${word}" con agrupamiento de ${bitGroupSize} bits`,
    })

    for (const charBinary of charBinaries) {
      const { char, groups } = charBinary

      steps.push({
        nodeId: newRoot.id,
        char,
        bitGroup: "",
        level: 0,
        isTerminal: false,
        description: `Procesando carácter "${char}" - Grupos: [${groups.join(", ")}]`,
      })

      // Construir el path completo concatenando todos los grupos
      const fullPath = groups.join("")

      // Buscar el nodo correspondiente
      let targetNode: TreeNode | null = null
      for (const node of newNodes) {
        if (node.path === fullPath && node.level === groups.length) {
          targetNode = node
          break
        }
      }

      if (targetNode) {
        targetNode.value = char

        steps.push({
          nodeId: targetNode.id,
          char,
          bitGroup: fullPath,
          level: groups.length,
          isTerminal: true,
          description: `Asignando "${char}" al nodo con path [${groups.join(" → ")}]`,
        })
      }
    }

    setRoot(newRoot)
    setNodes(newNodes)
    calculateNodePositions(newNodes)
    setInsertedWords([...insertedWords, word])
    setInsertionSteps(steps)
    setCurrentStep(-1)
    setIsInserting(true)
    setExplanation(`Preparando inserción de la palabra "${word}" en el árbol de residuos múltiples`)
  }

  // Función para calcular posiciones de los nodos para visualización
  const calculateNodePositions = (nodes: TreeNode[]) => {
    if (!root) return

    const levelHeight = 80
    const nodeWidth = 60

    // Agrupar nodos visibles por nivel
    const nodesByLevel: Record<number, TreeNode[]> = {}

    // Solo trabajamos con nodos visibles para el cálculo de posiciones
    const visibleNodesForCalculation = nodes.filter((node) => {
      // Siempre mostrar la raíz
      if (node.level === 0) return true

      // Siempre mostrar nodos con valores
      if (node.value !== null) return true

      // Mostrar nodos internos (que tienen hijos)
      if (node.children.length > 0) return true

      // Ocultar nodos hoja sin valor
      return false
    })

    for (const node of visibleNodesForCalculation) {
      if (!nodesByLevel[node.level]) {
        nodesByLevel[node.level] = []
      }
      nodesByLevel[node.level].push(node)
    }

    // Calcular el ancho máximo necesario
    let maxNodesInLevel = 0
    for (const level in nodesByLevel) {
      maxNodesInLevel = Math.max(maxNodesInLevel, nodesByLevel[level].length)
    }

    // Calcular dimensiones del SVG
    const svgWidth = Math.max(1200, maxNodesInLevel * nodeWidth + 200)
    const svgHeight = Math.max(600, Object.keys(nodesByLevel).length * levelHeight + 100)
    setSvgDimensions({ width: svgWidth, height: svgHeight })

    // Asignar posiciones para cada nivel
    const levels = Object.keys(nodesByLevel).map(Number)
    for (const level of levels) {
      const levelNodes = nodesByLevel[level]
      const totalWidth = levelNodes.length * nodeWidth

      // Distribuir nodos en este nivel de forma centrada
      const startX = (svgWidth - totalWidth) / 2

      for (let i = 0; i < levelNodes.length; i++) {
        levelNodes[i].x = startX + i * nodeWidth
        levelNodes[i].y = level * levelHeight + 50
      }
    }
  }

  // Función para insertar una palabra en el árbol
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

    if (bitGroupSize < 2) {
      setExplanation("El agrupamiento de bits debe ser mayor o igual a 2")
      setDialogState({
        open: true,
        title: "Agrupamiento inválido",
        description: "El agrupamiento de bits debe ser mayor o igual a 2.",
        type: "error",
      })
      return
    }

    buildCompleteTree(word)
  }

  // Función para buscar un carácter en el árbol
  const searchElement = (char: string) => {
    if (!char || char.trim() === "") {
      setExplanation("Por favor ingrese un carácter válido")
      setDialogState({
        open: true,
        title: "Carácter inválido",
        description: "Por favor ingrese un carácter válido.",
        type: "error",
      })
      return
    }

    if (!root) {
      setExplanation("El árbol está vacío")
      setDialogState({
        open: true,
        title: "Árbol vacío",
        description: "El árbol está vacío. Inserte una palabra primero.",
        type: "error",
      })
      return
    }

    char = char.toUpperCase()
    setSearchValue(char)

    // Resetear estados previos
    const resetNodes = nodes.map((node) => ({
      ...node,
      isHighlighted: false,
      isFound: false,
    }))

    setNodes(resetNodes)

    // Buscar el carácter en los nodos
    let found = false
    let foundNode: TreeNode | null = null

    for (const node of nodes) {
      if (node.value === char) {
        found = true
        foundNode = node
        break
      }
    }

    if (found && foundNode) {
      const newNodes = nodes.map((node) => ({
        ...node,
        isHighlighted: node.id === foundNode!.id,
        isFound: node.id === foundNode!.id,
      }))

      setNodes(newNodes)
      setExplanation(`¡Carácter "${char}" encontrado en el árbol!`)
      setDialogState({
        open: true,
        title: "Carácter encontrado",
        description: `¡El carácter "${char}" ha sido encontrado en el árbol!`,
        type: "success",
      })
    } else {
      setExplanation(`Carácter "${char}" no encontrado en el árbol`)
      setDialogState({
        open: true,
        title: "Carácter no encontrado",
        description: `El carácter "${char}" no existe en el árbol.`,
        type: "error",
      })
    }

    setIsInserting(false)
    setCurrentStep(-1)
  }

  // Función para eliminar un carácter del árbol
  const deleteElement = (char: string) => {
    if (!char || char.trim() === "") {
      setExplanation("Por favor ingrese un carácter válido")
      setDialogState({
        open: true,
        title: "Carácter inválido",
        description: "Por favor ingrese un carácter válido.",
        type: "error",
      })
      return
    }

    if (!root) {
      setExplanation("El árbol está vacío")
      setDialogState({
        open: true,
        title: "Árbol vacío",
        description: "El árbol está vacío. No hay nada que eliminar.",
        type: "error",
      })
      return
    }

    char = char.toUpperCase()

    // Buscar y eliminar el carácter
    let deleted = false
    const newNodes = nodes.map((node) => {
      if (node.value === char) {
        deleted = true
        return { ...node, value: null }
      }
      return node
    })

    if (deleted) {
      setNodes(newNodes)

      // Actualizar la lista de palabras insertadas
      const updatedWords = insertedWords.filter((word) => !word.includes(char))
      setInsertedWords(updatedWords)

      setExplanation(`Carácter "${char}" eliminado del árbol`)
      setDialogState({
        open: true,
        title: "Carácter eliminado",
        description: `El carácter "${char}" ha sido eliminado del árbol.`,
        type: "success",
      })
    } else {
      setExplanation(`Carácter "${char}" no encontrado en el árbol`)
      setDialogState({
        open: true,
        title: "Carácter no encontrado",
        description: `El carácter "${char}" no existe en el árbol.`,
        type: "error",
      })
    }
  }

  const nextStep = () => {
    if (isInserting) {
      if (currentStep < insertionSteps.length - 1) {
        const nextStepIndex = currentStep + 1
        const step = insertionSteps[nextStepIndex]

        // Actualizar visualización
        const newNodes = nodes.map((node) => ({
          ...node,
          isHighlighted: node.id === step.nodeId,
          isFound: node.id === step.nodeId && step.isTerminal,
        }))

        setNodes(newNodes)
        setCurrentStep(nextStepIndex)

        // Actualizar explicación
        setExplanation(step.description)
      }
    } else {
      if (currentStep < searchSteps.length - 1) {
        const nextStepIndex = currentStep + 1
        const step = searchSteps[nextStepIndex]

        // Actualizar visualización
        const newNodes = nodes.map((node) => ({
          ...node,
          isHighlighted: node.id === step.nodeId,
          isFound: node.id === step.nodeId && step.isTerminal,
        }))

        setNodes(newNodes)
        setCurrentStep(nextStepIndex)

        // Actualizar explicación
        setExplanation(step.description)

        // Mostrar diálogo si es el último paso y se encontró el carácter
        if (nextStepIndex === searchSteps.length - 1 && step.isTerminal) {
          setDialogState({
            open: true,
            title: "Carácter encontrado",
            description: `¡El carácter "${searchValue}" ha sido encontrado en el árbol!`,
            type: "success",
          })
        } else if (nextStepIndex === searchSteps.length - 1 && !step.isTerminal) {
          setDialogState({
            open: true,
            title: "Carácter no encontrado",
            description: `El carácter "${searchValue}" no existe en el árbol.`,
            type: "error",
          })
        }
      }
    }
  }

  const prevStep = () => {
    if (isInserting) {
      if (currentStep > 0) {
        const prevStepIndex = currentStep - 1
        const step = insertionSteps[prevStepIndex]

        // Actualizar visualización
        const newNodes = nodes.map((node) => ({
          ...node,
          isHighlighted: node.id === step.nodeId,
          isFound: false,
        }))

        setNodes(newNodes)
        setCurrentStep(prevStepIndex)

        // Actualizar explicación
        setExplanation(step.description)
      } else if (currentStep === 0) {
        // Volver al estado inicial
        const resetNodes = nodes.map((node) => ({
          ...node,
          isHighlighted: false,
          isFound: false,
        }))

        setNodes(resetNodes)
        setCurrentStep(-1)
        setExplanation(`Preparando inserción en el árbol de residuos múltiples`)
      }
    } else {
      if (currentStep > 0) {
        const prevStepIndex = currentStep - 1
        const step = searchSteps[prevStepIndex]

        // Actualizar visualización
        const newNodes = nodes.map((node) => ({
          ...node,
          isHighlighted: node.id === step.nodeId,
          isFound: false,
        }))

        setNodes(newNodes)
        setCurrentStep(prevStepIndex)

        // Actualizar explicación
        setExplanation(step.description)
      } else if (currentStep === 0) {
        // Volver al estado inicial
        const resetNodes = nodes.map((node) => ({
          ...node,
          isHighlighted: false,
          isFound: false,
        }))

        setNodes(resetNodes)
        setCurrentStep(-1)
        setExplanation(`Iniciando búsqueda del carácter "${searchValue}"`)
      }
    }
  }

  const resetSearch = () => {
    // Resetear la visualización
    const resetNodes = nodes.map((node) => ({
      ...node,
      isHighlighted: false,
      isFound: false,
    }))

    setNodes(resetNodes)
    setCurrentStep(-1)
    setExplanation("")
  }

  const goToFinalStep = () => {
    if (isInserting && insertionSteps.length > 0) {
      const lastStepIndex = insertionSteps.length - 1
      const step = insertionSteps[lastStepIndex]

      const newNodes = nodes.map((node) => ({
        ...node,
        isHighlighted: node.id === step.nodeId,
        isFound: node.id === step.nodeId && step.isTerminal,
      }))

      setNodes(newNodes)
      setCurrentStep(lastStepIndex)
      setExplanation(step.description)
    }
  }

  const saveStructure = () => {
    // Simulación de guardado
    setExplanation("Estructura guardada correctamente")
    setDialogState({
      open: true,
      title: "Estructura guardada",
      description: "La estructura ha sido guardada correctamente.",
      type: "success",
    })
  }

  const clearSearch = () => {
    const resetNodes = nodes.map((node) => ({
      ...node,
      isHighlighted: false,
      isFound: false,
    }))
    setNodes(resetNodes)
    setSearchValue(null)
    setExplanation("")
  }

  // Renderizar conexiones entre nodos
  const renderConnections = () => {
    const connections = []

    // Mapear nodos por ID para búsqueda rápida
    const nodeMap = new Map<string, TreeNode>()
    visibleNodes.forEach((node) => {
      nodeMap.set(node.id, node)
    })

    for (const node of visibleNodes) {
      for (const childNode of node.children) {
        // Verificar si el hijo es visible antes de dibujar la conexión
        if (nodeMap.has(childNode.id)) {
          const visibleChild = nodeMap.get(childNode.id)!
          connections.push(
            <g key={`${node.id}-${childNode.id}`}>
              <line
                x1={node.x + 20}
                y1={node.y + 20}
                x2={visibleChild.x + 20}
                y2={visibleChild.y + 20}
                stroke="#2E2E2E"
                strokeWidth="1.5"
              />
              <text
                x={(node.x + visibleChild.x) / 2 + 20}
                y={(node.y + visibleChild.y) / 2 + 15}
                textAnchor="middle"
                className="text-xs fill-carbon"
              >
                {visibleChild.label}
              </text>
            </g>,
          )
        }
      }
    }

    return connections
  }

  return (
    <div className="space-y-6">
      {dialogState.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{dialogState.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{dialogState.description}</p>
            <Button onClick={() => setDialogState({ ...dialogState, open: false })} className="w-full">
              Cerrar
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Árbol por Residuos Múltiples</CardTitle>
          <CardDescription>
            El árbol por residuos múltiples construye un árbol completo donde cada nivel representa todas las
            combinaciones posibles de bits según el agrupamiento especificado. Las letras se asignan a los nodos
            correspondientes según su representación binaria agrupada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Controles de entrada */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bit-group-size">
                  Agrupamiento de bits <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bit-group-size"
                  type="number"
                  min="2"
                  value={bitGroupSize}
                  onChange={(e) => setBitGroupSize(Number.parseInt(e.target.value) || 2)}
                  placeholder="Ej: 2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="word-input">Palabra a insertar</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="word-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ingrese una palabra"
                  />
                  <Button onClick={() => insertWord(inputValue)}>Insertar</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="char-input">Buscar letra</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="char-input"
                    value={searchChar}
                    onChange={(e) => setSearchChar(e.target.value.toUpperCase())}
                    placeholder="Letra"
                    maxLength={1}
                    className="w-24"
                  />
                  <Button onClick={() => searchElement(searchChar)}>Buscar</Button>
                  <Button variant="outline" onClick={clearSearch}>
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla de valores binarios */}
            {binaryValues.length > 0 && (
              <div className="border rounded-lg p-4 bg-marfil/50">
                <h3 className="text-sm font-medium mb-3">Tabla de valores binarios</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate/20">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-carbon/70 uppercase tracking-wider">
                          Carácter
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-carbon/70 uppercase tracking-wider">
                          Posición (decimal)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-carbon/70 uppercase tracking-wider">
                          Representación binaria
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-carbon/70 uppercase tracking-wider">
                          Grupos de bits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate/10">
                      {binaryValues.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-marfil/30"}>
                          <td className="px-4 py-2 whitespace-nowrap">{item.char}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{item.decimal}</td>
                          <td className="px-4 py-2 whitespace-nowrap font-mono">{item.binary}</td>
                          <td className="px-4 py-2 whitespace-nowrap font-mono">{item.groups.join(" ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Visualización del árbol */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Visualización del árbol</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={prevStep} disabled={currentStep <= -1}>
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextStep}
                    disabled={
                      (isInserting && currentStep >= insertionSteps.length - 1) ||
                      (!isInserting && currentStep >= searchSteps.length - 1)
                    }
                  >
                    Siguiente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFinalStep}
                    disabled={!isInserting || insertionSteps.length === 0}
                  >
                    Ver resultado final
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetSearch}>
                    Reiniciar
                  </Button>
                </div>
              </div>

              {/* Explicación del paso actual */}
              {explanation && <div className="mb-4 p-3 bg-marfil/50 rounded-lg text-sm">{explanation}</div>}

              {/* SVG para visualizar el árbol con scroll horizontal */}
              <div className="relative w-full overflow-x-auto overflow-y-auto max-h-[600px] border rounded">
                <svg width={svgDimensions.width} height={svgDimensions.height} className="min-w-full">
                  {/* Conexiones entre nodos */}
                  {renderConnections()}

                  {/* Nodos */}
                  {visibleNodes.map((node) => (
                    <g key={node.id}>
                      <circle
                        cx={node.x + 20}
                        cy={node.y + 20}
                        r={20}
                        fill={node.isFound ? "#4CAF50" : node.isHighlighted ? "#FFC107" : "#FFFFFF"}
                        stroke="#2E2E2E"
                        strokeWidth="2"
                      />
                      <text
                        x={node.x + 20}
                        y={node.y + 20}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-sm font-medium"
                      >
                        {node.value || node.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Lista de palabras insertadas */}
            {insertedWords.length > 0 && (
              <div className="border rounded-lg p-4 bg-marfil/50">
                <h3 className="text-sm font-medium mb-2">Palabras insertadas</h3>
                <div className="flex flex-wrap gap-2">
                  {insertedWords.map((word, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 bg-white rounded-full text-xs font-medium border border-slate/20"
                    >
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón para guardar estructura */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={saveStructure}>
                Guardar estructura
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
