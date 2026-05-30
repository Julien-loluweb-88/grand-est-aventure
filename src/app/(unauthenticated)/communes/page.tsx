import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Handshake,
  Landmark,
  MapPin,
  MessageCircle,
  Puzzle,
  Smartphone,
  Store,
  Trees,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { legalLinkClass } from "../_components/legal-document-shell";

const shell = "mx-auto w-full max-w-5xl px-4 sm:px-6";

export const metadata: Metadata = {
  title: "Communes & collectivités",
  description:
    "Vous êtes une commune ? Découvrez Balad'indice : chasse au trésor urbaine sur smartphone pour valoriser votre territoire. Contactez-nous pour lancer une aventure dans votre commune.",
  openGraph: {
    title: "Balad'indice pour les communes — Grand Est",
    description:
      "Une aventure de quartier en ville : énigmes, patrimoine et sortie familiale. Mise en place avec votre collectivité.",
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
    body: "Commerçants, associations, offices de tourisme : l’aventure peut intégrer des partenaires et des offres sur le terrain.",
  },
  {
    icon: Users,
    title: "Une animation durable",
    body: "Une fois en ligne dans l’application, le parcours tourne toute l’année sans mobiliser une équipe chaque week-end.",
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
    body: "L’aventure apparaît sur la carte Balad'indice : les joueurs la découvrent dans l’app mobile et la lancent sur place.",
  },
  {
    n: 4,
    title: "Suivi & évolutions",
    body: "Statistiques, retours des joueurs, ajustements de contenu ou nouvelles éditions : on reste partenaires dans la durée.",
  },
] as const;

const CONCEPT_POINTS = [
  {
    icon: Smartphone,
    title: "Une app, un parcours",
    body: "Le joueur choisit l’aventure sur la carte, se rend au point de départ et résout les énigmes sur son téléphone en marchant.",
  },
  {
    icon: Puzzle,
    title: "Énigmes sur le terrain",
    body: "Chaque bonne réponse oriente vers l’étape suivante — indices, observations, parfois partenaires locaux au fil du chemin.",
  },
  {
    icon: MapPin,
    title: "Ancré dans votre commune",
    body: "Chaque aventure est rattachée à une ville du référentiel : votre territoire, vos lieux, votre identité.",
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

export default function CommunesPage() {
  return (
    <div className="flex w-full flex-1 flex-col pb-16 sm:pb-20">
      {/* Hero */}
      <div className="border-b border-[#68a618]/20 bg-linear-to-br from-[#e8f5e0] via-[#fffaeb] to-[#fef0c7]/70 py-12 sm:py-16">
        <div className={`${shell} text-center`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#68a618]/30 bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#39951a] sm:text-xs">
            <Building2 className="size-3.5" aria-hidden />
            Collectivités · Grand Est
          </span>
          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight text-[#281401] sm:text-4xl md:text-[2.75rem] md:leading-tight">
            Vous êtes une commune&nbsp;?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-[#281401]/82 sm:text-lg">
            Proposez à vos habitants et visiteurs une{" "}
            <strong className="font-semibold text-[#281401]">chasse au trésor urbaine</strong>{" "}
            sur smartphone — et faites découvrir votre territoire autrement.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-xl border-[#281401]/20 bg-white/60 px-7 text-[#281401] hover:bg-white"
              asChild
            >
              <Link href="/#carte-aventures">Voir la carte publique</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-[#281401]/65">
            Mairies, communautés de communes, offices de tourisme — parlons de votre projet.
          </p>
        </div>
      </div>

      <div className={`${shell} mt-12 flex flex-col gap-16 sm:mt-14 sm:gap-20 md:gap-24`}>
        {/* Concept */}
        <section aria-labelledby="concept-titre">
          <h2
            id="concept-titre"
            className="text-center text-2xl font-semibold tracking-tight text-[#281401] sm:text-3xl"
          >
            Le concept Balad&apos;indice
          </h2>
          <SectionDivider />
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[#281401]/75 sm:text-base">
            Balad&apos;indice transforme la ville en parcours d&apos;énigmes : familles et groupes
            avancent de lieu en lieu, guidés par l&apos;application, jusqu&apos;à un trésor ou une
            récompense finale. C&apos;est gratuit pour le joueur, pensé pour le Grand Est, avec un
            déploiement progressif commune par commune.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {CONCEPT_POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="h-full border-[#281401]/10 bg-white/85 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#e8f5e0] text-[#39951a]">
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

        {/* Bénéfices commune */}
        <section aria-labelledby="benefices-titre">
          <h2
            id="benefices-titre"
            className="text-center text-2xl font-semibold tracking-tight text-[#281401] sm:text-3xl"
          >
            Pourquoi votre commune&nbsp;?
          </h2>
          <SectionDivider />
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[#281401]/75 sm:text-base">
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
          <h2
            id="collab-titre"
            className="text-center text-2xl font-semibold tracking-tight text-[#281401] sm:text-3xl"
          >
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

        {/* Ce qu'on peut intégrer */}
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
                  <span className="text-[#68a618]" aria-hidden>
                    ·
                  </span>
                  Parcours patrimoine, nature, centre historique ou quartier en renouvellement
                </li>
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>
                    ·
                  </span>
                  Points de découverte et badges « lieux à visiter »
                </li>
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>
                    ·
                  </span>
                  Partenariats commerçants (offres, roue de la chance en fin de parcours)
                </li>
                <li className="flex gap-2">
                  <span className="text-[#68a618]" aria-hidden>
                    ·
                  </span>
                  Événements ponctuels : journées patrimoine, vacances, rentrée scolaire
                </li>
              </ul>
              <p className="text-sm text-[#281401]/70">
                Chaque projet est discuté au cas par cas — budget, calendrier et périmètre
                géographique sont adaptés à votre collectivité.
              </p>
            </div>
          </div>
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
            N&apos;hésitez pas à nous contacter : décrivez votre commune, votre calendrier et vos
            objectifs (animation locale, tourisme, scolaire…). Nous vous répondons pour en discuter
            sans engagement.
          </p>
          <Button
            size="lg"
            className="mt-8 h-11 rounded-xl bg-[#68a618] px-8 font-semibold text-white hover:bg-[#5a9015]"
            asChild
          >
            <Link href="/contact">
              <MessageCircle className="mr-2 size-4" aria-hidden />
              Écrire à l&apos;équipe Balad&apos;indice
            </Link>
          </Button>
          <p className="mt-6 text-xs text-white/55">
            Vous pouvez aussi mentionner «&nbsp;projet commune&nbsp;» dans votre message pour
            accélérer le traitement.
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
