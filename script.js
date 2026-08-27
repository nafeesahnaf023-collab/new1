
/* 0. SERVICE WORKER REGISTRATION (enables PWA install + offline app shell) */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

/* 1. CONSTANTS & SEED DATA                                                */

const LS = {
  DEPTS: 'lib_departments',
  BOOKS: 'lib_books',
  MESSAGES: 'lib_messages',
  ORDERS: 'lib_orders',
  THEME: 'lib_theme',
  ADMIN: 'lib_admin_session',
  STORE_CATS: 'lib_store_categories',
  STORE_BOOKS: 'lib_store_books',
  USERS: 'lib_users',
  USER_SESSION: 'lib_user_session',
  READING_PROGRESS: 'lib_reading_progress',
  DOWNLOAD_HISTORY: 'lib_download_history',
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BD_MOBILE_REGEX = /^01[3-9]\d{8}$/; // Bangladeshi mobile numbers
const PAYMENT_METHODS = ['Cash on Delivery', 'bKash', 'Nagad', 'Rocket', 'Card Payment'];
// Manual mobile-banking verification: these methods aren't wired to a live
// payment gateway (that needs a real merchant account + a server to keep the
// API secret safe). Instead, the buyer sends money to the number below and
// enters the Transaction ID at checkout; an admin verifies it manually in
// the Orders tab. Replace with your real numbers before going live.
const MOBILE_BANKING_METHODS = ['bKash', 'Nagad', 'Rocket'];
const MOBILE_BANKING_NUMBERS = {
  bKash: 'PASTE_YOUR_BKASH_NUMBER_HERE',
  Nagad: 'PASTE_YOUR_NAGAD_NUMBER_HERE',
  Rocket: 'PASTE_YOUR_ROCKET_NUMBER_HERE',
};
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB, per spec
const ALLOWED_EXT = ['pdf', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'webp', 'gif'];

const DEFAULT_DEPARTMENTS = [
  {
    id: 'cse', name: 'Computer Science & Engineering', shortName: 'CSE',
    icon: '💻', totalSemesters: 8,
    courses: {
      1: ['Programming Fundamentals', 'Mathematics-I', 'Physics', 'English'],
      2: ['Data Structures', 'Discrete Mathematics', 'Object Oriented Programming', 'Statistics'],
      3: ['Algorithms', 'Digital Logic Design', 'Database Systems', 'Mathematics-III'],
      4: ['Operating Systems', 'Computer Networks', 'Software Engineering', 'Web Technologies'],
      5: ['Artificial Intelligence', 'Computer Architecture', 'Theory of Computation', 'Numerical Methods'],
      6: ['Machine Learning', 'Compiler Design', 'Distributed Systems', 'Elective-I'],
      7: ['Cloud Computing', 'Information Security', 'Project-I', 'Elective-II'],
      8: ['Big Data Analytics', 'Project-II', 'Professional Ethics', 'Elective-III'],
    },
  },
  {
    id: 'math', name: 'Mathematics', shortName: 'Mathematics',
    icon: '📐', totalSemesters: 8,
    courses: {
      1: ['Calculus-I', 'Linear Algebra', 'Set Theory & Logic', 'English'],
      2: ['Calculus-II', 'Differential Equations', 'Vector Analysis', 'Statistics Basics'],
      3: ['Real Analysis', 'Abstract Algebra', 'Numerical Analysis'],
      4: ['Complex Analysis', 'Topology', 'Probability Theory'],
    },
  },
  {
    id: 'stat', name: 'Statistics', shortName: 'Statistics',
    icon: '📊', totalSemesters: 8,
    courses: {
      1: ['Introduction to Statistics', 'Probability-I', 'Calculus for Statistics', 'English'],
      2: ['Probability-II', 'Statistical Inference', 'Sampling Techniques', 'Linear Algebra'],
    },
  },
  {
    id: 'psy', name: 'Psychology', shortName: 'Psychology',
    icon: '🧠', totalSemesters: 8,
    courses: {
      1: ['Introduction to Psychology', 'General Sociology', 'English', 'Biology for Psychology'],
      2: ['Developmental Psychology', 'Cognitive Psychology', 'Research Methods', 'Statistics for Psychology'],
    },
  },
];

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const DEFAULT_BOOKS = [
  { id: 'seed1', title: 'Programming Fundamentals with C', course: 'Programming Fundamentals', author: 'Dr. R. Karim', department: 'cse', semester: 1, fileName: null, fileType: 'PDF', fileSize: 4_900_000, uploadDate: daysAgoIso(40), fileData: null },
  { id: 'seed2', title: 'Data Structures & Algorithms', course: 'Data Structures', author: 'M. Anisur Rahman', department: 'cse', semester: 2, fileName: null, fileType: 'PDF', fileSize: 6_200_000, uploadDate: daysAgoIso(30), fileData: null },
  { id: 'seed3', title: 'Object Oriented Programming in Java', course: 'Object Oriented Programming', author: 'S. Chowdhury', department: 'cse', semester: 2, fileName: null, fileType: 'PDF', fileSize: 5_400_000, uploadDate: daysAgoIso(21), fileData: null },
  { id: 'seed4', title: 'Calculus and Analytic Geometry', course: 'Calculus-I', author: 'G. B. Thomas', department: 'math', semester: 1, fileName: null, fileType: 'PDF', fileSize: 8_100_000, uploadDate: daysAgoIso(55), fileData: null },
  { id: 'seed5', title: 'Elementary Linear Algebra', course: 'Linear Algebra', author: 'Howard Anton', department: 'math', semester: 1, fileName: null, fileType: 'PDF', fileSize: 7_300_000, uploadDate: daysAgoIso(18), fileData: null },
  { id: 'seed6', title: 'Introduction to Probability & Statistics', course: 'Introduction to Statistics', author: 'W. Mendenhall', department: 'stat', semester: 1, fileName: null, fileType: 'PDF', fileSize: 5_900_000, uploadDate: daysAgoIso(12), fileData: null },
  { id: 'seed7', title: 'Sampling Techniques', course: 'Sampling Techniques', author: 'William G. Cochran', department: 'stat', semester: 2, fileName: null, fileType: 'PDF', fileSize: 4_500_000, uploadDate: daysAgoIso(9), fileData: null },
  { id: 'seed8', title: 'Introduction to Psychology', course: 'Introduction to Psychology', author: 'James W. Kalat', department: 'psy', semester: 1, fileName: null, fileType: 'PDF', fileSize: 9_200_000, uploadDate: daysAgoIso(6), fileData: null },
  { id: 'seed9', title: 'Cognitive Psychology: Theory & Practice', course: 'Cognitive Psychology', author: 'R. Sternberg', department: 'psy', semester: 2, fileName: null, fileType: 'PDF', fileSize: 6_700_000, uploadDate: daysAgoIso(3), fileData: null },
];

const DEFAULT_STORE_CATEGORIES = [
  { id: 'islamic', name: 'Islamic', icon: '🕌', description: 'Quran, Hadith, and Islamic literature.' },
  { id: 'novels', name: 'Novels', icon: '📖', description: 'Fiction and literary novels.' },
  { id: 'academic', name: 'Academic', icon: '🎓', description: 'Textbooks and reference material.' },
  { id: 'children', name: "Children's Books", icon: '🧸', description: 'Picture books and early readers.' },
  { id: 'biography', name: 'Biography', icon: '🖋️', description: 'Life stories and memoirs.' },
];

const DEFAULT_STORE_BOOKS = [
  { id: 'sbseed1', title: 'The Sealed Nectar', author: 'Safiur Rahman Mubarakpuri', categoryId: 'islamic', price: 450, stock: 12, available: true, publisher: 'Darussalam', isbn: '978-9960899558', shortDescription: 'An award-winning biography of the Prophet Muhammad ﷺ.', fullDescription: 'A widely celebrated seerah that traces the life of the Prophet Muhammad ﷺ from birth to passing, drawing on classical sources and presented in clear, modern prose.', images: [], createdDate: daysAgoIso(48) },
  { id: 'sbseed2', title: 'Stories of the Prophets', author: 'Ibn Kathir', categoryId: 'islamic', price: 380, stock: 8, available: true, publisher: 'Darussalam', isbn: '978-9960892913', shortDescription: 'The lives of the prophets, retold from classical sources.', fullDescription: 'A comprehensive retelling of the lives of the prophets mentioned in the Quran, compiled from the works of the historian and exegete Ibn Kathir.', images: [], createdDate: daysAgoIso(40) },
  { id: 'sbseed3', title: 'The Kite Runner', author: 'Khaled Hosseini', categoryId: 'novels', price: 520, stock: 15, available: true, publisher: 'Riverhead Books', isbn: '978-1594631931', shortDescription: 'A story of friendship and redemption set in Afghanistan.', fullDescription: 'A powerful novel following two boys growing up in Kabul, exploring themes of friendship, guilt, and the possibility of redemption across decades of upheaval.', images: [], createdDate: daysAgoIso(33) },
  { id: 'sbseed4', title: 'Feluda Samagra (Vol. 1)', author: 'Satyajit Ray', categoryId: 'novels', price: 600, stock: 6, available: true, publisher: 'Ananda Publishers', isbn: '978-8172150912', shortDescription: 'The complete detective adventures of Feluda.', fullDescription: 'A beloved collection of detective stories following Pradosh Mitter, known as Feluda, as he solves mysteries across India with wit and sharp observation.', images: [], createdDate: daysAgoIso(29) },
  { id: 'sbseed5', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', categoryId: 'academic', price: 1450, stock: 5, available: true, publisher: 'MIT Press', isbn: '978-0262046305', shortDescription: 'The definitive reference on algorithms and data structures.', fullDescription: 'A comprehensive, rigorous textbook covering a broad range of algorithms in depth, widely used as the standard reference in computer science courses worldwide.', images: [], createdDate: daysAgoIso(22) },
  { id: 'sbseed6', title: 'A Brief History of Time', author: 'Stephen Hawking', categoryId: 'academic', price: 480, stock: 0, available: false, publisher: 'Bantam Books', isbn: '978-0553380163', shortDescription: 'A landmark popular-science tour of cosmology.', fullDescription: 'An accessible exploration of cosmology and theoretical physics, covering the origins of the universe, black holes, and the nature of time itself.', images: [], createdDate: daysAgoIso(19) },
  { id: 'sbseed7', title: 'The Very Hungry Caterpillar', author: 'Eric Carle', categoryId: 'children', price: 250, stock: 20, available: true, publisher: 'World of Eric Carle', isbn: '978-0399226908', shortDescription: 'A colorful picture book classic for early readers.', fullDescription: 'A beloved illustrated picture book following a caterpillar\u2019s journey of eating and growing before transforming into a butterfly — a favorite first-reader title.', images: [], createdDate: daysAgoIso(14) },
  { id: 'sbseed8', title: 'Long Walk to Freedom', author: 'Nelson Mandela', categoryId: 'biography', price: 690, stock: 7, available: true, publisher: 'Little, Brown and Company', isbn: '978-0316548182', shortDescription: 'The autobiography of Nelson Mandela.', fullDescription: 'Nelson Mandela\u2019s own account of his early life, decades of imprisonment, and his role in ending apartheid and leading South Africa\u2019s transition to democracy.', images: [], createdDate: daysAgoIso(8) },
];

/* ---------------------------------------------------------------------- */
/* 2. SUPABASE CONFIG + STORAGE HELPERS                                    */

const SUPABASE_URL = 'https://kikqxzszzmgamffxpanh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_AMKrIFlLNlKXjuD0PCj7FQ_IPkpYmT3';
const BOOK_BUCKET = 'book-files';

const sb = (typeof supabase !== 'undefined' && /^https?:\/\//.test(SUPABASE_URL))
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// In-memory cache — loaded once at boot (loadAllData), kept in sync on every save.
let _departmentsCache = null;
let _booksCache = null;

// Supabase Auth session state — refreshed once at boot (see refreshAuthSession()).
let _authUserId = null;   // Supabase Auth UID of the signed-in visitor, or null.
let _authIsAdmin = false; // whether that UID is present in the `admins` table.
let _authLastSignInAt = null; // last_sign_in_at from the Supabase Auth session, for "Last login" display only.

async function refreshAuthSession() {
  if (!sb) { _authUserId = null; _authIsAdmin = false; _authLastSignInAt = null; return; }
  const { data } = await sb.auth.getSession();
  _authUserId = data?.session?.user?.id || null;
  _authLastSignInAt = data?.session?.user?.last_sign_in_at || null;
  await refreshAdminFlag();
}
async function refreshAdminFlag() {
  if (!sb || !_authUserId) { _authIsAdmin = false; return; }
  const { data, error } = await sb.from('admins').select('user_id').eq('user_id', _authUserId).maybeSingle();
  _authIsAdmin = !error && !!data;
}

async function loadAllData() {
  if (!sb) {
    // Supabase isn't configured yet — fall back to the original localStorage behavior.
    const rawD = localStorage.getItem(LS.DEPTS);
    _departmentsCache = rawD ? JSON.parse(rawD) : clone(DEFAULT_DEPARTMENTS);
    if (!rawD) localStorage.setItem(LS.DEPTS, JSON.stringify(_departmentsCache));
    const rawB = localStorage.getItem(LS.BOOKS);
    _booksCache = rawB ? JSON.parse(rawB) : clone(DEFAULT_BOOKS);
    if (!rawB) localStorage.setItem(LS.BOOKS, JSON.stringify(_booksCache));
    return;
  }
  try {
    let { data: deptRows, error: deptErr } = await sb.from('departments').select('id,data');
    if (deptErr) throw deptErr;
    if (!deptRows || deptRows.length === 0) {
      await sb.from('departments').insert(DEFAULT_DEPARTMENTS.map((d) => ({ id: d.id, data: d })));
      deptRows = DEFAULT_DEPARTMENTS.map((d) => ({ id: d.id, data: d }));
    }
    _departmentsCache = deptRows.map((r) => r.data);

    let { data: bookRows, error: bookErr } = await sb.from('books').select('id,data');
    if (bookErr) throw bookErr;
    if (!bookRows || bookRows.length === 0) {
      await sb.from('books').insert(DEFAULT_BOOKS.map((b) => ({ id: b.id, data: b })));
      bookRows = DEFAULT_BOOKS.map((b) => ({ id: b.id, data: b }));
    }
    _booksCache = bookRows.map((r) => r.data);
  } catch (err) {
    console.error(err);
    showToast('Could not reach the database — check your Supabase URL/key.', 'error');
    _departmentsCache = clone(DEFAULT_DEPARTMENTS);
    _booksCache = clone(DEFAULT_BOOKS);
  }
  await loadStoreCatalogue();
}

function getDepartments() { return clone(_departmentsCache || []); }
function getBooks() { return clone(_booksCache || []); }

// ---- Book Store (categories + store books) ----
let _storeCategoriesCache = null;
let _storeBooksCache = null;

async function loadStoreCatalogue() {
  if (!sb) {
    const rawC = localStorage.getItem(LS.STORE_CATS);
    _storeCategoriesCache = rawC ? JSON.parse(rawC) : clone(DEFAULT_STORE_CATEGORIES);
    if (!rawC) localStorage.setItem(LS.STORE_CATS, JSON.stringify(_storeCategoriesCache));
    const rawB = localStorage.getItem(LS.STORE_BOOKS);
    _storeBooksCache = rawB ? JSON.parse(rawB) : clone(DEFAULT_STORE_BOOKS);
    if (!rawB) localStorage.setItem(LS.STORE_BOOKS, JSON.stringify(_storeBooksCache));
    return;
  }
  try {
    let { data: catRows, error: catErr } = await sb.from('store_categories').select('id,data');
    if (catErr) throw catErr;
    if (!catRows || catRows.length === 0) {
      await sb.from('store_categories').insert(DEFAULT_STORE_CATEGORIES.map((c) => ({ id: c.id, data: c })));
      catRows = DEFAULT_STORE_CATEGORIES.map((c) => ({ id: c.id, data: c }));
    }
    _storeCategoriesCache = catRows.map((r) => r.data);

    let { data: bookRows, error: bookErr } = await sb.from('store_books').select('id,data');
    if (bookErr) throw bookErr;
    if (!bookRows || bookRows.length === 0) {
      await sb.from('store_books').insert(DEFAULT_STORE_BOOKS.map((b) => ({ id: b.id, data: b })));
      bookRows = DEFAULT_STORE_BOOKS.map((b) => ({ id: b.id, data: b }));
    }
    _storeBooksCache = bookRows.map((r) => r.data);
  } catch (err) {
    console.error(err);
    showToast('Could not load the book store from the database.', 'error');
    _storeCategoriesCache = clone(DEFAULT_STORE_CATEGORIES);
    _storeBooksCache = clone(DEFAULT_STORE_BOOKS);
  }
}

function getStoreCategories() { return clone(_storeCategoriesCache || []); }
function getStoreBooks() { return clone(_storeBooksCache || []); }
function storeCategoryById(id) { return getStoreCategories().find((c) => c.id === id); }

async function saveStoreCategories(list) {
  _storeCategoriesCache = list;
  if (!sb) { localStorage.setItem(LS.STORE_CATS, JSON.stringify(list)); return; }
  const { error } = await sb.from('store_categories').upsert(list.map((c) => ({ id: c.id, data: c })));
  if (error) { console.error(error); showToast('Save failed — check your internet or Supabase settings.', 'error'); }
}

async function saveStoreBooks(list) {
  _storeBooksCache = list;
  if (!sb) { localStorage.setItem(LS.STORE_BOOKS, JSON.stringify(list)); return; }
  const { error } = await sb.from('store_books').upsert(list.map((b) => ({ id: b.id, data: b })));
  if (error) { console.error(error); showToast('Save failed — check your internet or Supabase settings.', 'error'); }
}

/* Upload up to 4 gallery/cover images for a store book into the shared bucket. */
async function uploadStoreImages(files) {
  const uploaded = [];
  for (const file of Array.from(files).slice(0, 4)) {
    const r = await uploadToBucket(await compressImageFile(file), 'store/');
    uploaded.push({ url: r.url, path: r.path });
  }
  return uploaded;
}

async function saveDepartments(list) {
  _departmentsCache = list;
  if (!sb) { localStorage.setItem(LS.DEPTS, JSON.stringify(list)); return; }
  const { error } = await sb.from('departments').upsert(list.map((d) => ({ id: d.id, data: d })));
  if (error) { console.error(error); showToast('Save failed — check your internet or Supabase settings.', 'error'); }
}

async function saveBooks(list) {
  _booksCache = list;
  if (!sb) { localStorage.setItem(LS.BOOKS, JSON.stringify(list)); return; }
  const { error } = await sb.from('books').upsert(list.map((b) => ({ id: b.id, data: b })));
  if (error) { console.error(error); showToast('Save failed — check your internet or Supabase settings.', 'error'); }
}

/* Downscale + re-encode an image file before upload — keeps gallery/cover
   photos snappy to load without a visible quality hit. Skips non-images
   and anything already small enough that compressing wouldn't help. */
function compressImageFile(file, { maxDim = 1280, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    if (!file.type || !file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 120 * 1024) {
      resolve(file);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob || blob.size >= file.size) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.(png|webp|jpe?g)$/i, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

/* Upload a raw file into a folder inside the shared storage bucket and return
   its public URL + path. Falls back to base64 data-URLs if Supabase isn't configured. */
async function uploadToBucket(file, prefix = '') {
  if (!sb) return { url: await readFileAsDataUrl(file), path: null };
  const path = `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;
  const { error } = await sb.storage.from(BOOK_BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = sb.storage.from(BOOK_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}
async function uploadBookFile(file) { return uploadToBucket(file, ''); }
async function uploadCoverImage(file) { return uploadToBucket(await compressImageFile(file), 'covers/'); }

function hasFile(book) { return !!(book.fileData || book.fileUrl); }

// ---- Contact-form messages (admin can read these in the dashboard) ----
let _messagesCache = null;

async function loadMessages() {
  if (!sb) {
    const raw = localStorage.getItem(LS.MESSAGES);
    _messagesCache = raw ? JSON.parse(raw) : [];
    return;
  }
  const { data, error } = await sb.from('messages').select('id,data');
  if (error) { console.error(error); showToast('Could not load messages from the database.', 'error'); _messagesCache = []; return; }
  _messagesCache = (data || []).map((r) => r.data);
}
function getMessages() { return clone(_messagesCache || []); }

async function saveMessage(msg) {
  _messagesCache = [msg, ...(_messagesCache || [])];
  if (!sb) { localStorage.setItem(LS.MESSAGES, JSON.stringify(_messagesCache)); return; }
  const { error } = await sb.from('messages').insert([{ id: msg.id, data: msg }]);
  if (error) throw error;
}

async function deleteMessage(id) {
  _messagesCache = getMessages().filter((m) => m.id !== id);
  if (!sb) { localStorage.setItem(LS.MESSAGES, JSON.stringify(_messagesCache)); return; }
  const { error } = await sb.from('messages').delete().eq('id', id);
  if (error) console.error(error);
}

// ---- Buy Book orders (admin can review these in the dashboard) ----
let _ordersCache = null;

async function loadOrders() {
  if (!sb) {
    const raw = localStorage.getItem(LS.ORDERS);
    _ordersCache = raw ? JSON.parse(raw) : [];
    return;
  }
  const { data, error } = await sb.from('orders').select('id,data');
  if (error) { console.error(error); _ordersCache = []; return; }
  _ordersCache = (data || []).map((r) => r.data);
}
function getOrders() { return clone(_ordersCache || []); }

async function saveOrder(order) {
  _ordersCache = [order, ...(_ordersCache || [])];
  if (!sb) { localStorage.setItem(LS.ORDERS, JSON.stringify(_ordersCache)); return; }
  const { error } = await sb.from('orders').insert([{ id: order.id, data: order }]);
  if (error) throw error;
}

async function deleteOrder(id) {
  _ordersCache = getOrders().filter((o) => o.id !== id);
  if (!sb) { localStorage.setItem(LS.ORDERS, JSON.stringify(_ordersCache)); return; }
  const { error } = await sb.from('orders').delete().eq('id', id);
  if (error) console.error(error);
}

async function updateOrderStatus(id, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return;
  order.status = status;
  _ordersCache = orders;
  if (!sb) { localStorage.setItem(LS.ORDERS, JSON.stringify(orders)); return; }
  const { error } = await sb.from('orders').update({ data: order }).eq('id', id);
  if (error) { console.error(error); showToast('Could not update order status.', 'error'); }
}

async function updateOrderPaymentVerified(id, verified) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return;
  order.paymentVerified = verified;
  _ordersCache = orders;
  if (!sb) { localStorage.setItem(LS.ORDERS, JSON.stringify(orders)); return; }
  const { error } = await sb.from('orders').update({ data: order }).eq('id', id);
  if (error) { console.error(error); showToast('Could not update payment verification.', 'error'); }
}

function isAdmin() { return sb ? _authIsAdmin : localStorage.getItem(LS.ADMIN) === 'true'; }
function setAdminSession(v) {
  // Only meaningful in local-fallback mode — with Supabase configured, admin
  // status comes from the `admins` table via refreshAdminFlag(), not a flag.
  if (!sb) { v ? localStorage.setItem(LS.ADMIN, 'true') : localStorage.removeItem(LS.ADMIN); }
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------------------------------------------------------------------- */
/* 2B. USER ACCOUNTS (Sign Up / Login / Session)                           */
/* ---------------------------------------------------------------------- */

/* Password hashing — SHA-256 (Web Crypto, built into every browser) salted
   per-user. This is a client-only site with no server, so this is as far as
   "secure hashing" can reasonably go without a backend; it still means raw
   passwords are never stored or transmitted anywhere. */
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}::${password}`);
  const digestBuf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digestBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
function genSalt() { return genId() + genId(); }

function isStrongPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}

let _usersCache = null;
async function loadUsers() {
  if (!sb) {
    const raw = localStorage.getItem(LS.USERS);
    _usersCache = raw ? JSON.parse(raw) : [];
    return;
  }
  const { data, error } = await sb.from('users').select('id,data');
  if (error) { console.error(error); _usersCache = []; return; }
  _usersCache = (data || []).map((r) => r.data);
}
function getUsers() { return clone(_usersCache || []); }
function userById(id) { return getUsers().find((u) => u.id === id); }

async function insertUser(user) {
  _usersCache = [...(_usersCache || []), user];
  if (!sb) { localStorage.setItem(LS.USERS, JSON.stringify(_usersCache)); return; }
  const { error } = await sb.from('users').insert([{ id: user.id, data: user }]);
  if (error) throw error;
}
async function updateUserRecord(user) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx === -1) return;
  users[idx] = user;
  _usersCache = users;
  if (!sb) { localStorage.setItem(LS.USERS, JSON.stringify(users)); return; }
  const { error } = await sb.from('users').update({ data: user }).eq('id', user.id);
  if (error) throw error;
}

function getCurrentUserId() { return sb ? _authUserId : localStorage.getItem(LS.USER_SESSION); }
function setCurrentUserId(id) {
  // Only meaningful in local-fallback mode — with Supabase configured, the
  // session lives in Supabase Auth (see refreshAuthSession()), not here.
  if (!sb) { id ? localStorage.setItem(LS.USER_SESSION, id) : localStorage.removeItem(LS.USER_SESSION); }
}
function isLoggedIn() { return !!getCurrentUserId(); }
function getCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;
  return userById(id) || null;
}
async function logoutUser() {
  if (sb) { await sb.auth.signOut(); _authUserId = null; _authIsAdmin = false; }
  else { setCurrentUserId(null); }
}

async function signupUser({ fullName, mobile, email, address, password, confirmPassword }) {
  fullName = (fullName || '').trim();
  mobile = (mobile || '').trim();
  email = (email || '').trim();
  address = (address || '').trim();
  if (!fullName || !mobile || !email || !address || !password || !confirmPassword) {
    throw new Error('Please fill in every field.');
  }
  if (!EMAIL_REGEX.test(email)) throw new Error('Please enter a valid email address.');
  if (!BD_MOBILE_REGEX.test(mobile)) throw new Error('Please enter a valid 11-digit mobile number (e.g. 01XXXXXXXXX).');
  if (!isStrongPassword(password)) throw new Error('Password must be at least 8 characters and include both letters and numbers.');
  if (password !== confirmPassword) throw new Error('Passwords do not match.');

  if (!sb) {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with this email already exists.');
    if (users.some((u) => u.mobile === mobile)) throw new Error('An account with this mobile number already exists.');
    const salt = genSalt();
    const passwordHash = await hashPassword(password, salt);
    const user = {
      id: genId(), fullName, mobile, email, address,
      passwordHash, salt, canDownload: true,
      createdDate: new Date().toISOString(),
    };
    await insertUser(user);
    setCurrentUserId(user.id);
    return user;
  }

  // Real accounts go through Supabase Auth — a security-definer RPC checks for
  // a duplicate email/mobile without exposing the whole users table publicly.
  const { data: taken } = await sb.rpc('is_identifier_taken', { p_email: email, p_mobile: mobile });
  if (taken) throw new Error('An account with this email or mobile number already exists.');

  const { data: signUpData, error: signUpError } = await sb.auth.signUp({ email, password });
  if (signUpError) throw new Error(/already/i.test(signUpError.message) ? 'An account with this email already exists.' : signUpError.message);
  if (!signUpData.user || !signUpData.session) {
    throw new Error('Account created — please check your email to confirm it, then log in.');
  }

  const user = {
    id: signUpData.user.id, fullName, mobile, email, address,
    canDownload: true, createdDate: new Date().toISOString(),
  };
  await insertUser(user);
  _authUserId = signUpData.user.id;
  _authIsAdmin = false;
  return user;
}

async function loginUser(identifier, password) {
  identifier = (identifier || '').trim();
  if (!identifier || !password) throw new Error('Please enter your email/mobile and password.');

  if (!sb) {
    const idLower = identifier.toLowerCase();
    const user = getUsers().find((u) => u.email.toLowerCase() === idLower || u.mobile === identifier);
    if (!user) throw new Error('No account found with that email or mobile number.');
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) throw new Error('Incorrect password.');
    setCurrentUserId(user.id);
    return user;
  }

  // Supabase Auth is email-based — if a mobile number was entered instead,
  // resolve it to an email first via a security-definer RPC (returns only
  // the email, never the full profile).
  let email = identifier;
  if (!EMAIL_REGEX.test(identifier)) {
    const { data: resolvedEmail } = await sb.rpc('email_for_mobile', { p_mobile: identifier });
    if (!resolvedEmail) throw new Error('No account found with that email or mobile number.');
    email = resolvedEmail;
  }

  const { data, error: signInError } = await sb.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error('Incorrect email/mobile or password.');
  _authUserId = data.user.id;
  await refreshAdminFlag();
  await loadUsers(); // refresh the cache so userById() can find this account's row
  const user = userById(_authUserId);
  if (!user) throw new Error('Signed in, but no profile was found for this account.');
  return user;
}

