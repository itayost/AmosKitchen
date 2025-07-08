// app/layout.tsx
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

// Rubik supports Hebrew and Latin characters well
const rubik = Rubik({
    subsets: ["latin", "hebrew"],
    display: 'swap',
});

export const metadata: Metadata = {
    title: "מערכת הזמנות - עסק משפחתי",
    description: "מערכת ניהול הזמנות לעסק אוכל משפחתי",
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
                "min-h-screen bg-background font-sans antialiased"
            )}>
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </body>
        </html>
    );
}
