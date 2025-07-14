// prisma/seed.ts
import { PrismaClient, PreferenceType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'יוסי כהן',
      phone: '050-1234567',
      email: 'yossi@example.com',
      address: 'רחוב הרצל 123, תל אביב',
      notes: 'אלרגי לבוטנים',
      preferences: {
        create: [
          {
            type: PreferenceType.ALLERGY,
            value: 'בוטנים',
            notes: 'אלרגיה חמורה - להימנע לחלוטין'
          },
          {
            type: PreferenceType.DIETARY_RESTRICTION,
            value: 'צמחוני',
            notes: 'לא אוכל בשר או דגים'
          },
          {
            type: PreferenceType.PREFERENCE,
            value: 'ללא חריף',
            notes: 'רגיש לאוכל חריף'
          }
        ]
      }
    }
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'רחל לוי',
      phone: '052-9876543',
      email: 'rachel@example.com',
      address: 'שדרות בן גוריון 45, חיפה',
      preferences: {
        create: [
          {
            type: PreferenceType.DIETARY_RESTRICTION,
            value: 'כשר',
            notes: 'שומר כשרות'
          },
          {
            type: PreferenceType.MEDICAL,
            value: 'סוכרת',
            notes: 'להימנע ממאכלים עתירי סוכר'
          }
        ]
      }
    }
  })

  const customer3 = await prisma.customer.create({
    data: {
      name: 'דוד ישראלי',
      phone: '054-5555555',
      email: 'david@example.com',
      address: 'רחוב ויצמן 78, ירושלים',
      preferences: {
        create: [
          {
            type: PreferenceType.ALLERGY,
            value: 'גלוטן',
            notes: 'צליאק - ללא גלוטן בכלל'
          }
        ]
      }
    }
  })

  const customer4 = await prisma.customer.create({
    data: {
      name: 'שרה אברהם',
      phone: '053-7777777',
      email: 'sarah@example.com',
      address: 'רחוב רוטשילד 12, ראשון לציון',
      preferences: {
        create: [
          {
            type: PreferenceType.DIETARY_RESTRICTION,
            value: 'טבעוני',
            notes: 'ללא מוצרים מן החי כלל'
          },
          {
            type: PreferenceType.ALLERGY,
            value: 'סויה',
            notes: 'אלרגיה לסויה'
          }
        ]
      }
    }
  })

  // Create sample dishes
  const dish1 = await prisma.dish.create({
    data: {
      name: 'חומוס ביתי',
      description: 'חומוס טרי עם טחינה, שמן זית ופיתה',
      price: 35,
      category: 'מנות פתיחה',
      isAvailable: true
    }
  })

  const dish2 = await prisma.dish.create({
    data: {
      name: 'שניצל עוף',
      description: 'שניצל עוף פריך עם צ׳יפס',
      price: 55,
      category: 'מנות עיקריות',
      isAvailable: true
    }
  })

  const dish3 = await prisma.dish.create({
    data: {
      name: 'סלט ירקות',
      description: 'סלט ירקות טרי עם רוטב לימון',
      price: 28,
      category: 'סלטים',
      isAvailable: true
    }
  })

  const dish4 = await prisma.dish.create({
    data: {
      name: 'מרק עוף',
      description: 'מרק עוף ביתי עם ירקות',
      price: 32,
      category: 'מרקים',
      isAvailable: true
    }
  })

  const dish5 = await prisma.dish.create({
    data: {
      name: 'פלאפל',
      description: 'כדורי פלאפל טריים עם סלט וטחינה',
      price: 42,
      category: 'מנות עיקריות',
      isAvailable: true
    }
  })

  const dish6 = await prisma.dish.create({
    data: {
      name: 'מאפה ללא גלוטן',
      description: 'מאפה מיוחד ללא גלוטן',
      price: 38,
      category: 'מנות עיקריות',
      isAvailable: true
    }
  })

  console.log('Seed data created successfully!')

  // Display summary
  const totalCustomers = await prisma.customer.count()
  const totalDishes = await prisma.dish.count()
  const totalPreferences = await prisma.customerPreference.count()

  console.log(`
    Created:
    - ${totalCustomers} customers
    - ${totalDishes} dishes
    - ${totalPreferences} customer preferences
  `)

  // Show customers with their preferences
  const customersWithPreferences = await prisma.customer.findMany({
    include: {
      preferences: true
    }
  })

  console.log('\nCustomer Preferences:')
  customersWithPreferences.forEach(customer => {
    if (customer.preferences.length > 0) {
      console.log(`\n${customer.name}:`)
      customer.preferences.forEach(pref => {
        console.log(`  - ${pref.type}: ${pref.value} ${pref.notes ? `(${pref.notes})` : ''}`)
      })
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