/* ---- Reading progress (per user, per book) ---- */
let _readingProgressCache = null;
async function loadReadingProgress() {
  if (!sb) {
    const raw = localStorage.getItem(LS.READING_PROGRESS);
    _readingProgressCache = raw ? JSON.parse(raw) : [];
    return;
  }
  const { data, error } = await sb.from('reading_progress').select('id,data');
  if (error) { console.error(error); _readingProgressCache = []; return; }
  _readingProgressCache = (data || []).map((r) => r.data);
}
function getReadingProgress() { return clone(_readingProgressCache || []); }

async function recordBookOpened(book) {
  const user = getCurrentUser();
  if (!user) return;
  const list = getReadingProgress();
  const id = `${user.id}_${book.id}`;
  let entry = list.find((e) => e.id === id);
  if (entry) {
    entry.timesOpened = (entry.timesOpened || 1) + 1;
    entry.lastOpened = new Date().toISOString();
  } else {
    entry = { id, userId: user.id, userName: user.fullName, bookId: book.id, bookTitle: book.title, timesOpened: 1, lastOpened: new Date().toISOString() };
    list.push(entry);
  }
  _readingProgressCache = list;
  if (!sb) { localStorage.setItem(LS.READING_PROGRESS, JSON.stringify(list)); return; }
  const { error } = await sb.from('reading_progress').upsert([{ id, data: entry }]);
  if (error) console.error(error);
}

/* ---- Download history (append-only log) ---- */
let _downloadHistoryCache = null;
async function loadDownloadHistory() {
  if (!sb) {
    const raw = localStorage.getItem(LS.DOWNLOAD_HISTORY);
    _downloadHistoryCache = raw ? JSON.parse(raw) : [];
    return;
  }
  const { data, error } = await sb.from('download_history').select('id,data');
  if (error) { console.error(error); _downloadHistoryCache = []; return; }
  _downloadHistoryCache = (data || []).map((r) => r.data);
}
function getDownloadHistory() { return clone(_downloadHistoryCache || []); }

async function recordDownload(book) {
  const user = getCurrentUser();
  if (!user) return;
  const entry = { id: genId(), userId: user.id, userName: user.fullName, bookId: book.id, bookTitle: book.title, date: new Date().toISOString() };
  _downloadHistoryCache = [entry, ...(_downloadHistoryCache || [])];
  if (!sb) { localStorage.setItem(LS.DOWNLOAD_HISTORY, JSON.stringify(_downloadHistoryCache)); return; }
  const { error } = await sb.from('download_history').insert([{ id: entry.id, data: entry }]);
  if (error) console.error(error);
}

/* ---- Cart (per-user, kept in this browser only — it's a working basket,
   not shared/permanent data, so localStorage is the right fit here) ---- */
function cartKey() { const u = getCurrentUser(); return u ? 'lib_cart_' + u.id : null; }
function getCart() {
  const k = cartKey();
  if (!k) return [];
  try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; }
}
function saveCart(items) { const k = cartKey(); if (k) localStorage.setItem(k, JSON.stringify(items)); }
function addToCart(bookId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.bookId === bookId);
  if (existing) existing.qty += qty; else cart.push({ bookId, qty });
  saveCart(cart);
  updateCartBadge();
  pulseCartBadge();
}
function removeFromCart(bookId) { saveCart(getCart().filter((i) => i.bookId !== bookId)); updateCartBadge(); }
function setCartQty(bookId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.bookId === bookId);
  if (item) { item.qty = Math.max(1, Math.floor(qty) || 1); saveCart(cart); }
  updateCartBadge();
}
function cartCount() { return getCart().reduce((s, i) => s + i.qty, 0); }
function cartLineItems() {
  const books = getStoreBooks();
  return getCart().map((c) => {
    const book = books.find((b) => b.id === c.bookId);
    if (!book) return null;
    return { bookId: book.id, title: book.title, price: Number(book.price), qty: c.qty, stock: book.stock, available: book.available !== false };
  }).filter(Boolean);
}
function updateCartBadge() {
  const n = cartCount();
  document.querySelectorAll('.cart-count-badge').forEach((b) => {
    b.textContent = n;
    b.style.display = n > 0 ? 'flex' : 'none';
  });
}
/* Quick scale(1.3) pulse on every cart badge — called from addToCart() so the
   user gets instant feedback that something landed in the cart. */
function pulseCartBadge() {
  document.querySelectorAll('.cart-count-badge').forEach((b) => {
    b.classList.remove('badge-pulse');
    void b.offsetWidth; // restart the animation even on rapid repeated adds
    b.classList.add('badge-pulse');
    b.addEventListener('animationend', () => b.classList.remove('badge-pulse'), { once: true });
  });
}

/* ---- Order success celebration: confetti burst + animated checkmark ----
   Call after an order is successfully placed. Purely visual, auto-cleans
   itself up, and respects prefers-reduced-motion via the CSS above. */
