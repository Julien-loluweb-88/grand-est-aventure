"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import type { AdminSessionCapabilities } from "@/lib/admin-session-capabilities"
import { DEFAULT_DENY_MESSAGE } from "@/components/admin/GuardedButton"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  TerminalIcon,
  BookOpenIcon,
  EnvelopeSimpleIcon,
  ScrollIcon,
  BracketsCurlyIcon,
  MapPinIcon,
  MegaphoneSimpleIcon,
  TrophyIcon,
  HouseIcon,
  StorefrontIcon,
} from "@phosphor-icons/react"
import { BrandMark } from "@/components/brand-mark"

export type DashboardSessionUser = {
  name: string | null
  email: string
  image?: string | null
}

function buildNavMain(caps: AdminSessionCapabilities) {
  if (caps.merchantPortal) {
    return [
      {
        title: "Accueil",
        url: "/admin-game/dashboard",
        icon: <HouseIcon />,
        isActive: false,
        items: [
          {
            title: "Tableau de bord",
            url: "/admin-game/dashboard",
          },
        ],
      },
      {
        title: "Compte commerçant",
        url: "/admin-game/dashboard/commercant",
        icon: <StorefrontIcon />,
        isActive: true,
        items: [
          {
            title: "Validations (app mobile)",
            url: "/admin-game/dashboard/commercant",
          },
        ],
      },
    ];
  }

  const utilisateursNav = caps.user.get
    ? [
        {
          title: "Utilisateurs",
          url: "/admin-game/dashboard/utilisateurs",
          icon: <TerminalIcon />,
          isActive: true,
          items: [
            {
              title: "Liste",
              url: "/admin-game/dashboard/utilisateurs",
            },
          ],
        },
      ]
    : []

  const demandesNav = caps.canAssignRolesAndScopes
    ? [
        {
          title: "Demandes",
          url: "/admin-game/dashboard/demandes",
          icon: <EnvelopeSimpleIcon />,
          isActive: false,
          items: [
            {
              title: "Toutes les demandes",
              url: "/admin-game/dashboard/demandes",
            },
          ],
        },
        {
          title: "Journal d'audit",
          url: "/admin-game/dashboard/journal-admin",
          icon: <ScrollIcon />,
          isActive: false,
          items: [
            {
              title: "Événements",
              url: "/admin-game/dashboard/journal-admin",
            },
          ],
        },
      ]
    : []

  const apiDocsNav = caps.adventure.read
    ? [
        {
          title: "Documentation API",
          url: "/admin-game/dashboard/docs/api",
          icon: <BracketsCurlyIcon />,
          isActive: false,
          items: [
            {
              title: "OpenAPI (lecture seule)",
              url: "/admin-game/dashboard/docs/api",
            },
          ],
        },
      ]
    : []

  const aventuresOpenByDefault = !caps.user.get

  return [
    ...utilisateursNav,
    ...demandesNav,
    ...apiDocsNav,
    {
      title: "Aventures",
      url: "/admin-game/dashboard/aventures",
      icon: <BookOpenIcon />,
      isActive: aventuresOpenByDefault,
      items: [
        {
          title: "Liste",
          url: "/admin-game/dashboard/aventures",
          disabled: !caps.adventure.read,
          disabledReason: !caps.adventure.read
            ? "Vous ne pouvez pas consulter les aventures."
            : undefined,
        },
        {
          title: "Créer",
          url: "/admin-game/dashboard/aventures/create",
          disabled: !caps.adventure.create,
          disabledReason: !caps.adventure.create
            ? "Vous ne pouvez pas créer une aventure."
            : DEFAULT_DENY_MESSAGE,
        },
      ],
    },
    {
      title: "Villes",
      url: "/admin-game/dashboard/villes",
      icon: <MapPinIcon />,
      isActive: false,
      items: [
        {
          title: "Liste",
          url: "/admin-game/dashboard/villes",
          disabled: !caps.adventure.read,
          disabledReason: !caps.adventure.read
            ? "Vous ne pouvez pas consulter les villes."
            : undefined,
        },
        {
          title: "Nouvelle ville",
          url: "/admin-game/dashboard/villes/create",
          disabled: !caps.adventure.update,
          disabledReason: !caps.adventure.update
            ? "Vous ne pouvez pas gérer les villes."
            : DEFAULT_DENY_MESSAGE,
        },
      ],
    },
    {
      title: "Publicités",
      url: "/admin-game/dashboard/publicites",
      icon: <MegaphoneSimpleIcon />,
      isActive: false,
      items: [
        {
          title: "Liste",
          url: "/admin-game/dashboard/publicites",
          disabled: !caps.adventure.read,
          disabledReason: !caps.adventure.read
            ? "Vous ne pouvez pas consulter les publicités."
            : undefined,
        },
        {
          title: "Nouvelle publicité",
          url: "/admin-game/dashboard/publicites/create",
          disabled: !caps.adventure.update,
          disabledReason: !caps.adventure.update
            ? "Vous ne pouvez pas gérer les publicités."
            : DEFAULT_DENY_MESSAGE,
        },
      ],
    },
    {
      title: "Badges globaux",
      url: "/admin-game/dashboard/badges-globaux",
      icon: <TrophyIcon />,
      isActive: false,
      items: [
        {
          title: "Paliers",
          url: "/admin-game/dashboard/badges-globaux",
          disabled: !caps.adventure.read,
          disabledReason: !caps.adventure.read
            ? "Vous ne pouvez pas consulter les badges."
            : undefined,
        },
        {
          title: "Nouveau palier",
          url: "/admin-game/dashboard/badges-globaux/create",
          disabled: !caps.adventure.update,
          disabledReason: !caps.adventure.update
            ? "Vous ne pouvez pas gérer les badges paliers."
            : DEFAULT_DENY_MESSAGE,
        },
      ],
    },
  ]
}

export function AppSidebar({
  sessionUser,
  capabilities,
  ...props
}: {
  sessionUser: DashboardSessionUser
  capabilities: AdminSessionCapabilities
} & React.ComponentProps<typeof Sidebar>) {
  const navMain = buildNavMain(capabilities)
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin-game/dashboard" title="Retour au tableau de bord">
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary">
                  <BrandMark height={40} className="max-h-10" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Balad&apos;indice</span>
                  <span className="truncate text-xs text-muted-foreground">Administration</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} groupLabel="Menu" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: sessionUser.name,
            email: sessionUser.email,
            avatar: sessionUser.image ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
