import { isAdmin } from "@/lib/auth/auth-user";
import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { getUser } from "@/lib/auth/auth-user";
import Header from "../../_components/layout/Header";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser()
  await isAdmin();
  return <>
   <SidebarProvider>
   {user && (
     <AppSidebar
       sessionUser={{
         name: user.name ?? null,
         email: user.email,
         image: user.image ?? null,
       }}
     />
   )}
  <SidebarInset>
  {user && <Header />}
  <main>
  {children}
  </main>
  </SidebarInset>
</SidebarProvider>
</>;
}
