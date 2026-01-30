'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, Plus, ShoppingCart, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const navItems = [
  {
    name: 'מטבח',
    href: '/kitchen',
    icon: ChefHat,
  },
  {
    name: 'הזמנה חדשה',
    href: '/orders/new',
    icon: Plus,
  },
  {
    name: 'הזמנות',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    name: 'לקוחות',
    href: '/customers',
    icon: Users,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  const handleNavClick = (href: string) => {
    trackEvent('mobile_nav_clicked', { destination: href })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      {/* Safe area padding for iOS */}
      <div className="pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== '/orders/new' && pathname?.startsWith(item.href))
            const isNewOrder = item.href === '/orders/new'

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors',
                  isActive
                    ? 'text-orange-600'
                    : 'text-gray-500 hover:text-gray-900',
                  isNewOrder && 'relative'
                )}
              >
                {isNewOrder ? (
                  // Special styling for "New Order" button
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-600 text-white -mt-4 shadow-lg">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1 font-medium">{item.name}</span>
                  </div>
                ) : (
                  <>
                    <Icon className={cn(
                      'h-5 w-5',
                      isActive && 'stroke-[2.5]'
                    )} />
                    <span className={cn(
                      'text-xs mt-1',
                      isActive && 'font-medium'
                    )}>
                      {item.name}
                    </span>
                    {isActive && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-600 rounded-full" />
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
