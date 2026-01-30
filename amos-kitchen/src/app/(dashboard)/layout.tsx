// app/(dashboard)/layout.tsx
"use client";

import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (!loading && !user && !isRedirecting) {
            setIsRedirecting(true);
            // Clear the stale auth cookie before redirecting
            document.cookie = "firebase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/login";
        }
    }, [user, loading, isRedirecting]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        // Show loading while redirecting to login
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                user={user}
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            />
            <div className="flex">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
                <main className="flex-1 lg:pr-64">
                    {/* Bottom padding on mobile for fixed nav bar */}
                    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
                        {children}
                    </div>
                </main>
            </div>
            {/* Mobile bottom navigation - hidden on desktop */}
            <MobileNav />
        </div>
    );
}
