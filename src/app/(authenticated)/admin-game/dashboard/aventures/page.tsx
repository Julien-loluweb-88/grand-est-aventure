"use client"

import { useState, useEffect, useCallback } from "react";
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
import { useRouter } from "next/navigation";
import { listAdventures } from "./adventure.action";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";


const PAGE_SIZE = 10;

type Adventure= {
  id: string;
  name: string;
  city: string;
};

export default function Page() {
  const router = useRouter();
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

/* useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]); */

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await listAdventures();
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        setAdventures([]);
        return;
      }

      setAdventures(result.adventures);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Erreur lors du chargement des aventures.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalPages =
        total != null && total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;
    const canPrev = page > 1;
    const canNext =
        total != null
            ? page < (totalPages ?? 1)
            : adventures.length === PAGE_SIZE;

    const showInitialSkeleton = !initialLoadDone && loading && adventures.length === 0 && !error;
  if (showInitialSkeleton) {
    return <div>Chargement des aventures…</div>;
  }
  if (error) {
    return (
      <div>
        <p>{error}</p>
        <Button onClick={() => void load()}>Réessayer</Button>
      </div>
    );
  }


  return (
   <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
               { /* <Input
                    type="search"
                    placeholder="Rechercher par nom ou ville"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="max-w-sm"
                    aria-label="Rechercher un utilisateur (nom ou ville, sans tenir compte des majuscules)"
                    autoComplete="off"
                /> */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canPrev || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Précédent
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
                        <span className="text-xs text-muted-foreground">Mise à jour…</span>
                    )}
                </div>
            </div>
    <h1>Liste des aventures</h1>
        <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Ville</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adventures.map((adventure) => (
        <TableRow key= {adventure.id}>
          <TableCell className="font-medium">{adventure.name}</TableCell>
          <TableCell>{adventure.city}</TableCell>
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
                      router.push(
                        `/admin-game/dashboard/aventures/${adventure.id}`);
                      }}
                >Voir l&apos;infomation</DropdownMenuItem>
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}