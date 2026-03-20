/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { authClient } from "@/lib/auth-client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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

type User = {
    id: string;
    name: string;
    email: string;
    role: string | undefined;
    banned: boolean;
};

export default function Page() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);

    const loadUsers = useCallback(async () => {
        try {
            const response = await authClient.admin.listUsers({
                query: {},
            });

            console.log("coucou", response.data);

            if (response.data?.users) {
                setUsers(response.data.users as User[]);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des utilisateurs:", error);
        }
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                            {(user.role ?? "user") === "user" ? (
                                <span>Utilisateur</span>
                            ) : (user.role ?? "user") === "admin" ? (
                                <span>Admin</span>
                            ) : (
                                <span>Super admin</span>
                            )}
                        </TableCell>
                        <TableCell>
                            {user.banned ? <span>Banned</span> : <span>Active</span>}
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
                                            router.push(`/admin-game/dashboard/utilisateurs/${user.id}`);
                                        }}
                                    >
                                        Voir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}