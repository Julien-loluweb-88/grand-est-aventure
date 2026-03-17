"use client";

import { authClient } from "@/lib/auth-client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

export default function Page() {
  const router = useRouter()
  const [users, setUsers] = useState([]);

  const loadUsers = useCallback(async () => {
    try {
        
    

        const response = await authClient.admin.listUsers({
            query: {
              
            }
        });

        console.log("coucou",response.data);

        if (response.data) {
            setUsers(response.data.users);
 
        }
    } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
   
    } finally {
      
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
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.banned ? (
              <span>Banned</span>) : (
              <span>Active</span>
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
                  onClick={ ()=> {
                    router.push(`/admin-game/dashboard/utilisateurs/${user.id}`)
                  }}>Voir</DropdownMenuItem>
                  <DropdownMenuItem
                  onClick={async(e) => {
                    e.preventDefault();
                    try{
                      await authClient.admin.banUser({
                      userId: user.id, // required
                      banReason: "Spamming",
                     banExpiresIn: 60 * 60 * 24 * 7,
                    });
                   
                    alert("User a bloqué");
                    } catch (error){
                      console.error(error);
                      alert("Erreur lors du ban");
                    }
                    }}>
                      Bloquer
                      </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">
                    Supprimer
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
