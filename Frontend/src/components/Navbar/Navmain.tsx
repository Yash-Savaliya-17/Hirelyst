import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/Common/shadcnui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/Common/shadcnui/sidebar"

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
}) {
    const location = useLocation()

    const isSubItemActive = (url: string) => {
        const targetSegment = "create";
        const pathnameSegments = location.pathname.split('/').filter(Boolean);
        // console.log("pathnameSegments", pathnameSegments);
        return (
            location.pathname === url ||
            (pathnameSegments.includes(targetSegment) && url.endsWith(targetSegment))
        );
    };

    const isMainItemActive = (item: typeof items[0]) => {
        return item.items?.some(subItem => isSubItemActive(subItem.url))
    }

    return (
        <SidebarGroup>
            <img src="" alt="" />
            <SidebarGroupLabel className="text-gray-500 text-sm">Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const active = isMainItemActive(item)

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={active}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        className="hover:bg-blue-50 text-gray-700 hover:text-blue-600"
                                    >
                                        {item.icon && (
                                            <item.icon
                                                className="text-gray-500 group-hover:text-blue-500"
                                            />
                                        )}
                                        <span className="font-semibold">{item.title}</span>
                                        <ChevronRight
                                            className="ml-auto text-gray-400 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                                        />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => {
                                            const subActive = isSubItemActive(subItem.url)

                                            return (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        className={`hover:bg-blue-50 ${subActive
                                                            ? "bg-blue-50 text-blue-600 font-medium"
                                                            : "text-gray-600 hover:text-blue-600"
                                                            }`}
                                                    >
                                                        <Link to={subItem.url}>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            )
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    )
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}