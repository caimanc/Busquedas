"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DataItem {
  value: number
  isHighlighted: boolean
  isFound: boolean
}

interface Block {
  items: DataItem[]
  isExpanded: boolean
  isReduced: boolean
}

interface OverflowItem {
  value: number
  targetBlock: number
}

export function DynamicSearch({ type }: { type: "total" | "partial" }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [searchValue, setSearchValue] = useState<number | null>(null)
  const [searchSteps, setSearchSteps] = useState<{ block: number; index: number }[]>([])
  const [explanation, setExplanation] = useState<string>("")
  const [overflow, setOverflow] = useState<OverflowItem[]>([])

  // Configuración de la estructura
  const [numBlocks, setNumBlocks] = useState<number>(4)
  const [blockSize, setBlockSize] = useState<number>(5)
  const [maxDensity, setMaxDensity] = useState<number>(70)
  const [minDensity, setMinDensity] = useState<number>(30)
  const [keySize, setKeySize] = useState<number>(4)
  const [structureCreated, setStructureCreated] = useState<boolean>(false)
  const [currentDensity, setCurrentDensity] = useState<number>(0)

  // Estados para operaciones CRUD
  const [insertValue, setInsertValue] = useState<string>("")
  const [searchInputValue, setSearchInputValue] = useState<string>("")
  const [deleteValue, setDeleteValue] = useState<string>("")
  const [oldValue, setOldValue] = useState<string>("")
  const [newValue, setNewValue] = useState<string>("")

  // Modal de error
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  // Factores para expansiones/reducciones parciales
  const expansionFactors = [1, 1.5, 2, 3, 4, 6, 8, 12]
  const [currentFactorIndex, setCurrentFactorIndex] = useState<number>(0)

  // Calcular la densidad actual
  const calculateDensity = (blocks: Block[]): number => {
    let totalElements = 0
    blocks.forEach((block) => {
      block.items.forEach((item) => {
        if (item.value !== 0) totalElements++
      })
    })

    const totalCapacity = blocks.length * blockSize
    return totalCapacity > 0 ? (totalElements / totalCapacity) * 100 : 0
  }

  // Validar tamaño de clave
  const validateKeySize = (value: string): boolean => {
    if (value.length !== keySize) {
      setErrorMessage(
        `El valor debe tener exactamente ${keySize} dígitos. Valor ingresado: ${value} (${value.length} dígitos)`,
      )
      setShowErrorModal(true)
      return false
    }
    return true
  }

  // Verificar duplicados
  const isDuplicate = (value: number): boolean => {
    // Buscar en los bloques
    for (const block of blocks) {
      for (const item of block.items) {
        if (item.value === value) {
          return true
        }
      }
    }
    // Buscar en el desbordamiento
    for (const item of overflow) {
      if (item.value === value) {
        return true
      }
    }
    return false
  }

  // Crear estructura vacía con la configuración especificada
  const createEmptyStructure = () => {
    if (numBlocks <= 0 || blockSize <= 0) {
      setErrorMessage("Por favor ingrese valores válidos para el número de cubetas y capacidad")
      setShowErrorModal(true)
      return
    }

    if (numBlocks % 2 !== 0) {
      setErrorMessage("El número de cubetas debe ser un número par")
      setShowErrorModal(true)
      return
    }

    if (maxDensity <= 0 || maxDensity >= 100) {
      setErrorMessage("La densidad máxima debe estar entre 1% y 99%")
      setShowErrorModal(true)
      return
    }

    if (minDensity <= 0 || minDensity >= 100) {
      setErrorMessage("La densidad mínima debe estar entre 1% y 99%")
      setShowErrorModal(true)
      return
    }

    if (minDensity >= maxDensity) {
      setErrorMessage("La densidad mínima debe ser menor que la densidad máxima")
      setShowErrorModal(true)
      return
    }

    // Crear estructura inicial con los bloques vacíos
    const emptyBlocks = Array(numBlocks)
      .fill(null)
      .map(() => ({
        items: Array(blockSize)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
        isExpanded: false,
        isReduced: false,
      }))

    setBlocks(emptyBlocks)
    setCurrentStep(-1)
    setSearchSteps([])
    setSearchValue(null)
    setExplanation(`Estructura creada con ${numBlocks} cubetas de capacidad ${blockSize}`)
    setOverflow([])
    setCurrentDensity(0)
    setCurrentFactorIndex(0)
    setStructureCreated(true)
  }

  // Función hash para determinar la cubeta
  const hashFunction = (value: number, n: number = numBlocks): number => {
    return value % n
  }

  const insertElement = (value: string) => {
    if (!structureCreated) {
      setErrorMessage("Por favor cree la estructura primero")
      setShowErrorModal(true)
      return
    }

    if (!validateKeySize(value)) {
      return
    }

    const numValue = Number.parseInt(value)

    if (isNaN(numValue) || numValue <= 0) {
      setErrorMessage("Por favor ingrese un valor numérico positivo mayor que cero")
      setShowErrorModal(true)
      return
    }

    if (isDuplicate(numValue)) {
      setErrorMessage(`El valor ${numValue} ya existe en la estructura`)
      setShowErrorModal(true)
      return
    }

    // Calcular la cubeta usando la función hash
    const targetBlock = hashFunction(numValue)
    setExplanation(
      `Aplicando hash(${numValue}) = ${numValue} % ${numBlocks} = ${targetBlock} (Cubeta ${targetBlock + 1})`,
    )

    const newBlocks = [...blocks]

    // Verificar si hay espacio en la cubeta objetivo
    const block = newBlocks[targetBlock]
    const emptyIndex = block.items.findIndex((item) => item.value === 0)

    if (emptyIndex !== -1) {
      // Hay espacio en la cubeta objetivo
      block.items[emptyIndex] = {
        value: numValue,
        isHighlighted: true,
        isFound: false,
      }

      // Ordenar los elementos de la cubeta
      const nonEmptyItems = block.items.filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      const emptyItems = Array(blockSize - nonEmptyItems.length)
        .fill(null)
        .map(() => ({
          value: 0,
          isHighlighted: false,
          isFound: false,
        }))

      block.items = [...nonEmptyItems, ...emptyItems]

      // Calcular la nueva densidad
      const newDensity = calculateDensity(newBlocks)
      setCurrentDensity(newDensity)

      setBlocks(newBlocks)

      // Después de un tiempo, quitar el resaltado
      setTimeout(() => {
        const resetBlocks = newBlocks.map((block) => ({
          ...block,
          items: block.items.map((item) => ({
            ...item,
            isHighlighted: false,
          })),
        }))
        setBlocks(resetBlocks)
      }, 1500)

      setExplanation(
        `Elemento ${numValue} insertado en la cubeta ${targetBlock + 1} y ordenado. Densidad actual: ${newDensity.toFixed(1)}%`,
      )

      // Verificar si es necesario expandir
      if (newDensity > maxDensity) {
        if (type === "total") {
          handleTotalExpansion()
        } else if (type === "partial") {
          handlePartialExpansion()
        }
      }
    } else {
      // No hay espacio en la cubeta objetivo, añadir al desbordamiento
      setOverflow([...overflow, { value: numValue, targetBlock }])
      setExplanation(
        `No hay espacio en la cubeta ${targetBlock + 1}. Elemento ${numValue} añadido a la Tabla de Desbordamiento.`,
      )
    }

    setInsertValue("")
  }

  const handleTotalExpansion = () => {
    const newNumBlocks = numBlocks * 2
    setExplanation(
      `Densidad ${currentDensity.toFixed(1)}% > máxima ${maxDensity}%: expansión total. Cubetas: ${numBlocks} → ${newNumBlocks}`,
    )

    // Crear nuevos bloques
    const newBlocks = Array(newNumBlocks)
      .fill(null)
      .map(() => ({
        items: Array(blockSize)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
        isExpanded: true,
        isReduced: false,
      }))

    // Recolectar todos los elementos
    const allItems: number[] = []
    blocks.forEach((block) => {
      block.items.forEach((item) => {
        if (item.value !== 0) {
          allItems.push(item.value)
        }
      })
    })

    // Añadir elementos del desbordamiento
    overflow.forEach((item) => {
      allItems.push(item.value)
    })

    // Redistribuir todos los elementos según el nuevo hash
    allItems.forEach((value) => {
      const targetBlock = hashFunction(value, newNumBlocks)
      const block = newBlocks[targetBlock]
      const emptyIndex = block.items.findIndex((item) => item.value === 0)

      if (emptyIndex !== -1) {
        block.items[emptyIndex] = {
          value,
          isHighlighted: false,
          isFound: false,
        }

        // Ordenar los elementos de la cubeta
        const nonEmptyItems = block.items.filter((item) => item.value !== 0)
        nonEmptyItems.sort((a, b) => a.value - b.value)

        const emptyItems = Array(blockSize - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          }))

        block.items = [...nonEmptyItems, ...emptyItems]
      }
    })

    setNumBlocks(newNumBlocks)
    setBlocks(newBlocks)
    setOverflow([])

    // Calcular la nueva densidad
    const newDensity = calculateDensity(newBlocks)
    setCurrentDensity(newDensity)

    // Después de un tiempo, quitar el estado de expansión
    setTimeout(() => {
      const resetBlocks = newBlocks.map((block) => ({
        ...block,
        isExpanded: false,
      }))
      setBlocks(resetBlocks)
    }, 2000)
  }

  const handlePartialExpansion = () => {
    // Obtener el siguiente factor de expansión
    const nextFactorIndex = (currentFactorIndex + 1) % expansionFactors.length
    const expansionFactor = expansionFactors[nextFactorIndex]

    // Calcular el nuevo número de cubetas (debe ser par)
    let newNumBlocks = Math.max(Math.floor(numBlocks * expansionFactor), numBlocks + 2)
    if (newNumBlocks % 2 !== 0) {
      newNumBlocks += 1
    }

    setExplanation(
      `Densidad ${currentDensity.toFixed(1)}% > máxima ${maxDensity}%: expansión parcial. Cubetas: ${numBlocks} → ${newNumBlocks} (factor: ${expansionFactor})`,
    )

    // Crear nuevos bloques
    const newBlocks = Array(newNumBlocks)
      .fill(null)
      .map(() => ({
        items: Array(blockSize)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
        isExpanded: true,
        isReduced: false,
      }))

    // Recolectar todos los elementos
    const allItems: number[] = []
    blocks.forEach((block) => {
      block.items.forEach((item) => {
        if (item.value !== 0) {
          allItems.push(item.value)
        }
      })
    })

    // Añadir elementos del desbordamiento
    overflow.forEach((item) => {
      allItems.push(item.value)
    })

    // Redistribuir todos los elementos según el nuevo hash
    allItems.forEach((value) => {
      const targetBlock = hashFunction(value, newNumBlocks)
      const block = newBlocks[targetBlock]
      const emptyIndex = block.items.findIndex((item) => item.value === 0)

      if (emptyIndex !== -1) {
        block.items[emptyIndex] = {
          value,
          isHighlighted: false,
          isFound: false,
        }

        // Ordenar los elementos de la cubeta
        const nonEmptyItems = block.items.filter((item) => item.value !== 0)
        nonEmptyItems.sort((a, b) => a.value - b.value)

        const emptyItems = Array(blockSize - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          }))

        block.items = [...nonEmptyItems, ...emptyItems]
      } else {
        // Si no hay espacio, añadir al desbordamiento
        setOverflow((prev) => [...prev, { value, targetBlock }])
      }
    })

    setNumBlocks(newNumBlocks)
    setBlocks(newBlocks)
    setOverflow([])
    setCurrentFactorIndex(nextFactorIndex)

    // Calcular la nueva densidad
    const newDensity = calculateDensity(newBlocks)
    setCurrentDensity(newDensity)

    // Después de un tiempo, quitar el estado de expansión
    setTimeout(() => {
      const resetBlocks = newBlocks.map((block) => ({
        ...block,
        isExpanded: false,
      }))
      setBlocks(resetBlocks)
    }, 2000)
  }

  const handleTotalReduction = () => {
    if (numBlocks <= 2) {
      setErrorMessage("No se puede reducir más la estructura (mínimo 2 cubetas)")
      setShowErrorModal(true)
      return
    }

    const newNumBlocks = Math.max(2, Math.floor(numBlocks / 2))
    setExplanation(
      `Densidad ${currentDensity.toFixed(1)}% < mínima ${minDensity}%: reducción total. Cubetas: ${numBlocks} → ${newNumBlocks}`,
    )

    // Crear nuevos bloques
    const newBlocks = Array(newNumBlocks)
      .fill(null)
      .map(() => ({
        items: Array(blockSize)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
        isReduced: true,
        isExpanded: false,
      }))

    // Recolectar todos los elementos
    const allItems: number[] = []
    blocks.forEach((block) => {
      block.items.forEach((item) => {
        if (item.value !== 0) {
          allItems.push(item.value)
        }
      })
    })

    // Añadir elementos del desbordamiento
    overflow.forEach((item) => {
      allItems.push(item.value)
    })

    // Vaciar el desbordamiento
    setOverflow([])

    // Redistribuir todos los elementos según el nuevo hash
    allItems.forEach((value) => {
      const targetBlock = hashFunction(value, newNumBlocks)
      const block = newBlocks[targetBlock]
      const emptyIndex = block.items.findIndex((item) => item.value === 0)

      if (emptyIndex !== -1) {
        block.items[emptyIndex] = {
          value,
          isHighlighted: false,
          isFound: false,
        }

        // Ordenar los elementos de la cubeta
        const nonEmptyItems = block.items.filter((item) => item.value !== 0)
        nonEmptyItems.sort((a, b) => a.value - b.value)

        const emptyItems = Array(blockSize - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          }))

        block.items = [...nonEmptyItems, ...emptyItems]
      } else {
        // Si no hay espacio, añadir al desbordamiento
        setOverflow((prev) => [...prev, { value, targetBlock }])
      }
    })

    setNumBlocks(newNumBlocks)
    setBlocks(newBlocks)

    // Calcular la nueva densidad
    const newDensity = calculateDensity(newBlocks)
    setCurrentDensity(newDensity)

    // Después de un tiempo, quitar el estado de reducción
    setTimeout(() => {
      const resetBlocks = newBlocks.map((block) => ({
        ...block,
        isReduced: false,
      }))
      setBlocks(resetBlocks)
    }, 2000)
  }

  const handlePartialReduction = () => {
    if (numBlocks <= 2) {
      setErrorMessage("No se puede reducir más la estructura (mínimo 2 cubetas)")
      setShowErrorModal(true)
      return
    }

    // Obtener el factor de reducción anterior
    const prevFactorIndex = currentFactorIndex > 0 ? currentFactorIndex - 1 : 0
    const reductionFactor = expansionFactors[prevFactorIndex]

    // Calcular el nuevo número de cubetas (debe ser par)
    let newNumBlocks = Math.max(2, Math.floor(numBlocks / reductionFactor))
    if (newNumBlocks % 2 !== 0) {
      newNumBlocks = Math.max(2, newNumBlocks - 1)
    }

    setExplanation(
      `Densidad ${currentDensity.toFixed(1)}% < mínima ${minDensity}%: reducción parcial. Cubetas: ${numBlocks} → ${newNumBlocks} (factor: 1/${reductionFactor})`,
    )

    // Crear nuevos bloques
    const newBlocks = Array(newNumBlocks)
      .fill(null)
      .map(() => ({
        items: Array(blockSize)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
        isReduced: true,
        isExpanded: false,
      }))

    // Recolectar todos los elementos
    const allItems: number[] = []
    blocks.forEach((block) => {
      block.items.forEach((item) => {
        if (item.value !== 0) {
          allItems.push(item.value)
        }
      })
    })

    // Añadir elementos del desbordamiento
    overflow.forEach((item) => {
      allItems.push(item.value)
    })

    // Vaciar el desbordamiento
    setOverflow([])

    // Redistribuir todos los elementos según el nuevo hash
    allItems.forEach((value) => {
      const targetBlock = hashFunction(value, newNumBlocks)
      const block = newBlocks[targetBlock]
      const emptyIndex = block.items.findIndex((item) => item.value === 0)

      if (emptyIndex !== -1) {
        block.items[emptyIndex] = {
          value,
          isHighlighted: false,
          isFound: false,
        }

        // Ordenar los elementos de la cubeta
        const nonEmptyItems = block.items.filter((item) => item.value !== 0)
        nonEmptyItems.sort((a, b) => a.value - b.value)

        const emptyItems = Array(blockSize - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          }))

        block.items = [...nonEmptyItems, ...emptyItems]
      } else {
        // Si no hay espacio, añadir al desbordamiento
        setOverflow((prev) => [...prev, { value, targetBlock }])
      }
    })

    setNumBlocks(newNumBlocks)
    setBlocks(newBlocks)
    setCurrentFactorIndex(prevFactorIndex)

    // Calcular la nueva densidad
    const newDensity = calculateDensity(newBlocks)
    setCurrentDensity(newDensity)

    // Después de un tiempo, quitar el estado de reducción
    setTimeout(() => {
      const resetBlocks = newBlocks.map((block) => ({
        ...block,
        isReduced: false,
      }))
      setBlocks(resetBlocks)
    }, 2000)
  }

  const searchElement = (value: string) => {
    if (!structureCreated) {
      setErrorMessage("Por favor cree la estructura primero")
      setShowErrorModal(true)
      return
    }

    if (!validateKeySize(value)) {
      return
    }

    const numValue = Number.parseInt(value)

    if (isNaN(numValue) || numValue <= 0) {
      setErrorMessage("Por favor ingrese un valor numérico positivo mayor que cero")
      setShowErrorModal(true)
      return
    }

    setSearchValue(numValue)

    // Resetear estados previos
    const resetBlocks = blocks.map((block) => ({
      ...block,
      items: block.items.map((item) => ({
        ...item,
        isHighlighted: false,
        isFound: false,
      })),
    }))
    setBlocks(resetBlocks)

    // Calcular la cubeta usando la función hash
    const targetBlock = hashFunction(numValue)
    setExplanation(
      `Buscando ${numValue}. Hash(${numValue}) = ${numValue} % ${numBlocks} = ${targetBlock} (Cubeta ${targetBlock + 1})`,
    )

    // Generar pasos de búsqueda
    const steps: { block: number; index: number }[] = []

    // Buscar en la cubeta objetivo
    const block = blocks[targetBlock]
    const nonEmptyItems = block.items.filter((item) => item.value !== 0)

    // Búsqueda binaria dentro de la cubeta
    let left = 0
    let right = nonEmptyItems.length - 1
    let found = false

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const itemIndex = block.items.findIndex((item) => item.value === nonEmptyItems[mid].value)
      steps.push({ block: targetBlock, index: itemIndex })

      if (nonEmptyItems[mid].value === numValue) {
        found = true
        break
      } else if (nonEmptyItems[mid].value < numValue) {
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    setSearchSteps(steps)
    setCurrentStep(-1)

    if (steps.length > 0 && found) {
      setExplanation(`Iniciando búsqueda del valor ${numValue} en la cubeta ${targetBlock + 1}`)
    } else {
      // Verificar si está en el desbordamiento
      const overflowItem = overflow.find((item) => item.value === numValue)
      if (overflowItem) {
        setExplanation(`El valor ${numValue} se encuentra en la Tabla de Desbordamiento`)
      } else {
        setExplanation(`El valor ${numValue} no se encuentra en la estructura`)
      }
    }

    setSearchInputValue("")
  }

  const deleteElement = (value: string) => {
    if (!structureCreated) {
      setErrorMessage("Por favor cree la estructura primero")
      setShowErrorModal(true)
      return
    }

    if (!validateKeySize(value)) {
      return
    }

    const numValue = Number.parseInt(value)

    if (isNaN(numValue) || numValue <= 0) {
      setErrorMessage("Por favor ingrese un valor numérico positivo mayor que cero")
      setShowErrorModal(true)
      return
    }

    // Calcular la cubeta usando la función hash
    const targetBlock = hashFunction(numValue)
    const newBlocks = [...blocks]
    let deleted = false

    // Buscar el elemento en la cubeta objetivo
    const block = newBlocks[targetBlock]
    const index = block.items.findIndex((item) => item.value === numValue)

    if (index !== -1) {
      // Elemento encontrado, eliminar
      block.items[index] = {
        value: 0,
        isHighlighted: false,
        isFound: false,
      }

      // Reordenar la cubeta
      const nonEmptyItems = block.items.filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      const emptyItems = Array(blockSize - nonEmptyItems.length)
        .fill(null)
        .map(() => ({
          value: 0,
          isHighlighted: false,
          isFound: false,
        }))

      block.items = [...nonEmptyItems, ...emptyItems]
      setBlocks(newBlocks)

      // Calcular la nueva densidad
      const newDensity = calculateDensity(newBlocks)
      setCurrentDensity(newDensity)

      setExplanation(
        `Elemento ${numValue} eliminado de la cubeta ${targetBlock + 1} y reordenado. Densidad actual: ${newDensity.toFixed(1)}%`,
      )
      deleted = true

      // Verificar si hay elementos en desbordamiento que puedan ocupar este espacio
      const overflowIndex = overflow.findIndex((item) => item.targetBlock === targetBlock)
      if (overflowIndex !== -1) {
        const [overflowItem] = overflow.splice(overflowIndex, 1)

        // Insertar desde desbordamiento y ordenar
        const updatedItems = [
          ...nonEmptyItems,
          {
            value: overflowItem.value,
            isHighlighted: true,
            isFound: false,
          },
        ]

        updatedItems.sort((a, b) => a.value - b.value)

        const updatedEmptyItems = Array(blockSize - updatedItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          }))

        block.items = [...updatedItems, ...updatedEmptyItems]
        setOverflow([...overflow])

        // Después de un tiempo, quitar el resaltado
        setTimeout(() => {
          const resetBlocks = newBlocks.map((block) => ({
            ...block,
            items: block.items.map((item) => ({
              ...item,
              isHighlighted: false,
            })),
          }))
          setBlocks(resetBlocks)
        }, 1500)

        setExplanation(
          `Elemento ${numValue} eliminado. Elemento ${overflowItem.value} movido desde la Tabla de Desbordamiento a la cubeta ${targetBlock + 1}.`,
        )
      }

      // Verificar si es necesario reducir la estructura
      if (newDensity < minDensity) {
        if (type === "total") {
          handleTotalReduction()
        } else if (type === "partial") {
          handlePartialReduction()
        }
      }
    } else {
      // Verificar si está en el desbordamiento
      const overflowIndex = overflow.findIndex((item) => item.value === numValue)
      if (overflowIndex !== -1) {
        const newOverflow = [...overflow]
        newOverflow.splice(overflowIndex, 1)
        setOverflow(newOverflow)
        setExplanation(`Elemento ${numValue} eliminado de la Tabla de Desbordamiento`)
        deleted = true
      }
    }

    if (!deleted) {
      setErrorMessage(`Elemento ${numValue} no encontrado`)
      setShowErrorModal(true)
    }

    setDeleteValue("")
  }

  const modifyElement = (oldVal: string, newVal: string) => {
    if (!structureCreated) {
      setErrorMessage("Por favor cree la estructura primero")
      setShowErrorModal(true)
      return
    }

    if (!validateKeySize(oldVal)) {
      return
    }

    if (!validateKeySize(newVal)) {
      return
    }

    const oldNumValue = Number.parseInt(oldVal)
    const newNumValue = Number.parseInt(newVal)

    if (isNaN(oldNumValue) || oldNumValue <= 0 || isNaN(newNumValue) || newNumValue <= 0) {
      setErrorMessage("Por favor ingrese valores numéricos positivos mayores que cero")
      setShowErrorModal(true)
      return
    }

    if (!isDuplicate(oldNumValue)) {
      setErrorMessage(`El valor actual ${oldNumValue} no existe en la estructura`)
      setShowErrorModal(true)
      return
    }

    if (isDuplicate(newNumValue)) {
      setErrorMessage(`El nuevo valor ${newNumValue} ya existe en la estructura`)
      setShowErrorModal(true)
      return
    }

    // Primero eliminamos el valor antiguo
    deleteElement(oldVal)
    // Luego insertamos el nuevo valor
    setTimeout(() => {
      insertElement(newVal)
    }, 100)

    setOldValue("")
    setNewValue("")
  }

  const nextStep = () => {
    if (currentStep < searchSteps.length - 1) {
      const nextStepIndex = currentStep + 1
      const { block, index } = searchSteps[nextStepIndex]

      // Actualizar visualización
      const newBlocks = blocks.map((blockData, blockIdx) => ({
        ...blockData,
        items: blockData.items.map((item, itemIdx) => ({
          ...item,
          isHighlighted: blockIdx === block && itemIdx === index,
          isFound: blockIdx === block && itemIdx === index && item.value === searchValue,
        })),
      }))

      setBlocks(newBlocks)
      setCurrentStep(nextStepIndex)

      // Actualizar explicación
      const targetBlock = newBlocks[block]
      const targetItem = targetBlock.items[index]

      if (targetItem.value === searchValue) {
        setExplanation(`¡Elemento ${searchValue} encontrado en la cubeta ${block + 1}, posición ${index + 1}!`)
      } else if (targetItem.value === 0) {
        setExplanation(`Posición ${index + 1} en cubeta ${block + 1} vacía. El elemento ${searchValue} no existe.`)
      } else {
        setExplanation(
          `Comparando elemento en cubeta ${block + 1}, posición ${index + 1}: ${targetItem.value} != ${searchValue}`,
        )
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1
      const { block, index } = searchSteps[prevStepIndex]

      // Actualizar visualización
      const newBlocks = blocks.map((blockData, blockIdx) => ({
        ...blockData,
        items: blockData.items.map((item, itemIdx) => ({
          ...item,
          isHighlighted: blockIdx === block && itemIdx === index,
          isFound: false,
        })),
      }))

      setBlocks(newBlocks)
      setCurrentStep(prevStepIndex)

      // Actualizar explicación
      const targetBlock = newBlocks[block]
      const targetItem = targetBlock.items[index]

      setExplanation(
        `Comparando elemento en cubeta ${block + 1}, posición ${index + 1}: ${targetItem.value} != ${searchValue}`,
      )
    } else if (currentStep === 0) {
      // Volver al estado inicial
      const resetBlocks = blocks.map((block) => ({
        ...block,
        items: block.items.map((item) => ({
          ...item,
          isHighlighted: false,
          isFound: false,
        })),
      }))

      setBlocks(resetBlocks)
      setCurrentStep(-1)
      setExplanation(`Iniciando búsqueda del valor ${searchValue}`)
    }
  }

  const resetSearch = () => {
    // Resetear la visualización
    const resetBlocks = blocks.map((block) => ({
      ...block,
      items: block.items.map((item) => ({
        ...item,
        isHighlighted: false,
        isFound: false,
      })),
      isExpanded: false,
      isReduced: false,
    }))

    setBlocks(resetBlocks)
    setCurrentStep(-1)
    setExplanation("")
  }

  const saveStructure = () => {
    // Simulación de guardado
    setExplanation("Estructura guardada correctamente")
  }

  // Título y descripción según el tipo
  const getTitle = () => {
    switch (type) {
      case "total":
        return "Expansiones-Reducciones Totales (Externa)"
      case "partial":
        return "Expansiones-Reducciones Parciales (Externa)"
    }
  }

  const getDescription = () => {
    switch (type) {
      case "total":
        return "Las expansiones/reducciones totales duplican o reducen a la mitad el número de cubetas cuando se superan los umbrales de densidad."
      case "partial":
        return "Las expansiones/reducciones parciales ajustan gradualmente el número de cubetas usando factores de crecimiento específicos."
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Configuración de la estructura */}
            {!structureCreated && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="numBlocks">Número de Cubetas (par) *</Label>
                  <Input
                    id="numBlocks"
                    type="number"
                    min="2"
                    step="2"
                    max="20"
                    value={numBlocks}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value) || 2
                      setNumBlocks(val % 2 === 0 ? val : val + 1)
                    }}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="blockSize">Capacidad de Cubeta *</Label>
                  <Input
                    id="blockSize"
                    type="number"
                    min="1"
                    max="10"
                    value={blockSize}
                    onChange={(e) => setBlockSize(Number.parseInt(e.target.value) || 1)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="keySize">Tamaño de Clave (dígitos) *</Label>
                  <Input
                    id="keySize"
                    type="number"
                    min="1"
                    max="10"
                    value={keySize}
                    onChange={(e) => setKeySize(Number.parseInt(e.target.value) || 4)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxDensity">Densidad Máxima (%) *</Label>
                  <Input
                    id="maxDensity"
                    type="number"
                    min="1"
                    max="99"
                    value={maxDensity}
                    onChange={(e) => setMaxDensity(Number.parseInt(e.target.value) || 70)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minDensity">Densidad Mínima (%) *</Label>
                  <Input
                    id="minDensity"
                    type="number"
                    min="1"
                    max="99"
                    value={minDensity}
                    onChange={(e) => setMinDensity(Number.parseInt(e.target.value) || 30)}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={createEmptyStructure}
                    className="w-full bg-petroleo hover:bg-petroleo/90 text-marfil"
                  >
                    Crear Estructura
                  </Button>
                </div>
              </div>
            )}

            {/* Controles CRUD */}
            {structureCreated && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Insertar */}
                  <div className="space-y-2">
                    <Label htmlFor="insertValue">Insertar</Label>
                    <div className="flex gap-2">
                      <Input
                        id="insertValue"
                        type="text"
                        value={insertValue}
                        onChange={(e) => setInsertValue(e.target.value)}
                        placeholder={`${keySize} dígitos`}
                      />
                      <Button onClick={() => insertElement(insertValue)} disabled={!insertValue}>
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Buscar */}
                  <div className="space-y-2">
                    <Label htmlFor="searchValue">Buscar</Label>
                    <div className="flex gap-2">
                      <Input
                        id="searchValue"
                        type="text"
                        value={searchInputValue}
                        onChange={(e) => setSearchInputValue(e.target.value)}
                        placeholder={`${keySize} dígitos`}
                      />
                      <Button onClick={() => searchElement(searchInputValue)} disabled={!searchInputValue}>
                        🔍
                      </Button>
                    </div>
                  </div>

                  {/* Eliminar */}
                  <div className="space-y-2">
                    <Label htmlFor="deleteValue">Eliminar</Label>
                    <div className="flex gap-2">
                      <Input
                        id="deleteValue"
                        type="text"
                        value={deleteValue}
                        onChange={(e) => setDeleteValue(e.target.value)}
                        placeholder={`${keySize} dígitos`}
                      />
                      <Button onClick={() => deleteElement(deleteValue)} disabled={!deleteValue} variant="destructive">
                        🗑️
                      </Button>
                    </div>
                  </div>

                  {/* Guardar */}
                  <div className="space-y-2">
                    <Label>Acciones</Label>
                    <Button onClick={saveStructure} variant="outline" className="w-full bg-transparent">
                      Guardar
                    </Button>
                  </div>
                </div>

                {/* Modificar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldValue">Valor Actual</Label>
                    <Input
                      id="oldValue"
                      type="text"
                      value={oldValue}
                      onChange={(e) => setOldValue(e.target.value)}
                      placeholder={`${keySize} dígitos`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newValue">Nuevo Valor</Label>
                    <Input
                      id="newValue"
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={`${keySize} dígitos`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modificar</Label>
                    <Button
                      onClick={() => modifyElement(oldValue, newValue)}
                      disabled={!oldValue || !newValue}
                      className="w-full"
                    >
                      Modificar
                    </Button>
                  </div>
                </div>

                {/* Controles de navegación */}
                <div className="flex justify-center gap-4 pt-4 border-t">
                  <Button onClick={prevStep} disabled={currentStep <= -1} variant="outline">
                    ← Anterior
                  </Button>
                  <Button onClick={resetSearch} variant="outline">
                    Reiniciar
                  </Button>
                  <Button onClick={nextStep} disabled={currentStep >= searchSteps.length - 1} variant="outline">
                    Siguiente →
                  </Button>
                  <Button
                    onClick={() => {
                      setStructureCreated(false)
                      setBlocks([])
                      setOverflow([])
                      setExplanation("")
                    }}
                    variant="outline"
                  >
                    Nueva Configuración
                  </Button>
                </div>
              </div>
            )}

            {/* Visualización de la estructura */}
            {structureCreated && (
              <div className="border rounded-lg p-4 bg-marfil/50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">Estructura de Cubetas Dinámicas</h3>
                  <div className="text-xs font-medium px-2 py-1 bg-petroleo/10 rounded-md">
                    Densidad actual: {currentDensity.toFixed(1)}% | Mínima: {minDensity}% | Máxima: {maxDensity}%
                  </div>
                </div>
                <div className="space-y-4">
                  {blocks.map((block, blockIdx) => (
                    <div
                      key={blockIdx}
                      className={`border rounded-md p-3 transition-all duration-300
                        ${block.isExpanded ? "border-green-500 bg-green-50" : ""}
                        ${block.isReduced ? "border-amber-500 bg-amber-50" : ""}
                        ${!block.isExpanded && !block.isReduced ? "border-slate/10" : ""}
                      `}
                    >
                      <div className="text-xs font-medium mb-2">
                        Cubeta {blockIdx + 1} (hash mod {numBlocks} = {blockIdx})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {block.items.map((item, itemIdx) => (
                          <TooltipProvider key={itemIdx}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`
                                    w-16 h-12 flex items-center justify-center rounded-md border border-slate/20 text-sm
                                    ${item.isHighlighted ? "bg-petroleo text-marfil" : "bg-white"}
                                    ${item.isFound ? "bg-slate text-marfil" : ""}
                                    ${item.value === 0 ? "opacity-50" : ""}
                                  `}
                                >
                                  {item.value === 0 ? "-" : item.value}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                Cubeta {blockIdx + 1}, Posición {itemIdx + 1}: {item.value === 0 ? "Vacío" : item.value}
                                {item.value !== 0 && (
                                  <div>
                                    Hash({item.value}) = {item.value} % {numBlocks} = {item.value % numBlocks}
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tabla de Desbordamiento */}
                {overflow.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Tabla de Desbordamiento</h4>
                    <div className="flex flex-wrap gap-2">
                      {overflow.map((item, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">{item.value}</div>
                            </TooltipTrigger>
                            <TooltipContent>
                              Valor: {item.value}
                              <br />
                              Cubeta objetivo: {item.targetBlock + 1}
                              <br />
                              Hash({item.value}) = {item.value} % {numBlocks} = {item.targetBlock}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explicación del paso actual */}
                {explanation && <div className="mt-4 p-3 bg-petroleo/10 rounded-md text-sm">{explanation}</div>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de error */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowErrorModal(false)}>Cerrar</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
