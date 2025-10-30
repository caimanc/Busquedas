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
}

interface DialogState {
  open: boolean
  title: string
  description: string
  type: "success" | "error" | "info"
}

export function LinearSearch() {
  const [data, setData] = useState<DataItem[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [searchValue, setSearchValue] = useState<number | null>(null)
  const [searchSteps, setSearchSteps] = useState<number[]>([])
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

    // Verificar si el valor ya existe en la estructura
    const existsInData = data.some((item) => item.value === value)
    const existsInCollisions = collisions.some((collision) => collision.value === value)

    if (existsInData || existsInCollisions) {
      setExplanation(`Error: El valor ${value} ya existe en la estructura`)
      setDialogState({
        open: true,
        title: "Clave repetida",
        description: `No se puede insertar el valor ${value} porque ya existe en la estructura. Las claves deben ser únicas.`,
        type: "error",
      })
      return
    }

    // Buscar la primera posición vacía (valor 0)
    const newData = [...data]
    const emptyIndex = newData.findIndex((item) => item.value === 0)

    if (emptyIndex !== -1) {
      newData[emptyIndex] = {
        value,
        isHighlighted: false,
        isFound: false,
      }

      // Ordenar los elementos (excluyendo los valores 0)
      const nonEmptyItems = newData.filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      // Rellenar con ceros al final
      const sortedData = [
        ...nonEmptyItems,
        ...Array(newData.length - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
      ]

      setData(sortedData)
      setExplanation(`Elemento ${value} insertado y estructura ordenada`)
    } else {
      // Si no hay posiciones vacías, extender la estructura
      const extendedData = [
        ...newData,
        {
          value,
          isHighlighted: false,
          isFound: false,
        },
      ]

      // Ordenar los elementos (excluyendo los valores 0)
      const nonEmptyItems = extendedData.filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      // Rellenar con ceros al final
      const sortedData = [
        ...nonEmptyItems,
        ...Array(extendedData.length - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
      ]

      setData(sortedData)
      setExplanation(`Estructura extendida. Elemento ${value} insertado y estructura ordenada`)
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
    }))
    setData(resetData)

    // Generar pasos de búsqueda (en búsqueda lineal, simplemente recorremos el array)
    const steps: number[] = []
    for (let i = 0; i < data.length; i++) {
      if (data[i].value !== 0) {
        // Solo consideramos posiciones ocupadas
        steps.push(i)
        if (data[i].value === value) {
          break // Encontramos el valor, terminamos
        }
      }
    }

    setSearchSteps(steps)
    setCurrentStep(-1)

    // Si no se encontró el elemento en ningún paso, mostrar modal inmediatamente
    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1]
      if (data[lastStep].value !== value) {
        // El elemento no existe, mostrar modal inmediatamente
        setExplanation(`Iniciando búsqueda del valor ${value}`)
        setDialogState({
          open: true,
          title: "Elemento no encontrado",
          description: `El elemento ${value} no existe en la estructura. Puede navegar por los pasos para ver el proceso de búsqueda.`,
          type: "error",
        })
      } else {
        setExplanation(`Iniciando búsqueda del valor ${value}`)
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
      newData[index] = {
        value: 0,
        isHighlighted: false,
        isFound: false,
      }

      // Ordenar los elementos (excluyendo los valores 0)
      const nonEmptyItems = newData.filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      // Rellenar con ceros al final
      const sortedData = [
        ...nonEmptyItems,
        ...Array(newData.length - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
      ]

      setData(sortedData)
      setExplanation(`Elemento ${value} eliminado y estructura reordenada`)
      setDialogState({
        open: true,
        title: "Elemento eliminado",
        description: `El elemento ${value} ha sido eliminado correctamente de la posición ${index + 1} y la estructura ha sido reordenada.`,
        type: "success",
      })

      // Verificar si hay colisiones que puedan ocupar este espacio
      if (collisions.length > 0) {
        const [firstCollision, ...remainingCollisions] = collisions

        // Insertar desde colisiones y reordenar
        const updatedItems = [
          ...nonEmptyItems,
          {
            value: firstCollision.value,
            isHighlighted: false,
            isFound: false,
          },
        ]

        updatedItems.sort((a, b) => a.value - b.value)

        const updatedSortedData = [
          ...updatedItems,
          ...Array(newData.length - updatedItems.length)
            .fill(null)
            .map(() => ({
              value: 0,
              isHighlighted: false,
              isFound: false,
            })),
        ]

        setData(updatedSortedData)
        setCollisions(remainingCollisions)
        setExplanation(
          `Elemento ${value} eliminado. Elemento ${firstCollision.value} movido desde colisiones y estructura reordenada`,
        )
        setDialogState({
          open: true,
          title: "Elemento eliminado y colisión resuelta",
          description: `El elemento ${value} ha sido eliminado. El elemento ${firstCollision.value} ha sido movido desde colisiones y la estructura ha sido reordenada.`,
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
        setExplanation(`Elemento ${value} eliminado de colisiones`)
        setDialogState({
          open: true,
          title: "Elemento eliminado de colisiones",
          description: `El elemento ${value} ha sido eliminado correctamente de colisiones.`,
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
      }

      // Añadir el nuevo valor y reordenar
      const nonEmptyItems = newData.filter((item) => item.value !== 0)
      nonEmptyItems.push({
        value: newValue,
        isHighlighted: false,
        isFound: false,
      })

      nonEmptyItems.sort((a, b) => a.value - b.value)

      // Rellenar con ceros al final
      const sortedData = [
        ...nonEmptyItems,
        ...Array(newData.length - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
      ]

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
      } else {
        setExplanation(
          `Comparando elemento en posición ${stepPosition + 1}: ${newData[stepPosition].value} no es igual a ${searchValue}`,
        )
      }
    } else if (currentStep === searchSteps.length - 1) {
      // Si estamos en el último paso y no se encontró el elemento
      const lastStepPosition = searchSteps[searchSteps.length - 1]
      if (data[lastStepPosition].value !== searchValue) {
        setDialogState({
          open: true,
          title: "Elemento no encontrado",
          description: `El elemento ${searchValue} no fue encontrado en la estructura después de revisar todos los elementos.`,
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
        isFound: false, // En pasos anteriores no hay "encontrado"
      }))

      setData(newData)
      setCurrentStep(prevStepIndex)

      // Actualizar explicación
      setExplanation(
        `Comparando elemento en posición ${stepPosition + 1}: ${newData[stepPosition].value} no es igual a ${searchValue}`,
      )
    } else if (currentStep === 0) {
      // Volver al estado inicial
      const resetData = data.map((item) => ({
        ...item,
        isHighlighted: false,
        isFound: false,
      }))

      setData(resetData)
      setCurrentStep(-1)
      setExplanation(`Iniciando búsqueda del valor ${searchValue}`)
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

  // Agrupar colisiones por índice
  const collisionsByIndex = collisions.reduce(
    (acc, collision) => {
      const index = collision.index === -1 ? "general" : collision.index
      if (!acc[index]) {
        acc[index] = []
      }
      acc[index].push(collision.value)
      return acc
    },
    {} as Record<string | number, number[]>,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda Lineal (Interna)</CardTitle>
          <CardDescription>
            La búsqueda lineal recorre secuencialmente cada elemento de la estructura hasta encontrar el valor buscado o
            llegar al final. Tamaño de clave configurado: {keySize} dígitos.
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
              <h3 className="text-sm font-medium mb-3">Estructura de datos</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {data.map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
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
              {Object.keys(collisionsByIndex).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Colisiones</h4>
                  <div className="space-y-2">
                    {Object.entries(collisionsByIndex).map(([index, values]) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          Colisiones índice {index === "general" ? "general" : Number(index) + 1}:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {values.map((value, i) => (
                            <div key={i} className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                              {value}
                            </div>
                          ))}
                        </div>
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
