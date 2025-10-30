"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlgorithmControls } from "@/components/algorithm-controls"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ResultDialog } from "@/components/result-dialog"

interface DataItem {
  value: number
  isHighlighted: boolean
  isFound: boolean
  isComparing: boolean
}

interface SearchStep {
  left: number
  right: number
  mid: number
  comparison: string
}

interface DialogState {
  open: boolean
  title: string
  description: string
  type: "success" | "error" | "info"
}

export function BinarySearch() {
  const [data, setData] = useState<DataItem[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [searchValue, setSearchValue] = useState<number | null>(null)
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([])
  const [explanation, setExplanation] = useState<string>("")
  const [collisions, setCollisions] = useState<{ index: number; value: number }[]>([])
  const [keySize, setKeySize] = useState<number>(4)
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    type: "info",
  })

  // Inicializar con algunos datos
  useEffect(() => {
    createEmptyStructure()
  }, [])

  const createEmptyStructure = (
    size = 10,
    _buckets?: number,
    _recordsPerBucket?: number,
    _base?: number,
    newKeySize?: number,
  ) => {
    if (newKeySize) {
      setKeySize(newKeySize)
    }

    const emptyData = Array(size)
      .fill(null)
      .map(() => ({
        value: 0,
        isHighlighted: false,
        isFound: false,
        isComparing: false,
      }))
    setData(emptyData)
    setCurrentStep(-1)
    setSearchSteps([])
    setSearchValue(null)
    setExplanation("")
    setCollisions([])
  }

  const validateKeySize = (value: number): boolean => {
    const valueStr = value.toString()
    return valueStr.length === keySize
  }

  const isStructureFull = (): boolean => {
    const occupiedPositions = data.filter((item) => item.value !== 0).length
    const totalElements = occupiedPositions + collisions.length
    return totalElements >= data.length
  }

  const insertElement = (value: number) => {
    // Validar tamaño de clave
    if (!validateKeySize(value)) {
      setDialogState({
        open: true,
        title: "Tamaño de clave incorrecto",
        description: `La clave debe tener exactamente ${keySize} dígitos. El valor ${value} tiene ${value.toString().length} dígitos.`,
        type: "error",
      })
      return
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
        description: `El valor ${value} ya existe en la estructura. No se permiten claves repetidas en la búsqueda binaria.`,
        type: "error",
      })
      return
    }

    // Para búsqueda binaria, necesitamos mantener el array ordenado
    const newData = [...data]

    // Encontrar la primera posición vacía
    const emptyIndex = newData.findIndex((item) => item.value === 0)

    if (emptyIndex !== -1) {
      // Insertar el valor
      newData[emptyIndex] = {
        value,
        isHighlighted: false,
        isFound: false,
        isComparing: false,
      }

      // Ordenar el array (solo los elementos no vacíos)
      const nonEmptyItems = newData.filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      // Rellenar el array ordenado
      const sortedData = Array(newData.length)
        .fill(null)
        .map(() => ({
          value: 0,
          isHighlighted: false,
          isFound: false,
          isComparing: false,
        }))

      nonEmptyItems.forEach((item, index) => {
        sortedData[index] = item
      })

      setData(sortedData)
      setExplanation(`Elemento ${value} insertado y estructura ordenada`)
      setDialogState({
        open: true,
        title: "Elemento insertado",
        description: `El elemento ${value} ha sido insertado correctamente y la estructura ha sido ordenada.`,
        type: "success",
      })
    } else {
      // Si no hay posiciones vacías, registrar como colisión
      setCollisions([...collisions, { index: -1, value }])
      setExplanation(`No hay espacio disponible. Elemento ${value} registrado como colisión.`)
      setDialogState({
        open: true,
        title: "No hay espacio disponible",
        description: `No hay espacio disponible. El elemento ${value} ha sido registrado como colisión.`,
        type: "info",
      })
    }
  }

  const searchElement = (value: number) => {
    // Validar tamaño de clave
    if (!validateKeySize(value)) {
      setDialogState({
        open: true,
        title: "Tamaño de clave incorrecto",
        description: `La clave debe tener exactamente ${keySize} dígitos para realizar la búsqueda.`,
        type: "error",
      })
      return
    }

    setSearchValue(value)

    // Resetear estados previos
    const resetData = data.map((item) => ({
      ...item,
      isHighlighted: false,
      isFound: false,
      isComparing: false,
    }))
    setData(resetData)

    // Generar pasos de búsqueda binaria
    const steps: SearchStep[] = []
    let left = 0
    let right = data.length - 1

    // Filtrar posiciones vacías para la búsqueda
    const nonEmptyIndices = data
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.value !== 0)
      .map(({ index }) => index)

    if (nonEmptyIndices.length > 0) {
      left = nonEmptyIndices[0]
      right = nonEmptyIndices[nonEmptyIndices.length - 1]

      while (left <= right) {
        const mid = Math.floor((left + right) / 2)

        if (data[mid].value === 0) {
          // Si encontramos un espacio vacío, ajustamos los límites
          const leftNonEmpty = nonEmptyIndices.filter((idx) => idx < mid)
          const rightNonEmpty = nonEmptyIndices.filter((idx) => idx > mid)

          if (leftNonEmpty.length > 0) {
            right = leftNonEmpty[leftNonEmpty.length - 1]
          } else if (rightNonEmpty.length > 0) {
            left = rightNonEmpty[0]
          } else {
            break // No hay elementos no vacíos
          }
          continue
        }

        let comparison = ""
        if (data[mid].value === value) {
          comparison = `${data[mid].value} = ${value}`
          steps.push({ left, right, mid, comparison })
          break
        } else if (data[mid].value < value) {
          comparison = `${data[mid].value} < ${value}, buscar a la derecha`
          steps.push({ left, right, mid, comparison })
          left = mid + 1
        } else {
          comparison = `${data[mid].value} > ${value}, buscar a la izquierda`
          steps.push({ left, right, mid, comparison })
          right = mid - 1
        }
      }
    }

    setSearchSteps(steps)
    setCurrentStep(-1)

    if (steps.length > 0) {
      // Verificar si el elemento será encontrado
      const lastStep = steps[steps.length - 1]
      if (data[lastStep.mid].value !== value) {
        setExplanation(`Iniciando búsqueda binaria del valor ${value}`)
        setDialogState({
          open: true,
          title: "Elemento no encontrado",
          description: `El elemento ${value} no existe en la estructura. Puede navegar por los pasos para ver el proceso de búsqueda binaria.`,
          type: "error",
        })
      } else {
        setExplanation(`Iniciando búsqueda binaria del valor ${value}`)
      }
    } else {
      setExplanation(`No hay elementos para buscar el valor ${value}`)
      setDialogState({
        open: true,
        title: "Búsqueda no iniciada",
        description: `No hay elementos para buscar el valor ${value}.`,
        type: "error",
      })
    }
  }

  const deleteElement = (value: number) => {
    const newData = [...data]
    const index = newData.findIndex((item) => item.value === value)

    if (index !== -1) {
      // Eliminar el elemento
      newData[index] = {
        value: 0,
        isHighlighted: false,
        isFound: false,
        isComparing: false,
      }

      // Reordenar para mantener la estructura compacta
      const nonEmptyItems = newData.filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      const sortedData = Array(newData.length)
        .fill(null)
        .map(() => ({
          value: 0,
          isHighlighted: false,
          isFound: false,
          isComparing: false,
        }))

      nonEmptyItems.forEach((item, idx) => {
        sortedData[idx] = item
      })

      setData(sortedData)
      setExplanation(`Elemento ${value} eliminado y estructura reordenada`)
      setDialogState({
        open: true,
        title: "Elemento eliminado",
        description: `El elemento ${value} ha sido eliminado correctamente y la estructura ha sido reordenada.`,
        type: "success",
      })

      // Verificar si hay colisiones que puedan ocupar este espacio
      if (collisions.length > 0) {
        const [firstCollision, ...remainingCollisions] = collisions

        // Insertar ordenadamente
        const updatedData = [...sortedData]
        let insertIndex = 0
        while (
          insertIndex < updatedData.length &&
          updatedData[insertIndex].value !== 0 &&
          updatedData[insertIndex].value < firstCollision.value
        ) {
          insertIndex++
        }

        // Si llegamos al final o encontramos un hueco
        if (insertIndex < updatedData.length && updatedData[insertIndex].value === 0) {
          updatedData[insertIndex] = {
            value: firstCollision.value,
            isHighlighted: false,
            isFound: false,
            isComparing: false,
          }
          setData(updatedData)
          setCollisions(remainingCollisions)
          setExplanation(`Elemento ${firstCollision.value} movido desde colisiones a la estructura ordenada`)
          setDialogState({
            open: true,
            title: "Colisión resuelta",
            description: `El elemento ${firstCollision.value} ha sido movido desde colisiones a la estructura ordenada.`,
            type: "success",
          })
        }
      }
    } else {
      // Verificar si está en colisiones
      const collisionIndex = collisions.findIndex((item) => item.value === value)
      if (collisionIndex !== -1) {
        const newCollisions = [...collisions]
        newCollisions.splice(collisionIndex, 1)
        setCollisions(newCollisions)
        setExplanation(`Elemento ${value} eliminado de colisiones`)
        setDialogState({
          open: true,
          title: "Elemento eliminado de colisiones",
          description: `El elemento ${value} ha sido eliminado de colisiones.`,
          type: "success",
        })
      } else {
        setExplanation(`Elemento ${value} no encontrado`)
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
    // Validar tamaño de ambas claves
    if (!validateKeySize(oldValue) || !validateKeySize(newValue)) {
      setDialogState({
        open: true,
        title: "Tamaño de clave incorrecto",
        description: `Ambas claves deben tener exactamente ${keySize} dígitos.`,
        type: "error",
      })
      return
    }

    // Verificar si el valor antiguo existe en la estructura
    const existsInData = data.some((item) => item.value === oldValue)
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
    const newValueExists = data.some((item) => item.value === newValue)
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

    const newData = [...data]
    const index = newData.findIndex((item) => item.value === oldValue)

    if (index !== -1) {
      // Eliminar el valor antiguo
      newData[index] = {
        value: 0,
        isHighlighted: false,
        isFound: false,
        isComparing: false,
      }

      // Añadir el nuevo valor
      const emptyIndex = newData.findIndex((item) => item.value === 0)
      if (emptyIndex !== -1) {
        newData[emptyIndex] = {
          value: newValue,
          isHighlighted: false,
          isFound: false,
          isComparing: false,
        }
      }

      // Ordenar el array (solo los elementos no vacíos)
      const nonEmptyItems = newData.filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      // Rellenar el array ordenado
      const sortedData = Array(newData.length)
        .fill(null)
        .map(() => ({
          value: 0,
          isHighlighted: false,
          isFound: false,
          isComparing: false,
        }))

      nonEmptyItems.forEach((item, idx) => {
        sortedData[idx] = item
      })

      setData(sortedData)
      setExplanation(`Elemento ${oldValue} modificado a ${newValue} y estructura reordenada`)
      setDialogState({
        open: true,
        title: "Elemento modificado",
        description: `El elemento ${oldValue} ha sido modificado a ${newValue} y la estructura ha sido reordenada.`,
        type: "success",
      })
    } else {
      // Verificar si está en colisiones
      const collisionIndex = collisions.findIndex((item) => item.value === oldValue)
      if (collisionIndex !== -1) {
        const newCollisions = [...collisions]
        newCollisions[collisionIndex] = { index: -1, value: newValue }
        setCollisions(newCollisions)
        setExplanation(`Elemento ${oldValue} modificado a ${newValue} en colisiones`)
        setDialogState({
          open: true,
          title: "Elemento modificado en colisiones",
          description: `El elemento ${oldValue} ha sido modificado a ${newValue} en colisiones.`,
          type: "success",
        })
      }
    }
  }

  const nextStep = () => {
    if (currentStep < searchSteps.length - 1) {
      const nextStepIndex = currentStep + 1
      const step = searchSteps[nextStepIndex]

      // Actualizar visualización
      const newData = data.map((item, index) => ({
        ...item,
        isHighlighted: index >= step.left && index <= step.right,
        isFound: index === step.mid && item.value === searchValue,
        isComparing: index === step.mid && item.value !== searchValue,
      }))

      setData(newData)
      setCurrentStep(nextStepIndex)

      // Actualizar explicación
      setExplanation(
        `Paso ${nextStepIndex + 1}: Buscando entre posiciones ${step.left + 1} y ${step.right + 1}. Medio en ${step.mid + 1}. ${step.comparison}`,
      )

      // Si encontramos el valor, mostrar diálogo
      if (newData[step.mid].value === searchValue) {
        setDialogState({
          open: true,
          title: "Elemento encontrado",
          description: `¡El elemento ${searchValue} ha sido encontrado en la posición ${step.mid + 1}!`,
          type: "success",
        })
      }
    } else if (currentStep === searchSteps.length - 1) {
      // Si estamos en el último paso y no se encontró el elemento
      const lastStep = searchSteps[searchSteps.length - 1]
      if (data[lastStep.mid].value !== searchValue) {
        setDialogState({
          open: true,
          title: "Elemento no encontrado",
          description: `El elemento ${searchValue} no fue encontrado en la estructura después de completar la búsqueda binaria.`,
          type: "error",
        })
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1
      const step = searchSteps[prevStepIndex]

      // Actualizar visualización
      const newData = data.map((item, index) => ({
        ...item,
        isHighlighted: index >= step.left && index <= step.right,
        isFound: index === step.mid && item.value === searchValue && prevStepIndex === searchSteps.length - 1,
        isComparing: index === step.mid && item.value !== searchValue,
      }))

      setData(newData)
      setCurrentStep(prevStepIndex)

      // Actualizar explicación
      setExplanation(
        `Paso ${prevStepIndex + 1}: Buscando entre posiciones ${step.left + 1} y ${step.right + 1}. Medio en ${step.mid + 1}. ${step.comparison}`,
      )
    } else if (currentStep === 0) {
      // Volver al estado inicial
      const resetData = data.map((item) => ({
        ...item,
        isHighlighted: false,
        isFound: false,
        isComparing: false,
      }))

      setData(resetData)
      setCurrentStep(-1)
      setExplanation(`Iniciando búsqueda binaria del valor ${searchValue}`)
    }
  }

  const resetSearch = () => {
    // Resetear la visualización
    const resetData = data.map((item) => ({
      ...item,
      isHighlighted: false,
      isFound: false,
      isComparing: false,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda Binaria (Interna)</CardTitle>
          <CardDescription>
            La búsqueda binaria divide repetidamente a la mitad el espacio de búsqueda, comparando el elemento central
            con el valor buscado. Tamaño de clave configurado: {keySize} dígitos.
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
              keySize={keySize}
              onKeySizeChange={setKeySize}
            />

            {/* Visualización de la estructura */}
            <div className="border rounded-lg p-4 bg-marfil/50">
              <h3 className="text-sm font-medium mb-3">Estructura de datos ordenada</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {data.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              w-12 h-12 flex items-center justify-center rounded-md border-2
                              ${item.isHighlighted ? "bg-petroleo text-marfil border-petroleo" : "border-slate/20"}
                              ${item.isFound ? "bg-green-500 text-white border-green-500" : ""}
                              ${item.isComparing ? "bg-white text-black border-red-500" : ""}
                              ${item.value === 0 ? "opacity-50 bg-white" : item.isHighlighted || item.isFound || item.isComparing ? "" : "bg-white"}
                            `}
                          >
                            {item.value === 0 ? "-" : item.value}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Posición {index + 1}: {item.value === 0 ? "Vacío" : item.value}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-xs mt-1">{index + 1}</div>
                  </div>
                ))}
              </div>

              {/* Colisiones */}
              {collisions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Colisiones</h4>
                  <div className="flex flex-wrap gap-2">
                    {collisions.map((collision, index) => (
                      <div key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                        {collision.value}
                      </div>
                    ))}
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
