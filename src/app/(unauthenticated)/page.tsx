import Image from "next/image";
import type { Metadata } from "next";
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
import AdventureMapClient from "./_components/adventureMap";
import Link from "next/link";

const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() ?? "";

const shell = "mx-auto w-full max-w-5xl px-4 sm:px-6";

const sectionTitle =
  "scroll-mt-24 border-b border-[#281401]/12 pb-3 text-2xl font-semibold tracking-tight text-[#39951a] sm:text-3xl";

const stepH3 =
  "text-xl font-semibold tracking-tight text-[#281401] sm:text-2xl";

const quote =
  "rounded-r-lg border-l-4 border-[#68a618] bg-[#fef0c7]/50 py-3 pl-4 pr-3 text-left text-sm leading-relaxed text-[#281401]/90 sm:pl-5 sm:text-base";

export const metadata: Metadata = {
  title: "Chasse au trésor dans le Grand Est",
  description:
    "Balad'indice : chasse au trésor urbaine sur smartphone. Télécharge l'app sur Google Play (Android). Parcours déployés progressivement près de chez toi. iOS prévu ensuite.",
  openGraph: {
    title: "Balad'indice — chasse au trésor · Grand Est",
    description:
      "Énigmes, indices et trésor au bout du parcours. App mobile Android (Play Store), iOS bientôt.",
  },
};

