"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { RowsIcon, WaveformIcon, CommandIcon, TerminalIcon, RobotIcon, BookOpenIcon, GearIcon, CropIcon, ChartPieIcon, MapTrifoldIcon } from "@phosphor-icons/react"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "GrandEst",
      logo: (
        <RowsIcon
        />
      ),
      plan: "aventure",
    },
    {
      name: "Acme Corp.",
      logo: (
        <WaveformIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <CommandIcon
        />
      ),
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Utilisateurs",
      url: "/admin-game/dashboard/utilisateurs",
      icon: (
        <TerminalIcon
        />
      ),
      isActive: true,
      items: [
        {
          title: "Utilisateurs",
          url: "/admin-game/dashboard/utilisateurs",
        },
        {
          title: "Log",
          url: "#",
        },
      ],
    },
    {
      title: "Aventures",
      url: "/admin-game/dashboard/aventures",
      icon: (
        <BookOpenIcon
        />
      ),
      items: [
        {
          title: "Aventures",
          url: "/admin-game/dashboard/aventures",
        },
        {
          title: "Créer une aventure",
          url: "/admin-game/dashboard/aventures/create",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: (
        <GearIcon
        />
      ),
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: (
        <CropIcon
        />
      ),
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: (
        <ChartPieIcon
        />
      ),
    },
    {
      name: "Travel",
      url: "#",
      icon: (
        <MapTrifoldIcon
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar> ) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
