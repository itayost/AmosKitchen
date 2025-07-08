// components/layout/sidebar.tsx
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
    Home,
    ShoppingCart,
    Users,
    UtensilsCrossed,
    FileText,
    Package,
    BarChart3,
    X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navigation = [
    {
        name: "לוח בקרה",
        href: "/dashboard",
        icon: Home,
    },
    {
        name: "הזמנות",
        href: "/orders",
        icon: ShoppingCart,
    },
    {
        name: "לקוחות",
        href: "/customers",
        icon: Users,
    },
    {
        name: "מנות",
        href: "/dishes",
        icon: UtensilsCrossed,
    },
    {
        name: "מרכיבים",
        href: "/ingredients",
        icon: Package,
    },
    {
        name: "דוחות",
        href: "/reports",
        icon: FileText,
    },
    {
        name: "ניתוחים",
        href: "/reports/analytics",
        icon: BarChart3,
    },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between px-6 lg:hidden">
                <h2 className="text-lg font-semibold">תפריט</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>
            <ScrollArea className="flex-1 px-3">
                <div className="space-y-1 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.name} href={item.href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        isActive && "bg-secondary"
                                    )}
                                    onClick={() => onClose()}
                                >
                                    <item.icon className="ml-3 h-5 w-5" />
                                    {item.name}
                                </Button>
                            </Link>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );

    return (
        <>
            {/* Mobile Sidebar */}
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="right" className="w-64 p-0">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 lg:z-40">
                <div className="flex flex-col flex-1 bg-white border-l border-gray-200 pt-16">
                    <SidebarContent />
                </div>
            </aside>
        </>
    );
}
