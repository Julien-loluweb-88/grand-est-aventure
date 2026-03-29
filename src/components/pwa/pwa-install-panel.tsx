"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari =
    /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  const iosStandalone = "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mq.matches || iosStandalone;
}

export function PwaInstallPanel() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installedHint, setInstalledHint] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setIos(isIosSafari());
    setStandalone(isStandaloneDisplay());
  }, []);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setInstalledHint(true);
    }
  }, [deferredPrompt]);

  if (standalone || installedHint) {
    return (
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle>Application installée</CardTitle>
          <CardDescription>
            Vous utilisez déjà l’application comme une app (mode autonome ou
            écran d’accueil).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card id="pwa" className="rounded-none">
      <CardHeader>
        <CardTitle>Installer l’application</CardTitle>
        <CardDescription>
          Ajoutez le tableau de bord à votre écran d’accueil pour un accès
          rapide, comme une application native.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {deferredPrompt ? (
          <Button type="button" onClick={() => void handleInstallClick()}>
            Installer l’application
          </Button>
        ) : ios ? (
          <p className="text-sm text-muted-foreground">
            Sur iPhone ou iPad : touchez le bouton{" "}
            <span className="font-medium text-foreground">Partager</span>, puis
            choisissez{" "}
            <span className="font-medium text-foreground">
              Sur l’écran d’accueil
            </span>
            .
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Votre navigateur n’a pas proposé l’installation pour l’instant.
            Utilisez Chrome ou Edge sur ordinateur ou Android, ou le menu du
            navigateur « Installer l’application » / « Ajouter à l’écran
            d’accueil » si disponible. Un certificat HTTPS (y compris en dev avec{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              next dev --experimental-https
            </code>
            ) améliore la détection.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
