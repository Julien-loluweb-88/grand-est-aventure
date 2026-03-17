"use client";
import { useState } from "react";
import { roleUser } from "./user.action";
import { User } from "../../../../../../../generated/prisma/browser";
import { DialogClose } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RoleEditForm({ user }: { user: User }) {
    const [role, setRole] = useState<"user" | "admin" | "superadmin">(
      (user?.role as "user" | "admin" | "superadmin") ?? "user"
    );
    const handleRole = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if(!role) {
            return alert("Choisissez un rôle")
        } else{
            await roleUser(user.id, role);
            alert("Rôle mis à jour");
    }
}
  return (
    <Dialog>
        <DialogTrigger className="border border-black p-2">
          Rôle d&apos;utilisateur
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rôle d&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Quel est le rôle de cet utilisateur?
            </DialogDescription>
          </DialogHeader>
          <Select onValueChange={(value) => setRole(value as "user" | "admin" | "superadmin")} value={role}>
            <SelectTrigger className="w-full max-w-48">
              <SelectValue placeholder="Choisissez son rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Rôle</SelectLabel>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super admin</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <DialogFooter className="sm:justify-start">
            <Button
            type="submit"
            onClick={(e) => handleRole(e)}>Valider</Button>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
