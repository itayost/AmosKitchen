// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'יוסי כהן',
      phone: '050-1234567',
      email: 'yossi@example.com',
      address: 'רחוב הרצל 123, תל אביב',
      notes: 'אלרגי לבוטנים'
    }
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'רחל לוי',
      phone: '052-9876543',
      email: 'rachel@example.com',
      address: 'שדרות בן גוריון 45, חיפה'
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

  console.log('Seed data created successfully!')
  console.log({ customer1, customer2, dish1, dish2, dish3, dish4 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
