import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  MapPin,
  MessageCircle,
  Puzzle,
  Smartphone,
  Sparkles,
  Trees,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFiveStarReviews, getSampleAdventures } from "./acceuil.action";
import { SHOW_PUBLIC_HOME_MAP } from "./_lib/show-public-home-map";
import AdventureMapClient from "./_components/adventureMap";

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ?? "";
const APP_IS_LIVE = Boolean(PLAY_STORE_URL);

const shell = "mx-auto w-full max-w-5xl px-4 sm:px-6";

const sectionTitle =
  "text-balance text-center text-2xl font-semibold tracking-tight text-[#281401] sm:text-3xl";

const sectionLead =
  "mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-[#281401]/75 sm:text-base";

/** Données catalogue à jour après publication / changement d’audience (évite cache RSC obsolète). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chasse au trésor dans le Grand Est",
  description:
    "Balad'indice : chasse au trésor urbaine sur smartphone. Énigmes, indices et trésor au bout du parcours — application mobile bientôt sur Android, iOS ensuite. Parcours déployés progressivement dans le Grand Est.",
  openGraph: {
    title: "Balad'indice — chasse au trésor · Grand Est",
    description:
      "La ville devient une chasse au trésor. Application mobile prochainement — parcours qui s’étendent zone par zone.",
  },
};

const FEATURES = [
  {
    icon: Trees,
    title: "Dehors, ensemble",
    body: "Un jeu qui se joue en marchant — idéal pour une sortie entre parents et enfants ou entre amis.",
  },
  {
    icon: Puzzle,
    title: "Énigmes & indices",
    body: "Chaque bonne réponse t’oriente vers l’étape suivante, jusqu’au trésor final.",
  },
  {
    icon: MapPin,
    title: "Ton territoire",
    body: "Des parcours ancrés dans de vraies villes ; la carte s’enrichit au fil des semaines.",
  },
] as const;

const STEPS = [
  {
    n: 1,
    title: APP_IS_LIVE ? "Télécharge l’app" : "L’app arrive bientôt",
    body: APP_IS_LIVE
      ? "Installe Balad'indice sur Google Play (Android). La version iOS suivra."
      : "Balad'indice sort prochainement sur Android (Google Play), puis sur iPhone. Inscris-toi à nos actus pour être prévenu.",
  },
  {
    n: 2,
    title: "Choisis ton parcours",
    body: "Repère une aventure sur la carte et rends-toi au point de départ avec ta troupe.",
  },
  {
    n: 3,
    title: "Résous les énigmes",
    body: "Chaque bonne réponse dans l’app t’indique où aller pour l’étape suivante.",
  },
  {
    n: 4,
    title: "À ton rythme",
    body: "Compte en général 30 minutes à 1 heure selon le parcours.",
  },
  {
    n: 5,
    title: "Le trésor t’attend",
    body: "Badges, surprises partenaires et récompense au bout du chemin.",
  },
] as const;

function PlayStoreBadge({ live }: { live: boolean }) {
  const badge = (
    <Image
      src="/images/google-play.png"
      alt={
        live
          ? "Télécharger sur Google Play"
          : "Bientôt disponible sur Google Play"
      }
      width={200}
      height={100}
      className={`max-w-[200px] ${live ? "" : "opacity-55 grayscale"}`}
      style={{ width: "auto", height: "auto" }}
    />
  );

  if (live) {
    return (
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-xl ring-2 ring-transparent transition hover:ring-[#68a618]/40 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#68a618]"
      >
        {badge}
      </a>
    );
  }

  return (
    <div className="relative inline-block rounded-xl ring-2 ring-[#281401]/10">
      {badge}
      <span className="absolute -right-2 -top-2 rounded-full bg-[#68a618] px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white shadow-md">
        Bientôt
      </span>
    </div>
  );
}

function SectionDivider() {
  return (
    <div
      className="mx-auto mt-4 flex items-center justify-center gap-2"
      aria-hidden
    >
      <span className="h-px w-10 bg-[#68a618]/35" />
      <span className="size-1.5 rounded-full bg-[#68a618]/50" />
      <span className="h-px w-10 bg-[#68a618]/35" />
    </div>
  );
}

export default async function Home() {
  const reviews = await getFiveStarReviews(5);
  const adventures = SHOW_PUBLIC_HOME_MAP ? await getSampleAdventures() : [];
  const adventureCount = adventures.length;

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Hero */}
      <div className="relative mb-6 flex min-h-[min(70vw,24rem)] w-full flex-col justify-center overflow-hidden sm:mb-8 sm:min-h-[26rem] md:min-h-[32rem]">
        <Image
          src="/images/Ville-Pres-Geo-1720509386955.webp"
          alt=""
          fill
          className="object-cover sepia-[0.1] saturate-[1.05]"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-linear-to-b from-[#281401]/75 via-[#281401]/50 to-[#120a04]/90"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 size-64 rounded-full bg-[#68a618]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-1/4 size-56 rounded-full bg-[#fef0c7]/15 blur-3xl"
          aria-hidden
        />

        <div
          className={`relative z-10 flex w-full flex-col gap-5 py-14 text-center sm:gap-6 sm:py-18 md:py-22 ${shell}`}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c8e89f]/30 bg-[#68a618]/25 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#e8f5d8] backdrop-blur-sm sm:text-xs">
              {!APP_IS_LIVE ? (
                <>
                  <Sparkles className="size-3.5" aria-hidden />
                  Bientôt disponible
                </>
              ) : (
                "Grand Est · En ligne"
              )}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-white/85 backdrop-blur-sm sm:text-xs">
              Lancement progressif
            </span>
          </div>

          <h1 className="text-balance text-3xl font-bold tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-5xl lg:text-[3.35rem] lg:leading-[1.12]">
            La ville devient une{" "}
            <span className="text-[#c8e89f]">chasse au trésor</span>
          </h1>

          <p className="mx-auto max-w-2xl text-pretty text-base font-medium leading-relaxed text-white/92 drop-shadow sm:text-lg md:text-xl">
            Avec <strong className="font-semibold text-white">Balad&apos;indice</strong>,
            marche, suis les indices et résous les énigmes jusqu&apos;au trésor. Les parcours
            arrivent{" "}
            <strong className="font-semibold text-[#d4f0a8]">progressivement</strong> près de
            chez toi — la carte s&apos;enrichit au fil des semaines.
          </p>

          <div
            className="mx-auto flex flex-wrap items-center justify-center gap-2 text-xs text-white/90 sm:text-sm"
            role="list"
          >
            {[
              { icon: Sparkles, label: "Gratuit" },
              { icon: Smartphone, label: "App mobile" },
              { icon: Users, label: "Famille & amis" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                role="listitem"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur-sm"
              >
                <Icon className="size-3.5 opacity-90" aria-hidden />
                {label}
              </span>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-3 pt-1 sm:flex-row sm:gap-4">
            {APP_IS_LIVE ? (
              <Button
                size="lg"
                className="h-11 rounded-xl border-0 bg-[#68a618] px-7 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:bg-[#5a9015] sm:h-12"
                asChild
              >
                <Link href="#telecharger">Télécharger sur Android</Link>
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-11 rounded-xl border-0 bg-[#68a618] px-7 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:bg-[#5a9015] sm:h-12"
                asChild
              >
                <Link href="/contact">Me tenir informé</Link>
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-xl border-white/45 bg-white/10 px-7 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 sm:h-12"
              asChild
            >
              <Link href="#comment-ca-marche">
                <Compass className="mr-2 size-4" aria-hidden />
                Comment ça marche
              </Link>
            </Button>
          </div>

          <p className="text-xs text-white/60 sm:text-sm">
            {APP_IS_LIVE ? (
              <>
                Disponible sur <strong className="text-white/85">Google Play</strong> ·{" "}
                <strong className="text-white/85">iPhone</strong> prochainement
              </>
            ) : (
              <>
                Application <strong className="text-white/85">Android</strong> en préparation ·{" "}
                <strong className="text-white/85">iOS</strong> dans un second temps
              </>
            )}
          </p>
        </div>
      </div>

      {/* Bandeau territoire */}
      <div className="border-y border-[#68a618]/25 bg-linear-to-r from-[#e8f5e0] via-[#fef0c7]/80 to-[#e8f5e0] py-5">
        <div
          className={`${shell} flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-8 sm:text-left`}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#68a618]/15 text-[#39951a] shadow-inner">
            <MapPin className="size-5" aria-hidden />
          </div>
          <div className="max-w-3xl space-y-0.5">
            <p className="text-sm font-semibold text-[#281401]">Ouverture zone par zone</p>
            <p className="text-pretty text-sm leading-relaxed text-[#281401]/80">
              On déploie le jeu dans le Grand Est avec vous. Peu de parcours au début, c&apos;est
              normal — la carte grandit au rythme des équipes locales.{" "}
              <Link
                href="/communes"
                className="font-medium text-[#39951a] underline-offset-2 hover:underline"
              >
                Vous êtes une commune&nbsp;? Parlons-en.
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-16 pb-16 pt-12 sm:gap-20 sm:pb-22 sm:pt-14 md:gap-24">
        {/* Pourquoi */}
        <section className={shell} aria-labelledby="pourquoi-titre">
          <h2 id="pourquoi-titre" className={sectionTitle}>
            Pourquoi se lancer&nbsp;?
          </h2>
          <SectionDivider />
          <p className={sectionLead}>
            Une aventure urbaine pensée pour sortir, réfléchir et s&apos;amuser — sans rester
            scotché à l&apos;écran.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="group h-full overflow-hidden border-[#281401]/10 bg-white/85 shadow-sm transition hover:-translate-y-0.5 hover:border-[#68a618]/25 hover:shadow-md">
                  <div className="h-1 bg-linear-to-r from-[#68a618]/0 via-[#68a618]/60 to-[#68a618]/0 opacity-0 transition group-hover:opacity-100" />
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

        {SHOW_PUBLIC_HOME_MAP ? (
          <section
            className={shell}
            id="carte-aventures"
            aria-labelledby="adventures-heading"
          >
            <h2 id="adventures-heading" className={sectionTitle}>
              {adventureCount > 0 ? "Où jouer bientôt ?" : "La carte se prépare"}
            </h2>
            <SectionDivider />
            <p className={sectionLead}>
              {adventureCount > 0 ? (
                adventureCount === 1 ? (
                  <>
                    Une aventure est déjà prête sur le territoire — repérez la pastille sur la
                    carte. Dès la sortie de l&apos;app, il suffira d&apos;y aller et de lancer le
                    parcours sur place.
                  </>
                ) : (
                  <>
                    <strong className="font-semibold text-[#281401]">
                      {adventureCount} parcours
                    </strong>{" "}
                    sont en préparation ou déjà publiés. Chaque pastille est un futur départ en
                    famille.
                  </>
                )
              ) : (
                <>
                  Les premières aventures apparaîtront ici au fil des semaines. Suivez nos actus pour
                  savoir quand l&apos;application ouvre dans votre secteur.
                </>
              )}
            </p>
            <div className="mt-8">
              <AdventureMapClient adventures={adventures} appIsLive={APP_IS_LIVE} />
            </div>
          </section>
        ) : null}

        {/* Comment ça marche */}
        <section className={shell} aria-labelledby="comment-ca-marche">
          <h2 id="comment-ca-marche" className={sectionTitle}>
            Comment ça marche&nbsp;?
          </h2>
          <SectionDivider />
          <p className={sectionLead}>
            Cinq étapes simples — de l&apos;installation (bientôt) au trésor final.
          </p>

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
            <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[4/5] w-full max-w-[280px] mx-auto lg:max-w-xs">
                <Image
                  src="/images/scanQr.png"
                  alt="Smartphone avec l'application Balad'indice"
                  fill
                  className="object-contain drop-shadow-xl"
                  sizes="280px"
                  priority
                />
              </div>
              <div className="relative mx-auto mt-6 aspect-square w-full max-w-[200px] lg:absolute lg:-bottom-6 lg:-right-4 lg:mt-0 lg:max-w-[140px]">
                <Image
                  src="/images/treasureia.png"
                  alt="Trésor à la fin du parcours"
                  fill
                  className="object-contain drop-shadow-lg"
                  sizes="200px"
                />
              </div>
            </div>

            <ol className="relative space-y-0">
              {STEPS.map((step, i) => (
                <li key={step.n} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < STEPS.length - 1 ? (
                    <span
                      className="absolute left-5 top-10 bottom-0 w-px bg-linear-to-b from-[#68a618]/50 to-[#68a618]/10"
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
          </div>
        </section>

        {/* FAQ */}
        <section className={shell} aria-labelledby="questions">
          <h2 id="questions" className={sectionTitle}>
            Questions fréquentes
          </h2>
          <SectionDivider />
          <Accordion
            type="single"
            collapsible
            className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-[#281401]/10 bg-white/60 px-1 shadow-sm backdrop-blur-sm sm:px-2"
          >
            <AccordionItem value="q-android-ios" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                L&apos;application est-elle déjà disponible&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                {APP_IS_LIVE ? (
                  <>
                    Oui sur <strong className="text-[#281401]">Google Play (Android)</strong>.
                    La version <strong className="text-[#281401]">iPhone</strong> arrive ensuite.
                  </>
                ) : (
                  <>
                    Pas encore — l&apos;application mobile est en cours de finalisation. Sortie{" "}
                    <strong className="text-[#281401]">Android</strong> prochainement, puis{" "}
                    <strong className="text-[#281401]">iOS</strong>.{" "}
                    <Link href="/contact" className="font-medium underline-offset-4 hover:underline">
                      Contactez-nous
                    </Link>{" "}
                    pour être tenu informé.
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question1" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Le jeu sera-t-il gratuit&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                <strong className="text-[#281401]">Oui.</strong> L&apos;application sera
                téléchargeable gratuitement ; les parcours publics le seront aussi.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question2" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                À partir de quel âge peut-on jouer&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                Pensé pour les enfants, avec toute la famille — les adultes aident pour les
                énigmes les plus corsées.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question3" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Comment commencer une aventure&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                Choisis un parcours sur la carte, installe l&apos;app dès qu&apos;elle est en
                ligne, puis rends-toi au point de départ pour lancer la partie sur place.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question4" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Faut-il une connexion Internet&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                Oui, une connexion mobile est recommandée pour charger le parcours et valider les
                étapes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question6" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Combien de temps dure une aventure&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                En général entre 30&nbsp;minutes et 1&nbsp;heure, selon le parcours et votre
                rythme.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question7" className="border-[#281401]/10">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Peut-on rejouer une aventure&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                La victoire officielle et la récompense associée ne comptent qu&apos;une fois ;
                vous pouvez refaire le parcours pour le plaisir selon les règles du jeu.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question10" className="border-b-0">
              <AccordionTrigger className="px-4 text-left text-[#281401] hover:no-underline">
                Une question ou un partenariat&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-left text-[#281401]/85">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Écrivez-nous via le formulaire de contact
                </Link>
                .
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Témoignages */}
        <section className={shell} aria-labelledby="reviews">
          <h2 id="reviews" className={sectionTitle}>
            Ils se sont lancés
          </h2>
          <SectionDivider />
          {reviews.length === 0 ? (
            <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-dashed border-[#281401]/15 bg-white/50 px-6 py-10 text-center">
              <p className="text-sm leading-relaxed text-[#281401]/70">
                Les premiers avis apparaîtront ici après les premières parties. Soyez parmi les
                pionniers du territoire&nbsp;!
              </p>
            </div>
          ) : (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <li key={review.id}>
                  <Card className="h-full border-[#281401]/10 bg-white/75 shadow-sm transition hover:shadow-md">
                    <CardHeader className="space-y-3 pb-2">
                      <CardTitle className="text-lg text-[#281401]">
                        {review.user.name}
                      </CardTitle>
                      <div className="flex gap-0.5" aria-label="5 étoiles sur 5">
                        {[...Array(5)].map((_, i) => (
                          <Image
                            key={i}
                            src="/images/icons8-star-48.png"
                            alt=""
                            width={20}
                            height={20}
                            className="size-5"
                          />
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-left text-sm leading-relaxed text-[#281401]/85">
                      <p>{review.content}</p>
                      {review.image ? (
                        <Image
                          src={review.image}
                          alt={`Photo partagée par ${review.user.name}`}
                          width={300}
                          height={200}
                          className="mt-2 w-full rounded-lg object-cover"
                          style={{ height: "auto", maxHeight: "12rem" }}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CTA */}
        <section
          id="telecharger"
          className={`${shell} max-w-3xl scroll-mt-24`}
          aria-labelledby="cta-heading"
        >
          <div className="relative overflow-hidden rounded-3xl border border-[#281401]/10 bg-linear-to-br from-[#fef0c7] via-white to-[#e8f5e0] px-6 py-12 text-center shadow-lg ring-1 ring-[#68a618]/15 sm:px-12 sm:py-14">
            <div
              className="pointer-events-none absolute -right-20 -top-20 size-48 rounded-full bg-[#68a618]/10 blur-2xl"
              aria-hidden
            />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#68a618]">
              {APP_IS_LIVE ? "Application mobile" : "Prochainement"}
            </p>
            <h2
              id="cta-heading"
              className="mt-3 text-balance text-2xl font-bold tracking-tight text-[#281401] sm:text-3xl"
            >
              {APP_IS_LIVE
                ? "Télécharge Balad'indice"
                : "L'application arrive très bientôt"}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-pretty text-[#281401]/78 sm:text-lg">
              {APP_IS_LIVE ? (
                <>
                  Disponible sur <strong className="text-[#281401]">Google Play</strong>. iOS
                  suivra.
                </>
              ) : (
                <>
                  Android en premier sur le <strong className="text-[#281401]">Play Store</strong>,
                  puis iPhone. Les parcours seront déployés progressivement sur le territoire.
                </>
              )}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
              <PlayStoreBadge live={APP_IS_LIVE} />
              {!APP_IS_LIVE ? (
                <div className="flex max-w-xs flex-col items-center gap-4 text-left sm:items-start">
                  <Button
                    className="w-full rounded-xl bg-[#281401] text-white hover:bg-[#3d1f06] sm:w-auto"
                    asChild
                  >
                    <Link href="/contact">
                      <MessageCircle className="mr-2 size-4" aria-hidden />
                      Me tenir informé
                    </Link>
                  </Button>
                  <p className="text-center text-xs leading-relaxed text-[#281401]/60 sm:text-left">
                    Une question, une commune ou un commerce partenaire ? On vous répond via le
                    formulaire contact.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src="/images/icons8-qr-code-50.png"
                    alt="QR code vers le Play Store"
                    width={120}
                    height={120}
                    className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-[#281401]/10"
                  />
                  <span className="text-xs text-[#281401]/60">
                    Scannez depuis votre mobile
                  </span>
                </div>
              )}
            </div>

            <div className="mt-10 rounded-xl border border-[#281401]/10 bg-white/60 px-4 py-3 text-sm text-[#281401]/70">
              <strong className="text-[#281401]/90">iPhone</strong> — version App Store prévue
              après la sortie Android.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
