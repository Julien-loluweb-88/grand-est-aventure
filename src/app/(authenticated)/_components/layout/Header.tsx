"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const DASHBOARD = "/admin-game/dashboard"

type Crumb = { label: string; href: string | null }

function breadcrumbsForPath(pathname: string | null): Crumb[] {
  if (!pathname) {
    return [{ label: "Tableau de bord", href: null }]
  }

  if (pathname === DASHBOARD || pathname === `${DASHBOARD}/`) {
    return [{ label: "Tableau de bord", href: null }]
  }

  const tail = pathname.startsWith(`${DASHBOARD}/`)
    ? pathname.slice(DASHBOARD.length).replace(/^\//, "")
    : ""

  if (!tail) {
    return [{ label: "Tableau de bord", href: null }]
  }

  const crumbs: Crumb[] = [{ label: "Tableau de bord", href: DASHBOARD }]

  if (tail === "parametres" || tail.startsWith("parametres/")) {
    crumbs.push({ label: "Paramètres", href: null })
    return crumbs
  }

  if (tail.startsWith("demandes-aventures")) {
    crumbs.push({ label: "Demandes d'aventures", href: null })
    return crumbs
  }

  if (tail.startsWith("journal-admin")) {
    crumbs.push({ label: "Journal d'audit", href: null })
    return crumbs
  }

  if (tail.startsWith("acces-refuse")) {
    crumbs.push({ label: "Accès refusé", href: null })
    return crumbs
  }

  if (tail === "utilisateurs") {
    crumbs.push({ label: "Utilisateurs", href: null })
    return crumbs
  }

  if (tail.startsWith("utilisateurs/")) {
    const rest = tail.slice("utilisateurs/".length)
    const id = rest.split("/")[0]
    if (id) {
      crumbs.push({ label: "Utilisateurs", href: `${DASHBOARD}/utilisateurs` })
      crumbs.push({ label: "Fiche utilisateur", href: null })
    } else {
      crumbs.push({ label: "Utilisateurs", href: null })
    }
    return crumbs
  }

  if (tail === "aventures") {
    crumbs.push({ label: "Aventures", href: null })
    return crumbs
  }

  if (tail.startsWith("aventures/")) {
    if (tail === "aventures/create" || tail.endsWith("/aventures/create")) {
      crumbs.push({ label: "Aventures", href: `${DASHBOARD}/aventures` })
      crumbs.push({ label: "Créer une aventure", href: null })
    } else {
      crumbs.push({ label: "Aventures", href: `${DASHBOARD}/aventures` })
      crumbs.push({ label: "Fiche aventure", href: null })
    }
    return crumbs
  }

  return [{ label: "Tableau de bord", href: null }]
}

export default function Header() {
  const pathname = usePathname()
  const crumbs = breadcrumbsForPath(pathname)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1
              return (
                <span key={`${crumb.label}-${i}`} className="contents">
                  {i > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  <BreadcrumbItem>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
