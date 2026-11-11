CREATE TABLE "books" (
    "id" SERIAL NOT NULL,
    "judul" VARCHAR(120) NOT NULL,
    "penulis" VARCHAR(80) NOT NULL,
    "tahun" INTEGER NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "books_status_idx" ON "books"("status");
