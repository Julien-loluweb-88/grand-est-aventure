"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

const PAGE_SIZE = 10

type Adventure = {
  id: string
  name: string
  city: string
  status: boolean
}

type Props = {
  adventures: Adventure[]
  total: number
  page: number
  search: string
  loadError: string | null
}

export default function AdventuresTable({
  adventures,
  total,
  page,
  search,
  loadError,
}: Props) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)
  const [debouncedSearch, setDebouncedSearch] = useState("")

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
    router.push(`/admin-game/dashboard/aventures?${params.toString()}`)
  }, [debouncedSearch, router, search])

  useEffect(() => {
    if (loadError) toast.error(loadError)
  }, [loadError])

  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1
  const canPrev = page > 1
  const canNext = page < totalPages
  const showEmptyState = !loadError && adventures.length === 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Rechercher par nom ou ville"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
          aria-label="Rechercher une aventure (nom ou ville, sans tenir compte des majuscules)"
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
              router.push(`/admin-game/dashboard/aventures?${params.toString()}`)
            }}
          >
            Précédent
          </Button>
          <span className="min-w-[120px] text-center tabular-nums" aria-live="polite">
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
              router.push(`/admin-game/dashboard/aventures?${params.toString()}`)
            }}
          >
            Suivant
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => router.push("/admin-game/dashboard/aventures/create")}
          >
            Créer une aventure
          </Button>
        </div>
      </div>
      <h1>Liste des aventures</h1>
      <div className="p-4">
        {loadError ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm font-medium">Erreur lors du chargement des aventures</p>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
            <div className="mt-6 flex justify-center">
              <Button type="button" onClick={() => router.refresh()}>
                Réessayer
              </Button>
            </div>
          </div>
        ) : showEmptyState ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm font-medium">Aucune aventure pour le moment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Créez la première aventure pour démarrer.
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={() => router.push("/admin-game/dashboard/aventures/create")}
              >
                Créer la première aventure
              </Button>
            </div>
          </div>
        ) : (
          <Table className="m-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Nom</TableHead>
                <TableHead className="text-left">Ville</TableHead>
                <TableHead className="text-left">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adventures.map((adventure) => (
                <TableRow key={adventure.id}>
                  <TableCell className="text-left">{adventure.name}</TableCell>
                  <TableCell className="text-left">{adventure.city}</TableCell>
                  <TableCell className="text-left">
                    {adventure.status ? (
                      <span className="text-muted-foreground">Active</span>
                    ) : (
                      <span className="text-destructive">Pause</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(`/admin-game/dashboard/aventures/${adventure.id}`)
                          }}
                        >
                          Voir l&apos;infomation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </DropdownMenuContent>
                    </DropdownMenu>
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

