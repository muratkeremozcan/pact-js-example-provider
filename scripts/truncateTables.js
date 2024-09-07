// Truncate is a SQL command used to quickly delete all rows from a table,
// but without removing the table structure itself.
// It's faster than DELETE because it doesn't log individual row deletions.
// It's useful for resetting tables without having to drop and recreate them.

// truncating the tables ensures that all data from the table is removed before the tests run.
// This avoids leftover data from previous test runs.
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function truncateTables() {
  await prisma.$executeRaw`DELETE FROM "Movie"` // Clears the table by deleting all rows
  await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='Movie'` // Reset auto-increment if needed
  console.log('Tables truncated')
  await prisma.$disconnect()
}

truncateTables()
