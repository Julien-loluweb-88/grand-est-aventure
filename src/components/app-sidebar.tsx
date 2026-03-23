"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
import { RowsIcon, TerminalIcon, BookOpenIcon } from "@phosphor-icons/react"

export type DashboardSessionUser = {
  name: string | null
  email: string
  image?: string | null
}

const navMain = [
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
  {
    title: "Aventures",
    url: "/admin-game/dashboard/aventures",
    icon: <BookOpenIcon />,
    items: [
      {
        title: "Liste",
        url: "/admin-game/dashboard/aventures",
      },
      {
        title: "Créer",
        url: "/admin-game/dashboard/aventures/create",
      },
    ],
  },
]

export function AppSidebar({
  sessionUser,
  ...props
}: { sessionUser: DashboardSessionUser } & React.ComponentProps<typeof Sidebar>) {
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
