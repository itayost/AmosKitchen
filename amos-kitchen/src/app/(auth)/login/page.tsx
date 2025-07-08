// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, AlertCircle, ChefHat } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClientComponentClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                throw signInError
            }

            // Refresh the page to update the auth state
            router.refresh()
            // Redirect to dashboard
            router.push('/dashboard')
        } catch (error: any) {
            console.error('Login error:', error)

            // תרגום הודעות שגיאה נפוצות
            if (error.message?.includes('Invalid login credentials')) {
                setError('אימייל או סיסמה שגויים')
            } else if (error.message?.includes('Email not confirmed')) {
                setError('יש לאמת את כתובת האימייל לפני ההתחברות')
            } else if (error.message?.includes('Network')) {
                setError('בעיית חיבור לאינטרנט. אנא נסה שוב')
            } else {
                setError('אירעה שגיאה בהתחברות. אנא נסה שוב')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <ChefHat className="w-12 h-12 text-orange-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">מערכת הזמנות</h1>
                    <p className="text-gray-600 mt-2">אוכל ביתי בכל יום שישי</p>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader className="space-y-1 pb-8">
                        <CardTitle className="text-2xl text-center">כניסה למערכת</CardTitle>
                        <CardDescription className="text-center">
                            הזן את פרטי ההתחברות שלך
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-right">
                                    כתובת אימייל
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        required
                                        className="pl-10 text-left"
                                        dir="ltr"
                                    />
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-right">
                                    סיסמה
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        required
                                        className="pl-10"
                                    />
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isLoading || !email || !password}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                        מתחבר...
                                    </>
                                ) : (
                                    'כניסה'
                                )}
                            </Button>
                        </form>

                        {/* Additional Links */}
                        <div className="mt-6 text-center text-sm">
                            <a
                                href="#"
                                className="text-primary hover:underline"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setError('אנא צור קשר עם מנהל המערכת לאיפוס סיסמה')
                                }}
                            >
                                שכחת סיסמה?
                            </a>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-gray-600 mt-8">
                    מערכת ניהול הזמנות © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}
