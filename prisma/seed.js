const { PrismaClient } = require("@prisma/client");
const books = require("../data/books.json");

const prisma = new PrismaClient();

async function main() {
  const existingCount = await prisma.book.count();
  if (existingCount > 0) {
    console.log("Database sudah berisi data. Seed dilewati agar data tidak terduplikasi.");
    return;
  }

  if (books.length > 0) {
    await prisma.book.createMany({
      data: books.map(({ judul, penulis, tahun, status }) => ({
        judul,
        penulis,
        tahun,
        status,
      })),
    });
  }

  console.log(`${books.length} buku berhasil dimasukkan.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
