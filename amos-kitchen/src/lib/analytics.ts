// src/lib/analytics.ts
// Analytics utility for tracking user events

export type EventName =
  // Navigation events
  | 'friday_hero_new_order'
  | 'friday_hero_kitchen'
  | 'quick_action_new_order'
  | 'quick_action_new_customer'
  | 'quick_action_new_dish'
  | 'sidebar_nav_clicked'
  // Order flow events (for Phase 2)
  | 'order_wizard_started'
  | 'order_wizard_step_completed'
  | 'order_wizard_abandoned'
  | 'order_created'
  // Kitchen events (for Phase 3)
  | 'kitchen_page_viewed'
  | 'order_status_changed'
  | 'kanban_drag_drop'
  // Error events (Phase 4)
  | 'error_boundary_triggered'
  // Dashboard events (Phase 4)
  | 'dashboard_alert_clicked'
  | 'mobile_nav_clicked'

export interface EventProperties {
  source?: string
  destination?: string
  step?: number
  orderId?: string
  totalAmount?: number
  itemCount?: number
  [key: string]: string | number | boolean | undefined
}

/**
 * Track a custom event
 * @param name - The event name
 * @param properties - Optional event properties
 */
export function trackEvent(name: EventName, properties?: EventProperties): void {
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${name}`, properties)
  }

  // Vercel Analytics (window.va is injected by @vercel/analytics)
  if (typeof window !== 'undefined' && (window as any).va) {
    ;(window as any).va('event', { name, ...properties })
  }
}

/**
 * Track a page view
 * @param url - The page URL
 */
export function trackPageView(url: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] Page View: ${url}`)
  }

  if (typeof window !== 'undefined' && (window as any).va) {
    ;(window as any).va('pageview', { url })
  }
}
