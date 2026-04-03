import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getFiveStarReviews, getSampleAdventures } from "./acceuil.action";
import  AdventureMapClient  from "./_components/adventureMap";

export default async function Home() {
  const reviews = await getFiveStarReviews(5);
  const adventures = await getSampleAdventures();
  if (!adventures) return <p>Aventure introuvable</p>;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-0 py-4">
      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 p-5 text-center">
         <div className="relative w-full h-75 mb-6 flex flex-col justify-center gap-8 p-5">
         <Image
         src="/images/Ville-Pres-Geo-1720509386955.webp"
         alt="paysage"
         fill
         className="object-cover filter sepia-20"
         priority
         />
         <div className="relative z-10 container mx-auto gap-5">
          <h1 className="text-4xl tracking-tight text-white text-shadow-lg font-bold pb-5">
            Pars à l&apos;aventure avec Balad’indice et ton téléphone
          </h1>
          <h2 className="text-xl font-semibold text-white text-shadow-lg">
            Balad’indice transforme la ville en une grande chasse au trésor.
            Scanne des QR codes avec ton téléphone, découvre des indices cachés
            et résous des énigmes.<br />
             Au bout de l’aventure, un trésor t’attend!
          </h2>
          </div>
          </div>
    <section>
    <div className="flex flex-col items-center gap-3 p-4">
      <h2 className="text-3xl tracking-tight">Découvre des aventures</h2>
      <AdventureMapClient adventures={adventures} />
    </div>
    </section>

  <section>
         <h2 id="comment-ca-marche" className="text-3xl font-semibold text-[#39951a] tracking-tight border-b scroll-mt-24 mt-6">Comment ça marche?</h2>
         <div className="flex flex-row gap-5 p-5 mt-6">
         <Image
         src="/images/scanQr.png"
         alt="Smartphone"
         width={300}
         height={300}
         />
       <div className="flex flex-col gap-3 text-left">
         <h3 className="scroll-m-20 text-2xl  font-semibold tracking-tight">Étape 1</h3>
         <blockquote className="mt-6 font-medium border-l-2 pl-6">
      Télécharge l&apos;application de Balad&apos;indice sur ton smartphone.
    </blockquote>
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Étape 2</h3>
    <blockquote className="mt-6 font-medium border-l-2 pl-6">
    Découvre des aventures dans ta ville.
    </blockquote>
     <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Étape 3</h3>
    <blockquote className="mt-6 font-medium border-l-2 pl-6">
    Cherche et scanne des codes QR, trouve les réponses aux énigemes,
    et la réponse te guidera vers le prochain QR code(énigme)
    </blockquote>
    </div>
    </div>
    <div className="flex flex-row justify-between gap-5 p-5">
      <div className="flex flex-col gap-3 text-left">
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Étape 4</h3>
    <blockquote className="mt-6 font-medium border-l-2 pl-6">
    Continue à résoudre les énigemes...
    </blockquote>
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Étape 5</h3>
    <blockquote className="mt-6 font-medium border-l-2 pl-6">
    Et Ta-da!! Les réponses aux énigemes te guideront jusqu’au trésor !
    </blockquote>
    </div>
    <Image
    src="/images/treasureia.png"
    alt="Tréasor"
    width={300}
    height={300}
    />
    </div>
  </section>

  <section>
    <h2 id="questions" className="text-3xl font-semibold text-[#39951a] tracking-tight border-b scroll-mt-24 p-5">Questions fréquentes</h2>
    <Accordion
      type="single"
      collapsible
      defaultValue={undefined}
      className="w-full max-w-lg mx-auto overflow-y-auto"
    >
      <AccordionItem value="question1">
        <AccordionTrigger>L’application est-elle gratuite ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
          <strong>Oui !</strong> Tu peux télécharger l’application gratuitement et commencer l’aventure tout de suite.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question2">
        <AccordionTrigger>À partir de quel âge peut-on jouer ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
        Balad’indice est conçu pour les enfants, mais toute la famille peut jouer ensemble !
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question3">
        <AccordionTrigger>Comment commencer une aventure ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
          Télécharge l’application, choisis une aventure près de toi et suis les instructions pour commencer.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question4">
        <AccordionTrigger>Faut-il une connexion Internet ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
          Oui, une connexion est recommandée pour scanner les QR codes et accéder aux énigmes.
          </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question5">
        <AccordionTrigger>Que faire si je ne trouve pas un QR code ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
          Pas de panique ! Regarde bien autour de toi, lise bien la réponse à l&apos;enigme précedent ou demande de l’aide à un adulte.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="question6">
        <AccordionTrigger>Combien de temps dure une aventure ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
          Cela dépend du parcours, mais en général entre 30 minutes et 1 heure.
          </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question7">
        <AccordionTrigger>Peut-on jouer à plusieurs fois?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
          Une seule fois par aventure.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question8">
        <AccordionTrigger>Que gagne-t-on à la fin ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
          À la fin de l’aventure, tu découvriras un trésor !
          </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question9">
        <AccordionTrigger>Est-ce que c’est sécurisé pour les enfants ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-word">
          Oui, les parcours sont conçus pour être sûrs et adaptés aux enfants.
          </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question10">
        <AccordionTrigger>Que faire si l’application ne fonctionne pas ?</AccordionTrigger>
        <AccordionContent className="h-20 overflow-y-auto py-2 wrap-break-wordd">
          Essaie de redémarrer l&apos;application ou ton téléphone. Si le problème continue, contacte nous.
          </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  <section>
    <h2 id="reviews" className="text-3xl font-semibold text-[#39951a] tracking-tight border-b scroll-mt-24 p-5">
      Témoignages d&apos;aventuriers</h2>
      <div className="columns-1 sm:columns-2 md:columns-3 gap-5 p-5">
        {reviews.map((review) => (
      <Card key={review.id} className="p-5">
        <CardHeader>
      <CardTitle>{review.user.name}</CardTitle>
      <div className="flex flex-row">
  {[...Array(5)].map((_, i) => (
    <Image
      key={i}
      src="/images/icons8-star-48.png" 
      alt="étoile"
      width={20}
      height={20}
    />
  ))}
</div>
      </CardHeader>
      <CardContent className="text-base">
        {review.content}
        {review.image && (
          <Image
          src={review.image}
          alt={`Photo de ${review.user.name}`}
          width={300}
          height={200}
          className="mt-3 rounded-md object-cover w-full h-48"
          />
        )} 
      </CardContent>
      </Card>
      ))}
      </div>
  </section>
          <div className="flex flex-col mb-8 items-center">
            <h2 className="text-2xl font-bold text-[#68a618] tracking-tight py-5">
              Prêt à commencer ton aventure?
            </h2>
              <p>Télécharger l&apos;application gratuitement </p>
           <Image
           src="/images/google-play.png"
           alt="Logo google play"
           width={200}
          height={100}
           />
           <Image
           src="/images/icons8-qr-code-50.png"
           alt="Logo google play"
           width={100}
           height={100}
           className="bg-white"
           />
          </div>
        </main>
    </div>
  );
}
