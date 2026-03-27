"use client"

import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CaretRightIcon } from "@phosphor-icons/react"
import { DEFAULT_DENY_MESSAGE } from "@/components/admin/GuardedButton"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
  groupLabel = "Menu",
}: {
  groupLabel?: string
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
      disabled?: boolean
      disabledReason?: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon}
                  <span>{item.title}</span>
                  <CaretRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      {subItem.disabled ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={cn(
                                "flex w-full cursor-not-allowed items-center rounded-md px-2 py-1.5 text-sm opacity-50"
                              )}
                            >
                              {subItem.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs text-pretty">
                            {subItem.disabledReason ?? DEFAULT_DENY_MESSAGE}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      )}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
