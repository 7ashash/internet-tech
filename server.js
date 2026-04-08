const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');
const MAIL_LOG_PATH = path.join(DATA_DIR, 'mail-log.txt');
const SESSIONS_DB_PATH = path.join(DATA_DIR, 'sessions.db');
const UPLOADS_DIR = path.join(ROOT, 'website', 'images', 'uploads');
const FILE_UPLOADS_DIR = path.join(ROOT, 'website', 'files', 'uploads');
const CURATED_SITE_CONTENT = require('./content/sector-content.json');
const SITE_CONTENT_KEY = 'homepage';
const SESSION_SECRET = process.env.SESSION_SECRET || 'must-dev-session-secret';
const PORT = Number(process.env.PORT || 3000);
const CONFIGURED_BASE_URL = normalizeBaseUrl(process.env.BASE_URL);
const BASE_URL = CONFIGURED_BASE_URL || `http://127.0.0.1:${PORT}`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@must.edu.eg';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MustAdmin2026!';
const MAIL_HOST = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || '';
const MAIL_PORT = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 0);
const MAIL_USER = process.env.BREVO_SMTP_LOGIN || process.env.SMTP_USER || '';
const MAIL_PASS = process.env.BREVO_SMTP_PASSWORD || process.env.SMTP_PASS || '';
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || process.env.SMTP_FROM || MAIL_USER;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'MUST';
const MAIL_SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
const SHOULD_RESET_NON_ADMIN_USERS_ON_BOOT =
  String(process.env.RESET_NON_ADMIN_USERS_ON_BOOT || '').toLowerCase() === 'true' ||
  (
    !String(process.env.RESET_NON_ADMIN_USERS_ON_BOOT || '').trim() &&
    (String(process.env.NODE_ENV || '').toLowerCase() === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT))
  );
const SQLiteStore = SQLiteStoreFactory(session);

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(FILE_UPLOADS_DIR, { recursive: true });

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
  galleryItems: [
    { imageUrl: 'images/photo-slider1.jpeg', alt: 'Gallery 1' },
    { imageUrl: 'images/photo-slider2.jpeg', alt: 'Gallery 2' },
    { imageUrl: 'images/photo-slider3.jpeg', alt: 'Gallery 3' },
    { imageUrl: 'images/photo-slider4.jpeg', alt: 'Gallery 4' },
    { imageUrl: 'images/photo-slider5.jpeg', alt: 'Gallery 5' },
    { imageUrl: 'images/photo-slider6.jpeg', alt: 'Gallery 6' },
    { imageUrl: 'images/photo-slider7.jpeg', alt: 'Gallery 7' },
    { imageUrl: 'images/photo-slider8.jpeg', alt: 'Gallery 8' },
    { imageUrl: 'images/photo-slider9.jpeg', alt: 'Gallery 9' },
    { imageUrl: 'images/photo-slider10.jpeg', alt: 'Gallery 10' },
    { imageUrl: 'images/memory-slide-11.jpg', alt: 'Gallery 11' }
  ],
  notableAlumniEyebrow: 'Notable Alumni',
  notableAlumniTitle: 'What Our Alumni Say',
  notableAlumniItems: [
    { imageUrl: 'images/Dr.-Rania-Alwani.png', name: 'Dr. Rania Alwani', text: 'She obtained a Bachelor of Medicine and Surgery from Misr University...' },
    { imageUrl: 'images/Ahmed-Hatem.png', name: 'Ahmed Hatem', text: 'An Egyptian actor who studied media in the faculty of mass communication...' },
    { imageUrl: 'images/Asmaa-Galal.png', name: 'Asmaa Galal', text: 'An Egyptian actress, started her artistic career in 2017...' },
    { imageUrl: 'images/Nehal-Nabil.png', name: 'Nehal Nabil', text: 'Graduated from the Faculty of Mass Communication, Misr University...' }
  ],
  awardsTitle: 'Awards & Certificates',
  awardsSubtitle: 'MUST is a pioneer in getting awards in all fields thanks to its precious leading authority and success-seeking students.',
  awardItems: [
    { imageUrl: 'images/Awards.png', title: 'Kerolos Mousa', description1: 'Kerolos Mousa Agaypi was an undergraduate student at the College of Biotechnology at the Misr University for Science and Technology in Egypt.', description2: 'He was offered to join a group of researchers at The Harvard School of Engineering and Applied Sciences as they made a significant breakthrough in the field of nano optics and metasurfaces. In 2017, the Michelle Sous Foundation supported him in his quest to raise funds to cover his living expenses for a year in Massachusetts, Boston, in 2018 as he worked on a project for a method to overcome the limitations of the conventional spectrometer. Now he is a Ph.D. student in the applied physics department at Harvard University.' },
    { imageUrl: 'images/awards2.png', title: 'Mostafa', description1: 'Born in 1983, graduated from the Faculty of Mass Communication - Misr University for Science and Technology in 2006. He worked in montage in several places, including Mezika Channel, Al Kahera Wal Nas, ON TV, CBC, and MI7 Advertising Corporate.', description2: 'He participated in several plays during his time at the college, including well-known student productions by Ali Salem.' },
    { imageUrl: 'images/awards3.png', title: 'Yasser Morsy', description1: 'An alumnus of College of Biotechnology, 2009.', description2: 'Yasser Morsy is a bioinformatics scientist in the gastroenterology and hepatology department at the University Hospital Zurich (USZ).' },
    { imageUrl: 'images/awards4.png', title: 'Amin Abdellatif', description1: 'An alumnus of College of Biotechnology, 2009.', description2: 'Amin Abdellatif is a professional with almost 10 years of experience and a proven successful track record in sales, project management, and technical support.' }
  ],
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

