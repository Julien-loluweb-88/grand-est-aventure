import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "../_components/legal-document-shell";

export const metadata: Metadata = {
  title: "Conditions générales d’utilisation",
  description:
    "Conditions générales d’utilisation du service Balad’indice — quêtes, balades et parcours immersifs.",
};

export default function CguPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 py-4 sm:py-6">
      <article className="bg-[#fffaeb] p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            Conditions générales d&apos;utilisation
          </h1>
          <p className="mt-3 text-sm text-[#281401]/80 sm:text-base">
            Dernière mise à jour : 1er avril 2026. Les présentes conditions
            régissent l&apos;utilisation du site et du service numérique
            <strong className="font-semibold"> Balad&apos;indice</strong> (application
            mobile et/ou interface web associée, et API de jeu), proposé dans le
            cadre de parcours de type chasse au trésor, énigmes et balades (dont
            dans l&apos;espace public).
          </p>

          <nav
            aria-label="Sommaire des sections"
            className="mt-8 rounded-md border border-[#281401]/15 bg-[#fef0c7]/60 p-4 text-sm"
          >
            <p className="font-semibold">Sommaire</p>
            <ul className="mt-2 list-inside list-disc space-y-1 marker:text-[#68a618]">
              <li>
                <a href="#objet" className="underline underline-offset-2">
                  Objet et acceptation
                </a>
              </li>
              <li>
                <a href="#service" className="underline underline-offset-2">
                  Description du service
                </a>
              </li>
              <li>
                <a href="#compte" className="underline underline-offset-2">
                  Compte et accès
                </a>
              </li>
              <li>
                <a href="#regles" className="underline underline-offset-2">
                  Règles d&apos;utilisation
                </a>
              </li>
              <li>
                <a href="#contenus" className="underline underline-offset-2">
                  Contenus des utilisateurs
                </a>
              </li>
              <li>
                <a href="#propriete" className="underline underline-offset-2">
                  Propriété intellectuelle
                </a>
              </li>
              <li>
                <a href="#donnees" className="underline underline-offset-2">
                  Données personnelles
                </a>
              </li>
              <li>
                <a href="#securite" className="underline underline-offset-2">
                  Activités extérieures et sécurité
                </a>
              </li>
              <li>
                <a href="#publicite" className="underline underline-offset-2">
                  Publicités
                </a>
              </li>
              <li>
                <a href="#disponibilite" className="underline underline-offset-2">
                  Disponibilité et évolutions
                </a>
              </li>
              <li>
                <a href="#responsabilite" className="underline underline-offset-2">
                  Responsabilité
                </a>
              </li>
              <li>
                <a href="#modifications" className="underline underline-offset-2">
                  Modifications des CGU
                </a>
              </li>
              <li>
                <a href="#droit" className="underline underline-offset-2">
                  Droit applicable
                </a>
              </li>
            </ul>
          </nav>

          <LegalSection id="objet" title="1. Objet et acceptation">
            <p>
              Les présentes Conditions Générales d&apos;Utilisation («{' '}
              <strong className="font-semibold">CGU</strong> ») ont pour objet de
              définir les modalités d&apos;accès et d&apos;utilisation du service
              Balad&apos;indice. En créant un compte, en vous connectant, ou en
              utilisant toute fonctionnalité du service (parcours, validation
              d&apos;énigmes, avis, affichage de contenus), vous acceptez sans
              réserve les présentes CGU. Si vous n&apos;acceptez pas ces
              conditions, vous ne devez pas utiliser le service.
            </p>
            <p>
              L&apos;identité et les coordonnées de l&apos;éditeur du service figurent
              sur la page{' '}
              <Link
                href="/mentions-legales"
                className="font-semibold underline underline-offset-2 hover:no-underline"
              >
                Mentions légales
              </Link>
              . La marque exploitée est{' '}
              <strong className="font-semibold">Balad&apos;indice</strong>.
            </p>
          </LegalSection>

          <LegalSection id="service" title="2. Description du service">
            <p>
              Balad&apos;indice permet de découvrir et de suivre des{' '}
              <strong className="font-semibold">parcours d&apos;aventure</strong>{' '}
              (quêtes, balades) combinant indices, énigmes, codes ou dispositifs
              type QR selon les parcours proposés, et le cas échéant une phase de
              « trésor » (localisation sur carte, code coffre, attribution de
              récompenses virtuelles comme des badges, ou modalités définies par
              l&apos;organisateur du parcours). Le service peut inclure un espace
              d&apos;administration réservé aux personnes habilitées pour la
              création et la gestion des contenus.
            </p>
            <p>
              Le déroulé technique (authentification, progression, validations) peut
              s&apos;appuyer sur des API ; les informations communiquées par ces
              interfaces sont fournies aux fins du jeu et n&apos;emportent aucune
              obligation contractuelle de résultat au-delà de la bonne exécution du
              service tel que publié.
            </p>
          </LegalSection>

          <LegalSection id="compte" title="3. Compte et accès">
            <p>
              Certaines fonctions nécessitent la création d&apos;un{' '}
              <strong className="font-semibold">compte utilisateur</strong> et une
              authentification sécurisée (par exemple adresse e-mail et mot de
              passe, ou fournisseurs tiers si activés). Vous vous engagez à fournir
              des informations exactes et à maintenir la confidentialité de vos
              identifiants. Toute activité réalisée depuis votre compte est
              présumée effectuée par vous, sauf preuve d&apos;une utilisation
              frauduleuse que vous avez signalée sans délai.
            </p>
            <p>
              L&apos;accès au tableau de bord d&apos;administration et aux outils de
              gestion des parcours est réservé aux comptes explicitement autorisés
              par l&apos;éditeur ou ses partenaires. Toute tentative
              d&apos;accès non autorisé est interdite et peut faire l&apos;objet de
              mesures techniques, juridiques ou de signalement aux autorités.
            </p>
          </LegalSection>

          <LegalSection id="regles" title="4. Règles d’utilisation">
            <p>Vous vous engagez notamment à :</p>
            <ul className="ms-4 list-inside list-disc space-y-2 marker:text-[#68a618]">
              <li>
                utiliser le service de manière loyale, dans le respect des lois et
                règlements applicables, du droit des tiers et des consignes affichées
                sur le terrain ;
              </li>
              <li>
                ne pas tenter de contourner les mécanismes de validation (ordre des
                énigmes, trésor, progression), d&apos;extraire de façon abusive des
                données ou du contenu réservé aux joueurs, ni d&apos;attaquer le
                service (intrusion, saturation, etc.) ;
              </li>
              <li>
                ne pas publier ou transmettre de contenus illicites, haineux,
                diffamatoires, à caractère pornographique ou portant atteinte à la
                vie privée d&apos;autrui ;
              </li>
              <li>
                respecter l&apos;espace public, la tranquillité d&apos;autrui et les
                règles locales (circulation, horaires, accès aux lieux).
              </li>
            </ul>
            <p>
              L&apos;éditeur peut suspendre ou clôturer un compte en cas de
              manquement grave ou répété aux présentes CGU, après notification lorsque
              cela est possible et pertinent.
            </p>
          </LegalSection>

          <LegalSection id="contenus" title="5. Contenus des utilisateurs">
            <p>
              Le service peut permettre d&apos;envoyer des{' '}
              <strong className="font-semibold">
                avis, commentaires ou fichiers
              </strong>{' '}
              (texte, image) en fin de parcours ou dans d&apos;autres contextes
              prévus par l&apos;application. Vous garantissez disposer des droits
              nécessaires sur ce que vous transmettez et que ces contenus sont
              conformes à la loi.
            </p>
            <p>
              Concédant une licence non exclusive, mondiale et gratuite, vous
              autorisez l&apos;éditeur à héberger, reproduire, afficher et adapter ces
              contenus dans la mesure strictement nécessaire au fonctionnement et à
              la promotion du service (affichage dans l&apos;app, modération,
              statistiques anonymisées). Vous restez propriétaire de vos contenus,
              sous réserve des droits des tiers.
            </p>
            <p>
              L&apos;éditeur peut modérer, retirer ou refuser tout contenu contraire
              aux CGU ou à la loi, sans obligation de surveillance préalable.
            </p>
          </LegalSection>

          <LegalSection id="propriete" title="6. Propriété intellectuelle">
            <p>
              La marque Balad&apos;indice, le logo, l&apos;interface, les textes,
              visuels, bases de données et logiciels mis à disposition par
              l&apos;éditeur sont protégés. Toute reproduction, représentation ou
              extraction non autorisée est interdite, sauf exceptions légales (copies
              privées, citation, etc.).
            </p>
            <p>
              Les parcours et contenus créés par des tiers (villes, partenaires,
              organisateurs) peuvent faire l&apos;objet de droits distincts ; leur
              utilisation reste limitée à une utilisation personnelle dans le cadre
              du jeu, sans revente ni réutilisation commerciale sauf accord écrit.
            </p>
          </LegalSection>

          <LegalSection id="donnees" title="7. Données personnelles">
            <p>
              Les traitements de données liés au compte, à la progression de jeu, aux
              avis ou à la mesure d&apos;audience sont détaillés dans la{' '}
              <Link
                href="/politique-confidentialite"
                className="font-semibold underline underline-offset-2 hover:no-underline"
              >
                Politique de confidentialité
              </Link>
              . Pour exercer vos droits (accès, rectification, effacement, opposition,
              limitation, portabilité), contactez l&apos;éditeur via les
              coordonnées prévues aux{' '}
              <Link
                href="/mentions-legales"
                className="font-semibold underline underline-offset-2 hover:no-underline"
              >
                mentions légales
              </Link>{' '}
              ou le formulaire de contact indiqué sur le site.
            </p>
          </LegalSection>

          <LegalSection id="securite" title="8. Activités extérieures et sécurité">
            <p>
              Les parcours peuvent se dérouler en extérieur et impliquer déplacements,
              observation de l&apos;environnement et interactions avec des supports
              physiques. Vous reconnaissez que votre participation relève de votre
              propre appréciation et de votre capacité physique. Vous devez respecter
              le code de la route et les règles de sécurité, surveiller les mineurs
              dont vous avez la charge, et adapter votre comportement aux conditions
              météorologiques et de visibilité.
            </p>
            <p>
              L&apos;éditeur ne peut garantir l&apos;absence de risque sur les lieux
              ni l&apos;exactitude permanente des indications terrain (travaux,
              fermetures, déplacement d&apos;objets). Signalez tout incident ou
              contenu inadapté via les canaux prévus par l&apos;application ou le
              site.
            </p>
          </LegalSection>

          <LegalSection id="publicite" title="9. Publicités">
            <p>
              Le service peut afficher des messages promotionnels ou des offres de
              partenaires (publicités), dans des emplacements prévus par
              l&apos;interface, sans que ceux-ci remplacent les obligations de
              prudence et de respect de la vie privée décrites dans la politique de
              confidentialité. Le cas échéant, des événements liés aux publicités
              peuvent être enregistrés pour des finalités de mesure et de
              fraude ; le détail figure dans les informations sur les cookies et
              traceurs lorsqu&apos;elles sont publiées.
            </p>
          </LegalSection>

          <LegalSection id="disponibilite" title="10. Disponibilité et évolutions">
            <p>
              Le service est fourni « en l&apos;état ». L&apos;éditeur s&apos;efforce
              d&apos;en assurer la disponibilité mais ne garantit pas une absence
              totale d&apos;interruption (maintenance, mise à jour, cas de force
              majeure, défaillance d&apos;un prestataire). Les fonctionnalités,
              parcours et règles de jeu peuvent évoluer ; en cas de changement
              substantiel des CGU, une information sur le site ou dans
              l&apos;application pourra vous être proposée avant ou au moment de la
              reprise d&apos;utilisation.
            </p>
          </LegalSection>

          <LegalSection id="responsabilite" title="11. Responsabilité">
            <p>
              Dans les limites autorisées par le droit français, la responsabilité
              de l&apos;éditeur ne peut être engagée qu&apos;en cas de faute prouvée
              lui étant directement imputable et, pour les dommages indirects ou
              immatériels non prévus par la loi impérative, dans le cadre restreint
              fixé par les textes applicables. Les montants pouvant être dus au titre
              du service gratuit ou à titre de réparation seront, le cas échéant,
              plafonnés dans la mesure permise par la loi.
            </p>
            <p>
              Les cadeaux, badges physiques ou avantages matériels éventuellement
              associés à un parcours relèvent des conditions spécifiques communiquées
              par l&apos;organisateur du parcours (stocks, retrait, durée). L&apos;éditeur
              n&apos;est pas tenu d&apos;offrir une récompense matérielle si le
              parcours ou l&apos;offre le précise clairement.
            </p>
          </LegalSection>

          <LegalSection id="modifications" title="12. Modifications des CGU">
            <p>
              Les CGU peuvent être mises à jour pour refléter l&apos;évolution du
              service ou des obligations légales. La date de « dernière mise à jour »
              en tête de page est modifiée en conséquence. La poursuite
              d&apos;utilisation du service après publication vaut acceptation des
              CGU en vigueur, sauf disposition impérative contraire vous conférant un
              droit de refus ou de résiliation.
            </p>
          </LegalSection>

          <LegalSection id="droit" title="13. Droit applicable et litiges">
            <p>
              Les présentes CGU sont régies par le{' '}
              <strong className="font-semibold">droit français</strong>. En cas de
              litige, et à défaut de résolution amiable dans un délai raisonnable, les
              tribunaux français seront compétents, sous réserve des règles
              d&apos;ordre public applicables aux consommateurs (notamment leur
              droit d&apos;introduire une action devant le tribunal de leur
              résidence ou de recourir à une médiation ou à la plateforme européenne
              de règlement en ligne des litiges lorsque ces dispositifs
              s&apos;appliquent).
            </p>
          </LegalSection>

          <p className="mt-12 border-t border-[#281401]/15 pt-6 text-sm text-[#281401]/75">
            Pour toute question sur ces conditions, utilisez le lien « Contact » du
            pied de page du site public lorsqu&apos;il est actif, ou l&apos;adresse
            indiquée dans les mentions légales.
          </p>
      </article>
    </div>
  );
}
