import { redirect } from "next/navigation";
import { getSession, getUser } from "@/lib/auth/auth-user";
import { getAdminSessionCapabilities } from "@/lib/admin-session-capabilities";
import { getDashboardOverview } from "./_lib/dashboard-overview";
import { AdminDashboardHomeView } from "./_components/AdminDashboardHomeView";

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect("/unauthorized");
  }

  const [user, capabilities] = await Promise.all([getUser(), getAdminSessionCapabilities()]);
  if (!user || !capabilities) {
    redirect("/admin-game");
  }

  const overview = await getDashboardOverview({
    userId: user.id,
    capabilities,
  });

  return (
    <AdminDashboardHomeView
      displayName={user.name}
      email={user.email}
      overview={overview}
      capabilities={capabilities}
    />
  );
}