Object.assign(DEFAULT_SITE_CONTENT, CURATED_SITE_CONTENT);

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
      ['09 March 2026', 'MUST University Celebrates the International Day of Women and Girls in Science', 'images/official/news-women-girls-science.jpg', 'Read More', 'https://must.edu.eg/news/must-university-celebrates-the-international-day-of-women-and-girls-in-science/'],
      ['08 March 2026', 'Seminar:Towards a Confident Generation: Balancing Faith and Community Effectiveness-MUST Reading Club', 'images/official/news-reading-club.jpg', 'Read More', 'https://must.edu.eg/news/seminar-towards-a-confident-generation-balancing-faith-and-community-effectiveness-must-reading-club/'],
      ['23 February 2026', 'Participation of Misr University for Science and Technology in the Cairo International Book Fair (57th Edition)', 'images/official/news-book-fair.jpg', 'Read More', 'https://must.edu.eg/news/participation-of-misr-university-for-science-and-technology-in-the-cairo-international-book-fair-57th-edition/']
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
      ['04', 'Feb', 'Ferrari: Driving Luxury Beyond the Road', 'MUST proudly hosts Rome Business School for a global case study on innovation, AI, and strategic thinking behind Ferrari.', 'images/official/event-ferrari.jpeg', 'Read More', 'https://must.edu.eg/event/ferrari-driving-luxury-beyond-the-road/'],
      ['09', 'Dec', 'Annual Scientific Day', 'The College of Biotechnology at Misr University for Science and Technology showcases innovation, student projects, and scientific excellence.', 'images/official/event-annual-scientific-day.png', 'Read More', 'https://must.edu.eg/event/annual-scientific-day/'],
      ['06', 'Nov', 'College of Information Technology conference entitle "Artificial Intelligence for Environmental Sustainability"', 'The College of Information Technology highlights how AI can support sustainable development, climate action, and natural resource management.', 'images/official/event-ai-sustainability.png', 'Read More', 'https://must.edu.eg/event/college-of-information-technology-conference-entitle-artificial-intelligence-for-environmental-sustainability-2/']
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

