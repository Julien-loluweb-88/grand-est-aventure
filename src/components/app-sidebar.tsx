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
  RowsIcon,
  TerminalIcon,
  BookOpenIcon,
  EnvelopeSimpleIcon,
  ScrollIcon,
} from "@phosphor-icons/react"

export type DashboardSessionUser = {
  name: string | null
  email: string
  image?: string | null
}

function buildNavMain(caps: AdminSessionCapabilities) {
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

  return [
    ...utilisateursNav,
    ...demandesNav,
    {
      title: "Aventures",
      url: "/admin-game/dashboard/aventures",
      icon: <BookOpenIcon />,
      isActive: !caps.user.get,
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
        {
          title: "Villes",
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <RowsIcon />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Grand Est Aventure</span>
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