function celebrateOrderSuccess() {
  const overlay = document.createElement('div');
  overlay.className = 'celebrate-overlay';
  const colors = ['#2e9563', '#f4b942', '#e2725b', '#3d8bfd', '#a566d6'];
  let confettiHtml = '';
  const pieceCount = 26;
  for (let i = 0; i < pieceCount; i++) {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const duration = 1.2 + Math.random() * 0.8;
    const color = colors[i % colors.length];
    const rotate = Math.random() > 0.5 ? '' : 'border-radius:50%;';
    confettiHtml += `<span class="confetti-piece" style="left:${left}%;background:${color};${rotate}animation-delay:${delay}s;animation-duration:${duration}s;"></span>`;
  }
  overlay.innerHTML = `
    ${confettiHtml}
    <div class="celebrate-check-wrap">
      <svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 7"/></svg>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2200);
}

/* ---- Order helpers — orders may be legacy single-item shape (old demo
   data) or the newer { items:[...] } cart-checkout shape. These helpers read
   either shape so the admin/user order views work for both. ---- */
function orderItemsOf(o) {
  if (Array.isArray(o.items)) return o.items;
  if (o.bookTitle || o.book) return [{ bookId: o.bookId, title: o.bookTitle || o.book, unitPrice: o.unitPrice, qty: o.quantity || 1 }];
  return [];
}
function orderTotalOf(o) {
  if (o.total != null) return Number(o.total);
  return orderItemsOf(o).reduce((s, i) => s + Number(i.unitPrice || 0) * Number(i.qty || 1), 0);
}
function orderBuyerName(o) { return o.buyerName || o.name || '—'; }
function orderBuyerContact(o) { return o.buyerEmail || o.buyerMobile || o.contact || '—'; }
function orderAddress(o) { return o.deliveryAddress || o.address || ''; }
function orderPaymentMethod(o) { return o.paymentMethod || '—'; }
function orderTrxId(o) { return o.trxId || ''; }

async function placeOrder({ items, paymentMethod, deliveryAddress, note, trxId }) {
  const user = getCurrentUser();
  if (!user) throw new Error('Please log in to place an order.');
  if (!items || !items.length) throw new Error('Your cart is empty.');
  const method = paymentMethod || PAYMENT_METHODS[0];
  const cleanTrxId = (trxId || '').trim();
  if (MOBILE_BANKING_METHODS.includes(method) && !cleanTrxId) {
    throw new Error(`Please enter the ${method} Transaction ID after sending the payment.`);
  }
  const total = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);
  const order = {
    id: genId(),
    userId: user.id,
    buyerName: user.fullName,
    buyerMobile: user.mobile,
    buyerEmail: user.email,
    deliveryAddress: (deliveryAddress || user.address || '').trim(),
    items: items.map((i) => ({ bookId: i.bookId, title: i.title, unitPrice: Number(i.price), qty: Number(i.qty) })),
    total: Math.round(total * 100) / 100,
    paymentMethod: method,
    trxId: cleanTrxId,
    paymentVerified: false,
    note: (note || '').trim(),
    status: 'Pending',
    date: new Date().toISOString(),
  };
  await saveOrder(order);
  return order;
}

/* ---------------------------------------------------------------------- */
/* 3. GENERIC UTILITIES                                                    */
/* ---------------------------------------------------------------------- */
function genId() { return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  const units = ['KB', 'MB', 'GB'];
  let val = bytes / 1024, i = 0;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return val.toFixed(1) + ' ' + units[i];
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initialsOf(title) {
  return (title || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function extOf(fileName) {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toUpperCase() : '';
}

function showToast(message, type = 'success') {
  let host = document.getElementById('toastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toastHost';
    document.body.appendChild(host);
  }
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  const icon = type === 'error' ? '⚠️' : (type === 'celebrate' ? '🎉' : '✓');
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '') + (type === 'celebrate' ? ' celebrate' : '');
  el.innerHTML = `<span class="toast-ic" aria-hidden="true">${icon}</span><span>${escapeHtml(message)}</span>`;
  host.appendChild(el);
  const dismissAfter = type === 'celebrate' ? 4200 : 3200;
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; setTimeout(() => el.remove(), 300); }, dismissAfter);
}

function departmentById(id) { return getDepartments().find((d) => d.id === id); }

/* ---- Generic modal accessibility (focus trap + Escape-to-close) ---- */
function initModalA11y() {
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  document.addEventListener('keydown', (e) => {
    const openModal = document.querySelector('.modal-backdrop.open');
    if (!openModal) return;

    if (e.key === 'Escape') {
      const closer = openModal.querySelector('[id*="close" i], [id*="cancel" i], .btn-ghost');
      if (closer) closer.click(); else openModal.classList.remove('open');
      return;
    }

    if (e.key === 'Tab') {
      const focusables = Array.from(openModal.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Move focus into a modal the moment it opens, for keyboard and screen-reader users.
  document.querySelectorAll('.modal-backdrop').forEach((modal) => {
    const observer = new MutationObserver(() => {
      if (modal.classList.contains('open')) {
        const target = modal.querySelector(FOCUSABLE);
        if (target) setTimeout(() => target.focus(), 30);
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
  });
}

/* ---- Generic dashboard table toolbar: search + sortable headers + pagination ---- */
const TABLE_PAGE_SIZE = 12;
const _tablePagerState = new WeakMap(); // tbody -> { page }
const _tableObserved = new WeakSet();   // tbody -> already has a paging MutationObserver

function watchTableBody(tbody) {
  if (_tableObserved.has(tbody)) return;
  _tableObserved.add(tbody);
  new MutationObserver(() => refreshTablePaging(tbody)).observe(tbody, { childList: true });
  refreshTablePaging(tbody);
}

function initTableToolbars() {
  // Search boxes: <input class="table-search" data-target="tbodyId">
  document.querySelectorAll('.table-search').forEach((input) => {
    const tbody = document.getElementById(input.dataset.target);
    if (!tbody) return;
    input.addEventListener('input', () => {
      _tablePagerState.set(tbody, { page: 1 }); // a new search always starts back at page 1
      refreshTablePaging(tbody);
    });
    watchTableBody(tbody);
  });

  // Sortable headers: <th data-sort="text|number">
  document.querySelectorAll('table').forEach((table) => {
    const headers = Array.from(table.querySelectorAll('th[data-sort]'));
    if (!headers.length) return;
    const tbody = table.querySelector('tbody');
    headers.forEach((th) => {
      th.addEventListener('click', () => {
        const asc = th.dataset.sortDir !== 'asc';
        headers.forEach((h) => { h.dataset.sortDir = ''; h.classList.remove('sort-asc', 'sort-desc'); });
        th.dataset.sortDir = asc ? 'asc' : 'desc';
        th.classList.add(asc ? 'sort-asc' : 'sort-desc');
        const index = Array.from(th.parentElement.children).indexOf(th);
        const isNumeric = th.dataset.sort === 'number';
        const rows = Array.from(tbody.rows);
        rows.sort((a, b) => {
          const av = a.cells[index] ? a.cells[index].textContent.trim() : '';
          const bv = b.cells[index] ? b.cells[index].textContent.trim() : '';
          if (isNumeric) {
            const an = parseFloat(av.replace(/[^\d.-]/g, '')) || 0;
            const bn = parseFloat(bv.replace(/[^\d.-]/g, '')) || 0;
            return asc ? an - bn : bn - an;
          }
          return asc ? av.localeCompare(bv) : bv.localeCompare(av);
        });
        rows.forEach((row) => tbody.appendChild(row)); // triggers the MutationObserver above, which re-paginates
      });
    });
  });

  // Make sure every dashboard table paginates, even ones with no search box.
  document.querySelectorAll('.table-wrap tbody[id]').forEach(watchTableBody);
}

function refreshTablePaging(tbody) {
  const input = document.querySelector(`.table-search[data-target="${tbody.id}"]`);
  const q = input ? input.value.trim().toLowerCase() : '';
  const allRows = Array.from(tbody.rows);
  const matched = allRows.filter((row) => !q || row.textContent.toLowerCase().includes(q));
  const unmatched = allRows.filter((row) => !matched.includes(row));
  unmatched.forEach((row) => { row.style.display = 'none'; });

  const state = _tablePagerState.get(tbody) || { page: 1 };
  const totalPages = Math.max(1, Math.ceil(matched.length / TABLE_PAGE_SIZE));
  state.page = Math.min(Math.max(1, state.page), totalPages);
  _tablePagerState.set(tbody, state);

  matched.forEach((row, i) => {
    const onPage = i >= (state.page - 1) * TABLE_PAGE_SIZE && i < state.page * TABLE_PAGE_SIZE;
    row.style.display = onPage ? '' : 'none';
  });

  renderTablePager(tbody, matched.length, state.page, totalPages);
}

function renderTablePager(tbody, totalRows, page, totalPages) {
  const wrap = tbody.closest('.table-wrap');
  if (!wrap) return;
  let pager = wrap.nextElementSibling;
  if (!pager || !pager.classList.contains('table-pager')) {
    pager = document.createElement('div');
    pager.className = 'table-pager';
    wrap.after(pager);
  }
  if (totalRows === 0) { pager.innerHTML = ''; return; }
  const from = totalRows === 0 ? 0 : (page - 1) * TABLE_PAGE_SIZE + 1;
  const to = Math.min(page * TABLE_PAGE_SIZE, totalRows);
  pager.innerHTML = `
    <span class="table-pager-count">${from}–${to} of ${totalRows}</span>
    <div class="table-pager-btns">
      <button type="button" class="btn btn-ghost btn-sm" data-page-dir="-1" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
      <span class="table-pager-page">Page ${page} of ${totalPages}</span>
      <button type="button" class="btn btn-ghost btn-sm" data-page-dir="1" ${page >= totalPages ? 'disabled' : ''}>Next →</button>
    </div>`;
  pager.querySelectorAll('[data-page-dir]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const state = _tablePagerState.get(tbody) || { page: 1 };
      state.page += Number(btn.dataset.pageDir);
      _tablePagerState.set(tbody, state);
      refreshTablePaging(tbody);
    });
  });
}

/* ---------------------------------------------------------------------- */
/* 4. SHARED UI BEHAVIORS (present on every page)                          */
/* ---------------------------------------------------------------------- */
function initLoadingScreen() {
  const el = document.getElementById('loadingScreen');
  if (!el) return;
  // Safety net — never let the loading screen get stuck if something
  // upstream throws before hideLoadingScreen() is called.
  setTimeout(() => el.classList.add('hide'), 6000);
}
function hideLoadingScreen() {
  const el = document.getElementById('loadingScreen');
  if (el) el.classList.add('hide');
}

function initTheme() {
  const saved = localStorage.getItem(LS.THEME) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    updateThemeIcon(btn, saved);
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(LS.THEME, next);
      document.querySelectorAll('.theme-toggle').forEach((b) => updateThemeIcon(b, next));
    });
  });
}
function updateThemeIcon(btn, theme) {
  btn.innerHTML = theme === 'dark'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.5A8.5 8.5 0 1 1 11.5 3 7 7 0 0 0 21 12.5Z"/></svg>';
}

function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));
}

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 420));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
}

/* Global click-ripple micro-interaction for every .btn, site-wide. Purely
   cosmetic (adds/removes a short-lived span) — never touches app logic. */
function initRippleEffect() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

function initActiveNavLink() {
  const page = document.body.dataset.page;
  document.querySelectorAll('.nav-links a[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === page);
  });
}

/* File → data URL, used by both the (future) direct-upload flow and modals */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Trigger a file's Read action — opens the book in a new tab instead of
   downloading it, whenever the file type supports in-browser rendering. */
function readBook(book) {
  const url = book.fileUrl || book.fileData;
  if (!url) { showToast('No file attached — this is a sample catalog entry.', 'error'); return; }
  const isImage = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(book.fileType);
  const isOfficeDoc = ['DOCX', 'PPT', 'PPTX'].includes(book.fileType);
  const isPublicUrl = /^https?:\/\//.test(url); // Office viewer needs a public URL, not a base64 data: URL

  if (book.fileType === 'PDF' || isImage) {
    const w = window.open('');
    if (w) {
      w.document.write(`<title>${escapeHtml(book.title)}</title><body style="margin:0;background:#333;">${
        book.fileType === 'PDF'
          ? `<embed src="${url}" style="width:100%;height:100vh;" type="application/pdf" />`
          : `<img src="${url}" style="max-width:100%;display:block;margin:0 auto;" loading="lazy" />`
      }</body>`);
    }
  } else if (isOfficeDoc && isPublicUrl) {
    // Render Word/PowerPoint files in-browser using Microsoft's free Office
    // Online viewer, which can embed any publicly reachable .docx/.ppt/.pptx.
    const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    const w = window.open('');
    if (w) {
      w.document.write(`<title>${escapeHtml(book.title)}</title><body style="margin:0;">
        <iframe src="${viewerUrl}" style="width:100%;height:100vh;border:0;"></iframe>
      </body>`);
    }
  } else {
    showToast(isOfficeDoc
      ? 'In-browser reading needs the file to be stored on Supabase first — downloading instead.'
      : 'This file type opens best after downloading. Starting download…');
    downloadBook(book);
  }
}
async function downloadBook(book) {
  const url = book.fileUrl || book.fileData;
  if (!url) { showToast('No file attached — this is a sample catalog entry.', 'error'); return; }
  try {
    // fileUrl points to Supabase Storage (a different origin), so fetch it as a
    // blob first — the `download` attribute is ignored on plain cross-origin links.
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = book.fileName || (book.title + '.' + (book.fileType || 'pdf').toLowerCase());
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    window.open(url, '_blank');
  }
}

/* ---------------------------------------------------------------------- */
/* 4B. SHARED USER WIDGETS — nav login/account control, auth modal,        */
/*     cart modal, and the cart-aware checkout modal (used on every        */
/*     public page: home, store, details).                                 */
/* ---------------------------------------------------------------------- */

function injectUserNavControls() {
  document.querySelectorAll('.nav-links').forEach((nav) => {
    if (nav.querySelector('.js-user-nav')) return; // already injected (e.g. duplicate mobile block)
    const wrap = document.createElement('span');
    wrap.className = 'js-user-nav';
    wrap.style.display = 'contents';
    nav.appendChild(wrap);
  });
  // Cart icon lives at the nav-inner level, next to the theme toggle, so it's
  // always visible (not tucked into the mobile hamburger menu).
  document.querySelectorAll('.nav-inner').forEach((inner) => {
    if (inner.querySelector('.js-cart-btn')) return;
    const themeBtn = inner.querySelector('.theme-toggle');
    if (!themeBtn) return;
    const cartBtn = document.createElement('button');
    cartBtn.className = 'icon-btn js-cart-btn';
    cartBtn.setAttribute('aria-label', 'View cart');
    cartBtn.style.position = 'relative';
    cartBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span class="cart-count-badge">0</span>`;
    cartBtn.addEventListener('click', openCartModal);
    themeBtn.insertAdjacentElement('beforebegin', cartBtn);
  });
  renderUserNavState();
  updateCartBadge();
}

function renderUserNavState() {
  const user = getCurrentUser();
  document.querySelectorAll('.js-user-nav').forEach((wrap) => {
    wrap.innerHTML = user
      ? userAvatarMenuHtml(user)
      : `<a href="#" class="nav-cta" data-open-auth="login">Login / Sign Up</a>`;
  });
  document.querySelectorAll('[data-open-auth]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(a.dataset.openAuth || 'login');
  }));
  wireUserAvatarMenus();
}

/* ---- Avatar + dropdown menu (replaces the old nav "Profile" link) ---- */
function userAvatarMenuHtml(user) {
  const initials = escapeHtml(initialsOf(user.fullName));
  return `
    <div class="user-menu">
      <button type="button" class="user-avatar-btn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
        <span class="user-avatar-initials">${initials}</span>
      </button>
      <div class="user-menu-dropdown dropdown-panel" role="menu">
        <div class="user-menu-head">
          <span class="user-avatar-initials-sm">${initials}</span>
          <div><strong>${escapeHtml(user.fullName)}</strong><span>${escapeHtml(user.email)}</span></div>
        </div>
        <a href="user-dashboard.html#profile" role="menuitem">👤 My Profile</a>
        <a href="user-dashboard.html#edit-profile" role="menuitem">✏️ Edit Profile</a>
        <a href="user-dashboard.html#overview" role="menuitem">📊 My Dashboard</a>
        <a href="user-dashboard.html#settings" role="menuitem">⚙️ Settings</a>
        <a href="user-dashboard.html#edit-profile-password" role="menuitem">🔒 Change Password</a>
        <div class="user-menu-divider"></div>
        <button type="button" class="user-menu-logout" role="menuitem">↩ Logout</button>
      </div>
    </div>`;
}
function wireUserAvatarMenus() {
  document.querySelectorAll('.user-menu').forEach((menu) => {
    const btn = menu.querySelector('.user-avatar-btn');
    const dropdown = menu.querySelector('.user-menu-dropdown');
    const logoutBtn = menu.querySelector('.user-menu-logout');
    if (!btn || !dropdown || btn._wired) return;
    btn._wired = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    logoutBtn?.addEventListener('click', async () => {
      await logoutUser();
      window.location.href = 'index.html';
    });
  });
  if (!window._userMenuGlobalWired) {
    document.addEventListener('click', () => document.querySelectorAll('.user-menu-dropdown.open').forEach((d) => d.classList.remove('open')));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.user-menu-dropdown.open').forEach((d) => d.classList.remove('open')); });
    window._userMenuGlobalWired = true;
  }
}

/* ---- small inline icon set for the auth modal (kept local to avoid a dependency) ---- */
const AUTH_ICONS = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
  at: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.6 7.2"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l1.5 4.5-2 1.3a12 12 0 0 0 6.7 6.7l1.3-2L19 16v3a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.2 2 2 0 0 1 5 4Z"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.8l1-1.6h7.4l1 1.6h1.8A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="13" r="3.2"/></svg>',
  eyeOpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.4 4.2M6.3 6.3A16.6 16.6 0 0 0 2 12s3.6 7 10 7c1.4 0 2.7-.3 3.8-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  google: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23 12.27c0-.85-.08-1.48-.24-2.14H12v3.86h6.3c-.13 1.02-.82 2.56-2.36 3.6l3.63 2.8C21.6 18.3 23 15.6 23 12.27Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.06 7.94-2.87l-3.63-2.8c-1 .67-2.34 1.14-4.31 1.14-3.32 0-6.13-2.24-7.13-5.26l-3.7 2.86C2.99 21.3 7.14 24 12 24Z"/><path fill="#FBBC05" d="M4.87 14.21A7.5 7.5 0 0 1 4.5 12c0-.77.13-1.51.36-2.21L1.16 6.93A11.9 11.9 0 0 0 0 12c0 1.93.46 3.76 1.16 5.07l3.71-2.86Z"/><path fill="#EA4335" d="M12 4.75c2.28 0 3.82.98 4.7 1.8l3.23-3.15C17.94 1.4 15.24 0 12 0 7.14 0 2.99 2.7 1.16 6.93l3.71 2.86c1-3.02 3.81-5.04 7.13-5.04Z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.7 5.6.7 12c0 5.1 3.3 9.4 7.9 11 .6.1.8-.2.8-.6v-2.2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2A11.5 11.5 0 0 1 12 5.8c1 0 2 .1 3 .4 2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.6 4.6-1.6 7.9-5.9 7.9-11C23.3 5.6 18.3.5 12 .5Z"/></svg>',
};

