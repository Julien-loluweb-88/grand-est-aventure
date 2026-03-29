"use client";

import { DashboardImageUploadField } from "@/components/uploads/DashboardImageUploadField";

type Props = {
  adventureId: string;
  disabled?: boolean;
  coverImageUrl: string;
  badgeImageUrl: string;
  onCoverChange: (v: string) => void;
  onBadgeChange: (v: string) => void;
};

export function AdventureMediaFields({
  adventureId,
  disabled,
  coverImageUrl,
  badgeImageUrl,
  onCoverChange,
  onBadgeChange,
}: Props) {
  return (
    <div className="space-y-6 border-t pt-4">
      <DashboardImageUploadField
        scope="adventure-cover"
        adventureId={adventureId}
        label="Image de présentation"
        description="Dossier racine uploads/adventures/{id}/cover.* (URL /uploads/…)."
        value={coverImageUrl}
        onChange={onCoverChange}
        disabled={disabled}
      />
      <DashboardImageUploadField
        scope="adventure-badge"
        adventureId={adventureId}
        label="Image du badge"
        description="Même fichier pour le trésor réel et la bibliothèque app (uploads/.../badge.*)."
        value={badgeImageUrl}
        onChange={onBadgeChange}
        disabled={disabled}
      />
    </div>
  );
}
