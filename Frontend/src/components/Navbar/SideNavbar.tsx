import * as React from "react"
import { BookAIcon, Bot, Frame, GalleryVerticalEnd, Map, PieChart, SquareTerminal, } from "lucide-react"

import { NavMain } from "@/components/Navbar/Navmain"
import { NavUser } from "@/components/Navbar/Navuser"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, } from "@/components/Common/shadcnui/sidebar"
import { Link } from "react-router-dom";

const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Quiz",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "Create",
                    url: "/quiz/create",
                },
                {
                    title: "Attempted",
                    url: "/quiz/attempted",
                },
                {
                    title: "Created",
                    url: "/quiz/created",
                },
            ],
        },
        {
            title: "Interview",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Take Interview",
                    url: "/interview/takeinterview",
                },
                {
                    title: "History",
                    url: "#",
                },
            ],
        },
        {
            title: "Resume",
            url: "#",
            badge: "Beta",
            icon: BookAIcon,
            items: [
                {
                    title: "Resume Score",
                    url: "/resume/resumescore",
                    description: "Start a new interview"
                },
            ]
        }
    ],
    projects: [
        {
            name: "Design Engineering",
            url: "#",
            icon: Frame,
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Travel",
            url: "#",
            icon: Map,
        },
    ],
}

export function SideNavbar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar
            collapsible="icon"
            variant="floating"
            {...props}
            className="font-manrope bg-white border-r "
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/">
                                <div
                                    className="flex aspect-square size-8 items-center justify-center rounded-lg  bg-blue-100">
                                    <GalleryVerticalEnd className="size-4" color={"#1D4ED8FF"} />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span
                                        className="font-semibold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 text-transparent bg-clip-text leading-[1.2]">
                                        {import.meta.env.VITE_SITE_NAME}
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter className="border-t border-gray-200 bg-gray-50/80">
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail className="bg-white" />
        </Sidebar>
    )
}
