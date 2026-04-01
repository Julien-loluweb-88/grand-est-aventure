import Image from "next/image";
import { cn } from "@/lib/utils";

type SmartphoneProps ={
    className?: string;
    height?: number;
};

export function Smartphone({className, height = 200 }: SmartphoneProps){
    return(
        <Image
        src="/smartphone.jpg"
      alt="Smartphone"
      width={512}
      height={512}
      className={cn("w-auto object-contain bg-white", className)}
      style={{ height }}
      priority
      />
    );
}