"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface AlgorithmControlsProps {
  onNextStep: () => void
  onPrevStep: () => void
  onReset: () => void
  onSave: () => void
  onInsert: (value: number) => void
  onSearch: (value: number) => void
  onDelete: (value: number) => void
  onModify: (oldValue: number, newValue: number) => void
  onCreateEmpty: (size?: number, buckets?: number, recordsPerBucket?: number, base?: number, keySize?: number) => void
  disablePrev?: boolean
  disableNext?: boolean
  isExternalSearch?: boolean
  isHashAlgorithm?: boolean
  isBaseChangeHash?: boolean
  keySize?: number
  onKeySizeChange?: (keySize: number) => void
}

export function AlgorithmControls({
  onNextStep,
  onPrevStep,
  onReset,
  onSave,
  onInsert,
  onSearch,
  onDelete,
  onModify,
  onCreateEmpty,
  disablePrev = false,
  disableNext = false,
  isExternalSearch = false,
  isHashAlgorithm = false,
  isBaseChangeHash = false,
  keySize = 4,
  onKeySizeChange,
}: AlgorithmControlsProps) {
  const [insertValue, setInsertValue] = useState("")
  const [searchValue, setSearchValue] = useState("")
  const [deleteValue, setDeleteValue] = useState("")
  const [oldValue, setOldValue] = useState("")
  const [newValue, setNewValue] = useState("")
  const [structureSize, setStructureSize] = useState(10)
  const [buckets, setBuckets] = useState(10)
  const [recordsPerBucket, setRecordsPerBucket] = useState(5)
  const [baseValue, setBaseValue] = useState(8)

  const handleInsert = () => {
    const value = Number.parseInt(insertValue)
    if (!isNaN(value)) {
      onInsert(value)
      setInsertValue("")
    }
  }

  const handleSearch = () => {
    const value = Number.parseInt(searchValue)
    if (!isNaN(value)) {
      onSearch(value)
      setSearchValue("")
    }
  }

  const handleDelete = () => {
    const value = Number.parseInt(deleteValue)
    if (!isNaN(value)) {
      onDelete(value)
      setDeleteValue("")
    }
  }

  const handleModify = () => {
    const oldVal = Number.parseInt(oldValue)
    const newVal = Number.parseInt(newValue)
    if (!isNaN(oldVal) && !isNaN(newVal)) {
      onModify(oldVal, newVal)
      setOldValue("")
      setNewValue("")
    }
  }

  const handleCreateEmpty = () => {
    if (isExternalSearch) {
      onCreateEmpty(undefined, buckets, recordsPerBucket, isBaseChangeHash ? baseValue : undefined, keySize)
    } else {
      onCreateEmpty(structureSize, undefined, undefined, isBaseChangeHash ? baseValue : undefined, keySize)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Configuración de estructura */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isExternalSearch ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="buckets">Número de cubetas</Label>
                  <Input
                    id="buckets"
                    type="number"
                    value={buckets}
                    onChange={(e) => setBuckets(Number.parseInt(e.target.value) || 10)}
                    min="1"
                    max="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recordsPerBucket">Registros por cubeta</Label>
                  <Input
                    id="recordsPerBucket"
                    type="number"
                    value={recordsPerBucket}
                    onChange={(e) => setRecordsPerBucket(Number.parseInt(e.target.value) || 5)}
                    min="1"
                    max="10"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="structureSize">Tamaño de estructura</Label>
                <Input
                  id="structureSize"
                  type="number"
                  value={structureSize}
                  onChange={(e) => setStructureSize(Number.parseInt(e.target.value) || 10)}
                  min="1"
                  max="20"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="keySize">Tamaño de clave (dígitos) *</Label>
              <Input
                id="keySize"
                type="number"
                value={keySize}
                onChange={(e) => onKeySizeChange?.(Number.parseInt(e.target.value) || 4)}
                min="1"
                max="10"
                required
              />
            </div>

            {isBaseChangeHash && (
              <div className="space-y-2">
                <Label htmlFor="baseValue">Base numérica</Label>
                <Input
                  id="baseValue"
                  type="number"
                  value={baseValue}
                  onChange={(e) => setBaseValue(Number.parseInt(e.target.value) || 8)}
                  min="2"
                  max="16"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Crear estructura</Label>
              <Button onClick={handleCreateEmpty} variant="outline" className="w-full bg-transparent">
                Crear Vacía
              </Button>
            </div>
          </div>

          {/* Operaciones CRUD */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insertValue">Insertar</Label>
              <div className="flex gap-2">
                <Input
                  id="insertValue"
                  value={insertValue}
                  onChange={(e) => setInsertValue(e.target.value)}
                  placeholder={`${keySize} dígitos`}
                />
                <Button onClick={handleInsert} disabled={!insertValue}>
                  Insertar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchValue">Buscar</Label>
              <div className="flex gap-2">
                <Input
                  id="searchValue"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={`${keySize} dígitos`}
                />
                <Button onClick={handleSearch} disabled={!searchValue}>
                  Buscar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deleteValue">Eliminar</Label>
              <div className="flex gap-2">
                <Input
                  id="deleteValue"
                  value={deleteValue}
                  onChange={(e) => setDeleteValue(e.target.value)}
                  placeholder={`${keySize} dígitos`}
                />
                <Button onClick={handleDelete} disabled={!deleteValue}>
                  Eliminar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Guardar</Label>
              <Button onClick={onSave} variant="outline" className="w-full bg-transparent">
                Guardar
              </Button>
            </div>
          </div>

          {/* Modificar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oldValue">Valor actual</Label>
              <Input
                id="oldValue"
                value={oldValue}
                onChange={(e) => setOldValue(e.target.value)}
                placeholder={`${keySize} dígitos`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newValue">Nuevo valor</Label>
              <Input
                id="newValue"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`${keySize} dígitos`}
              />
            </div>
            <div className="space-y-2">
              <Label>Modificar</Label>
              <Button onClick={handleModify} disabled={!oldValue || !newValue} className="w-full">
                Modificar
              </Button>
            </div>
          </div>

          {/* Controles de navegación */}
          <div className="flex justify-center gap-4">
            <Button onClick={onPrevStep} disabled={disablePrev} variant="outline">
              Paso Anterior
            </Button>
            <Button onClick={onReset} variant="outline">
              Reiniciar
            </Button>
            <Button onClick={onNextStep} disabled={disableNext}>
              Siguiente Paso
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
