"use client";
import { useState } from "react";
import { removeUser } from "./user.action";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Label } from "@/components/ui/label"

export function RemoveUserForm({ user }: { user: User }) {
  return (
    <Dialog>
      <form>
        <DialogTrigger className="text-white bg-red-500 p-2">
          Supprimer cet utilisateur
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Veuillez-vous vraiment supprimer cet utilisateur ?
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="username">{user.name}</Label>
              <DialogClose asChild>
                <Button type="button">Laisser</Button>
              </DialogClose>
              <Button
                type="submit"
                className="color-white bg-red-500 p-2"
                onClick={(e) => handleRemove(e)}>Supprimer</Button>
            </Field>
          </FieldGroup>
        </DialogContent>
      </form>
    </Dialog>
  )
}
