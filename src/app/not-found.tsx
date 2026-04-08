import '../app/(unauthenticated)/globals.css'
import Link from 'next/link'
import Image from "next/image";

 
export default function NotFound() {

  return (
    <div style={{ fontFamily: '"JetBrains Mono", monospace' }} className="flex min-h-screen flex-col bg-[#fffaeb] items-center text-[#281401] justify-center gap-5 ">
      <h2  className="text-3xl font-bold text-[#39951a]">Page non trouvé</h2>
      <p className="text-base text-[#281401]/75"> 404</p>
      <p className='text-xl font-semibold tracking-tight text-[#281401]'>Oups ! Cette piste est introuvable...</p>
      <Image
      src="/images/treasure-vide.png"
      alt="Trésor vide"
      className="object-contain drop-shadow-md"
      width={250}
      height={250}
      />
      <div className='flex flex-row gap-3'>
        <Image
        src="/images/icons8-courir-50.png"
        alt="curir"
        width={25}
      height={25}
        />
      <Link href="/" className='text-xl font-semibold tracking-tight text-[#281401] hover:underline'>Retune à l&apos;accueil</Link>
    </div>
    </div>
  )
}