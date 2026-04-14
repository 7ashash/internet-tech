document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const DETAIL_COPY = {
    event: {
      'Ferrari: Driving Luxury Beyond the Road': {
        sections: [
          {
            title: 'Overview',
            paragraphs: [
              'Misr University for Science and Technology proudly hosted Rome Business School for a high-profile event that explored the Ferrari business model as a remarkable case study in luxury branding, design leadership, innovation, and strategic decision-making.',
              'The event highlighted how Ferrari has built a global identity that combines premium engineering, exclusivity, emotional storytelling, and continuous innovation in a way that extends far beyond the automotive market.'
            ]
          },
          {
            title: 'What the Event Focused On',
            bullets: [
              'Luxury brand positioning and long-term value creation.',
              'Innovation and AI as strategic enablers in competitive global markets.',
              'Decision-making models that connect design, performance, and business intelligence.',
              'Cross-disciplinary learning opportunities for MUST students and visitors.'
            ]
          }
        ]
      },
      'Annual Scientific Day': {
        sections: [
          {
            title: 'Overview',
            paragraphs: [
              'The Annual Scientific Day at Misr University for Science and Technology showcased a wide selection of student work, scientific posters, research-oriented discussions, and applied innovation from the College of Biotechnology.',
              'The event served as a platform to celebrate academic excellence and present how scientific education can be translated into practical projects and future-ready solutions.'
            ]
          },
          {
            title: 'Highlights',
            bullets: [
              'Student projects and posters presented in a professional academic setting.',
              'Interactive scientific discussions between faculty members and attendees.',
              'Recognition of creativity, scientific inquiry, and applied learning.',
              'A university environment that encourages research culture and innovation.'
            ]
          }
        ]
      },
      'College of Information Technology conference entitle "Artificial Intelligence for Environmental Sustainability"': {
        sections: [
          {
            title: 'Overview',
            paragraphs: [
              'The College of Information Technology conference focused on how artificial intelligence can support environmental sustainability through data analysis, predictive systems, automation, and smarter resource management.',
              'The event connected technology, sustainability, and public awareness by presenting how AI can contribute to climate action, environmental planning, and sustainable institutional practices.'
            ]
          },
          {
            title: 'Conference Themes',
            bullets: [
              'Artificial intelligence applications for environmental monitoring.',
              'Data-driven sustainability practices and smart decision support.',
              'Digital transformation for greener institutions and communities.',
              'Bridging research, academic learning, and sustainable development goals.'
            ]
          }
        ]
      }
    },
    news: {
      'MUST University Celebrates the International Day of Women and Girls in Science': {
        sections: [
          {
            title: 'Overview',
            paragraphs: [
              'Misr University for Science and Technology celebrated the International Day of Women and Girls in Science through an institutional initiative that emphasized inclusion, empowerment, and visibility for women in scientific and research fields.',
              'The news reflects the university commitment to creating an academic environment where talent, innovation, and scientific contribution are encouraged across all disciplines.'
            ]
          },
          {
            title: 'Key Message',
            bullets: [
              'Supporting women participation in science and research.',
              'Encouraging academic ambition and scientific excellence.',
              'Reinforcing equal opportunity within the university community.'
            ]
          }
        ]
      },
      'Seminar:Towards a Confident Generation: Balancing Faith and Community Effectiveness-MUST Reading Club': {
        sections: [
          {
            title: 'Overview',
            paragraphs: [
              'The MUST Reading Club organized a seminar titled "Towards a Confident Generation: Balancing Faith and Community Effectiveness" to encourage balanced personal growth, critical thinking, and constructive engagement with society.',
              'The seminar created a thoughtful space for dialogue around identity, values, and how students can build confidence while remaining positively connected to their community.'
            ]
          },
          {
            title: 'Discussion Points',
            bullets: [
              'Personal confidence and intellectual growth.',
              'The role of values in community contribution.',
              'Constructive dialogue and student cultural engagement.'
            ]
          }
        ]
      },
      'Participation of Misr University for Science and Technology in the Cairo International Book Fair (57th Edition)': {
        sections: [
          {
            title: 'Overview',
            paragraphs: [
              'Misr University for Science and Technology participated in the Cairo International Book Fair as part of its cultural and educational engagement activities, highlighting the value of reading, knowledge exchange, and community presence.',
              'The participation reflected the university role in supporting awareness initiatives and reinforcing the connection between education, culture, and social development.'
            ]
          },
          {
            title: 'Participation Goals',
            bullets: [
              'Supporting national cultural events and educational outreach.',
              'Encouraging reading and knowledge-sharing among students.',
              'Strengthening university presence in public intellectual spaces.'
            ]
          }
        ]
      }
    }
  };

  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get('lang');
  let currentDetailLanguage = queryLang === 'ar' || (!queryLang && window.localStorage.getItem('must-site-language') === 'ar') ? 'ar' : 'en';
  let currentRawItem = null;

  const defaultUi = {
    sectorName: document.getElementById('detailSectorName') ? document.getElementById('detailSectorName').textContent.trim() : '',
    back: document.getElementById('detailBackLinkText') ? document.getElementById('detailBackLinkText').textContent.trim() : '',
    copyright: document.getElementById('detailFooterCopyright') ? document.getElementById('detailFooterCopyright').textContent.trim() : '',
    loadingTitle: document.getElementById('detailTitle') ? document.getElementById('detailTitle').textContent.trim() : 'Loading details...',
    loadingBody: document.getElementById('detailDescription') ? document.getElementById('detailDescription').textContent.trim() : 'Please wait while we load the selected item.',
    eyebrowEvent: 'MUST Event',
    eyebrowNews: 'MUST News',
    invalid: 'The selected content could not be identified.',
    loadError: 'Could not load the selected item.'
  };

  function getArabicI18n() {
    return window.MUST_SITE_I18N && window.MUST_SITE_I18N.ar ? window.MUST_SITE_I18N.ar : null;
  }

  function apiRequest(url) {
    return fetch(url, { cache: 'no-store' }).then(async function (response) {
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Could not load the selected item');
      }
      return data;
    });
  }

  function localizeMessage(message) {
    const value = String(message || '');
    if (currentDetailLanguage !== 'ar') return value;
    const arabic = getArabicI18n();
    const exact = arabic && arabic.messages && arabic.messages.exact ? arabic.messages.exact : {};
    return exact[value] || value;
  }

  function applyDetailLanguageShell(lang) {
    const arabic = getArabicI18n();
    const detailUi = lang === 'ar' && arabic && arabic.ui ? arabic.ui.detail : defaultUi;
    const toggleBtn = document.getElementById('detailLanguageToggleBtn');

    currentDetailLanguage = lang === 'ar' ? 'ar' : 'en';
    window.localStorage.setItem('must-site-language', currentDetailLanguage);
    document.documentElement.lang = currentDetailLanguage;
    document.documentElement.dir = currentDetailLanguage === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('site-language-ar', currentDetailLanguage === 'ar');

    if (document.getElementById('detailSectorName')) document.getElementById('detailSectorName').textContent = detailUi.sectorName || defaultUi.sectorName;
    if (document.getElementById('detailBackLinkText')) document.getElementById('detailBackLinkText').textContent = detailUi.back || defaultUi.back;
    if (document.getElementById('detailFooterCopyright')) document.getElementById('detailFooterCopyright').textContent = detailUi.copyright || defaultUi.copyright;
    if (toggleBtn) {
      toggleBtn.textContent = currentDetailLanguage === 'ar' && arabic ? arabic.ui.button.short : 'ع';
      toggleBtn.setAttribute('aria-label', currentDetailLanguage === 'ar' && arabic ? arabic.ui.button.ariaLabel : 'التحويل إلى العربية');
    }
  }

  function setStatus(message, type) {
    const status = document.getElementById('detailStatus');
    if (!status) return;
    status.className = 'detail-status ' + (type || 'error');
    status.textContent = localizeMessage(message);
    status.classList.remove('hidden');
  }

  function renderDetailHeroSlider(items) {
    const target = document.getElementById('detailHeroSlider');
    if (!target) return;
    const slides = Array.isArray(items) && items.length ? items : [
      { imageUrl: 'images/photo-slider1.jpeg', alt: 'MUST gallery 1' },
      { imageUrl: 'images/photo-slider2.jpeg', alt: 'MUST gallery 2' },
      { imageUrl: 'images/memory-slide-11.jpg', alt: 'MUST gallery 3' }
    ];

    target.innerHTML = slides.map(function (item, index) {
      return '<div class="detail-hero-slide' + (index === 0 ? ' active' : '') + '"><img src="' + (item.imageUrl || 'images/photo-slider1.jpeg') + '" alt="' + (item.alt || ('Slide ' + (index + 1))) + '"></div>';
    }).join('');

    const heroSlides = target.querySelectorAll('.detail-hero-slide');
    if (!heroSlides.length) return;
    let currentIndex = 0;

    function showSlide(nextIndex) {
      currentIndex = (nextIndex + heroSlides.length) % heroSlides.length;
      heroSlides.forEach(function (slide, index) {
        slide.classList.toggle('active', index === currentIndex);
      });
    }

    if (target._sliderTimer) {
      window.clearInterval(target._sliderTimer);
    }
    target._sliderTimer = window.setInterval(function () {
      showSlide(currentIndex + 1);
    }, 4200);
  }

  function buildFallbackSections(type, item) {
    const arabic = getArabicI18n();
    if (currentDetailLanguage === 'ar' && arabic && arabic.ui) {
      return [{ title: 'التفاصيل', paragraphs: [item.summary || 'المحتوى المحدد جزء من تحديثات قطاع خدمة المجتمع وتنمية البيئة بجامعة مصر للعلوم والتكنولوجيا.'] }];
    }
    return [{ title: type === 'event' ? 'Overview' : 'Details', paragraphs: [item.summary || 'The selected item is part of the Environmental and Community Service Sector updates at Misr University for Science and Technology.'] }];
  }

  function translateItem(type, item) {
    if (currentDetailLanguage !== 'ar') return item;
    const arabic = getArabicI18n();
    const map = arabic && arabic.itemTranslations && arabic.itemTranslations[type] ? arabic.itemTranslations[type][item.title] : null;
    if (!map) return item;
    return Object.assign({}, item, map, { _translationKey: item.title });
  }

  function enrichEventMeta(item) {
    if (!item) return item;
    const defaultsByTitle = {
      'Ferrari: Driving Luxury Beyond the Road': {
        location: 'MUST Convention Center',
        timeText: '10:00 AM'
      },
      'Annual Scientific Day': {
        location: 'College of Biotechnology Hall',
        timeText: '11:30 AM'
      },
      'College of Information Technology conference entitle "Artificial Intelligence for Environmental Sustainability"': {
        location: 'MUST Main Auditorium',
        timeText: '09:00 AM'
      }
    };
    const fallback = defaultsByTitle[item.title] || {};
    return Object.assign({}, item, {
      location: item.location || fallback.location || '',
      timeText: item.timeText || fallback.timeText || ''
    });
  }

  function resolveSections(type, item) {
    const key = item._translationKey || item.title;
    if (currentDetailLanguage === 'ar') {
      const arabic = getArabicI18n();
      const byLang = arabic && arabic.detailCopy && arabic.detailCopy[type] ? arabic.detailCopy[type][key] : null;
      if (byLang && Array.isArray(byLang.sections)) {
        return byLang.sections;
      }
    }
    const group = DETAIL_COPY[type] || {};
    const byTitle = group[key];
    if (byTitle && Array.isArray(byTitle.sections)) {
      return byTitle.sections;
    }
    return buildFallbackSections(type, item);
  }

  function renderSections(target, sections) {
    if (!target) return;
    target.innerHTML = sections.map(function (section) {
      const titleMarkup = section.title ? '<h3 class="detail-section-title">' + section.title + '</h3>' : '';
      const paragraphsMarkup = Array.isArray(section.paragraphs) ? section.paragraphs.map(function (paragraph) { return '<p>' + paragraph + '</p>'; }).join('') : '';
      const bulletsMarkup = Array.isArray(section.bullets) && section.bullets.length ? '<ul>' + section.bullets.map(function (bullet) { return '<li>' + bullet + '</li>'; }).join('') + '</ul>' : '';
      return titleMarkup + paragraphsMarkup + bulletsMarkup;
    }).join('');
  }

  function renderItem(type, rawItem) {
    const arabic = getArabicI18n();
    const detailUi = currentDetailLanguage === 'ar' && arabic && arabic.ui ? arabic.ui.detail : defaultUi;
    const item = type === 'event' ? enrichEventMeta(translateItem(type, rawItem || {})) : translateItem(type, rawItem || {});
    const title = document.getElementById('detailTitle');
    const eyebrow = document.getElementById('detailEyebrow');
    const meta = document.getElementById('detailMeta');
    const image = document.getElementById('detailImage');
    const description = document.getElementById('detailDescription');

    if (title) title.textContent = item.title || (currentDetailLanguage === 'ar' ? 'تفاصيل المحتوى' : 'Untitled');
    if (eyebrow) eyebrow.textContent = type === 'event' ? (detailUi.eyebrowEvent || defaultUi.eyebrowEvent) : (detailUi.eyebrowNews || defaultUi.eyebrowNews);
    if (image) {
      image.src = item.imageUrl || 'images/logo-png.png';
      image.alt = item.title || (type === 'event' ? 'Event image' : 'News image');
    }

    if (meta) {
      const parts = [];
      if (type === 'news' && item.badge) {
        parts.push('<span><i class="far fa-calendar"></i> ' + item.badge + '</span>');
      }
      if (type === 'event') {
        if (item.day || item.monthYear) parts.push('<span><i class="far fa-calendar"></i> ' + ((item.day || '') + ' ' + (item.monthYear || '')).trim() + '</span>');
        if (item.location) parts.push('<span><i class="fas fa-location-dot"></i> ' + item.location + '</span>');
        if (item.timeText) parts.push('<span><i class="far fa-clock"></i> ' + item.timeText + '</span>');
      }
      meta.innerHTML = parts.join('');
    }

    renderSections(description, resolveSections(type, item));
    document.title = (item.title || (currentDetailLanguage === 'ar' ? 'تفاصيل المحتوى' : 'Content Details')) + ' | MUST';
  }

  applyDetailLanguageShell(currentDetailLanguage);

  apiRequest('/api/content/public')
    .then(function (data) {
      const sections = data.sections || {};
      renderDetailHeroSlider(sections.galleryItems || []);
    })
    .catch(function () {
      renderDetailHeroSlider([]);
    });

  const toggleBtn = document.getElementById('detailLanguageToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      applyDetailLanguageShell(currentDetailLanguage === 'ar' ? 'en' : 'ar');
      if (currentRawItem) {
        renderItem(type, currentRawItem);
      }
    });
  }

  const type = params.get('type');
  const id = params.get('id');
  if (!type || !id || (type !== 'news' && type !== 'event')) {
    const arabic = getArabicI18n();
    const invalidMessage = currentDetailLanguage === 'ar' && arabic && arabic.ui ? (arabic.ui.detail.invalid || defaultUi.invalid) : defaultUi.invalid;
    setStatus(invalidMessage, 'error');
    return;
  }

  const endpoint = type === 'event' ? '/api/content/public/events/' + encodeURIComponent(id) : '/api/content/public/news/' + encodeURIComponent(id);

  apiRequest(endpoint)
    .then(function (data) {
      currentRawItem = data.item || {};
      renderItem(type, currentRawItem);
    })
    .catch(function (error) {
      const arabic = getArabicI18n();
      const loadErrorMessage = currentDetailLanguage === 'ar' && arabic && arabic.ui ? (arabic.ui.detail.loadError || defaultUi.loadError) : defaultUi.loadError;
      setStatus(error.message || loadErrorMessage, 'error');
    });
});
