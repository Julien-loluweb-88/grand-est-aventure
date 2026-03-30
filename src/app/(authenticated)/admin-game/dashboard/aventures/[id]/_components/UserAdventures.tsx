"use client"

import { useState, useEffect, useCallback } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"

export function UserAdventures(){

    const PAGE_SIZE = 5

    type UserAdventure = {
        id: string
        adventureId: string
        giftNumber: number
        success: boolean
    }

    

    return(
        <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Voir des utilisateurs</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
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
          <TableHead>Badge</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
          <TableRow key="">
            <TableCell className="font-medium"></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right"></TableCell>
          </TableRow>
 
      </TableBody>
      <TableFooter>
       
      </TableFooter>
    </Table>
        
      </DialogContent>
    </Dialog>
    )
}
