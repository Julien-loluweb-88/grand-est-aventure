"use client";

import { useRef, useState } from "react";
import { roleUser } from "./user.action";
import { User } from "../../../../../../../generated/prisma/browser";
import { Button } from "@/components/ui/button";
import { GuardedButton } from "@/components/admin/GuardedButton";
import { useAdminCapabilities } from "../../AdminCapabilitiesProvider";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogCloseRef,
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
import { toast } from "sonner";

export function RoleEditForm({ user }: { user: User }) {
  const caps = useAdminCapabilities();
  const dialogRef = useRef<DialogCloseRef>(null);
  const [role, setRole] = useState<"user" | "admin" | "superadmin" | "myCustomRole">(
    (user?.role as "user" | "admin" | "superadmin" | "myCustomRole") ?? "user"
  );

  const handleRole = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!role) {
      return toast.error("Veuillez choisir un rôle.");
    }
    const result = await roleUser(user.id, role);
    if (result.success) {
      toast.success(result.message);
      dialogRef.current?.close();
    } else {
      toast.error(result.message);
    }
  };

  if (!caps.canAssignRolesAndScopes) {
    return (
      <GuardedButton
        type="button"
        variant="outline"
        size="sm"
        allowed={false}
        denyReason="Seul un super administrateur peut modifier les rôles."
      >
        Modifier le rôle
      </GuardedButton>
    );
  }

  return (
    <Dialog ref={dialogRef}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Modifier le rôle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rôle d&apos;utilisateur</DialogTitle>
          <DialogDescription>
            Quel est le rôle de cet utilisateur?
          </DialogDescription>
        </DialogHeader>
        <Select
          onValueChange={(value) =>
            setRole(value as "user" | "admin" | "superadmin" | "myCustomRole")
          }
          value={role}
        >
          <SelectTrigger className="w-full max-w-48">
            <SelectValue placeholder="Choisissez son rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Rôle</SelectLabel>
              <SelectItem value="user">Utilisateur</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="superadmin">Super admin</SelectItem>
              {user.role === "myCustomRole" ? (
                <SelectItem value="myCustomRole">Rôle personnalisé (actuel)</SelectItem>
              ) : null}
            </SelectGroup>
          </SelectContent>
        </Select>
        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={handleRole}>
            Valider
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
