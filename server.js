const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const SQLiteStoreFactory = require('connect-sqlite3');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) return;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  });
}

function normalizeBaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

const ROOT = __dirname;
loadLocalEnv();
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
const BREVO_API_KEY = String(process.env.BREVO_API_KEY || '').trim();
const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || '').trim();
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || 'gpt-5-mini').trim();
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || process.env.SMTP_FROM || process.env.BREVO_SMTP_LOGIN || process.env.SMTP_USER || '';
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || 'MUST';
const REAL_EMAILS_ENABLED = Boolean(BREVO_API_KEY);
const CHAT_SYSTEM_PROMPT = [
  'You are the official AI assistant for a university sector website.',
  'Your role is to help visitors find and understand information already available on the website.',
  'Answer only using the provided website content.',
  'Understand short, incomplete, misspelled, Arabic, or English questions by meaning, not by exact wording.',
  'Use section titles, aliases, and related terms in the website content to find the closest relevant answer.',
  'Do not invent information.',
  'If the answer is not available in the provided content, say exactly: "This information is not available on the website. Please check the related sections or contact the sector."',
  'Keep answers short, clear, and professional.',
  'When relevant, suggest the website section the user should open.'
].join('\n');
const CHAT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const CHAT_RATE_LIMIT_MAX = 20;
const chatRateLimits = new Map();
const CHAT_UNAVAILABLE_RESPONSE = 'This information is not available on the website. Please check the related sections or contact the sector.';
const DEFAULT_CHATBOT_SETTINGS = {
  enabled: true,
  welcomeMessage: 'Hello. I can help with the sector vision, mission, objectives, committees, protocols, annual plan, news, events, gallery, and contact information.',
  assistantName: 'Sector AI Assistant',
  maxResponseLength: 450,
  showSuggestedQuestions: true
};
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
db.pragma('foreign_keys = ON');

const DEFAULT_SITE_CONTENT = {
  heroTitle: 'Community Service & Environmental Development Sector',
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
  viceDeanSignatureName: 'Assoc. Prof. Khaled Abdel Salam',
  viceDeanImageUrl: 'images/vice-dean-2026.jpg',
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
  contactSubtitle: 'Send your message directly to the sector team.',
  contactEmail: '',
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
      location TEXT,
      time_text TEXT,
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

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      visitor_id TEXT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chatbot_unknown_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      user_id INTEGER,
      visitor_id TEXT,
      question TEXT NOT NULL,
      reviewed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL UNIQUE,
      rating TEXT NOT NULL CHECK(rating IN ('helpful', 'not_helpful')),
      created_at TEXT NOT NULL,
      FOREIGN KEY(message_id) REFERENCES chat_messages(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_visitor_id ON chat_sessions(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_unknown_questions_reviewed ON chatbot_unknown_questions(reviewed);
    CREATE INDEX IF NOT EXISTS idx_chat_feedback_rating ON chat_feedback(rating);
  `);

  const userColumns = db.prepare(`PRAGMA table_info(users)`).all();
  const hasUniversityId = userColumns.some((column) => column.name === 'university_id');
  if (!hasUniversityId) {
    db.exec(`ALTER TABLE users ADD COLUMN university_id TEXT`);
  }

  const eventColumns = db.prepare(`PRAGMA table_info(events)`).all();
  const hasEventLocation = eventColumns.some((column) => column.name === 'location');
  const hasEventTimeText = eventColumns.some((column) => column.name === 'time_text');
  if (!hasEventLocation) {
    db.exec(`ALTER TABLE events ADD COLUMN location TEXT`);
  }
  if (!hasEventTimeText) {
    db.exec(`ALTER TABLE events ADD COLUMN time_text TEXT`);
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
      ['04', 'Feb', 'Ferrari: Driving Luxury Beyond the Road', 'MUST proudly hosts Rome Business School for a global case study on innovation, AI, and strategic thinking behind Ferrari.', 'MUST Convention Center', '10:00 AM', 'images/official/event-ferrari.jpeg', 'Read More', 'https://must.edu.eg/event/ferrari-driving-luxury-beyond-the-road/'],
      ['09', 'Dec', 'Annual Scientific Day', 'The College of Biotechnology at Misr University for Science and Technology showcases innovation, student projects, and scientific excellence.', 'College of Biotechnology Hall', '11:30 AM', 'images/official/event-annual-scientific-day.png', 'Read More', 'https://must.edu.eg/event/annual-scientific-day/'],
      ['06', 'Nov', 'College of Information Technology conference entitle "Artificial Intelligence for Environmental Sustainability"', 'The College of Information Technology highlights how AI can support sustainable development, climate action, and natural resource management.', 'MUST Main Auditorium', '09:00 AM', 'images/official/event-ai-sustainability.png', 'Read More', 'https://must.edu.eg/event/college-of-information-technology-conference-entitle-artificial-intelligence-for-environmental-sustainability-2/']
    ];
    const insertEvent = db.prepare(`
      INSERT INTO events (day, month_year, title, summary, location, time_text, image_url, link_text, link_url, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    seedEvents.forEach((item, index) => {
      insertEvent.run(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7], item[8], index, new Date().toISOString());
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

function describeMailError(error) {
  const rawMessage = String((error && (error.response || error.message)) || '').toLowerCase();
  const status = Number((error && error.status) || 0);
  const code = String((error && error.code) || '').toUpperCase();

  if (code === 'EAPIKEY' || code === 'EBREVO_API_KEY_INVALID' || status === 401 || status === 403 || rawMessage.includes('api key') || rawMessage.includes('unauthorized')) {
    return {
      publicMessage: 'The Brevo API key is missing or invalid. Please add BREVO_API_KEY from Brevo API Keys, not the SMTP key.',
      logLabel: 'Brevo API authentication failed'
    };
  }

  if (code === 'ESENDER' || rawMessage.includes('sender') || rawMessage.includes('from address') || rawMessage.includes('not allowed')) {
    return {
      publicMessage: 'The sender email is not accepted by Brevo yet. Please verify MAIL_FROM_EMAIL inside Brevo and try again.',
      logLabel: 'Brevo sender rejected'
    };
  }

  if (code === 'ETIMEDOUT' || code === 'ECONNECTION' || rawMessage.includes('connect') || rawMessage.includes('timeout') || rawMessage.includes('fetch failed')) {
    return {
      publicMessage: 'The activation email service could not be reached. Please check the network connection and Brevo availability, then try again.',
      logLabel: 'Brevo API connection failed'
    };
  }

  return {
    publicMessage: 'Your account could not be completed because we could not send the activation email. Please try again.',
    logLabel: 'Brevo API send failed'
  };
}

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

  if (REAL_EMAILS_ENABLED) {
    if (!MAIL_FROM_EMAIL) {
      const senderError = new Error('MAIL_FROM_EMAIL is missing');
      senderError.code = 'ESENDER';
      throw senderError;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: MAIL_FROM_NAME,
          email: MAIL_FROM_EMAIL
        },
        to: [
          {
            email: user.email,
            name: user.name
          }
        ],
        subject,
        htmlContent: html
      })
    });

    const rawResponse = await response.text();
    let parsedResponse = null;
    try {
      parsedResponse = rawResponse ? JSON.parse(rawResponse) : null;
    } catch (parseError) {
      parsedResponse = null;
    }

    if (!response.ok) {
      const apiError = new Error((parsedResponse && (parsedResponse.message || parsedResponse.code)) || rawResponse || `Brevo API request failed with status ${response.status}`);
      apiError.code = response.status === 401 || response.status === 403 ? 'EBREVO_API_KEY_INVALID' : 'EBREVOAPI';
      apiError.status = response.status;
      apiError.response = rawResponse;
      throw apiError;
    }
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

function parseBooleanSetting(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
}

function normalizeChatbotSettings(settings) {
  const source = settings && typeof settings === 'object' ? settings : {};
  const maxResponseLength = Number(source.maxResponseLength);
  return {
    enabled: parseBooleanSetting(source.enabled, DEFAULT_CHATBOT_SETTINGS.enabled),
    welcomeMessage: compactText(source.welcomeMessage || DEFAULT_CHATBOT_SETTINGS.welcomeMessage).slice(0, 500),
    assistantName: compactText(source.assistantName || DEFAULT_CHATBOT_SETTINGS.assistantName).slice(0, 80),
    maxResponseLength: Number.isFinite(maxResponseLength) ? Math.min(Math.max(Math.round(maxResponseLength), 120), 900) : DEFAULT_CHATBOT_SETTINGS.maxResponseLength,
    showSuggestedQuestions: parseBooleanSetting(source.showSuggestedQuestions, DEFAULT_CHATBOT_SETTINGS.showSuggestedQuestions)
  };
}

function getAppSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch (error) {
    return row.value;
  }
}

function saveAppSetting(key, value) {
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), now());
}

