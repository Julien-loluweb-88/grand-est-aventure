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
import Image from "next/image";
import { useState } from "react";
import { changeReviewStatus } from "../_lib/adventure.action";

const PAGE_SIZE = 5

type AdventureReview = {
  id: string
  adventureId: string
  rating: number
  content: string
  image: string
  moderationStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
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
  const [reviews, setReviews] = useState<AdventureReview[]>(adventureReviews);
  const handleUpdate = async (reviewId: string, status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED") => {
    try {
      const updated = await changeReviewStatus(reviewId, status);
      setReviews(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    } catch (err) {
      console.error("Failed to update review:", err);
    }
  };
  const formatStatusLabel = (status: AdventureReview["moderationStatus"]) => {
    switch (status) {
      case "PENDING":
        return "Soumis";
      case "APPROVED":
        return "Validé";
      case "REJECTED":
        return "Refusé";
      default:
        return status;
    }
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);


    return(
        <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Voir des avis</Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[95vw] overflow-x-auto p-4">
        <DialogHeader>
          <DialogTitle>Liste des avis</DialogTitle>
          <DialogDescription>
            Validé / refusé des avis et utilisation de communication
          </DialogDescription>
        </DialogHeader>
        <Table className="w-full table-auto">
    <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Évaluations</TableHead>
          <TableHead>Autorisation d&apos;utilisation sur réseaux</TableHead>
          <TableHead>Les badges sont en rupture de stock<br /> (perdus, volés, etc.)</TableHead>
          <TableHead>Rapport de vol du trésor</TableHead>
          <TableHead>Commentaire</TableHead>
          <TableHead>Image</TableHead>
          <TableHead>Date de publication</TableHead>
         <TableHead className="text-right">Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((adventureReview) => ( 
        <TableRow key={adventureReview.id}>
        <TableCell>{adventureReview.user.name}</TableCell>
        <TableCell>{adventureReview.rating}</TableCell>
        <TableCell>
          {adventureReview.consentCommunicationNetworks ? (
          <span className="text-muted-foreground">Autorisé</span>
          ) : (
            <span className="text-destructive">Non autorisé</span>
          )}
          </TableCell>
        <TableCell>{adventureReview.reportsMissingBadge ? (
          <span className="text-red-600 font-bold">Oui</span>
          ) : (
            <span className="text-muted-foreground">Non</span>
          )}
          </TableCell>
        <TableCell>{adventureReview.reportsStolenTreasure ? (
          <span className="text-red-600 font-bold">Oui</span>
          ) : (
            <span className="text-muted-foreground">Non</span>
          )}
          </TableCell>
        <TableCell>{adventureReview.content}</TableCell>
        <TableCell>{adventureReview.image ? (
    <span
      className="text-blue-600 underline cursor-pointer"
      onClick={() => setSelectedImage(adventureReview.image)}
    >
      Voir
    </span>
  ) : (
    <span className="text-muted-foreground text-sm">—</span>
  )}
</TableCell>
        <TableCell>{new Date(adventureReview.updatedAt).toLocaleDateString()}</TableCell>
        <TableCell>{formatStatusLabel(adventureReview.moderationStatus)}</TableCell>
        <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontalIcon />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                      {["PENDING", "APPROVED", "REJECTED"].map(status => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => 
                          handleUpdate(adventureReview.id,
                          status as AdventureReview["moderationStatus"]
                        )}
                        className={
                          status === "REJECTED"
                          ? "text-red-600 font-bold"
                          : ""
                        }
                        >
                          {formatStatusLabel(status as AdventureReview["moderationStatus"])}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
              </DropdownMenu>
              </TableCell>
              </TableRow>
))}
      </TableBody>
        </Table>
       <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
      <DialogContent className="max-w-3xl p-2">
        {selectedImage && (
          <div className="flex justify-center">
            <Image
              src={selectedImage}
              alt="preview"
              width={800}
              height={800}
              className="object-contain rounded"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
      </DialogContent>
    </Dialog>
    )
}
