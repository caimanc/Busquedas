"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResultDialog } from "@/components/result-dialog"
import { ChevronLeft, ChevronRight, RotateCcw, Save } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { JSX } from "react"

interface TreeNode {
  id: string
  letter: string | null // La letra almacenada en este nodo (null si es nodo intermedio)
  left: TreeNode | null // Rama para bit 0
  right: TreeNode | null // Rama para bit 1
  x: number
  y: number
  isHighlighted: boolean
  isFound: boolean
  level: number // Nivel en el árbol (profundidad)
}

interface DialogState {
  open: boolean
  title: string
  description: string
  type: "success" | "error" | "info"
}

interface InsertionStep {
  stepNumber: number
  letter: string
  binaryCode: string
  currentBit: number
  currentPath: string
  description: string
  nodeId: string | null
  action: "navigate" | "create" | "store"
}

export function DigitalSearchTree() {
  const [root, setRoot] = useState<TreeNode | null>(null)
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [insertionSteps, setInsertionSteps] = useState<InsertionStep[]>([])
  const [explanation, setExplanation] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    type: "info",
  })
  const [binaryTable, setBinaryTable] = useState<{ letter: string; binary: string; decimal: number }[]>([])
  const [searchValue, setSearchValue] = useState<string>("")

  // Inicializar con árbol vacío
  useEffect(() => {
    initializeTree()
  }, [])

  const initializeTree = () => {
    // Crear nodo raíz vacío
    const rootNode: TreeNode = {
      id: "root",
      letter: null,
      left: null,
      right: null,
      x: 400,
      y: 50,
      isHighlighted: false,
      isFound: false,
      level: 0,
    }
    setRoot(rootNode)
    setCurrentStep(-1)
    setInsertionSteps([])
    setExplanation("Árbol de búsqueda binaria inicializado con nodo raíz vacío")
    setBinaryTable([])
  }

  // Función para convertir un carácter a su valor decimal (posición en el alfabeto)
  const charToDecimal = (char: string): number => {
    const upperChar = char.toUpperCase()
    if (upperChar === "Ñ") return 27
    return upperChar.charCodeAt(0) - "A".charCodeAt(0) + 1
  }

  // Función para convertir un número decimal a binario con 5 bits
  const decimalToBinary = (decimal: number): string => {
    return decimal.toString(2).padStart(5, "0")
  }

  // Función para crear un nuevo nodo
  const createNode = (id: string, level: number): TreeNode => {
    return {
      id,
      letter: null,
      left: null,
      right: null,
      x: 0,
      y: 0,
      isHighlighted: false,
      isFound: false,
      level,
    }
  }

  // Función para insertar una letra en el árbol usando el algoritmo BST con bits
  const insertLetterInTree = (root: TreeNode, letter: string, binaryCode: string) => {
    let current = root
    let bitIndex = 0

    // Si la raíz está vacía, colocar la primera letra ahí
    if (!current.letter) {
      current.letter = letter
      return
    }

    // Navegar por el árbol usando los bits binarios
    while (true) {
      const bit = binaryCode[bitIndex]

      if (bit === "0") {
        // Ir a la izquierda
        if (!current.left) {
          // Crear nuevo nodo a la izquierda
          const nodePath = `${current.id}-L${bitIndex}`
          current.left = createNode(nodePath, current.level + 1)
          current.left.letter = letter
          break
        } else if (!current.left.letter) {
          // El nodo existe pero está vacío
          current.left.letter = letter
          break
        } else {
          // El nodo está ocupado, continuar navegando
          current = current.left
          bitIndex++
          if (bitIndex >= binaryCode.length) {
            // Si se acabaron los bits, no se puede insertar (caso muy raro)
            break
          }
        }
      } else {
        // Ir a la derecha
        if (!current.right) {
          // Crear nuevo nodo a la derecha
          const nodePath = `${current.id}-R${bitIndex}`
          current.right = createNode(nodePath, current.level + 1)
          current.right.letter = letter
          break
        } else if (!current.right.letter) {
          // El nodo existe pero está vacío
          current.right.letter = letter
          break
        } else {
          // El nodo está ocupado, continuar navegando
          current = current.right
          bitIndex++
          if (bitIndex >= binaryCode.length) {
            // Si se acabaron los bits, no se puede insertar (caso muy raro)
            break
          }
        }
      }
    }
  }

  // Función para calcular posiciones de los nodos con mejor distribución
  const calculatePositions = (root: TreeNode | null) => {
    if (!root) return

    // Función para contar nodos en cada nivel
    const countNodesAtLevel = (node: TreeNode | null, level: number, counts: number[]): void => {
      if (!node) return

      if (!counts[level]) counts[level] = 0
      counts[level]++

      countNodesAtLevel(node.left, level + 1, counts)
      countNodesAtLevel(node.right, level + 1, counts)
    }

    // Contar nodos por nivel
    const levelCounts: number[] = []
    countNodesAtLevel(root, 0, levelCounts)

    // Calcular el ancho necesario basado en el nivel con más nodos
    const maxNodesInLevel = Math.max(...levelCounts)
    const totalWidth = Math.max(800, maxNodesInLevel * 120)
    const levelHeight = 80

    // Función recursiva para asignar posiciones
    const assignPositions = (node: TreeNode | null, x: number, y: number, horizontalSpacing: number) => {
      if (!node) return

      node.x = x
      node.y = y

      const childSpacing = horizontalSpacing / 2.2 // Reducir un poco el espaciado

      if (node.left) {
        assignPositions(node.left, x - childSpacing, y + levelHeight, childSpacing)
      }
      if (node.right) {
        assignPositions(node.right, x + childSpacing, y + levelHeight, childSpacing)
      }
    }

    // Comenzar desde el centro con espaciado dinámico
    const initialSpacing = totalWidth / 4
    assignPositions(root, totalWidth / 2, 50, initialSpacing)
  }

  // Función para construir el árbol hasta el paso actual
  const buildTreeUpToStep = (stepIndex: number): TreeNode => {
    const rootNode: TreeNode = {
      id: "root",
      letter: null,
      left: null,
      right: null,
      x: 400,
      y: 50,
      isHighlighted: false,
      isFound: false,
      level: 0,
    }

    if (stepIndex < 0) return rootNode

    // Procesar todos los pasos hasta el índice actual
    for (let i = 0; i <= stepIndex; i++) {
      const step = insertionSteps[i]
      if (step.action === "store" && step.letter) {
        insertLetterInTree(rootNode, step.letter, step.binaryCode)
      }
    }

    // Calcular posiciones
    calculatePositions(rootNode)

    // Resaltar nodo actual
    if (stepIndex >= 0 && insertionSteps[stepIndex]) {
      const currentStep = insertionSteps[stepIndex]
      highlightNode(rootNode, currentStep.nodeId || "root")
    }

    return rootNode
  }

  // Función para resaltar un nodo
  const highlightNode = (node: TreeNode | null, nodeId: string) => {
    if (!node) return

    node.isHighlighted = node.id === nodeId
    highlightNode(node.left, nodeId)
    highlightNode(node.right, nodeId)
  }

  // Función para buscar una letra
  const searchLetter = (letter: string) => {
    if (!letter || !root) {
      setDialogState({
        open: true,
        title: "Búsqueda inválida",
        description: "Por favor ingrese una letra válida y asegúrese de que el árbol esté construido.",
        type: "error",
      })
      return
    }

    const upperLetter = letter.toUpperCase()
    const decimal = charToDecimal(upperLetter)
    const binary = decimalToBinary(decimal)

    // Limpiar estados anteriores de búsqueda
    clearSearchHighlights(root)

    // Buscar en el árbol usando el mismo algoritmo de inserción
    let current = root
    let found = false
    let bitIndex = 0

    // Verificar si está en la raíz
    if (current.letter === upperLetter) {
      found = true
      current.isFound = true
    } else {
      // Navegar por el árbol usando los bits binarios
      while (current && bitIndex < binary.length && !found) {
        const bit = binary[bitIndex]

        if (bit === "0") {
          // Ir a la izquierda
          current = current.left
        } else {
          // Ir a la derecha
          current = current.right
        }

        if (current) {
          if (current.letter === upperLetter) {
            found = true
            current.isFound = true
            break
          } else if (current.letter) {
            // Si hay una letra pero no es la que buscamos, avanzar al siguiente bit
            bitIndex++
          }
        }
      }
    }

    // Actualizar el estado del árbol
    setRoot({ ...root })
    setSearchValue(upperLetter)

    // Mostrar resultado
    setDialogState({
      open: true,
      title: found ? "¡Letra encontrada!" : "Letra no encontrada",
      description: found
        ? `La letra "${upperLetter}" fue encontrada en el árbol.`
        : `La letra "${upperLetter}" no existe en el árbol construido.`,
      type: found ? "success" : "error",
    })
  }

  // Función para limpiar los resaltados de búsqueda anteriores
  const clearSearchHighlights = (node: TreeNode | null) => {
    if (!node) return

    node.isFound = false
    clearSearchHighlights(node.left)
    clearSearchHighlights(node.right)
  }

  // Navegación entre pasos
  const nextStep = () => {
    if (currentStep < insertionSteps.length - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      const step = insertionSteps[newStep]
      setExplanation(step.description)

      // Reconstruir árbol hasta este paso
      const newRoot = buildTreeUpToStep(newStep)
      setRoot(newRoot)
    }
  }

  const prevStep = () => {
    if (currentStep > -1) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)

      if (newStep >= 0) {
        const step = insertionSteps[newStep]
        setExplanation(step.description)
      } else {
        setExplanation("Árbol de búsqueda binaria inicializado con nodo raíz vacío")
      }

      // Reconstruir árbol hasta este paso
      const newRoot = buildTreeUpToStep(newStep)
      setRoot(newRoot)
    }
  }

  const resetVisualization = () => {
    setCurrentStep(-1)
    setExplanation("Árbol de búsqueda binaria inicializado con nodo raíz vacío")
    const newRoot = buildTreeUpToStep(-1)
    setRoot(newRoot)
  }

  // Función para renderizar el árbol
  const renderTree = (): JSX.Element[] => {
    if (!root) return []

    const renderNode = (node: TreeNode | null): JSX.Element[] => {
      if (!node) return []

      const elements: JSX.Element[] = []

      // Renderizar conexiones
      if (node.left) {
        elements.push(
          <line
            key={`line-${node.id}-left`}
            x1={node.x}
            y1={node.y}
            x2={node.left.x}
            y2={node.left.y}
            stroke="#333"
            strokeWidth="2"
          />,
        )
        elements.push(
          <text
            key={`label-${node.id}-left`}
            x={(node.x + node.left.x) / 2 - 10}
            y={(node.y + node.left.y) / 2}
            className="text-sm font-bold fill-red-600"
            textAnchor="middle"
          >
            0
          </text>,
        )
      }

      if (node.right) {
        elements.push(
          <line
            key={`line-${node.id}-right`}
            x1={node.x}
            y1={node.y}
            x2={node.right.x}
            y2={node.right.y}
            stroke="#333"
            strokeWidth="2"
          />,
        )
        elements.push(
          <text
            key={`label-${node.id}-right`}
            x={(node.x + node.right.x) / 2 + 10}
            y={(node.y + node.right.y) / 2}
            className="text-sm font-bold fill-red-600"
            textAnchor="middle"
          >
            1
          </text>,
        )
      }

      // Renderizar nodo
      elements.push(
        <circle
          key={`circle-${node.id}`}
          cx={node.x}
          cy={node.y}
          r="25"
          className={`
            ${node.isHighlighted ? "fill-blue-500 stroke-blue-700" : "fill-white stroke-gray-400"}
            ${node.isFound ? "fill-green-500 stroke-green-700" : ""}
          `}
          strokeWidth="3"
        />,
      )

      // Renderizar letra si existe
      if (node.letter) {
        elements.push(
          <text
            key={`text-${node.id}`}
            x={node.x}
            y={node.y + 6}
            className={`text-xl font-bold ${node.isHighlighted || node.isFound ? "fill-white" : "fill-blue-600"}`}
            textAnchor="middle"
          >
            {node.letter}
          </text>,
        )
      }

      // Renderizar hijos recursivamente
      elements.push(...renderNode(node.left))
      elements.push(...renderNode(node.right))

      return elements
    }

    return renderNode(root)
  }

  // Función para insertar una palabra en el árbol
  const insertWord = (word: string) => {
    if (!word || word.trim() === "") {
      setDialogState({
        open: true,
        title: "Entrada inválida",
        description: "Por favor ingrese una palabra válida.",
        type: "error",
      })
      return
    }

    // Limpiar estados de búsqueda anteriores
    setSearchValue("")

    // Extraer letras únicas y crear tabla binaria
    const letters = Array.from(
      new Set(
        word
          .toUpperCase()
          .split("")
          .filter((char) => /[A-ZÑ]/.test(char)),
      ),
    )
    const table = letters.map((letter) => ({
      letter,
      decimal: charToDecimal(letter),
      binary: decimalToBinary(charToDecimal(letter)),
    }))

    setBinaryTable(table)

    // Generar pasos de inserción
    const steps: InsertionStep[] = []
    let stepCounter = 0

    // Paso inicial: mostrar tabla
    steps.push({
      stepNumber: stepCounter++,
      letter: "",
      binaryCode: "",
      currentBit: -1,
      currentPath: "",
      description: "Tabla de códigos binarios generada. Iniciando construcción del árbol.",
      nodeId: "root",
      action: "navigate",
    })

    // Generar pasos para cada letra
    for (let letterIndex = 0; letterIndex < table.length; letterIndex++) {
      const { letter, binary } = table[letterIndex]

      if (letterIndex === 0) {
        // Primera letra va en la raíz
        steps.push({
          stepNumber: stepCounter++,
          letter,
          binaryCode: binary,
          currentBit: -1,
          currentPath: "",
          description: `Insertando primera letra "${letter}" en la raíz del árbol.`,
          nodeId: "root",
          action: "store",
        })
      } else {
        // Resto de letras siguen el algoritmo BST con bits
        steps.push({
          stepNumber: stepCounter++,
          letter,
          binaryCode: binary,
          currentBit: -1,
          currentPath: "",
          description: `Insertando letra "${letter}" con código binario ${binary}. Comenzando en la raíz.`,
          nodeId: "root",
          action: "navigate",
        })

        // Simular la navegación para generar los pasos
        let currentPath = "root"
        let bitIndex = 0
        let foundPosition = false

        while (!foundPosition && bitIndex < binary.length) {
          const bit = binary[bitIndex]

          steps.push({
            stepNumber: stepCounter++,
            letter,
            binaryCode: binary,
            currentBit: bitIndex,
            currentPath: currentPath,
            description: `Revisando bit ${bitIndex + 1}: "${bit}" - ${bit === "0" ? "Verificando hijo izquierdo" : "Verificando hijo derecho"}`,
            nodeId: currentPath,
            action: "navigate",
          })

          // Para simplificar, asumimos que encontramos posición después de revisar el bit
          currentPath = `${currentPath}-${bit === "0" ? "L" : "R"}${bitIndex}`
          bitIndex++

          if (bitIndex >= 3) {
            // Limitar pasos para no hacer muy largo
            foundPosition = true
          }
        }

        // Paso final para almacenar la letra
        steps.push({
          stepNumber: stepCounter++,
          letter,
          binaryCode: binary,
          currentBit: bitIndex,
          currentPath: currentPath,
          description: `Almacenando letra "${letter}" en posición encontrada.`,
          nodeId: currentPath,
          action: "store",
        })
      }
    }

    setInsertionSteps(steps)
    setCurrentStep(-1)
    setExplanation("Preparando construcción del árbol paso a paso...")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Árbol de Búsqueda Binaria</CardTitle>
          <CardDescription>
            Construye un árbol de búsqueda binaria usando los códigos binarios de 5 bits de cada letra. Cada bit
            determina la dirección: 0 = izquierda, 1 = derecha.
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
                    placeholder="Ej: JULIOCESAR"
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
                    placeholder="Ej: A"
                    maxLength={1}
                  />
                  <Button onClick={() => searchLetter(searchValue)}>Buscar</Button>
                </div>
              </div>
            </div>

            {/* Tabla de códigos binarios */}
            {binaryTable.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-3">Tabla de Códigos Binarios</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Letra</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Posición</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Código Binario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {binaryTable.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2 font-bold text-blue-600">{item.letter}</td>
                          <td className="px-4 py-2">{item.decimal}</td>
                          <td className="px-4 py-2 font-mono text-green-600">{item.binary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Visualización del árbol */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold mb-3">Árbol de Búsqueda Binaria</h3>
              <div className="flex justify-center overflow-x-auto">
                <svg width="1000" height="500" className="border border-gray-200 bg-white min-w-full">
                  {renderTree()}
                </svg>
              </div>
            </div>

            {/* Explicación del paso actual */}
            {explanation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{explanation}</p>
                {currentStep >= 0 && insertionSteps[currentStep] && (
                  <p className="text-xs text-blue-600 mt-2">
                    Paso {currentStep + 1} de {insertionSteps.length}
                  </p>
                )}
              </div>
            )}

            {/* Controles de navegación */}
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={prevStep} disabled={currentStep <= -1} variant="outline">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Paso anterior</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={nextStep} disabled={currentStep >= insertionSteps.length - 1}>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Siguiente paso</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={resetVisualization} variant="outline">
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reiniciar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reiniciar visualización</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        if (insertionSteps.length > 0) {
                          const finalStep = insertionSteps.length - 1
                          setCurrentStep(finalStep)
                          const step = insertionSteps[finalStep]
                          setExplanation(step.description)
                          const newRoot = buildTreeUpToStep(finalStep)
                          setRoot(newRoot)
                        }
                      }}
                      disabled={insertionSteps.length === 0}
                      variant="default"
                    >
                      Ver resultado final
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver el árbol completamente construido</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={initializeTree} variant="secondary">
                      <Save className="h-4 w-4 mr-1" />
                      Limpiar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Limpiar árbol</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        clearSearchHighlights(root)
                        setRoot({ ...root })
                        setSearchValue("")
                      }}
                      variant="outline"
                      disabled={!root}
                    >
                      Limpiar búsqueda
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Limpiar resaltado de búsqueda</TooltipContent>
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
