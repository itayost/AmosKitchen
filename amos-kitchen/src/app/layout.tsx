// app/layout.tsx
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { QueryProvider } from "@/lib/providers/query-provider";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";

// Rubik supports Hebrew and Latin characters well
const rubik = Rubik({
    subsets: ["latin", "hebrew"],
    display: 'swap',
});

export const metadata: Metadata = {
    title: "המטבח של עמוס",
    description: "אוכל ביתי טעים - המטבח של עמוס",
    openGraph: {
        title: "המטבח של עמוס",
        description: "אוכל ביתי טעים - המטבח של עמוס",
        url: "https://www.chefamos.com",
        siteName: "המטבח של עמוס",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "המטבח של עמוס",
            },
        ],
        locale: "he_IL",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "המטבח של עמוס",
        description: "אוכל ביתי טעים - המטבח של עמוס",
        images: ["/og-image.png"],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="he" dir="rtl">
            <body className={cn(
                rubik.className,
                "min-h-screen bg-background font-sans antialiased overflow-x-hidden"
            )}>
                <AuthProvider>
                    <QueryProvider>
                        {children}
                        <Toaster />
                    </QueryProvider>
                </AuthProvider>
                <Analytics />
            </body>
        </html>
    );
}
