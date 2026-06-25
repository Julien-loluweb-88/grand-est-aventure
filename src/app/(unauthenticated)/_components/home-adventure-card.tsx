import Image from "next/image";
import { Clock, MapPin, Puzzle, Star, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HomeAdventurePreview } from "../acceuil.action";

type HomeAdventureCardProps = {
  adventure: HomeAdventurePreview;
};

export function HomeAdventureCard({ adventure }: HomeAdventureCardProps) {
  const {
    name,
    coverImageUrl,
    cityName,
    descriptionExcerpt,
    distanceKm,
    durationLabel,
    enigmaCount,
    hasTreasure,
    averageRating,
    reviewCount,
    completionCount,
  } = adventure;

  return (
    <Card className="group h-full overflow-hidden border-[#281401]/10 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:border-[#68a618]/25 hover:shadow-md">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#e8f5e0]">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#68a618]/40">
            <MapPin className="size-12" aria-hidden />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#281401]/75 to-transparent px-3 pb-3 pt-10">
          <p className="text-xs font-medium uppercase tracking-wider text-white/80">
            {cityName}
          </p>
          <CardTitle className="text-lg leading-snug text-white drop-shadow-sm">
            {name}
          </CardTitle>
        </div>
      </div>

      <CardHeader className="space-y-2 pb-2 pt-4">
        {descriptionExcerpt ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-[#281401]/75">
            {descriptionExcerpt}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 text-xs text-[#281401]/70">
          {durationLabel !== "—" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e0] px-2.5 py-1">
              <Clock className="size-3.5 text-[#39951a]" aria-hidden />
              {durationLabel}
            </span>
          ) : null}
          {distanceKm != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fef0c7]/80 px-2.5 py-1">
              <MapPin className="size-3.5 text-[#39951a]" aria-hidden />
              {distanceKm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km
            </span>
          ) : null}
          {enigmaCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e0] px-2.5 py-1">
              <Puzzle className="size-3.5 text-[#39951a]" aria-hidden />
              {enigmaCount} énigme{enigmaCount > 1 ? "s" : ""}
            </span>
          ) : null}
          {hasTreasure ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fef0c7]/80 px-2.5 py-1">
              <Trophy className="size-3.5 text-[#39951a]" aria-hidden />
              Trésor
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-3 pb-4 text-xs text-[#281401]/65">
        {averageRating != null && reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-[#281401]/85">
            <Star className="size-3.5 fill-[#f5c518] text-[#f5c518]" aria-hidden />
            {averageRating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
            <span className="font-normal text-[#281401]/55">
              ({reviewCount} avis)
            </span>
          </span>
        ) : null}
        {completionCount > 0 ? (
          <span>
            {completionCount.toLocaleString("fr-FR")} partie
            {completionCount > 1 ? "s" : ""} terminée{completionCount > 1 ? "s" : ""}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
