import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarImage,
} from "@/components/ui/avatar"

export default function Home() {
  return (
    <div className="text-[#281401] relative min-h-screen flex flex-col overflow-hidden bg-[#fef0c7]">
      <Image
      src="/images/background.jpg"
      alt=""
      fill
      className="object-cover"
      />
      <div className="relative z-10 px-4 py-16">
      <header className="flex justify-between p-5">
        <div className="flex gap-5">
        <BrandMark height={50} className="bg-transparent"/>
        <h1 className="text-3xl font-semibold tracking-tight">
          Balad&apos;indice
        </h1>
        </div>
        <nav className="flex gap-6">
          <Link href="#comment-ca-marche" className="hover:underline">Comment ça marche?</Link>
          <Link href="#questions" className="hover:underline">Questions</Link>
          <Link href="#reviews" className="hover:underline">Avis</Link>
        </nav>
        <Button className="bg-[#68a618] text-base">Télécharger l&apos;application</Button>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center z-10 relative px-4">
      <main className="max-w-6xl flex flex-col items-center text-center justify-center gap-8 mx-auto bg-[#fffaeb] p-5">
          <BrandMark height={150} className="bg-transparent"/>
         <div className="mb-6 flex flex-col justify-center gap-8">
          <h1 className="text-4xl font-semibold tracking-tight">
            Balad&apos;indice
          </h1>
          <p className="text-3xl tracking-tight">
            Pars à l&apos;aventure avec Balad’indice et ton téléphone
          </p>
          <p>
            Balad’indice transforme la ville en une grande chasse au trésor.
            Scanne des QR codes avec ton téléphone, découvre des indices cachés
            et résous des énigmes. Au bout de l’aventure, un trésor t’attend!
          </p>
          </div>

        <section className="flex flex-col gap-5">
         <h2 id="comment-ca-marche" className="text-3xl font-semibold tracking-tight border-b scroll-mt-24">Comment ça marche?</h2>
         <div className="flex flex-row gap-5 p-5">
         <Image
         src="/images/scanQr.png"
         alt="Smartphone"
         width={350}
         height={350}
         />
       <div className="flex flex-col gap-3 text-left">
         <h3 className="scroll-m-20 text-2xl  font-semibold tracking-tight">Étape 1</h3>
         <blockquote className="mt-6 border-l-2 pl-6">
      Télécharge l&apos;application de Balad&apos;indice sur ton smartphone.
    </blockquote>
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Étape 2</h3>
    <blockquote className="mt-6 border-l-2 pl-6">
    Découvre des aventures dans ta ville.
    </blockquote>
     <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Étape 3</h3>
    <blockquote className="mt-6 border-l-2 pl-6">
    Cherche et scanne des codes QR, trouve les réponses aux énigeme,
    et la réponse te guidera vers le prochain QR code(énigme)
    </blockquote>
    </div>
    </div>
    <div className="flex flex-row gap-5 p-5">
      <div className="flex flex-col gap-3 text-left">
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Étape 4</h3>
    <blockquote className="mt-6 border-l-2 pl-6">
    Continue à résoudre les énigemes...
    </blockquote>
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Étape 5</h3>
    <blockquote className="mt-6 border-l-2 pl-6">
    Et Ta-da!! Les réponses aux énigemes te guideront jusqu’au trésor !
    </blockquote>
    </div>
    <Image
    src="/images/treasureia.png"
    alt="Tréasor"
    width={350}
    height={350}
    />
    </div>
  </section>

  <section>
    <h2 id="questions" className="text-3xl font-semibold tracking-tight border-b scroll-mt-24">Questions fréquentes</h2>
    <Accordion
      type="single"
      collapsible
      defaultValue={undefined}
      className="w-full max-w-lg mx-auto"
    >
      <AccordionItem value="question1">
        <AccordionTrigger>L’application est-elle gratuite ?</AccordionTrigger>
        <AccordionContent className="py-2 wrap-break-word">
          <strong>Oui !</strong> Tu peux télécharger l’application gratuitement et commencer l’aventure tout de suite.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question2">
        <AccordionTrigger>À partir de quel âge peut-on jouer ?</AccordionTrigger>
        <AccordionContent className="py-2 wrap-break-word">
        Balad’indice est conçu pour les enfants, mais toute la famille peut jouer ensemble !
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question3">
        <AccordionTrigger>Comment commencer une aventure ?</AccordionTrigger>
        <AccordionContent className="py-2 wrap-break-word">
          Télécharge l’application, choisis une aventure près de toi et suis les instructions pour commencer.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question4">
        <AccordionTrigger>Faut-il une connexion Internet ?</AccordionTrigger>
        <AccordionContent className="min-h-25 wrap-break-word">
          Oui, une connexion est recommandée pour scanner les QR codes et accéder aux énigmes.
          </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question5">
        <AccordionTrigger>Que faire si je ne trouve pas un QR code ?</AccordionTrigger>
        <AccordionContent className="min-h-25 wrap-break-word">
          Pas de panique ! Regarde bien autour de toi, lise bien la réponse à l&apos;enigme précedent ou demande de l’aide à un adulte.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="question6">
        <AccordionTrigger>Combien de temps dure une aventure ?</AccordionTrigger>
        <AccordionContent className="min-h-25 wrap-break-word">
          Cela dépend du parcours, mais en général entre 30 minutes et 1 heure.
          </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question7">
        <AccordionTrigger>Peut-on jouer à plusieurs fois?</AccordionTrigger>
        <AccordionContent className="min-h-25 wrap-break-word">Une seule fois par aventure.

        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question8">
        <AccordionTrigger>Que gagne-t-on à la fin ?</AccordionTrigger>
        <AccordionContent className="min-h-25 wrap-break-word">
          À la fin de l’aventure, tu découvriras un trésor !
          </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question9">
        <AccordionTrigger>Est-ce que c’est sécurisé pour les enfants ?</AccordionTrigger>
        <AccordionContent className="min-h-25 wrap-break-word">
          Oui, les parcours sont conçus pour être sûrs et adaptés aux enfants.
          </AccordionContent>
      </AccordionItem>
      <AccordionItem value="question10">
        <AccordionTrigger>Que faire si l’application ne fonctionne pas ?</AccordionTrigger>
        <AccordionContent className="min-h-25 wrap-break-word">
          Essaie de redémarrer l&apos;application ou ton téléphone. Si le problème continue, contacte nous.
          </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  <section>
    <h2 id="reviews" className="text-3xl font-semibold tracking-tight border-b scroll-mt-24">
      Témoignages d&apos;aventuriers</h2>
      <div className="flex flex-row justify-between p-5">
      <Card className="p-5">
        <CardHeader>
        <Avatar>
        <AvatarImage
          src="https://github.com/evilrabbit.png"
          alt="@evilrabbit"
        />
      </Avatar>
      <CardTitle>Toto</CardTitle>
      <div className="flex flex-row">
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
      </div>
      </CardHeader>
      <CardContent className="text-base">
        C&apos;est une super experience !
      </CardContent>
      </Card>
      <Card className="p-5">
        <CardHeader>
        <Avatar>
        <AvatarImage
          src="https://github.com/evilrabbit.png"
          alt="@evilrabbit"
        />
      </Avatar>
      <CardTitle>Toto</CardTitle>
      <div className="flex flex-row">
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
      </div>
      </CardHeader>
      <CardContent className="text-base">
        C&apos;est une super experience !
      </CardContent>
      </Card>
      <Card className="p-5">
        <CardHeader>
        <Avatar>
        <AvatarImage
          src="https://github.com/evilrabbit.png"
          alt="@evilrabbit"
        />
      </Avatar>
      <CardTitle>Toto</CardTitle>
      <div className="flex flex-row">
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
        <Image
        src="/images/icons8-star-48.png" 
        alt="étoire"
        width={20}
        height={20}
        />
      </div>
      </CardHeader>
      <CardContent className="text-base">
        C&apos;est une super experience !
      </CardContent>
      </Card>
      </div>
  </section>
          <div>
            <h2 className="text-xl font-semibold tracking-tight py-5">
              Prêt à commencer ton aventure?
            </h2>
            <Button className="bg-[#68a618] text-lg">
              Télécharger l&apos;application gratuitement
            </Button>
          </div>
        </main>
      </div>

      <footer className="max-w-6xl flex flex-col items-center text-center justify-center gap-8 mx-auto bg-[#fffaeb] p-5 border-t">
        <div className="flex flex-row justify-between">
        <p className="text-sm">&copy; 2026 LoluWeb Tous droits réservés</p>
        <nav className="flex gap-6">
      
          <Link href="#" className="hover:underline">Contact</Link>
          <Link href="#" className="hover:underline">Mention légales</Link>
          <Link href="#" className="hover:underline">Politique de confidentialité</Link>
          <Link href="#" className="hover:underline">Conditions d’utilisation</Link>
          <Link href="#" className="hover:underline">Droit applicable : France</Link>
  
        </nav>
        </div>
        {/*Pour admin */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center border-t pt-4">
          <p className="mt-4 text-sm text-muted-foreground">
          Plateforme de gestion des parcours et du contenu. L’accès au tableau
          de bord est réservé aux équipes habilitées.
          </p>
          <Link
            href="/admin-game"
            className="inline-flex h-8 items-center justify-center rounded-none px-6 text-sm text-primary-foreground hover:bg-primary/90 bg-[#68a618] "
          >
            Espace administration
          </Link>
          </div>
      </footer>
      </div>
      </div>
   
  );
}
