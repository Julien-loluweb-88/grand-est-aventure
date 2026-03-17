"use client"
import { useState } from "react";
import { User } from "../../../../../../../generated/prisma/browser"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function BanEditForm({ user }: { user: User }) {


  return (
    <Dialog>
  <DialogTrigger className="text-red-500 border border-black p-2">Bannir utilisateur</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Etes vous sur de vouloir bannir {user.name} ?</DialogTitle>
      <DialogDescription>
        Cette action permet de bannir un utilisateur pendant une durée déterminée.
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="motif">
              Motif
            </Label>
            <Select>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Quelle motif?" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Violation des conditions</SelectLabel>
          <SelectItem value="Harassment">Harcèlement</SelectItem>
          <SelectItem value="Fraud">Fraudes et atteintes à la sécurité</SelectItem>
          <SelectItem value="damage">Dommages causés à d&apos;autres utilisateurs</SelectItem>
          <SelectItem value="interruption">Interruption de service</SelectItem>
          <SelectItem value="other">Autre</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="time">
              Durée
            </Label>
            <Select>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Combien de durée?" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Violation des conditions</SelectLabel>
          <SelectItem value="oneday">1jour</SelectItem>
          <SelectItem value="oneweek">1semaine</SelectItem>
          <SelectItem value="onemonth">1mois</SelectItem>
          <SelectItem value="oneyear">1an</SelectItem>
          <SelectItem value="infinity">Infini</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
          </div>

        </div>
        <DialogFooter className="sm:justify-start">
            <Button type="button" className="color-white bg-red-500 p-2">Valider</Button>
            <Button type="button">Annuler</Button>
        </DialogFooter>
  </DialogContent>
</Dialog>
  )
}
