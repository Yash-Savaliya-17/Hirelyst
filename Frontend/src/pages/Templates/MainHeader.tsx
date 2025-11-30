import * as React from "react"
import { useEffect, useState } from "react"
import { Bot, Home, SquareTerminal } from "lucide-react"
import { SidebarInset, SidebarProvider, SidebarTrigger, } from "@/components/Common/shadcnui/sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, } from "@/components/Common/shadcnui/breadcrumb"
import { Separator } from "@/components/Common/shadcnui/separator"
import { Outlet, useLocation } from "react-router-dom"
import { SideNavbar } from "@/components/Navbar/SideNavbar.tsx";

// Enhanced data structure
const data = {
    user: {
        name: "John Doe",
        email: "john@example.com",
        avatar: "/avatars/user.jpg",
        role: "Premium User"
    },
    navMain: [
        {
            title: "Quiz",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            badge: "New",
            items: [
                {
                    title: "Create",
                    url: "/quiz/create",
                    description: "Create new quizzes"
                },
                {
                    title: "Attempted",
                    url: "/quiz/attempted",
                    description: "View your quiz attempts"
                },
                {
                    title: "Created",
                    url: "/quiz/created",
                    description: "Manage your quizzes"
                },
            ],
        },
        {
            title: "Interview",
            url: "#",
            icon: Bot,
            badge: "Beta",
            items: [
                {
                    title: "Take Interview",
                    url: "/interview/takeinterview",
                    description: "Start a new interview"
                },
                {
                    title: "History",
                    url: "#",
                    description: "View past interviews"
                },
            ],
        },
    ],
}

export function MainHeader() {
    const [breadcrumb, setBreadcrumb] = useState<string[]>();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState("");
    const [notifications, setNotifications] = useState(3); // Example notification count

    useEffect(() => {
        let t1 = location.pathname.split("/")[1];
        t1 = t1[0].toUpperCase() + t1.slice(1)
        let t2 = location.pathname.split("/")[2];
        if (t2 === 'takeinterview') {
            t2 = "Take Interview"
        } else {
            t2 = t2?.[0].toUpperCase() + t2?.slice(1)
        }
        setBreadcrumb([t1, t2])
    }, [location.pathname])

    return (
        <SidebarProvider>
            <SideNavbar />
            <SidebarInset className="border-[1.5px] m-2 rounded-lg border-gray-200 shadow-lg bg-white overflow-hidden">
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 transition-all duration-200">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="hover:bg-blue-50 rounded-lg p-2 transition-colors" />
                        <Separator orientation="vertical" className="h-6 bg-gray-200" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden font-manrope md:block">
                                    <BreadcrumbLink href="#" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                                        <Home className="h-4 w-4" />
                                        {breadcrumb?.[0]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block text-gray-400" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-semibold font-manrope text-gray-900">
                                        {breadcrumb?.[1]}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex-1 overflow-auto mt-8">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}