# Amos Kitchen - UX Redesign Roadmap

> **Document Version:** 1.0
> **Created:** January 29, 2026
> **Status:** Phase 4 Complete (All Phases Done)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Vision: Friday-First Design](#vision-friday-first-design)
4. [Roadmap Phases](#roadmap-phases)
5. [Detailed Implementation Plans](#detailed-implementation-plans)
6. [Success Metrics](#success-metrics)
7. [Progress Tracking](#progress-tracking)

---

## Executive Summary

### The Core Insight

**Amos Kitchen's business model is Friday-centric**, but the current UX doesn't reflect this. The application delivers food only on Fridays, yet this unique constraint is buried in form validation rather than being the organizing principle of the entire user experience.

### Goals

1. **Make Friday the hero** - Every interaction should orient around "prepare for Friday"
2. **Simplify workflows** - Reduce clicks and cognitive load for common tasks
3. **Enable customer-centric flows** - Quick ordering from customer profiles
4. **Unify kitchen operations** - Single command center for Friday preparation
5. **Surface actions** - Quick actions always visible, not hidden in menus

### Expected Outcomes

- Reduced time to create orders (target: 50% faster)
- Improved kitchen preparation efficiency
- Better customer preference visibility
- Clearer order status tracking
- More intuitive navigation

---

## Current State Analysis

### Application Overview

| Aspect | Current State |
|--------|---------------|
| **Framework** | Next.js 14+ with App Router |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Auth with cookie-based sessions |
| **Styling** | Tailwind CSS + Shadcn/ui |
| **Language** | Hebrew (RTL) |
| **State Management** | Custom hooks + React state |

### Current Navigation Structure

```
├── לוח בקרה (Dashboard)        /dashboard
├── מטבח - יום שישי (Kitchen)   /kitchen      [Orange highlight]
├── הזמנות (Orders)             /orders
├── לקוחות (Customers)          /customers
├── מנות (Dishes)               /dishes
├── דוחות (Reports)             /reports
└── ניתוחים (Analytics)         /reports/analytics
```

### Identified Pain Points

#### Critical (P0)
- [x] Navigation overload (7 items without clear grouping) ✅ Phase 1
- [x] Disconnected Kitchen ↔ Orders flows ✅ Phase 3 - Kanban board
- [x] Friday model not emphasized in UX ✅ Phase 1
- [x] No customer-centric ordering ✅ Phase 2

#### High Priority (P1)
- [x] Long, complex order form (640 lines) ✅ Phase 2 - Replaced with wizard
- [x] Hidden quick actions (require dropdown click) ✅ Phase 1
- [x] No order status visualization ✅ Phase 3 - Kanban board with drag-and-drop
- [x] Duplicate navigation (Reports vs Analytics) ✅ Phase 1

#### Medium Priority (P2)
- [x] No "repeat order" functionality ✅ Phase 2
- [x] Dashboard tabs hide important data ✅ Phase 4 - Single scroll view
- [x] Missing order history on customer profiles ✅ Phase 2

#### Low Priority (P3)
- [x] Empty error handling components ✅ Phase 4 - Error boundaries with retry
- [x] Incomplete mobile navigation ✅ Phase 4 - Bottom tab bar
- [x] Missing confirmation dialogs ✅ Phase 4 - Reusable confirm dialog

---

## Vision: Friday-First Design

### New Navigation Structure

```
┌─────────────────────────────────────────────────────────┐
│  AMOS KITCHEN                         [User Menu]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🍳 יום שישי הקרוב                    ← Hero Section    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  31 בינואר 2026                                 │   │
│  │  24 הזמנות | 156 מנות | ₪4,200                  │   │
│  │  [+ הזמנה חדשה]  [מעבר למטבח]                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📋 ניהול                                               │
│  ├── הזמנות                                            │
│  ├── לקוחות                                            │
│  └── מנות                                              │
│                                                         │
│  📊 תובנות                                              │
│  ├── דשבורד                                            │
│  └── דוחות                                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### New Order Creation Flow (Wizard)

```
┌─────────────────────────────────────────────────────────┐
│  Step 1/3: בחירת לקוח                                   │
│  ─────────────────────────────────────────────────────  │
│  ● ○ ○                                                  │
│                                                         │
│  🔍 [חיפוש לקוח...                              ]      │
│                                                         │
│  📍 לקוחות אחרונים                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ דוד כהן │ │ שרה לוי │ │ יוסי אב │                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
│                                                         │
│  [+ לקוח חדש]                                          │
│                                                         │
│                              [הבא →]                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Step 2/3: בחירת מנות                                   │
│  ─────────────────────────────────────────────────────  │
│  ○ ● ○                                                  │
│                                                         │
│  📅 משלוח: יום שישי, 31 בינואר 2026                    │
│                                                         │
│  ⚠️ שים לב: דוד כהן - אלרגיה לאגוזים                   │
│                                                         │
│  🍝 מנות עיקריות                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ פסטה אלפרדו    ₪45    [-] 2 [+]    ₪90         │   │
│  │ סטייק          ₪85    [-] 1 [+]    ₪85         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [+ הוסף מנה]                                          │
│                                                         │
│  סה״כ: ₪175                                            │
│                                                         │
│  [← חזרה]                    [הבא →]                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Step 3/3: אישור הזמנה                                  │
│  ─────────────────────────────────────────────────────  │
│  ○ ○ ●                                                  │
│                                                         │
│  👤 לקוח: דוד כהן                                       │
│     📞 050-1234567                                      │
│     📍 רחוב הרצל 15, תל אביב                            │
│                                                         │
│  📅 משלוח: יום שישי, 31 בינואר 2026                    │
│                                                         │
│  🍽️ מנות:                                              │
│     • פסטה אלפרדו × 2 .............. ₪90              │
│     • סטייק × 1 ................... ₪85              │
│                                                         │
│  📝 הערות: [                                    ]      │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  סה״כ לתשלום: ₪175                                     │
│                                                         │
│  [← חזרה]              [✓ צור הזמנה]                   │
└─────────────────────────────────────────────────────────┘
```

### Friday Command Center (Kitchen)

```
┌─────────────────────────────────────────────────────────┐
│  🍳 מטבח - יום שישי 31 בינואר 2026                      │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📊 סיכום מהיר                                          │
│  ┌────────────┬────────────┬────────────┬────────────┐ │
│  │  24        │  156       │  ₪4,200    │  18:00     │ │
│  │  הזמנות    │  מנות      │  הכנסות    │  סגירה    │ │
│  └────────────┴────────────┴────────────┴────────────┘ │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  🍽️ רשימת מנות להכנה                   [הדפס רשימה]    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ מנה                              כמות    מוכן  │   │
│  │ ─────────────────────────────────────────────── │   │
│  │ פסטה אלפרדו                      32      [  ]  │   │
│  │ סטייק                            18      [  ]  │   │
│  │ סלט ירקות                        45      [  ]  │   │
│  │ עוף בתנור                        22      [  ]  │   │
│  │ מרק עדשים                        15      [  ]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📦 הזמנות לפי סטטוס                                    │
│                                                         │
│  [ממתין (8)]   [בהכנה (10)]   [מוכן (4)]   [נמסר (2)] │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Kanban Board - Drag & Drop                      │   │
│  │                                                 │   │
│  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │   │
│  │ │#124 │ │#125 │ │#120 │ │#118 │               │   │
│  │ │דוד  │ │שרה  │ │יוסי │ │רחל  │               │   │
│  │ │3מנ  │ │2מנ  │ │5מנ  │ │2מנ  │               │   │
│  │ └─────┘ └─────┘ └─────┘ └─────┘               │   │
│  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │   │
│  │ │#126 │ │#127 │ │#121 │ │#119 │               │   │
│  │ └─────┘ └─────┘ └─────┘ └─────┘               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Roadmap Phases

### Overview

```
Phase 1          Phase 2           Phase 3          Phase 4
[Foundation]  →  [Order Flow]  →  [Kitchen]    →  [Polish]
  2 weeks          2 weeks          2 weeks         1 week
    │                │                │               │
    ▼                ▼                ▼               ▼
Quick Actions    Order Wizard     Command Center   Analytics
Nav Restructure  Customer Flow    Kanban Board     Mobile
Friday Hero      Repeat Order     Dish Aggregation Testing
```

---

### Phase 1: Foundation (Week 1-2)

**Goal:** Restructure navigation and surface Friday-first design

#### Tasks

- [x] **1.1** Create Friday Hero component ✅
  - Display next Friday date
  - Show order count, dish count, revenue
  - Quick action buttons
  - File: `src/components/friday/friday-hero.tsx`

- [x] **1.2** Restructure sidebar navigation ✅
  - Group items into sections (Management, Insights)
  - Add Friday Hero to top of sidebar
  - File: `src/components/layout/sidebar.tsx`

- [x] **1.3** Add persistent quick actions ✅
  - Visible on header (desktop)
  - Floating action button (mobile)
  - Actions: New Order, New Customer, New Dish
  - File: `src/components/layout/quick-actions.tsx`

- [x] **1.4** Merge Reports and Analytics ✅
  - Single "Reports" page with tabs
  - Remove duplicate navigation item
  - File: `src/app/(dashboard)/reports/page.tsx`

- [x] **1.5** Create Friday API endpoint ✅
  - Return aggregated Friday data
  - File: `src/app/api/friday/route.ts`

- [x] **1.6** Set up analytics infrastructure ✅
  - Install Vercel Analytics
  - Create analytics utility with event types
  - Add base page view tracking
  - File: `src/lib/analytics.ts`

#### Deliverables
- [x] Friday Hero visible in sidebar ✅
- [x] Grouped navigation ✅
- [x] Quick actions always visible ✅
- [x] Single reports section ✅
- [x] Analytics tracking operational ✅

---

### Phase 2: Order Flow Optimization (Week 3-4) ✅ COMPLETE

**Goal:** Simplify order creation with wizard and customer-centric flows

#### Tasks

- [x] **2.1** Create Order Wizard component ✅
  - Step 1: Customer selection
  - Step 2: Dish selection
  - Step 3: Confirmation
  - Files created:
    - `src/contexts/order-wizard-context.tsx` - State management with Context + Reducer
    - `src/components/orders/order-wizard/order-wizard.tsx` - Main wizard shell
    - `src/components/orders/order-wizard/steps/customer-selection-step.tsx`
    - `src/components/orders/order-wizard/steps/dish-selection-step.tsx`
    - `src/components/orders/order-wizard/steps/confirmation-step.tsx`

- [x] **2.2** Add customer search with recent customers ✅
  - Quick pick from most frequent customers (by order count in last 30 days)
  - Search by name/phone/email
  - Files created:
    - `src/lib/hooks/use-recent-customers.ts`
    - `src/app/api/customers/recent/route.ts`

- [x] **2.3** Add customer-centric ordering ✅
  - "New Order" button on customer profile (header + empty state)
  - Pre-fills customer and skips to Step 2
  - File: `src/app/(dashboard)/customers/[id]/page.tsx`

- [x] **2.4** Implement repeat order functionality ✅
  - "Repeat Order" button on order detail
  - Duplicates order with next Friday date
  - Skips unavailable dishes with warning
  - Files:
    - `src/app/(dashboard)/orders/[id]/page.tsx`
    - `src/lib/hooks/use-duplicate-order.ts`

- [x] **2.5** Add order history to customer profile ✅
  - Already existed in customer profile page
  - Orders displayed in table with view buttons

- [x] **2.6** Update new order page to use wizard ✅
  - Replaced OrderForm with OrderWizard
  - Supports `?customer=` and `?duplicate=` URL params
  - File: `src/app/(dashboard)/orders/new/page.tsx`

#### Deliverables
- [x] 3-step order wizard working ✅
- [x] Customer quick-pick from recent ✅
- [x] Order from customer profile ✅
- [x] Repeat order functionality ✅
- [x] Order history on customer page ✅

---

### Phase 3: Kitchen Command Center (Week 5-6) ✅ COMPLETE

**Goal:** Create unified Friday preparation view with Kanban board

#### Tasks

- [x] **3.1** Create Kitchen Dashboard layout ✅
  - Summary stats row
  - Dish aggregation section
  - Order Kanban section
  - Files created:
    - `src/components/kitchen/kitchen-dashboard-v2.tsx` - New dashboard with Kanban
    - `src/components/kitchen/kitchen-summary-stats.tsx` - Stats cards + print buttons
    - `src/lib/types/kitchen.ts` - Kitchen-specific types

- [x] **3.2** Build dish aggregation component ✅
  - List all dishes with total quantities
  - Checkbox for "prepared" status (per order item)
  - Print-friendly layout
  - Files:
    - `src/components/kitchen/batch-cooking-view.tsx` - Dishes by category
    - `src/components/kitchen/print-views/dish-checklist-print.tsx`

- [x] **3.3** Create Kanban board for orders ✅
  - Columns: NEW, CONFIRMED, PREPARING, READY (4 active columns)
  - Free drag-and-drop between any status
  - Order cards with customer info + preparation checklist
  - Validation: PREPARING → READY requires all dishes checked
  - Files:
    - `src/components/kitchen/order-kanban/kanban-board.tsx`
    - `src/components/kitchen/order-kanban/kanban-column.tsx`
    - `src/components/kitchen/order-kanban/order-card.tsx`
  - Dependencies: `@dnd-kit/core`, `@dnd-kit/sortable`

- [x] **3.4** Add real-time updates ✅
  - Firebase onSnapshot listeners (replaced 30s polling)
  - Optimistic UI updates with rollback on error
  - Connection status indicator
  - localStorage persistence for preparation progress
  - File: `src/lib/hooks/use-kitchen-orders.ts`

- [x] **3.5** Create print views ✅
  - Dish preparation checklist (by category)
  - Delivery route list (READY orders sorted by address)
  - Individual order receipts (with critical preference warnings)
  - Files:
    - `src/components/kitchen/print-views/dish-checklist-print.tsx`
    - `src/components/kitchen/print-views/delivery-route-print.tsx`
    - `src/components/kitchen/print-views/order-receipts-print.tsx`
  - Dependencies: `react-to-print`

- [x] **3.6** Add preference alerts in kitchen ✅
  - Critical preferences alert card on dashboard
  - Warning badges on order cards (pulsing animation)
  - CriticalPreferenceAlert component reused from customers
  - All preferences displayed in order card details

#### Deliverables
- [x] Kitchen dashboard with stats ✅
- [x] Dish checklist with quantities ✅
- [x] Kanban board with drag-and-drop ✅
- [x] Print functionality ✅
- [x] Real-time order updates ✅

---

### Phase 4: Polish & Analytics (Week 7) ✅ COMPLETE

**Goal:** Refine UX, add analytics, improve mobile experience

#### Tasks

- [x] **4.1** Add order status timeline ✅
  - Visual progress indicator (horizontal on desktop, vertical on mobile)
  - Timestamp for each status change
  - Integrated with order history from API
  - File: `src/components/orders/order-timeline.tsx`

- [x] **4.2** Improve dashboard actionability ✅
  - Removed tabs, single scroll view
  - "Needs Attention" section at top with color-coded alerts
  - Friday summary card prominent with progress bar
  - Files:
    - `src/components/dashboard/dashboard-content.tsx` (refactored)
    - `src/components/dashboard/needs-attention-section.tsx`
    - `src/components/dashboard/friday-summary-card.tsx`

- [x] **4.3** Enhance mobile navigation ✅
  - Bottom tab bar with 4 key actions (Kitchen, New Order, Orders, Customers)
  - Special FAB-style "New Order" button
  - iOS safe area support
  - Hidden on desktop (lg:hidden)
  - File: `src/components/layout/mobile-nav.tsx`

- [x] **4.4** Add confirmation dialogs ✅
  - Reusable ConfirmDialog with variants (danger, warning, info)
  - Async operation support with loading states
  - Integrated in order detail page for delete action
  - File: `src/components/shared/confirm-dialog.tsx`

- [x] **4.5** Implement error boundaries ✅
  - Root-level error boundary with retry functionality
  - Dashboard-specific error boundary
  - Analytics tracking for errors
  - Files:
    - `src/app/error.tsx`
    - `src/app/(dashboard)/error.tsx`

- [x] **4.6** Add loading skeletons ✅
  - Already existed in codebase
  - Used consistently across pages

- [x] **4.7** Performance optimization ✅
  - React Query for data caching with auto-refresh
  - Migrated hooks: useDashboardData, useFridayData, useRecentCustomers, useOrders
  - Automatic cache invalidation on mutations
  - Query key patterns for efficient cache management
  - Files:
    - `src/lib/providers/query-provider.tsx`
    - `src/lib/hooks/use-dashboard-data.ts`
    - `src/lib/hooks/use-friday-data.ts`
    - `src/lib/hooks/use-recent-customers.ts`
    - `src/lib/hooks/use-orders.ts`

#### Deliverables
- [x] Order timeline on detail page ✅
- [x] Improved dashboard layout ✅
- [x] Mobile-optimized navigation ✅
- [x] Error handling complete ✅
- [x] Performance improvements ✅

---

## Detailed Implementation Plans

### Friday Hero Component

```tsx
// src/components/friday/friday-hero.tsx
interface FridayHeroProps {
  date: Date
  orderCount: number
  dishCount: number
  revenue: number
  status: 'open' | 'closed' | 'cutoff-soon'
}

export function FridayHero({ date, orderCount, dishCount, revenue, status }: FridayHeroProps) {
  return (
    <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-orange-600" />
          יום שישי הקרוב
        </CardTitle>
        <CardDescription>{formatDate(date)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{orderCount}</div>
            <div className="text-sm text-muted-foreground">הזמנות</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{dishCount}</div>
            <div className="text-sm text-muted-foreground">מנות</div>
          </div>
          <div>
            <div className="text-2xl font-bold">₪{revenue}</div>
            <div className="text-sm text-muted-foreground">הכנסות</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href="/orders/new">
            <Plus className="h-4 w-4 ml-2" />
            הזמנה חדשה
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/kitchen">
            <ChefHat className="h-4 w-4 ml-2" />
            מטבח
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### Order Wizard Context

```tsx
// src/components/orders/order-wizard/wizard-context.tsx
interface WizardState {
  step: 1 | 2 | 3
  customer: Customer | null
  deliveryDate: Date
  items: OrderItem[]
  notes: string
}

interface WizardContextValue {
  state: WizardState
  setCustomer: (customer: Customer) => void
  setDeliveryDate: (date: Date) => void
  addItem: (item: OrderItem) => void
  removeItem: (index: number) => void
  updateItem: (index: number, item: Partial<OrderItem>) => void
  setNotes: (notes: string) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
  total: number
}
```

### Kanban Board Structure

```tsx
// src/components/kitchen/order-kanban/kanban-board.tsx
const columns: KanbanColumn[] = [
  { id: 'NEW', title: 'ממתין', color: 'blue' },
  { id: 'CONFIRMED', title: 'אושר', color: 'yellow' },
  { id: 'PREPARING', title: 'בהכנה', color: 'purple' },
  { id: 'READY', title: 'מוכן', color: 'green' },
  { id: 'DELIVERED', title: 'נמסר', color: 'gray' },
]

// Using @dnd-kit for drag and drop
import { DndContext, DragOverlay } from '@dnd-kit/core'
```

---

## Success Metrics

### Quantitative

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to create order | ~3 min | ~1.5 min | User testing |
| Clicks to create order | ~15 | ~8 | Analytics |
| Kitchen page usage | Low | High | Page views |
| Order errors | Unknown | -50% | Error logs |
| Mobile usage | Unknown | +30% | Analytics |

### Qualitative

- [ ] Users understand Friday-first model immediately
- [ ] Kitchen staff can prepare without switching pages
- [ ] Repeat customers can be served faster
- [ ] Customer preferences are always visible

---

## Event Tracking & Analytics

### Analytics Provider

Recommended: **Vercel Analytics** (already integrated with Next.js) or **Mixpanel** for detailed funnel analysis.

### Implementation

```typescript
// src/lib/analytics.ts
type EventName =
  // Order Flow Events
  | 'order_wizard_started'
  | 'order_wizard_step_completed'
  | 'order_wizard_abandoned'
  | 'order_created'
  | 'order_creation_failed'
  | 'repeat_order_clicked'
  | 'customer_order_clicked'
  // Kitchen Events
  | 'kitchen_page_viewed'
  | 'order_status_changed'
  | 'kanban_drag_drop'
  | 'dish_checklist_printed'
  // Navigation Events
  | 'friday_hero_clicked'
  | 'quick_action_used'
  | 'sidebar_nav_clicked'
  // Error Events
  | 'order_validation_error'
  | 'api_error'

interface EventProperties {
  // Common
  timestamp?: number
  userId?: string
  sessionId?: string
  // Order specific
  orderId?: string
  orderTotal?: number
  itemCount?: number
  customerId?: string
  // Wizard specific
  step?: number
  stepName?: string
  timeOnStep?: number
  // Kitchen specific
  fromStatus?: string
  toStatus?: string
  // Error specific
  errorCode?: string
  errorMessage?: string
}

export function trackEvent(name: EventName, properties?: EventProperties) {
  // Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('event', { name, ...properties })
  }

  // Console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${name}`, properties)
  }
}

// Timing utility for measuring durations
export function startTimer(label: string): () => number {
  const start = performance.now()
  return () => {
    const duration = Math.round(performance.now() - start)
    trackEvent('timing', { label, duration } as any)
    return duration
  }
}
```

### Event Catalog

#### Order Flow Events (Maps to: Time/Clicks to create order)

| Event | Trigger | Properties | Success Metric |
|-------|---------|------------|----------------|
| `order_wizard_started` | User opens new order page | `source: 'nav' \| 'quick_action' \| 'customer_profile' \| 'repeat'` | Clicks to create |
| `order_wizard_step_completed` | User advances to next step | `step, stepName, timeOnStep, itemCount` | Time to create |
| `order_wizard_abandoned` | User leaves without completing | `step, stepName, timeSpent` | Drop-off analysis |
| `order_created` | Order successfully submitted | `orderId, orderTotal, itemCount, totalTime` | Time to create |
| `order_creation_failed` | Order submission fails | `errorCode, errorMessage, step` | Order errors |
| `repeat_order_clicked` | User clicks repeat order | `originalOrderId, customerId` | Repeat customer speed |
| `customer_order_clicked` | Order from customer profile | `customerId` | Customer-centric flow |

#### Kitchen Events (Maps to: Kitchen page usage)

| Event | Trigger | Properties | Success Metric |
|-------|---------|------------|----------------|
| `kitchen_page_viewed` | Page load | `orderCount, fridayDate` | Kitchen page usage |
| `kitchen_session_duration` | Page unload | `duration, statusChanges, printCount` | Engagement |
| `order_status_changed` | Status update | `orderId, fromStatus, toStatus, method: 'kanban' \| 'dropdown'` | Workflow efficiency |
| `kanban_drag_drop` | Drag and drop action | `orderId, fromColumn, toColumn` | Feature adoption |
| `dish_checklist_printed` | Print button clicked | `dishCount, orderCount` | Print usage |
| `preference_alert_viewed` | Alert expanded | `customerId, preferenceTypes` | Preference visibility |

#### Navigation Events (Maps to: Feature adoption)

| Event | Trigger | Properties | Success Metric |
|-------|---------|------------|----------------|
| `friday_hero_clicked` | Click on Friday Hero | `action: 'new_order' \| 'kitchen' \| 'view_orders'` | Friday-first adoption |
| `quick_action_used` | Quick action button | `action: 'new_order' \| 'new_customer' \| 'new_dish'` | Quick action usage |
| `sidebar_nav_clicked` | Sidebar navigation | `destination, source` | Navigation patterns |

#### Error Events (Maps to: Order errors -50%)

| Event | Trigger | Properties | Success Metric |
|-------|---------|------------|----------------|
| `order_validation_error` | Form validation fails | `field, errorType, step` | Error reduction |
| `api_error` | API request fails | `endpoint, statusCode, errorMessage` | System reliability |
| `preference_warning_shown` | Allergy/medical alert | `customerId, preferenceType` | Safety tracking |

### Usage Examples

```typescript
// In order wizard
import { trackEvent, startTimer } from '@/lib/analytics'

// Start timing when wizard opens
const stopTimer = startTimer('order_creation')

// Track step completion
trackEvent('order_wizard_step_completed', {
  step: 1,
  stepName: 'customer_selection',
  timeOnStep: 15000, // ms
})

// Track order creation
trackEvent('order_created', {
  orderId: order.id,
  orderTotal: order.totalAmount,
  itemCount: order.items.length,
  totalTime: stopTimer(),
})

// In kitchen Kanban
trackEvent('order_status_changed', {
  orderId: order.id,
  fromStatus: 'PREPARING',
  toStatus: 'READY',
  method: 'kanban',
})
```

### Dashboard Metrics

Create a simple analytics dashboard (or use Vercel Analytics):

| Metric | Query | Target |
|--------|-------|--------|
| **Avg Order Creation Time** | `AVG(order_created.totalTime)` | < 90 seconds |
| **Wizard Completion Rate** | `order_created / order_wizard_started` | > 85% |
| **Kitchen Page Daily Views** | `COUNT(kitchen_page_viewed) per day` | > 10 |
| **Kanban Adoption** | `kanban_drag_drop / order_status_changed` | > 70% |
| **Order Error Rate** | `order_creation_failed / order_wizard_started` | < 5% |
| **Quick Action Usage** | `COUNT(quick_action_used) per day` | Growing |
| **Repeat Order Rate** | `repeat_order_clicked / order_created` | > 20% |

### Implementation Phase

Add analytics implementation to **Phase 1** tasks:

```markdown
- [ ] **1.6** Set up analytics infrastructure
  - Install Vercel Analytics or Mixpanel
  - Create analytics utility (`src/lib/analytics.ts`)
  - Add base page view tracking
  - File: `src/lib/analytics.ts`
```

---

## Progress Tracking

### Phase 1: Foundation ✅ COMPLETE
| Task | Status | Assignee | Due Date | Notes |
|------|--------|----------|----------|-------|
| 1.1 Friday Hero | 🟢 Complete | Claude | 2026-01-29 | `src/components/friday/friday-hero.tsx` |
| 1.2 Sidebar restructure | 🟢 Complete | Claude | 2026-01-29 | Added FridayHero + grouped nav sections |
| 1.3 Quick actions | 🟢 Complete | Claude | 2026-01-29 | `src/components/layout/quick-actions.tsx` |
| 1.4 Merge reports | 🟢 Complete | Claude | 2026-01-29 | Already unified in reports page |
| 1.5 Friday API | 🟢 Complete | Claude | 2026-01-29 | `src/app/api/friday/route.ts` |
| 1.6 Analytics setup | 🟢 Complete | Claude | 2026-01-29 | Vercel Analytics + `src/lib/analytics.ts` |

### Phase 2: Order Flow ✅ COMPLETE
| Task | Status | Assignee | Due Date | Notes |
|------|--------|----------|----------|-------|
| 2.1 Order wizard | 🟢 Complete | Claude | 2026-01-29 | Context + Reducer pattern, 3 step components |
| 2.2 Customer search | 🟢 Complete | Claude | 2026-01-29 | Recent customers API + hook |
| 2.3 Customer-centric order | 🟢 Complete | Claude | 2026-01-29 | New Order button on profile |
| 2.4 Repeat order | 🟢 Complete | Claude | 2026-01-29 | Duplicate with unavailable dish handling |
| 2.5 Order history | 🟢 Complete | Claude | 2026-01-29 | Already existed in customer profile |
| 2.6 Update new order page | 🟢 Complete | Claude | 2026-01-29 | Replaced form with wizard |

### Phase 3: Kitchen ✅ COMPLETE
| Task | Status | Assignee | Due Date | Notes |
|------|--------|----------|----------|-------|
| 3.1 Kitchen dashboard | 🟢 Complete | Claude | 2026-01-29 | `kitchen-dashboard-v2.tsx` + `kitchen-summary-stats.tsx` |
| 3.2 Dish aggregation | 🟢 Complete | Claude | 2026-01-29 | `batch-cooking-view.tsx` + print view |
| 3.3 Kanban board | 🟢 Complete | Claude | 2026-01-29 | @dnd-kit with free movement between columns |
| 3.4 Real-time updates | 🟢 Complete | Claude | 2026-01-29 | Firebase onSnapshot + localStorage persistence |
| 3.5 Print views | 🟢 Complete | Claude | 2026-01-29 | Dish checklist, delivery route, receipts |
| 3.6 Preference alerts | 🟢 Complete | Claude | 2026-01-29 | Critical alerts card + pulsing badges |

### Phase 4: Polish ✅ COMPLETE
| Task | Status | Assignee | Due Date | Notes |
|------|--------|----------|----------|-------|
| 4.1 Order timeline | 🟢 Complete | Claude | 2026-01-29 | `src/components/orders/order-timeline.tsx` |
| 4.2 Dashboard refactor | 🟢 Complete | Claude | 2026-01-29 | Single scroll, needs attention section, Friday summary card |
| 4.3 Mobile nav | 🟢 Complete | Claude | 2026-01-29 | Bottom tab bar with 4 items + FAB |
| 4.4 Confirm dialogs | 🟢 Complete | Claude | 2026-01-29 | Reusable with variants (danger/warning/info) |
| 4.5 Error boundaries | 🟢 Complete | Claude | 2026-01-29 | Root + dashboard-specific with retry |
| 4.6 Loading skeletons | 🟢 Complete | Claude | 2026-01-29 | Already existed, used consistently |
| 4.7 Performance | 🟢 Complete | Claude | 2026-01-29 | React Query migration for 4 key hooks |

---

## Status Legend

| Icon | Meaning |
|------|---------|
| ⬜ | Not Started |
| 🟡 | In Progress |
| 🟢 | Complete |
| 🔴 | Blocked |
| ⏸️ | On Hold |

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-29 | 1.0 | Initial roadmap created |
| 2026-01-29 | 1.1 | Added event tracking & analytics section, Task 1.6 |
| 2026-01-29 | 1.2 | **Phase 1 Complete** - Friday Hero, Sidebar restructure, Quick actions, Friday API, Analytics setup |
| 2026-01-29 | 1.2.1 | Code quality improvements - Added `src/lib/constants/friday.ts` for configurable cutoff times, type safety fixes, error handling with retry button |
| 2026-01-29 | 1.3 | **Phase 2 Complete** - Order Wizard (3-step flow), Recent customers API & hook, Customer-centric ordering, Repeat order functionality, Duplicate order handling with unavailable dish filtering |
| 2026-01-29 | 1.4 | **Phase 3 Complete** - Kitchen Command Center with Kanban drag-and-drop (@dnd-kit), real-time Firebase listeners (replaced polling), print views (react-to-print), summary stats, preparation progress with localStorage persistence, critical preference alerts. Code review fixes: relative positioning, print component visibility, type safety, ARIA labels |
| 2026-01-29 | 2.0 | **Phase 4 Complete (All Phases Done)** - Order timeline component (responsive horizontal/vertical), dashboard refactored to single scroll with NeedsAttentionSection and FridaySummaryCard, mobile navigation (bottom tab bar), confirmation dialogs (reusable with variants), error boundaries (root + dashboard), React Query migration (@tanstack/react-query) for useDashboardData, useFridayData, useRecentCustomers, useOrders with automatic cache invalidation |

---

## Technical Dependencies

### New Packages Required

| Package | Version | Purpose | Phase | Status |
|---------|---------|---------|-------|--------|
| `@dnd-kit/core` | ^6.x | Drag-and-drop foundation | Phase 3 | ✅ Installed |
| `@dnd-kit/sortable` | ^8.x | Sortable Kanban items | Phase 3 | ✅ Installed |
| `react-to-print` | ^3.x | Print views | Phase 3 | ✅ Installed |
| `@tanstack/react-query` | ^5.x | Data caching & sync | Phase 4 | ✅ Installed |
| `@tanstack/react-query-devtools` | ^5.x | Query debugging (dev) | Phase 4 | ✅ Installed |

### Installation Command
```bash
# Phase 3 (already installed)
npm install @dnd-kit/core @dnd-kit/sortable react-to-print

# Phase 4 (installed)
npm install @tanstack/react-query @tanstack/react-query-devtools
```

---

## Database Considerations

### Schema Changes

No breaking schema changes required. New fields to add:

| Collection | Field | Type | Purpose |
|------------|-------|------|---------|
| `orders` | `statusHistory` | `array` | Track status changes with timestamps |
| `dishes` | `prepOrder` | `number` | Kitchen preparation sequence |

### Migration Strategy

1. **Phase 1**: Add new fields with defaults (non-breaking)
2. **Phase 2-3**: Start populating new fields
3. **Phase 4**: Migrate historical data if needed

---

## Testing Strategy

### Unit Tests
- [ ] Friday Hero component rendering
- [ ] Order wizard state management
- [ ] Kanban column sorting logic
- [ ] Date utility functions (Friday calculations)

### Integration Tests
- [ ] Order wizard complete flow
- [ ] Drag-and-drop status updates
- [ ] Customer search with filters

### E2E Tests (Playwright/Cypress)
- [ ] Create order via wizard
- [ ] Kitchen board usage
- [ ] Mobile navigation

---

## Risk Mitigation

### Feature Flags

Implement feature flags for gradual rollout:

```typescript
// src/lib/feature-flags.ts
export const FEATURES = {
  ORDER_WIZARD: process.env.NEXT_PUBLIC_FF_ORDER_WIZARD === 'true',
  FRIDAY_HERO: process.env.NEXT_PUBLIC_FF_FRIDAY_HERO === 'true',
  KANBAN_KITCHEN: process.env.NEXT_PUBLIC_FF_KANBAN_KITCHEN === 'true',
}
```

### Rollback Plan

| Phase | Rollback Strategy |
|-------|-------------------|
| Phase 1 | Revert sidebar changes, feature flag Friday Hero off |
| Phase 2 | Keep old order form accessible via `/orders/new?legacy=true` |
| Phase 3 | Fall back to list view in kitchen |
| Phase 4 | Individual component reverts |

---

## Accessibility Checklist

- [x] Keyboard navigation for Kanban board ✅ Phase 3 - KeyboardSensor enabled
- [ ] Screen reader announcements for drag-and-drop
- [ ] Focus management in wizard steps
- [x] ARIA labels for status badges ✅ Phase 3 - aria-label on drag handles
- [ ] Color contrast compliance (WCAG 2.1 AA)
- [ ] RTL keyboard shortcuts (Shift+Tab direction)

---

## Configuration Requirements

### Environment Variables

```bash
# .env.local additions
NEXT_PUBLIC_FF_ORDER_WIZARD=false
NEXT_PUBLIC_FF_FRIDAY_HERO=false
NEXT_PUBLIC_FF_KANBAN_KITCHEN=false
```

### Cutoff Time Constants ✅ IMPLEMENTED

Cutoff times are now configurable via `src/lib/constants/friday.ts`:

```typescript
export const THURSDAY_CUTOFF_HOUR = 18      // 6 PM - Thursday order cutoff
export const FRIDAY_DELIVERY_CUTOFF_HOUR = 12 // 12 PM - Friday same-day cutoff
export const CUTOFF_WARNING_HOURS = 2       // Hours before cutoff to show warning
export const FRIDAY_DATA_REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
```

---

## Next Steps

1. **Review this roadmap** with stakeholders
2. **Prioritize** based on business needs
3. **Install dependencies** (see Technical Dependencies)
4. **Set up feature flags** for safe rollout
5. **Assign team members** to phases
6. **Set sprint deadlines**
7. **Begin Phase 1** implementation

---

*This document is a living roadmap. Update the progress tracking tables as work progresses.*