function authField({ id, label, icon, type = 'text', required = true, placeholder = '', optional = false, autocomplete = '' }) {
  return `<div class="auth-field">
    <label for="${id}">${label}${optional ? ' <span class="auth-optional">(optional)</span>' : ''}</label>
    <div class="auth-input-wrap">
      <span class="auth-input-ic">${icon}</span>
      <input type="${type}" id="${id}" ${placeholder ? `placeholder="${placeholder}"` : ''} ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${required ? 'required' : ''} />
    </div>
  </div>`;
}
function authPasswordField({ id, label, autocomplete = '' }) {
  return `<div class="auth-field">
    <label for="${id}">${label}</label>
    <div class="auth-input-wrap">
      <span class="auth-input-ic">${AUTH_ICONS.lock}</span>
      <input type="password" id="${id}" autocomplete="${autocomplete}" required />
      <button type="button" class="auth-pw-toggle" data-toggle-for="${id}" aria-label="Show password">${AUTH_ICONS.eyeOpen}</button>
    </div>
  </div>`;
}
function passwordStrength(pw) {
  const levels = [
    { pct: 20, label: 'Very weak', color: '#c0392b' },
    { pct: 40, label: 'Weak', color: '#d97706' },
    { pct: 60, label: 'Fair', color: '#d9a441' },
    { pct: 80, label: 'Good', color: '#2e9563' },
    { pct: 100, label: 'Strong', color: '#1c6b46' },
  ];
  if (!pw) return { pct: 0, label: '', color: 'var(--border)' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return levels[Math.min(score, levels.length - 1)];
}

function ensureAuthModal() {
  if (document.getElementById('userAuthModal')) return;
  const div = document.createElement('div');
  div.className = 'modal-backdrop auth-modal-v2';
  div.id = 'userAuthModal';
  div.innerHTML = `
    <div class="auth-blob auth-blob-1"></div>
    <div class="auth-blob auth-blob-2"></div>
    <div class="auth-glass-card" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
      <button type="button" class="auth-close-btn" id="authModalCloseBtn" aria-label="Close">✕</button>

      <div class="auth-modal-head">
        <span class="auth-modal-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
        </span>
        <h2 class="auth-modal-title" id="authModalTitle">Welcome back</h2>
        <p class="auth-modal-sub" id="authModalSub">Sign in to continue to Online Library</p>
      </div>

      <div class="auth-tabbar" id="authTabbar" data-active="login">
        <button type="button" class="auth-tab-btn active" data-auth-tab="login" role="tab" aria-selected="true">Login</button>
        <button type="button" class="auth-tab-btn" data-auth-tab="signup" role="tab" aria-selected="false">Sign Up</button>
        <span class="auth-tab-indicator"></span>
      </div>

      <div class="auth-panes">
        <div class="auth-pane active" id="authPaneLogin" role="tabpanel">
          <form id="userLoginForm" novalidate>
            ${authField({ id: 'loginIdentifier', label: 'Email or mobile number', icon: AUTH_ICONS.user, autocomplete: 'username' })}
            ${authPasswordField({ id: 'loginPassword', label: 'Password', autocomplete: 'current-password' })}
            <div class="auth-row-between">
              <label class="auth-checkbox"><input type="checkbox" id="loginRemember" /> <span>Remember me</span></label>
              <a href="#" class="auth-link-sm" id="forgotPasswordLink">Forgot password?</a>
            </div>
            <div class="auth-error" id="userLoginError"></div>
            <button type="submit" class="btn btn-primary btn-block auth-submit-btn mt-1">
              <span class="auth-btn-label">Sign in</span><span class="auth-btn-spinner"></span>
            </button>
          </form>
          <div class="auth-divider"><span>or continue with</span></div>
          <div class="auth-social-row">
            <button type="button" class="auth-social-btn" data-oauth="google">${AUTH_ICONS.google}<span>Google</span></button>
            <button type="button" class="auth-social-btn" data-oauth="github">${AUTH_ICONS.github}<span>GitHub</span></button>
          </div>
          <p class="auth-switch-line">New here? <button type="button" class="auth-link-sm" data-auth-tab="signup">Create an account</button></p>
        </div>

        <div class="auth-pane" id="authPaneSignup" role="tabpanel">
          <form id="userSignupForm" novalidate>
            <div class="auth-avatar-drop" id="avatarDrop">
              <input type="file" id="suAvatarInput" accept="image/jpeg,image/png,image/webp" hidden />
              <div class="auth-avatar-circle" id="avatarCircle">
                <span id="avatarPlaceholderIcon">${AUTH_ICONS.camera}</span>
                <img id="avatarPreviewImg" alt="Profile preview" style="display:none;" />
              </div>
              <div class="auth-avatar-actions">
                <button type="button" class="auth-avatar-btn" id="avatarChooseBtn">Upload photo</button>
                <button type="button" class="auth-avatar-btn auth-avatar-remove" id="avatarRemoveBtn" style="display:none;">Remove</button>
              </div>
              <p class="auth-avatar-hint">JPG, PNG or WebP — drag &amp; drop or click</p>
            </div>

            ${authField({ id: 'suFullName', label: 'Full name', icon: AUTH_ICONS.user, autocomplete: 'name' })}
            ${authField({ id: 'suUsername', label: 'Username', icon: AUTH_ICONS.at, required: false, optional: true })}
            ${authField({ id: 'suMobile', label: 'Mobile number', icon: AUTH_ICONS.phone, placeholder: '01XXXXXXXXX', autocomplete: 'tel' })}
            ${authField({ id: 'suEmail', label: 'Email address', icon: AUTH_ICONS.mail, type: 'email', autocomplete: 'email' })}
            ${authField({ id: 'suAddress', label: 'Full address', icon: AUTH_ICONS.map, autocomplete: 'street-address' })}
            ${authField({ id: 'suPhone', label: 'Phone number', icon: AUTH_ICONS.phone, required: false, optional: true, autocomplete: 'tel' })}

            <div class="auth-field">
              <label for="suPassword">Password</label>
              <div class="auth-input-wrap">
                <span class="auth-input-ic">${AUTH_ICONS.lock}</span>
                <input type="password" id="suPassword" autocomplete="new-password" required />
                <button type="button" class="auth-pw-toggle" data-toggle-for="suPassword" aria-label="Show password">${AUTH_ICONS.eyeOpen}</button>
              </div>
              <div class="auth-pw-strength">
                <div class="auth-pw-strength-bar"><span id="pwStrengthFill"></span></div>
                <span class="auth-pw-strength-label" id="pwStrengthLabel"></span>
              </div>
            </div>
            ${authPasswordField({ id: 'suConfirmPassword', label: 'Confirm password', autocomplete: 'new-password' })}

            <label class="auth-checkbox auth-terms">
              <input type="checkbox" id="suTerms" required />
              <span>I agree to the <a href="#" class="auth-link-sm">Terms &amp; Conditions</a></span>
            </label>

            <div class="auth-error" id="userSignupError"></div>
            <button type="submit" class="btn btn-primary btn-block auth-submit-btn mt-1">
              <span class="auth-btn-label">Create account</span><span class="auth-btn-spinner"></span>
            </button>
          </form>
          <p class="auth-switch-line">Already have an account? <button type="button" class="auth-link-sm" data-auth-tab="login">Sign in</button></p>
        </div>
      </div>
    </div>`;
  document.body.appendChild(div);

  /* ---- Tabs (with sliding pill + animated title) ---- */
  const tabbar = div.querySelector('#authTabbar');
  const tabBtns = div.querySelectorAll('.auth-tab-btn');
  const titleEl = div.querySelector('#authModalTitle');
  const subEl = div.querySelector('#authModalSub');
  function showTab(tab) {
    tabbar.dataset.active = tab;
    tabBtns.forEach((b) => {
      const active = b.dataset.authTab === tab;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    div.querySelector('#authPaneLogin').classList.toggle('active', tab === 'login');
    div.querySelector('#authPaneSignup').classList.toggle('active', tab === 'signup');
    titleEl.textContent = tab === 'login' ? 'Welcome back' : 'Create your account';
    subEl.textContent = tab === 'login' ? 'Sign in to continue to Online Library' : 'Join Online Library in a few seconds';
  }
  div.querySelectorAll('[data-auth-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.authTab)));
  div._showTab = showTab;

  /* ---- Close behaviors (animated) ---- */
  div.querySelector('#authModalCloseBtn').addEventListener('click', closeAuthModal);
  div.addEventListener('click', (e) => { if (e.target === div) closeAuthModal(); });

  /* ---- Button ripple ---- */
  div.querySelectorAll('.auth-submit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'auth-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  /* ---- Password show/hide toggles ---- */
  div.querySelectorAll('.auth-pw-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = div.querySelector(`#${btn.dataset.toggleFor}`);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? AUTH_ICONS.eyeOff : AUTH_ICONS.eyeOpen;
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  /* ---- Password strength meter ---- */
  const pwInput = div.querySelector('#suPassword');
  const pwFill = div.querySelector('#pwStrengthFill');
  const pwLabel = div.querySelector('#pwStrengthLabel');
  pwInput.addEventListener('input', () => {
    const s = passwordStrength(pwInput.value);
    pwFill.style.width = `${s.pct}%`;
    pwFill.style.background = s.color;
    pwLabel.textContent = pwInput.value ? s.label : '';
  });

  /* ---- Avatar upload: click, drag & drop, preview, remove ----
     The selected File is stashed on the modal element (div._avatarFile) so a
     future step can hand it to Supabase Storage without touching this UI. */
  const avatarDrop = div.querySelector('#avatarDrop');
  const avatarInput = div.querySelector('#suAvatarInput');
  const avatarImg = div.querySelector('#avatarPreviewImg');
  const avatarPlaceholder = div.querySelector('#avatarPlaceholderIcon');
  const chooseBtn = div.querySelector('#avatarChooseBtn');
  const removeBtn = div.querySelector('#avatarRemoveBtn');

  function setAvatarFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      showToast('Please choose a JPG, PNG, or WebP image.', 'error');
      return;
    }
    div._avatarFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      avatarImg.src = reader.result;
      avatarImg.style.display = 'block';
      avatarPlaceholder.style.display = 'none';
      chooseBtn.textContent = 'Change photo';
      removeBtn.style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
  }
  function clearAvatar() {
    div._avatarFile = null;
    avatarInput.value = '';
    avatarImg.removeAttribute('src');
    avatarImg.style.display = 'none';
    avatarPlaceholder.style.display = 'block';
    chooseBtn.textContent = 'Upload photo';
    removeBtn.style.display = 'none';
  }
  chooseBtn.addEventListener('click', () => avatarInput.click());
  removeBtn.addEventListener('click', clearAvatar);
  avatarInput.addEventListener('change', () => setAvatarFile(avatarInput.files[0]));
  ['dragenter', 'dragover'].forEach((evt) => avatarDrop.addEventListener(evt, (e) => { e.preventDefault(); avatarDrop.classList.add('drag-over'); }));
  ['dragleave', 'drop'].forEach((evt) => avatarDrop.addEventListener(evt, (e) => { e.preventDefault(); avatarDrop.classList.remove('drag-over'); }));
  avatarDrop.addEventListener('drop', (e) => setAvatarFile(e.dataTransfer.files[0]));

  /* ---- Forgot password (uses Supabase Auth's built-in reset email) ---- */
  div.querySelector('#forgotPasswordLink').addEventListener('click', async (e) => {
    e.preventDefault();
    const identifier = div.querySelector('#loginIdentifier').value.trim();
    if (!identifier || !identifier.includes('@')) {
      showToast('Enter your email above first, then click "Forgot password?".', 'error');
      return;
    }
    if (!sb) { showToast('Password reset needs Supabase to be configured.', 'error'); return; }
    try {
      await sb.auth.resetPasswordForEmail(identifier);
      showToast('If that email has an account, a reset link is on its way.');
    } catch (err) {
      showToast(err.message || 'Could not send the reset link.', 'error');
    }
  });

  /* ---- Social login — optional, only works once a Supabase OAuth provider is enabled ---- */
  div.querySelectorAll('[data-oauth]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!sb) { showToast('Social login needs Supabase to be configured.', 'error'); return; }
      try {
        await sb.auth.signInWithOAuth({ provider: btn.dataset.oauth });
      } catch (err) {
        showToast(err.message || 'Could not start social login.', 'error');
      }
    });
  });

  /* ---- Login submit (unchanged backend call, just adds a loading state) ---- */
  const loginForm = div.querySelector('#userLoginForm');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = div.querySelector('#userLoginError');
    const submitBtn = loginForm.querySelector('.auth-submit-btn');
    setFieldError(errorEl, '');
    const identifier = div.querySelector('#loginIdentifier').value;
    const password = div.querySelector('#loginPassword').value;
    try { localStorage.setItem('lib_remember_me', div.querySelector('#loginRemember').checked ? '1' : '0'); } catch (_) {}
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    try {
      await loginUser(identifier, password);
      showToast('Welcome back!');
      window.location.href = 'user-dashboard.html';
    } catch (err) {
      setFieldError(errorEl, err.message || 'Could not log in.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  /* ---- Signup submit (unchanged backend call — extra fields are ignored
     by signupUser(), and the avatar file rides along ready for later use) ---- */
  const signupForm = div.querySelector('#userSignupForm');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = div.querySelector('#userSignupError');
    const submitBtn = signupForm.querySelector('.auth-submit-btn');
    setFieldError(errorEl, '');
    if (!div.querySelector('#suTerms').checked) {
      setFieldError(errorEl, 'Please accept the Terms & Conditions to continue.');
      return;
    }
    const payload = {
      fullName: div.querySelector('#suFullName').value,
      username: div.querySelector('#suUsername').value,
      mobile: div.querySelector('#suMobile').value,
      email: div.querySelector('#suEmail').value,
      address: div.querySelector('#suAddress').value,
      phone: div.querySelector('#suPhone').value,
      password: div.querySelector('#suPassword').value,
      confirmPassword: div.querySelector('#suConfirmPassword').value,
      avatarFile: div._avatarFile || null,
    };
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    try {
      await signupUser(payload);
      showToast('Account created! Welcome to Online Library.');
      window.location.href = 'user-dashboard.html';
    } catch (err) {
      setFieldError(errorEl, err.message || 'Could not create your account.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
}
function setFieldError(el, msg) {
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('show', !!msg);
}

/* ---- "Forgot password" step 2: the email link brings the visitor back here
   with a Supabase recovery session. This modal is what lets them actually
   set a new password — without it, the "Forgot password?" link only sent an
   email but never let anyone finish resetting anything. ---- */
function ensureResetPasswordModal() {
  if (document.getElementById('resetPasswordModal')) return;
  const div = document.createElement('div');
  div.className = 'modal-backdrop';
  div.id = 'resetPasswordModal';
  div.innerHTML = `
    <div class="modal auth-glass-card" style="max-width:420px;">
      <h3>Set a new password</h3>
      <p class="text-muted" style="margin-bottom:1rem;">You clicked a password reset link. Choose a new password to finish.</p>
      <form id="resetPasswordForm" novalidate>
        <div class="form-row"><label for="resetPwNew">New password</label><input type="password" id="resetPwNew" autocomplete="new-password" required /></div>
        <div class="form-row"><label for="resetPwConfirm">Confirm new password</label><input type="password" id="resetPwConfirm" autocomplete="new-password" required /></div>
        <div class="auth-error" id="resetPwError"></div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary btn-block auth-submit-btn" id="resetPwSubmitBtn">
            <span class="auth-btn-label">Update password</span><span class="auth-btn-spinner"></span>
          </button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(div);
  div.querySelector('#resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = div.querySelector('#resetPwError');
    const submitBtn = div.querySelector('#resetPwSubmitBtn');
    const pw = div.querySelector('#resetPwNew').value;
    const confirm = div.querySelector('#resetPwConfirm').value;
    errorEl.textContent = '';
    if (!isStrongPassword(pw)) { errorEl.textContent = 'Password must be at least 8 characters and include both letters and numbers.'; return; }
    if (pw !== confirm) { errorEl.textContent = 'Passwords do not match.'; return; }
    submitBtn.disabled = true;
    try {
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      div.classList.remove('open');
      showToast('Password updated — you are now logged in.', 'celebrate');
      await refreshAuthSession();
      await loadUsers();
      renderUserNavState?.();
    } catch (err) {
      errorEl.textContent = err.message || 'Could not update your password. Request a new reset link and try again.';
    } finally {
      submitBtn.disabled = false;
    }
  });
}
function openResetPasswordModal() {
  ensureResetPasswordModal();
  document.getElementById('resetPasswordModal').classList.add('open');
}

function openAuthModal(tab = 'login') {
  ensureAuthModal();
  const modal = document.getElementById('userAuthModal');
  modal.classList.remove('closing');
  modal._showTab(tab);
  modal.classList.add('open');
}

function closeAuthModal() {
  const modal = document.getElementById('userAuthModal');
  if (!modal || !modal.classList.contains('open')) return;
  modal.classList.add('closing');
  const card = modal.querySelector('.auth-glass-card');
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    modal.classList.remove('open', 'closing');
  };
  if (card) card.addEventListener('animationend', finish, { once: true });
  setTimeout(finish, 400); // fallback in case animationend doesn't fire
}

function requireLogin(promptMessage) {
  if (isLoggedIn()) return true;
  showToast(promptMessage || 'Please log in to continue.', 'error');
  openAuthModal('login');
  return false;
}

/* ---- Cart modal ---- */
function ensureCartModal() {
  if (document.getElementById('cartModal')) return;
  const div = document.createElement('div');
  div.className = 'modal-backdrop';
  div.id = 'cartModal';
  div.innerHTML = `
    <div class="modal" style="max-width:560px;">
      <h3>Your cart</h3>
      <div id="cartModalBody"></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" id="closeCartModalBtn">Close</button>
        <button type="button" class="btn btn-primary" id="cartCheckoutBtn">Checkout</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.querySelector('#closeCartModalBtn').addEventListener('click', () => div.classList.remove('open'));
  div.addEventListener('click', (e) => { if (e.target === div) div.classList.remove('open'); });
  div.querySelector('#cartCheckoutBtn').addEventListener('click', () => {
    const items = cartLineItems();
    if (!items.length) { showToast('Your cart is empty.', 'error'); return; }
    div.classList.remove('open');
    openCheckoutModal(items, { fromCart: true });
  });
}
function renderCartModalBody() {
  const body = document.getElementById('cartModalBody');
  if (!body) return;
  const items = cartLineItems();
  if (!items.length) {
    body.innerHTML = '<p class="text-muted" style="margin:1rem 0;">Your cart is empty — add a book from the store.</p>';
    return;
  }
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  body.innerHTML = items.map((i) => `
    <div class="recent-item">
      <div style="flex:1;">
        <h5>${escapeHtml(i.title)}</h5>
        <span>৳${i.price.toFixed(0)} each${!i.available ? ' · No longer available' : ''}</span>
      </div>
      <input type="number" min="1" value="${i.qty}" class="cart-qty-input" data-cart-qty="${i.bookId}" style="width:60px;padding:.4rem;border-radius:8px;border:1px solid var(--border);" />
      <button class="btn btn-danger btn-sm" data-cart-remove="${i.bookId}">Remove</button>
    </div>`).join('') + `<p style="text-align:right;font-weight:700;margin-top:.8rem;">Total: ৳${total.toFixed(0)}</p>`;

  body.querySelectorAll('[data-cart-qty]').forEach((input) => input.addEventListener('change', () => {
    setCartQty(input.dataset.cartQty, Number(input.value));
    renderCartModalBody();
  }));
  body.querySelectorAll('[data-cart-remove]').forEach((btn) => btn.addEventListener('click', () => {
    removeFromCart(btn.dataset.cartRemove);
    renderCartModalBody();
  }));
}
function openCartModal() {
  if (!requireLogin('Please log in to view your cart.')) return;
  ensureCartModal();
  renderCartModalBody();
  document.getElementById('cartModal').classList.add('open');
}

/* ---- Checkout modal (single "Buy Now" item, or the whole cart) ---- */
function ensureCheckoutModal() {
  if (document.getElementById('checkoutModal')) return;
  const div = document.createElement('div');
  div.className = 'modal-backdrop';
  div.id = 'checkoutModal';
  div.innerHTML = `
    <div class="modal" style="max-width:520px;">
      <h3>Checkout</h3>
      <div id="checkoutItemsList" style="margin-bottom:1rem;"></div>
      <form id="checkoutForm">
        <div class="form-row"><label for="checkoutAddress">Delivery address</label><input type="text" id="checkoutAddress" required /></div>
        <div class="form-row"><label for="checkoutPayment">Payment method</label>
          <select id="checkoutPayment">
            ${PAYMENT_METHODS.map((m) => `<option value="${m}"${m === 'Card Payment' ? ' disabled' : ''}>${m}${m === 'Card Payment' ? ' (coming soon)' : ''}</option>`).join('')}
          </select>
        </div>
        <div class="mobile-banking-box hidden-init" id="mobileBankingBox">
          <p id="mobileBankingInstructions"></p>
          <div class="form-row"><label for="checkoutTrxId">Transaction ID (TrxID)</label><input type="text" id="checkoutTrxId" placeholder="e.g. 9G7H3K2L1M" /></div>
        </div>
        <div class="form-row"><label for="checkoutNote">Note (optional)</label><textarea id="checkoutNote" rows="2"></textarea></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="closeCheckoutBtn">Cancel</button>
          <button type="submit" class="btn btn-primary">Place order</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(div);
  div.querySelector('#closeCheckoutBtn').addEventListener('click', () => div.classList.remove('open'));
  div.addEventListener('click', (e) => { if (e.target === div) div.classList.remove('open'); });
  const paymentSelect = div.querySelector('#checkoutPayment');
  const bankingBox = div.querySelector('#mobileBankingBox');
  const bankingInstructions = div.querySelector('#mobileBankingInstructions');
  const trxIdInput = div.querySelector('#checkoutTrxId');
  function syncPaymentFields() {
    const method = paymentSelect.value;
    const isMobileBanking = MOBILE_BANKING_METHODS.includes(method);
    bankingBox.classList.toggle('hidden-init', !isMobileBanking);
    if (isMobileBanking) {
      const total = (div._items || []).reduce((s, i) => s + i.price * i.qty, 0);
      bankingInstructions.innerHTML = `Send <strong>৳${total.toFixed(0)}</strong> to <strong>${escapeHtml(MOBILE_BANKING_NUMBERS[method] || '')}</strong> (${method} — Send Money), then enter the Transaction ID below. Your order stays <strong>Pending</strong> until an admin verifies the payment.`;
      trxIdInput.required = true;
    } else {
      trxIdInput.required = false;
    }
  }
  paymentSelect.addEventListener('change', syncPaymentFields);
  div._syncPaymentFields = syncPaymentFields;
  div.querySelector('#checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const items = div._items || [];
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await placeOrder({
        items,
        paymentMethod: document.getElementById('checkoutPayment').value,
        deliveryAddress: document.getElementById('checkoutAddress').value,
        note: document.getElementById('checkoutNote').value,
        trxId: document.getElementById('checkoutTrxId').value,
      });
      if (div._fromCart) saveCart([]);
      updateCartBadge();
      showToast('Order placed! Track it from My Orders.', 'celebrate');
      celebrateOrderSuccess();
      div.classList.remove('open');
      if (typeof renderMyOrders === 'function') renderMyOrders();
    } catch (err) {
      showToast(err.message || 'Something went wrong placing your order.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}
function openCheckoutModal(items, { fromCart = false } = {}) {
  if (!requireLogin('Please log in to place an order.')) return;
  const user = getCurrentUser();
  ensureCheckoutModal();
  const modal = document.getElementById('checkoutModal');
  modal._items = items;
  modal._fromCart = fromCart;
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('checkoutItemsList').innerHTML = items.map((i) =>
    `<div class="book-meta-line"><span>${escapeHtml(i.title)} × ${i.qty}</span><span>৳${(i.price * i.qty).toFixed(0)}</span></div>`
  ).join('') + `<div class="book-meta-line" style="font-weight:700;"><span>Total</span><span>৳${total.toFixed(0)}</span></div>`;
  document.getElementById('checkoutAddress').value = user.address || '';
  document.getElementById('checkoutTrxId').value = '';
  modal._syncPaymentFields?.();
  modal.classList.add('open');
}

/* ---- Gated Read/Download for academic books (login required) ---- */
async function handleReadClick(book) {
  if (!requireLogin('Please log in to read this book.')) return;
  readBook(book);
  await recordBookOpened(book);
}
async function handleDownloadClick(book) {
  if (!requireLogin('Please log in to download this book.')) return;
  const user = getCurrentUser();
  if (user && user.canDownload === false) {
    showToast('Your download permission has been disabled. Contact an admin.', 'error');
    return;
  }
  await downloadBook(book);
  await recordDownload(book);
}

/* ---------------------------------------------------------------------- */
/* 5. HOME PAGE LOGIC                                                      */
/* ---------------------------------------------------------------------- */
const homeState = { deptFilter: 'all', semFilter: 1 };

function initHomePage() {
  renderDepartmentCards();
  renderHeroStats();
  setupBrowsePanel();
  setupSearch();
  setupContactForm();
  initHeroParallax();

  document.querySelectorAll('[data-scroll-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.scrollTo);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* A gentle, mouse-following tilt on the hero illustration — skipped
   entirely on touch devices and when the visitor prefers reduced motion. */
function initHeroParallax() {
  const art = document.querySelector('.hero-art');
  const svg = art?.querySelector('svg');
  if (!art || !svg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
  art.addEventListener('mousemove', (e) => {
    const rect = art.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    svg.style.transform = `translate(${(x * -12).toFixed(1)}px, ${(y * -10).toFixed(1)}px)`;
  });
  art.addEventListener('mouseleave', () => { svg.style.transform = ''; });
}

function renderHeroStats() {
  const depts = getDepartments();
  const books = getBooks();
  const elDepts = document.getElementById('statDepts');
  const elBooks = document.getElementById('statBooks');
  const elCourses = document.getElementById('statCourses');
  if (elDepts) elDepts.textContent = depts.length;
  if (elBooks) elBooks.textContent = books.length;
  if (elCourses) {
    let total = 0;
    depts.forEach((d) => Object.values(d.courses || {}).forEach((arr) => (total += arr.length)));
    elCourses.textContent = total;
  }
}

/* Minimalist line-icon set for department cards (stroke=currentColor,
   matches the rest of the site's inline SVG icon style). Keyed by
   department id, with a generic "book-open" fallback for any custom
   department an admin adds. */
const DEPT_ICON_PATHS = {
  cse: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  math: '<path d="M18 7V5a1 1 0 0 0-1-1H6.5a.5.5 0 0 0-.4.8L11 12l-4.9 6.2a.5.5 0 0 0 .4.8H17a1 1 0 0 0 1-1v-2"/>',
  stat: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  psy: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',
};
const DEPT_ICON_FALLBACK = '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>';

function deptIconSvg(id) {
  const paths = DEPT_ICON_PATHS[id] || DEPT_ICON_FALLBACK;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

/* Short, non-redundant department code — falls back to initials for
   multi-word names, or the first few letters for single-word ones, so it
   never just repeats the full name already shown in the card heading. */
function deptCode(d) {
  const raw = (d.shortName && d.shortName.toLowerCase() !== d.name.toLowerCase()) ? d.shortName : d.name;
  const words = raw.trim().split(/\s+/).filter((w) => /[a-zA-Z]/.test(w));
  if (words.length > 1) return words.map((w) => w[0]).join('').toUpperCase().slice(0, 4);
  const letters = raw.replace(/[^a-zA-Z]/g, '');
  return (letters.slice(0, 3) || raw).toUpperCase();
}

function renderDepartmentCards() {
  const grid = document.getElementById('departmentGrid');
  if (!grid) return;
  const depts = getDepartments();
  const books = getBooks();
  grid.innerHTML = depts.map((d) => {
    const count = books.filter((b) => b.department === d.id).length;
    const countBadge = count > 0
      ? `<span class="dept-count has-books">${count} book${count === 1 ? '' : 's'}</span>`
      : `<span class="dept-count coming-soon">Coming soon</span>`;
    return `
    <div class="dept-card reveal" data-explore="${d.id}" role="link" tabindex="0" aria-label="Explore ${escapeHtml(d.name)}">
      ${countBadge}
      <div class="dept-icon">${deptIconSvg(d.id)}</div>
      <h3>${escapeHtml(d.name)}</h3>
      <div class="dept-meta">
        <span>${d.totalSemesters} Semesters</span>
        <span class="dept-code">${escapeHtml(deptCode(d))}</span>
      </div>
      <span class="dept-explore">Explore department
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
      </span>
    </div>`;
  }).join('');
  const goToDept = (id) => {
    homeState.deptFilter = id;
    homeState.semFilter = 1;
    document.getElementById('books').scrollIntoView({ behavior: 'smooth' });
    renderBrowsePanel();
  };
  grid.querySelectorAll('[data-explore]').forEach((card) => {
    card.addEventListener('click', () => goToDept(card.dataset.explore));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToDept(card.dataset.explore);
      }
    });
  });
  initReveal();
}

function setupBrowsePanel() {
  renderBrowsePanel();
}

function renderBrowsePanel() {
  const depts = getDepartments();
  const chipsWrap = document.getElementById('deptChips');
  const tabsWrap = document.getElementById('semTabs');
  const grid = document.getElementById('bookGrid');
  if (!chipsWrap || !tabsWrap || !grid) return;

  // Department chips (All + each department)
  chipsWrap.innerHTML = ['<button class="chip' + (homeState.deptFilter === 'all' ? ' active' : '') + '" data-dept="all">All departments</button>']
    .concat(depts.map((d) => `<button class="chip${homeState.deptFilter === d.id ? ' active' : ''}" data-dept="${d.id}">${d.icon} ${d.shortName}</button>`))
    .join('');
  chipsWrap.querySelectorAll('[data-dept]').forEach((chip) => {
    chip.addEventListener('click', () => {
      homeState.deptFilter = chip.dataset.dept;
      homeState.semFilter = 1;
      renderBrowsePanel();
    });
  });

  // Semester tabs — based on selected department (or the widest range if "all")
  const activeDept = homeState.deptFilter === 'all' ? null : depts.find((d) => d.id === homeState.deptFilter);
  const totalSem = activeDept ? activeDept.totalSemesters : Math.max(...depts.map((d) => d.totalSemesters));
  let tabs = '';
  for (let i = 1; i <= totalSem; i++) {
    tabs += `<button class="sem-tab${homeState.semFilter === i ? ' active' : ''}" data-sem="${i}">Semester ${i}</button>`;
  }
  tabsWrap.innerHTML = tabs;
  tabsWrap.querySelectorAll('[data-sem]').forEach((tab) => {
    tab.addEventListener('click', () => { homeState.semFilter = Number(tab.dataset.sem); renderBrowsePanel(); });
  });

  // Book grid
  const books = getBooks().filter((b) => {
    const deptOk = homeState.deptFilter === 'all' || b.department === homeState.deptFilter;
    const semOk = b.semester === homeState.semFilter;
    return deptOk && semOk;
  });
  grid.innerHTML = books.length ? books.map((b) => bookCardHtml(b)).join('') : emptyStateHtml('No books here yet', 'Try another semester or department — or ask an admin to upload one.');
  attachBookCardHandlers(grid);
}

function emptyStateHtml(title, sub) {
  return `<div class="empty-state" style="grid-column:1/-1;">
    <div class="glyph">📭</div>
    <h4>${escapeHtml(title)}</h4>
    <p>${escapeHtml(sub)}</p>
  </div>`;
}

function bookCardHtml(b) {
  const dept = departmentById(b.department);
  const coverInner = b.coverUrl
    ? `<img src="${b.coverUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" loading="lazy" />`
    : `<div class="initials">${escapeHtml(initialsOf(b.title))}</div>`;
  return `
  <div class="book-card reveal in" data-book-id="${b.id}">
    <div class="book-cover">
      <div class="spine"></div>
      <div class="ribbon-tab"></div>
      ${coverInner}
    </div>
    <div class="book-body">
      <h4>${escapeHtml(b.title)}</h4>
      <div class="book-tags">
        <span class="tag">${escapeHtml(dept ? dept.shortName : b.department)}</span>
        <span class="tag">Sem ${b.semester}</span>
      </div>
      <div class="book-meta-line"><span>Course</span><span>${escapeHtml(b.course)}</span></div>
      <div class="book-meta-line"><span>Author</span><span>${escapeHtml(b.author)}</span></div>
      <div class="book-meta-line"><span>Size</span><span>${formatBytes(b.fileSize)}</span></div>
      <div class="book-meta-line"><span>Uploaded</span><span>${formatDate(b.uploadDate)}</span></div>
      <div class="book-actions">
        <button class="btn btn-outline btn-sm" data-read="${b.id}">Read</button>
        <button class="btn btn-primary btn-sm" data-download="${b.id}">Download</button>
      </div>
    </div>
  </div>`;
}

function attachBookCardHandlers(scope) {
  scope.querySelectorAll('[data-read]').forEach((btn) => btn.addEventListener('click', () => {
    const book = getBooks().find((b) => b.id === btn.dataset.read);
    if (book) handleReadClick(book);
  }));
  scope.querySelectorAll('[data-download]').forEach((btn) => btn.addEventListener('click', () => {
    const book = getBooks().find((b) => b.id === btn.dataset.download);
    if (book) handleDownloadClick(book);
  }));
}

/* ---- Live search overlay ---- */
function setupSearch() {
  const inputs = document.querySelectorAll('.js-search-input');
  const overlay = document.getElementById('searchOverlay');
  const resultsWrap = document.getElementById('searchResults');
  const countEl = document.getElementById('searchResultsCount');
  const closeBtn = document.getElementById('searchClose');
  if (!overlay) return;

  function runSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q) { overlay.classList.remove('open'); return; }
    const depts = getDepartments();
    const matches = getBooks().filter((b) => {
      const dept = departmentById(b.department);
      const haystack = [b.title, b.course, b.author, 'semester ' + b.semester, String(b.semester), dept ? dept.name : '', dept ? dept.shortName : ''].join(' ').toLowerCase();
      return haystack.includes(q);
    });
    countEl.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} for "${query}"`;
    resultsWrap.innerHTML = matches.length ? matches.map((b) => {
      const dept = departmentById(b.department);
      return `
      <div class="search-result-item">
        <div class="search-result-cover">${escapeHtml(initialsOf(b.title))}</div>
        <div class="search-result-info" style="flex:1;">
          <h5>${escapeHtml(b.title)}</h5>
          <p>${escapeHtml(b.course)} · ${escapeHtml(b.author)} · ${dept ? escapeHtml(dept.shortName) : ''} · Sem ${b.semester}</p>
        </div>
        <button class="btn btn-outline btn-sm" data-read="${b.id}">Read</button>
        <button class="btn btn-primary btn-sm" data-download="${b.id}">Download</button>
      </div>`;
    }).join('') : noResultsWithSuggestionsHtml();
    attachBookCardHandlers(resultsWrap);
    overlay.classList.add('open');
  }

  function noResultsWithSuggestionsHtml() {
    const suggestions = getBooks()
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 3);
    const suggestionsHtml = suggestions.length ? `
      <p class="text-muted" style="font-size:.85rem;margin:1.1rem 0 .6rem;">You might be looking for one of these instead:</p>
      ${suggestions.map((b) => {
        const dept = departmentById(b.department);
        return `
        <div class="search-result-item">
          <div class="search-result-cover">${escapeHtml(initialsOf(b.title))}</div>
          <div class="search-result-info" style="flex:1;">
            <h5>${escapeHtml(b.title)}</h5>
            <p>${escapeHtml(b.course)} · ${escapeHtml(b.author)} · ${dept ? escapeHtml(dept.shortName) : ''} · Sem ${b.semester}</p>
          </div>
          <button class="btn btn-outline btn-sm" data-read="${b.id}">Read</button>
          <button class="btn btn-primary btn-sm" data-download="${b.id}">Download</button>
        </div>`;
      }).join('')}
    ` : '';
    return emptyStateHtml('No matches', 'Try a different book, course, or author name.') + suggestionsHtml;
  }

  inputs.forEach((input) => input.addEventListener('input', () => runSearch(input.value)));
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.classList.remove('open'); });
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const message = document.getElementById('cMessage').value.trim();
    if (!name || !email || !message) { showToast('Please fill in your name, email, and message.', 'error'); return; }
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await saveMessage({ id: genId(), name, email, message, date: new Date().toISOString() });
      showToast('Thanks! Your message has been sent to the admins.');
      form.reset();
    } catch (err) {
      console.error(err);
      showToast('Something went wrong sending your message.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------------------------------------------------------------------- */
/* 6. ADMIN LOGIN LOGIC                                                    */
/* ---------------------------------------------------------------------- */
function initAdminLoginPage() {
  if (isAdmin()) { window.location.href = 'dashboard.html'; return; }
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');
  if (!form) return;

  /* ---- Remember me: prefill the last-used admin email (UI convenience only) ---- */
  const usernameInput = document.getElementById('username');
  const rememberBox = document.getElementById('adminRemember');
  try {
    const remembered = localStorage.getItem('lib_admin_remember_email');
    if (remembered && usernameInput) {
      usernameInput.value = remembered;
      if (rememberBox) rememberBox.checked = true;
    }
  } catch (_) {}

  /* ---- Show / hide password ---- */
  const pwToggle = document.getElementById('adminPwToggle');
  const pwInput = document.getElementById('password');
  if (pwToggle && pwInput) {
    pwToggle.addEventListener('click', () => {
      const show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      pwToggle.querySelector('.pw-eye-open').style.display = show ? 'none' : '';
      pwToggle.querySelector('.pw-eye-off').style.display = show ? '' : 'none';
      pwToggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  }

  /* ---- Forgot password (same Supabase reset-email flow used on the user login modal) ---- */
  const forgotLink = document.getElementById('adminForgotPassword');
  if (forgotLink) {
    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const identifier = usernameInput ? usernameInput.value.trim() : '';
      if (!identifier || !identifier.includes('@')) {
        showToast('Enter your admin email above first, then click "Forgot password?".', 'error');
        return;
      }
      if (!sb) { showToast('Password reset needs Supabase to be configured.', 'error'); return; }
      try {
        await sb.auth.resetPasswordForEmail(identifier);
        showToast('If that email has an account, a reset link is on its way.');
      } catch (err) {
        showToast(err.message || 'Could not send the reset link.', 'error');
      }
    });
  }

  const successEl = document.getElementById('adminLoginSuccess');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    errorEl.textContent = '';
    errorEl.classList.remove('show');
    if (successEl) successEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    try {
      if (!sb) {
        throw new Error('Supabase is not configured yet — admin login needs Supabase (see README.md).');
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email: identifier, password });
        if (error) throw new Error('Incorrect email or password.');
        _authUserId = data.user.id;
        await refreshAdminFlag();
        if (!_authIsAdmin) {
          await sb.auth.signOut();
          _authUserId = null;
          throw new Error('This account is not an admin.');
        }
      }
      try {
        if (rememberBox && rememberBox.checked) localStorage.setItem('lib_admin_remember_email', identifier);
        else localStorage.removeItem('lib_admin_remember_email');
      } catch (_) {}
      showToast('Welcome back, admin!');
      if (successEl) successEl.classList.add('show');
      setTimeout(() => (window.location.href = 'dashboard.html'), 400);
    } catch (err) {
      errorEl.textContent = err.message || 'Incorrect email or password. Please try again.';
      errorEl.classList.add('show');
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 400);
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  });
}