function PlayStoreBadgeLink() {
  const inner = (
    <Image
      src="/images/google-play.png"
      alt="Télécharger sur Google Play"
      width={200}
      height={100}
      className="max-w-[200px]"
      style={{ width: "auto", height: "auto" }}
    />
  );
  if (PLAY_STORE_URL) {
    return (
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-lg ring-2 ring-transparent transition hover:ring-[#68a618]/40 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#68a618]"
      >
        {inner}
      </a>
    );
  }
  return (
    <div className="inline-block rounded-lg ring-2 ring-[#281401]/10">
      {inner}
    </div>
  );
}

export default async function Home() {
  const reviews = await getFiveStarReviews(5);
  const adventures = await getSampleAdventures();
  const adventureCount = adventures.length;

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Hero */}
      <div className="relative mb-6 flex min-h-[min(62vw,22rem)] w-full flex-col justify-center overflow-hidden sm:mb-8 sm:min-h-96 md:min-h-[28rem]">
        <Image
          src="/images/Ville-Pres-Geo-1720509386955.webp"
          alt=""
          fill
          className="object-cover sepia-[0.12]"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-linear-to-b from-[#281401]/70 via-[#281401]/45 to-[#1a0d00]/85"
          aria-hidden
        />
        <div
          className={`relative z-10 flex w-full flex-col gap-5 py-12 text-center sm:gap-6 sm:py-16 md:py-20 ${shell}`}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#c8e89f] sm:text-xs">
            Nouveau · Grand Est
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-tight">
            La ville devient une chasse au trésor
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-base font-medium leading-relaxed text-white/95 drop-shadow sm:text-lg md:text-xl">
            Avec <strong className="font-semibold text-white">Balad&apos;indice</strong>, marche,
            suis les indices et résous les énigmes dans l&apos;app jusqu&apos;au trésor. Les parcours se déploient
            <strong className="font-semibold text-[#d4f0a8]"> progressivement</strong>, au plus près de
            chez toi — la carte s&apos;enrichit au fil des semaines.
          </p>
          <div
            className="mx-auto flex flex-wrap items-center justify-center gap-2 text-xs text-white/90 sm:text-sm"
            role="list"
          >
            <span
              role="listitem"
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm"
            >
              Gratuit
            </span>
            <span
              role="listitem"
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm"
            >
              App mobile
            </span>
            <span
              role="listitem"
              className="rounded-full border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm"
            >
              Famille &amp; amis
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="h-11 rounded-lg border-0 bg-[#68a618] px-6 text-sm font-semibold text-white shadow-lg shadow-[#281401]/20 hover:bg-[#5a9015] sm:h-12 sm:px-8"
              asChild
            >
              <Link href="#telecharger">Télécharger sur Android</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-lg border-white/40 bg-white/10 px-6 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 sm:h-12 sm:px-8"
              asChild
            >
              <Link href="#carte-aventures">Voir la carte</Link>
            </Button>
          </div>
          <p className="text-xs text-white/65 sm:text-sm">
            Disponible sur{" "}
            <strong className="text-white/90">Google Play</strong> pour commencer ·{" "}
            <strong className="text-white/90">iPhone (App Store)</strong> dans un second temps.
          </p>
        </div>
      </div>

      {/* Bandeau territoire */}
      <div className="border-y border-[#68a618]/20 bg-linear-to-r from-[#e8f5e0]/90 via-[#fef0c7]/60 to-[#e8f5e0]/90 py-4">
        <div
          className={`${shell} flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-6 sm:text-left`}
        >
          <p className="text-sm font-semibold text-[#281401] sm:shrink-0">
            Lancement progressif
          </p>
          <p className="max-w-3xl text-pretty text-sm leading-relaxed text-[#281401]/85">
            On ouvre le jeu <strong className="font-medium text-[#281401]">zone par zone</strong> dans
            le Grand Est. Peu d&apos;aventures au début, c&apos;est normal — la carte se remplit avec
            vous.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-16 pb-16 pt-10 sm:gap-20 sm:pb-20 sm:pt-12 md:gap-24">
        {/* Pourquoi jouer */}
        <section className={shell} aria-labelledby="pourquoi-titre">
          <h2 id="pourquoi-titre" className={`${sectionTitle} mb-8 text-center`}>
            Pourquoi se lancer&nbsp;?
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            <li>
              <Card className="h-full border-[#281401]/10 bg-white/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#281401]">
                    Dehors, ensemble
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-[#281401]/80">
                  Un jeu qui se joue en marchant, sans écran toute la journée — idéal pour une sortie
                  entre parents et enfants ou entre amis.
                </CardContent>
              </Card>
            </li>
            <li>
              <Card className="h-full border-[#281401]/10 bg-white/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#281401]">
                    Énigmes &amp; indices
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-[#281401]/80">
                  Chaque bonne réponse t&apos;oriente vers l&apos;étape suivante. Simple, ludique,
                  avec un vrai fil conducteur jusqu&apos;au trésor.
                </CardContent>
              </Card>
            </li>
            <li>
              <Card className="h-full border-[#281401]/10 bg-white/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#281401]">
                    Ton territoire
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-[#281401]/80">
                  Des parcours pensés pour des territoires réels, pas une carte vide : au fur et à
                  mesure, tu pourras jouer près de chez toi.
                </CardContent>
              </Card>
            </li>
          </ul>
        </section>

        {/* Carte */}
        <section
          className={shell}
          id="carte-aventures"
          aria-labelledby="adventures-heading"
        >
          <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
            <h2
              id="adventures-heading"
              className="text-balance text-2xl font-semibold tracking-tight text-[#281401] sm:text-3xl"
            >
              Où jouer&nbsp;?
            </h2>
            <p className="max-w-2xl text-pretty text-sm text-[#281401]/80 sm:text-base">
              {adventureCount > 0 ? (
                <>
                  <strong className="font-semibold text-[#281401]">
                    {adventureCount} aventure{adventureCount > 1 ? "s" : ""}
                  </strong>{" "}
                  {adventureCount === 1
                    ? "est disponible sur la carte"
                    : "sont disponibles sur la carte"}{" "}
                  — repère le point de départ, puis ouvre l&apos;app pour commencer.
                </>
              ) : (
                <>
                  Les premiers départs apparaîtront ici. En attendant, installe l&apos;app Android
                  pour être prêt dès l&apos;ouverture d&apos;un parcours près de chez toi.
                </>
              )}
            </p>
            <AdventureMapClient adventures={adventures} />
            <p className="max-w-md text-xs text-[#281401]/55 sm:text-sm">
              Astuce : télécharge l&apos;app avant de partir — le jeu se pilote depuis ton
              téléphone.
            </p>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className={shell} aria-labelledby="comment-ca-marche">
          <h2 id="comment-ca-marche" className={`${sectionTitle} mb-10`}>
            Comment ça marche&nbsp;?
          </h2>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-12">
            <div className="relative aspect-square w-full max-w-[280px] shrink-0 sm:max-w-xs">
              <Image
                src="/images/scanQr.png"
                alt="Smartphone avec l&apos;application Balad&apos;indice"
                fill
                className="object-contain drop-shadow-md"
                sizes="(max-width: 1024px) 280px, 320px"
                loading="eager"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-6 text-left">
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 1</h3>
                <blockquote className={quote}>
                  Télécharge <strong>Balad&apos;indice</strong> sur le{" "}
                  <strong>Google Play Store</strong> (Android). La version{" "}
                  <strong>iOS</strong> suivra.
                </blockquote>
              </div>
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 2</h3>
                <blockquote className={quote}>
                  Choisis une aventure sur la carte et rends-toi au point de départ.
                </blockquote>
              </div>
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 3</h3>
                <blockquote className={quote}>
                  Avance dans le parcours : réponds aux énigmes dans l&apos;app — chaque bonne réponse
                  t&apos;indique où aller pour la suivante.
                </blockquote>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col-reverse items-center gap-10 lg:mt-16 lg:flex-row lg:items-start lg:gap-12">
            <div className="flex min-w-0 flex-1 flex-col gap-6 text-left">
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 4</h3>
                <blockquote className={quote}>
                  Enchaîne les énigmes à ton rythme — en général entre 30&nbsp;minutes et
                  1&nbsp;heure selon le parcours.
                </blockquote>
              </div>
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 5</h3>
                <blockquote className={quote}>
                  Atteins le trésor final : la récompense t&apos;attend au bout du chemin.
                </blockquote>
              </div>
            </div>
            <div className="relative aspect-square w-full max-w-[280px] shrink-0 sm:max-w-xs">
              <Image
                src="/images/treasureia.png"
                alt="Trésor à la fin du parcours"
                fill
                className="object-contain drop-shadow-md"
                sizes="(max-width: 1024px) 280px, 320px"
              />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className={shell} aria-labelledby="questions">
          <h2 id="questions" className={`${sectionTitle} mb-8 text-center`}>
            Questions fréquentes
          </h2>
          <Accordion
            type="single"
            collapsible
            className="mx-auto w-full max-w-2xl rounded-xl border border-[#281401]/10 bg-white/50 px-1 shadow-sm sm:px-2"
          >
            <AccordionItem value="q-android-ios" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Sur quel téléphone puis-je jouer&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Pour l&apos;instant, télécharge l&apos;application sur{" "}
                <strong className="text-[#281401]">Google Play (Android)</strong>. Une version{" "}
                <strong className="text-[#281401]">iPhone (App Store)</strong> est prévue dans un
                second temps — reste informé&nbsp;!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question1" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                L&apos;application est-elle gratuite&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                <strong className="text-[#281401]">Oui&nbsp;!</strong> Tu peux télécharger
                l&apos;application gratuitement et commencer tout de suite.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question2" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                À partir de quel âge peut-on jouer&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Balad&apos;indice est pensé pour les enfants, mais toute la famille peut jouer
                ensemble&nbsp;!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question3" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Comment commencer une aventure&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Installe l&apos;app depuis le Play Store, choisis une aventure sur la carte puis
                suis les indications jusqu&apos;au point de départ.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question4" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Faut-il une connexion Internet&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Oui, une connexion est recommandée pour charger le parcours, valider les étapes et
                accéder aux énigmes dans l&apos;application.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question5" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Je suis bloqué sur une énigme, que faire&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Pas de panique&nbsp;! Relis bien l&apos;indice, observe autour de toi, reprends le
                fil depuis l&apos;étape précédente ou demande de l&apos;aide à un adulte.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question6" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Combien de temps dure une aventure&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Cela dépend du parcours, mais en général entre 30&nbsp;minutes et 1&nbsp;heure.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question7" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Peut-on jouer plusieurs fois&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Une seule fois par aventure.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question8" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Que gagne-t-on à la fin&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                À la fin de l&apos;aventure, tu découvriras un trésor&nbsp;!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question9" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Est-ce sécurisé pour les enfants&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Oui, les parcours sont conçus pour être sûrs et adaptés aux enfants.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question10" className="border-b-0">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Que faire si l&apos;application ne fonctionne pas&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Essaie de redémarrer l&apos;application ou ton téléphone. Si le problème continue,{" "}
                <Link
                  href="/contact"
                  className="text-[#281401]/85 underline-offset-4 hover:text-[#281401] hover:underline"
                >
                  contacte-nous
                </Link>
                .
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Témoignages */}
        <section className={shell} aria-labelledby="reviews">
          <h2 id="reviews" className={`${sectionTitle} mb-8 text-center`}>
            Ils se sont lancés
          </h2>
          {reviews.length === 0 ? (
            <p className="mx-auto max-w-lg text-center text-sm leading-relaxed text-[#281401]/70">
              Les premiers avis cinq étoiles apparaîtront ici. En attendant, télécharge l&apos;app
              et sois parmi les premiers aventuriers sur le territoire&nbsp;!
            </p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <li key={review.id} className="break-inside-avoid">
                  <Card className="h-full border-[#281401]/10 bg-white/70 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="space-y-3 pb-2">
                      <CardTitle className="text-lg text-[#281401]">
                        {review.user.name}
                      </CardTitle>
                      <div
                        className="flex gap-0.5"
                        aria-label="5 étoiles sur 5"
                      >
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
                    <CardContent className="space-y-3 text-left text-sm leading-relaxed text-[#281401]/85 sm:text-base">
                      <p>{review.content}</p>
                      {review.image && (
                        <Image
                          src={review.image}
                          alt={`Photo partagée par ${review.user.name}`}
                          width={300}
                          height={200}
                          className="mt-2 w-full rounded-lg object-cover"
                          style={{ height: "auto", maxHeight: "12rem" }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* CTA téléchargement */}
        <section
          id="telecharger"
          className={`${shell} max-w-3xl scroll-mt-24`}
          aria-labelledby="cta-heading"
        >
          <div className="rounded-2xl border border-[#281401]/10 bg-linear-to-br from-[#fef0c7]/90 via-white to-[#e8f5e0]/50 px-6 py-10 text-center shadow-md ring-1 ring-[#68a618]/15 sm:px-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#68a618]">
              Application mobile
            </p>
            <h2
              id="cta-heading"
              className="mt-2 text-balance text-2xl font-bold tracking-tight text-[#281401] sm:text-3xl"
            >
              Télécharge Balad&apos;indice sur Android
            </h2>
            <p className="mt-3 text-pretty text-[#281401]/80 sm:text-lg">
              Commence sur <strong className="text-[#281401]">Google Play</strong>. La version{" "}
              <strong className="text-[#281401]/80">iOS (App Store)</strong> arrivera ensuite — on te
              tiendra au courant.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-10">
              <PlayStoreBadgeLink />
              <div className="flex flex-col items-center gap-2">
                <Image
                  src="/images/icons8-qr-code-50.png"
                  alt="Accès rapide au téléchargement sur mobile"
                  width={120}
                  height={120}
                  className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-[#281401]/10"
                />
                <span className="text-xs text-[#281401]/60">
                  Ouvre depuis ton mobile pour télécharger
                </span>
              </div>
            </div>
            <div className="mt-8 rounded-xl border border-dashed border-[#281401]/20 bg-white/50 px-4 py-3 text-sm text-[#281401]/65">
              <p>
                <strong className="text-[#281401]/85">iPhone</strong> : l&apos;app n&apos;est pas
                encore sur l&apos;App Store — suivez nos actus pour la sortie iOS.
              </p>
            </div>
            {process.env.NODE_ENV === "development" && !PLAY_STORE_URL ? (
              <p className="mt-4 text-xs text-[#281401]/55">
                Lien Play Store : définir{" "}
                <code className="rounded bg-[#281401]/10 px-1.5 py-0.5 font-mono text-[0.7rem]">
                  NEXT_PUBLIC_PLAY_STORE_URL
                </code>{" "}
                pour un badge cliquable.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
