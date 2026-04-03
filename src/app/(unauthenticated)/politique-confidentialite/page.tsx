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
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité et protection des données — service Balad’indice (RGPD).",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageShell
      title="Politique de confidentialité"
      lead={
        <p>
          Dernière mise à jour : 1er avril 2026. La présente politique décrit les
          traitements de données réalisés dans le cadre du site et du service{" "}
          <strong className="font-semibold text-[#281401]">Balad&apos;indice</strong>{" "}
          (parcours, comptes joueurs, avis, administration le cas échéant), dans le
          respect du Règlement (UE) 2016/679 (RGPD) et de la loi « Informatique et
          libertés ».
        </p>
      }
    >
      <div className="space-y-12">
        <LegalSection id="responsable" title="1. Responsable du traitement">
          <p>
            Le responsable du traitement est l&apos;éditeur du service, identifié
            dans les{" "}
            <Link href="/mentions-legales" className={legalLinkClass}>
              mentions légales
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="collecte" title="2. Données collectées et finalités">
          <p>Selon les fonctionnalités que vous utilisez, peuvent être traitées :</p>
          <LegalList>
            <li>
              <strong className="font-semibold text-[#281401]">
                Compte et authentification
              </strong>{" "}
              : identifiant, adresse e-mail, mot de passe (haché côté serveur),
              données de session / jetons, et le cas échéant informations fournies
              par un fournisseur de connexion tiers (Google, Facebook, Discord,
              etc.) si ces options sont activées —{" "}
              <em>fourniture du service et sécurité</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Activité de jeu</strong>{" "}
              : progression sur les parcours, validations d&apos;énigmes et
              d&apos;étapes trésor, attributions de badges ou équivalents —{" "}
              <em>exécution du service et statistiques d&apos;usage agrégées</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Avis et contenus</strong>{" "}
              : texte et éventuellement photographies transmis en fin de parcours —{" "}
              <em>gestion des retours utilisateurs et modération</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Géolocalisation</strong>{" "}
              : si vous autorisez la localisation sur l&apos;appareil, elle peut
              servir à proposer des parcours à proximité —{" "}
              <em>uniquement avec consentement explicite lorsque requis</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Publicités</strong> :
              données techniques ou d&apos;événements nécessaires au bon affichage et
              à la mesure d&apos;audience / lutte contre la fraude, selon la mise en
              œuvre effective du service.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Journaux et maintenance
              </strong>{" "}
              : adresse IP, logs serveur, type de navigateur ou d&apos;app —{" "}
              <em>sécurité, diagnostic et obligations légales</em>.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="bases" title="3. Bases légales">
          <p>
            Les traitements reposent notamment sur l&apos;exécution des{" "}
            <Link href="/cgu" className={legalLinkClass}>
              CGU
            </Link>{" "}
            (fourniture du jeu et du compte), l&apos;intérêt légitime (sécurité,
            amélioration du service, mesures d&apos;audience dans le respect du
            cadre applicable), et le cas échéant votre consentement (cookies non
            essentiels, notifications, géolocalisation optionnelle).
          </p>
        </LegalSection>

        <LegalSection id="destinataires" title="4. Destinataires et sous-traitants">
          <p>
            Les données sont destinées aux équipes habilitées de l&apos;éditeur et,
            pour l&apos;hébergement, l&apos;authentification (ex. solution type
            Better Auth), l&apos;envoi d&apos;e-mails, l&apos;hébergement de fichiers
            ou cartes, à des prestataires techniques strictement nécessaires, liés
            par des obligations contractuelles (confidentialité, RGPD). Une liste
            actualisée des principaux sous-traitants peut être fournie sur demande.
          </p>
        </LegalSection>

        <LegalSection id="transferts" title="5. Transferts hors Union européenne">
          <p>
            Si un sous-traitant est situé hors de l&apos;Espace économique européen,
            des garanties appropriées (clauses contractuelles types de la Commission,
            mesures complémentaires) sont mises en œuvre conformément au RGPD.
          </p>
        </LegalSection>

        <LegalSection id="durees" title="6. Durées de conservation">
          <p>
            Les données de compte et de jeu sont conservées pendant la durée
            d&apos;utilisation du service et un délai raisonnable après clôture du
            compte ou d&apos;inactivité prolongée (sauf obligations légales de
            conservation plus longues). Les logs techniques sont conservés pour une
            durée limitée compatible avec la sécurité et la défense en justice.
          </p>
        </LegalSection>

        <LegalSection id="droits" title="7. Vos droits">
          <p>
            Vous disposez d&apos;un droit d&apos;accès, de rectification,
            d&apos;effacement, de limitation, de portabilité (lorsqu&apos;il
            s&apos;applique), et d&apos;opposition pour les traitements fondés sur
            l&apos;intérêt légitime, ainsi que du droit de retirer votre consentement
            à tout moment lorsque le traitement en dépend. Vous pouvez introduire une
            réclamation auprès de la CNIL (
            <a
              href="https://www.cnil.fr"
              className={legalLinkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              www.cnil.fr
            </a>
            ).
          </p>
          <p>
            Pour exercer vos droits, contactez l&apos;éditeur aux coordonnées des{" "}
            <Link href="/mentions-legales" className={legalLinkClass}>
              mentions légales
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="cookies" title="8. Cookies et traceurs">
          <p>
            Le site et l&apos;application peuvent utiliser des cookies ou stockages
            locaux nécessaires au fonctionnement (session, préférences) et, avec
            votre accord lorsque la loi l&apos;exige, pour la mesure d&apos;audience
            ou la publicité. Vous pouvez paramétrer votre navigateur ou
            l&apos;interface de gestion du consentement lorsqu&apos;elle est proposée.
          </p>
        </LegalSection>

        <LegalSection id="mineurs" title="9. Mineurs">
          <p>
            Le service s&apos;adresse notamment aux familles. La création de compte
            par un mineur doit être effectuée avec l&apos;accord du titulaire de
            l&apos;autorité parentale lorsque cela est requis par la loi. Ne fournissez
            pas de données inutiles concernant des enfants.
          </p>
        </LegalSection>
      </div>

      <LegalFooterNote>
        Pour les règles d&apos;usage du service, voir les{" "}
        <Link href="/cgu" className={legalLinkClass}>
          conditions générales d&apos;utilisation
        </Link>
        .
      </LegalFooterNote>
    </LegalPageShell>
  );
}