/* ---------------------------------------------------------------------- */
/* 7. DASHBOARD LOGIC                                                      */
/* ---------------------------------------------------------------------- */
let pendingUploadFile = null; // { name, size, type, dataUrl }
let pendingDeleteId = null;
let editingBookId = null;

function initDashboardPage() {
  if (!isAdmin()) {
    document.getElementById('dashLocked').style.display = 'flex';
    document.getElementById('dashShell').style.display = 'none';
    return;
  }
  document.getElementById('dashLocked').style.display = 'none';
  document.getElementById('dashShell').style.display = 'flex';

  setupSidebarNav();
  renderStats();
  renderPopularBooks();
  setupUploadForm();
  renderManageBooksTable();
  renderDepartmentManager();
  renderRecentUploads();
  loadMessages().then(renderMessagesView);
  loadOrders().then(() => { renderOrdersView(); renderStats(); renderPopularBooks(); });
  setupStoreBookForm();
  renderStoreBooksTable();
  renderStoreCategoryManager();
  renderUsersTable();
  renderDownloadHistoryView();
  renderReadingStatsView();

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await logoutUser();
    setAdminSession(false);
    window.location.href = 'index.html';
  });

  document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDeleteBook);
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDeleteModal);
  document.getElementById('closeEditBtn')?.addEventListener('click', closeEditModal);
  document.getElementById('editForm')?.addEventListener('submit', saveEditedBook);
  document.getElementById('closeEditStoreBookBtn')?.addEventListener('click', closeEditStoreBookModal);
  document.getElementById('editStoreBookForm')?.addEventListener('submit', saveEditedStoreBook);
}

function setupSidebarNav() {
  const buttons = document.querySelectorAll('.dash-nav button[data-view]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.dash-view').forEach((v) => v.classList.remove('active'));
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
    });
  });
}

function renderStats() {
  const depts = getDepartments();
  const books = getBooks();
  const uploaded = books.filter((b) => hasFile(b));
  setText('statTotalDepts', depts.length);
  setText('statTotalBooks', books.length);
  setText('statTotalUploads', uploaded.length);
  let totalCourses = 0;
  depts.forEach((d) => Object.values(d.courses || {}).forEach((arr) => (totalCourses += arr.length)));
  setText('statTotalCourses', totalCourses);

  const orders = getOrders();
  const users = getUsers();
  const sales = orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + orderTotalOf(o), 0);
  setText('statTotalUsers', users.length);
  setText('statTotalOrders', orders.length);
  setText('statTotalSales', '৳' + sales.toFixed(0));
}
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function renderPopularBooks() {
  const wrap = document.getElementById('popularBooksList');
  if (!wrap) return;
  const orders = getOrders();
  const counts = {};
  orders.forEach((o) => orderItemsOf(o).forEach((i) => {
    if (!i.title) return;
    counts[i.title] = (counts[i.title] || 0) + Number(i.qty || 1);
  }));
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  wrap.innerHTML = ranked.length ? ranked.map(([title, qty]) => `
    <div class="recent-item">
      <div class="mini-cover">${escapeHtml(initialsOf(title))}</div>
      <div style="flex:1;"><h5>${escapeHtml(title)}</h5><span>${qty} ordered</span></div>
    </div>`).join('') : '<p class="text-muted">No orders yet.</p>';
}

/* ---- Users (admin) ---- */
function renderUsersTable() {
  const tbody = document.getElementById('usersBody');
  if (!tbody) return;
  const users = [...getUsers()].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  tbody.innerHTML = users.length ? users.map((u) => `
    <tr>
      <td data-label="Name"><span class="mini-cover">${escapeHtml(initialsOf(u.fullName))}</span>${escapeHtml(u.fullName)}</td>
      <td data-label="Mobile">${escapeHtml(u.mobile)}</td>
      <td data-label="Email">${escapeHtml(u.email)}</td>
      <td data-label="Address">${escapeHtml(u.address)}</td>
      <td data-label="Joined">${formatDate(u.createdDate)}</td>
      <td data-label="DL Permission">
        <label style="display:flex;align-items:center;gap:.4rem;font-size:.8rem;">
          <input type="checkbox" data-user-download="${u.id}" ${u.canDownload !== false ? 'checked' : ''} /> Can download
        </label>
      </td>
    </tr>`).join('') : `<tr><td colspan="6" class="text-muted center" style="padding:2rem;">No registered users yet.</td></tr>`;

  tbody.querySelectorAll('[data-user-download]').forEach((cb) => cb.addEventListener('change', async () => {
    const user = userById(cb.dataset.userDownload);
    if (!user) return;
    user.canDownload = cb.checked;
    await updateUserRecord(user);
    showToast(`Download permission ${cb.checked ? 'enabled' : 'disabled'} for ${user.fullName}.`);
  }));
}

