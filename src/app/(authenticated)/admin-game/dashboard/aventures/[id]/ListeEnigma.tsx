"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { listEnigmaForAdmin } from "./enigma.action"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Adventure } from "../../../../../../../generated/prisma/client"
import { EditenigmaForm } from "./EnigmaEditForm"

const PAGE_SIZE = 5

type Enigma = {
  id: string
  name: string
  number: number
  question: string
  uniqueResponse: boolean
  choices: string[]
  answer: string
  answerMessage: string
  description: string
  latitude: number
  longitude: number
  adventureId: string
}

type Props = {
  adventure: Adventure
}

export function ListEnigmaTable({ adventure }: Props) {
  const router = useRouter()
  const [enigmas, setEnigmas] = useState<Enigma[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [total, setTotal] = useState<number | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const loadEnigmas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listEnigmaForAdmin({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch,
        adventureId: adventure.id,
      })
      if (!result.ok) {
        setError(result.error)
        toast.error(result.error)
        setEnigmas([])
        setTotal(null)
        return
      }

      setEnigmas(result.enigma)
      setTotal(result.total)
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Erreur lors du chargement des enigmes."
      setError(msg)
      toast.error(msg)
      setEnigmas([])
      setTotal(null)
    } finally {
      setLoading(false)
      setInitialLoadDone(true)
    }
  }, [page, debouncedSearch, adventure.id])

  useEffect(() => {
    void loadEnigmas()
  }, [loadEnigmas])

  const totalPages =
    total != null && total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null
  const canPrev = page > 1
  const canNext =
    total != null
      ? page < (totalPages ?? 1)
      : enigmas.length === PAGE_SIZE

  const showInitialSkeleton =
    !initialLoadDone && loading && enigmas.length === 0 && !error
  const showEmptyState = !loading && !error && enigmas.length === 0
  if (showInitialSkeleton) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Chargement des enigmes...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Rechercher par nom, numéro ou question"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
          aria-label="Rechercher une énigme (nom ou question, sans tenir compte des majuscules)"
          autoComplete="off"
        />
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canPrev || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Precedent
          </Button>
          <span
            className="min-w-[120px] text-center tabular-nums"
            aria-live="polite"
          >
            {total != null ? (
              <>Page {page} sur {totalPages ?? 1}</>
            ) : (
              <>Page {page}</>
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
          {loading && (
            <span className="text-xs text-muted-foreground">Mise a jour...</span>
          )}
        </div>
      </div>

      <h1>Liste d&apos;enigme</h1>
      <div className="p-4">
        {showEmptyState ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm font-medium">Aucune enigme pour le moment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Creez la premiere enigme pour demarrer.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={() => router.push("/admin-game/dashboard/aventures/create")}
              >
                Creer la premiere enigme
              </Button>
            </div>
          </div>
        ) : (
          <Table className="m-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Nom</TableHead>
                <TableHead className="text-left">Numero</TableHead>
                <TableHead className="text-left">Question</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enigmas.map((enigma) => (
                <TableRow key={enigma.id}>
                  <TableCell className="text-left">{enigma.name}</TableCell>
                  <TableCell className="text-left">{enigma.number}</TableCell>
                  <TableCell className="text-left">{enigma.question}</TableCell>
                  <TableCell className="text-right">
                    <EditenigmaForm enigma={enigma} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
