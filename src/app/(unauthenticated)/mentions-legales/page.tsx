import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalFooterNote,
  LegalList,
  LegalPageShell,
  LegalSection,
  legalLinkClass,
} from "../_components/legal-document-shell";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site et du service Balad’indice — éditeur, hébergement, propriété intellectuelle.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell
      title="Mentions légales"
      lead={
        <p>
          Dernière mise à jour : 1er avril 2026. Conformément aux articles 6-III
          et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l&apos;économie numérique.
        </p>
      }
    >
      <div className="space-y-12">
        <LegalSection id="editeur" title="1. Éditeur du site">
          <p>
            Le présent site et le service{" "}
            <strong className="font-semibold text-[#281401]">Balad&apos;indice</strong>{" "}
            sont publiés par :
          </p>
          <LegalList>
            <li>
              <strong className="font-semibold text-[#281401]">Dénomination</strong>{" "}
              : LoluWeb (à compléter : forme juridique et raison sociale exacte)
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Siège social</strong>{" "}
              : adresse à compléter, France
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Contact</strong> : courriel
              et/ou formulaire — voir le lien « Contact » en pied de page
              lorsqu&apos;il est actif
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Représentant légal / publication
              </strong>{" "}
              : nom du directeur de la publication à compléter
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Immatriculation</strong> :
              RCS / RM à compléter si applicable
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                TVA intracommunautaire
              </strong>{" "}
              : à compléter si applicable
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="hebergement" title="2. Hébergement">
          <p>
            Le site est hébergé par l&apos;infrastructure précisée par
            l&apos;éditeur au moment du déploiement (prestataire cloud ou serveur
            dédié).{" "}
            <strong className="font-semibold text-[#281401]">
              Dénomination, adresse et contact de l&apos;hébergeur : à compléter.
            </strong>
          </p>
        </LegalSection>

        <LegalSection id="propriete" title="3. Propriété intellectuelle">
          <p>
            La marque{" "}
            <strong className="font-semibold text-[#281401]">Balad&apos;indice</strong>,
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
            sont présentés dans la{" "}
            <Link href="/politique-confidentialite" className={legalLinkClass}>
              Politique de confidentialité
            </Link>
            . Pour tout exercice de droits (accès, rectification, etc.), utilisez
            les coordonnées indiquées dans cette politique ou ci-dessus.
          </p>
        </LegalSection>
      </div>

      <LegalFooterNote>
        Les conditions d&apos;utilisation du jeu et des comptes utilisateurs sont
        précisées dans les{" "}
        <Link href="/cgu" className={legalLinkClass}>
          conditions générales d&apos;utilisation
        </Link>
        .
      </LegalFooterNote>
    </LegalPageShell>
  );
}
