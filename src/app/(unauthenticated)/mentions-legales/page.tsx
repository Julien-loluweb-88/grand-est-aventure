import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "../_components/legal-document-shell";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site et du service Balad’indice — éditeur, hébergement, propriété intellectuelle.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 py-4 sm:py-6">
      <article className="bg-[#fffaeb] p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight">Mentions légales</h1>
        <p className="mt-3 text-sm text-[#281401]/80 sm:text-base">
          Dernière mise à jour : 1er avril 2026. Conformément aux articles 6-III
          et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l&apos;économie numérique.
        </p>

        <LegalSection id="editeur" title="1. Éditeur du site">
          <p>
            Le présent site et le service{' '}
            <strong className="font-semibold">Balad&apos;indice</strong> sont publiés
            par :
          </p>
          <ul className="ms-4 list-inside list-disc space-y-2 marker:text-[#68a618]">
            <li>
              <strong className="font-semibold">Dénomination</strong> : LoluWeb (à
              compléter : forme juridique et raison sociale exacte)
            </li>
            <li>
              <strong className="font-semibold">Siège social</strong> : adresse à
              compléter, France
            </li>
            <li>
              <strong className="font-semibold">Contact</strong> : courriel et/ou
              formulaire — voir le lien « Contact » en pied de page lorsqu&apos;il est
              actif
            </li>
            <li>
              <strong className="font-semibold">Représentant légal / publication</strong>{' '}
              : nom du directeur de la publication à compléter
            </li>
            <li>
              <strong className="font-semibold">Immatriculation</strong> : RCS / RM à
              compléter si applicable
            </li>
            <li>
              <strong className="font-semibold">TVA intracommunautaire</strong> : à
              compléter si applicable
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="hebergement" title="2. Hébergement">
          <p>
            Le site est hébergé par l&apos;infrastructure précisée par
            l&apos;éditeur au moment du déploiement (prestataire cloud ou serveur
            dédié).{' '}
            <strong className="font-semibold">
              Dénomination, adresse et contact de l&apos;hébergeur : à compléter.
            </strong>
          </p>
        </LegalSection>

        <LegalSection id="propriete" title="3. Propriété intellectuelle">
          <p>
            La marque <strong className="font-semibold">Balad&apos;indice</strong>,
            les logos, textes, graphismes, photographies et autres contenus édités
            sur le site sont la propriété de l&apos;éditeur ou de ses partenaires et
            sont protégés par le Code de la propriété intellectuelle. Toute
            reproduction ou représentation non autorisée est interdite sauf
            exceptions légales.
          </p>
        </LegalSection>

        <LegalSection id="donnees" title="4. Données personnelles">
          <p>
            Les traitements mis en œuvre à partir du site ou de l&apos;application
            sont présentés dans la{' '}
            <Link
              href="/politique-confidentialite"
              className="font-semibold underline underline-offset-2 hover:no-underline"
            >
              Politique de confidentialité
            </Link>
            . Pour tout exercice de droits (accès, rectification, etc.), utilisez
            les coordonnées indiquées dans cette politique ou ci-dessus.
          </p>
        </LegalSection>

        <p className="mt-10 border-t border-[#281401]/15 pt-6 text-sm text-[#281401]/75">
          Les conditions d&apos;utilisation du jeu et des comptes utilisateurs sont
          précisées dans les{' '}
          <Link
            href="/cgu"
            className="underline underline-offset-2 hover:no-underline"
          >
            conditions générales d&apos;utilisation
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
