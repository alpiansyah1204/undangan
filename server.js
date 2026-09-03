const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'comments.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Pastikan file & folder data ada
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readComments() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Gagal membaca comments.json:', err);
    return [];
  }
}

function writeComments(comments) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(comments, null, 2), 'utf8');
}

// Kunci sederhana biar tidak dua request nulis file bersamaan dan saling timpa
let writeQueue = Promise.resolve();
function queuedWrite(fn) {
  writeQueue = writeQueue.then(fn).catch((err) => console.error(err));
  return writeQueue;
}

// GET /api/comments -> daftar semua ucapan, terbaru dulu
app.get('/api/comments', (req, res) => {
  const comments = readComments();
  comments.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ success: true, total: comments.length, comments });
});

// POST /api/comments -> tambah ucapan baru, disimpan ke data/comments.json
app.post('/api/comments', (req, res) => {
  const body = req.body || {};
  const author = typeof body.author === 'string' ? body.author.trim() : '';
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  const konfirmasi = body.konfirmasi;

  if (!author) {
    return res.status(400).json({ success: false, message: 'Nama wajib diisi.' });
  }
  if (comment.length < 2) {
    return res.status(400).json({ success: false, message: 'Ucapan minimal 2 karakter.' });
  }
  if (konfirmasi !== 'Hadir' && konfirmasi !== 'Tidak hadir') {
    return res.status(400).json({ success: false, message: 'Silahkan pilih konfirmasi kehadiran.' });
  }

  const newComment = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    author: author.slice(0, 100),
    comment: comment.slice(0, 1000),
    konfirmasi: konfirmasi,
    date: new Date().toISOString()
  };

  queuedWrite(() => {
    const comments = readComments();
    comments.push(newComment);
    writeComments(comments);
  }).then(() => {
    res.json({ success: true, comment: newComment });
  }).catch(() => {
    res.status(500).json({ success: false, message: 'Gagal menyimpan ucapan.' });
  });
});

// (Opsional) DELETE /api/comments/:id -> hapus satu ucapan, untuk moderasi manual
app.delete('/api/comments/:id', (req, res) => {
  queuedWrite(() => {
    const comments = readComments();
    const filtered = comments.filter((c) => c.id !== req.params.id);
    writeComments(filtered);
    return filtered;
  }).then((filtered) => {
    res.json({ success: true, total: filtered.length });
  }).catch(() => {
    res.status(500).json({ success: false, message: 'Gagal menghapus ucapan.' });
  });
});

app.listen(PORT, () => {
  console.log(`Undangan berjalan di http://localhost:${PORT}`);
});
