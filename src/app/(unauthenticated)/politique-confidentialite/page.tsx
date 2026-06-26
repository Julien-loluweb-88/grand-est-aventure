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
  formatPublisherAddress,
  LEGAL_LAST_UPDATED,
  MOBILE_APP,
  SITE_PUBLISHER,
} from "@/lib/site-legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité et protection des données — site, application mobile et API Balad'indice (RGPD).",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageShell
      title="Politique de confidentialité"
      lead={
        <p>
          Dernière mise à jour : {LEGAL_LAST_UPDATED}. La présente politique décrit les
          traitements de données réalisés dans le cadre du site web, de
          l&apos;application mobile{" "}
          <strong className="font-semibold text-[#281401]">Balad&apos;indice</strong>{" "}
          (Android via Google Play) et des API associées (parcours, comptes joueurs,
          avis, publicités partenaires, espace d&apos;administration pour les personnes
          habilitées), dans le respect du Règlement (UE) 2016/679 (RGPD) et de la loi
          « Informatique et libertés ».
        </p>
      }
    >
      <LegalTableOfContents>
        <LegalTocItem href="#responsable">Responsable du traitement</LegalTocItem>
        <LegalTocItem href="#collecte">Données collectées</LegalTocItem>
        <LegalTocItem href="#bases">Bases légales</LegalTocItem>
        <LegalTocItem href="#destinataires">Destinataires</LegalTocItem>
        <LegalTocItem href="#transferts">Transferts hors UE</LegalTocItem>
        <LegalTocItem href="#durees">Durées de conservation</LegalTocItem>
        <LegalTocItem href="#droits">Vos droits</LegalTocItem>
        <LegalTocItem href="#cookies">Cookies et stockage local</LegalTocItem>
        <LegalTocItem href="#notifications">Notifications</LegalTocItem>
        <LegalTocItem href="#mineurs">Mineurs</LegalTocItem>
        <LegalTocItem href="#securite">Sécurité</LegalTocItem>
      </LegalTableOfContents>

      <div className="mt-8 space-y-12 sm:mt-10">
        <LegalSection id="responsable" title="1. Responsable du traitement">
          <p>
            Le responsable du traitement est{" "}
            <strong className="font-semibold text-[#281401]">
              {SITE_PUBLISHER.legalName}
            </strong>{" "}
            ({SITE_PUBLISHER.tradeName}), {SITE_PUBLISHER.legalForm}, dont le siège est
            situé {formatPublisherAddress()}.
          </p>
          <p>
            Contact données personnelles :{" "}
            <a href={`mailto:${SITE_PUBLISHER.email}`} className={legalLinkClass}>
              {SITE_PUBLISHER.email}
            </a>{" "}
            ou via le{" "}
            <Link href="/contact" className={legalLinkClass}>
              formulaire de contact
            </Link>
            . Identité complète dans les{" "}
            <Link href="/mentions-legales" className={legalLinkClass}>
              mentions légales
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection id="collecte" title="2. Données collectées et finalités">
          <p>
            Selon les fonctionnalités que vous utilisez (site, application mobile ou
            API), peuvent être traitées les catégories suivantes :
          </p>
          <LegalList>
            <li>
              <strong className="font-semibold text-[#281401]">
                Compte et authentification
              </strong>{" "}
              : adresse e-mail, nom ou pseudo affiché, mot de passe (stocké sous forme
              hachée), jetons et données de session (dont adresse IP et type de
              navigateur ou d&apos;application lors de la connexion), statut de
              vérification de l&apos;e-mail, rôle éventuel (joueur, commerçant,
              administrateur). Si vous utilisez une connexion via un compte tiers
              (Google, Facebook ou Discord lorsque ces options sont proposées) :
              identifiant fournisseur et jetons d&apos;accès nécessaires à
              l&apos;authentification —{" "}
              <em>création du compte, sécurité et accès au service</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Profil joueur</strong>{" "}
              : coordonnées postales ou téléphone si vous les renseignez, photo de
              profil (URL d&apos;avatar généré), avatar 3D choisi, préférences
              d&apos;interface dans l&apos;application (thème, sons, affichage carte,
              etc.) — <em>personnalisation du service</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Activité de jeu</strong>{" "}
              : parcours démarrés ou terminés, validations d&apos;énigmes et
              d&apos;étapes trésor, codes coffre saisis, durée des parties, succès ou
              échec, attribution de badges virtuels ou physiques, gains éventuels liés
              à des lots partenaires —{" "}
              <em>exécution du jeu, anti-triche, statistiques et amélioration des
              parcours</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Avis et signalements
              </strong>{" "}
              : note, commentaire, photographie éventuelle, cases signalant un badge
              indisponible ou un trésor absent, et consentement distinct si vous
              autorisez la réutilisation de ces contenus pour la communication
              publique (site, réseaux sociaux, supports promotionnels) —{" "}
              <em>modération, affichage des avis approuvés et retours terrain</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Géolocalisation</strong>{" "}
              : si vous l&apos;autorisez sur l&apos;appareil, les coordonnées peuvent
              être transmises au serveur (dernière position connue) pour proposer des
              parcours à proximité, filtrer les contenus géolocalisés ou cibler les
              publicités partenaires selon une zone —{" "}
              <em>fonctionnalités de proximité, avec consentement de l&apos;OS lorsque
              requis</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Publicités et offres partenaires
              </strong>{" "}
              : affichage d&apos;encarts (commerces, associations, collectivités),
              enregistrement d&apos;impressions et de clics, masquage d&apos;une
              publicité, demandes de validation d&apos;offre partenaire —{" "}
              <em>gestion des partenariats, mesure d&apos;audience interne et lutte
              contre les abus</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Contact</strong> : nom,
              e-mail, téléphone optionnel et message transmis via le formulaire —{" "}
              <em>réponse à votre demande</em>. Ces messages sont acheminés vers un
              canal de notification interne à l&apos;éditeur ; ils ne sont pas
              destinés à constituer une base de contacts marketing.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Notifications push
              </strong>{" "}
              : identifiant technique de l&apos;appareil (jeton push) si vous acceptez
              les notifications — <em>informations sur les parcours, nouveautés ou
              messages de service</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Journaux techniques
              </strong>{" "}
              : adresse IP, horodatages, logs serveur, identifiants de requêtes —{" "}
              <em>sécurité, diagnostic, limitation du débit (anti-abus) et
              obligations légales</em>.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Administration
              </strong>{" "}
              (personnes habilitées uniquement) : actions réalisées dans le back-office
              (création de parcours, modération, gestion des utilisateurs) peuvent
              faire l&apos;objet de journaux d&apos;audit —{" "}
              <em>sécurité et traçabilité des opérations sensibles</em>.
            </li>
          </LegalList>
          <p>
            Vous n&apos;êtes pas tenu de fournir des données facultatives ; certaines
            fonctionnalités (proximité, offres géolocalisées, profil complet) peuvent
            toutefois en dépendre.
          </p>
        </LegalSection>

        <LegalSection id="bases" title="3. Bases légales">
          <p>Les traitements reposent notamment sur :</p>
          <LegalList>
            <li>
              l&apos;<strong className="font-semibold text-[#281401]">
                exécution des{" "}
                <Link href="/cgu" className={legalLinkClass}>
                  CGU
                </Link>
              </strong>{" "}
              et la fourniture du service de jeu (compte, progression, badges) ;
            </li>
            <li>
              l&apos;<strong className="font-semibold text-[#281401]">
                intérêt légitime
              </strong>{" "}
              de l&apos;éditeur (sécurité, prévention de la fraude, statistiques
              agrégées, amélioration des parcours, modération) ;
            </li>
            <li>
              votre <strong className="font-semibold text-[#281401]">consentement</strong>{" "}
              lorsque la loi l&apos;exige : géolocalisation sur l&apos;appareil,
              notifications push, réutilisation d&apos;un avis à des fins de
              communication publique, cookies non essentiels le cas échéant.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="destinataires" title="4. Destinataires et sous-traitants">
          <p>
            Les données sont accessibles aux personnes habilitées de l&apos;éditeur
            (administration, support, modération). L&apos;hébergement du site, de
            l&apos;API, de la base de données et des fichiers (images de parcours,
            badges, publicités) est assuré par l&apos;éditeur sur une infrastructure
            située en France.
          </p>
          <p>
            Des prestataires techniques peuvent intervenir, selon les fonctionnalités
            utilisées :
          </p>
          <LegalList>
            <li>
              fournisseurs de connexion par compte tiers (Google, Facebook, Discord) ;
            </li>
            <li>
              prestataire de messagerie pour les e-mails transactionnels (vérification
              de compte, réinitialisation de mot de passe, suppression de compte) ;
            </li>
            <li>
              service de notification push (Expo) pour l&apos;envoi vers les appareils
              mobiles ;
            </li>
            <li>
              canal de notification pour les messages de contact (webhook Discord) ;
            </li>
            <li>
              fournisseurs de fonds de carte (OpenStreetMap et serveurs de tuiles) sur
              le site d&apos;administration ;
            </li>
            <li>
              génération d&apos;avatars illustrés (DiceBear) lorsque vous choisissez une
              image de profil de ce type.
            </li>
          </LegalList>
          <p>
            Ces prestataires ne reçoivent que les données strictement nécessaires à leur
            intervention et sont liés par des obligations de confidentialité et de
            protection des données lorsque la loi l&apos;impose.
          </p>
        </LegalSection>

        <LegalSection id="transferts" title="5. Transferts hors Union européenne">
          <p>
            Les données hébergées sur l&apos;infrastructure de l&apos;éditeur (comptes,
            progression, fichiers, journaux techniques) sont stockées et traitées en{" "}
            <strong className="font-semibold text-[#281401]">France</strong>, au sein de
            l&apos;Union européenne. Elles ne font l&apos;objet d&apos;aucun transfert
            systématique hors de l&apos;Espace économique européen du seul fait de
            l&apos;hébergement du service.
          </p>
          <p>
            Un transfert hors UE/EEE peut intervenir lorsque vous utilisez une
            fonctionnalité s&apos;appuyant sur un prestataire situé à l&apos;étranger,
            par exemple : connexion via Google, Facebook ou Discord ; téléchargement de
            l&apos;application sur{" "}
            <a
              href={MOBILE_APP.playStoreUrl}
              className={legalLinkClass}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Play
            </a>{" "}
            ; affichage de tuiles cartographiques ; envoi de notifications push via
            Expo ; notification Discord d&apos;un message de contact ; chargement
            d&apos;une image DiceBear. Seules les données nécessaires à la
            fonctionnalité concernée sont transmises. Lorsque la loi l&apos;exige, des
            garanties appropriées sont mises en œuvre (clauses contractuelles types,
            décision d&apos;adéquation le cas échéant, mesures complémentaires).
          </p>
        </LegalSection>

        <LegalSection id="durees" title="6. Durées de conservation">
          <LegalList>
            <li>
              <strong className="font-semibold text-[#281401]">Compte et profil</strong>{" "}
              : pendant l&apos;utilisation du service, puis suppression ou anonymisation
              dans un délai raisonnable après suppression du compte (voir section 7) ou
              inactivité prolongée, sauf obligation légale contraire.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Sessions et jetons
              </strong>{" "}
              : jusqu&apos;à expiration, déconnexion ou suppression du compte.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Progression et parties
              </strong>{" "}
              : liées à la durée de vie du compte, pour permettre la reprise du jeu et
              les statistiques.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Avis approuvés</strong>{" "}
              : conservés tant qu&apos;ils sont affichés publiquement ou nécessaires à
              la modération ; les avis refusés ou les brouillons sont supprimés ou
              archivés de façon limitée.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">
                Événements publicitaires
              </strong>{" "}
              : durée limitée compatible avec les statistiques internes et la preuve en
              cas de litige commercial.
            </li>
            <li>
              <strong className="font-semibold text-[#281401]">Journaux techniques</strong>{" "}
              : durée courte à modérée selon les besoins de sécurité et de diagnostic.
            </li>
          </LegalList>
        </LegalSection>

        <LegalSection id="droits" title="7. Vos droits">
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
            rectification, d&apos;effacement, de limitation, de portabilité (lorsqu&apos;il
            s&apos;applique) et d&apos;opposition pour les traitements fondés sur
            l&apos;intérêt légitime. Vous pouvez retirer votre consentement à tout
            moment lorsque le traitement en dépend (géolocalisation, notifications,
            communication publique d&apos;un avis), sans affecter la licéité des
            traitements antérieurs.
          </p>
          <p>
            Vous pouvez{" "}
            <strong className="font-semibold text-[#281401]">
              supprimer votre compte
            </strong>{" "}
            depuis les paramètres du site (lorsque vous y êtes connecté) ou de
            l&apos;application : un e-mail de confirmation peut être requis pour
            finaliser la suppression. Les données liées au compte sont alors effacées ou
            anonymisées, sous réserve des conservation légales ou des éléments agrégés
            ne permettant plus de vous identifier.
          </p>
          <p>
            Pour exercer vos droits :{" "}
            <a href={`mailto:${SITE_PUBLISHER.email}`} className={legalLinkClass}>
              {SITE_PUBLISHER.email}
            </a>{" "}
            ou le{" "}
            <Link href="/contact" className={legalLinkClass}>
              formulaire de contact
            </Link>
            . Vous pouvez introduire une réclamation auprès de la CNIL (
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
        </LegalSection>

        <LegalSection id="cookies" title="8. Cookies et stockage local">
          <p>
            <strong className="font-semibold text-[#281401]">Site web</strong> : des
            cookies strictement nécessaires au fonctionnement sont utilisés pour
            maintenir votre session de connexion (authentification sécurisée). À ce jour,
            le site ne déploie pas de traceur publicitaire tiers ni d&apos;outil de
            mesure d&apos;audience externe (type Google Analytics). Vous pouvez
            configurer votre navigateur pour refuser les cookies ; certaines fonctions
            (connexion, espace personnel) pourraient alors ne plus être disponibles.
          </p>
          <p>
            <strong className="font-semibold text-[#281401]">Application mobile</strong>{" "}
            : des données peuvent être stockées localement sur l&apos;appareil (jeton de
            session, préférences, cache) pour assurer le fonctionnement hors ligne
            partiel et la performance. Ces stockages ne sont pas des cookies
            navigateur mais relèvent du même principe d&apos;information.
          </p>
        </LegalSection>

        <LegalSection id="notifications" title="9. Notifications push">
          <p>
            Si vous activez les notifications dans l&apos;application, un jeton technique
            est enregistré pour adresser des messages (nouveau parcours à proximité,
            rappels de service, etc.). Vous pouvez désactiver les notifications à tout
            moment dans les réglages de l&apos;appareil ou de l&apos;application ; le
            jeton associé est alors ignoré ou supprimé lors des prochaines
            synchronisations.
          </p>
        </LegalSection>

        <LegalSection id="mineurs" title="10. Mineurs">
          <p>
            Le service s&apos;adresse notamment aux familles et aux sorties scolaires ou
            associatives. La création de compte par un mineur doit être effectuée avec
            l&apos;accord du titulaire de l&apos;autorité parentale lorsque la loi
            l&apos;exige. Ne communiquez pas de données personnelles superflues
            concernant un enfant. En cas de doute sur un compte mineur, contactez
            l&apos;éditeur.
          </p>
        </LegalSection>

        <LegalSection id="securite" title="11. Sécurité">
          <p>
            L&apos;éditeur met en œuvre des mesures techniques et organisationnelles
            adaptées (authentification sécurisée, hachage des mots de passe,
            validations côté serveur des étapes de jeu, limitation du débit des
            requêtes, accès restreint au back-office). Aucune transmission sur Internet
            n&apos;est totalement invulnérable ; en cas d&apos;incident susceptible
            d&apos;affecter vos données, l&apos;éditeur s&apos;efforcera d&apos;en
            informer les personnes concernées et la CNIL lorsque la loi l&apos;impose.
          </p>
        </LegalSection>
      </div>

      <LegalFooterNote>
        Pour les règles d&apos;usage du service, voir les{" "}
        <Link href="/cgu" className={legalLinkClass}>
          conditions générales d&apos;utilisation
        </Link>
        . Hébergement et éditeur :{" "}
        <Link href="/mentions-legales" className={legalLinkClass}>
          mentions légales
        </Link>
        .
      </LegalFooterNote>
    </LegalPageShell>
  );
}
