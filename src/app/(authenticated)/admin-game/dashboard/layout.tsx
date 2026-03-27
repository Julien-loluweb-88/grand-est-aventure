import { isAdmin } from "@/lib/auth/auth-user";
import { AppSidebar } from "@/components/app-sidebar"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { getUser } from "@/lib/auth/auth-user";
import Header from "../../_components/layout/Header";
import { getAdminSessionCapabilities } from "@/lib/admin-session-capabilities";
import { AdminCapabilitiesProvider } from "./AdminCapabilitiesProvider";
import { redirect } from "next/navigation";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser()
  await isAdmin();
  const capabilities = await getAdminSessionCapabilities();
  if (!capabilities) {
    redirect("/admin-game");
  }

  return (
    <AdminCapabilitiesProvider value={capabilities}>
      <SidebarProvider>
        {user && (
          <AppSidebar
            sessionUser={{
              name: user.name ?? null,
              email: user.email,
              image: user.image ?? null,
            }}
            capabilities={capabilities}
          />
        )}
        <SidebarInset>
          {user && <Header />}
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AdminCapabilitiesProvider>
  );
}
