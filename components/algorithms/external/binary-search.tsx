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

interface SearchStep {
  bucket: number
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

export function ExternalBinarySearch() {
  const [data, setData] = useState<DataItem[][]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [searchValue, setSearchValue] = useState<number | null>(null)
  const [searchSteps, setSearchSteps] = useState<SearchStep[]>([])
  const [explanation, setExplanation] = useState<string>("")
  const [collisions, setCollisions] = useState<{ bucket: number; value: number }[]>([])
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    type: "info",
  })
  const [numBuckets, setNumBuckets] = useState<number>(3)
  const [recordsPerBucket, setRecordsPerBucket] = useState<number>(5)
  const [keySize, setKeySize] = useState<number>(4)
  const [structureCreated, setStructureCreated] = useState<boolean>(false)

  // Inicializar con algunos datos
  useEffect(() => {
    createEmptyStructure()
  }, [])

  const validateKeySize = (value: number): boolean => {
    const valueStr = value.toString()
    if (valueStr.length !== keySize) {
      setDialogState({
        open: true,
        title: "Tamaño de clave incorrecto",
        description: `La clave debe tener exactamente ${keySize} dígitos. El valor ingresado tiene ${valueStr.length} dígitos.`,
        type: "error",
      })
      return false
    }
    return true
  }

  const createEmptyStructure = (_size?: number, buckets = 3, recordsPerBucket = 5, _base?: number, newKeySize = 4) => {
    // Crear el número especificado de cubetas con el número especificado de registros cada una
    setNumBuckets(buckets)
    setRecordsPerBucket(recordsPerBucket)
    setKeySize(newKeySize)

    const emptyData = Array(buckets)
      .fill(null)
      .map(() =>
        Array(recordsPerBucket)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          })),
      )
    setData(emptyData)
    setCurrentStep(-1)
    setSearchSteps([])
    setSearchValue(null)
    setExplanation("")
    setCollisions([])
    setStructureCreated(true)
  }

  const insertElement = (value: number) => {
    if (!structureCreated) {
      setDialogState({
        open: true,
        title: "Estructura no creada",
        description: "Por favor, cree la estructura primero antes de insertar elementos.",
        type: "error",
      })
      return
    }

    if (!validateKeySize(value)) {
      return
    }

    // Para búsqueda binaria externa, necesitamos mantener los bloques ordenados
    const newData = [...data]

    // Primero, verificamos si el valor ya existe en alguna cubeta
    for (let bucketIdx = 0; bucketIdx < newData.length; bucketIdx++) {
      if (newData[bucketIdx].some((item) => item.value === value)) {
        setExplanation(`El elemento ${value} ya existe en la cubeta ${bucketIdx + 1}`)
        setDialogState({
          open: true,
          title: "Elemento duplicado",
          description: `El elemento ${value} ya existe en la cubeta ${bucketIdx + 1}.`,
          type: "error",
        })
        return
      }
    }

    // Encontrar la cubeta adecuada (simplificado: primera cubeta con espacio)
    let targetBucket = -1
    let targetIndex = -1

    for (let bucketIdx = 0; bucketIdx < newData.length; bucketIdx++) {
      // Verificar si hay espacio en esta cubeta
      const emptyIndex = newData[bucketIdx].findIndex((item) => item.value === 0)

      if (emptyIndex !== -1) {
        targetBucket = bucketIdx
        targetIndex = emptyIndex
        break
      }
    }

    if (targetBucket !== -1) {
      // Insertar el valor
      newData[targetBucket][targetIndex] = {
        value,
        isHighlighted: false,
        isFound: false,
      }

      // Ordenar la cubeta
      const nonEmptyItems = newData[targetBucket].filter((item) => item.value !== 0)
      nonEmptyItems.sort((a, b) => a.value - b.value)

      const emptyItems = Array(newData[targetBucket].length - nonEmptyItems.length)
        .fill(null)
        .map(() => ({
          value: 0,
          isHighlighted: false,
          isFound: false,
        }))

      newData[targetBucket] = [...nonEmptyItems, ...emptyItems]

      setData(newData)
      setExplanation(`Elemento ${value} insertado en la cubeta ${targetBucket + 1} y ordenado`)
      setDialogState({
        open: true,
        title: "Elemento insertado",
        description: `El elemento ${value} ha sido insertado en la cubeta ${targetBucket + 1} y ordenado.`,
        type: "success",
      })
    } else {
      // Si no hay espacio en ninguna cubeta, crear una nueva cubeta
      if (newData.length < 10) {
        // Límite arbitrario de cubetas
        const newBucket = Array(recordsPerBucket)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          }))

        newBucket[0] = {
          value,
          isHighlighted: false,
          isFound: false,
        }

        newData.push(newBucket)
        setNumBuckets(newData.length)
        setData(newData)
        setExplanation(`Nueva cubeta creada. Elemento ${value} insertado en la cubeta ${newData.length}`)
        setDialogState({
          open: true,
          title: "Nueva cubeta creada",
          description: `Se ha creado una nueva cubeta. El elemento ${value} ha sido insertado en la cubeta ${newData.length}.`,
          type: "success",
        })
      } else {
        // Si no se pueden crear más cubetas, registrar como colisión
        setCollisions([...collisions, { bucket: -1, value }])
        setExplanation(`No hay espacio disponible. Elemento ${value} registrado como colisión.`)
        setDialogState({
          open: true,
          title: "No hay espacio disponible",
          description: `No hay espacio disponible. El elemento ${value} ha sido registrado como colisión.`,
          type: "info",
        })
      }
    }
  }

  const searchElement = (value: number) => {
    if (!structureCreated) {
      setDialogState({
        open: true,
        title: "Estructura no creada",
        description: "Por favor, cree la estructura primero antes de buscar elementos.",
        type: "error",
      })
      return
    }

    if (!validateKeySize(value)) {
      return
    }

    setSearchValue(value)

    // Resetear estados previos
    const resetData = data.map((bucket) =>
      bucket.map((item) => ({
        ...item,
        isHighlighted: false,
        isFound: false,
      })),
    )
    setData(resetData)

    // Generar pasos de búsqueda binaria por cubetas
    const steps: SearchStep[] = []

    // Simplificación: buscar en cada cubeta usando búsqueda binaria
    for (let bucketIdx = 0; bucketIdx < data.length; bucketIdx++) {
      // Verificar si hay elementos en esta cubeta
      const nonEmptyItems = data[bucketIdx].filter((item) => item.value !== 0)

      if (nonEmptyItems.length > 0) {
        // Verificar si el valor está en el rango de esta cubeta
        const minValue = nonEmptyItems[0].value
        const maxValue = nonEmptyItems[nonEmptyItems.length - 1].value

        if (value >= minValue && value <= maxValue) {
          // Realizar búsqueda binaria en esta cubeta
          let left = 0
          let right = nonEmptyItems.length - 1
          let found = false

          while (left <= right) {
            const mid = Math.floor((left + right) / 2)
            const comparison = `${nonEmptyItems[mid].value} ${nonEmptyItems[mid].value === value ? "=" : nonEmptyItems[mid].value < value ? "<" : ">"} ${value}`

            steps.push({
              bucket: bucketIdx,
              left,
              right,
              mid,
              comparison,
            })

            if (nonEmptyItems[mid].value === value) {
              found = true
              break
            } else if (nonEmptyItems[mid].value < value) {
              left = mid + 1
            } else {
              right = mid - 1
            }
          }

          if (found) break // Si encontramos el valor, no buscar en más cubetas
        }
      }
    }

    setSearchSteps(steps)
    setCurrentStep(-1)

    if (steps.length > 0) {
      setExplanation(`Iniciando búsqueda binaria del valor ${value} por cubetas`)
    } else {
      setExplanation(`No hay cubetas que contengan el valor ${value}`)
      setDialogState({
        open: true,
        title: "Búsqueda no iniciada",
        description: `No hay cubetas que contengan el valor ${value}.`,
        type: "error",
      })
    }
  }

  const deleteElement = (value: number) => {
    if (!structureCreated) {
      setDialogState({
        open: true,
        title: "Estructura no creada",
        description: "Por favor, cree la estructura primero antes de eliminar elementos.",
        type: "error",
      })
      return
    }

    if (!validateKeySize(value)) {
      return
    }

    const newData = [...data]
    let deleted = false

    // Buscar el elemento en todas las cubetas
    for (let bucketIdx = 0; bucketIdx < newData.length; bucketIdx++) {
      const index = newData[bucketIdx].findIndex((item) => item.value === value)

      if (index !== -1) {
        // Elemento encontrado, eliminar
        newData[bucketIdx][index] = {
          value: 0,
          isHighlighted: false,
          isFound: false,
        }

        // Reordenar la cubeta (compactar)
        const nonEmptyItems = newData[bucketIdx].filter((item) => item.value !== 0)
        nonEmptyItems.sort((a, b) => a.value - b.value)

        const emptyItems = Array(newData[bucketIdx].length - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          }))

        newData[bucketIdx] = [...nonEmptyItems, ...emptyItems]
        setData(newData)

        setExplanation(`Elemento ${value} eliminado de la cubeta ${bucketIdx + 1} y reordenado`)
        setDialogState({
          open: true,
          title: "Elemento eliminado",
          description: `El elemento ${value} ha sido eliminado de la cubeta ${bucketIdx + 1} y reordenado.`,
          type: "success",
        })
        deleted = true

        // Verificar si hay colisiones que puedan ocupar este espacio
        if (collisions.length > 0) {
          const [firstCollision, ...remainingCollisions] = collisions

          // Insertar desde colisiones y ordenar
          const updatedItems = [
            ...nonEmptyItems,
            {
              value: firstCollision.value,
              isHighlighted: false,
              isFound: false,
            },
          ]

          updatedItems.sort((a, b) => a.value - b.value)

          const updatedEmptyItems = Array(newData[bucketIdx].length - updatedItems.length)
            .fill(null)
            .map(() => ({
              value: 0,
              isHighlighted: false,
              isFound: false,
            }))

          newData[bucketIdx] = [...updatedItems, ...updatedEmptyItems]

          setCollisions(remainingCollisions)
          setExplanation(
            `Elemento ${value} eliminado. Elemento ${firstCollision.value} movido desde colisiones a la cubeta ${bucketIdx + 1} y ordenado.`,
          )
          setDialogState({
            open: true,
            title: "Elemento eliminado y colisión resuelta",
            description: `Elemento ${value} eliminado. Elemento ${firstCollision.value} movido desde colisiones a la cubeta ${bucketIdx + 1} y ordenado.`,
            type: "success",
          })
        }

        break
      }
    }

    if (!deleted) {
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
        deleted = true
      }
    }

    if (!deleted) {
      setExplanation(`Elemento ${value} no encontrado`)
      setDialogState({
        open: true,
        title: "Elemento no encontrado",
        description: `El elemento ${value} no existe en la estructura.`,
        type: "error",
      })
    }
  }

  const modifyElement = (oldValue: number, newValue: number) => {
    if (!structureCreated) {
      setDialogState({
        open: true,
        title: "Estructura no creada",
        description: "Por favor, cree la estructura primero antes de modificar elementos.",
        type: "error",
      })
      return
    }

    if (!validateKeySize(oldValue) || !validateKeySize(newValue)) {
      return
    }

    // Para búsqueda binaria, modificar implica eliminar y volver a insertar para mantener el orden
    deleteElement(oldValue)
    insertElement(newValue)
  }

  const nextStep = () => {
    if (currentStep < searchSteps.length - 1) {
      const nextStepIndex = currentStep + 1
      const step = searchSteps[nextStepIndex]

      // Actualizar visualización
      const newData = data.map((bucketData, bucketIdx) =>
        bucketData.map((item, itemIdx) => {
          // Filtrar elementos no vacíos para calcular índices reales
          const nonEmptyItems = bucketData.filter((i) => i.value !== 0)
          const isInRange =
            bucketIdx === step.bucket && itemIdx < nonEmptyItems.length && itemIdx >= step.left && itemIdx <= step.right

          const isMid = bucketIdx === step.bucket && itemIdx < nonEmptyItems.length && itemIdx === step.mid

          const isFound = isMid && item.value === searchValue

          return {
            ...item,
            isHighlighted: isInRange,
            isFound: isFound,
          }
        }),
      )

      setData(newData)
      setCurrentStep(nextStepIndex)

      // Actualizar explicación
      setExplanation(
        `Paso ${nextStepIndex + 1}: Cubeta ${step.bucket + 1}, buscando entre posiciones ${step.left + 1} y ${step.right + 1}. Medio en ${step.mid + 1}. ${step.comparison}`,
      )

      // Si encontramos el valor, mostrar diálogo
      if (step.comparison.includes("=")) {
        setDialogState({
          open: true,
          title: "Elemento encontrado",
          description: `¡El elemento ${searchValue} ha sido encontrado en la cubeta ${step.bucket + 1}, posición ${step.mid + 1}!`,
          type: "success",
        })
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1
      const step = searchSteps[prevStepIndex]

      // Actualizar visualización
      const newData = data.map((bucketData, bucketIdx) =>
        bucketData.map((item, itemIdx) => {
          // Filtrar elementos no vacíos para calcular índices reales
          const nonEmptyItems = bucketData.filter((i) => i.value !== 0)
          const isInRange =
            bucketIdx === step.bucket && itemIdx < nonEmptyItems.length && itemIdx >= step.left && itemIdx <= step.right

          const isMid = bucketIdx === step.bucket && itemIdx < nonEmptyItems.length && itemIdx === step.mid

          return {
            ...item,
            isHighlighted: isInRange,
            isFound: false, // En pasos anteriores no hay "encontrado"
          }
        }),
      )

      setData(newData)
      setCurrentStep(prevStepIndex)

      // Actualizar explicación
      setExplanation(
        `Paso ${prevStepIndex + 1}: Cubeta ${step.bucket + 1}, buscando entre posiciones ${step.left + 1} y ${step.right + 1}. Medio en ${step.mid + 1}. ${step.comparison}`,
      )
    } else if (currentStep === 0) {
      // Volver al estado inicial
      const resetData = data.map((bucket) =>
        bucket.map((item) => ({
          ...item,
          isHighlighted: false,
          isFound: false,
        })),
      )

      setData(resetData)
      setCurrentStep(-1)
      setExplanation(`Iniciando búsqueda binaria del valor ${searchValue} por cubetas`)
    }
  }

  const resetSearch = () => {
    // Resetear la visualización
    const resetData = data.map((bucket) =>
      bucket.map((item) => ({
        ...item,
        isHighlighted: false,
        isFound: false,
      })),
    )

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

  // Agrupar colisiones por cubeta
  const collisionsByBucket = collisions.reduce(
    (acc, collision) => {
      const bucket = collision.bucket === -1 ? "general" : collision.bucket
      if (!acc[bucket]) {
        acc[bucket] = []
      }
      acc[bucket].push(collision.value)
      return acc
    },
    {} as Record<string | number, number[]>,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda Binaria (Externa)</CardTitle>
          <CardDescription>
            La búsqueda binaria externa aplica el algoritmo de búsqueda binaria en cubetas ordenadas de datos.
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
              isExternalSearch={true}
              keySize={keySize}
              onKeySizeChange={setKeySize}
            />

            {/* Visualización de la estructura */}
            {structureCreated && (
              <div className="border rounded-lg p-4 bg-marfil/50">
                <h3 className="text-sm font-medium mb-3">Estructura de cubetas ordenadas</h3>
                <div className="space-y-4">
                  {data.map((bucket, bucketIdx) => (
                    <div key={bucketIdx} className="border border-slate/10 rounded-md p-3">
                      <div className="text-xs font-medium mb-2">Cubeta {bucketIdx + 1}</div>
                      <div className="flex flex-wrap gap-2">
                        {bucket.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex flex-col items-center">
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
                                  Cubeta {bucketIdx + 1}, Posición {itemIdx + 1}:{" "}
                                  {item.value === 0 ? "Vacío" : item.value}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="text-xs mt-1">{itemIdx + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Colisiones */}
                {Object.keys(collisionsByBucket).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Colisiones</h4>
                    <div className="space-y-2">
                      {Object.entries(collisionsByBucket).map(([bucket, values]) => (
                        <div key={bucket} className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            Colisiones cubeta {bucket === "general" ? "general" : Number(bucket) + 1}:
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
            )}
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
