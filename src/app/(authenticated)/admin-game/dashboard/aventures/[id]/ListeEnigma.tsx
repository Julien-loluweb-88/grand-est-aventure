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
import { deleteEnigma } from "./enigma.action"
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
  enigmas: Enigma[]
  total: number
  page: number
  search: string
  loadError: string | null
}

export function ListEnigmaTable({
  adventure,
  enigmas,
  total,
  page,
  search,
  loadError,
}: Props) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [enigmaToDelete, setEnigmaToDelete] = useState<Enigma | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    if (debouncedSearch === search) return
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    params.set("page", "1")
    router.push(`/admin-game/dashboard/aventures/${adventure.id}?${params.toString()}`)
  }, [debouncedSearch])

  useEffect(() => {
    if (loadError) toast.error(loadError)
  }, [loadError])

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
        router.refresh()
        setEnigmaToDelete(null)
        setDeleteConfirmText("")
      } finally {
        setDeletingId(null)
      }
    },
    [adventure.id, router]
  )

  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1
  const canPrev = page > 1
  const canNext = page < totalPages

  const showEmptyState = !loadError && enigmas.length === 0

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
            disabled={!canPrev}
            onClick={() => {
              const params = new URLSearchParams()
              if (search) params.set("search", search)
              params.set("page", String(Math.max(1, page - 1)))
              router.push(`/admin-game/dashboard/aventures/${adventure.id}?${params.toString()}`)
            }}
          >
            Precedent
          </Button>
          <span
            className="min-w-[120px] text-center tabular-nums"
            aria-live="polite"
          >
            <>Page {page} sur {totalPages}</>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => {
              const params = new URLSearchParams()
              if (search) params.set("search", search)
              params.set("page", String(page + 1))
              router.push(`/admin-game/dashboard/aventures/${adventure.id}?${params.toString()}`)
            }}
          >
            Suivant
          </Button>
        </div>
      </div>

      <h1>Liste d&apos;enigme</h1>
      <div className="p-4">
        {loadError ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm font-medium">Erreur lors du chargement des énigmes</p>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
            <div className="mt-6 flex justify-center">
              <Button type="button" onClick={() => router.refresh()}>
                Réessayer
              </Button>
            </div>
          </div>
        ) : showEmptyState ? (
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