/* ---- Download history (admin) ---- */
function renderDownloadHistoryView() {
  const tbody = document.getElementById('downloadHistoryBody');
  if (!tbody) return;
  const list = [...getDownloadHistory()].sort((a, b) => new Date(b.date) - new Date(a.date));
  tbody.innerHTML = list.length ? list.map((d) => `
    <tr><td data-label="User">${escapeHtml(d.userName || '—')}</td><td data-label="Book">${escapeHtml(d.bookTitle)}</td><td data-label="Date">${formatDate(d.date)}</td></tr>`).join('')
    : `<tr><td colspan="3" class="text-muted center" style="padding:2rem;">No downloads recorded yet.</td></tr>`;
}

/* ---- Reading statistics (admin) ---- */
function renderReadingStatsView() {
  const tbody = document.getElementById('readingStatsBody');
  if (!tbody) return;
  const list = [...getReadingProgress()].sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
  tbody.innerHTML = list.length ? list.map((p) => `
    <tr><td data-label="User">${escapeHtml(p.userName || '—')}</td><td data-label="Book">${escapeHtml(p.bookTitle)}</td><td data-label="Times opened">${p.timesOpened}</td><td data-label="Last read">${formatDate(p.lastOpened)}</td></tr>`).join('')
    : `<tr><td colspan="4" class="text-muted center" style="padding:2rem;">No reading activity recorded yet.</td></tr>`;
}

/* ---- Messages (contact form submissions) ---- */
function renderMessagesView() {
  const wrap = document.getElementById('messagesList');
  if (!wrap) return;
  const messages = [...getMessages()].sort((a, b) => new Date(b.date) - new Date(a.date));
  wrap.innerHTML = messages.length ? messages.map((m) => `
    <div class="recent-item" style="align-items:flex-start;">
      <div class="mini-cover">${escapeHtml(initialsOf(m.name))}</div>
      <div style="flex:1;">
        <h5>${escapeHtml(m.name)}</h5>
        <span>${escapeHtml(m.email)} · ${formatDate(m.date)}</span>
        <p class="text-muted" style="margin-top:.4rem;">${escapeHtml(m.message)}</p>
      </div>
      <button class="btn btn-danger btn-sm" data-del-msg="${m.id}">Delete</button>
    </div>`).join('') : '<p class="text-muted">No messages yet.</p>';
  wrap.querySelectorAll('[data-del-msg]').forEach((btn) => btn.addEventListener('click', async () => {
    await deleteMessage(btn.dataset.delMsg);
    showToast('Message deleted.');
    renderMessagesView();
  }));
}

/* ---- Orders (Book Store submissions) ---- */
function renderOrdersView() {
  const wrap = document.getElementById('ordersList');
  if (!wrap) return;
  const orders = [...getOrders()].sort((a, b) => new Date(b.date) - new Date(a.date));
  const statuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];
  wrap.innerHTML = orders.length ? orders.map((o) => {
    const items = orderItemsOf(o);
    const title = items.map((i) => i.title).join(', ') || o.bookTitle || o.book || 'Order';
    const totalLine = `৳${orderTotalOf(o).toFixed(0)} total · ${orderPaymentMethod(o)}`;
    const trxId = orderTrxId(o);
    return `
    <div class="recent-item" style="align-items:flex-start;">
      <div class="mini-cover">${escapeHtml(initialsOf(title))}</div>
      <div style="flex:1;">
        <h5>${escapeHtml(title)}</h5>
        <span>${escapeHtml(orderBuyerName(o))} · ${escapeHtml(orderBuyerContact(o))} · ${formatDate(o.date)}</span>
        <p class="text-muted" style="margin-top:.35rem;">${escapeHtml(totalLine)}</p>
        ${orderAddress(o) ? `<p class="text-muted" style="margin-top:.2rem;">📍 ${escapeHtml(orderAddress(o))}</p>` : ''}
        ${trxId ? `<p class="text-muted" style="margin-top:.2rem;">🧾 TrxID: <strong>${escapeHtml(trxId)}</strong> ${o.paymentVerified ? '<span class="badge">Verified</span>' : ''}</p>` : ''}
        ${o.note ? `<p class="text-muted" style="margin-top:.2rem;">${escapeHtml(o.note)}</p>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:.5rem;align-items:flex-end;">
        <select class="order-status-select" data-order-status="${o.id}">
          ${statuses.map((s) => `<option value="${s}"${(o.status || 'Pending') === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
        ${trxId ? `<label style="font-size:.78rem;display:flex;align-items:center;gap:.35rem;"><input type="checkbox" data-verify-payment="${o.id}" ${o.paymentVerified ? 'checked' : ''}/> Payment verified</label>` : ''}
        <button class="btn btn-danger btn-sm" data-del-order="${o.id}">Delete</button>
      </div>
    </div>`;
  }).join('') : '<p class="text-muted">No orders yet.</p>';

  wrap.querySelectorAll('[data-order-status]').forEach((sel) => sel.addEventListener('change', async () => {
    await updateOrderStatus(sel.dataset.orderStatus, sel.value);
    showToast('Order status updated.');
  }));
  wrap.querySelectorAll('[data-verify-payment]').forEach((cb) => cb.addEventListener('change', async () => {
    await updateOrderPaymentVerified(cb.dataset.verifyPayment, cb.checked);
    showToast(cb.checked ? 'Payment marked verified.' : 'Payment marked unverified.');
    renderOrdersView();
  }));
  wrap.querySelectorAll('[data-del-order]').forEach((btn) => btn.addEventListener('click', async () => {
    await deleteOrder(btn.dataset.delOrder);
    showToast('Order deleted.');
    renderOrdersView();
  }));
}

function renderRecentUploads() {
  const wrap = document.getElementById('recentUploads');
  if (!wrap) return;
  const books = [...getBooks()].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)).slice(0, 6);
  wrap.innerHTML = books.length ? books.map((b) => {
    const dept = departmentById(b.department);
    return `<div class="recent-item">
      <div class="mini-cover">${escapeHtml(initialsOf(b.title))}</div>
      <div style="flex:1;">
        <h5>${escapeHtml(b.title)}</h5>
        <span>${dept ? escapeHtml(dept.shortName) : ''} · Sem ${b.semester} · ${formatDate(b.uploadDate)}</span>
      </div>
      <span class="badge">${hasFile(b) ? 'Uploaded' : 'Sample'}</span>
    </div>`;
  }).join('') : '<p class="text-muted">No uploads yet.</p>';
}

/* ---- Upload form ---- */
let pendingCoverFile = null;
function setupUploadForm() {
  const deptSelect = document.getElementById('uploadDept');
  const semSelect = document.getElementById('uploadSem');
  const courseInput = document.getElementById('uploadCourse');
  const courseList = document.getElementById('courseSuggestions');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileChip = document.getElementById('fileChip');
  const coverInput = document.getElementById('coverInput');
  const coverChip = document.getElementById('coverChip');
  const form = document.getElementById('uploadForm');
  if (!form) return;

  function populateDepts() {
    const depts = getDepartments();
    deptSelect.innerHTML = depts.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
    populateSemesters();
  }
  function populateSemesters() {
    const dept = departmentById(deptSelect.value) || getDepartments()[0];
    let opts = '';
    for (let i = 1; i <= (dept ? dept.totalSemesters : 8); i++) opts += `<option value="${i}">Semester ${i}</option>`;
    semSelect.innerHTML = opts;
    populateCourseSuggestions();
  }
  function populateCourseSuggestions() {
    const dept = departmentById(deptSelect.value);
    const sem = Number(semSelect.value) || 1;
    const list = (dept && dept.courses && dept.courses[sem]) || [];
    courseList.innerHTML = list.map((c) => `<option value="${escapeHtml(c)}"></option>`).join('');
  }

  deptSelect.addEventListener('change', populateSemesters);
  semSelect.addEventListener('change', populateCourseSuggestions);
  populateDepts();

  dropzone.addEventListener('click', () => fileInput.click());
  ['dragover', 'dragenter'].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }));
  dropzone.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

  if (coverInput) {
    coverInput.addEventListener('change', () => {
      const file = coverInput.files[0];
      if (!file) return;
      pendingCoverFile = file;
      if (coverChip) {
        coverChip.style.display = 'inline-flex';
        coverChip.innerHTML = `🖼️ ${escapeHtml(file.name)} <span style="cursor:pointer;font-weight:700;" id="clearCoverChip">✕</span>`;
        document.getElementById('clearCoverChip').addEventListener('click', (e) => {
          e.stopPropagation(); pendingCoverFile = null; coverChip.style.display = 'none'; coverInput.value = '';
        });
      }
    });
  }

  function handleFile(file) {
    const ext = extOf(file.name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      showToast('Unsupported file type. Please choose PDF, DOCX, PPT/PPTX, or an image.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast('File exceeds the 100 MB limit.', 'error');
      return;
    }
    pendingUploadFile = { name: file.name, size: file.size, type: ext.toUpperCase(), raw: file };
    fileChip.style.display = 'inline-flex';
    fileChip.innerHTML = `📎 ${escapeHtml(file.name)} · ${formatBytes(file.size)} <span style="cursor:pointer;font-weight:700;" id="clearFileChip">✕</span>`;
    document.getElementById('clearFileChip').addEventListener('click', (e) => {
      e.stopPropagation(); pendingUploadFile = null; fileChip.style.display = 'none'; fileInput.value = '';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('uploadTitle').value.trim();
    const author = document.getElementById('uploadAuthor').value.trim();
    const course = courseInput.value.trim();
    const deptId = deptSelect.value;
    const semester = Number(semSelect.value);

    if (!title || !author || !course || !deptId || !semester) {
      showToast('Please fill in every field before uploading.', 'error');
      return;
    }
    if (!pendingUploadFile) {
      showToast('Please choose a file to upload.', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading…';

    try {
      const uploaded = await uploadBookFile(pendingUploadFile.raw);
      let coverUrl = null, coverPath = null;
      if (pendingCoverFile) {
        const coverUploaded = await uploadCoverImage(pendingCoverFile);
        coverUrl = coverUploaded.url;
        coverPath = coverUploaded.path;
      }
      const newBook = {
        id: genId(),
        title, author, course,
        department: deptId,
        semester,
        fileName: pendingUploadFile.name,
        fileType: pendingUploadFile.type,
        fileSize: pendingUploadFile.size,
        fileData: uploaded.path ? null : uploaded.url, // only used when Supabase isn't configured
        fileUrl: uploaded.path ? uploaded.url : null,
        filePath: uploaded.path,
        coverUrl, coverPath,
        uploadDate: new Date().toISOString(),
      };
      const books = getBooks();
      books.push(newBook);
      saveBooks(books);

      // Register the course under the department/semester if it's new
      const depts = getDepartments();
      const dept = depts.find((d) => d.id === deptId);
      if (dept) {
        dept.courses = dept.courses || {};
        dept.courses[semester] = dept.courses[semester] || [];
        if (!dept.courses[semester].includes(course)) dept.courses[semester].push(course);
        saveDepartments(depts);
      }

      showToast(`"${title}" uploaded successfully!`, 'celebrate');
      form.reset();
      pendingUploadFile = null;
      fileChip.style.display = 'none';
      pendingCoverFile = null;
      if (coverChip) coverChip.style.display = 'none';
      populateDepts();
      renderStats();
      renderManageBooksTable();
      renderRecentUploads();
      renderDepartmentManager();
    } catch (err) {
      if (err && err.name === 'QuotaExceededError') {
        showToast('Browser storage is full. Try a smaller file — localStorage has a small real-world limit.', 'error');
      } else {
        showToast('Something went wrong while saving. Try a smaller file.', 'error');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Upload Book';
    }
  });
}

/* ---- Manage books table ---- */
function renderManageBooksTable() {
  const tbody = document.getElementById('manageBooksBody');
  if (!tbody) return;
  const books = [...getBooks()].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  tbody.innerHTML = books.length ? books.map((b) => {
    const dept = departmentById(b.department);
    return `<tr>
      <td data-label="Title"><span class="mini-cover">${escapeHtml(initialsOf(b.title))}</span>${escapeHtml(b.title)}</td>
      <td data-label="Course">${escapeHtml(b.course)}</td>
      <td data-label="Department">${dept ? escapeHtml(dept.shortName) : escapeHtml(b.department)}</td>
      <td data-label="Semester">Sem ${b.semester}</td>
      <td data-label="Size">${formatBytes(b.fileSize)}</td>
      <td data-label="Uploaded">${formatDate(b.uploadDate)}</td>
      <td data-label="Actions">
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" data-edit="${b.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete="${b.id}">Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="7" class="text-muted center" style="padding:2rem;">No books yet — upload one to get started.</td></tr>`;

  tbody.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openEditModal(btn.dataset.edit)));
  tbody.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => openDeleteModal(btn.dataset.delete)));
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  document.getElementById('deleteModal').classList.add('open');
}
function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('deleteModal').classList.remove('open');
}
async function confirmDeleteBook() {
  if (!pendingDeleteId) return;
  const id = pendingDeleteId;
  const bookToRemove = getBooks().find((b) => b.id === id);
  const books = getBooks().filter((b) => b.id !== id);
  saveBooks(books);
  if (sb) {
    await sb.from('books').delete().eq('id', id);
    const pathsToRemove = [];
    if (bookToRemove && bookToRemove.filePath) pathsToRemove.push(bookToRemove.filePath);
    if (bookToRemove && bookToRemove.coverPath) pathsToRemove.push(bookToRemove.coverPath);
    if (pathsToRemove.length) await sb.storage.from(BOOK_BUCKET).remove(pathsToRemove);
  }
  showToast('Book deleted.');
  closeDeleteModal();
  renderStats();
  renderManageBooksTable();
  renderRecentUploads();
}

function openEditModal(id) {
  const book = getBooks().find((b) => b.id === id);
  if (!book) return;
  editingBookId = id;
  document.getElementById('editTitle').value = book.title;
  document.getElementById('editAuthor').value = book.author;
  document.getElementById('editCourse').value = book.course;
  const deptSelect = document.getElementById('editDept');
  deptSelect.innerHTML = getDepartments().map((d) => `<option value="${d.id}"${d.id === book.department ? ' selected' : ''}>${escapeHtml(d.name)}</option>`).join('');
  const semSelect = document.getElementById('editSem');
  const dept = departmentById(book.department);
  let opts = '';
  for (let i = 1; i <= (dept ? dept.totalSemesters : 8); i++) opts += `<option value="${i}"${i === book.semester ? ' selected' : ''}>Semester ${i}</option>`;
  semSelect.innerHTML = opts;
  document.getElementById('editModal').classList.add('open');
}
function closeEditModal() {
  editingBookId = null;
  document.getElementById('editModal').classList.remove('open');
}
function saveEditedBook(e) {
  e.preventDefault();
  if (!editingBookId) return;
  const books = getBooks();
  const book = books.find((b) => b.id === editingBookId);
  if (!book) return;
  book.title = document.getElementById('editTitle').value.trim();
  book.author = document.getElementById('editAuthor').value.trim();
  book.course = document.getElementById('editCourse').value.trim();
  book.department = document.getElementById('editDept').value;
  book.semester = Number(document.getElementById('editSem').value);
  saveBooks(books);
  showToast('Changes saved.');
  closeEditModal();
  renderManageBooksTable();
  renderRecentUploads();
  renderStats();
}

/* ---- Department / semester / course manager ---- */
function renderDepartmentManager() {
  const wrap = document.getElementById('deptManagerList');
  const addCourseDept = document.getElementById('courseDeptSelect');
  const addSemDept = document.getElementById('semDeptSelect');
  const addCourseSem = document.getElementById('courseSemSelect');
  if (!wrap) return;
  const depts = getDepartments();
  const books = getBooks();

  wrap.innerHTML = depts.map((d) => {
    const courseCount = Object.values(d.courses || {}).reduce((sum, arr) => sum + arr.length, 0);
    const bookCount = books.filter((b) => b.department === d.id).length;
    return `<div class="recent-item">
      <div class="mini-cover" style="font-size:1rem;">${d.icon}</div>
      <div style="flex:1;">
        <h5>${escapeHtml(d.name)}</h5>
        <span>${d.totalSemesters} semesters · ${courseCount} courses · ${bookCount} books</span>
      </div>
      <button class="btn btn-danger btn-sm" data-del-dept="${d.id}">Remove</button>
    </div>`;
  }).join('');

  wrap.querySelectorAll('[data-del-dept]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Remove this department and all its books? This cannot be undone.')) return;
    const id = btn.dataset.delDept;
    const removedBookIds = getBooks().filter((b) => b.department === id).map((b) => b.id);
    saveDepartments(getDepartments().filter((d) => d.id !== id));
    saveBooks(getBooks().filter((b) => b.department !== id));
    if (sb) {
      await sb.from('departments').delete().eq('id', id);
      if (removedBookIds.length) await sb.from('books').delete().in('id', removedBookIds);
    }
    showToast('Department removed.');
    renderDepartmentManager(); renderStats(); renderManageBooksTable(); renderRecentUploads();
    setupUploadForm();
  }));

  if (addCourseDept) {
    addCourseDept.innerHTML = depts.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
    addSemDept.innerHTML = addCourseDept.innerHTML;
    function refreshCourseSemOptions() {
      const dept = departmentById(addCourseDept.value);
      let opts = '';
      for (let i = 1; i <= (dept ? dept.totalSemesters : 8); i++) opts += `<option value="${i}">Semester ${i}</option>`;
      addCourseSem.innerHTML = opts;
    }
    addCourseDept.addEventListener('change', refreshCourseSemOptions);
    refreshCourseSemOptions();
  }
}

function setupAddDepartmentForm() {
  const form = document.getElementById('addDeptForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newDeptName').value.trim();
    const icon = document.getElementById('newDeptIcon').value.trim() || '📚';
    const totalSemesters = Number(document.getElementById('newDeptSemesters').value) || 8;
    if (!name) { showToast('Give the department a name.', 'error'); return; }
    const depts = getDepartments();
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || genId();
    if (depts.some((d) => d.id === id)) { showToast('A department with a similar name already exists.', 'error'); return; }
    depts.push({ id, name, shortName: name.split(' ')[0], icon, totalSemesters, courses: {} });
    saveDepartments(depts);
    showToast('Department added.');
    form.reset();
    renderDepartmentManager(); renderStats(); setupUploadForm();
  });
}

function setupAddSemesterForm() {
  const form = document.getElementById('addSemForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const deptId = document.getElementById('semDeptSelect').value;
    const depts = getDepartments();
    const dept = depts.find((d) => d.id === deptId);
    if (!dept) return;
    dept.totalSemesters += 1;
    saveDepartments(depts);
    showToast(`Semester ${dept.totalSemesters} added to ${dept.shortName}.`);
    renderDepartmentManager(); setupUploadForm();
  });
}

function setupAddCourseForm() {
  const form = document.getElementById('addCourseForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const deptId = document.getElementById('courseDeptSelect').value;
    const sem = Number(document.getElementById('courseSemSelect').value);
    const courseName = document.getElementById('newCourseName').value.trim();
    if (!courseName) { showToast('Enter a course name.', 'error'); return; }
    const depts = getDepartments();
    const dept = depts.find((d) => d.id === deptId);
    if (!dept) return;
    dept.courses = dept.courses || {};
    dept.courses[sem] = dept.courses[sem] || [];
    if (dept.courses[sem].includes(courseName)) { showToast('That course already exists in this semester.', 'error'); return; }
    dept.courses[sem].push(courseName);
    saveDepartments(depts);
    showToast('Course added.');
    form.reset();
    renderDepartmentManager(); renderStats(); setupUploadForm();
  });
}

