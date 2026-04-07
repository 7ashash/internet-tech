const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');
const MAIL_LOG_PATH = path.join(DATA_DIR, 'mail-log.txt');
const UPLOADS_DIR = path.join(ROOT, 'website', 'images', 'uploads');
const SITE_CONTENT_KEY = 'homepage';
const SESSION_SECRET = process.env.SESSION_SECRET || 'must-dev-session-secret';
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@must.edu.eg';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MustAdmin2026!';
const SQLiteStore = SQLiteStoreFactory(session);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const DEFAULT_SITE_CONTENT = {
  heroTitle: 'Environmental and Community Service Sector',
  briefTitle: 'Brief',
  briefParagraph1: 'Our goal is to prepare a distinguished graduate with the competitive ability and morals to meet the challenges of his time.',
  briefParagraph2: 'Let us all work together in harmony and remain united with the vision of a better tomorrow for all.',
  viceDeanSectionTitle: "Vice Dean's Message",
  viceDeanHeading: 'Welcome to the Environmental and Community Service Sector',
  viceDeanParagraph1: 'I am delighted to welcome you to the website of the Faculty of Applied Arts. We believe in our vital role in serving the community and developing the environment, which stems from our academic and research mission.',
  viceDeanParagraph2: 'In the Community Service and Environmental Development Sector, we strive to establish sustainable communication with various segments of society and foster effective partnerships between the faculty and community institutions to achieve sustainable development. We are also dedicated to offering training programs, awareness events, and environmental initiatives that contribute to raising awareness and improving the quality of life.',
  viceDeanParagraph3: "We consistently aspire to innovate and advance all the activities and services we provide, aligning with the state's vision for comprehensive development.",
  viceDeanClosing: 'With best wishes for your success,',
  viceDeanSignatureRole: '- Vice Dean of Community Service and Environmental Development',
  viceDeanSignatureName: 'Dr. Khaled Abdel Salam',
  viceDeanImageUrl: 'images/Dr-Khaled.jpeg',
  visionText: 'To be a leading sector in achieving sustainable environmental and community development locally and regionally, while maintaining an unbreakable bond with our esteemed alumni.',
  missionText: 'Providing exceptional community services, managing environmental crises effectively, and continuously upgrading the skills of our alumni to meet the dynamic demands of the labor market.',
  objective1: 'Supporting sustainable development through projects that contribute to environmental conservation and promote environmental awareness.',
  objective2: 'Qualifying graduates for the labor market through specialized training programs and partnerships with various institutions.',
  objective3: 'Enhance crisis management protocols.',
  objective4: 'Foster community partnerships.',
  planSectionTitle: "Sector's Annual Plan",
  planIntro: 'Our annual plan outlines strategic initiatives aimed at community engagement, environmental preservation, and alumni support for the current academic year.',
  activitiesSectionTitle: "Sector's Activities",
  planFileTitle: 'Annual Plan 2025/2026',
  planFileMeta: 'PDF Document (2.4 MB)',
  planButtonText: 'Download',
  activity1Month: 'OCT',
  activity1Day: '15',
  activity1Title: 'Annual Alumni Employment Fair',
  activity1Description: 'Connecting graduates with top-tier companies.',
  activity2Month: 'NOV',
  activity2Day: '22',
  activity2Title: 'Environmental Awareness Workshop',
  activity2Description: 'Promoting green initiatives on campus.',
  activity3Month: 'MAR',
  activity3Day: '10',
  activity3Title: 'Community Health Caravan',
  activity3Description: 'Providing medical services to surrounding districts.',
  committeesTitle: "Sector's Committees",
  committeesIntro: 'The sector operates through specialized committees dedicated to ensuring the safety, success, and continuous development of our university community and alumni.',
  alumniCommitteeTitle: 'Alumni Follow-up',
  alumniCommitteeDescription: 'Dedicated to tracking graduate success, facilitating communication between the university and its alumni, and gathering feedback to improve academic programs.',
  crisisCommitteeTitle: 'Crisis Management',
  crisisCommitteeDescription: 'Responsible for developing proactive safety plans, assessing campus risks, and ensuring the rapid and safe response to any environmental or structural emergencies.',
  communityCommitteeTitle: 'Community Service',
  communityCommitteeDescription: 'Focuses on organizing outreach programs, charity drives, and educational initiatives that benefit the local communities surrounding the university campus.',
  protocolsTitle: 'Protocols',
  protocolsIntro: 'A dedicated section for the protocols requested in the paper. The visible note clearly points to administrative protocols and a notification protocol, so both are included below in a clean English version.',
  adminProtocolDescription: 'Administrative protocols organize approvals, documentation flow, internal coordination, and follow-up responsibilities for the sector.',
  adminProtocolItem1: 'Internal approvals and official documentation',
  adminProtocolItem2: 'Sector coordination and workflow management',
  adminProtocolItem3: 'Follow-up on implementation and reporting',
  notificationProtocolDescription: 'This protocol covers how announcements, notices, and formal notifications are communicated clearly to the relevant audience.',
  notificationProtocolItem1: 'Official notices and alert handling',
  notificationProtocolItem2: 'Communication to staff, students, and graduates',
  notificationProtocolItem3: 'Clear delivery channels and response tracking',
  servicesTitle: 'Alumni Services',
  alumniCardTitle: 'Alumni excellence card',
  alumniCardDescription: "University graduates can receive it for a sum in Egyptian pounds and expires every two years. Payment is made in cash or at one of the university's banks.",
  alumniBenefitsTitle: 'Graduates will enjoy some benefits such as:',
  alumniBenefit1: 'Using the university library and free stadiums',
  alumniBenefit2: 'Get a discount on university training courses',
  alumniBenefit3: 'Participating in events organized by the university',
  alumniBenefit4: 'A range of discounts and concessions are being contracted',
  alumniCardNotice: 'Note the Card activation is currently on hold. It will be announced to all alumni once it is finalised.',
  emailServiceTitle: 'Email Service',
  emailServiceDescription: 'In cooperation with the Education Technology Department, the free Microsoft Office 365 will be launched to all alumni as a new service.',
  serviceFeaturesTitle: 'It has many features such as:',
  serviceFeature1: 'Download the latest Office 365 versions (Word, Excel, PowerPoint).',
  serviceFeature2: '1 TB of OneDrive storage.',
  serviceFeature3: 'Install Office on up to 5 PCs or Macs.',
  galleryTitle: 'Alumni Memories',
  notableAlumniEyebrow: 'Notable Alumni',
  notableAlumniTitle: 'What Our Alumni Say',
  alumni1Name: 'Dr. Rania Alwani',
  alumni1Text: 'She obtained a Bachelor of Medicine and Surgery from Misr University...',
  alumni2Name: 'Ahmed Hatem',
  alumni2Text: 'An Egyptian actor who studied media in the faculty of mass communication...',
  alumni3Name: 'Asmaa Galal',
  alumni3Text: 'An Egyptian actress, started her artistic career in 2017...',
  alumni4Name: 'Nehal Nabil',
  alumni4Text: 'Graduated from the Faculty of Mass Communication, Misr University...',
  awardsTitle: 'Awards & Certificates',
  awardsSubtitle: 'MUST is a pioneer in getting awards in all fields thanks to its precious leading authority and success-seeking students.',
  eventsSectionTitle: 'Related Events',
  newsSectionTitle: 'News',
  contactTitle: 'Reach us any time.',
  contactSubtitle: 'Or contact us by email',
  contactEmail: 'info.alumni@must.edu.eg',
  contactFormTitle: 'Leave a message',
  eventsCtaText: 'See All Events',
  eventsCtaUrl: 'https://must.edu.eg/event/',
  newsCtaText: 'See All News',
  newsCtaUrl: 'https://must.edu.eg/news/',
  footerPhone: '16878',
  footerEmail: 'Info@Must.Edu.Eg',
  footerAddress: 'Al Motamayez District - 6th of October, Egypt',
  footerCopyright: 'Copyright All Right Reserved @ MUST UNIVERSITY 2025'
};

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      university_id TEXT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 0,
      activation_token TEXT,
      created_at TEXT NOT NULL,
      activated_at TEXT,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new'
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      badge TEXT NOT NULL,
      title TEXT NOT NULL,
      image_url TEXT,
      link_text TEXT,
      link_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      month_year TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      image_url TEXT,
      link_text TEXT,
      link_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const userColumns = db.prepare(`PRAGMA table_info(users)`).all();
  const hasUniversityId = userColumns.some((column) => column.name === 'university_id');
  if (!hasUniversityId) {
    db.exec(`ALTER TABLE users ADD COLUMN university_id TEXT`);
  }
}

