import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  GraduationCap,
  Handshake,
  Landmark,
  MapPin,
  MessageCircle,
  Puzzle,
  Smartphone,
  Sparkles,
  Store,
  Trees,
  Trophy,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SHOW_PUBLIC_HOME_MAP } from "../_lib/show-public-home-map";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { legalLinkClass } from "../_components/legal-document-shell";
import { getHomePageSnapshot } from "../acceuil.action";
import { buildHomeStatItems, shouldShowHomeStatsSection } from "../_lib/home-stats";
import { HomeAdventureCard } from "../_components/home-adventure-card";
import { HomeStatGrid } from "../_components/home-stat-grid";
import { resolvePlayStoreUrl } from "../_lib/play-store-url";
import type { HomeTerritoryCity } from "../acceuil.action";

const PLAY_STORE_URL = resolvePlayStoreUrl(process.env.NEXT_PUBLIC_PLAY_STORE_URL);
const APP_IS_LIVE = Boolean(PLAY_STORE_URL);

const shell = "mx-auto w-full max-w-5xl px-4 sm:px-6";

const sectionTitle =
  "text-balance text-center text-2xl font-semibold tracking-tight text-[#281401] sm:text-3xl";

const sectionLead =
  "mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#281401]/75 sm:text-base";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Communes & collectivités",
  description:
    "Vous êtes une commune ? Découvrez Balad'indice : chasse au trésor urbaine sur smartphone pour valoriser votre territoire. Application en ligne, parcours réels dans le Grand Est.",
  openGraph: {
    title: "Balad'indice pour les communes — Grand Est",
    description:
      "Plateforme opérationnelle : énigmes GPS, trésors, badges et stats pour vos habitants. Lancez une aventure dans votre commune.",
  },
};

const BENEFITS = [
  {
    icon: Trees,
    title: "Sortir les habitants dehors",
    body: "Un parcours ludique qui fait marcher familles, scolaires et visiteurs dans vos rues, parcs et lieux remarquables.",
  },
  {
    icon: Landmark,
    title: "Valoriser le patrimoine local",
    body: "Énigmes ancrées dans votre histoire, vos monuments et vos commerces — le territoire devient le décor du jeu.",
  },
  {
    icon: Store,
    title: "Fédérer les acteurs locaux",
    body: "Commerçants, associations, offices de tourisme : l'aventure peut intégrer des partenaires et des offres sur le terrain.",
  },
  {
    icon: Users,
    title: "Une animation durable",
    body: "Une fois en ligne dans l'application, le parcours tourne toute l'année sans mobiliser une équipe chaque week-end.",
  },
] as const;

const USE_CASES = [
  {
    icon: Building2,
    title: "Mairie & animation",
    body: "Une sortie familiale disponible en permanence : les habitants lancent le parcours quand ils veulent, depuis l'app mobile.",
  },
  {
    icon: MapPin,
    title: "Office de tourisme",
    body: "Un parcours découverte pour les visiteurs : patrimoine, commerces et lieux remarquables mis en scène par les énigmes.",
  },
  {
    icon: GraduationCap,
    title: "École & périscolaire",
    body: "Sortie pédagogique encadrée : observation du territoire, travail en groupe et énigmes adaptées au public scolaire.",
  },
] as const;

const COLLAB_STEPS = [
  {
    n: 1,
    title: "Premier échange",
    body: "Vous nous décrivez votre commune, vos envies (centre-ville, quartier, thème patrimoine, scolaire…) et le public visé.",
  },
  {
    n: 2,
    title: "Conception du parcours",
    body: "Nous co-construisons le tracé, les énigmes et le trésor final avec vos équipes et, si vous le souhaitez, des acteurs locaux.",
  },
  {
    n: 3,
    title: "Mise en ligne",
    body: "L'aventure apparaît sur la carte Balad'indice : les joueurs la découvrent dans l'app mobile et la lancent sur place.",
  },
  {
    n: 4,
    title: "Suivi & évolutions",
    body: "Statistiques de fréquentation, avis modérés, ajustements de contenu ou nouvelles éditions : on reste partenaires dans la durée.",
  },
] as const;

