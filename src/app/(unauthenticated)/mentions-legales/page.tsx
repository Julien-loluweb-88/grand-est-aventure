import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalFooterNote,
  LegalList,
  LegalPageShell,
  LegalSection,
  legalLinkClass,
} from "../_components/legal-document-shell";
import {
  formatPublisherAddress,
  getPublicSiteUrl,
  LEGAL_LAST_UPDATED,
  MOBILE_APP,
  SITE_HOSTING,
  SITE_PUBLISHER,
} from "@/lib/site-legal";
import { resolvePlayStoreUrl } from "../_lib/play-store-url";

const siteUrl = getPublicSiteUrl();
const playStoreUrl =
  resolvePlayStoreUrl(process.env.NEXT_PUBLIC_PLAY_STORE_URL) ||
  MOBILE_APP.playStoreUrl;

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site et du service Balad'indice — éditeur Loluweb, hébergement, propriété intellectuelle et contact.",
};

export default function MentionsLegalesPage() {
  const p = SITE_PUBLISHER;

  return (
    <LegalPageShell
      title="Mentions légales"
      lead={
        <p>
          Dernière mise à jour : {LEGAL_LAST_UPDATED}. Conformément aux articles 6-III
          et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
          l&apos;économie numérique (LCEN).
        </p>
      }
    >
      <div className="space-y-12">
        <LegalSection id="editeur" title="1. Éditeur du site et du service">
          <p>
            Le site{" "}
            <a href={siteUrl} className={legalLinkClass}>
              {siteUrl}
            </a>{" "}
            et le service{" "}
            <strong className="font-semibold text-[#281401]">{p.serviceName}</strong>{" "}
            (site web, API et application mobile associée) sont édités par :
          </p>
          <LegalList>
            <li>
              <strong className="font-semibold text-[#281401]">Raison sociale</strong>{" "}
              : {p.legalName}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Nom commercial</strong>{" "}
              : {p.tradeName}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Forme juridique</strong>{" "}
              : {p.legalForm}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Siège social</strong>{" "}
              : {formatPublisherAddress()}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">SIREN</strong> : {p.siren}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">SIRET</strong> : {p.siret}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Immatriculation</strong> :{" "}
              {p.rcs}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Code NAF / APE</strong> :{" "}
              {p.naf}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                N° TVA intracommunautaire
              </strong>{" "}
              : {p.vatNumber}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Site de l&apos;éditeur</strong>{" "}
              :{" "}
              <a
                href={p.publisherWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                {p.publisherWebsite}
              </a>
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="publication" title="2. Directeur de la publication">
          <p>
            Le directeur de la publication est{" "}
            <strong className="font-semibold text-[#281401]">
              {p.directorOfPublication}
            </strong>
            , en sa qualité d&apos;entrepreneur individuel éditeur du service.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="3. Contact">
          <p>Pour toute question relative au site ou au service {p.serviceName} :</p>
          <LegalList>
            <li>
              <strong className="font-semibold text-[#281401]">Formulaire</strong> :{" "}
              <Link href="/contact" className={legalLinkClass}>
                page Contact
              </Link>
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Courriel</strong> :{" "}
              <a href={`mailto:${p.email}`} className={legalLinkClass}>
                {p.email}
              </a>
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Téléphone</strong> :{" "}
              <a href={`tel:${p.phone.replace(/\s/g, "")}`} className={legalLinkClass}>
                {p.phone}
              </a>
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Courrier</strong> :{" "}
              {formatPublisherAddress()}
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="hebergement" title="4. Hébergement">
          <p>
            Le site web, l&apos;API, la base de données et les fichiers associés sont
            hébergés sur une {SITE_HOSTING.publicDescription.toLowerCase()}
          </p>
          <LegalList>
            <li>
              <strong className="font-semibold text-[#281401]">Hébergeur</strong> :{" "}
              {SITE_HOSTING.name}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Adresse</strong> :{" "}
              {formatPublisherAddress()}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Pays</strong> :{" "}
              {SITE_HOSTING.country}
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Site</strong> :{" "}
              <a
                href={SITE_HOSTING.website}
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                {SITE_HOSTING.website}
              </a>
            </li>
          </LegalList>
          <p>
            Les données de jeu (comptes, parcours, statistiques), les fichiers médias
            (images de parcours, badges, publicités) et les sauvegardes associées sont
            conservés sur cette infrastructure, sous la responsabilité de
            l&apos;éditeur.
          </p>
        </LegalSection>

        <LegalSection id="application" title="5. Application mobile">
          <p>
            L&apos;application mobile <strong className="font-semibold text-[#281401]">{p.serviceName}</strong>{" "}
            est distribuée sur les stores suivants :
          </p>
          <LegalList>
            <li>
              <strong className="font-semibold text-[#281401]">Android (Google Play)</strong>{" "}
              — identifiant : <code className="text-[#281401]/90">{MOBILE_APP.androidPackage}</code>
              {" · "}
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={legalLinkClass}
              >
                fiche Play Store
              </a>
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">iOS (App Store)</strong> — en
              cours de déploiement
            </li>
          </LegalList>
          <p>
            L&apos;éditeur de l&apos;application sur les stores est {p.tradeName} ({p.legalName}).
            Les conditions d&apos;utilisation du jeu sont détaillées dans les{" "}
            <Link href="/cgu" className={legalLinkClass}>
              conditions générales d&apos;utilisation
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="propriete" title="6. Propriété intellectuelle">
          <p>
            La marque{" "}
            <strong className="font-semibold text-[#281401]">{p.serviceName}</strong>, les
            logos, textes, graphismes, photographies, parcours, énigmes, interfaces et autres
            contenus édités sur le site ou dans l&apos;application sont la propriété de
            l&apos;éditeur ou de ses partenaires et sont protégés par le Code de la propriété
            intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification ou exploitation non autorisée, totale
            ou partielle, est interdite sauf autorisation écrite préalable de l&apos;éditeur ou
            exceptions légales.
          </p>
          <p>
            Les communes et partenaires qui commandent un parcours disposent des droits définis
            contractuellement ; les contenus spécifiquement créés pour leur territoire ne peuvent
            être réutilisés hors du cadre convenu.
          </p>
        </LegalSection>

        <LegalSection id="donnees" title="7. Données personnelles">
          <p>
            Les traitements de données personnelles réalisés à partir du site ou de
            l&apos;application sont décrits dans la{" "}
            <Link href="/politique-confidentialite" className={legalLinkClass}>
              Politique de confidentialité
            </Link>
            . Pour exercer vos droits (accès, rectification, effacement, opposition, etc.),
            contactez l&apos;éditeur aux coordonnées indiquées ci-dessus.
          </p>
        </LegalSection>

        <LegalSection id="responsabilite" title="8. Responsabilité et liens">
          <p>
            L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude des informations
            publiées sur le site. Toutefois, il ne saurait garantir l&apos;absence d&apos;erreurs
            ou d&apos;interruptions de service. L&apos;utilisation du site et de
            l&apos;application se fait sous la responsabilité de l&apos;utilisateur.
          </p>
          <p>
            Les parcours se déroulent en extérieur : chaque joueur reste responsable de sa
            sécurité, du respect du code de la route et des règles locales (circulation,
            accès aux lieux, surveillance des mineurs).
          </p>
          <p>
            Le site peut contenir des liens vers des sites tiers (réseaux sociaux, stores,
            partenaires). L&apos;éditeur n&apos;exerce aucun contrôle sur ces sites et décline
            toute responsabilité quant à leur contenu.
          </p>
        </LegalSection>

        <LegalSection id="litiges" title="9. Droit applicable et litiges">
          <p>
            Les présentes mentions légales sont régies par le droit français. En cas de
            litige, et à défaut de résolution amiable, les tribunaux français seront seuls
            compétents, sous réserve des règles impératives applicables aux consommateurs.
          </p>
          <p>
            Conformément aux articles L.612-1 et suivants du Code de la consommation, le
            consommateur peut recourir gratuitement à un médiateur de la consommation en vue de
            la résolution amiable d&apos;un litige. L&apos;éditeur communiquera les coordonnées
            du médiateur compétent sur demande écrite.
          </p>
        </LegalSection>
      </div>

      <LegalFooterNote>
        Les conditions d&apos;utilisation du jeu et des comptes joueurs sont précisées dans
        les{" "}
        <Link href="/cgu" className={legalLinkClass}>
          conditions générales d&apos;utilisation
        </Link>
        . La protection des données est détaillée dans la{" "}
        <Link href="/politique-confidentialite" className={legalLinkClass}>
          politique de confidentialité
        </Link>
        .
      </LegalFooterNote>
    </LegalPageShell>
  );
}