function seedDefaultContent() {
  const newsCount = db.prepare('SELECT COUNT(*) AS count FROM news').get().count;
  if (!newsCount) {
    const seedNews = [
      ['23 February 2026', 'Participation of Misr University for Science and Technology in the Cairo International Book Fair (57th Edition)', 'images/bookfair-news.jpg', 'Read more', '#https://must.edu.eg/news/participation-of-misr-university-for-science-and-technology-in-the-cairo-international-book-fair-57th-edition/'],
      ['08 March 2026', 'Seminar: Towards a Confident Generation: Balancing Faith and Community Effectiveness - MUST Reading Club', 'images/seminar-news.jpg', 'Read more', '#https://must.edu.eg/news/seminar-towards-a-confident-generation-balancing-faith-and-community-effectiveness-must-reading-club/'],
      ['March 23, 2025', 'The Fourth Forum for Students and Graduates of the College', 'images/news-3.jpg', 'Read more', '#'],
      ['January 23, 2024', 'The First Scientific Day at The British Council Egypt for The Orientation of The Masters of Implantology in collaboration with Huddersfield University', 'images/news-2.jpg', 'Read more', '#'],
      ['January 23, 2023', 'The Official Signing of a Collaboration Protocol between Ege Universitesi in Turkey and Misr University for Science and Technology', 'images/photo-slider1.jpeg', 'Read more', '#https://www.facebook.com/share/p/1KtP8AfiGE/']
    ];
    const insertNews = db.prepare(`
      INSERT INTO news (badge, title, image_url, link_text, link_url, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    seedNews.forEach((item, index) => {
      insertNews.run(item[0], item[1], item[2], item[3], item[4], index, new Date().toISOString());
    });
  }

  const eventsCount = db.prepare('SELECT COUNT(*) AS count FROM events').get().count;
  if (!eventsCount) {
    const seedEvents = [
      ['4', 'Feb', 'Ferrari: Driving Luxury Beyond the Road', 'MUST proudly hosts Rome Business School for a featured event.', 'images/ferrari-event.jpeg', 'Register Now', '#https://must.edu.eg/event/ferrari-driving-luxury-beyond-the-road/'],
      ['23', 'Feb', 'MUST Cultural Day', 'Meet us on Sunday, 23rd of February 2025, for a vibrant cultural day.', 'images/event-4.jpg', 'Register Now', 'https://must.edu.eg/event/must-cultural-day/'],
      ['11', 'Dec', 'MUST Winter Festival', 'A seasonal celebration with activities, music, and campus gatherings.', 'images/event-3.jpg', 'Register Now', 'https://must.edu.eg/event/must-winter-festival/'],
      ['11', 'Feb', 'International Day for Women and Girls in Science Celebration', 'The College of Medicine celebrates science leadership and achievement.', 'images/event-2.jpeg', 'Register Now', '#https://must.edu.eg/event/international-day-for-women-and-girls-in-science-celebration/'],
      ['6', 'Nov', 'College of Information Technology conference entitled Artificial Intelligence for Environmental Sustainability', 'A conference highlighting AI applications for environmental sustainability.', '', 'Register Now', 'https://must.edu.eg/event/college-of-information-technology-conference-entitle-artificial-intelligence-for-environmental-sustainability-2/']
    ];
    const insertEvent = db.prepare(`
      INSERT INTO events (day, month_year, title, summary, image_url, link_text, link_url, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    seedEvents.forEach((item, index) => {
      insertEvent.run(item[0], item[1], item[2], item[3], item[4], item[5], item[6], index, new Date().toISOString());
    });
  }

  const siteContentRow = db.prepare('SELECT key FROM site_settings WHERE key = ?').get(SITE_CONTENT_KEY);
  if (!siteContentRow) {
    db.prepare(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run(SITE_CONTENT_KEY, JSON.stringify(DEFAULT_SITE_CONTENT), new Date().toISOString());
  }
}

function seedAdmin() {
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL.toLowerCase());
  if (existingAdmin) {
    return;
  }
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, role, is_active, created_at, activated_at)
    VALUES (?, ?, ?, 'admin', 1, ?, ?)
  `).run('MUST Administrator', ADMIN_EMAIL.toLowerCase(), passwordHash, now, now);
}

runMigrations();
seedDefaultContent();
seedAdmin();

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

const transporter = createTransporter();

function logMail(to, subject, text) {
  const block = [
    '-----',
    `Date: ${new Date().toISOString()}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    text,
    ''
  ].join('\n');
  fs.appendFileSync(MAIL_LOG_PATH, block, 'utf8');
}

