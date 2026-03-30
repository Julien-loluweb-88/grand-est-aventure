"use client"

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
import { Timestamp } from "next/dist/server/lib/cache-handlers/types"

const PAGE_SIZE = 5

  type UserAdventure = {
        id: string
        adventureId: string
        giftNumber: number
        success: boolean
        updatedAt: string
        user:{
          id: string
          name: string
        }
    }


export function UserAdventuresComponent({userAdventures}: {userAdventures: UserAdventure[]}){
    console.log("userAdventure123", userAdventures)

    return(
        <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Voir des utilisateurs</Button>
      </DialogTrigger>
      <DialogContent>
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
          <TableHead>Badges</TableHead>
          <TableHead>Date de réussi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {userAdventures.map((userAdventure)=> (
          <TableRow key={userAdventure.id}>
            <TableCell className="text-left">{userAdventure.user.name}</TableCell>
            <TableCell>{userAdventure.giftNumber}</TableCell>
            <TableCell>{new Date(userAdventure.updatedAt).toLocaleDateString()}</TableCell>
          </TableRow>
 ))}
      </TableBody>
      <TableFooter>
       
      </TableFooter>
    </Table>
        
      </DialogContent>
    </Dialog>
    )
}
