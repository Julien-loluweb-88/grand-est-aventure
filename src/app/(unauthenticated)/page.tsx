import Image from "next/image";
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
import { getFiveStarReviews, getSampleAdventures } from "./acceuil.action";
import AdventureMapClient from "./_components/adventureMap";
import Link from "next/link";

const shell = "mx-auto w-full max-w-5xl px-4 sm:px-6";

const sectionTitle =
  "scroll-mt-24 border-b border-[#281401]/12 pb-3 text-2xl font-semibold tracking-tight text-[#39951a] sm:text-3xl";

const stepH3 =
  "text-xl font-semibold tracking-tight text-[#281401] sm:text-2xl";

const quote =
  "rounded-r-lg border-l-4 border-[#68a618] bg-[#fef0c7]/50 py-3 pl-4 pr-3 text-left text-sm leading-relaxed text-[#281401]/90 sm:pl-5 sm:text-base";

export default async function Home() {
  await new Promise(r => setTimeout(r, 5000))
  const reviews = await getFiveStarReviews(5);
  const adventures = await getSampleAdventures();
  if (!adventures) return <p>Aventure introuvable</p>;

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Hero */}
      <div className="relative mb-8 flex min-h-[min(58vw,20rem)] w-full flex-col justify-center overflow-hidden sm:mb-10 sm:min-h-88 md:min-h-104">
        <Image
          src="/images/Ville-Pres-Geo-1720509386955.webp"
          alt=""
          fill
          className="object-cover sepia-[0.15]"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-linear-to-b from-[#281401]/60 via-[#281401]/40 to-[#281401]/70"
          aria-hidden
        />
        <div
          className={`relative z-10 flex w-full flex-col gap-4 py-12 text-center sm:gap-5 sm:py-16 md:py-20 ${shell}`}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/80">
            Chasse au trésor urbaine
          </p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl">
            Pars à l&apos;aventure avec Balad&apos;indice et ton téléphone
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-base font-medium leading-relaxed text-white/95 drop-shadow sm:text-lg md:text-xl">
            Balad&apos;indice transforme la ville en une grande chasse au trésor.
            Scanne des QR codes, découvre des indices cachés et résous des
            énigmes. Au bout du parcours, un trésor t&apos;attend&nbsp;!
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-16 pb-16 sm:gap-20 sm:pb-20 md:gap-24">
        {/* Carte */}
        <section className={shell} aria-labelledby="adventures-heading">
          <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
            <h2
              id="adventures-heading"
              className="text-balance text-2xl font-semibold tracking-tight text-[#281401] sm:text-3xl"
            >
              Découvre des aventures
            </h2>
            <p className="max-w-xl text-pretty text-sm text-[#281401]/75 sm:text-base">
              Repère les départs près de chez toi sur la carte interactive.
            </p>
            <AdventureMapClient adventures={adventures} />
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
                alt="Smartphone pour scanner un code QR"
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
                  Télécharge l&apos;application Balad&apos;indice sur ton
                  smartphone.
                </blockquote>
              </div>
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 2</h3>
                <blockquote className={quote}>
                  Découvre des aventures dans ta ville.
                </blockquote>
              </div>
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 3</h3>
                <blockquote className={quote}>
                  Cherche et scanne des codes QR, trouve les réponses aux
                  énigmes&nbsp;: chaque bonne réponse t&apos;indique où aller
                  pour l&apos;énigme suivante.
                </blockquote>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col-reverse items-center gap-10 lg:mt-16 lg:flex-row lg:items-start lg:gap-12">
            <div className="flex min-w-0 flex-1 flex-col gap-6 text-left">
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 4</h3>
                <blockquote className={quote}>
                  Continue à résoudre les énigmes…
                </blockquote>
              </div>
              <div className="space-y-3">
                <h3 className={stepH3}>Étape 5</h3>
                <blockquote className={quote}>
                  Et voilà&nbsp;! Les réponses te guident jusqu&apos;au trésor.
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
            <AccordionItem value="question1" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                L&apos;application est-elle gratuite&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                <strong className="text-[#281401]">Oui&nbsp;!</strong> Tu peux
                télécharger l&apos;application gratuitement et commencer tout de
                suite.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question2" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                À partir de quel âge peut-on jouer&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Balad&apos;indice est pensé pour les enfants, mais toute la
                famille peut jouer ensemble&nbsp;!
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question3" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Comment commencer une aventure&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Télécharge l&apos;application, choisis une aventure près de toi
                et suis les instructions pour commencer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question4" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Faut-il une connexion Internet&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Oui, une connexion est recommandée pour scanner les QR codes et
                accéder aux énigmes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question5" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Que faire si je ne trouve pas un QR code&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Pas de panique&nbsp;! Regarde bien autour de toi, relis
                l&apos;énigme précédente ou demande de l&apos;aide à un adulte.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question6" className="border-[#281401]/10">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Combien de temps dure une aventure&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Cela dépend du parcours, mais en général entre 30&nbsp;minutes et
                1&nbsp;heure.
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
                Oui, les parcours sont conçus pour être sûrs et adaptés aux
                enfants.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="question10" className="border-b-0">
              <AccordionTrigger className="px-3 text-left text-[#281401] hover:no-underline sm:px-4">
                Que faire si l&apos;application ne fonctionne pas&nbsp;?
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 text-left text-[#281401]/85 sm:px-4">
                Essaie de redémarrer l&apos;application ou ton téléphone. Si
                le problème continue, <Link
                  href="/contact"
                  className="text-[#281401]/85 underline-offset-4 hover:text-[#281401] hover:underline"
                >
                  Contacte-nous
                </Link>.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Témoignages */}
        <section className={shell} aria-labelledby="reviews">
          <h2 id="reviews" className={`${sectionTitle} mb-8 text-center`}>
            Témoignages d&apos;aventuriers
          </h2>
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
        </section>

        {/* CTA téléchargement */}
        <section
        id="cta-download"
          className={`${shell} max-w-3xl`}
          aria-labelledby="cta-download"
        >
          <div className="rounded-2xl border border-[#281401]/10 bg-linear-to-br from-[#fef0c7]/80 to-white/90 px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
            <h2
              className="text-balance text-2xl font-bold tracking-tight text-[#68a618] sm:text-3xl"
            >
              Prêt à commencer ton aventure&nbsp;?
            </h2>
            <p className="mt-3 text-[#281401]/80">
              Télécharge l&apos;application gratuitement.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-10">
              <div className="inline-block rounded-lg ring-2 ring-transparent transition hover:ring-[#68a618]/30">
                <Image
                  src="/images/google-play.png"
                  alt="Disponible sur Google Play"
                  width={200}
                  height={100}
                  className="max-w-[200px]"
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Image
                  src="/images/icons8-qr-code-50.png"
                  alt="Code QR pour télécharger l&apos;application"
                  width={120}
                  height={120}
                  className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-[#281401]/10"
                />
                <span className="text-xs text-[#281401]/60">
                  Scanne pour télécharger
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
