// src/app/page.tsx
export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">ברוכים הבאים למטבח של עמוס</h1>
            <p className="text-xl mb-8">מערכת הזמנות אוכל ביתי</p>
            <a
                href="/login"
                className="rounded-lg bg-orange-600 px-6 py-3 text-white font-semibold hover:bg-orange-700 transition-colors"
            >
                כניסה למערכת
            </a>
        </main>
    )
}