function getChatbotSettings() {
  return normalizeChatbotSettings(getAppSetting('chatbot_settings', DEFAULT_CHATBOT_SETTINGS));
}

function saveChatbotSettings(settings) {
  const normalized = normalizeChatbotSettings(settings);
  saveAppSetting('chatbot_settings', normalized);
  return normalized;
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
    const firstName = String(req.body.firstName || '').trim();
    const lastName = String(req.body.lastName || '').trim();
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (firstName.length < 2) {
      return res.status(400).json({ ok: false, error: 'First name must be at least 2 characters' });
    }
    if (lastName.length < 2) {
      return res.status(400).json({ ok: false, error: 'Last name must be at least 2 characters' });
    }
    if (!mustEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Use your MUST email in the format username@must.edu.eg' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare(`
      SELECT *
      FROM users
      WHERE email = ?
    `).get(email);

    if (existing && Number(existing.is_active) === 1) {
      return res.status(409).json({ ok: false, error: 'This account has already been activated. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(24).toString('hex');
    const createdAt = now();
    const isExistingInactiveUser = Boolean(existing);
    let userId;
    let activationUrl;

    try {
      if (existing) {
      db.prepare(`
        UPDATE users
        SET
          name = ?,
          university_id = NULL,
          password_hash = ?,
          role = 'user',
          is_active = 0,
          activation_token = ?,
          created_at = ?,
          activated_at = NULL,
          last_login_at = NULL
        WHERE id = ?
      `).run(name, passwordHash, token, createdAt, existing.id);
      userId = existing.id;
      } else {
        const created = db.prepare(`
          INSERT INTO users (name, university_id, email, password_hash, role, is_active, activation_token, created_at)
          VALUES (?, ?, ?, ?, 'user', 0, ?, ?)
        `).run(name, null, email, passwordHash, token, createdAt);
        userId = created.lastInsertRowid;
      }

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      activationUrl = await sendActivationEmail(user, token, getBaseUrl(req));
    } catch (mailError) {
      const details = describeMailError(mailError);
      console.error(`${details.logLabel} during registration:`, {
        code: mailError && mailError.code,
        command: mailError && mailError.command,
        response: mailError && mailError.response,
        message: mailError && mailError.message,
        email
      });
      if (!isExistingInactiveUser && userId) {
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      }
      return res.status(502).json({
        ok: false,
        error: details.publicMessage
      });
    }

    res.status(isExistingInactiveUser ? 200 : 201).json({
      ok: true,
      status: isExistingInactiveUser ? 'activation-resent' : 'created',
      message: REAL_EMAILS_ENABLED
        ? (
          isExistingInactiveUser
            ? 'This account is not activated yet. A new activation email has been sent to your MUST mailbox.'
            : 'Your account has been created. Check your MUST email to activate it.'
        )
        : (
          isExistingInactiveUser
            ? 'This account is not activated yet. A new activation link has been prepared for you below.'
            : 'Your account has been created. Use the activation link below to activate it.'
        ),
      activationPreviewUrl: REAL_EMAILS_ENABLED ? null : activationUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Could not create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const loginValue = String(req.body.login || req.body.email || '').trim().toLowerCase();
    const email = loginValue.includes('@') ? loginValue : `${loginValue}@must.edu.eg`;
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
  return db.prepare(`
    SELECT
      id,
      badge,
      title,
      image_url AS imageUrl,
      link_text AS linkText,
      link_url AS linkUrl,
      link_url AS sourceUrl
    FROM news
    ORDER BY sort_order ASC, id DESC
  `).all();
}

function listEvents() {
  return db.prepare(`
    SELECT
      id,
      day,
      month_year AS monthYear,
      title,
      summary,
      location,
      time_text AS timeText,
      image_url AS imageUrl,
      link_text AS linkText,
      link_url AS linkUrl,
      link_url AS sourceUrl
    FROM events
    ORDER BY sort_order ASC, id DESC
  `).all();
}

function getNewsItemById(id) {
  return db.prepare(`
    SELECT
      id,
      badge,
      title,
      image_url AS imageUrl,
      link_text AS linkText,
      link_url AS linkUrl,
      link_url AS sourceUrl
    FROM news
    WHERE id = ?
  `).get(id);
}

function getEventItemById(id) {
  return db.prepare(`
    SELECT
      id,
      day,
      month_year AS monthYear,
      title,
      summary,
      location,
      time_text AS timeText,
      image_url AS imageUrl,
      link_text AS linkText,
      link_url AS linkUrl,
      link_url AS sourceUrl
    FROM events
    WHERE id = ?
  `).get(id);
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

const CHAT_TOPIC_ALIASES = [
  {
    canonical: "Vice Dean's Message",
    aliases: ['vice dean', 'dean message', 'dean word', 'dean speech', 'vice dean message', '\u0643\u0644\u0645\u0629\u0020\u0627\u0644\u0639\u0645\u064a\u062f', '\u0631\u0633\u0627\u0644\u0629\u0020\u0627\u0644\u0639\u0645\u064a\u062f', '\u0631\u0633\u0627\u0644\u0647\u0020\u0627\u0644\u0639\u0645\u064a\u062f', '\u0643\u0644\u0645\u0629\u0020\u0646\u0627\u0626\u0628\u0020\u0627\u0644\u0639\u0645\u064a\u062f', '\u0631\u0633\u0627\u0644\u0629\u0020\u0646\u0627\u0626\u0628\u0020\u0627\u0644\u0639\u0645\u064a\u062f']
  },
  {
    canonical: 'Sector Vision',
    aliases: ['vision', 'sector vision', '\u0627\u0644\u0631\u0624\u064a\u0629', '\u0631\u0624\u064a\u0629\u0020\u0627\u0644\u0642\u0637\u0627\u0639']
  },
  {
    canonical: 'Sector Mission',
    aliases: ['mission', 'sector mission', '\u0627\u0644\u0631\u0633\u0627\u0644\u0629', '\u0631\u0633\u0627\u0644\u0629\u0020\u0627\u0644\u0642\u0637\u0627\u0639']
  },
  {
    canonical: 'Sector Objectives',
    aliases: ['objectives', 'objective', 'goals', 'aims', '\u0627\u0644\u0623\u0647\u062f\u0627\u0641', '\u0627\u0647\u062f\u0627\u0641', '\u0623\u0647\u062f\u0627\u0641\u0020\u0627\u0644\u0642\u0637\u0627\u0639']
  },
  {
    canonical: 'Sector Committees',
    aliases: ['committees', 'committee', '\u0627\u0644\u0644\u062c\u0627\u0646', '\u0644\u062c\u0627\u0646\u0020\u0627\u0644\u0642\u0637\u0627\u0639']
  },
  {
    canonical: 'Protocols',
    aliases: ['protocols', 'protocol', 'partnerships', 'agreements', '\u0627\u0644\u0628\u0631\u0648\u062a\u0648\u0643\u0648\u0644\u0627\u062a', '\u0628\u0631\u0648\u062a\u0648\u0643\u0648\u0644', '\u0627\u0644\u0634\u0631\u0627\u0643\u0627\u062a', '\u0627\u0644\u0627\u062a\u0641\u0627\u0642\u064a\u0627\u062a']
  },
  {
    canonical: 'Sector Annual Plan',
    aliases: ['annual plan', 'plan', 'sector plan', '\u0627\u0644\u062e\u0637\u0629', '\u0627\u0644\u062e\u0637\u0629\u0020\u0627\u0644\u0633\u0646\u0648\u064a\u0629']
  },
  {
    canonical: 'Sector Activities',
    aliases: ['activities', 'activity', '\u0627\u0644\u0623\u0646\u0634\u0637\u0629', '\u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a', '\u0627\u0646\u0634\u0637\u0629', '\u0646\u0634\u0627\u0637']
  },
  {
    canonical: 'Events',
    aliases: ['events', 'event', '\u0627\u0644\u0627\u064a\u0641\u0646\u062a', '\u0627\u0644\u0627\u064a\u0641\u0646\u062a\u0627\u062a', '\u0627\u0644\u0623\u062d\u062f\u0627\u062b', '\u0627\u0644\u0641\u0639\u0627\u0644\u064a\u0627\u062a']
  },
  {
    canonical: 'News',
    aliases: ['news', '\u0627\u0644\u0623\u062e\u0628\u0627\u0631', '\u0627\u0644\u0627\u062e\u0628\u0627\u0631']
  },
  {
    canonical: 'Gallery',
    aliases: ['gallery', 'photos', 'images', 'slider', '\u0627\u0644\u0635\u0648\u0631', '\u0627\u0644\u0645\u0639\u0631\u0636', '\u0627\u0644\u0633\u0644\u0627\u064a\u062f\u0631']
  },
  {
    canonical: 'Contact',
    aliases: ['contact', 'contact us', 'reach us', '\u062a\u0648\u0627\u0635\u0644', '\u0627\u062a\u0635\u0627\u0644', '\u0627\u062a\u0635\u0644\u0020\u0628\u0646\u0627', '\u062a\u0648\u0627\u0635\u0644\u0020\u0645\u0639\u0646\u0627', '\u0643\u0648\u0646\u062a\u0627\u0643\u062a']
  }
];

function detectChatTopics(message) {
  const original = compactText(message);
  const normalized = original.toLowerCase();
  if (!normalized) {
    return [];
  }

  if (normalized.includes('\u0639\u0645\u064a\u062f')) {
    return ["Vice Dean's Message"];
  }
  if (normalized.includes('\u0631\u0624\u064a\u0629')) {
    return ['Sector Vision'];
  }
  if (normalized.includes('\u0631\u0633\u0627\u0644\u0629')) {
    return ['Sector Mission'];
  }
  if (normalized.includes('\u0647\u062f\u0641') || normalized.includes('\u0627\u0647\u062f\u0627\u0641') || normalized.includes('\u0623\u0647\u062f\u0627\u0641')) {
    return ['Sector Objectives'];
  }
  if (normalized.includes('\u0644\u062c\u0627\u0646')) {
    return ['Sector Committees'];
  }
  if (normalized.includes('\u0628\u0631\u0648\u062a\u0648\u0643\u0648\u0644') || normalized.includes('\u0634\u0631\u0627\u0643\u0627\u062a') || normalized.includes('\u0627\u062a\u0641\u0627\u0642\u064a\u0627\u062a')) {
    return ['Protocols'];
  }
  if (normalized.includes('\u062e\u0637\u0629')) {
    return ['Sector Annual Plan'];
  }
  if (normalized.includes('\u0646\u0634\u0627\u0637') || normalized.includes('\u0627\u0646\u0634\u0637\u0629')) {
    return ['Sector Activities'];
  }
  if (normalized.includes('\u062e\u0628\u0631') || normalized.includes('\u0627\u062e\u0628\u0627\u0631')) {
    return ['News'];
  }
  if (normalized.includes('\u062a\u0648\u0627\u0635\u0644') || normalized.includes('\u0627\u062a\u0635\u0627\u0644') || normalized.includes('\u0643\u0648\u0646\u062a\u0627\u0643\u062a')) {
    return ['Contact'];
  }

  return CHAT_TOPIC_ALIASES
    .filter((group) => group.aliases.some((alias) => normalized.includes(alias.toLowerCase())))
    .map((group) => group.canonical);
}

function expandChatQuery(message, matchedTopics) {
  const original = compactText(message);
  if (!matchedTopics.length) {
    return original;
  }

  return `${original}\n\nLikely intended website sections: ${matchedTopics.join(', ')}`;
}

function listTitles(items, mapper) {
  if (!Array.isArray(items) || !items.length) return 'None listed.';
  return items.map(mapper).filter(Boolean).join('\n');
}

function buildChatWebsiteContext() {
  const sections = getSiteContent();
  const news = listNews();
  const events = listEvents();
  const objectives = Array.isArray(sections.objectiveItems)
    ? sections.objectiveItems
    : [sections.objective1, sections.objective2, sections.objective3, sections.objective4].filter(Boolean);
  const committees = Array.isArray(sections.committeeItems) ? sections.committeeItems : [];
  const protocols = Array.isArray(sections.protocolItems) ? sections.protocolItems : [];
  const activityGroups = Array.isArray(sections.activityGroups) ? sections.activityGroups : [];
  const galleryItems = Array.isArray(sections.galleryItems) ? sections.galleryItems : [];

  return [
    `Website: ${compactText(sections.heroTitle)}`,
    'Search aliases: vice dean message = dean message = dean word = dean speech = رسالة العميد = كلمة العميد; vision = الرؤية; mission = الرسالة; objectives = goals = aims = الأهداف; committees = اللجان; protocols = partnerships = agreements = البروتوكولات; plan = annual plan = الخطة; activities = الأنشطة; events = الفعاليات; news = الأخبار; gallery = photo slider = الصور; contact = contact us = تواصل معنا.',
    '',
    `Vice Dean's Message section title: ${compactText(sections.viceDeanSectionTitle)}`,
    `Vice Dean's Message heading: ${compactText(sections.viceDeanHeading)}`,
    `Vice Dean's Message: ${[
      sections.viceDeanParagraph1,
      sections.viceDeanParagraph2,
      sections.viceDeanParagraph3,
      sections.viceDeanClosing,
      sections.viceDeanSignatureRole,
      sections.viceDeanSignatureName
    ].map(compactText).filter(Boolean).join(' ')}`,
    '',
    `Vision: ${compactText(sections.visionText)}`,
    `Mission: ${compactText(sections.missionText)}`,
    '',
    'Objectives:',
    listTitles(objectives, (item, index) => `${index + 1}. ${compactText(item)}`),
    '',
    'Committees:',
    listTitles(committees, (item) => `- ${compactText(item.title)}: ${compactText(item.summary)} Responsibilities: ${Array.isArray(item.responsibilities) ? item.responsibilities.map(compactText).join('; ') : ''}`),
    '',
    `Annual Plan: ${compactText(sections.planFileTitle)}. ${compactText(sections.planIntro)} File: ${compactText(sections.planFileUrl)}`,
    '',
    'Protocols:',
    listTitles(protocols, (item) => `- ${compactText(item.title)}. Partner: ${compactText(item.partner)}. Objective: ${compactText(item.objective)}`),
    '',
    'Activity Groups:',
    listTitles(activityGroups, (group) => `- ${compactText(group.title)}: ${compactText(group.intro)} Items: ${Array.isArray(group.items) ? group.items.map((item) => `${compactText(item.dateLabel)} - ${compactText(item.title)}: ${compactText(item.summary)}`).join('; ') : ''}`),
    '',
    'Latest Events:',
    listTitles(events, (item) => `- ${compactText(item.title)} (${compactText(item.day)} ${compactText(item.monthYear)}${item.location ? `, ${compactText(item.location)}` : ''}${item.timeText ? `, ${compactText(item.timeText)}` : ''}): ${compactText(item.summary)}`),
    '',
    'News:',
    listTitles(news, (item) => `- ${compactText(item.title)} (${compactText(item.badge)})`),
    '',
    `Gallery: ${galleryItems.length} images are available in the homepage photo slider.`,
    '',
    `Contact: ${compactText(sections.contactTitle)} ${compactText(sections.contactSubtitle)} Phone: ${compactText(sections.footerPhone)} Email: ${compactText(sections.footerEmail)} Address: ${compactText(sections.footerAddress)}`
  ].join('\n');
}

