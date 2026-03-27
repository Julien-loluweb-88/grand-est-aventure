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
import { deleteEnigma, listEnigmaForAdmin } from "./enigma.action"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Adventure } from "../../../../../../../generated/prisma/client"
import { EditenigmaForm } from "./EnigmaEditForm"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [enigmaToDelete, setEnigmaToDelete] = useState<Enigma | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

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

  const handleDeleteEnigma = useCallback(
    async (enigma: Enigma) => {
      setDeletingId(enigma.id)
      try {
        const result = await deleteEnigma(enigma.id, adventure.id)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        toast.success(result.message)
        await loadEnigmas()
        setEnigmaToDelete(null)
        setDeleteConfirmText("")
      } finally {
        setDeletingId(null)
      }
    },
    [adventure.id, loadEnigmas]
  )

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
                onClick={() => router.refresh()}
              >
                Rafraichir
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
                  <TableCell className="text-right flex justify-end gap-2">
                    <EditenigmaForm enigma={enigma} />
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deletingId === enigma.id}
                      onClick={() => setEnigmaToDelete(enigma)}
                    >
                      {deletingId === enigma.id ? "Suppression..." : "Supprimer"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <Dialog
        open={Boolean(enigmaToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setEnigmaToDelete(null)
            setDeleteConfirmText("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;énigme</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Saisissez exactement{" "}
              <span className="font-medium text-foreground">
                {enigmaToDelete?.name}
              </span>{" "}
              pour confirmer la suppression.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2">
            <Input
              type="text"
              placeholder={enigmaToDelete?.name ?? "Nom de l'énigme"}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogDescription>
            Vous allez supprimer{" "}
            <span className="font-medium text-foreground">
              {enigmaToDelete?.name}
            </span>
            . Cette action est définitive.
          </DialogDescription>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(deletingId)}
              onClick={() => {
                setEnigmaToDelete(null)
                setDeleteConfirmText("")
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !enigmaToDelete ||
                Boolean(deletingId) ||
                deleteConfirmText !== enigmaToDelete.name
              }
              onClick={() => {
                if (!enigmaToDelete) return
                void handleDeleteEnigma(enigmaToDelete)
              }}
            >
              {deletingId ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
