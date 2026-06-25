import type { HomePageSnapshot } from "../acceuil.action";

export type HomeStatIcon =
  | "map-pin"
  | "compass"
  | "puzzle"
  | "trophy"
  | "sparkles"
  | "users"
  | "star";

export type HomeStatItem = {
  icon: HomeStatIcon;
  value: number;
  label: string;
};

function pluralFr(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

/** Jusqu’à 6 cartes : territoire (catalogue) puis activité joueurs. */
export function buildHomeStatItems(snapshot: HomePageSnapshot): HomeStatItem[] {
  const items: HomeStatItem[] = [];
  const { communityStats } = snapshot;

  const push = (icon: HomeStatIcon, value: number, label: string) => {
    if (items.length < 6) items.push({ icon, value, label });
  };

  if (snapshot.adventureCount > 0) {
    push(
      "map-pin",
      snapshot.adventureCount,
      pluralFr(snapshot.adventureCount, "parcours disponible", "parcours disponibles")
    );
  }
  if (snapshot.cityCount > 0) {
    push(
      "compass",
      snapshot.cityCount,
      pluralFr(snapshot.cityCount, "ville à explorer", "villes à explorer")
    );
  }
  if (snapshot.catalogEnigmaCount > 0) {
    push(
      "puzzle",
      snapshot.catalogEnigmaCount,
      pluralFr(snapshot.catalogEnigmaCount, "énigme à résoudre", "énigmes à résoudre")
    );
  }
  if (snapshot.treasureCount > 0) {
    push(
      "trophy",
      snapshot.treasureCount,
      pluralFr(snapshot.treasureCount, "trésor à trouver", "trésors à trouver")
    );
  }

  push(
    "trophy",
    communityStats.totalAdventuresCompleted,
    pluralFr(communityStats.totalAdventuresCompleted, "partie terminée", "parties terminées")
  );
  push(
    "puzzle",
    communityStats.totalEnigmasSolved,
    pluralFr(communityStats.totalEnigmasSolved, "énigme résolue", "énigmes résolues")
  );

  if (communityStats.totalBadgesEarned > 0) {
    push(
      "sparkles",
      communityStats.totalBadgesEarned,
      pluralFr(communityStats.totalBadgesEarned, "badge gagné", "badges gagnés")
    );
  }
  if (snapshot.activePlayerCount > 0) {
    push(
      "users",
      snapshot.activePlayerCount,
      pluralFr(snapshot.activePlayerCount, "joueur actif", "joueurs actifs")
    );
  }
  if (snapshot.publishedReviewCount > 0) {
    push(
      "star",
      snapshot.publishedReviewCount,
      pluralFr(snapshot.publishedReviewCount, "avis partagé", "avis partagés")
    );
  }

  return items.slice(0, 6);
}

export function shouldShowHomeStatsSection(snapshot: HomePageSnapshot): boolean {
  return (
    snapshot.adventureCount > 0 ||
    snapshot.communityStats.totalEnigmasSolved > 0 ||
    snapshot.communityStats.totalAdventuresCompleted > 0 ||
    snapshot.communityStats.totalBadgesEarned > 0 ||
    snapshot.publishedReviewCount > 0
  );
}
