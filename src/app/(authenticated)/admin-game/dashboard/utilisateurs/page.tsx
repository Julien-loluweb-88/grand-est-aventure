"use client";

import { formatUserRoleLabel } from "@/lib/format-user-role";
import { listUsersForAdmin } from "./_lib/list-users.action";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { useAdminCapabilities } from "../AdminCapabilitiesProvider";
import { CreateUserDialog } from "./_components/CreateUserDialog";

const PAGE_SIZE = 10;

type UserRow = {
    id: string;
    name: string | null;
    email: string;
    role: string | undefined;
    banned: boolean;
};

export default function UtilisateursPage() {
    const router = useRouter();
    const caps = useAdminCapabilities();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [total, setTotal] = useState<number | null>(null);
    /** Évite de démonter la barre de recherche pendant les rechargements (recherche vide, etc.). */
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await listUsersForAdmin({
                page,
                pageSize: PAGE_SIZE,
                search: debouncedSearch,
            });

            if (!result.ok) {
                setError(result.error);
                if (result.error !== "Non autorisé.") {
                    toast.error(result.error);
                }
                setUsers([]);
                setTotal(null);
                return;
            }

            setUsers(result.users);
            setTotal(result.total);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Erreur lors du chargement des utilisateurs.";
            setError(msg);
            toast.error(msg);
            setUsers([]);
            setTotal(null);
        } finally {
            setLoading(false);
            setInitialLoadDone(true);
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const totalPages =
        total != null && total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;
    const canPrev = page > 1;
    const canNext =
        total != null
            ? page < (totalPages ?? 1)
            : users.length === PAGE_SIZE;

    const showInitialSkeleton = !initialLoadDone && loading && users.length === 0 && !error;

    if (showInitialSkeleton) {
        return (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                Chargement des utilisateurs…
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                <Input
                    type="search"
                    placeholder="Rechercher par nom ou e-mail…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="max-w-sm"
                    aria-label="Rechercher un utilisateur (nom ou e-mail, sans tenir compte des majuscules)"
                    autoComplete="off"
                />
                <CreateUserDialog />
                </div>
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

            {error && (
                <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <p className="text-destructive">
                        {error === "Non autorisé."
                            ? "Accès refusé. Seuls les comptes autorisés peuvent voir les utilisateurs."
                            : error}
                    </p>
                    <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => void loadUsers()}>
                        Réessayer
                    </Button>
                </div>
            )}

            {!loading && users.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    {debouncedSearch
                        ? "Aucun résultat pour cette recherche."
                        : "Aucun utilisateur à afficher."}
                </div>
            ) : (
                <div className={loading ? "opacity-60 transition-opacity" : undefined}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span>{formatUserRoleLabel(user.role)}</span>
                                    </TableCell>
                                    <TableCell>
                                        {user.banned ? (
                                            <span className="text-destructive">Banni</span>
                                        ) : (
                                            <span className="text-muted-foreground">Actif</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreHorizontalIcon />
                                                    <span className="sr-only">Menu actions</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    disabled={!caps.user.get}
                                                    title={
                                                        !caps.user.get
                                                            ? "Vous ne pouvez pas ouvrir le profil utilisateur."
                                                            : undefined
                                                    }
                                                    onClick={() => {
                                                        if (!caps.user.get) return;
                                                        router.push(
                                                            `/admin-game/dashboard/utilisateurs/${user.id}`
                                                        );
                                                    }}
                                                >
                                                    Voir le profil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
