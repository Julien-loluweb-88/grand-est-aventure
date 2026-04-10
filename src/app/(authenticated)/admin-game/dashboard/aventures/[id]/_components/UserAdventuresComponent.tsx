"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

const PAGE_SIZE = 5

type UserAdventure = {
  id: string;
  adventureId: string;
  giftNumber: number;
  success: boolean;
  updatedAt: Date | string;
  user: {
    id: string;
    name: string | null;
  };
};

  type Props = {
  userAdventures: UserAdventure[]
  total?: number
  page?: number
  search?: string
  loadError?: string | null
}

export function UserAdventuresComponent({
  userAdventures,
  total = 0,
  page = 1,
  search = "",
  loadError = null,
}: Props) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search)
  const [debouncedSearch, setDebouncedSearch] = useState(search)

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
  }, [debouncedSearch, router, search])

  useEffect(() => {
    if (loadError) toast.error(loadError)
  }, [loadError])

  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1
  const canPrev = page > 1
  const canNext = page < totalPages
  const showEmptyState = !loadError && userAdventures.length === 0


    return(
        <Dialog> 
      <DialogTrigger asChild>
        <Button variant="outline">Voir des utilisateurs</Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[95vw] overflow-x-auto p-4">
         <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Rechercher par nom ou date"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
          aria-label="Rechercher une aventure (nom ou date, sans tenir compte des majuscules)"
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
            }}
          >
            Suivant
          </Button>
          </div>
          </div>
        <DialogHeader>
          <DialogTitle>Liste des utilisateures</DialogTitle>
          <DialogDescription>
            Des utilisateurs qui ont réussi
          </DialogDescription>
        </DialogHeader>
        <Table>
    <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Nom</TableHead>
          <TableHead>Badges</TableHead>
          <TableHead>Date de réussi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {userAdventures.map((userAdventure)=> (
          <TableRow key={userAdventure.id}>
            <TableCell className="text-left">
              {userAdventure.user.name?.trim() || "—"}
            </TableCell>
            <TableCell>{userAdventure.giftNumber}</TableCell>
            <TableCell>{new Date(userAdventure.updatedAt).toLocaleDateString()}</TableCell>
          </TableRow>
 ))}
      </TableBody>
    </Table>   
    </div>
      </DialogContent>
    </Dialog>
  
    )
}
