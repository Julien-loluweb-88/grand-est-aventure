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
import { MoreHorizontalIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PAGE_SIZE = 5

type AdventureReview = {
  id: string
  adventureId: string
  rating: number
  content: string
  moderationStatus: string
  consentCommunicationNetworks: boolean
  reportsMissingBadge: boolean
  reportsStolenTreasure: boolean
  updatedAt: string
  user: {
    id: string
    name: string
  }
}

export function ListAdventureReview({adventureReviews}: {adventureReviews: AdventureReview[]}){

    return(
        <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Voir des avis</Button>
      </DialogTrigger>
      <DialogContent className="w-screen max-w-none p-4">
        <DialogHeader>
          <DialogTitle>Liste des avis</DialogTitle>
          <DialogDescription>
            Validé / refusé des avis et utilisation de communication
          </DialogDescription>
        </DialogHeader>
        <Table className="w-full table-auto">
    <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Nom</TableHead>
          <TableHead>Évaluations</TableHead>
          <TableHead>Autorisation d&apos;utilisation sur réseaux</TableHead>
          <TableHead>Les badges sont en rupture de stock (perdus, volés, etc.)</TableHead>
          <TableHead>Rapport de vol du trésor</TableHead>
          <TableHead>Commentaire</TableHead>
          <TableHead>Date de publication</TableHead>
         <TableHead className="text-right">Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adventureReviews.map((adventureReview) => ( 
        <TableRow key={adventureReview.id}>
        <TableCell>{adventureReview.user.name}</TableCell>
        <TableCell>{adventureReview.rating}</TableCell>
        <TableCell>{adventureReview.consentCommunicationNetworks}</TableCell>
        <TableCell>{adventureReview.reportsMissingBadge}</TableCell>
        <TableCell>{adventureReview.reportsStolenTreasure}</TableCell>
        <TableCell>{adventureReview.content}</TableCell>
        <TableCell>{new Date(adventureReview.updatedAt).toLocaleDateString()}</TableCell>
        
        <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontalIcon />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
              </TableCell>
              </TableRow>
       
))}
      </TableBody>
        </Table>
        
      </DialogContent>
    </Dialog>
    )
}
