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
  calculation?: string
}

interface DialogState {
  open: boolean
  title: string
  description: string
  type: "success" | "error" | "info"
}

export function ExternalHashSearch({ type }: { type: "mod" | "square" | "folding" | "truncation" | "base-change" }) {
  const [data, setData] = useState<DataItem[][]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [searchValue, setSearchValue] = useState<number | null>(null)
  const [searchSteps, setSearchSteps] = useState<{ bucket: number; index: number }[]>([])
  const [explanation, setExplanation] = useState<string>("")
  const [collisions, setCollisions] = useState<{ bucket: number; value: number; calculation: string }[]>([])
  const [numBuckets, setNumBuckets] = useState<number>(10)
  const [recordsPerBucket, setRecordsPerBucket] = useState<number>(5)
  const [baseValue, setBaseValue] = useState<number>(8)
  const [keySize, setKeySize] = useState<number>(4)
  const [structureCreated, setStructureCreated] = useState<boolean>(false)
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    title: "",
    description: "",
    type: "info",
  })

  // Inicializar con estructura vacía
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

  const createEmptyStructure = (_size?: number, buckets = 10, recordsPerBucket = 5, base?: number, newKeySize = 4) => {
    // Crear estructura de cubetas
    setNumBuckets(buckets)
    setRecordsPerBucket(recordsPerBucket)
    setKeySize(newKeySize)
    if (base) {
      setBaseValue(base)
    }

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

  // Función para convertir un número a otra base
  const convertToBase = (num: number, base: number): string => {
    if (base < 2 || base > 36) {
      throw new Error("La base debe estar entre 2 y 36")
    }
    return num.toString(base)
  }

  // Función hash según el tipo
  const hashFunction = (value: number): { bucket: number; calculation: string } => {
    switch (type) {
      case "mod":
        return {
          bucket: value % numBuckets,
          calculation: `${value} mod ${numBuckets} = ${value % numBuckets}`,
        }

      case "square":
        const squared = value * value
        const middleDigits = extractMiddleDigits(squared, 1)
        return {
          bucket: middleDigits % numBuckets,
          calculation: `${value}² = ${squared}, dígitos medios = ${middleDigits}, ${middleDigits} mod ${numBuckets} = ${middleDigits % numBuckets}`,
        }

      case "folding":
        // Dividir en grupos de 2 dígitos y sumar
        const digits = value.toString().padStart(4, "0")
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
          bucket: sum % numBuckets,
          calculation: `Plegamiento: ${groups.join(" + ")} = ${sum}, ${sum} mod ${numBuckets} = ${sum % numBuckets}`,
        }

      case "truncation":
        // Tomar los dígitos menos significativos
        const truncated = value % 100 // Tomar los últimos 2 dígitos
        return {
          bucket: truncated % numBuckets,
          calculation: `Truncamiento: últimos 2 dígitos de ${value} = ${truncated}, ${truncated} mod ${numBuckets} = ${truncated % numBuckets}`,
        }

      case "base-change":
        // Convertir a la base especificada y tomar los dígitos menos significativos
        const valueInBase = convertToBase(value, baseValue)
        const digitsNeeded = Math.ceil(Math.log(numBuckets) / Math.log(baseValue))
        const leastSignificantDigits = valueInBase.slice(-digitsNeeded)
        const leastSignificantInDecimal = Number.parseInt(leastSignificantDigits, baseValue)
        const bucket = leastSignificantInDecimal % numBuckets

        return {
          bucket,
          calculation: `${value} en base ${baseValue} = ${valueInBase}, últimos ${digitsNeeded} dígitos = ${leastSignificantDigits}, convertido a decimal = ${leastSignificantInDecimal}, mod ${numBuckets} = ${bucket}`,
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

    const { bucket, calculation } = hashFunction(value)
    const newData = [...data]

    // Buscar espacio libre en la cubeta
    const emptyIndex = newData[bucket].findIndex((item) => item.value === 0)

    if (emptyIndex !== -1) {
      // Hay espacio en la cubeta
      newData[bucket][emptyIndex] = {
        value,
        isHighlighted: false,
        isFound: false,
        calculation,
      }
      setData(newData)
      setExplanation(`Elemento ${value} insertado en cubeta ${bucket + 1}, posición ${emptyIndex + 1}. ${calculation}`)
      setDialogState({
        open: true,
        title: "Elemento insertado",
        description: `Elemento ${value} insertado en cubeta ${bucket + 1}, posición ${emptyIndex + 1}.\n${calculation}`,
        type: "success",
      })
    } else {
      // Cubeta llena, registrar colisión
      setCollisions([...collisions, { bucket, value, calculation }])
      setExplanation(`Cubeta ${bucket + 1} llena. ${calculation}. Elemento ${value} registrado como colisión.`)
      setDialogState({
        open: true,
        title: "Colisión detectada",
        description: `Cubeta ${bucket + 1} llena. ${calculation}. Elemento ${value} ha sido registrado como colisión.`,
        type: "info",
      })
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

    // Calcular cubeta
    const { bucket, calculation } = hashFunction(value)

    // Generar pasos de búsqueda
    const steps: { bucket: number; index: number }[] = []

    // Buscar en la cubeta correspondiente
    for (let i = 0; i < data[bucket].length; i++) {
      steps.push({ bucket, index: i })
      if (data[bucket][i].value === value) {
        break // Encontramos el valor
      }
    }

    setSearchSteps(steps)
    setCurrentStep(-1)

    if (steps.length > 0) {
      setExplanation(`Iniciando búsqueda del valor ${value} en cubeta ${bucket + 1}. ${calculation}`)
    } else {
      setExplanation(`No hay elementos en la cubeta ${bucket + 1} para buscar el valor ${value}. ${calculation}`)
      setDialogState({
        open: true,
        title: "Búsqueda no iniciada",
        description: `No hay elementos en la cubeta ${bucket + 1} para buscar el valor ${value}. ${calculation}`,
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

    const { bucket } = hashFunction(value)
    const newData = [...data]

    // Buscar el elemento en la cubeta
    const index = newData[bucket].findIndex((item) => item.value === value)

    if (index !== -1) {
      // Elemento encontrado en la cubeta, eliminar
      newData[bucket][index] = {
        value: 0,
        isHighlighted: false,
        isFound: false,
      }

      // Reordenar la cubeta (compactar)
      const nonEmptyItems = newData[bucket].filter((item) => item.value !== 0)
      const emptyItems = Array(recordsPerBucket - nonEmptyItems.length)
        .fill(null)
        .map(() => ({
          value: 0,
          isHighlighted: false,
          isFound: false,
        }))

      newData[bucket] = [...nonEmptyItems, ...emptyItems]
      setData(newData)

      // Verificar si hay colisiones que puedan ocupar este espacio
      const collisionIndex = collisions.findIndex((item) => item.bucket === bucket)
      if (collisionIndex !== -1) {
        const [collision, ...remainingCollisions] = collisions.filter((item) => item.bucket === bucket)

        // Insertar desde colisiones
        newData[bucket][nonEmptyItems.length] = {
          value: collision.value,
          isHighlighted: false,
          isFound: false,
          calculation: collision.calculation,
        }

        // Actualizar colisiones
        setCollisions([...collisions.filter((item) => item.bucket !== bucket), ...remainingCollisions])

        setExplanation(
          `Elemento ${value} eliminado. Elemento ${collision.value} movido desde colisiones a la cubeta ${bucket + 1}.`,
        )
        setDialogState({
          open: true,
          title: "Elemento eliminado y colisión resuelta",
          description: `Elemento ${value} eliminado. Elemento ${collision.value} movido desde colisiones a la cubeta ${bucket + 1}.`,
          type: "success",
        })
      } else {
        setExplanation(`Elemento ${value} eliminado de la cubeta ${bucket + 1}.`)
        setDialogState({
          open: true,
          title: "Elemento eliminado",
          description: `El elemento ${value} ha sido eliminado de la cubeta ${bucket + 1}.`,
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

    // Primero eliminamos el valor antiguo
    deleteElement(oldValue)
    // Luego insertamos el nuevo valor
    insertElement(newValue)
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
        setExplanation(`¡Elemento ${searchValue} encontrado en cubeta ${bucket + 1}, posición ${index + 1}!`)
        setDialogState({
          open: true,
          title: "Elemento encontrado",
          description: `¡El elemento ${searchValue} ha sido encontrado en cubeta ${bucket + 1}, posición ${index + 1}!`,
          type: "success",
        })
      } else if (newData[bucket][index].value === 0) {
        setExplanation(`Posición ${index + 1} en cubeta ${bucket + 1} vacía. El elemento ${searchValue} no existe.`)
        setDialogState({
          open: true,
          title: "Elemento no encontrado",
          description: `Posición ${index + 1} en cubeta ${bucket + 1} vacía. El elemento ${searchValue} no existe.`,
          type: "error",
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
          isFound: false,
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

      const { bucket, calculation } = hashFunction(searchValue || 0)
      setExplanation(`Iniciando búsqueda del valor ${searchValue} en cubeta ${bucket + 1}. ${calculation}`)
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

  // Título y descripción según el tipo de hash
  const getTitle = () => {
    switch (type) {
      case "mod":
        return "Hash Mod (Externa)"
      case "square":
        return "Hash Cuadrado (Externa)"
      case "folding":
        return "Hash Plegamiento (Externa)"
      case "truncation":
        return "Hash Truncamiento (Externa)"
      case "base-change":
        return "Hash Cambio de Base (Externa)"
    }
  }

  const getDescription = () => {
    switch (type) {
      case "mod":
        return "La función hash mod calcula el residuo de la división del valor por el tamaño de la tabla para determinar la cubeta."
      case "square":
        return "La función hash cuadrado eleva al cuadrado el valor y toma los dígitos centrales para determinar la cubeta."
      case "folding":
        return "La función hash plegamiento divide el valor en grupos, los suma y calcula el módulo para determinar la cubeta."
      case "truncation":
        return "La función hash truncamiento toma solo algunos dígitos específicos del valor para determinar la cubeta."
      case "base-change":
        return "La función hash cambio de base convierte el valor a otra base numérica y toma los dígitos menos significativos para determinar la cubeta."
    }
  }

  // Agrupar colisiones por cubeta
  const collisionsByBucket = collisions.reduce(
    (acc, collision) => {
      if (!acc[collision.bucket]) {
        acc[collision.bucket] = []
      }
      acc[collision.bucket].push(collision.value)
      return acc
    },
    {} as Record<number, number[]>,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
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
              isBaseChangeHash={type === "base-change"}
              keySize={keySize}
              onKeySizeChange={setKeySize}
            />

            {/* Visualización de la estructura */}
            {structureCreated && (
              <div className="border rounded-lg p-4 bg-marfil/50">
                <h3 className="text-sm font-medium mb-3">Estructura de Cubetas</h3>
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
                                  {item.value === 0
                                    ? `Cubeta ${bucketIdx + 1}, Posición ${itemIdx + 1}: Vacío`
                                    : `Cubeta ${bucketIdx + 1}, Posición ${itemIdx + 1}: ${item.value}${
                                        item.calculation ? `\n${item.calculation}` : ""
                                      }`}
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
                      {Object.entries(collisionsByBucket).map(([bucketStr, values]) => {
                        const bucketIdx = Number.parseInt(bucketStr)
                        return (
                          <div key={bucketIdx} className="flex items-center gap-2">
                            <div className="text-sm font-medium">Colisiones cubeta {bucketIdx + 1}:</div>
                            <div className="flex flex-wrap gap-2">
                              {values.map((value, i) => (
                                <TooltipProvider key={i}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                                        {value}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {collisions.find((c) => c.value === value && c.bucket === bucketIdx)
                                        ?.calculation || ""}
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