function buildPriorityChatContext(sections, matchedTopics) {
  if (!Array.isArray(matchedTopics) || !matchedTopics.length) {
    return '';
  }

  const objectives = Array.isArray(sections.objectiveItems)
    ? sections.objectiveItems
    : [sections.objective1, sections.objective2, sections.objective3, sections.objective4].filter(Boolean);
  const committees = Array.isArray(sections.committeeItems) ? sections.committeeItems : [];
  const protocols = Array.isArray(sections.protocolItems) ? sections.protocolItems : [];

  const priorityParts = matchedTopics.map((topic) => {
    switch (topic) {
      case "Vice Dean's Message":
        return `Priority section - Vice Dean's Message:\nTitle: ${compactText(sections.viceDeanSectionTitle)}\nHeading: ${compactText(sections.viceDeanHeading)}\nContent: ${[
          sections.viceDeanParagraph1,
          sections.viceDeanParagraph2,
          sections.viceDeanParagraph3,
          sections.viceDeanClosing,
          sections.viceDeanSignatureRole,
          sections.viceDeanSignatureName
        ].map(compactText).filter(Boolean).join(' ')}`;
      case 'Sector Vision':
        return `Priority section - Vision:\n${compactText(sections.visionText)}`;
      case 'Sector Mission':
        return `Priority section - Mission:\n${compactText(sections.missionText)}`;
      case 'Sector Objectives':
        return `Priority section - Objectives:\n${listTitles(objectives, (item, index) => `${index + 1}. ${compactText(item)}`)}`;
      case 'Sector Committees':
        return `Priority section - Committees:\n${listTitles(committees, (item) => `- ${compactText(item.title)}: ${compactText(item.summary)}`)}`;
      case 'Protocols':
        return `Priority section - Protocols:\n${listTitles(protocols, (item) => `- ${compactText(item.title)}. Partner: ${compactText(item.partner)}. Objective: ${compactText(item.objective)}`)}`;
      case 'Sector Annual Plan':
        return `Priority section - Annual Plan:\n${compactText(sections.planFileTitle)}. ${compactText(sections.planIntro)} File: ${compactText(sections.planFileUrl)}`;
      case 'Contact':
        return `Priority section - Contact:\n${compactText(sections.contactTitle)} ${compactText(sections.contactSubtitle)} Phone: ${compactText(sections.footerPhone)} Email: ${compactText(sections.footerEmail)} Address: ${compactText(sections.footerAddress)}`;
      default:
        return '';
    }
  }).filter(Boolean);

  return priorityParts.join('\n\n');
}