const CONCEPT_POINTS = [
  {
    icon: Smartphone,
    title: "Une app, un parcours",
    body: "Le joueur choisit l'aventure sur la carte, se rend au point de départ et résout les énigmes sur son téléphone en marchant.",
  },
  {
    icon: Puzzle,
    title: "Énigmes GPS sur le terrain",
    body: "Chaque bonne réponse oriente vers l'étape suivante — indices, observations et partenaires locaux au fil du chemin.",
  },
  {
    icon: Trophy,
    title: "Trésor & récompenses",
    body: "Badges physiques, lots partenaires et trésor final : une conclusion concrète qui marque les esprits.",
  },
] as const;

function SectionDivider() {
  return (
    <div className="mx-auto mt-4 flex items-center justify-center gap-2" aria-hidden>
      <span className="h-px w-10 bg-[#68a618]/35" />
      <span className="size-1.5 rounded-full bg-[#68a618]/50" />
      <span className="h-px w-10 bg-[#68a618]/35" />
    </div>
  );
}

function formatTerritoryCityList(cities: HomeTerritoryCity[], max = 5): string {
  const names = cities.slice(0, max).map((c) => c.name);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} et ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count > 1 ? plural : singular;
}

export default async function CommunesPage() {
  const home = await getHomePageSnapshot();
  const {
    featuredAdventures,
    territoryCities,
    adventureCount,
    cityCount,
  } = home;

  const hasAdventures = adventureCount > 0;
  const homeStatItems = buildHomeStatItems(home);
  const showHomeStats = shouldShowHomeStatsSection(home);
  const showcaseAdventures = featuredAdventures.slice(0, 3);
  const territorySummaryDetailed =
    hasAdventures && cityCount > 1
      ? `${adventureCount} ${pluralize(adventureCount, "parcours", "parcours")} dans ${cityCount} ${pluralize(cityCount, "commune", "communes")}`
      : null;

  return (
    <div className="flex w-full flex-1 flex-col pb-16 sm:pb-20">
      {/* Hero */}
      <div className="border-b border-[#68a618]/20 bg-linear-to-br from-[#e8f5e0] via-[#fffaeb] to-[#fef0c7]/70 py-12 sm:py-16">
        <div className={`${shell} text-center`}>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#68a618]/30 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#39951a] sm:text-xs">
              <Building2 className="size-3.5" aria-hidden />
              Collectivités · Grand Est
            </span>
            {APP_IS_LIVE ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#68a618]/25 bg-[#68a618]/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-[#39951a] sm:text-xs">
                <Sparkles className="size-3.5" aria-hidden />
                App disponible sur Android
              </span>
            ) : null}
          </div>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight text-[#281401] sm:text-4xl md:text-[2.75rem] md:leading-tight">
            Vous êtes une commune&nbsp;?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-[#281401]/82 sm:text-lg">
            {hasAdventures ? (
              <>
                Balad&apos;indice est déjà jouable dans le <strong className="font-semibold text-[#281401]">Grand Est</strong>.
                Rejoignez le réseau et proposez à vos habitants une{" "}
                <strong className="font-semibold text-[#281401]">chasse au trésor urbaine</strong>{" "}
                sur smartphone.
              </>
            ) : (
              <>
                Proposez à vos habitants et visiteurs une{" "}
                <strong className="font-semibold text-[#281401]">chasse au trésor urbaine</strong>{" "}
                sur smartphone — et faites découvrir votre territoire autrement.
              </>
            )}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="h-11 rounded-xl bg-[#68a618] px-7 font-semibold text-white hover:bg-[#5a9015]"
              asChild
            >
              <Link href="/contact">
                <MessageCircle className="mr-2 size-4" aria-hidden />
                Nous contacter
              </Link>
            </Button>
            {SHOW_PUBLIC_HOME_MAP && hasAdventures ? (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-[#281401]/20 bg-white/60 px-7 text-[#281401] hover:bg-white"
                asChild
              >
                <Link href="/#parcours">Voir les parcours en ligne</Link>
              </Button>
            ) : null}
            {APP_IS_LIVE ? (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-[#281401]/20 bg-white/60 px-7 text-[#281401] hover:bg-white"
                asChild
              >
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                  Télécharger l&apos;app
                </a>
              </Button>
            ) : SHOW_PUBLIC_HOME_MAP ? (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-[#281401]/20 bg-white/60 px-7 text-[#281401] hover:bg-white"
                asChild
              >
                <Link href="/#carte-aventures">Voir la carte</Link>
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-[#281401]/20 bg-white/60 px-7 text-[#281401] hover:bg-white"
                asChild
              >
                <Link href="/#comment-ca-marche">Comment ça marche</Link>
              </Button>
            )}
          </div>
          <p className="mt-6 text-sm text-[#281401]/65">
            Mairies, communautés de communes, offices de tourisme — parlons de votre projet.
          </p>
        </div>
      </div>

      <div className={`${shell} mt-12 flex flex-col gap-16 sm:mt-14 sm:gap-20 md:gap-24`}>
        {/* Territoire & stats */}
        {hasAdventures ? (
          <section aria-labelledby="territoire-titre">
            <h2 id="territoire-titre" className={sectionTitle}>
              Déjà déployé sur le territoire
            </h2>
            <SectionDivider />
            <p className={sectionLead}>
              {territorySummaryDetailed ? (
                <>
                  <strong className="font-semibold text-[#281401]">{territorySummaryDetailed}</strong>{" "}
                  — {formatTerritoryCityList(territoryCities)}. Votre commune peut être la
                  prochaine.
                </>
              ) : (
                <>
                  Des parcours sont déjà en ligne dans le Grand Est. D&apos;autres communes nous
                  rejoignent au fil des semaines — la carte continue de grandir.
                </>
              )}
            </p>
            {showHomeStats ? <HomeStatGrid items={homeStatItems} /> : null}
          </section>
        ) : null}

        {/* Exemples de parcours */}
        {showcaseAdventures.length > 0 ? (
          <section aria-labelledby="exemples-titre">
            <h2 id="exemples-titre" className={sectionTitle}>
              Exemples de parcours publiés
            </h2>
            <SectionDivider />
            <p className={sectionLead}>
              Voici ce que voient vos habitants dans l&apos;application — chaque carte correspond
              à une aventure réelle, jouable sur place.
            </p>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {showcaseAdventures.map((adventure) => (
                <li key={adventure.id}>
                  <HomeAdventureCard adventure={adventure} />
                </li>
              ))}
            </ul>
            <p className="mt-8 text-center text-sm text-[#281401]/65">
              <Link href="/#carte-aventures" className="font-medium text-[#39951a] hover:underline">
                Voir tous les parcours sur la carte →
              </Link>
            </p>
          </section>
        ) : null}

        {/* Concept + visuel app */}
        <section aria-labelledby="concept-titre">
          <h2 id="concept-titre" className={sectionTitle}>
            Le concept Balad&apos;indice
          </h2>
          <SectionDivider />
          <p className={sectionLead}>
            Balad&apos;indice transforme la ville en parcours d&apos;énigmes : familles et groupes
            avancent de lieu en lieu, guidés par l&apos;application, jusqu&apos;à un trésor ou une
            récompense finale. Gratuit pour le joueur, pensé pour le Grand Est.
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
            <div className="relative mx-auto w-full max-w-xs">
              <Image
                src="/images/scanQr.png"
                alt="Joueur scannant une énigme avec l'application Balad'indice"
                width={320}
                height={400}
                className="w-full object-contain drop-shadow-lg"
                sizes="320px"
              />
            </div>
            <ul className="grid gap-5">
              {CONCEPT_POINTS.map(({ icon: Icon, title, body }) => (
                <li key={title}>
                  <Card className="h-full border-[#281401]/10 bg-white/85 shadow-sm">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f5e0] text-[#39951a]">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg text-[#281401]">{title}</CardTitle>
                        <CardContent className="mt-1.5 p-0 text-sm leading-relaxed text-[#281401]/78">
                          {body}
                        </CardContent>
                      </div>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Cas d'usage */}
        <section aria-labelledby="usages-titre">
          <h2 id="usages-titre" className={sectionTitle}>
            Pour qui dans votre collectivité&nbsp;?
          </h2>
          <SectionDivider />
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {USE_CASES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="h-full border-[#281401]/10 bg-white/85 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#fef0c7]/80 text-[#39951a]">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="text-lg text-[#281401]">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-[#281401]/78">
                    {body}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Bénéfices */}
        <section aria-labelledby="benefices-titre">
          <h2 id="benefices-titre" className={sectionTitle}>
            Pourquoi votre commune&nbsp;?
          </h2>
          <SectionDivider />
          <p className={sectionLead}>
            Une aventure Balad&apos;indice, ce n&apos;est pas une énigme de plus sur une affiche :
            c&apos;est une expérience complète qui attire, fait réfléchir et laisse un bon souvenir
            du territoire.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="group h-full border-[#281401]/10 bg-white/80 transition hover:border-[#68a618]/25 hover:shadow-md">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fef0c7]/80 text-[#39951a]">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="pt-1 text-lg text-[#281401]">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-[#281401]/78">
                    {body}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {/* Collaboration */}
        <section aria-labelledby="collab-titre">
          <h2 id="collab-titre" className={sectionTitle}>
            Comment on avance ensemble&nbsp;?
          </h2>
          <SectionDivider />
          <ol className="mx-auto mt-10 max-w-2xl space-y-0">
            {COLLAB_STEPS.map((step, i) => (
              <li key={step.n} className="relative flex gap-4 pb-8 last:pb-0">
                {i < COLLAB_STEPS.length - 1 ? (
                  <span
                    className="absolute top-10 bottom-0 left-5 w-px bg-linear-to-b from-[#68a618]/45 to-[#68a618]/10"
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#68a618] text-sm font-bold text-white shadow-md ring-4 ring-[#fffaeb]">
                  {step.n}
                </span>
                <div className="min-w-0 pt-1">
                  <h3 className="text-lg font-semibold text-[#281401]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#281401]/78 sm:text-base">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Intégrations */}
        <section
          className="rounded-2xl border border-[#281401]/10 bg-linear-to-br from-white via-[#fffaeb] to-[#e8f5e0]/50 p-6 sm:p-10"
          aria-labelledby="integrer-titre"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#68a618]/15 text-[#39951a]">
              <Handshake className="size-7" aria-hidden />
            </div>
            <div className="min-w-0 space-y-4">
              <h2 id="integrer-titre" className="text-xl font-semibold text-[#281401] sm:text-2xl">
                Ce qu&apos;on peut intégrer sur votre territoire
              </h2>
              <ul className="grid gap-2 text-sm leading-relaxed text-[#281401]/85 sm:grid-cols-2 sm:text-base">
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>·</span>
                  Parcours patrimoine, nature, centre historique ou quartier en renouvellement
                </li>
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>·</span>
                  Points de découverte bonus et badges « lieux à visiter »
                </li>
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>·</span>
                  Badges physiques et trésor final sur le terrain
                </li>
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>·</span>
                  Partenariats commerçants (offres, lots en fin de parcours)
                </li>
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>·</span>
                  Statistiques : parties jouées, durée moyenne, avis modérés
                </li>
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>·</span>
                  Version démo pour vos élus avant publication publique
                </li>
              </ul>
              <p className="text-sm text-[#281401]/70">
                Chaque projet est discuté au cas par cas — budget, calendrier et périmètre
                géographique sont adaptés à votre collectivité.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ collectivités */}
        <section aria-labelledby="faq-communes">
          <h2 id="faq-communes" className={sectionTitle}>
            Questions des collectivités
          </h2>
          <SectionDivider />
          <Accordion
            type="single"
            collapsible
            className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-[#281401]/10 bg-white/60 px-1 shadow-sm backdrop-blur-sm sm:px-2"
          >
            <AccordionItem value="q-finance" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Qui finance le projet&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                Le modèle est étudié commune par commune (prestation, subvention, partenariat
                mixte…). L&apos;application reste{" "}
                <strong className="text-[#281401]">gratuite pour les joueurs</strong>. Contactez-nous
                pour un devis adapté à votre budget et à vos objectifs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q-delai" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Combien de temps pour mettre en place un parcours&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                Cela dépend du périmètre (nombre d&apos;énigmes, partenaires, validation locale).
                Comptez en général plusieurs semaines entre le premier échange et la mise en ligne,
                avec des points d&apos;étape pour valider le contenu avec vos équipes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q-gratuit" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Le jeu est-il gratuit pour les habitants&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                <strong className="text-[#281401]">Oui.</strong> L&apos;application et les parcours
                publics sont gratuits. Les joueurs téléchargent Balad&apos;indice, choisissent votre
                aventure sur la carte et la lancent sur le point de départ.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q-contenu" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Qui rédige les énigmes&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                Nous co-construisons le parcours avec vous : vos équipes apportent la connaissance du
                territoire, nous structurons le jeu, les énigmes GPS et l&apos;intégration dans
                l&apos;application. Les commerçants et associations peuvent aussi être impliqués.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q-donnees" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Quelles données sont collectées sur les joueurs&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                Un compte est nécessaire pour jouer et valider les étapes. Les données sont traitées
                conformément au RGPD — consultez notre{" "}
                <Link
                  href="/politique-confidentialite"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  politique de confidentialité
                </Link>
                . Les statistiques agrégées (parties, énigmes) vous sont communiquées sans données
                personnelles nominatives.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="q-demo" className="border-b-0">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Peut-on tester avant la publication&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                Oui — une version démo peut être mise à disposition de vos équipes et élus avant
                l&apos;ouverture au public. Cela permet de valider le parcours sur le terrain avant
                le lancement officiel.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA */}
        <section
          className="rounded-3xl border border-[#281401]/10 bg-[#281401] px-6 py-10 text-center text-white shadow-lg sm:px-12 sm:py-14"
          aria-labelledby="cta-communes"
        >
          <h2 id="cta-communes" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Envie d&apos;une aventure dans votre commune&nbsp;?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-white/85 sm:text-base">
            Décrivez votre commune, votre calendrier et vos objectifs (animation locale, tourisme,
            scolaire…). Nous vous répondons pour en discuter sans engagement.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 rounded-xl bg-[#68a618] px-8 font-semibold text-white hover:bg-[#5a9015]"
              asChild
            >
              <Link href="/contact">
                <MessageCircle className="mr-2 size-4" aria-hidden />
                Écrire à l&apos;équipe
              </Link>
            </Button>
            {APP_IS_LIVE ? (
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-xl border-white/40 bg-transparent px-8 text-white hover:bg-white/10"
                asChild
              >
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                  Voir l&apos;app sur Google Play
                </a>
              </Button>
            ) : null}
          </div>
          <p className="mt-6 text-xs text-white/55">
            Mentionnez «&nbsp;projet commune&nbsp;» dans votre message pour accélérer le traitement.
          </p>
        </section>

        <p className="text-center text-sm text-[#281401]/60">
          <Link href="/" className={legalLinkClass}>
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
