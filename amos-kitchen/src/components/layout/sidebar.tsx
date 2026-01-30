// components/layout/sidebar.tsx
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
    Home,
    ShoppingCart,
    Users,
    UtensilsCrossed,
    FileText,
    X,
    ChefHat,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FridayHero } from "@/components/friday/friday-hero";
import { trackEvent } from "@/lib/analytics";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    className?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

// Grouped navigation sections
const navigationSections: NavSection[] = [
    {
        title: "ניהול",
        items: [
            { name: "הזמנות", href: "/orders", icon: ShoppingCart },
            { name: "לקוחות", href: "/customers", icon: Users },
            { name: "מנות", href: "/dishes", icon: UtensilsCrossed },
        ],
    },
    {
        title: "תובנות",
        items: [
            { name: "לוח בקרה", href: "/dashboard", icon: Home },
            { name: "דוחות", href: "/reports", icon: FileText },
        ],
    },
];

// Kitchen link (special styling - always visible)
const kitchenLink: NavItem = {
    name: "מטבח - יום שישי",
    href: "/kitchen",
    icon: ChefHat,
    className: "bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold",
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    const handleNavClick = (destination: string) => {
        trackEvent('sidebar_nav_clicked', { destination });
        onClose();
    };

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            {/* Mobile header */}
            <div className="flex h-16 items-center justify-between px-6 lg:hidden">
                <h2 className="text-lg font-semibold">תפריט</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <ScrollArea className="flex-1 px-3">
                <div className="py-4 space-y-4">
                    {/* Friday Hero - Top of sidebar */}
                    <div className="px-1">
                        <FridayHero />
                    </div>

                    <Separator />

                    {/* Kitchen link - Prominent placement */}
                    <div className="px-1">
                        <Link href={kitchenLink.href}>
                            <Button
                                variant={pathname === kitchenLink.href ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start",
                                    pathname === kitchenLink.href && "bg-secondary",
                                    kitchenLink.className
                                )}
                                onClick={() => handleNavClick(kitchenLink.href)}
                            >
                                <kitchenLink.icon className="ml-3 h-5 w-5" />
                                {kitchenLink.name}
                            </Button>
                        </Link>
                    </div>

                    <Separator />

                    {/* Navigation sections */}
                    {navigationSections.map((section) => (
                        <div key={section.title} className="space-y-2">
                            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                                    return (
                                        <Link key={item.href} href={item.href}>
                                            <Button
                                                variant={isActive ? "secondary" : "ghost"}
                                                className={cn(
                                                    "w-full justify-start",
                                                    isActive && "bg-secondary",
                                                    item.className
                                                )}
                                                onClick={() => handleNavClick(item.href)}
                                            >
                                                <item.icon className="ml-3 h-5 w-5" />
                                                {item.name}
                                            </Button>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
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
