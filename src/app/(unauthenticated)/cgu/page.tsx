import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalFooterNote,
  LegalList,
  LegalPageShell,
  LegalSection,
  LegalTableOfContents,
  LegalTocItem,
  legalLinkClass,
} from "../_components/legal-document-shell";
import {
  LEGAL_LAST_UPDATED,
  MOBILE_APP,
  SITE_PUBLISHER,
  formatPublisherAddress,
} from "@/lib/site-legal";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation",
  description:
    "Conditions générales d’utilisation du site, de l’application mobile et de l’API Balad'indice — parcours, énigmes et chasses au trésor.",
};

export default function CguPage() {
  return (
    <LegalPageShell
      title="Conditions générales d&apos;utilisation"
      lead={
        <p>
          Dernière mise à jour : {LEGAL_LAST_UPDATED}. Les présentes conditions régissent
          l&apos;utilisation du site web, de l&apos;application mobile{" "}
          <strong className="font-semibold text-[#281401]">Balad&apos;indice</strong>{" "}
          (Android via Google Play) et des API associées : parcours de type chasse au
          trésor, énigmes, balades urbaines et fonctionnalités connexes (avis, badges,
          publicités partenaires, espace d&apos;administration).
        </p>
      }
    >
      <LegalTableOfContents>
        <LegalTocItem href="#objet">Objet et acceptation</LegalTocItem>
        <LegalTocItem href="#service">Description du service</LegalTocItem>
        <LegalTocItem href="#compte">Compte et accès</LegalTocItem>
        <LegalTocItem href="#regles">Règles d&apos;utilisation</LegalTocItem>
        <LegalTocItem href="#contenus">Contenus des utilisateurs</LegalTocItem>
        <LegalTocItem href="#recompenses">Badges et récompenses</LegalTocItem>
        <LegalTocItem href="#propriete">Propriété intellectuelle</LegalTocItem>
        <LegalTocItem href="#donnees">Données personnelles</LegalTocItem>
        <LegalTocItem href="#securite">Activités extérieures</LegalTocItem>
        <LegalTocItem href="#publicite">Publicités et partenaires</LegalTocItem>
        <LegalTocItem href="#disponibilite">Disponibilité</LegalTocItem>
        <LegalTocItem href="#responsabilite">Responsabilité</LegalTocItem>
        <LegalTocItem href="#modifications">Modifications des CGU</LegalTocItem>
        <LegalTocItem href="#droit">Droit applicable</LegalTocItem>
      </LegalTableOfContents>

      <div className="mt-8 space-y-12 sm:mt-10">
        <LegalSection id="objet" title="1. Objet et acceptation">
          <p>
            Les présentes Conditions Générales d&apos;Utilisation («{" "}
            <strong className="font-semibold text-[#281401]">CGU</strong> ») définissent
            les modalités d&apos;accès et d&apos;utilisation du service Balad&apos;indice.
            En créant un compte, en vous connectant ou en utilisant une fonctionnalité
            (parcours, validation d&apos;énigmes, avis, publicités, API), vous acceptez
            les présentes CGU. Si vous ne les acceptez pas, vous ne devez pas utiliser le
            service.
          </p>
          <p>
            Le service est édité par{" "}
            <strong className="font-semibold text-[#281401]">
              {SITE_PUBLISHER.legalName}
            </strong>{" "}
            ({SITE_PUBLISHER.tradeName}), {SITE_PUBLISHER.legalForm}, dont le siège est
            situé {formatPublisherAddress()}. La marque exploitée est{" "}
            <strong className="font-semibold text-[#281401]">
              {SITE_PUBLISHER.serviceName}
            </strong>
            . Coordonnées complètes dans les{" "}
            <Link href="/mentions-legales" className={legalLinkClass}>
              mentions légales
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="service" title="2. Description du service">
          <p>
            Balad&apos;indice permet de découvrir et de suivre des{" "}
            <strong className="font-semibold text-[#281401]">
              parcours d&apos;aventure
            </strong>{" "}
            publiés par l&apos;éditeur ou des partenaires habilités (collectivités,
            associations, organisateurs). Chaque parcours peut combiner :
          </p>
          <LegalList>
            <li>
              des points d&apos;intérêt et indices sur le terrain ou dans
              l&apos;application ;
            </li>
            <li>
              des énigmes dont la validation est contrôlée côté serveur (ordre des
              étapes, anti-triche) ;
            </li>
            <li>
              une phase « trésor » (localisation sur carte, saisie d&apos;un code
              coffre) ;
            </li>
            <li>
              des badges virtuels ou physiques, et le cas échéant des lots ou offres
              partenaires selon les règles affichées dans le parcours.
            </li>
          </LegalList>
          <p>
            Le service comprend également un site public (présentation, téléchargement
            de l&apos;application), des API de jeu consommées par l&apos;application
            mobile, et un espace d&apos;administration réservé aux comptes autorisés
            (création de parcours, modération, gestion des publicités). Certains
            parcours peuvent être en mode démonstration ou en cours de développement,
            avec un accès restreint.
          </p>
          <p>
            Les informations affichées dans l&apos;application (carte, indices,
            progression) sont fournies à des fins ludiques. Elles n&apos;emportent pas
            d&apos;obligation de résultat au-delà de la bonne exécution du service tel
            que publié.
          </p>
        </LegalSection>

        <LegalSection id="compte" title="3. Compte et accès">
          <p>
            De nombreuses fonctions nécessitent un{" "}
            <strong className="font-semibold text-[#281401]">compte utilisateur</strong>{" "}
            et une authentification sécurisée : adresse e-mail et mot de passe, et/ou
            connexion via un fournisseur tiers lorsque proposé (Google, Facebook,
            Discord). Vous vous engagez à fournir des informations exactes, à maintenir
            la confidentialité de vos identifiants et à signaler sans délai toute
            utilisation non autorisée de votre compte.
          </p>
          <p>
            Vous pouvez demander la{" "}
            <strong className="font-semibold text-[#281401]">
              suppression de votre compte
            </strong>{" "}
            depuis les paramètres (site ou application), selon la procédure en vigueur
            (confirmation par e-mail le cas échéant). La suppression entraîne la perte
            de l&apos;accès à votre progression, sauf conservation légale ou technique
            limitée décrite dans la{" "}
            <Link href="/politique-confidentialite" className={legalLinkClass}>
              politique de confidentialité
            </Link>
            .
          </p>
          <p>
            L&apos;accès au tableau de bord d&apos;administration, aux outils de gestion
            des parcours ou aux espaces commerçants est réservé aux comptes
            explicitement habilités (rôles administrateur, super-administrateur ou
            commerçant partenaire). Toute tentative d&apos;accès non autorisé est
            interdite et peut entraîner la suspension du compte, des mesures techniques
            ou un signalement aux autorités.
          </p>
          <p>
            L&apos;éditeur peut suspendre, restreindre ou clôturer un compte en cas de
            manquement aux CGU, de fraude avérée ou pour des raisons de sécurité, avec
            notification lorsque cela est possible.
          </p>
        </LegalSection>

        <LegalSection id="regles" title="4. Règles d’utilisation">
          <p>En utilisant Balad&apos;indice, vous vous engagez notamment à :</p>
          <LegalList>
            <li>
              respecter les lois et règlements applicables, le droit des tiers et les
              consignes affichées sur le terrain (circulation, accès aux lieux,
              horaires) ;
            </li>
            <li>
              jouer de manière loyale : ne pas contourner les validations serveur (ordre
              des énigmes, code coffre, progression), ni utiliser de scripts, bots ou
              outils automatisés pour falsifier une partie ;
            </li>
            <li>
              ne pas extraire de façon abusive des données, du contenu ou des API
              (scraping massif, attaque par déni de service, intrusion) ;
            </li>
            <li>
              ne pas publier de contenus illicites, haineux, diffamatoires, à caractère
              pornographique ou portant atteinte à la vie privée d&apos;autrui ;
            </li>
            <li>
              ne pas abuser des offres partenaires ou des mécanismes de réclamation
              (fausses déclarations de consommation d&apos;offre, signalements
              manifestement infondés) ;
            </li>
            <li>
              respecter l&apos;espace public et la tranquillité d&apos;autrui pendant
              les parcours en extérieur.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="contenus" title="5. Contenus des utilisateurs">
          <p>
            Le service permet d&apos;envoyer des{" "}
            <strong className="font-semibold text-[#281401]">
              avis, commentaires, notes ou photographies
            </strong>{" "}
            en fin de parcours, ainsi que des signalements (badge indisponible, trésor
            absent ou dégradé). Vous garantissez disposer des droits nécessaires sur ce
            que vous transmettez et que ces contenus sont conformes à la loi.
          </p>
          <p>
            Pour le fonctionnement du service (hébergement, affichage des avis
            approuvés, modération), vous concédez à l&apos;éditeur une licence non
            exclusive, gratuite et limitée au cadre du service.{" "}
            <strong className="font-semibold text-[#281401]">
              Toute réutilisation à des fins de communication publique
            </strong>{" "}
            (site, réseaux sociaux, supports promotionnels) ne peut intervenir que si
            vous avez donné votre consentement explicite lors du dépôt de l&apos;avis,
            retirable conformément à la{" "}
            <Link href="/politique-confidentialite" className={legalLinkClass}>
              politique de confidentialité
            </Link>
            .
          </p>
          <p>
            Les contenus sont soumis à modération (validation ou refus par
            l&apos;éditeur). L&apos;éditeur peut retirer tout contenu contraire aux CGU
            ou à la loi, sans obligation de surveillance préalable.
          </p>
        </LegalSection>

        <LegalSection id="recompenses" title="6. Badges, trésors et offres">
          <p>
            Les récompenses associées à un parcours (badges virtuels, badges physiques
            à retirer, lots partenaires, avantages commerciaux) dépendent des règles
            propres à chaque parcours et des stocks disponibles. Elles sont{" "}
            <strong className="font-semibold text-[#281401]">non garanties</strong>{" "}
            tant qu&apos;elles ne sont pas expressément confirmées dans l&apos;interface
            au moment de la réussite.
          </p>
          <LegalList>
            <li>
              Les <strong className="font-semibold text-[#281401]">badges physiques</strong>{" "}
              sont soumis aux conditions de retrait, de disponibilité et de durée
              indiquées par l&apos;organisateur du parcours ;
            </li>
            <li>
              Les <strong className="font-semibold text-[#281401]">lots partenaires</strong>{" "}
              peuvent être attribués selon des règles de tirage ou de probabilité
              affichées dans le parcours ;
            </li>
            <li>
              Les <strong className="font-semibold text-[#281401]">offres commerciales</strong>{" "}
              proposées par des partenaires (commerces, associations, collectivités)
              peuvent être soumises à validation par le partenaire, à un plafond
              d&apos;utilisation par joueur et à des dates de validité.
            </li>
          </LegalList>
          <p>
            L&apos;éditeur n&apos;est pas responsable de l&apos;indisponibilité d&apos;un
            point de retrait, du vol ou de la dégradation d&apos;un trésor sur le terrain,
            ni du refus d&apos;un partenaire d&apos;honorer une offre lorsque les
            conditions affichées l&apos;autorisent. Signalez tout problème via les
            mécanismes prévus dans l&apos;application (avis, signalement) ou le{" "}
            <Link href="/contact" className={legalLinkClass}>
              formulaire de contact
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="propriete" title="7. Propriété intellectuelle">
          <p>
            La marque Balad&apos;indice, le logo, l&apos;interface, les textes,
            visuels, bases de données, API et logiciels mis à disposition par
            l&apos;éditeur sont protégés. Toute reproduction, représentation,
            extraction ou réutilisation commerciale non autorisée est interdite, sauf
            exceptions légales.
          </p>
          <p>
            Les parcours, textes, images et contenus créés par des tiers (villes,
            partenaires, commerçants) peuvent faire l&apos;objet de droits distincts.
            Leur utilisation reste limitée à une expérience personnelle dans le cadre du
            jeu, sans revente ni réexploitation commerciale sans accord écrit du titulaire
            des droits.
          </p>
        </LegalSection>

        <LegalSection id="donnees" title="8. Données personnelles">
          <p>
            Les traitements de données (compte, progression, géolocalisation, avis,
            publicités, notifications) sont détaillés dans la{" "}
            <Link href="/politique-confidentialite" className={legalLinkClass}>
              politique de confidentialité
            </Link>
            . Pour exercer vos droits (accès, rectification, effacement, opposition,
            limitation, portabilité), contactez{" "}
            <a href={`mailto:${SITE_PUBLISHER.email}`} className={legalLinkClass}>
              {SITE_PUBLISHER.email}
            </a>{" "}
            ou le{" "}
            <Link href="/contact" className={legalLinkClass}>
              formulaire de contact
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="securite" title="9. Activités extérieures et sécurité">
          <p>
            Les parcours se déroulent souvent en extérieur et impliquent déplacements,
            observation de l&apos;environnement et parfois interaction avec des supports
            physiques (coffres, panneaux, badges). Vous participez sous votre seule
            responsabilité et selon votre capacité physique. Vous devez respecter le
            code de la route, surveiller les mineurs dont vous avez la charge et adapter
            votre comportement aux conditions météorologiques, de visibilité et de
            fréquentation des lieux.
          </p>
          <p>
            L&apos;éditeur ne garantit pas l&apos;absence de risque sur les lieux ni
            l&apos;exactitude permanente des indications terrain (travaux, fermetures,
            déplacement ou disparition d&apos;objets). Ne vous exposez pas à un danger
            pour progresser dans un parcours.
          </p>
        </LegalSection>

        <LegalSection id="publicite" title="10. Publicités et partenaires">
          <p>
            Le service peut afficher des messages promotionnels de partenaires
            (commerces, associations, collectivités) dans des emplacements dédiés de
            l&apos;application, éventuellement filtrés selon votre zone géographique.
            Des statistiques d&apos;impression et de clic peuvent être enregistrées à
            des fins de mesure interne et de lutte contre les abus, comme indiqué dans
            la{" "}
            <Link href="/politique-confidentialite" className={legalLinkClass}>
              politique de confidentialité
            </Link>
            .
          </p>
          <p>
            Les comptes commerçants habilités peuvent remplir des emplacements
            publicitaires soumis à validation par l&apos;éditeur. Les offres partenaires
            proposées aux joueurs (badges, avantages) sont régies par les conditions
            affichées dans l&apos;application et par les règles de validation du
            partenaire. Les liens externes ouvrent des sites tiers sur lesquels
            s&apos;appliquent leurs propres conditions.
          </p>
          <p>
            L&apos;application est distribuée sur{" "}
            <a
              href={MOBILE_APP.playStoreUrl}
              className={legalLinkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Play
            </a>
            , soumis aux conditions de Google.
          </p>
        </LegalSection>

        <LegalSection id="disponibilite" title="11. Disponibilité et évolutions">
          <p>
            Le service est fourni « en l&apos;état ». L&apos;éditeur s&apos;efforce
            d&apos;en assurer la disponibilité mais ne garantit pas une absence totale
            d&apos;interruption (maintenance, mise à jour, incident technique, cas de
            force majeure). Le service est hébergé sur une infrastructure opérée par
            l&apos;éditeur en France (voir{" "}
            <Link href="/mentions-legales" className={legalLinkClass}>
              mentions légales
            </Link>
            ).
          </p>
          <p>
            Les fonctionnalités, parcours, règles de jeu et contenus partenaires peuvent
            évoluer. En cas de modification substantielle des CGU, la date de mise à
            jour en tête de page est modifiée ; la poursuite d&apos;utilisation vaut
            acceptation des CGU en vigueur, sauf droit impératif contraire.
          </p>
        </LegalSection>

        <LegalSection id="responsabilite" title="12. Responsabilité">
          <p>
            Dans les limites autorisées par le droit français, la responsabilité de
            l&apos;éditeur ne peut être engagée qu&apos;en cas de faute prouvée lui
            étant directement imputable. Sont exclus, sauf disposition légale
            impérative, les dommages indirects ou immatériels non prévus par la loi.
          </p>
          <p>
            L&apos;éditeur n&apos;est pas partie aux relations contractuelles entre un
            joueur et un partenaire commercial (offre, badge, lot) lorsque celles-ci
            relèvent exclusivement du partenaire, sous réserve de la bonne exécution des
            fonctionnalités techniques mises à disposition.
          </p>
          <p>
            Le service est principalement gratuit pour les joueurs ; en l&apos;absence de
            prestation payante directe, les montants éventuellement dus au titre de
            réparation sont plafonnés dans la mesure permise par la loi.
          </p>
        </LegalSection>

        <LegalSection id="modifications" title="13. Modifications des CGU">
          <p>
            Les CGU peuvent être mises à jour pour refléter l&apos;évolution du service
            ou des obligations légales. La date affichée en tête de page est modifiée en
            conséquence. Nous vous invitons à les consulter régulièrement.
          </p>
        </LegalSection>

        <LegalSection id="droit" title="14. Droit applicable et litiges">
          <p>
            Les présentes CGU sont régies par le{" "}
            <strong className="font-semibold text-[#281401]">droit français</strong>. En
            cas de litige, une résolution amiable sera recherchée en priorité via{" "}
            <a href={`mailto:${SITE_PUBLISHER.email}`} className={legalLinkClass}>
              {SITE_PUBLISHER.email}
            </a>{" "}
            ou le{" "}
            <Link href="/contact" className={legalLinkClass}>
              formulaire de contact
            </Link>
            .
          </p>
          <p>
            À défaut d&apos;accord amiable, les tribunaux français seront compétents,
            sous réserve des règles d&apos;ordre public applicables aux consommateurs
            (notamment leur droit d&apos;introduire une action devant le tribunal de
            leur résidence ou de recourir à une médiation de la consommation ou à la
            plateforme européenne de règlement en ligne des litiges lorsque ces
            dispositifs s&apos;appliquent).
          </p>
        </LegalSection>
      </div>

      <LegalFooterNote>
        Questions sur ces conditions :{" "}
        <a href={`mailto:${SITE_PUBLISHER.email}`} className={legalLinkClass}>
          {SITE_PUBLISHER.email}
        </a>{" "}
        ou le{" "}
        <Link href="/contact" className={legalLinkClass}>
          formulaire de contact
        </Link>
        . Données personnelles :{" "}
        <Link href="/politique-confidentialite" className={legalLinkClass}>
          politique de confidentialité
        </Link>
        .
      </LegalFooterNote>
    </LegalPageShell>
  );
}
