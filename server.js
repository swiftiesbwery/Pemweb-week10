require("dotenv").config();

const express = require("express");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const STATUS = ["Belum dibaca", "Sedang dibaca", "Selesai"];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function parseBody(body = {}) {
  const judul = String(body.judul ?? "").trim();
  const penulis = String(body.penulis ?? "").trim();
  const tahun = Number(body.tahun);
  const status = body.status;

  if (!judul) return { error: "Judul wajib diisi." };
  if (judul.length > 120) return { error: "Judul maksimal 120 karakter." };
  if (!penulis) return { error: "Penulis wajib diisi." };
  if (penulis.length > 80) return { error: "Penulis maksimal 80 karakter." };
  if (!Number.isInteger(tahun) || tahun < 1000 || tahun > new Date().getFullYear() + 1) {
    return { error: "Tahun terbit tidak valid." };
  }
  if (!STATUS.includes(status)) return { error: "Status tidak valid." };

  return { value: { judul, penulis, tahun, status } };
}

// GET: mengambil seluruh buku dari database Neon
app.get("/api/books", async (req, res, next) => {
  try {
    const books = await prisma.book.findMany({ orderBy: { id: "desc" } });
    res.json(books);
  } catch (err) {
    next(err);
  }
});

// POST: menambahkan buku
app.post("/api/books", async (req, res, next) => {
  try {
    const { error, value } = parseBody(req.body);
    if (error) return res.status(400).json({ message: error });

    const book = await prisma.book.create({ data: value });
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
});

// PUT: memperbarui buku
app.put("/api/books/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "ID buku tidak valid." });
    }

    const { error, value } = parseBody(req.body);
    if (error) return res.status(400).json({ message: error });

    const result = await prisma.book.updateMany({ where: { id }, data: value });
    if (result.count === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan." });
    }

    const updatedBook = await prisma.book.findUnique({ where: { id } });
    res.json(updatedBook);
  } catch (err) {
    next(err);
  }
});

// DELETE: menghapus buku
app.delete("/api/books/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "ID buku tidak valid." });
    }

    const result = await prisma.book.deleteMany({ where: { id } });
    if (result.count === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan." });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Terjadi kesalahan pada server atau database." });
});

const server = app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
