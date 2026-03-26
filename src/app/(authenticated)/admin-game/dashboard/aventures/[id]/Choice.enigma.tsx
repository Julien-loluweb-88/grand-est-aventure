"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { UseFormRegister, FieldErrors, FieldValue, FieldValues } from "react-hook-form";
import type { FormValues } from "./EnigmaCreateForm";
import { Path } from "better-auth";

type Props<T extends FieldValues> = {
    maxChoices?: number;
    register: UseFormRegister<T>;
    errors?: FieldErrors<T>;
};
export function ChoiceInput<T extends FieldValues>({ maxChoices = 4, register, errors }: Props<T>) {

    return(
        <div>
        <Label>Choix de réponse</Label>
        {Array.from({ length: maxChoices }).map((_, index) => (
        <div key={index}>
        <input
        {...register(`choices.${index}` as Path<T>)}
        placeholder={`Réponse${index +1}`}
/> 
{errors?.choices?.[index] && (
    <p className="text-red-500">
        {(errors.choices[index] as {message?: string})?.message}
    </p>
)}
</div>
))}
</div>
);
}