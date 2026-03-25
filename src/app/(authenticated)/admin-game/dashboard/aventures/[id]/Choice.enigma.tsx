"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

type Props = {
    maxChoices?: number;
}
export function ChoiceInput({ maxChoices = 4 }: Props) {

    return(
        <div>
        <Label>Choix de réponse</Label>
        {Array.from({ length: maxChoices }).map((_, index) => (
        <div key={index}>
        <input
        name={`Réponse${index +1}`}
        placeholder={`Réponse${index +1}`}
/> 
</div>
))}
</div>
);
}