function resetNonAdminUsersOnBoot() {
  const adminEmail = ADMIN_EMAIL.toLowerCase();
  const removedUsers = db.prepare('DELETE FROM users WHERE LOWER(email) <> ?').run(adminEmail).changes;

  ['-wal', '-shm'].forEach((suffix) => {
    const candidate = `${SESSIONS_DB_PATH}${suffix}`;
    if (fs.existsSync(candidate)) {
      fs.rmSync(candidate, { force: true });
    }
  });

  if (fs.existsSync(SESSIONS_DB_PATH)) {
    fs.rmSync(SESSIONS_DB_PATH, { force: true });
  }

  return removedUsers;
}

runMigrations();
seedDefaultContent();
seedAdmin();
const removedUsersOnBoot = SHOULD_RESET_NON_ADMIN_USERS_ON_BOOT ? resetNonAdminUsersOnBoot() : 0;

function createTransporter() {
  if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_SECURE,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS
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

async function sendActivationEmail(user, token, baseUrl) {
  const activationUrl = `${normalizeBaseUrl(baseUrl || BASE_URL)}/activate.html?token=${encodeURIComponent(token)}`;
  const subject = 'Activate your MUST website account';
  const text = `Hello ${user.name},\n\nActivate your account by opening this link:\n${activationUrl}\n\nIf you did not create this account, ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.7;color:#1f2937;">
      <p>Hello ${user.name},</p>
      <p>Activate your account by opening this link:</p>
      <p><a href="${activationUrl}" style="color:#1d4ed8;">${activationUrl}</a></p>
      <p>If you did not create this account, ignore this email.</p>
    </div>
  `;

  if (transporter) {
    await transporter.sendMail({
      from: MAIL_FROM_NAME ? `"${MAIL_FROM_NAME}" <${MAIL_FROM_EMAIL}>` : MAIL_FROM_EMAIL,
      to: user.email,
      subject,
      text,
      html
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

function getBaseUrl(req) {
  if (CONFIGURED_BASE_URL) {
    return CONFIGURED_BASE_URL;
  }

  if (!req) {
    return BASE_URL;
  }

  const forwardedProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
  const forwardedHost = String(req.get('x-forwarded-host') || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'http';
  const host = forwardedHost || req.get('host') || `127.0.0.1:${PORT}`;
  return normalizeBaseUrl(`${protocol}://${host}`);
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
app.set('trust proxy', 1);

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
    secure: process.env.NODE_ENV === 'production' ? 'auto' : false,
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
    const activationUrl = await sendActivationEmail(user, token, getBaseUrl(req));

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

function deleteManagedAsset(assetUrl) {
  const normalized = String(assetUrl || '').trim().replace(/^\/+/, '').replace(/\\/g, '/');
  if (!normalized) {
    return { deleted: false, error: 'Missing asset path' };
  }

  const allowedPrefixes = ['images/uploads/', 'files/uploads/', 'files/plans/'];
  if (!allowedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
    return { deleted: false, error: 'Only uploaded assets can be deleted' };
  }

  const absolutePath = path.join(ROOT, 'website', normalized.split('/').join(path.sep));
  const imagesRoot = path.join(ROOT, 'website', 'images', 'uploads');
  const filesRoot = path.join(ROOT, 'website', 'files', 'uploads');
  const plansRoot = path.join(ROOT, 'website', 'files', 'plans');
  const isInsideAllowedRoot =
    absolutePath.startsWith(imagesRoot) ||
    absolutePath.startsWith(filesRoot) ||
    absolutePath.startsWith(plansRoot);

  if (!isInsideAllowedRoot) {
    return { deleted: false, error: 'Invalid asset path' };
  }

  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }

  return { deleted: true };
}

app.post('/api/admin/assets', requireAdmin, (req, res) => {
  const fileName = String(req.body.fileName || 'asset').trim();
  const dataUrl = String(req.body.dataUrl || '').trim();
  const match = dataUrl.match(/^data:(image\/([a-zA-Z0-9+.-]+)|application\/pdf);base64,(.+)$/);

  if (!match) {
    return res.status(400).json({ ok: false, error: 'Please upload a valid image or PDF file' });
  }

  const mimeType = String(match[1] || '').toLowerCase();
  const imageExtensionMap = {
    jpeg: 'jpg',
    jpg: 'jpg',
    png: 'png',
    webp: 'webp',
    gif: 'gif'
  };

  const isPdf = mimeType === 'application/pdf';
  const extensionMap = {
    pdf: 'pdf'
  };
  const extension = isPdf
    ? extensionMap.pdf
    : imageExtensionMap[String(match[2] || '').toLowerCase()];
  if (!extension) {
    return res.status(400).json({ ok: false, error: 'Only JPG, PNG, WEBP, GIF, and PDF files are supported' });
  }

  let buffer;
  try {
    buffer = Buffer.from(match[3], 'base64');
  } catch (error) {
    return res.status(400).json({ ok: false, error: 'The uploaded file could not be decoded' });
  }

  const maxBytes = isPdf ? 20 * 1024 * 1024 : 8 * 1024 * 1024;
  if (!buffer.length || buffer.length > maxBytes) {
    return res.status(400).json({ ok: false, error: isPdf ? 'PDF size must be between 1 byte and 20 MB' : 'Image size must be between 1 byte and 8 MB' });
  }

  const originalBaseName = path.basename(fileName, path.extname(fileName)) || 'asset';
  const safeBaseName = originalBaseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'asset';

  const storedFileName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBaseName}.${extension}`;
  const targetDir = isPdf ? FILE_UPLOADS_DIR : UPLOADS_DIR;
  const assetUrl = `${isPdf ? 'files/uploads' : 'images/uploads'}/${storedFileName}`;
  fs.writeFileSync(path.join(targetDir, storedFileName), buffer);

  res.status(201).json({
    ok: true,
    fileUrl: assetUrl,
    imageUrl: isPdf ? null : assetUrl,
    assetType: isPdf ? 'pdf' : 'image'
  });
});

app.delete('/api/admin/assets', requireAdmin, (req, res) => {
  const result = deleteManagedAsset(req.body && req.body.assetUrl);
  if (!result.deleted) {
    return res.status(400).json({ ok: false, error: result.error || 'Could not delete the selected asset' });
  }
  res.json({ ok: true, message: 'Asset deleted successfully' });
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
  const baseUrl = getBaseUrl(req);
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
    activationUrl: user.activation_token ? `${baseUrl}/activate.html?token=${encodeURIComponent(user.activation_token)}` : null,
    createdAt: user.created_at,
    activatedAt: user.activated_at,
    lastLoginAt: user.last_login_at
  }));

  res.json({ ok: true, users });
});

app.post('/api/admin/users/:id/status', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const isActive = req.body.isActive ? 1 : 0;

  if (req.session.user && req.session.user.id === userId && !isActive) {
    return res.status(400).json({ ok: false, error: 'You cannot deactivate the admin account currently logged in' });
  }

  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(isActive, userId);
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const userId = Number(req.params.id);
  const role = req.body.role === 'admin' ? 'admin' : 'user';

  if (req.session.user && req.session.user.id === userId && role !== 'admin') {
    return res.status(400).json({ ok: false, error: 'You cannot remove admin access from the account currently logged in' });
  }

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
  if (SHOULD_RESET_NON_ADMIN_USERS_ON_BOOT) {
    console.log(`Production user reset is ON. Removed ${removedUsersOnBoot} non-admin user(s) on boot.`);
  }
  if (!transporter) {
    console.log(`SMTP not configured. Activation links will be logged to ${MAIL_LOG_PATH}`);
  }
});
