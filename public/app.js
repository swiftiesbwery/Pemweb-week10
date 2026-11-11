const API = "/api/books";

// Elemen
const $ = (id) => document.getElementById(id);
const list = $("book-list");
const form = $("book-form");
const bookDialog = $("book-dialog");
const confirmDialog = $("confirm-dialog");
const formError = $("form-error");
const toast = $("toast");

// State
let books = [];
let filter = "semua";
let query = "";
let editingId = null;
let deleting = null;
let toastTimer;

const BADGE_CLASS = { "Belum dibaca": "belum", "Sedang dibaca": "sedang", "Selesai": "selesai" };
const COVER_COLORS = [
  ["#f7c6d9", "#6b1b43"],
  ["#ffd9c9", "#8a3a1c"],
  ["#e6d3f2", "#4e2a73"],
  ["#cfe3f5", "#1f4d7a"],
  ["#d3ecdc", "#1f5c3c"],
  ["#fde8b8", "#6b4a00"],
];

// ---------- Util ----------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function textButton(label, className, ariaLabel, handler) {
  const btn = el("button", "link-btn " + className, label);
  btn.type = "button";
  btn.setAttribute("aria-label", ariaLabel);
  btn.addEventListener("click", handler);
  return btn;
}

function showToast(text, isError = false) {
  toast.textContent = text;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

async function request(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Permintaan gagal.");
  return data;
}

// ---------- Render ----------
function visibleBooks() {
  const q = query.trim().toLowerCase();
  return books
    .filter((b) => filter === "semua" || b.status === filter)
    .filter((b) => !q || b.judul.toLowerCase().includes(q) || b.penulis.toLowerCase().includes(q))
    .sort((a, b) => b.id - a.id);
}

function renderSummary() {
  const count = (s) => books.filter((b) => b.status === s).length;
  const total = books.length;
  const reading = count("Sedang dibaca");
  const done = count("Selesai");
  const percent = total ? Math.round((done / total) * 100) : 0;

  $("stat-total").textContent = total;
  $("stat-reading").textContent = reading;
  $("stat-done").textContent = done;

  document.querySelectorAll("[data-count]").forEach((node) => {
    const key = node.dataset.count;
    node.textContent = key === "semua" ? total : count(key);
  });

  $("percent").textContent = percent;
  $("side-bar").style.width = percent + "%";
  $("percent-note").textContent = total ? `${done} dari ${total} buku` : "Belum ada buku";
}

function renderList() {
  const items = visibleBooks();
  list.replaceChildren();

  for (const book of items) {
    const [bg, fg] = COVER_COLORS[book.id % COVER_COLORS.length];

    const card = el("li", "card");

    const cover = el("div", "cover");
    cover.style.background = bg;
    cover.style.color = fg;
    cover.append(
      el("span", "badge " + (BADGE_CLASS[book.status] || ""), book.status),
      el("span", "initial", book.judul.charAt(0).toUpperCase())
    );

    const body = el("div", "card-body");
    body.append(
      el("h3", "card-title", book.judul),
      el("p", "card-author", book.penulis),
      el("p", "card-year", "Terbit " + book.tahun)
    );

    const actions = el("div", "card-actions");
    actions.append(
      textButton("Edit", "edit", `Edit ${book.judul}`, () => openForm(book)),
      textButton("Hapus", "delete", `Hapus ${book.judul}`, () => askDelete(book))
    );

    card.append(cover, body, actions);
    list.appendChild(card);
  }

  // Judul halaman & kondisi kosong
  const titles = { semua: "Semua buku" };
  $("page-title").textContent = titles[filter] || filter;
  $("page-sub").textContent = `${items.length} buku ditampilkan`;

  const empty = $("empty");
  empty.hidden = items.length > 0;
  if (!items.length) {
    if (!books.length) {
      $("empty-title").textContent = "Belum ada buku";
      $("empty-text").textContent = 'Klik "Tambah buku" untuk mencatat bacaan pertamamu.';
    } else {
      $("empty-title").textContent = "Tidak ada hasil";
      $("empty-text").textContent = "Coba ubah kata kunci atau pilih filter lain.";
    }
  }
}

function render() {
  renderSummary();
  renderList();
}

// ---------- GET ----------
async function loadBooks() {
  try {
    books = await request(API);
    render();
  } catch (err) {
    $("page-sub").textContent = "Gagal memuat data";
    showToast(err.message, true);
  }
}

// ---------- Filter & pencarian ----------
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b === btn));
    renderList();
  });
});

$("search").addEventListener("input", (e) => {
  query = e.target.value;
  renderList();
});

// ---------- Form tambah / edit ----------
function openForm(book) {
  editingId = book ? book.id : null;
  form.reset();
  formError.textContent = "";

  if (book) {
    form.judul.value = book.judul;
    form.penulis.value = book.penulis;
    form.tahun.value = book.tahun;
    form.status.value = book.status;
  }

  $("form-title").textContent = book ? "Edit buku" : "Tambah buku";
  $("submit-btn").textContent = book ? "Simpan perubahan" : "Tambah buku";
  bookDialog.showModal();
  form.judul.focus();
}

$("add-btn").addEventListener("click", () => openForm(null));
$("close-form").addEventListener("click", () => bookDialog.close());
$("cancel-btn").addEventListener("click", () => bookDialog.close());

// Klik area gelap di luar dialog untuk menutup
for (const dlg of [bookDialog, confirmDialog]) {
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) dlg.close();
  });
}

// POST dan PUT
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  const payload = {
    judul: form.judul.value,
    penulis: form.penulis.value,
    tahun: form.tahun.value,
    status: form.status.value,
  };

  try {
    if (editingId === null) {
      await request(API, { method: "POST", body: JSON.stringify(payload) });
      showToast("Buku ditambahkan");
    } else {
      await request(`${API}/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
      showToast("Perubahan disimpan");
    }
    bookDialog.close();
    await loadBooks();
  } catch (err) {
    formError.textContent = err.message;
  }
});

// ---------- DELETE ----------
function askDelete(book) {
  deleting = book;
  $("confirm-text").textContent = `"${book.judul}" akan dihapus dari daftar. Tindakan ini tidak bisa dibatalkan.`;
  confirmDialog.showModal();
}

$("confirm-cancel").addEventListener("click", () => confirmDialog.close());

$("confirm-ok").addEventListener("click", async () => {
  if (!deleting) return;
  try {
    await request(`${API}/${deleting.id}`, { method: "DELETE" });
    showToast("Buku dihapus");
    await loadBooks();
  } catch (err) {
    showToast(err.message, true);
  }
  deleting = null;
  confirmDialog.close();
});

loadBooks();