/* ---- Store books manager (Book Store admin) ---- */
let pendingStoreBookImages = [];
function setupStoreBookForm() {
  const form = document.getElementById('storeBookForm');
  if (!form) return;
  const catSelect = document.getElementById('sbCategory');
  const imagesInput = document.getElementById('sbImages');
  const imagesChip = document.getElementById('sbImagesChip');

  function populateCats() {
    catSelect.innerHTML = getStoreCategories().map((c) => `<option value="${c.id}">${escapeHtml(c.icon + ' ' + c.name)}</option>`).join('');
  }
  populateCats();
  form._populateCats = populateCats;

  imagesInput?.addEventListener('change', () => {
    pendingStoreBookImages = Array.from(imagesInput.files).slice(0, 4);
    if (pendingStoreBookImages.length) {
      imagesChip.style.display = 'inline-flex';
      imagesChip.innerHTML = `🖼️ ${pendingStoreBookImages.length} image(s) selected`;
    } else {
      imagesChip.style.display = 'none';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('sbTitle').value.trim();
    const author = document.getElementById('sbAuthor').value.trim();
    const categoryId = catSelect.value;
    const price = Number(document.getElementById('sbPrice').value);
    const stock = Number(document.getElementById('sbStock').value);
    const publisher = document.getElementById('sbPublisher').value.trim();
    const isbn = document.getElementById('sbIsbn').value.trim();
    const available = document.getElementById('sbAvailable').value === 'true';
    const shortDescription = document.getElementById('sbShortDesc').value.trim();
    const fullDescription = document.getElementById('sbFullDesc').value.trim();
    if (!title || !author || !categoryId || Number.isNaN(price) || Number.isNaN(stock) || !shortDescription || !fullDescription) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    try {
      let images = [];
      if (pendingStoreBookImages.length) images = await uploadStoreImages(pendingStoreBookImages);
      const newBook = {
        id: genId(), title, author, categoryId, price, stock, available,
        publisher, isbn, shortDescription, fullDescription, images,
        createdDate: new Date().toISOString(),
      };
      const books = getStoreBooks();
      books.push(newBook);
      await saveStoreBooks(books);
      showToast('Book added to the store.');
      form.reset();
      pendingStoreBookImages = [];
      if (imagesChip) imagesChip.style.display = 'none';
      populateCats();
      renderStoreBooksTable();
    } catch (err) {
      console.error(err);
      showToast('Something went wrong while saving.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Add book to store';
    }
  });
}

function renderStoreBooksTable() {
  const tbody = document.getElementById('storeBooksBody');
  if (!tbody) return;
  const books = [...getStoreBooks()].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  tbody.innerHTML = books.length ? books.map((b) => {
    const cat = storeCategoryById(b.categoryId);
    const available = b.available !== false;
    return `<tr>
      <td data-label="Book"><span class="mini-cover">${escapeHtml(initialsOf(b.title))}</span>${escapeHtml(b.title)}</td>
      <td data-label="Category">${cat ? escapeHtml(cat.name) : '—'}</td>
      <td data-label="Price">৳${Number(b.price).toFixed(0)}</td>
      <td data-label="Stock">${b.stock}</td>
      <td data-label="Status"><span class="badge"${available ? '' : ' style="background:#f6dede;color:#c0392b;"'}>${available ? 'Available' : 'Not available'}</span></td>
      <td data-label="Actions">
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" data-toggle-avail="${b.id}">${available ? 'Mark unavailable' : 'Mark available'}</button>
          <button class="btn btn-ghost btn-sm" data-edit-sb="${b.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete-sb="${b.id}">Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="text-muted center" style="padding:2rem;">No store books yet — add one above.</td></tr>`;

  tbody.querySelectorAll('[data-toggle-avail]').forEach((btn) => btn.addEventListener('click', async () => {
    const books = getStoreBooks();
    const book = books.find((b) => b.id === btn.dataset.toggleAvail);
    if (!book) return;
    book.available = !(book.available !== false);
    await saveStoreBooks(books);
    showToast(`Marked as ${book.available ? 'available' : 'not available'}.`);
    renderStoreBooksTable();
  }));
  tbody.querySelectorAll('[data-edit-sb]').forEach((btn) => btn.addEventListener('click', () => openEditStoreBookModal(btn.dataset.editSb)));
  tbody.querySelectorAll('[data-delete-sb]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Delete this store book? This cannot be undone.')) return;
    const id = btn.dataset.deleteSb;
    const bookToRemove = getStoreBooks().find((b) => b.id === id);
    const books = getStoreBooks().filter((b) => b.id !== id);
    await saveStoreBooks(books);
    if (sb) {
      await sb.from('store_books').delete().eq('id', id);
      const paths = ((bookToRemove && bookToRemove.images) || []).map((img) => img.path).filter(Boolean);
      if (paths.length) await sb.storage.from(BOOK_BUCKET).remove(paths);
    }
    showToast('Store book deleted.');
    renderStoreBooksTable();
  }));
}

let editingStoreBookId = null;
function openEditStoreBookModal(id) {
  const book = getStoreBooks().find((b) => b.id === id);
  if (!book) return;
  editingStoreBookId = id;
  document.getElementById('esbTitle').value = book.title;
  document.getElementById('esbAuthor').value = book.author;
  document.getElementById('esbPrice').value = book.price;
  document.getElementById('esbStock').value = book.stock;
  document.getElementById('esbPublisher').value = book.publisher || '';
  document.getElementById('esbIsbn').value = book.isbn || '';
  document.getElementById('esbAvailable').value = book.available !== false ? 'true' : 'false';
  document.getElementById('esbShortDesc').value = book.shortDescription || '';
  document.getElementById('esbFullDesc').value = book.fullDescription || '';
  const catSelect = document.getElementById('esbCategory');
  catSelect.innerHTML = getStoreCategories().map((c) => `<option value="${c.id}"${c.id === book.categoryId ? ' selected' : ''}>${escapeHtml(c.icon + ' ' + c.name)}</option>`).join('');
  document.getElementById('editStoreBookModal').classList.add('open');
}
function closeEditStoreBookModal() {
  editingStoreBookId = null;
  document.getElementById('editStoreBookModal').classList.remove('open');
}
async function saveEditedStoreBook(e) {
  e.preventDefault();
  if (!editingStoreBookId) return;
  const books = getStoreBooks();
  const book = books.find((b) => b.id === editingStoreBookId);
  if (!book) return;
  book.title = document.getElementById('esbTitle').value.trim();
  book.author = document.getElementById('esbAuthor').value.trim();
  book.categoryId = document.getElementById('esbCategory').value;
  book.price = Number(document.getElementById('esbPrice').value);
  book.stock = Number(document.getElementById('esbStock').value);
  book.publisher = document.getElementById('esbPublisher').value.trim();
  book.isbn = document.getElementById('esbIsbn').value.trim();
  book.available = document.getElementById('esbAvailable').value === 'true';
  book.shortDescription = document.getElementById('esbShortDesc').value.trim();
  book.fullDescription = document.getElementById('esbFullDesc').value.trim();
  await saveStoreBooks(books);
  showToast('Changes saved.');
  closeEditStoreBookModal();
  renderStoreBooksTable();
}

/* ---- Store category manager ---- */
function renderStoreCategoryManager() {
  const wrap = document.getElementById('storeCatManagerList');
  if (!wrap) return;
  const cats = getStoreCategories();
  const books = getStoreBooks();
  wrap.innerHTML = cats.map((c) => {
    const count = books.filter((b) => b.categoryId === c.id).length;
    return `<div class="recent-item">
      <div class="mini-cover" style="font-size:1rem;">${c.icon}</div>
      <div style="flex:1;">
        <h5>${escapeHtml(c.name)}</h5>
        <span>${count} book${count === 1 ? '' : 's'}${c.description ? ' · ' + escapeHtml(c.description) : ''}</span>
      </div>
      <button class="btn btn-danger btn-sm" data-del-cat="${c.id}">Remove</button>
    </div>`;
  }).join('');
  wrap.querySelectorAll('[data-del-cat]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Remove this category? Books already in it will keep the category id but it will no longer be selectable.')) return;
    const id = btn.dataset.delCat;
    await saveStoreCategories(getStoreCategories().filter((c) => c.id !== id));
    if (sb) await sb.from('store_categories').delete().eq('id', id);
    showToast('Category removed.');
    renderStoreCategoryManager();
    const form = document.getElementById('storeBookForm');
    if (form && form._populateCats) form._populateCats();
  }));
}

function setupAddStoreCategoryForm() {
  const form = document.getElementById('addStoreCatForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newCatName').value.trim();
    const icon = document.getElementById('newCatIcon').value.trim() || '📚';
    const description = document.getElementById('newCatDesc').value.trim();
    if (!name) { showToast('Give the category a name.', 'error'); return; }
    const cats = getStoreCategories();
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || genId();
    if (cats.some((c) => c.id === id)) { showToast('A category with a similar name already exists.', 'error'); return; }
    cats.push({ id, name, icon, description });
    await saveStoreCategories(cats);
    showToast('Category added.');
    form.reset();
    renderStoreCategoryManager();
    const sbForm = document.getElementById('storeBookForm');
    if (sbForm && sbForm._populateCats) sbForm._populateCats();
  });
}

/* ---------------------------------------------------------------------- */
/* 9. BOOK STORE (public pages)                                            */
/* ---------------------------------------------------------------------- */
const storeState = { catFilter: 'all' };
let storeOrderBookId = null;

function initStorePage() {
  renderStoreCatChips();
  renderStoreBookGrid();
  setupStoreOrderModal();
}

function renderStoreCatChips() {
  const wrap = document.getElementById('storeCatChips');
  if (!wrap) return;
  const cats = getStoreCategories();
  wrap.innerHTML = ['<button class="chip' + (storeState.catFilter === 'all' ? ' active' : '') + '" data-cat="all">All categories</button>']
    .concat(cats.map((c) => `<button class="chip${storeState.catFilter === c.id ? ' active' : ''}" data-cat="${c.id}">${c.icon} ${escapeHtml(c.name)}</button>`))
    .join('');
  wrap.querySelectorAll('[data-cat]').forEach((chip) => {
    chip.addEventListener('click', () => { storeState.catFilter = chip.dataset.cat; renderStoreCatChips(); renderStoreBookGrid(); });
  });
}

function renderStoreBookGrid() {
  const grid = document.getElementById('storeBookGrid');
  if (!grid) return;
  const books = getStoreBooks().filter((b) => storeState.catFilter === 'all' || b.categoryId === storeState.catFilter);
  grid.innerHTML = books.length ? books.map((b) => storeBookCardHtml(b)).join('') : emptyStateHtml('No books in this category yet', 'Check back soon or explore another category.');
  attachStoreCardHandlers(grid);
  initReveal();
}

function storeBookCardHtml(b) {
  const cat = storeCategoryById(b.categoryId);
  const firstImg = b.images && b.images[0] ? (b.images[0].url || b.images[0]) : null;
  const cover = firstImg
    ? `<img src="${firstImg}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" loading="lazy" />`
    : `<div class="initials">${escapeHtml(initialsOf(b.title))}</div>`;
  const available = b.available !== false && Number(b.stock) > 0;
  return `
  <div class="book-card reveal in" data-store-book-id="${b.id}">
    <div class="book-cover" data-open-details="${b.id}" style="cursor:pointer;">
      <div class="spine"></div>
      <div class="ribbon-tab"></div>
      ${cover}
      ${!available ? '<span class="unavailable-badge">Not Available</span>' : ''}
    </div>
    <div class="book-body">
      <h4 data-open-details="${b.id}" style="cursor:pointer;">${escapeHtml(b.title)}</h4>
      <div class="book-tags">
        <span class="tag">${cat ? escapeHtml(cat.icon + ' ' + cat.name) : ''}</span>
      </div>
      <div class="book-meta-line"><span>Author</span><span>${escapeHtml(b.author)}</span></div>
      <p class="text-muted" style="font-size:.82rem;margin-top:.2rem;flex:1;">${escapeHtml(b.shortDescription || '')}</p>
      <div class="store-price-row">
        <strong class="store-price">৳${Number(b.price).toFixed(0)}</strong>
        <span class="stock-note">${available ? (Number(b.stock) + ' in stock') : 'Not available'}</span>
      </div>
      <div class="book-actions">
        ${available
          ? `<button class="btn btn-outline btn-sm" data-add-cart="${b.id}">Add to Cart</button><button class="btn btn-primary btn-sm" data-order="${b.id}">Buy Now</button>`
          : `<button class="btn btn-ghost btn-sm" disabled>Not Available</button>`}
      </div>
    </div>
  </div>`;
}

function attachStoreCardHandlers(scope) {
  scope.querySelectorAll('[data-open-details]').forEach((el) => el.addEventListener('click', () => {
    window.location.href = `book-details.html?id=${encodeURIComponent(el.dataset.openDetails)}`;
  }));
  scope.querySelectorAll('[data-order]').forEach((btn) => btn.addEventListener('click', () => buyStoreBookNow(btn.dataset.order)));
  scope.querySelectorAll('[data-add-cart]').forEach((btn) => btn.addEventListener('click', () => addStoreBookToCart(btn.dataset.addCart)));
}

function addStoreBookToCart(bookId) {
  const book = getStoreBooks().find((b) => b.id === bookId);
  if (!book) return;
  const available = book.available !== false && Number(book.stock) > 0;
  if (!available) { showToast('This book is not available right now.', 'error'); return; }
  if (!requireLogin('Please log in to add items to your cart.')) return;
  addToCart(bookId, 1);
  showToast(`${book.title} added to cart.`);
}

function buyStoreBookNow(bookId) {
  const book = getStoreBooks().find((b) => b.id === bookId);
  if (!book) return;
  const available = book.available !== false && Number(book.stock) > 0;
  if (!available) { showToast('This book is not available right now.', 'error'); return; }
  openCheckoutModal([{ bookId: book.id, title: book.title, price: Number(book.price), qty: 1 }], { fromCart: false });
}

/* Legacy function name kept so any older references still work. */
function openStoreOrderModal(bookId) { buyStoreBookNow(bookId); }
function setupStoreOrderModal() { /* superseded by the shared checkout modal — kept as a no-op for compatibility */ }

/* ---- Book details page ---- */
function initBookDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const book = getStoreBooks().find((b) => b.id === id);
  const wrap = document.getElementById('detailsInfo');
  const gallery = document.getElementById('detailsGallery');
  setupStoreOrderModal();
  if (!book) {
    if (wrap) wrap.innerHTML = '<h2>Book not found</h2><p class="text-muted mt-1">This title may have been removed. <a href="store.html" style="color:var(--green-700);font-weight:600;">Back to the store →</a></p>';
    if (gallery) gallery.innerHTML = '';
    return;
  }
  const cat = storeCategoryById(book.categoryId);
  const available = book.available !== false && Number(book.stock) > 0;
  const images = (book.images && book.images.length) ? book.images : [null];

  function imgHtml(img) {
    return img ? `<img src="${img.url || img}" alt="" loading="lazy" />` : `<div class="initials" style="font-size:2.4rem;">${escapeHtml(initialsOf(book.title))}</div>`;
  }

  gallery.innerHTML = `
    <div class="details-main-img" id="detailsMainImg">
      ${imgHtml(images[0])}
      ${!available ? '<span class="unavailable-badge">Not Available</span>' : ''}
    </div>
    ${images.length > 1 ? `<div class="details-thumbs">${images.map((img, i) => `<div class="details-thumb" data-idx="${i}">${imgHtml(img)}</div>`).join('')}</div>` : ''}
  `;
  gallery.querySelectorAll('[data-idx]').forEach((thumb) => thumb.addEventListener('click', () => {
    const idx = Number(thumb.dataset.idx);
    const mainImg = document.getElementById('detailsMainImg');
    mainImg.innerHTML = imgHtml(images[idx]) + (!available ? '<span class="unavailable-badge">Not Available</span>' : '');
  }));

  wrap.innerHTML = `
    <span class="tag">${cat ? escapeHtml(cat.icon + ' ' + cat.name) : ''}</span>
    <h1 style="margin:.6rem 0;">${escapeHtml(book.title)}</h1>
    <p class="text-muted">by ${escapeHtml(book.author)}</p>
    <div class="details-price-row">
      <strong class="store-price" style="font-size:1.6rem;">৳${Number(book.price).toFixed(0)}</strong>
      ${available ? `<span class="badge">In stock: ${book.stock}</span>` : '<span class="unavailable-badge" style="position:static;">Not Available</span>'}
    </div>
    <p style="margin:1.1rem 0;line-height:1.7;">${escapeHtml(book.fullDescription || book.shortDescription || '')}</p>
    <div class="details-meta">
      ${book.publisher ? `<div><span>Publisher</span><strong>${escapeHtml(book.publisher)}</strong></div>` : ''}
      ${book.isbn ? `<div><span>ISBN</span><strong>${escapeHtml(book.isbn)}</strong></div>` : ''}
    </div>
    ${available ? `<div style="display:flex;gap:.7rem;margin-top:1rem;"><button class="btn btn-outline" id="detailsCartBtn">Add to Cart</button><button class="btn btn-primary" id="detailsOrderBtn">Buy Now</button></div>` : `<button class="btn btn-ghost mt-1" disabled>Not Available</button>`}
  `;
  document.getElementById('detailsOrderBtn')?.addEventListener('click', () => buyStoreBookNow(book.id));
  document.getElementById('detailsCartBtn')?.addEventListener('click', () => addStoreBookToCart(book.id));
}

/* ---------------------------------------------------------------------- */
/* 7B. USER DASHBOARD (logged-in student account)                          */
/* ---------------------------------------------------------------------- */
const userDashState = { deptFilter: 'all', semFilter: 1 };