async function sendActivationEmail(user, token) {
  const activationUrl = `${BASE_URL}/activate.html?token=${encodeURIComponent(token)}`;
  const subject = 'Activate your MUST website account';
  const text = `Hello ${user.name},\n\nActivate your account by opening this link:\n${activationUrl}\n\nIf you did not create this account, ignore this email.`;

  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject,
      text
    });
  } else {
    logMail(user.email, subject, text);
  }

  return activationUrl;
}

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    activatedAt: row.activated_at
  };
}

function now() {
  return new Date().toISOString();
}

function getSiteContent() {
  const row = db.prepare('SELECT value FROM site_settings WHERE key = ?').get(SITE_CONTENT_KEY);
  if (!row) {
    return { ...DEFAULT_SITE_CONTENT };
  }

  try {
    const parsed = JSON.parse(row.value);
    return { ...DEFAULT_SITE_CONTENT, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch (error) {
    console.error('Could not parse site content JSON', error);
    return { ...DEFAULT_SITE_CONTENT };
  }
}

function saveSiteContent(content) {
  const merged = { ...DEFAULT_SITE_CONTENT, ...(content && typeof content === 'object' ? content : {}) };
  db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(SITE_CONTENT_KEY, JSON.stringify(merged), now());
  return merged;
}

function mustEmail(email) {
  return /^[^@\s]+@must\.edu\.eg$/i.test(String(email || '').trim());
}

function emailMatchesUniversityId(email, universityId) {
  return String(email || '').trim().toLowerCase() === `${String(universityId || '').trim()}@must.edu.eg`.toLowerCase();
}

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'Login required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, error: 'Login required' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'Admin access required' });
  }
  next();
}

