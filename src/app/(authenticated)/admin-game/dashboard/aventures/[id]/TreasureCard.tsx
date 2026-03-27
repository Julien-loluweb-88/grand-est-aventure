"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Treasure } from "../../../../../../../generated/prisma/client"

/* type Treasure = {
  id: string;
  name: string;
  description: Prisma.JsonValue;
  latitude: number;
  longitude: number;
  code: string;
  safeCode: string;
  adventureId: string;
} */

type Props ={
  treasure: Treasure
}

export function TreasureCard({treasure} : Props) {
  const router = useRouter()

  return (
    <Card size="sm" className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Le trésor de cette aventure</CardTitle>
      </CardHeader>
      <CardContent>
      
          <p>{treasure.name}</p>
      
    
     
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          Modifier
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  )
}
