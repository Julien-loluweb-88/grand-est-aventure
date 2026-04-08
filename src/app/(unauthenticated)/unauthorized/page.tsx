import Link from 'next/link'
import Image from "next/image";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center items-center gap-5 ">
      <h2  className="text-3xl font-bold text-[#39951a]">Page non autorisé</h2>
      <p className="text-base text-[#281401]/75"> 401</p>
      <p className='text-xl font-semibold tracking-tight text-[#281401]'>Oups ! connectez-vous pour consulter cette page.</p>
      <Image
      src="/images/icons8-identité-non-vérifiée-48.png"
      alt="Trésor vide"
      className="object-contain drop-shadow-md"
      width={80}
      height={80}
      />
      <div className='flex flex-row gap-3'>
        <Image
        src="/images/icons8-courir-50.png"
        alt="curir"
        width={25}
        height={25}
        />
      <Link href="/admin-game" className='text-xl font-semibold tracking-tight text-[#281401] hover:underline'>Page connection</Link>
    </div>
    </div>
  )
}