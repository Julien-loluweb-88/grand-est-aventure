"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { GuardedButton } from "@/components/admin/GuardedButton"
import { useAdminCapabilities } from "../AdminCapabilitiesProvider"
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
import { RequestNewAdventureDialog } from "./RequestNewAdventureDialog"

const PAGE_SIZE = 10

type Adventure = {
  id: string
  name: string
  city: string
  status: boolean
  audience: "PUBLIC" | "DEMO"
  estimatedPlayDurationSeconds: number | null
  averagePlayDurationSeconds: number | null
  playDurationSampleCount: number
}

function formatMinutesShort(seconds: number | null): string {
  if (seconds == null || !Number.isFinite(seconds)) {
    return "—"
  }
  return `${Math.max(1, Math.round(seconds / 60))} min`
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
  const caps = useAdminCapabilities()
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
          <GuardedButton
            type="button"
            size="sm"
            allowed={caps.adventure.create}
            denyReason="Vous ne pouvez pas créer une aventure."
            onClick={() => router.push("/admin-game/dashboard/aventures/create")}
          >
            Créer une aventure
          </GuardedButton>
          {!caps.adventure.create ? (
            <RequestNewAdventureDialog size="sm" />
          ) : null}
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
              {caps.adventure.create
                ? "Créez la première aventure pour démarrer."
                : "Les aventures qui vous sont assignées apparaîtront ici. Pour en ajouter une nouvelle, envoyez une demande au super administrateur."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <GuardedButton
                type="button"
                allowed={caps.adventure.create}
                denyReason="Vous ne pouvez pas créer une aventure."
                onClick={() => router.push("/admin-game/dashboard/aventures/create")}
              >
                Créer la première aventure
              </GuardedButton>
              {!caps.adventure.create ? (
                <RequestNewAdventureDialog size="default" />
              ) : null}
            </div>
          </div>
        ) : (
          <Table className="m-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Nom</TableHead>
                <TableHead className="text-left">Ville</TableHead>
                <TableHead className="text-left">Visibilité</TableHead>
                <TableHead className="text-left">Statut</TableHead>
                <TableHead className="text-left whitespace-normal">Durée estim.</TableHead>
                <TableHead className="text-left whitespace-normal">Moy. joueurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adventures.map((adventure) => (
                <TableRow key={adventure.id}>
                  <TableCell className="text-left">{adventure.name}</TableCell>
                  <TableCell className="text-left">{adventure.city}</TableCell>
                  <TableCell className="text-left">
                    {adventure.audience === "DEMO" ? (
                      <span className="text-muted-foreground">Démo</span>
                    ) : (
                      <span className="text-muted-foreground">Publique</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    {adventure.status ? (
                      <span className="text-muted-foreground">Active</span>
                    ) : (
                      <span className="text-destructive">Pause</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[7rem] text-left text-xs tabular-nums text-muted-foreground">
                    {formatMinutesShort(adventure.estimatedPlayDurationSeconds)}
                  </TableCell>
                  <TableCell className="max-w-[8rem] text-left text-xs tabular-nums text-muted-foreground">
                    <span>{formatMinutesShort(adventure.averagePlayDurationSeconds)}</span>
                    {adventure.playDurationSampleCount > 0 ? (
                      <span className="block text-[10px] opacity-90">n = {adventure.playDurationSampleCount}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon />
                          <span className="sr-only">Ouvrir le menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={!caps.adventure.read}
                          title={
                            !caps.adventure.read
                              ? "Vous ne pouvez pas ouvrir le détail de cette aventure."
                              : undefined
                          }
                          onClick={() => {
                            if (!caps.adventure.read) return;
                            router.push(`/admin-game/dashboard/aventures/${adventure.id}`)
                          }}
                        >
                          Voir le détail
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

