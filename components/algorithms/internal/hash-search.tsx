"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlgorithmControls } from "@/components/algorithm-controls"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ResultDialog } from "@/components/result-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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

export function HashSearch({ type }: { type: "mod" | "square" | "folding" | "truncation" | "base-change" }) {
  const [data, setData] = useState<DataItem[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [searchValue, setSearchValue] = useState<number | null>(null)
  const [searchSteps, setSearchSteps] = useState<number[]>([])
  const [explanation, setExplanation] = useState<string>("")
  const [collisions, setCollisions] = useState<{ index: number; value: number; calculation: string }[]>([])
  const [tableSize, setTableSize] = useState<number>(10) // Tamaño configurable de la tabla hash
  const [baseValue, setBaseValue] = useState<number>(8) // Base para el cambio de base
  const [keySize, setKeySize] = useState<number>(4) // Tamaño de clave general

  // Estados específicos para truncamiento
  const [keyDigits, setKeyDigits] = useState<number>(4) // Número de dígitos que debe tener la clave
  const [selectedDigits, setSelectedDigits] = useState<boolean[]>([]) // Dígitos seleccionados para truncamiento

  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    type: "info",
  })

  // Inicializar con estructura vacía
  useEffect(() => {
    createEmptyStructure(tableSize)
  }, [])

  // Actualizar selectedDigits cuando cambie keyDigits para truncamiento
  useEffect(() => {
    if (type === "truncation") {
      setSelectedDigits(new Array(keyDigits).fill(false))
    }
  }, [keyDigits, type])

  const createEmptyStructure = (
    size = 10,
    _buckets?: number,
    _recordsPerBucket?: number,
    base?: number,
    newKeySize?: number,
  ) => {
    setTableSize(size)
    if (base) {
      setBaseValue(base)
    }
    if (newKeySize) {
      setKeySize(newKeySize)
      if (type === "truncation") {
        setKeyDigits(newKeySize)
      }
    }

    const emptyData = Array(size)
      .fill(null)
      .map(() => ({
        value: 0,
        isHighlighted: false,
        isFound: false,
      }))
    setData(emptyData)
    setCurrentStep(-1)
    setSearchSteps([])
    setSearchValue(null)
    setExplanation("")
    setCollisions([])

    // Reinicializar configuración de truncamiento
    if (type === "truncation") {
      setSelectedDigits(new Array(newKeySize || keySize).fill(false))
    }
  }

  const validateKeySize = (value: number): boolean => {
    const valueStr = value.toString()
    const expectedSize = type === "truncation" ? keyDigits : keySize
    return valueStr.length === expectedSize
  }

  // Función para convertir un número a otra base
  const convertToBase = (num: number, base: number): string => {
    if (base < 2 || base > 36) {
      throw new Error("La base debe estar entre 2 y 36")
    }
    return num.toString(base)
  }

  // Calcular el número máximo de dígitos seleccionables
  const getMaxSelectableDigits = (): number => {
    const structureDigits = tableSize.toString().length
    return Math.max(1, structureDigits - 1)
  }

  // Validar selección de dígitos para truncamiento
  const validateDigitSelection = (): boolean => {
    const selectedCount = selectedDigits.filter(Boolean).length
    const maxSelectable = getMaxSelectableDigits()
    return selectedCount > 0 && selectedCount <= maxSelectable
  }

  // Función hash según el tipo
  const hashFunction = (value: number): { index: number; calculation: string } => {
    switch (type) {
      case "mod":
        return {
          index: value % tableSize,
          calculation: `${value} mod ${tableSize} = ${value % tableSize}`,
        }

      case "square":
        const squared = value * value
        const middleDigits = extractMiddleDigits(squared, 1)
        return {
          index: middleDigits % tableSize,
          calculation: `${value}² = ${squared}, dígitos medios = ${middleDigits}, ${middleDigits} mod ${tableSize} = ${middleDigits % tableSize}`,
        }

      case "folding":
        // Dividir en grupos de 2 dígitos y sumar
        const digits = value.toString().padStart(keySize, "0")
        const groups = []
        for (let i = 0; i < digits.length; i += 2) {
          if (i + 2 <= digits.length) {
            groups.push(Number.parseInt(digits.substring(i, i + 2)))
          } else {
            groups.push(Number.parseInt(digits.substring(i)))
          }
        }
        const sum = groups.reduce((acc, val) => acc + val, 0)
        return {
          index: sum % tableSize,
          calculation: `Plegamiento: ${groups.join(" + ")} = ${sum}, ${sum} mod ${tableSize} = ${sum % tableSize}`,
        }

      case "truncation":
        // Nuevo truncamiento personalizado
        const valueStr = value.toString().padStart(keyDigits, "0")
        const selectedDigitValues: string[] = []
        const selectedPositions: number[] = []

        selectedDigits.forEach((isSelected, index) => {
          if (isSelected && index < valueStr.length) {
            selectedDigitValues.push(valueStr[index])
            selectedPositions.push(index + 1)
          }
        })

        if (selectedDigitValues.length === 0) {
          return {
            index: 0,
            calculation: `Error: No se han seleccionado dígitos para truncamiento`,
          }
        }

        const truncatedValue = Number.parseInt(selectedDigitValues.join("")) || 0
        const finalIndex = truncatedValue % tableSize

        return {
          index: finalIndex,
          calculation: `Truncamiento: ${value} → posiciones ${selectedPositions.join(", ")} → dígitos ${selectedDigitValues.join("")} → ${truncatedValue} mod ${tableSize} = ${finalIndex}`,
        }

      case "base-change":
        // Convertir a la base especificada y tomar los dígitos menos significativos
        const valueInBase = convertToBase(value, baseValue)
        const digitsNeeded = Math.ceil(Math.log(tableSize) / Math.log(baseValue))
        const leastSignificantDigits = valueInBase.slice(-digitsNeeded)
        const leastSignificantInDecimal = Number.parseInt(leastSignificantDigits, baseValue)
        const index = leastSignificantInDecimal % tableSize

        return {
          index,
          calculation: `${value} en base ${baseValue} = ${valueInBase}, últimos ${digitsNeeded} dígitos = ${leastSignificantDigits}, convertido a decimal = ${leastSignificantInDecimal}, mod ${tableSize} = ${index}`,
        }
    }
  }

  // Función auxiliar para extraer dígitos medios
  const extractMiddleDigits = (value: number, count: number): number => {
    const strValue = value.toString()
    const start = Math.floor((strValue.length - count) / 2)
    return Number.parseInt(strValue.substring(start, start + count))
  }

  const insertElement = (value: number) => {
    if (value <= 0) {
      setExplanation("Por favor ingrese un valor positivo mayor que cero")
      setDialogState({
        open: true,
        title: "Valor inválido",
        description: "Por favor ingrese un valor positivo mayor que cero.",
        type: "error",
      })
      return
    }

    // Validar tamaño de clave
    if (!validateKeySize(value)) {
      const expectedSize = type === "truncation" ? keyDigits : keySize
      setDialogState({
        open: true,
        title: "Tamaño de clave incorrecto",
        description: `La clave debe tener exactamente ${expectedSize} dígitos. El valor ${value} tiene ${value.toString().length} dígitos.`,
        type: "error",
      })
      return
    }

    // Validaciones específicas para truncamiento
    if (type === "truncation") {
      if (!validateDigitSelection()) {
        const maxSelectable = getMaxSelectableDigits()
        setDialogState({
          open: true,
          title: "Selección de dígitos inválida",
          description: `Debe seleccionar entre 1 y ${maxSelectable} dígitos para el truncamiento.`,
          type: "error",
        })
        return
      }
    }

    // Check if structure is full
    if (isStructureFull()) {
      const occupiedPositions = data.filter((item) => item.value !== 0).length
      setDialogState({
        open: true,
        title: "Estructura llena",
        description: `La estructura está llena. Capacidad: ${data.length}, Elementos en estructura: ${occupiedPositions}, Elementos en colisiones: ${collisions.length}. Total: ${occupiedPositions + collisions.length}`,
        type: "error",
      })
      return
    }

    // Verificar si el valor ya existe en la estructura principal
    const existsInData = data.some((item) => item.value === value)
    // Verificar si el valor ya existe en colisiones
    const existsInCollisions = collisions.some((collision) => collision.value === value)

    if (existsInData || existsInCollisions) {
      setExplanation(`El valor ${value} ya existe en la estructura. No se permiten claves repetidas.`)
      setDialogState({
        open: true,
        title: "Clave repetida",
        description: `El valor ${value} ya existe en la estructura. No se permiten claves repetidas en el algoritmo hash.`,
        type: "error",
      })
      return
    }

    const { index, calculation } = hashFunction(value)
    const newData = [...data]

    if (newData[index].value === 0) {
      // Posición libre, insertar directamente
      newData[index] = {
        value,
        isHighlighted: false,
        isFound: false,
        calculation,
      }
      setData(newData)
      setExplanation(`Elemento ${value} insertado en la posición ${index + 1}. ${calculation}`)
      setDialogState({
        open: true,
        title: "Elemento insertado",
        description: `El elemento ${value} ha sido insertado en la posición ${index + 1}.\n${calculation}`,
        type: "success",
      })
    } else {
      // Colisión, registrar
      setCollisions([...collisions, { index, value, calculation }])
      setExplanation(`Colisión en posición ${index + 1}. ${calculation}. Elemento ${value} registrado como colisión.`)
      setDialogState({
        open: true,
        title: "Colisión detectada",
        description: `Colisión en posición ${index + 1}. ${calculation}. Elemento ${value} registrado como colisión.`,
        type: "info",
      })
    }
  }

  const searchElement = (value: number) => {
    if (value <= 0) {
      setExplanation("Por favor ingrese un valor positivo mayor que cero")
      setDialogState({
        open: true,
        title: "Valor inválido",
        description: "Por favor ingrese un valor positivo mayor que cero.",
        type: "error",
      })
      return
    }

    // Validar tamaño de clave
    if (!validateKeySize(value)) {
      const expectedSize = type === "truncation" ? keyDigits : keySize
      setDialogState({
        open: true,
        title: "Tamaño de clave incorrecto",
        description: `La clave debe tener exactamente ${expectedSize} dígitos para realizar la búsqueda.`,
        type: "error",
      })
      return
    }

    // Validaciones específicas para truncamiento
    if (type === "truncation") {
      if (!validateDigitSelection()) {
        const maxSelectable = getMaxSelectableDigits()
        setDialogState({
          open: true,
          title: "Selección de dígitos inválida",
          description: `Debe seleccionar entre 1 y ${maxSelectable} dígitos para el truncamiento.`,
          type: "error",
        })
        return
      }
    }

    setSearchValue(value)

    // Resetear estados previos
    const resetData = data.map((item) => ({
      ...item,
      isHighlighted: false,
      isFound: false,
    }))
    setData(resetData)

    // Calcular posición hash
    const { index, calculation } = hashFunction(value)

    // Verificar si el elemento existe antes de iniciar la búsqueda
    const elementExists = data[index].value === value || collisions.some((collision) => collision.value === value)

    if (!elementExists) {
      setExplanation(`Iniciando búsqueda del valor ${value}. ${calculation}`)
      setDialogState({
        open: true,
        title: "Elemento no encontrado",
        description: `El elemento ${value} no existe en la estructura. Puede navegar por los pasos para ver el proceso de búsqueda hash.`,
        type: "error",
      })
    } else {
      setExplanation(`Iniciando búsqueda del valor ${value}. ${calculation}`)
    }

    // Generar pasos de búsqueda (en hash, solo verificamos la posición calculada)
    const steps: number[] = [index]

    setSearchSteps(steps)
    setCurrentStep(-1)
  }

  const deleteElement = (value: number) => {
    if (value <= 0) {
      setExplanation("Por favor ingrese un valor positivo mayor que cero")
      setDialogState({
        open: true,
        title: "Valor inválido",
        description: "Por favor ingrese un valor positivo mayor que cero.",
        type: "error",
      })
      return
    }

    const { index } = hashFunction(value)
    const newData = [...data]

    if (newData[index].value === value) {
      // Elemento encontrado en la posición hash, eliminar
      newData[index] = {
        value: 0,
        isHighlighted: false,
        isFound: false,
      }
      setData(newData)

      // Verificar si hay colisiones que puedan ocupar este espacio
      const collisionIndex = collisions.findIndex((item) => item.index === index)
      if (collisionIndex !== -1) {
        const [collision, ...remainingCollisions] = collisions.filter((item) => item.index === index)
        newData[index] = {
          value: collision.value,
          isHighlighted: false,
          isFound: false,
          calculation: collision.calculation,
        }

        // Actualizar lista de colisiones
        setCollisions([...collisions.filter((item) => item.index !== index), ...remainingCollisions])

        setExplanation(
          `Elemento ${value} eliminado. Elemento ${collision.value} movido desde colisiones a la posición ${index + 1}.`,
        )
        setDialogState({
          open: true,
          title: "Elemento eliminado y colisión resuelta",
          description: `Elemento ${value} eliminado. Elemento ${collision.value} movido desde colisiones a la posición ${index + 1}.`,
          type: "success",
        })
      } else {
        setExplanation(`Elemento ${value} eliminado de la posición ${index + 1}.`)
        setDialogState({
          open: true,
          title: "Elemento eliminado",
          description: `El elemento ${value} ha sido eliminado de la posición ${index + 1}.`,
          type: "success",
        })
      }
    } else {
      // Verificar si está en colisiones
      const collisionIndex = collisions.findIndex((item) => item.value === value)
      if (collisionIndex !== -1) {
        const newCollisions = [...collisions]
        newCollisions.splice(collisionIndex, 1)
        setCollisions(newCollisions)
        setExplanation(`Elemento ${value} eliminado de colisiones.`)
        setDialogState({
          open: true,
          title: "Elemento eliminado de colisiones",
          description: `El elemento ${value} ha sido eliminado de colisiones.`,
          type: "success",
        })
      } else {
        setExplanation(`Elemento ${value} no encontrado.`)
        setDialogState({
          open: true,
          title: "Elemento no encontrado",
          description: `El elemento ${value} no existe en la estructura.`,
          type: "error",
        })
      }
    }
  }

  const modifyElement = (oldValue: number, newValue: number) => {
    if (oldValue <= 0 || newValue <= 0) {
      setExplanation("Por favor ingrese valores positivos mayores que cero")
      setDialogState({
        open: true,
        title: "Valores inválidos",
        description: "Por favor ingrese valores positivos mayores que cero.",
        type: "error",
      })
      return
    }

    // Validar tamaño de ambas claves
    if (!validateKeySize(oldValue) || !validateKeySize(newValue)) {
      const expectedSize = type === "truncation" ? keyDigits : keySize
      setDialogState({
        open: true,
        title: "Tamaño de clave incorrecto",
        description: `Ambas claves deben tener exactamente ${expectedSize} dígitos.`,
        type: "error",
      })
      return
    }

    // Verificar si el valor antiguo existe
    const { index: oldIndex } = hashFunction(oldValue)
    const existsInData = data[oldIndex].value === oldValue
    const existsInCollisions = collisions.some((collision) => collision.value === oldValue)

    if (!existsInData && !existsInCollisions) {
      setDialogState({
        open: true,
        title: "Valor actual no encontrado",
        description: `El valor actual ${oldValue} no existe en la estructura. No se puede modificar.`,
        type: "error",
      })
      return
    }

    // Verificar si el nuevo valor ya existe
    const { index: newIndex } = hashFunction(newValue)
    const newValueExists = data[newIndex].value === newValue
    const newValueExistsInCollisions = collisions.some((collision) => collision.value === newValue)

    if (newValueExists || newValueExistsInCollisions) {
      setDialogState({
        open: true,
        title: "Nuevo valor ya existe",
        description: `El nuevo valor ${newValue} ya existe en la estructura. No se puede modificar.`,
        type: "error",
      })
      return
    }

    // Eliminar el valor antiguo
    const newData = [...data]

    if (existsInData) {
      newData[oldIndex] = {
        value: 0,
        isHighlighted: false,
        isFound: false,
      }
    }

    // Eliminar de colisiones si está ahí
    let updatedCollisions = [...collisions]
    if (existsInCollisions) {
      updatedCollisions = updatedCollisions.filter((c) => c.value !== oldValue)
    }

    // Insertar el nuevo valor
    const { index: insertIndex, calculation } = hashFunction(newValue)

    if (newData[insertIndex].value === 0) {
      // Posición libre, insertar directamente
      newData[insertIndex] = {
        value: newValue,
        isHighlighted: false,
        isFound: false,
        calculation,
      }
      setData(newData)
      setCollisions(updatedCollisions)
      setExplanation(`Elemento ${oldValue} modificado a ${newValue}. ${calculation}`)
      setDialogState({
        open: true,
        title: "Elemento modificado",
        description: `El elemento ${oldValue} ha sido modificado a ${newValue}.\n${calculation}`,
        type: "success",
      })
    } else {
      // Colisión, registrar
      updatedCollisions.push({ index: insertIndex, value: newValue, calculation })
      setData(newData)
      setCollisions(updatedCollisions)
      setExplanation(
        `Elemento ${oldValue} modificado a ${newValue}. Colisión en posición ${insertIndex + 1}. ${calculation}`,
      )
      setDialogState({
        open: true,
        title: "Elemento modificado (con colisión)",
        description: `El elemento ${oldValue} ha sido modificado a ${newValue}. Colisión detectada en posición ${insertIndex + 1}.\n${calculation}`,
        type: "info",
      })
    }
  }

  const nextStep = () => {
    if (currentStep < searchSteps.length - 1) {
      const nextStepIndex = currentStep + 1
      const stepPosition = searchSteps[nextStepIndex]

      // Actualizar visualización
      const newData = data.map((item, index) => ({
        ...item,
        isHighlighted: index === stepPosition,
        isFound: index === stepPosition && item.value === searchValue,
      }))

      setData(newData)
      setCurrentStep(nextStepIndex)

      // Actualizar explicación
      if (newData[stepPosition].value === searchValue) {
        setExplanation(`¡Elemento ${searchValue} encontrado en la posición ${stepPosition + 1}!`)
        setDialogState({
          open: true,
          title: "Elemento encontrado",
          description: `¡El elemento ${searchValue} ha sido encontrado en la posición ${stepPosition + 1}!`,
          type: "success",
        })
      } else if (newData[stepPosition].value === 0) {
        setExplanation(`Posición ${stepPosition + 1} vacía. El elemento ${searchValue} no existe en la estructura.`)
        setDialogState({
          open: true,
          title: "Elemento no encontrado",
          description: `Posición ${stepPosition + 1} vacía. El elemento ${searchValue} no existe en la estructura.`,
          type: "error",
        })
      } else {
        // Verificar si está en colisiones
        const collision = collisions.find((item) => item.value === searchValue)
        if (collision) {
          setExplanation(`Elemento ${searchValue} encontrado en colisiones.`)
          setDialogState({
            open: true,
            title: "Elemento encontrado en colisiones",
            description: `El elemento ${searchValue} ha sido encontrado en colisiones.`,
            type: "success",
          })
        } else {
          setExplanation(
            `Posición ${stepPosition + 1} ocupada por ${newData[stepPosition].value}. El elemento ${searchValue} no existe.`,
          )
          setDialogState({
            open: true,
            title: "Elemento no encontrado",
            description: `Posición ${stepPosition + 1} ocupada por ${newData[stepPosition].value}. El elemento ${searchValue} no existe.`,
            type: "error",
          })
        }
      }
    } else if (currentStep === searchSteps.length - 1) {
      // Si estamos en el último paso y no se encontró el elemento
      const stepPosition = searchSteps[searchSteps.length - 1]
      const elementFound =
        data[stepPosition].value === searchValue || collisions.some((collision) => collision.value === searchValue)

      if (!elementFound) {
        setDialogState({
          open: true,
          title: "Elemento no encontrado",
          description: `El elemento ${searchValue} no fue encontrado en la estructura hash ni en las colisiones.`,
          type: "error",
        })
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1
      const stepPosition = searchSteps[prevStepIndex]

      // Actualizar visualización
      const newData = data.map((item, index) => ({
        ...item,
        isHighlighted: index === stepPosition,
        isFound: false,
      }))

      setData(newData)
      setCurrentStep(prevStepIndex)

      // Actualizar explicación
      setExplanation(`Verificando posición ${stepPosition + 1}...`)
    } else if (currentStep === 0) {
      // Volver al estado inicial
      const resetData = data.map((item) => ({
        ...item,
        isHighlighted: false,
        isFound: false,
      }))

      setData(resetData)
      setCurrentStep(-1)

      const { calculation } = hashFunction(searchValue || 0)
      setExplanation(`Iniciando búsqueda del valor ${searchValue}. ${calculation}`)
    }
  }

  const resetSearch = () => {
    // Resetear la visualización
    const resetData = data.map((item) => ({
      ...item,
      isHighlighted: false,
      isFound: false,
    }))

    setData(resetData)
    setCurrentStep(-1)
    setExplanation("")
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

  // Manejar cambio en la selección de dígitos
  const handleDigitToggle = (index: number) => {
    const newSelection = [...selectedDigits]
    const currentSelected = newSelection.filter(Boolean).length
    const maxSelectable = getMaxSelectableDigits()

    // Si está intentando seleccionar y ya alcanzó el máximo
    if (!newSelection[index] && currentSelected >= maxSelectable) {
      setDialogState({
        open: true,
        title: "Límite de selección alcanzado",
        description: `Solo puede seleccionar máximo ${maxSelectable} dígitos para una estructura de tamaño ${tableSize}.`,
        type: "error",
      })
      return
    }

    newSelection[index] = !newSelection[index]
    setSelectedDigits(newSelection)
  }

  // Título y descripción según el tipo de hash
  const getTitle = () => {
    switch (type) {
      case "mod":
        return "Hash Mod (Interna)"
      case "square":
        return "Hash Cuadrado (Interna)"
      case "folding":
        return "Hash Plegamiento (Interna)"
      case "truncation":
        return "Hash Truncamiento (Interna)"
      case "base-change":
        return "Hash Cambio de Base (Interna)"
    }
  }

  const getDescription = () => {
    switch (type) {
      case "mod":
        return "La función hash mod calcula el residuo de la división del valor por el tamaño de la tabla."
      case "square":
        return "La función hash cuadrado eleva al cuadrado el valor y toma los dígitos centrales."
      case "folding":
        return "La función hash plegamiento divide el valor en grupos, los suma y calcula el módulo."
      case "truncation":
        return "La función hash truncamiento toma solo los dígitos seleccionados del valor y los concatena."
      case "base-change":
        return "La función hash cambio de base convierte el valor a otra base numérica y toma los dígitos menos significativos."
    }
  }

  // Agrupar colisiones por índice
  const collisionsByIndex = collisions.reduce(
    (acc, collision) => {
      if (!acc[collision.index]) {
        acc[collision.index] = []
      }
      acc[collision.index].push(collision.value)
      return acc
    },
    {} as Record<number, number[]>,
  )

  const isStructureFull = (): boolean => {
    const occupiedPositions = data.filter((item) => item.value !== 0).length
    const totalElements = occupiedPositions + collisions.length
    return totalElements >= data.length
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>
            {getDescription()} Tamaño de clave configurado: {type === "truncation" ? keyDigits : keySize} dígitos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Controles */}
            <AlgorithmControls
              onNextStep={nextStep}
              onPrevStep={prevStep}
              onReset={resetSearch}
              onSave={saveStructure}
              onInsert={insertElement}
              onSearch={searchElement}
              onDelete={deleteElement}
              onModify={modifyElement}
              onCreateEmpty={createEmptyStructure}
              disablePrev={currentStep <= -1}
              disableNext={currentStep >= searchSteps.length - 1}
              isHashAlgorithm={true}
              isBaseChangeHash={type === "base-change"}
              keySize={keySize}
              onKeySizeChange={setKeySize}
            />

            {/* Configuración específica para truncamiento */}
            {type === "truncation" && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="text-sm font-medium mb-3">Configuración de Truncamiento</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="keyDigits">Número de dígitos de la clave</Label>
                      <Input
                        id="keyDigits"
                        type="number"
                        min="1"
                        max="10"
                        value={keyDigits}
                        onChange={(e) => setKeyDigits(Math.max(1, Number.parseInt(e.target.value) || 1))}
                        className="w-20"
                      />
                    </div>
                    <div className="text-sm text-gray-600">Máximo seleccionables: {getMaxSelectableDigits()}</div>
                  </div>

                  <div>
                    <Label>Seleccionar dígitos para truncamiento</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.from({ length: keyDigits }, (_, index) => (
                        <Button
                          key={index}
                          variant={selectedDigits[index] ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDigitToggle(index)}
                          className="w-12 h-12"
                        >
                          {index + 1}
                        </Button>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Seleccionados: {selectedDigits.filter(Boolean).length} / {getMaxSelectableDigits()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visualización de la estructura */}
            <div className="border rounded-lg p-4 bg-marfil/50">
              <h3 className="text-sm font-medium mb-3">Estructura</h3>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {data.map((item, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                          <div
                            className={`
                              w-12 h-12 flex items-center justify-center rounded-md border border-slate/20
                              ${item.isHighlighted ? "bg-petroleo text-marfil" : "bg-white"}
                              ${item.isFound ? "bg-slate text-marfil" : ""}
                              ${item.value === 0 ? "opacity-50" : ""}
                            `}
                          >
                            {item.value === 0 ? "-" : item.value}
                          </div>
                          <div className="text-xs mt-1">{index + 1}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {item.value === 0
                          ? `Posición ${index + 1}: Vacío`
                          : `Posición ${index + 1}: ${item.value}${item.calculation ? `\n${item.calculation}` : ""}`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>

              {/* Colisiones */}
              {Object.keys(collisionsByIndex).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Colisiones</h4>
                  <div className="space-y-2">
                    {Object.entries(collisionsByIndex).map(([indexStr, values]) => {
                      const index = Number.parseInt(indexStr)
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div className="text-sm font-medium">Colisiones índice {index + 1}:</div>
                          <div className="flex flex-wrap gap-2">
                            {values.map((value, i) => (
                              <TooltipProvider key={i}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">{value}</div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {collisions.find((c) => c.value === value && c.index === index)?.calculation || ""}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Explicación del paso actual */}
              {explanation && <div className="mt-4 p-3 bg-petroleo/10 rounded-md text-sm">{explanation}</div>}
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
