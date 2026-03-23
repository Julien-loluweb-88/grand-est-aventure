"use client";
import { useState } from "react";
import { banUser } from "./user.action";
import { User } from "../../../../../../../generated/prisma/browser";
import { DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BanEditForm({ user }: { user: User }) {

  const [motif, setMotif] = useState("");
  const [motifCustom, setMotifCustom] = useState("");

  const [duration, setDuration] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const handleBan = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!motif || !duration) return;
    if (duration === "other" && !customEndDate) return;
    try {
      await banUser(
        user.id,
        motif === "other" ? motifCustom : motif,
        duration,
        duration === "other" ? customEndDate : undefined
      );
      toast.success("L'utilisateur a été banni.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Impossible de bannir cet utilisateur."
      );
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          Bannir l&apos;utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Bannir {user.name ?? user.email ?? "cet utilisateur"} ?
          </DialogTitle>
          <DialogDescription>
            Cette action permet de bannir un utilisateur pendant une durée
            déterminée.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="motif">Motif</Label>
            <Select onValueChange={setMotif} value={motif}>
              <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder="Quelle motif?" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Violation des conditions</SelectLabel>
                  <SelectItem value="Harassment">
                    Harcèlement
                  </SelectItem>
                  <SelectItem value="Fraud">
                    Fraudes et atteintes à la sécurité
                  </SelectItem>
                  <SelectItem value="damage">
                    Dommages causés à d&apos;autres utilisateurs
                  </SelectItem>
                  <SelectItem value="interruption">
                    Interruption de service
                  </SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectGroup>
                </SelectContent>
            </Select>
            {motif ==="other" && <Input placeholder="Quel motif?" value={motifCustom} onChange={(e) => setMotifCustom(e.target.value)}/>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="time">Durée</Label>
            <Select onValueChange={setDuration} value={duration}>
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
                  <SelectItem value="other">Autre</SelectItem>

                </SelectGroup>
              </SelectContent>
            </Select>
            {duration === "other" && (
              <Input
                type="date"
                min={today}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full max-w-48"
              />
            )}

          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="submit"
            className="color-white bg-red-500 p-2"
            onClick={(e) => handleBan(e)}
            disabled={
              !motif ||
              !duration ||
              (duration === "other" && !customEndDate)
            }
          >
            Valider
          </Button>
          <DialogClose asChild>
    <Button type="button">Annuler</Button>
  </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
