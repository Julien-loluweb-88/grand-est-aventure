"use client";

import { useEffect, useRef, useState } from "react";

let modelViewerScriptPromise: Promise<void> | null = null;

/**
 * Charge le web component `model-viewer` (Google) une fois — pas de paquet npm
 * (léger ; lecture des animations embarquées dans le .glb si présentes).
 */
function ensureModelViewerScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.customElements.get("model-viewer")) return Promise.resolve();
  if (modelViewerScriptPromise) return modelViewerScriptPromise;

  modelViewerScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    script.onload = () => {
      void window.customElements
        .whenDefined("model-viewer")
        .then(() => resolve())
        .catch(() => reject(new Error("Web component model-viewer introuvable.")));
    };
    script.onerror = () => {
      modelViewerScriptPromise = null;
      reject(new Error("Script model-viewer bloqué ou indisponible."));
    };
    document.head.appendChild(script);
  });

  return modelViewerScriptPromise;
}

function toAbsoluteModelSrc(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (typeof window === "undefined") return href;
  return new URL(href, window.location.origin).toString();
}

type Props = {
  modelUrl: string;
  posterUrl?: string | null;
};

/**
 * Aperçu 3D interactif (rotation caméra, auto-rotation ; `autoplay` pour les clips glTF).
 */
export function AvatarGlbPreview({ modelUrl, posterUrl }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let mv: HTMLElement | null = null;
    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        host.replaceChildren();
        await ensureModelViewerScript();
        if (cancelled) return;

        mv = document.createElement("model-viewer") as HTMLElement;
        mv.setAttribute("src", toAbsoluteModelSrc(modelUrl));
        if (posterUrl?.trim()) {
          mv.setAttribute("poster", toAbsoluteModelSrc(posterUrl.trim()));
        }
        mv.setAttribute("alt", "Aperçu du modèle 3D");
        mv.setAttribute("camera-controls", "");
        mv.setAttribute("auto-rotate", "");
        mv.setAttribute("autoplay", "");
        mv.setAttribute("shadow-intensity", "1");
        mv.classList.add("w-full", "rounded-md", "border", "bg-muted");
        mv.style.height = "min(50vh, 320px)";

        const onErr = () => {
          if (!cancelled) setError("Impossible d’afficher ce fichier (format ou réseau).");
        };
        mv.addEventListener("error", onErr);

        host.appendChild(mv);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Aperçu indisponible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (mv?.parentNode) mv.remove();
      host.replaceChildren();
    };
  }, [modelUrl, posterUrl]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Aperçu interactif (glisser pour tourner). Les animations incluses dans le .glb peuvent se lancer
        automatiquement.
      </p>
      {loading && <p className="text-xs text-muted-foreground">Chargement de l’aperçu…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div ref={hostRef} className="w-full" />
    </div>
  );
}