function getDirectChatAnswer(message) {
  const sections = getSiteContent();
  const matchedTopics = detectChatTopics(message);
  if (!matchedTopics.length) {
    return '';
  }

  const objectives = Array.isArray(sections.objectiveItems)
    ? sections.objectiveItems
    : [sections.objective1, sections.objective2, sections.objective3, sections.objective4].filter(Boolean);
  const committees = Array.isArray(sections.committeeItems) ? sections.committeeItems : [];
  const protocols = Array.isArray(sections.protocolItems) ? sections.protocolItems : [];

  const primaryTopic = matchedTopics[0];
  switch (primaryTopic) {
    case "Vice Dean's Message":
      return [
        "Vice Dean's Message",
        compactText(sections.viceDeanHeading),
        compactText(sections.viceDeanParagraph1),
        compactText(sections.viceDeanParagraph2),
        compactText(sections.viceDeanParagraph3),
        compactText(sections.viceDeanClosing),
        compactText(sections.viceDeanSignatureRole),
        compactText(sections.viceDeanSignatureName)
      ].filter(Boolean).join('\n\n');
    case 'Sector Vision':
      return compactText(sections.visionText);
    case 'Sector Mission':
      return compactText(sections.missionText);
    case 'Sector Objectives':
      return [
        "Sector Objectives",
        ...objectives.map((item, index) => `${index + 1}. ${compactText(item)}`)
      ].join('\n');
    case 'Sector Committees':
      return [
        'Sector Committees',
        ...committees.map((item) => `- ${compactText(item.title)}: ${compactText(item.summary)}`)
      ].join('\n');
    case 'Protocols':
      return [
        'Protocols',
        ...protocols.map((item) => `- ${compactText(item.title)}. Partner: ${compactText(item.partner)}. Objective: ${compactText(item.objective)}`)
      ].join('\n');
    case 'Sector Annual Plan':
      return `${compactText(sections.planFileTitle)}\n${compactText(sections.planIntro)}\nFile: ${compactText(sections.planFileUrl)}`;
    case 'Contact':
      return `Contact Us\n${compactText(sections.contactTitle)}\n${compactText(sections.contactSubtitle)}\nPhone: ${compactText(sections.footerPhone)}\nEmail: ${compactText(sections.footerEmail)}\nAddress: ${compactText(sections.footerAddress)}`;
    default:
      return '';
  }
}