const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: DATA_DIR
  }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use('/website', express.static(path.join(ROOT, 'website')));
app.use('/admin-dashboard', express.static(path.join(ROOT, 'admin-dashboard')));
app.use('/activate.html', express.static(path.join(ROOT, 'website', 'activate.html')));
app.use('/api/assets', express.static(path.join(ROOT, 'website', 'images')));

app.get('/', (req, res) => {
  res.redirect('/website/index.html');
});

app.get('/api/session', (req, res) => {
  res.json({
    ok: true,
    authenticated: Boolean(req.session.user),
    user: req.session.user || null
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const universityId = String(req.body.universityId || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2) {
      return res.status(400).json({ ok: false, error: 'Name must be at least 2 characters' });
    }
    if (universityId.length < 4) {
      return res.status(400).json({ ok: false, error: 'Enter a valid University ID' });
    }
    if (!mustEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Use your MUST email in the format username@must.edu.eg' });
    }
    if (!emailMatchesUniversityId(email, universityId)) {
      return res.status(400).json({ ok: false, error: `The email must exactly match your University ID in this format: ${universityId}@must.edu.eg` });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ ok: false, error: 'This email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(24).toString('hex');
    const created = db.prepare(`
      INSERT INTO users (name, university_id, email, password_hash, role, is_active, activation_token, created_at)
      VALUES (?, ?, ?, ?, 'user', 0, ?, ?)
    `).run(name, universityId, email, passwordHash, token, now());

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(created.lastInsertRowid);
    const activationUrl = await sendActivationEmail(user, token);

    res.status(201).json({
      ok: true,
      message: transporter ? 'Activation email sent to your MUST mailbox' : 'SMTP is not configured yet, so the activation link was logged locally',
      activationPreviewUrl: transporter ? null : activationUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Could not create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Incorrect email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Incorrect email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ ok: false, error: 'Activate your account from your MUST email before logging in' });
    }

    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now(), user.id);
    req.session.user = sanitizeUser(user);
    res.json({ ok: true, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Could not login' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/api/auth/activate', (req, res) => {
  const token = String(req.query.token || '');
  if (!token) {
    return res.status(400).json({ ok: false, error: 'Missing activation token' });
  }

  const user = db.prepare('SELECT * FROM users WHERE activation_token = ?').get(token);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'Invalid or expired activation link' });
  }

  db.prepare(`
    UPDATE users
    SET is_active = 1, activation_token = NULL, activated_at = ?
    WHERE id = ?
  `).run(now(), user.id);

  res.json({ ok: true, message: 'Account activated successfully. You can now login.' });
});

app.post('/api/contact', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();
  const message = String(req.body.message || '').trim();

  if (name.length < 2 || !email || message.length < 5) {
    return res.status(400).json({ ok: false, error: 'Please complete all required contact fields' });
  }

  db.prepare(`
    INSERT INTO contact_messages (name, email, phone, message, created_at, status)
    VALUES (?, ?, ?, ?, ?, 'new')
  `).run(name, email, phone, message, now());

  res.status(201).json({ ok: true, message: 'Your message has been sent successfully' });
});

