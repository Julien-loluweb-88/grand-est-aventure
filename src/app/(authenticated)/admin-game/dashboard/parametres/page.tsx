import { PwaInstallPanel } from "@/components/pwa/pwa-install-panel";

export default function ParametresPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Options de l’interface d’administration.
        </p>
      </div>
      <PwaInstallPanel />
    </div>
  );
}