function getChatRateLimitKey(req, visitorId) {
  if (req.session && req.session.user && req.session.user.id) {
    return `user:${req.session.user.id}`;
  }
  if (visitorId) {
    return `visitor:${visitorId}`;
  }
  return `ip:${req.ip || 'unknown'}`;
}

function checkChatRateLimit(key) {
  const timestamp = Date.now();
  const entry = chatRateLimits.get(key) || { count: 0, resetAt: timestamp + CHAT_RATE_LIMIT_WINDOW_MS };
  if (timestamp > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = timestamp + CHAT_RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  chatRateLimits.set(key, entry);
  return {
    allowed: entry.count <= CHAT_RATE_LIMIT_MAX,
    resetAt: entry.resetAt
  };
}

function getChatOwner(req, visitorId) {
  const userId = req.session && req.session.user && req.session.user.id ? Number(req.session.user.id) : null;
  return {
    userId: Number.isFinite(userId) ? userId : null,
    visitorId: userId ? null : compactText(visitorId).slice(0, 80)
  };
}

function getRequiredChatOwner(req, visitorId) {
  const owner = getChatOwner(req, visitorId);
  if (!owner.userId && !owner.visitorId) {
    return null;
  }
  return owner;
}

function getOwnedChatSession(sessionId, owner) {
  const numericSessionId = Number(sessionId);
  if (!Number.isFinite(numericSessionId) || numericSessionId <= 0) return null;

  if (owner.userId) {
    return db.prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?').get(numericSessionId, owner.userId) || null;
  }

  if (owner.visitorId) {
    return db.prepare('SELECT id FROM chat_sessions WHERE id = ? AND visitor_id = ? AND user_id IS NULL').get(numericSessionId, owner.visitorId) || null;
  }

  return null;
}

function createChatSession(owner, firstMessage) {
  const timestamp = now();
  const title = compactText(firstMessage).slice(0, 70) || 'New chat';
  const result = db.prepare(`
    INSERT INTO chat_sessions (user_id, visitor_id, title, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(owner.userId || null, owner.visitorId || null, title, timestamp, timestamp);
  return { id: result.lastInsertRowid };
}

function getOrCreateChatSession(sessionId, owner, firstMessage) {
  const existing = getOwnedChatSession(sessionId, owner);
  if (existing) return existing;
  return createChatSession(owner, firstMessage);
}

function saveChatMessage(sessionId, role, content) {
  const timestamp = now();
  const result = db.prepare(`
    INSERT INTO chat_messages (session_id, role, content, created_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, role, content, timestamp);
  db.prepare('UPDATE chat_sessions SET updated_at = ? WHERE id = ?').run(timestamp, sessionId);
  return result.lastInsertRowid;
}

function saveUnknownQuestion(sessionId, owner, question) {
  db.prepare(`
    INSERT INTO chatbot_unknown_questions (session_id, user_id, visitor_id, question, reviewed, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(sessionId, owner.userId || null, owner.visitorId || null, question, now());
}

function listOwnedChatSessions(owner) {
  const sql = `
    SELECT
      s.id,
      s.title,
      s.created_at AS createdAt,
      s.updated_at AS updatedAt,
      COUNT(m.id) AS messageCount,
      (
        SELECT content
        FROM chat_messages
        WHERE session_id = s.id
        ORDER BY id DESC
        LIMIT 1
      ) AS lastMessage
    FROM chat_sessions s
    LEFT JOIN chat_messages m ON m.session_id = s.id
  `;

  const suffix = `
    GROUP BY s.id
    ORDER BY s.updated_at DESC, s.id DESC
    LIMIT 30
  `;

  if (owner.userId) {
    return db.prepare(`${sql} WHERE s.user_id = ? ${suffix}`).all(owner.userId);
  }

  return db.prepare(`${sql} WHERE s.user_id IS NULL AND s.visitor_id = ? ${suffix}`).all(owner.visitorId);
}

function listOwnedChatMessages(sessionId, owner) {
  const session = getOwnedChatSession(sessionId, owner);
  if (!session) return null;

  return db.prepare(`
    SELECT
      m.id,
      m.role,
      m.content,
      m.created_at AS createdAt,
      f.rating AS feedback
    FROM chat_messages m
    LEFT JOIN chat_feedback f ON f.message_id = m.id
    WHERE m.session_id = ?
    ORDER BY m.id ASC
  `).all(session.id);
}

function deleteOwnedChatSession(sessionId, owner) {
  const session = getOwnedChatSession(sessionId, owner);
  if (!session) return false;

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM chatbot_unknown_questions WHERE session_id = ?').run(session.id);
    db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(session.id);
    db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(session.id);
  });
  transaction();
  return true;
}

function getOwnedAssistantMessage(messageId, owner) {
  const numericMessageId = Number(messageId);
  if (!Number.isFinite(numericMessageId) || numericMessageId <= 0) return null;

  let row = null;
  if (owner.userId) {
    row = db.prepare(`
      SELECT m.id
      FROM chat_messages m
      JOIN chat_sessions s ON s.id = m.session_id
      WHERE m.id = ? AND m.role = 'assistant' AND s.user_id = ?
    `).get(numericMessageId, owner.userId);
  } else if (owner.visitorId) {
    row = db.prepare(`
      SELECT m.id
      FROM chat_messages m
      JOIN chat_sessions s ON s.id = m.session_id
      WHERE m.id = ? AND m.role = 'assistant' AND s.user_id IS NULL AND s.visitor_id = ?
    `).get(numericMessageId, owner.visitorId);
  }

  return row || null;
}

function saveChatFeedback(messageId, rating) {
  db.prepare(`
    INSERT INTO chat_feedback (message_id, rating, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(message_id) DO UPDATE SET rating = excluded.rating, created_at = excluded.created_at
  `).run(messageId, rating, now());
}

function getChatbotAdminOverview() {
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const stats = {
    totalSessions: db.prepare('SELECT COUNT(*) AS count FROM chat_sessions').get().count,
    totalMessages: db.prepare('SELECT COUNT(*) AS count FROM chat_messages').get().count,
    totalUsersUsed: db.prepare(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT DISTINCT
          CASE
            WHEN user_id IS NOT NULL THEN 'user:' || user_id
            ELSE 'guest:' || COALESCE(visitor_id, 'unknown')
          END AS actor
        FROM chat_sessions
      )
    `).get().count,
    unknownQuestions: db.prepare('SELECT COUNT(*) AS count FROM chatbot_unknown_questions WHERE reviewed = 0').get().count,
    totalUnknownQuestions: db.prepare('SELECT COUNT(*) AS count FROM chatbot_unknown_questions').get().count,
    reviewedUnknownQuestions: db.prepare('SELECT COUNT(*) AS count FROM chatbot_unknown_questions WHERE reviewed = 1').get().count,
    helpfulFeedback: db.prepare("SELECT COUNT(*) AS count FROM chat_feedback WHERE rating = 'helpful'").get().count,
    notHelpfulFeedback: db.prepare("SELECT COUNT(*) AS count FROM chat_feedback WHERE rating = 'not_helpful'").get().count,
    loggedInSessions: db.prepare('SELECT COUNT(*) AS count FROM chat_sessions WHERE user_id IS NOT NULL').get().count,
    guestSessions: db.prepare('SELECT COUNT(*) AS count FROM chat_sessions WHERE user_id IS NULL').get().count,
    sessionsToday: db.prepare('SELECT COUNT(*) AS count FROM chat_sessions WHERE created_at LIKE ?').get(`${todayPrefix}%`).count,
    averageMessagesPerSession: db.prepare(`
      SELECT ROUND(AVG(message_count), 1) AS averageCount
      FROM (
        SELECT COUNT(m.id) AS message_count
        FROM chat_sessions s
        LEFT JOIN chat_messages m ON m.session_id = s.id
        GROUP BY s.id
      )
    `).get().averageCount || 0
  };

  const recentConversations = db.prepare(`
    SELECT
      s.id,
      s.title,
      s.user_id AS userId,
      s.visitor_id AS visitorId,
      s.created_at AS createdAt,
      s.updated_at AS updatedAt,
      COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(u.email), ''), 'Guest') AS userLabel,
      u.email AS userEmail,
      COUNT(m.id) AS messageCount,
      (
        SELECT content
        FROM chat_messages
        WHERE session_id = s.id
        ORDER BY id DESC
        LIMIT 1
      ) AS lastMessage
    FROM chat_sessions s
    LEFT JOIN users u ON u.id = s.user_id
    LEFT JOIN chat_messages m ON m.session_id = s.id
    GROUP BY s.id
    ORDER BY s.updated_at DESC, s.id DESC
    LIMIT 20
  `).all();

  const unknownQuestions = db.prepare(`
    SELECT
      q.id,
      q.session_id AS sessionId,
      q.user_id AS userId,
      q.visitor_id AS visitorId,
      q.question,
      q.reviewed,
      q.created_at AS createdAt,
      COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(u.email), ''), 'Guest') AS userLabel,
      u.email AS userEmail
    FROM chatbot_unknown_questions q
    LEFT JOIN users u ON u.id = q.user_id
    ORDER BY q.reviewed ASC, q.created_at DESC, q.id DESC
    LIMIT 50
  `).all();

  const popularQuestions = db.prepare(`
    SELECT
      LOWER(TRIM(content)) AS normalizedQuestion,
      MIN(content) AS question,
      COUNT(*) AS count,
      MAX(created_at) AS lastAskedAt
    FROM chat_messages
    WHERE role = 'user' AND TRIM(content) <> ''
    GROUP BY LOWER(TRIM(content))
    ORDER BY count DESC, lastAskedAt DESC
    LIMIT 20
  `).all();

  return {
    stats,
    recentConversations,
    unknownQuestions: unknownQuestions.map((item) => ({
      ...item,
      reviewed: Boolean(item.reviewed)
    })),
    popularQuestions,
    settings: getChatbotSettings()
  };
}

function getAdminChatConversation(sessionId) {
  const numericSessionId = Number(sessionId);
  if (!Number.isFinite(numericSessionId) || numericSessionId <= 0) return null;

  const session = db.prepare(`
    SELECT
      s.id,
      s.title,
      s.user_id AS userId,
      s.visitor_id AS visitorId,
      s.created_at AS createdAt,
      s.updated_at AS updatedAt,
      COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(u.email), ''), 'Guest') AS userLabel,
      u.email AS userEmail
    FROM chat_sessions s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE s.id = ?
  `).get(numericSessionId);

  if (!session) return null;

  const messages = db.prepare(`
    SELECT
      m.id,
      m.role,
      m.content,
      m.created_at AS createdAt,
      f.rating AS feedback
    FROM chat_messages m
    LEFT JOIN chat_feedback f ON f.message_id = m.id
    WHERE m.session_id = ?
    ORDER BY m.id ASC
  `).all(session.id);

  return { session, messages };
}

function extractOpenAIText(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.output_text === 'string') {
    return payload.output_text.trim();
  }
  if (!Array.isArray(payload.output)) return '';
  return payload.output.map((item) => {
    if (!item || !Array.isArray(item.content)) return '';
    return item.content.map((part) => {
      if (!part) return '';
      if (typeof part.text === 'string') return part.text;
      if (typeof part.output_text === 'string') return part.output_text;
      return '';
    }).join('');
  }).join('\n').trim();
}

async function askOpenAIAboutWebsite(message, maxOutputTokens) {
  const sections = getSiteContent();
  const websiteContext = buildChatWebsiteContext();
  const matchedTopics = detectChatTopics(message);
  const enrichedMessage = expandChatQuery(message, matchedTopics);
  const priorityContext = buildPriorityChatContext(sections, matchedTopics);
  const tokenLimit = Number.isFinite(Number(maxOutputTokens)) ? Number(maxOutputTokens) : DEFAULT_CHATBOT_SETTINGS.maxResponseLength;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: CHAT_SYSTEM_PROMPT,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `${priorityContext ? `Priority website sections:\n${priorityContext}\n\n` : ''}Website content:\n${websiteContext}\n\nVisitor question:\n${enrichedMessage}`
            }
          ]
        }
      ],
      max_output_tokens: Math.min(Math.max(Math.round(tokenLimit), 120), 900)
    })
  });

  const rawBody = await response.text();
  let parsedBody = null;
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch (error) {
    parsedBody = null;
  }

  if (!response.ok) {
    const apiMessage = parsedBody && parsedBody.error && parsedBody.error.message
      ? parsedBody.error.message
      : `OpenAI request failed with status ${response.status}`;
    const apiError = new Error(apiMessage);
    apiError.status = response.status;
    throw apiError;
  }

  return extractOpenAIText(parsedBody) || CHAT_UNAVAILABLE_RESPONSE;
}