app.post('/api/admin/assets', requireAdmin, (req, res) => {
  const fileName = String(req.body.fileName || 'image').trim();
  const dataUrl = String(req.body.dataUrl || '').trim();
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);

  if (!match) {
    return res.status(400).json({ ok: false, error: 'Please upload a valid image file' });
  }

  const extensionMap = {
    jpeg: 'jpg',
    jpg: 'jpg',
    png: 'png',
    webp: 'webp',
    gif: 'gif'
  };
  const extension = extensionMap[String(match[1] || '').toLowerCase()];
  if (!extension) {
    return res.status(400).json({ ok: false, error: 'Only JPG, PNG, WEBP, and GIF files are supported' });
  }

  let buffer;
  try {
    buffer = Buffer.from(match[2], 'base64');
  } catch (error) {
    return res.status(400).json({ ok: false, error: 'The uploaded image could not be decoded' });
  }

  if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
    return res.status(400).json({ ok: false, error: 'Image size must be between 1 byte and 8 MB' });
  }

  const originalBaseName = path.basename(fileName, path.extname(fileName)) || 'image';
  const safeBaseName = originalBaseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';

  const storedFileName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBaseName}.${extension}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, storedFileName), buffer);

  res.status(201).json({
    ok: true,
    imageUrl: `images/uploads/${storedFileName}`
  });
});

function listNews() {
  return db.prepare('SELECT id, badge, title, image_url AS imageUrl, link_text AS linkText, link_url AS linkUrl FROM news ORDER BY sort_order ASC, id DESC').all();
}

function listEvents() {
  return db.prepare('SELECT id, day, month_year AS monthYear, title, summary, image_url AS imageUrl, link_text AS linkText, link_url AS linkUrl FROM events ORDER BY sort_order ASC, id DESC').all();
}