function initUserDashboardPage() {
  if (!isLoggedIn()) {
    document.getElementById('userDashLocked').style.display = 'flex';
    document.getElementById('userDashShell').style.display = 'none';
    return;
  }
  document.getElementById('userDashLocked').style.display = 'none';
  document.getElementById('userDashShell').style.display = 'flex';

  setupUserSidebarNav();
  renderDashboardOverview();
  renderProfileView();
  renderMyLibrary();
  renderMyLibraryHistory();
  renderFavoritesView();
  renderActivityHistory();
  renderNotifications();
  renderCartView();
  renderMyOrders();
  document.getElementById('greetUserName').textContent = getCurrentUser().fullName;
  wirePasswordToggles(document.getElementById('changePasswordForm'));

  document.getElementById('userLogoutBtn')?.addEventListener('click', async () => {
    await logoutUser();
    window.location.href = 'index.html';
  });
  document.getElementById('profileForm')?.addEventListener('submit', saveProfileEdits);
  document.getElementById('changePasswordForm')?.addEventListener('submit', changeOwnPassword);
  document.getElementById('goToStoreBtn')?.addEventListener('click', () => (window.location.href = 'store.html'));
  document.getElementById('cartCheckoutBtnDash')?.addEventListener('click', () => {
    const items = cartLineItems();
    if (!items.length) { showToast('Your cart is empty.', 'error'); return; }
    openCheckoutModal(items, { fromCart: true });
  });
  document.getElementById('goToEditProfileBtn')?.addEventListener('click', () => selectDashboardView('edit-profile'));
  document.getElementById('goToChangePasswordBtn')?.addEventListener('click', () => {
    selectDashboardView('edit-profile');
    scrollToChangePassword();
  });
  document.getElementById('refreshOrdersBtn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = 'Refreshing…';
    try {
      await loadOrders();
      renderMyOrders();
      if (typeof renderDashboardOverview === 'function') renderDashboardOverview();
      showToast('Orders refreshed.');
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  /* ---- Avatar photo picker: live preview only (no backend field exists yet
     for avatar storage, so nothing is persisted — see the hint text in the
     Edit Profile panel). Purely cosmetic, never touches saveProfileEdits. ---- */
  const avatarInput = document.getElementById('editAvatarInput');
  const avatarImg = document.getElementById('editAvatarPreviewImg');
  const avatarInitialsEl = document.getElementById('editAvatarInitials');
  document.getElementById('editAvatarChooseBtn')?.addEventListener('click', () => avatarInput?.click());
  avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatarImg.src = reader.result;
      avatarImg.style.display = 'block';
      if (avatarInitialsEl) avatarInitialsEl.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  /* ---- Deep-link routing from the avatar dropdown / anywhere else:
     #overview, #profile, #edit-profile, #library, #favorites, #activity,
     #notifications, #cart, #orders, #settings, or #edit-profile-password
     (opens Edit Profile and scrolls straight to the password panel). ---- */
  applyDashboardHash();
  window.addEventListener('hashchange', applyDashboardHash);
}

function applyDashboardHash() {
  const hash = (location.hash || '').replace('#', '');
  if (hash === 'edit-profile-password') {
    selectDashboardView('edit-profile');
    scrollToChangePassword();
    return;
  }
  selectDashboardView(hash || 'overview');
}
function scrollToChangePassword() {
  setTimeout(() => {
    const panel = document.getElementById('changePasswordPanel');
    panel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('pwCurrent')?.focus();
  }, 200);
}

function setupUserSidebarNav() {
  const buttons = document.querySelectorAll('.dash-nav button[data-view]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      selectDashboardView(btn.dataset.view);
      if (btn.dataset.view === 'orders' || btn.dataset.view === 'overview') {
        await loadOrders();
        renderMyOrders();
        if (typeof renderDashboardOverview === 'function') renderDashboardOverview();
      }
    });
  });
}
function selectDashboardView(view) {
  const buttons = document.querySelectorAll('.dash-nav button[data-view]');
  const target = [...buttons].find((b) => b.dataset.view === view) || buttons[0];
  if (!target) return;
  buttons.forEach((b) => b.classList.remove('active'));
  target.classList.add('active');
  document.querySelectorAll('.dash-view').forEach((v) => v.classList.remove('active'));
  document.getElementById('view-' + target.dataset.view)?.classList.add('active');
}

/* ---- Generic show/hide password toggle wiring, reusable anywhere a
   `.auth-pw-toggle[data-toggle-for]` button sits next to a password input. ---- */
function wirePasswordToggles(scopeEl) {
  if (!scopeEl) return;
  scopeEl.querySelectorAll('.auth-pw-toggle[data-toggle-for]').forEach((btn) => {
    if (btn._wired) return;
    btn._wired = true;
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.toggleFor);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? '🙈' : '👁';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });
}

/* ---- Animated stat counters ---- */
function animateCounterEl(id, target, prefix = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(target * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function getLastLoginDisplay() {
  if (_authLastSignInAt) {
    return new Date(_authLastSignInAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return 'This session';
}

/* ---- Overview / My Dashboard ---- */
function renderDashboardOverview() {
  const user = getCurrentUser();
  if (!user) return;
  const initials = escapeHtml(initialsOf(user.fullName));
  setText('ovAvatarInitials', initials);
  const reading = getReadingProgress().filter((p) => p.userId === user.id);
  const downloads = getDownloadHistory().filter((d) => d.userId === user.id);
  const orders = getOrders().filter((o) => o.userId === user.id);
  const totalSpent = orders.reduce((s, o) => s + orderTotalOf(o), 0);

  animateCounterEl('statBooksRead', reading.length);
  animateCounterEl('statDownloads', downloads.length);
  animateCounterEl('statOrders', orders.length);
  animateCounterEl('statSpent', Math.round(totalSpent), '৳');

  setText('ovLastLogin', getLastLoginDisplay());
  setText('ovMemberSince', formatDate(user.createdDate));
  setText('ovDownloadPermission', user.canDownload === false ? 'Disabled by admin' : 'Enabled');

  const merged = [
    ...reading.map((p) => ({ type: 'read', date: p.lastOpened, title: p.bookTitle, meta: `Opened ${p.timesOpened} time${p.timesOpened === 1 ? '' : 's'}` })),
    ...downloads.map((d) => ({ type: 'download', date: d.date, title: d.bookTitle, meta: 'Downloaded' })),
    ...orders.map((o) => ({ type: 'order', date: o.date, title: orderItemsOf(o).map((i) => i.title).join(', ') || 'Order placed', meta: `Order · ${o.status || 'Pending'}` })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const wrap = document.getElementById('ovRecentActivity');
  if (wrap) {
    wrap.innerHTML = merged.length ? merged.map((m) => `
      <div class="activity-row">
        <div class="activity-ic">${m.type === 'read' ? '📖' : m.type === 'download' ? '⬇️' : '🧾'}</div>
        <div style="flex:1;"><h5>${escapeHtml(m.title)}</h5><span>${escapeHtml(m.meta)}</span></div>
        <span class="activity-date">${formatDate(m.date)}</span>
      </div>`).join('') : emptyStateHtml('No activity yet', 'Start reading or shopping to see it here.');
  }
}

/* ---- Unified Activity History tab ---- */
function renderActivityHistory() {
  const wrap = document.getElementById('activityHistoryList');
  if (!wrap) return;
  const user = getCurrentUser();
  if (!user) return;
  const reading = getReadingProgress().filter((p) => p.userId === user.id);
  const downloads = getDownloadHistory().filter((d) => d.userId === user.id);
  const orders = getOrders().filter((o) => o.userId === user.id);
  const merged = [
    ...reading.map((p) => ({ type: 'read', date: p.lastOpened, title: p.bookTitle, meta: `Opened ${p.timesOpened} time${p.timesOpened === 1 ? '' : 's'}` })),
    ...downloads.map((d) => ({ type: 'download', date: d.date, title: d.bookTitle, meta: 'Downloaded' })),
    ...orders.map((o) => ({ type: 'order', date: o.date, title: orderItemsOf(o).map((i) => i.title).join(', ') || 'Order placed', meta: `৳${orderTotalOf(o).toFixed(0)} · ${o.status || 'Pending'}` })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  wrap.innerHTML = merged.length ? merged.map((m) => `
    <div class="activity-row">
      <div class="activity-ic">${m.type === 'read' ? '📖' : m.type === 'download' ? '⬇️' : '🧾'}</div>
      <div style="flex:1;"><h5>${escapeHtml(m.title)}</h5><span>${escapeHtml(m.meta)}</span></div>
      <span class="activity-date">${formatDate(m.date)}</span>
    </div>`).join('') : emptyStateHtml('No activity yet', 'Everything you read, download, or order will show up here.');
}

/* ---- Notifications tab (derived from real order/account state — no new
   backend table, purely computed from data already loaded) ---- */
function renderNotifications() {
  const wrap = document.getElementById('notificationsList');
  if (!wrap) return;
  const user = getCurrentUser();
  if (!user) return;
  const orders = getOrders().filter((o) => o.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const notifs = [];
  if (user.canDownload === false) {
    notifs.push({ icon: '🚫', title: 'Downloads are currently disabled', meta: 'An admin has paused your download permission. Contact the library desk if this seems wrong.', date: null });
  }
  orders.slice(0, 6).forEach((o) => {
    const items = orderItemsOf(o).map((i) => i.title).join(', ') || 'your order';
    const icon = o.status === 'Completed' ? '✅' : o.status === 'Cancelled' ? '❌' : o.status === 'Processing' ? '⏳' : '🧾';
    notifs.push({ icon, title: `Order status: ${o.status || 'Pending'}`, meta: items, date: o.date });
  });
  notifs.push({ icon: '👋', title: 'Welcome to Online Library', meta: `Account created ${formatDate(user.createdDate)}`, date: user.createdDate });
  wrap.innerHTML = notifs.map((n) => `
    <div class="notif-card">
      <div class="notif-ic">${n.icon}</div>
      <div style="flex:1;"><h5>${escapeHtml(n.title)}</h5><span>${escapeHtml(n.meta)}</span></div>
      ${n.date ? `<span class="activity-date">${formatDate(n.date)}</span>` : ''}
    </div>`).join('');
}

/* ---- Favorites / bookmarks — no bookmarking entry point exists yet
   anywhere else in the app, so this is an honest empty state for now. ---- */
function renderFavoritesView() {
  const wrap = document.getElementById('favoritesGrid');
  if (!wrap) return;
  wrap.innerHTML = emptyStateHtml('No favorites yet', "Bookmarking books from the catalogue is coming soon — check back here once it's live.");
}

/* ---- Profile ---- */
function renderProfileView() {
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById('profFullName').value = user.fullName;
  document.getElementById('profMobile').value = user.mobile;
  document.getElementById('profEmail').value = user.email;
  document.getElementById('profAddress').value = user.address;

  const initials = escapeHtml(initialsOf(user.fullName));
  setText('profileAvatarInitials', initials);
  setText('editAvatarInitials', initials);
  setText('profileSummaryName', user.fullName);
  setText('profileSummaryEmail', user.email);
  setText('profileSummaryMobile', user.mobile);
  setText('profileSummaryAddress', user.address);
  setText('profileSummaryJoined', formatDate(user.createdDate));
  const downloadText = user.canDownload === false ? 'Disabled by admin' : 'Enabled';
  setText('profileSummaryDownload', downloadText);
  setText('settingsDownloadPermission', downloadText);
}
async function saveProfileEdits(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;
  const form = e.target;
  const submitBtn = document.getElementById('profileSaveBtn');
  const successEl = document.getElementById('profileSaveSuccess');
  successEl?.classList.remove('show');
  const fullName = document.getElementById('profFullName').value.trim();
  const address = document.getElementById('profAddress').value.trim();
  if (!fullName || !address) {
    showToast('Name and address cannot be empty.', 'error');
    form.classList.add('field-error-shake');
    setTimeout(() => form.classList.remove('field-error-shake'), 400);
    return;
  }
  user.fullName = fullName;
  user.address = address;
  submitBtn?.classList.add('loading');
  submitBtn && (submitBtn.disabled = true);
  try {
    await updateUserRecord(user);
    showToast('Profile updated.');
    successEl?.classList.add('show');
    document.getElementById('greetUserName').textContent = user.fullName;
    renderProfileView();
    renderDashboardOverview();
    renderUserNavState();
  } catch (err) {
    showToast('Could not save your profile changes.', 'error');
    form.classList.add('field-error-shake');
    setTimeout(() => form.classList.remove('field-error-shake'), 400);
  } finally {
    submitBtn?.classList.remove('loading');
    submitBtn && (submitBtn.disabled = false);
  }
}
async function changeOwnPassword(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;
  const form = e.target;
  const errorEl = document.getElementById('pwChangeError');
  const submitBtn = document.getElementById('pwChangeBtn');
  const successEl = document.getElementById('pwChangeSuccess');
  setFieldError(errorEl, '');
  successEl?.classList.remove('show');
  const current = document.getElementById('pwCurrent').value;
  const next = document.getElementById('pwNew').value;
  const confirm = document.getElementById('pwConfirm').value;
  submitBtn?.classList.add('loading');
  submitBtn && (submitBtn.disabled = true);
  try {
    if (!isStrongPassword(next)) throw new Error('New password must be at least 8 characters with letters and numbers.');
    if (next !== confirm) throw new Error('New passwords do not match.');

    if (!sb) {
      const currentHash = await hashPassword(current, user.salt);
      if (currentHash !== user.passwordHash) throw new Error('Current password is incorrect.');
      const salt = genSalt();
      user.salt = salt;
      user.passwordHash = await hashPassword(next, salt);
      await updateUserRecord(user);
    } else {
      // Re-verify the current password by attempting a fresh sign-in before
      // allowing the change — Supabase's updateUser() alone doesn't check it.
      const { error: reauthError } = await sb.auth.signInWithPassword({ email: user.email, password: current });
      if (reauthError) throw new Error('Current password is incorrect.');
      const { error: updateError } = await sb.auth.updateUser({ password: next });
      if (updateError) throw new Error(updateError.message);
    }

    showToast('Password changed.');
    successEl?.classList.add('show');
    form.reset();
  } catch (err) {
    setFieldError(errorEl, err.message || 'Could not change password.');
    form.classList.add('field-error-shake');
    setTimeout(() => form.classList.remove('field-error-shake'), 400);
  } finally {
    submitBtn?.classList.remove('loading');
    submitBtn && (submitBtn.disabled = false);
  }
}

/* ---- My Library (academic books: browse + read/download, gated) ---- */
function renderMyLibrary() {
  const depts = getDepartments();
  const chipsWrap = document.getElementById('myLibDeptChips');
  const tabsWrap = document.getElementById('myLibSemTabs');
  const grid = document.getElementById('myLibGrid');
  if (!chipsWrap || !tabsWrap || !grid) return;

  chipsWrap.innerHTML = ['<button class="chip' + (userDashState.deptFilter === 'all' ? ' active' : '') + '" data-dept="all">All departments</button>']
    .concat(depts.map((d) => `<button class="chip${userDashState.deptFilter === d.id ? ' active' : ''}" data-dept="${d.id}">${d.icon} ${d.shortName}</button>`))
    .join('');
  chipsWrap.querySelectorAll('[data-dept]').forEach((chip) => chip.addEventListener('click', () => {
    userDashState.deptFilter = chip.dataset.dept; userDashState.semFilter = 1; renderMyLibrary();
  }));

  const activeDept = userDashState.deptFilter === 'all' ? null : depts.find((d) => d.id === userDashState.deptFilter);
  const totalSem = activeDept ? activeDept.totalSemesters : Math.max(...depts.map((d) => d.totalSemesters));
  let tabs = '';
  for (let i = 1; i <= totalSem; i++) tabs += `<button class="sem-tab${userDashState.semFilter === i ? ' active' : ''}" data-sem="${i}">Semester ${i}</button>`;
  tabsWrap.innerHTML = tabs;
  tabsWrap.querySelectorAll('[data-sem]').forEach((tab) => tab.addEventListener('click', () => { userDashState.semFilter = Number(tab.dataset.sem); renderMyLibrary(); }));

  const books = getBooks().filter((b) => (userDashState.deptFilter === 'all' || b.department === userDashState.deptFilter) && b.semester === userDashState.semFilter);
  grid.innerHTML = books.length ? books.map((b) => bookCardHtml(b)).join('') : emptyStateHtml('No books here yet', 'Try another semester or department.');
  attachBookCardHandlers(grid);
}

function renderMyLibraryHistory() {
  const user = getCurrentUser();
  const readWrap = document.getElementById('myReadingHistory');
  const dlWrap = document.getElementById('myDownloadHistory');
  if (readWrap) {
    const list = getReadingProgress().filter((p) => p.userId === user.id).sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
    readWrap.innerHTML = list.length ? list.map((p) => `
      <div class="recent-item">
        <div class="mini-cover">${escapeHtml(initialsOf(p.bookTitle))}</div>
        <div style="flex:1;"><h5>${escapeHtml(p.bookTitle)}</h5><span>Opened ${p.timesOpened} time${p.timesOpened === 1 ? '' : 's'} · Last read ${formatDate(p.lastOpened)}</span></div>
      </div>`).join('') : '<p class="text-muted">You haven\'t read any books yet.</p>';
  }
  if (dlWrap) {
    const list = getDownloadHistory().filter((d) => d.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    dlWrap.innerHTML = list.length ? list.map((d) => `
      <div class="recent-item">
        <div class="mini-cover">${escapeHtml(initialsOf(d.bookTitle))}</div>
        <div style="flex:1;"><h5>${escapeHtml(d.bookTitle)}</h5><span>Downloaded ${formatDate(d.date)}</span></div>
      </div>`).join('') : '<p class="text-muted">You haven\'t downloaded any books yet.</p>';
  }
}

/* ---- Cart tab ---- */
function renderCartView() {
  const wrap = document.getElementById('userCartList');
  if (!wrap) return;
  const items = cartLineItems();
  if (!items.length) {
    wrap.innerHTML = '<p class="text-muted">Your cart is empty.</p>';
    setText('userCartTotal', '৳0');
    return;
  }
  wrap.innerHTML = items.map((i) => `
    <div class="recent-item">
      <div style="flex:1;"><h5>${escapeHtml(i.title)}</h5><span>৳${i.price.toFixed(0)} each${!i.available ? ' · No longer available' : ''}</span></div>
      <input type="number" min="1" value="${i.qty}" data-cart-qty="${i.bookId}" style="width:60px;padding:.4rem;border-radius:8px;border:1px solid var(--border);" />
      <button class="btn btn-danger btn-sm" data-cart-remove="${i.bookId}">Remove</button>
    </div>`).join('');
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  setText('userCartTotal', `৳${total.toFixed(0)}`);
  wrap.querySelectorAll('[data-cart-qty]').forEach((input) => input.addEventListener('change', () => { setCartQty(input.dataset.cartQty, Number(input.value)); renderCartView(); }));
  wrap.querySelectorAll('[data-cart-remove]').forEach((btn) => btn.addEventListener('click', () => { removeFromCart(btn.dataset.cartRemove); renderCartView(); }));
}

/* ---- Order history ---- */
function renderMyOrders() {
  const wrap = document.getElementById('myOrdersList');
  if (!wrap) return;
  const user = getCurrentUser();
  const orders = getOrders().filter((o) => o.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  wrap.innerHTML = orders.length ? orders.map((o) => {
    const items = orderItemsOf(o);
    const itemsLine = items.map((i) => `${escapeHtml(i.title)} × ${i.qty}`).join(', ');
    return `
    <div class="recent-item" style="align-items:flex-start;">
      <div style="flex:1;">
        <h5>Order · ${formatDate(o.date)}</h5>
        <span>${itemsLine}</span>
        <p class="text-muted" style="margin-top:.3rem;">৳${orderTotalOf(o).toFixed(0)} total · ${escapeHtml(orderPaymentMethod(o))}</p>
        ${orderAddress(o) ? `<p class="text-muted" style="margin-top:.2rem;">📍 ${escapeHtml(orderAddress(o))}</p>` : ''}
        ${orderTrxId(o) ? `<p class="text-muted" style="margin-top:.2rem;">🧾 TrxID: ${escapeHtml(orderTrxId(o))} · ${o.paymentVerified ? 'Payment verified ✓' : 'Payment verification pending'}</p>` : ''}
      </div>
      <span class="badge">${escapeHtml(o.status || 'Pending')}</span>
    </div>`;
  }).join('') : '<p class="text-muted">No orders yet — visit the Book Store to place one.</p>';
}

/* ---------------------------------------------------------------------- */
/* 8. BOOT                                                                 */
/* ---------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  initLoadingScreen();
  initTheme();
  initMobileNav();
  initBackToTop();
  initActiveNavLink();
  initRippleEffect();

  if (sb) {
    sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') openResetPasswordModal();
    });
  }

  await loadAllData();
  await refreshAuthSession();
  await Promise.all([loadUsers(), loadReadingProgress(), loadDownloadHistory(), loadOrders()]);

  const page = document.body.dataset.page;
  if (page !== 'dashboard') injectUserNavControls();
  if (page === 'home') initHomePage();
  if (page === 'admin') initAdminLoginPage();
  if (page === 'store') initStorePage();
  if (page === 'details') initBookDetailsPage();
  if (page === 'user-dashboard') initUserDashboardPage();
  if (page === 'dashboard') {
    initDashboardPage();
    setupAddDepartmentForm();
    setupAddSemesterForm();
    setupAddCourseForm();
    setupAddStoreCategoryForm();
    initTableToolbars();
  }
  initReveal();
  initModalA11y();
  hideLoadingScreen();
});