app.get('/api/content/public', (req, res) => {
  res.json({ ok: true, news: listNews(), events: listEvents(), sections: getSiteContent() });
});

app.get('/api/chat/settings', (req, res) => {
  res.json({ ok: true, settings: getChatbotSettings() });
});

app.post('/api/chat', async (req, res) => {
  let chatSession = null;
  let chatOwner = null;
  let message = '';
  try {
    message = compactText(req.body && req.body.message);
    const visitorId = compactText(req.body && req.body.visitorId).slice(0, 80);
    const requestedSessionId = req.body && req.body.sessionId;

    if (!message) {
      return res.status(400).json({ ok: false, error: 'Please enter a message.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ ok: false, error: 'Messages must be 1000 characters or less.' });
    }
    if (!req.session.user && !visitorId) {
      return res.status(400).json({ ok: false, error: 'Missing visitor id.' });
    }
    const chatbotSettings = getChatbotSettings();
    if (!chatbotSettings.enabled) {
      return res.status(503).json({ ok: false, error: 'The AI assistant is currently disabled.' });
    }
    if (!OPENAI_API_KEY) {
      return res.status(503).json({ ok: false, error: 'The AI assistant is not configured yet.' });
    }

    const rateLimit = checkChatRateLimit(getChatRateLimitKey(req, visitorId));
    if (!rateLimit.allowed) {
      return res.status(429).json({ ok: false, error: 'You reached the hourly chat limit. Please try again later.' });
    }

    chatOwner = getChatOwner(req, visitorId);
    chatSession = getOrCreateChatSession(requestedSessionId, chatOwner, message);
    saveChatMessage(chatSession.id, 'user', message);

    const directAnswer = getDirectChatAnswer(message);
    const answer = directAnswer || await askOpenAIAboutWebsite(message, chatbotSettings.maxResponseLength);
    const assistantMessageId = saveChatMessage(chatSession.id, 'assistant', answer);
    if (answer.trim() === CHAT_UNAVAILABLE_RESPONSE) {
      saveUnknownQuestion(chatSession.id, chatOwner, message);
    }

    res.json({
      ok: true,
      sessionId: chatSession.id,
      messageId: assistantMessageId,
      answer,
      model: OPENAI_MODEL
    });
  } catch (error) {
    console.error('AI chat request failed:', error.message);
    if (chatSession) {
      try {
        saveChatMessage(chatSession.id, 'assistant', 'The AI assistant could not answer right now. Please try again later.');
      } catch (saveError) {
        console.error('Could not save failed chat response:', saveError.message);
      }
    }
    res.status(500).json({
      ok: false,
      sessionId: chatSession ? chatSession.id : null,
      error: 'The AI assistant could not answer right now. Please try again later.'
    });
  }
});

app.post('/api/chat/feedback', (req, res) => {
  const visitorId = compactText(req.body && req.body.visitorId).slice(0, 80);
  const rating = req.body && req.body.rating === 'not_helpful' ? 'not_helpful' : req.body && req.body.rating === 'helpful' ? 'helpful' : '';
  const owner = getRequiredChatOwner(req, visitorId);
  if (!owner) {
    return res.status(400).json({ ok: false, error: 'Missing visitor id.' });
  }
  if (!rating) {
    return res.status(400).json({ ok: false, error: 'Invalid feedback rating.' });
  }

  const message = getOwnedAssistantMessage(req.body && req.body.messageId, owner);
  if (!message) {
    return res.status(404).json({ ok: false, error: 'Assistant message not found.' });
  }

  saveChatFeedback(message.id, rating);
  res.json({ ok: true });
});

app.get('/api/content/public/news/:id', (req, res) => {
  const itemId = Number(req.params.id);
  const item = Number.isFinite(itemId) ? getNewsItemById(itemId) : null;
  if (!item) {
    return res.status(404).json({ ok: false, error: 'News item not found' });
  }
  res.json({ ok: true, item });
});

app.get('/api/content/public/events/:id', (req, res) => {
  const itemId = Number(req.params.id);
  const item = Number.isFinite(itemId) ? getEventItemById(itemId) : null;
  if (!item) {
    return res.status(404).json({ ok: false, error: 'Event not found' });
  }
  res.json({ ok: true, item });
});

app.get('/api/chat/sessions', (req, res) => {
  const owner = getRequiredChatOwner(req, req.query && req.query.visitorId);
  if (!owner) {
    return res.status(400).json({ ok: false, error: 'Missing visitor id.' });
  }

  res.json({ ok: true, sessions: listOwnedChatSessions(owner) });
});

app.get('/api/chat/sessions/:id/messages', (req, res) => {
  const owner = getRequiredChatOwner(req, req.query && req.query.visitorId);
  if (!owner) {
    return res.status(400).json({ ok: false, error: 'Missing visitor id.' });
  }

  const messages = listOwnedChatMessages(req.params.id, owner);
  if (!messages) {
    return res.status(404).json({ ok: false, error: 'Chat session not found' });
  }

  res.json({ ok: true, sessionId: Number(req.params.id), messages });
});

app.delete('/api/chat/sessions/:id', (req, res) => {
  const owner = getRequiredChatOwner(req, req.body && req.body.visitorId);
  if (!owner) {
    return res.status(400).json({ ok: false, error: 'Missing visitor id.' });
  }

  const deleted = deleteOwnedChatSession(req.params.id, owner);
  if (!deleted) {
    return res.status(404).json({ ok: false, error: 'Chat session not found' });
  }

  res.json({ ok: true });
});

app.get('/api/admin/chatbot/overview', requireAdmin, (req, res) => {
  res.json({ ok: true, ...getChatbotAdminOverview() });
});

app.post('/api/admin/chatbot/settings', requireAdmin, (req, res) => {
  const settings = saveChatbotSettings(req.body && req.body.settings ? req.body.settings : req.body);
  res.json({ ok: true, settings });
});

app.get('/api/admin/chatbot/conversations/:id', requireAdmin, (req, res) => {
  const conversation = getAdminChatConversation(req.params.id);
  if (!conversation) {
    return res.status(404).json({ ok: false, error: 'Chat conversation not found' });
  }

  res.json({ ok: true, ...conversation });
});

app.post('/api/admin/chatbot/unknown/:id/reviewed', requireAdmin, (req, res) => {
  const questionId = Number(req.params.id);
  if (!Number.isFinite(questionId) || questionId <= 0) {
    return res.status(400).json({ ok: false, error: 'Invalid unknown question id' });
  }

  const reviewed = req.body && req.body.reviewed === false ? 0 : 1;
  const result = db.prepare('UPDATE chatbot_unknown_questions SET reviewed = ? WHERE id = ?').run(reviewed, questionId);
  if (!result.changes) {
    return res.status(404).json({ ok: false, error: 'Unknown question not found' });
  }

  res.json({ ok: true });
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
    INSERT INTO events (day, month_year, title, summary, location, time_text, image_url, link_text, link_url, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        String(item.location || '').trim(),
        String(item.timeText || '').trim(),
        String(item.imageUrl || '').trim(),
        String(item.linkText || 'Read more').trim(),
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

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const messageId = Number(req.params.id);
  if (!Number.isFinite(messageId)) {
    return res.status(400).json({ ok: false, error: 'Invalid message id' });
  }
  db.prepare('DELETE FROM contact_messages WHERE id = ?').run(messageId);
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
  if (REAL_EMAILS_ENABLED) {
    if (/^xsmtpsib-/i.test(BREVO_API_KEY)) {
      console.log('BREVO_API_KEY currently looks like an SMTP key. Replace it with a Brevo API key that starts with xkeysib-.');
    } else {
      console.log('Brevo API email delivery is enabled.');
    }
  } else {
    console.log(`BREVO_API_KEY is not configured. Activation links will be logged to ${MAIL_LOG_PATH}`);
  }
});
