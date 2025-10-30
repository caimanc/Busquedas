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

export function ExternalLinearSearch() {
  const [data, setData] = useState<DataItem[][]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [searchValue, setSearchValue] = useState<number | null>(null)
  const [searchSteps, setSearchSteps] = useState<{ bucket: number; index: number }[]>([])
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

    // Buscar la primera cubeta con espacio disponible
    const newData = [...data]
    let inserted = false

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

    for (let bucketIdx = 0; bucketIdx < newData.length; bucketIdx++) {
      const emptyIndex = newData[bucketIdx].findIndex((item) => item.value === 0)

      if (emptyIndex !== -1) {
        newData[bucketIdx][emptyIndex] = {
          value,
          isHighlighted: false,
          isFound: false,
        }

        // Ordenar los elementos dentro de la cubeta (excluyendo los valores 0)
        const nonEmptyItems = newData[bucketIdx].filter((item) => item.value !== 0)
        nonEmptyItems.sort((a, b) => a.value - b.value)

        // Rellenar con ceros al final
        const sortedBucket = [
          ...nonEmptyItems,
          ...Array(recordsPerBucket - nonEmptyItems.length)
            .fill(null)
            .map(() => ({
              value: 0,
              isHighlighted: false,
              isFound: false,
            })),
        ]

        newData[bucketIdx] = sortedBucket
        setData(newData)
        setExplanation(`Elemento ${value} insertado en la cubeta ${bucketIdx + 1} y ordenado`)
        setDialogState({
          open: true,
          title: "Elemento insertado",
          description: `El elemento ${value} ha sido insertado en la cubeta ${bucketIdx + 1} y la cubeta ha sido ordenada.`,
          type: "success",
        })
        inserted = true
        break
      }
    }

    if (!inserted) {
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
          title: "Colisión detectada",
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

    // Generar pasos de búsqueda (en búsqueda lineal externa, recorremos todos los bloques)
    const steps: { bucket: number; index: number }[] = []

    // Recorrer cada cubeta
    for (let bucketIdx = 0; bucketIdx < data.length; bucketIdx++) {
      // Verificar si la cubeta tiene el rango de valores que incluye al valor buscado
      const nonEmptyItems = data[bucketIdx].filter((item) => item.value !== 0)

      if (nonEmptyItems.length > 0) {
        const minValue = nonEmptyItems[0].value
        const maxValue = nonEmptyItems[nonEmptyItems.length - 1].value

        // Si el valor está en el rango de esta cubeta, buscar en ella
        if (value >= minValue && value <= maxValue) {
          // Recorrer cada elemento de la cubeta
          for (let itemIdx = 0; itemIdx < data[bucketIdx].length; itemIdx++) {
            if (data[bucketIdx][itemIdx].value !== 0) {
              // Solo consideramos posiciones ocupadas
              steps.push({ bucket: bucketIdx, index: itemIdx })
              if (data[bucketIdx][itemIdx].value === value) {
                break // Encontramos el valor, terminamos esta cubeta
              }
            }
          }
        }
      }
    }

    setSearchSteps(steps)
    setCurrentStep(-1)

    if (steps.length > 0) {
      setExplanation(`Iniciando búsqueda del valor ${value}`)
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

        // Compactar la cubeta (mover elementos hacia adelante)
        const nonEmptyItems = newData[bucketIdx].filter((item) => item.value !== 0)
        nonEmptyItems.sort((a, b) => a.value - b.value) // Mantener ordenados

        const emptyItems = Array(newData[bucketIdx].length - nonEmptyItems.length)
          .fill(null)
          .map(() => ({
            value: 0,
            isHighlighted: false,
            isFound: false,
          }))

        newData[bucketIdx] = [...nonEmptyItems, ...emptyItems]
        setData(newData)

        setExplanation(`Elemento ${value} eliminado de la cubeta ${bucketIdx + 1}, posición ${index + 1}`)
        setDialogState({
          open: true,
          title: "Elemento eliminado",
          description: `El elemento ${value} ha sido eliminado de la cubeta ${bucketIdx + 1}, posición ${index + 1}.`,
          type: "success",
        })
        deleted = true

        // Verificar si hay colisiones que puedan ocupar este espacio
        if (collisions.length > 0) {
          const [firstCollision, ...remainingCollisions] = collisions

          // Insertar desde colisiones
          newData[bucketIdx][nonEmptyItems.length] = {
            value: firstCollision.value,
            isHighlighted: false,
            isFound: false,
          }

          // Reordenar después de insertar
          const updatedNonEmptyItems = newData[bucketIdx].filter((item) => item.value !== 0)
          updatedNonEmptyItems.sort((a, b) => a.value - b.value)

          const updatedEmptyItems = Array(newData[bucketIdx].length - updatedNonEmptyItems.length)
            .fill(null)
            .map(() => ({
              value: 0,
              isHighlighted: false,
              isFound: false,
            }))

          newData[bucketIdx] = [...updatedNonEmptyItems, ...updatedEmptyItems]

          setCollisions(remainingCollisions)
          setExplanation(
            `Elemento ${value} eliminado. Elemento ${firstCollision.value} movido desde colisiones a la cubeta ${bucketIdx + 1}.`,
          )
          setDialogState({
            open: true,
            title: "Elemento eliminado y colisión resuelta",
            description: `El elemento ${value} ha sido eliminado. El elemento ${firstCollision.value} ha sido movido desde colisiones a la cubeta ${bucketIdx + 1}.`,
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

    const newData = [...data]
    let modified = false

    // Buscar el elemento en todas las cubetas
    for (let bucketIdx = 0; bucketIdx < newData.length; bucketIdx++) {
      const index = newData[bucketIdx].findIndex((item) => item.value === oldValue)

      if (index !== -1) {
        // Elemento encontrado, eliminar
        newData[bucketIdx][index] = {
          value: 0,
          isHighlighted: false,
          isFound: false,
        }

        // Añadir el nuevo valor y reordenar
        const nonEmptyItems = newData[bucketIdx].filter((item) => item.value !== 0)
        nonEmptyItems.push({
          value: newValue,
          isHighlighted: false,
          isFound: false,
        })

        nonEmptyItems.sort((a, b) => a.value - b.value)

        // Rellenar con ceros al final
        const sortedBucket = [
          ...nonEmptyItems,
          ...Array(recordsPerBucket - nonEmptyItems.length)
            .fill(null)
            .map(() => ({
              value: 0,
              isHighlighted: false,
              isFound: false,
            })),
        ]

        newData[bucketIdx] = sortedBucket
        setData(newData)
        setExplanation(`Elemento ${oldValue} modificado a ${newValue} en la cubeta ${bucketIdx + 1} y reordenado`)
        setDialogState({
          open: true,
          title: "Elemento modificado",
          description: `El elemento ${oldValue} ha sido modificado a ${newValue} en la cubeta ${bucketIdx + 1} y la cubeta ha sido reordenada.`,
          type: "success",
        })
        modified = true
        break
      }
    }

    if (!modified) {
      // Verificar si está en colisiones
      const collisionIndex = collisions.findIndex((item) => item.value === oldValue)
      if (collisionIndex !== -1) {
        const newCollisions = [...collisions]
        newCollisions[collisionIndex] = { bucket: -1, value: newValue }
        setCollisions(newCollisions)
        setExplanation(`Elemento ${oldValue} modificado a ${newValue} en colisiones`)
        setDialogState({
          open: true,
          title: "Elemento modificado en colisiones",
          description: `El elemento ${oldValue} ha sido modificado a ${newValue} en colisiones.`,
          type: "success",
        })
        modified = true
      }
    }

    if (!modified) {
      setExplanation(`Elemento ${oldValue} no encontrado`)
      setDialogState({
        open: true,
        title: "Elemento no encontrado",
        description: `El elemento ${oldValue} no existe en la estructura.`,
        type: "error",
      })
    }
  }

  const nextStep = () => {
    if (currentStep < searchSteps.length - 1) {
      const nextStepIndex = currentStep + 1
      const { bucket, index } = searchSteps[nextStepIndex]

      // Actualizar visualización
      const newData = data.map((bucketData, bucketIdx) =>
        bucketData.map((item, itemIdx) => ({
          ...item,
          isHighlighted: bucketIdx === bucket && itemIdx === index,
          isFound: bucketIdx === bucket && itemIdx === index && item.value === searchValue,
        })),
      )

      setData(newData)
      setCurrentStep(nextStepIndex)

      // Actualizar explicación
      if (newData[bucket][index].value === searchValue) {
        setExplanation(`¡Elemento ${searchValue} encontrado en la cubeta ${bucket + 1}, posición ${index + 1}!`)
        setDialogState({
          open: true,
          title: "Elemento encontrado",
          description: `¡El elemento ${searchValue} ha sido encontrado en la cubeta ${bucket + 1}, posición ${index + 1}!`,
          type: "success",
        })
      } else {
        setExplanation(
          `Comparando elemento en cubeta ${bucket + 1}, posición ${index + 1}: ${newData[bucket][index].value} != ${searchValue}`,
        )
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1
      const { bucket, index } = searchSteps[prevStepIndex]

      // Actualizar visualización
      const newData = data.map((bucketData, bucketIdx) =>
        bucketData.map((item, itemIdx) => ({
          ...item,
          isHighlighted: bucketIdx === bucket && itemIdx === index,
          isFound: false, // En pasos anteriores no hay "encontrado"
        })),
      )

      setData(newData)
      setCurrentStep(prevStepIndex)

      // Actualizar explicación
      setExplanation(
        `Comparando elemento en cubeta ${bucket + 1}, posición ${index + 1}: ${newData[bucket][index].value} != ${searchValue}`,
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
      setExplanation(`Iniciando búsqueda del valor ${searchValue}`)
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
          <CardTitle>Búsqueda Lineal (Externa)</CardTitle>
          <CardDescription>
            La búsqueda lineal externa recorre secuencialmente cada cubeta y elemento hasta encontrar el valor buscado o
            llegar al final.
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
                <h3 className="text-sm font-medium mb-3">Estructura de cubetas</h3>
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
