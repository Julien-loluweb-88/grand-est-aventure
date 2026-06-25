import {
  Compass,
  MapPin,
  Puzzle,
  Sparkles,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCountFr } from "@/lib/format-duration-fr";
import type { HomeStatIcon, HomeStatItem } from "../_lib/home-stats";

const ICONS: Record<HomeStatIcon, LucideIcon> = {
  "map-pin": MapPin,
  compass: Compass,
  puzzle: Puzzle,
  trophy: Trophy,
  sparkles: Sparkles,
  users: Users,
  star: Star,
};

type HomeStatGridProps = {
  items: HomeStatItem[];
};

export function HomeStatGrid({ items }: HomeStatGridProps) {
  return (
    <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <li key={item.label}>
            <Card className="h-full border-[#281401]/10 bg-white/85 text-center shadow-sm">
              <CardHeader className="pb-2">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-[#e8f5e0] text-[#39951a]">
                  <Icon className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-3xl font-bold tabular-nums text-[#281401]">
                  {formatCountFr(item.value)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[#281401]/75">{item.label}</CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