app.get('/api/content/public', (req, res) => {
  res.json({ ok: true, news: listNews(), events: listEvents(), sections: getSiteContent() });
});

app.get('/api/admin/content', requireAdmin, (req, res) => {
  res.json({ ok: true, news: listNews(), events: listEvents(), sections: getSiteContent() });
});

app.post('/api/admin/content', requireAdmin, (req, res) => {
  const news = Array.isArray(req.body.news) ? req.body.news : null;
  const events = Array.isArray(req.body.events) ? req.body.events : null;
  const sections = req.body.sections && typeof req.body.sections === 'object' ? req.body.sections : null;

  if (!news || !events) {
    return res.status(400).json({ ok: false, error: 'news and events must both be arrays' });
  }

  const insertNews = db.prepare(`
    INSERT INTO news (badge, title, image_url, link_text, link_url, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEvent = db.prepare(`
    INSERT INTO events (day, month_year, title, summary, image_url, link_text, link_url, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM news').run();
    db.prepare('DELETE FROM events').run();

    news.forEach((item, index) => {
      insertNews.run(
        String(item.badge || '').trim(),
        String(item.title || '').trim(),
        String(item.imageUrl || '').trim(),
        String(item.linkText || 'Read more').trim(),
        String(item.linkUrl || '#').trim(),
        index,
        now()
      );
    });

    events.forEach((item, index) => {
      insertEvent.run(
        String(item.day || '').trim(),
        String(item.monthYear || '').trim(),
        String(item.title || '').trim(),
        String(item.summary || '').trim(),
        String(item.imageUrl || '').trim(),
        String(item.linkText || 'Register Now').trim(),
        String(item.linkUrl || '#').trim(),
        index,
        now()
      );
    });
  });

  transaction();
  const savedSections = saveSiteContent(sections || getSiteContent());
  res.json({ ok: true, message: 'Content updated successfully', sections: savedSections });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT id, name, university_id, email, role, is_active, activation_token, created_at, activated_at, last_login_at
    FROM users
    ORDER BY created_at DESC
  `).all().map((user) => ({
    id: user.id,
    name: user.name,
    universityId: user.university_id,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.is_active),
    activationUrl: user.activation_token ? `${BASE_URL}/activate.html?token=${encodeURIComponent(user.activation_token)}` : null,
    createdAt: user.created_at,
    activatedAt: user.activated_at,
    lastLoginAt: user.last_login_at
  }));

  res.json({ ok: true, users });
});

app.post('/api/admin/users/:id/status', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const isActive = req.body.isActive ? 1 : 0;
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive, userId);
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const role = req.body.role === 'admin' ? 'admin' : 'user';
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  if (!userId) {
    return res.status(400).json({ ok: false, error: 'Invalid user id' });
  }

  if (req.session.user && req.session.user.id === userId) {
    return res.status(400).json({ ok: false, error: 'You cannot delete the admin account currently logged in' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!existingUser) {
    return res.status(404).json({ ok: false, error: 'User not found' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.json({ ok: true });
});

app.get('/api/admin/messages', requireAdmin, (req, res) => {
  const messages = db.prepare(`
    SELECT id, name, email, phone, message, created_at, status
    FROM contact_messages
    ORDER BY created_at DESC
  `).all();
  res.json({ ok: true, messages });
});

app.post('/api/admin/messages/:id/status', requireAdmin, (req, res) => {
  const messageId = Number(req.params.id);
  const status = String(req.body.status || 'reviewed').trim();
  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, messageId);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`MUST backend running on ${BASE_URL}`);
  console.log(`Website:   ${BASE_URL}/website/index.html`);
  console.log(`Dashboard: ${BASE_URL}/admin-dashboard/admin-dashboard.html`);
  console.log(`Default admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  if (!transporter) {
    console.log(`SMTP not configured. Activation links will be logged to ${MAIL_LOG_PATH}`);
  }
});
