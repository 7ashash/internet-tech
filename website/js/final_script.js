document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  function normalizeUrl(url) {
    if (!url) return '#';
    var value = String(url).trim();
    if (value.startsWith('#https://') || value.startsWith('#http://')) {
      return value.slice(1);
    }
    return value;
  }

  function parseManagedJson(id) {
    var node = document.getElementById(id);
    if (!node) return [];
    try {
      var parsed = JSON.parse(node.textContent.trim() || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Could not parse managed JSON for:', id, error);
      return [];
    }
  }

  function parsePreferredManagedJson(primaryId, fallbackId) {
    var preferredNode = document.getElementById(primaryId);
    if (preferredNode) {
      return parseManagedJson(primaryId);
    }
    return parseManagedJson(fallbackId);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeLinkMarkup(url, text, className) {
    var cleanUrl = normalizeUrl(url || '#');
    var safeText = escapeHtml(text || 'Open');
    var safeClass = escapeHtml(className || '');

    if (!cleanUrl || cleanUrl === '#') {
      return '<span class="' + safeClass + ' static-card-link">' + safeText + '</span>';
    }

    return '<a href="' + escapeHtml(cleanUrl) + '" class="' + safeClass + '" target="_blank" rel="noopener">' + safeText + '</a>';
  }

  var body = document.body;
  var menuBtn = document.querySelector('.custom-menu-btn');
  var menuCloseBtn = document.querySelector('.nav-menu-close');
  var navMenu = document.querySelector('.nav-menu');
  var menuBackdrop = document.querySelector('.menu-backdrop');
  var menuLinks = document.querySelectorAll('.nav-menu a');
  var submenuToggles = document.querySelectorAll('.submenu-toggle');
  var themeToggle = document.querySelector('.theme-toggle');
  var authModal = document.getElementById('authModal');
  var authModalBackdrop = document.getElementById('authModalBackdrop');
  var openAuthModalBtn = document.getElementById('openAuthModalBtn');
  var closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
  var loginTabBtn = document.getElementById('loginTabBtn');
  var registerTabBtn = document.getElementById('registerTabBtn');
  var loginAuthForm = document.getElementById('loginAuthForm');
  var registerAuthForm = document.getElementById('registerAuthForm');
  var authFeedback = document.getElementById('authFeedback');
  var authModalCard = document.querySelector('.auth-modal-card');
  var authUserChip = document.getElementById('authUserChip');
  var authUserName = document.getElementById('authUserName');
  var adminDashboardLink = document.getElementById('adminDashboardLink');
  var adminMenuDashboardItem = document.getElementById('adminMenuDashboardItem');
  var siteLogoutBtn = document.getElementById('siteLogoutBtn');
  var contactForm = document.getElementById('contactForm');
  var contactFeedback = document.getElementById('contactFeedback');
  var heroQuickDropdowns = document.querySelectorAll('.hero-quick-dropdown');
  var activityModal = document.getElementById('activityModal');
  var activityModalBackdrop = document.getElementById('activityModalBackdrop');
  var activityModalCloseBtn = document.getElementById('activityModalCloseBtn');
  var activityModalMedia = document.getElementById('activityModalMedia');
  var activityModalDate = document.getElementById('activityModalDate');
  var activityModalTitle = document.getElementById('activityModalTitle');
  var activityModalText = document.getElementById('activityModalText');
  var languageToggleBtn = document.getElementById('languageToggleBtn');
  var currentUser = null;
  var managedActivityGroupsData = [];
  var managedPublicContent = { sections: null, news: [], events: [] };
  var capturedStaticUi = null;
  var currentSiteLanguage = window.localStorage.getItem('must-site-language') === 'ar' ? 'ar' : 'en';

  function getArabicI18n() {
    return window.MUST_SITE_I18N && window.MUST_SITE_I18N.ar ? window.MUST_SITE_I18N.ar : null;
  }

  function captureTexts(nodes) {
    return Array.prototype.slice.call(nodes || []).map(function (node) {
      return node ? String(node.textContent || '').trim() : '';
    });
  }

  function setTexts(nodes, values) {
    Array.prototype.slice.call(nodes || []).forEach(function (node, index) {
      if (!node || !values || typeof values[index] !== 'string') return;
      node.textContent = values[index];
    });
  }

  function getPlaceholderValues(ids) {
    return ids.map(function (id) {
      var node = document.getElementById(id);
      return node ? String(node.getAttribute('placeholder') || '') : '';
    });
  }

  function setPlaceholderValues(ids, values) {
    ids.forEach(function (id, index) {
      var node = document.getElementById(id);
      if (!node || !values || typeof values[index] !== 'string') return;
      node.setAttribute('placeholder', values[index]);
    });
  }

  function captureStaticUiState() {
    if (capturedStaticUi) return capturedStaticUi;

    capturedStaticUi = {
      topNavMain: captureTexts(document.querySelectorAll('.site-primary-list > .site-primary-item > .site-primary-link')),
      topNavDropdowns: Array.prototype.slice.call(document.querySelectorAll('.site-primary-list .desktop-dropdown')).map(function (menu) {
        return captureTexts(menu.querySelectorAll('a'));
      }),
      navMenuTitle: document.querySelector('.nav-menu-header h2') ? document.querySelector('.nav-menu-header h2').textContent.trim() : '',
      navMenuMain: captureTexts(document.querySelectorAll('.nav-menu-list > .nav-menu-item > .nav-menu-link, .nav-menu-list > .nav-menu-item > .submenu-toggle')),
      navMenuSubmenus: Array.prototype.slice.call(document.querySelectorAll('.nav-menu-list .submenu-list')).map(function (menu) {
        return captureTexts(menu.querySelectorAll('.submenu-link'));
      }),
      heroQuickMain: captureTexts(document.querySelectorAll('.hero-quick-links > .hero-quick-link, .hero-quick-links > .hero-quick-dropdown > summary')),
      heroQuickSubmenus: Array.prototype.slice.call(document.querySelectorAll('.hero-submenu')).map(function (menu) {
        return captureTexts(menu.querySelectorAll('a'));
      }),
      auth: {
        open: openAuthModalBtn ? openAuthModalBtn.textContent.trim() : '',
        dashboard: adminDashboardLink ? adminDashboardLink.textContent.trim() : '',
        logout: siteLogoutBtn ? siteLogoutBtn.textContent.trim() : '',
        modalEyebrow: document.querySelector('.auth-modal-eyebrow') ? document.querySelector('.auth-modal-eyebrow').textContent.trim() : '',
        modalTitle: document.getElementById('authModalTitle') ? document.getElementById('authModalTitle').textContent.trim() : '',
        modalCopy: document.querySelector('.auth-modal-copy') ? document.querySelector('.auth-modal-copy').textContent.trim() : '',
        loginTab: loginTabBtn ? loginTabBtn.textContent.trim() : '',
        registerTab: registerTabBtn ? registerTabBtn.textContent.trim() : '',
        loginLabels: captureTexts(loginAuthForm ? loginAuthForm.querySelectorAll('label') : []),
        registerLabels: captureTexts(registerAuthForm ? registerAuthForm.querySelectorAll('label') : []),
        loginPlaceholders: getPlaceholderValues(['loginEmail', 'loginPassword']),
        registerPlaceholders: getPlaceholderValues(['registerFirstName', 'registerLastName', 'registerEmail', 'registerPassword']),
        loginSubmit: loginAuthForm && loginAuthForm.querySelector('button[type="submit"]') ? loginAuthForm.querySelector('button[type="submit"]').textContent.trim() : '',
        registerSubmit: registerAuthForm && registerAuthForm.querySelector('button[type="submit"]') ? registerAuthForm.querySelector('button[type="submit"]').textContent.trim() : '',
        closeAria: closeAuthModalBtn ? closeAuthModalBtn.getAttribute('aria-label') : ''
      },
      contact: {
        placeholders: getPlaceholderValues(['contactName', 'contactEmail', 'contactPhone', 'contactMessage']),
        captcha: document.querySelector('.captcha-label') ? document.querySelector('.captcha-label').textContent.trim() : '',
        notRobot: document.querySelector('label[for="robot-check"]') ? document.querySelector('label[for="robot-check"]').textContent.trim() : '',
        submit: contactForm && contactForm.querySelector('button[type="submit"]') ? contactForm.querySelector('button[type="submit"]').textContent.trim() : ''
      },
      footer: {
        headings: captureTexts(document.querySelectorAll('.footer-col h4')),
        columns: Array.prototype.slice.call(document.querySelectorAll('.footer-col ul')).map(function (list) {
          return captureTexts(list.querySelectorAll('a'));
        })
      },
      misc: {
        themeToggleAria: themeToggle ? themeToggle.getAttribute('aria-label') : '',
        menuAria: menuBtn ? menuBtn.getAttribute('aria-label') : '',
        closeActivityAria: activityModalCloseBtn ? activityModalCloseBtn.getAttribute('aria-label') : ''
      }
    };

    return capturedStaticUi;
  }

  function localizeRuntimeMessage(message) {
    var value = String(message || '');
    if (currentSiteLanguage !== 'ar') return value;

    var arabic = getArabicI18n();
    var exact = arabic && arabic.messages && arabic.messages.exact ? arabic.messages.exact : {};
    var replacements = arabic && arabic.messages && Array.isArray(arabic.messages.replacements) ? arabic.messages.replacements : [];

    if (exact[value]) {
      return exact[value];
    }

    replacements.forEach(function (entry) {
      if (!Array.isArray(entry) || entry.length < 2) return;
      value = value.replace(entry[0], entry[1]);
    });

    return value;
  }

  function applyStaticUiLanguage(lang) {
    var defaults = captureStaticUiState();
    var arabic = getArabicI18n();
    var ui = lang === 'ar' && arabic ? arabic.ui : defaults;
    var authUi = ui.auth || defaults.auth;
    var contactUi = ui.contact || defaults.contact;
    var footerUi = ui.footer || defaults.footer;
    var miscUi = ui.misc || defaults.misc;

    setTexts(document.querySelectorAll('.site-primary-list > .site-primary-item > .site-primary-link'), ui.topNavMain || defaults.topNavMain);
    Array.prototype.slice.call(document.querySelectorAll('.site-primary-list .desktop-dropdown')).forEach(function (menu, index) {
      setTexts(menu.querySelectorAll('a'), (ui.topNavDropdowns && ui.topNavDropdowns[index]) || (defaults.topNavDropdowns[index] || []));
    });

    var navMenuTitle = document.querySelector('.nav-menu-header h2');
    if (navMenuTitle) {
      navMenuTitle.textContent = ui.navMenuTitle || defaults.navMenuTitle;
    }

    setTexts(document.querySelectorAll('.nav-menu-list > .nav-menu-item > .nav-menu-link, .nav-menu-list > .nav-menu-item > .submenu-toggle'), ui.navMenuMain || defaults.navMenuMain);
    Array.prototype.slice.call(document.querySelectorAll('.nav-menu-list .submenu-list')).forEach(function (menu, index) {
      setTexts(menu.querySelectorAll('.submenu-link'), (ui.navMenuSubmenus && ui.navMenuSubmenus[index]) || (defaults.navMenuSubmenus[index] || []));
    });

    setTexts(document.querySelectorAll('.hero-quick-links > .hero-quick-link, .hero-quick-links > .hero-quick-dropdown > summary'), ui.heroQuickMain || defaults.heroQuickMain);
    Array.prototype.slice.call(document.querySelectorAll('.hero-submenu')).forEach(function (menu, index) {
      setTexts(menu.querySelectorAll('a'), (ui.heroQuickSubmenus && ui.heroQuickSubmenus[index]) || (defaults.heroQuickSubmenus[index] || []));
    });

    if (openAuthModalBtn) openAuthModalBtn.textContent = authUi.open || defaults.auth.open;
    if (adminDashboardLink) adminDashboardLink.textContent = authUi.dashboard || defaults.auth.dashboard;
    if (siteLogoutBtn) siteLogoutBtn.textContent = authUi.logout || defaults.auth.logout;
    if (document.querySelector('.auth-modal-eyebrow')) document.querySelector('.auth-modal-eyebrow').textContent = authUi.modalEyebrow || defaults.auth.modalEyebrow;
    if (document.getElementById('authModalTitle')) document.getElementById('authModalTitle').textContent = authUi.modalTitle || defaults.auth.modalTitle;
    if (document.querySelector('.auth-modal-copy')) document.querySelector('.auth-modal-copy').textContent = authUi.modalCopy || defaults.auth.modalCopy;
    if (loginTabBtn) loginTabBtn.textContent = authUi.loginTab || defaults.auth.loginTab;
    if (registerTabBtn) registerTabBtn.textContent = authUi.registerTab || defaults.auth.registerTab;
    setTexts(loginAuthForm ? loginAuthForm.querySelectorAll('label') : [], authUi.loginLabels || defaults.auth.loginLabels);
    setTexts(registerAuthForm ? registerAuthForm.querySelectorAll('label') : [], authUi.registerLabels || defaults.auth.registerLabels);
    setPlaceholderValues(['loginEmail', 'loginPassword'], authUi.loginPlaceholders || defaults.auth.loginPlaceholders);
    setPlaceholderValues(['registerFirstName', 'registerLastName', 'registerEmail', 'registerPassword'], authUi.registerPlaceholders || defaults.auth.registerPlaceholders);
    if (loginAuthForm && loginAuthForm.querySelector('button[type="submit"]')) loginAuthForm.querySelector('button[type="submit"]').textContent = authUi.loginSubmit || defaults.auth.loginSubmit;
    if (registerAuthForm && registerAuthForm.querySelector('button[type="submit"]')) registerAuthForm.querySelector('button[type="submit"]').textContent = authUi.registerSubmit || defaults.auth.registerSubmit;
    if (closeAuthModalBtn) closeAuthModalBtn.setAttribute('aria-label', authUi.closeAria || defaults.auth.closeAria);

    setPlaceholderValues(['contactName', 'contactEmail', 'contactPhone', 'contactMessage'], contactUi.placeholders || defaults.contact.placeholders);
    if (document.querySelector('.captcha-label')) document.querySelector('.captcha-label').textContent = contactUi.captcha || defaults.contact.captcha;
    if (document.querySelector('label[for="robot-check"]')) document.querySelector('label[for="robot-check"]').textContent = contactUi.notRobot || defaults.contact.notRobot;
    if (contactForm && contactForm.querySelector('button[type="submit"]')) contactForm.querySelector('button[type="submit"]').textContent = contactUi.submit || defaults.contact.submit;

    setTexts(document.querySelectorAll('.footer-col h4'), footerUi.headings || defaults.footer.headings);
    Array.prototype.slice.call(document.querySelectorAll('.footer-col ul')).forEach(function (list, index) {
      setTexts(list.querySelectorAll('a'), (footerUi.columns && footerUi.columns[index]) || (defaults.footer.columns[index] || []));
    });

    if (themeToggle) themeToggle.setAttribute('aria-label', miscUi.themeToggleAria || defaults.misc.themeToggleAria);
    if (menuBtn) menuBtn.setAttribute('aria-label', miscUi.menuAria || defaults.misc.menuAria);
    if (activityModalCloseBtn) activityModalCloseBtn.setAttribute('aria-label', miscUi.closeActivityAria || defaults.misc.closeActivityAria);

    if (languageToggleBtn) {
      languageToggleBtn.textContent = lang === 'ar' && arabic ? arabic.ui.button.short : 'ع';
      languageToggleBtn.setAttribute('aria-label', lang === 'ar' && arabic ? arabic.ui.button.ariaLabel : 'التحويل إلى العربية');
    }
  }

  function translateItemForLanguage(type, item, lang) {
    if (!item || lang !== 'ar') return item;
    var arabic = getArabicI18n();
    var map = arabic && arabic.itemTranslations && arabic.itemTranslations[type] ? arabic.itemTranslations[type][item.title] : null;
    if (!map) return item;
    var translated = Object.assign({}, item, map);
    translated._translationKey = item.title;
    return translated;
  }

  function translateItemsForLanguage(type, items, lang) {
    return Array.isArray(items) ? items.map(function (item) { return translateItemForLanguage(type, item, lang); }) : [];
  }

  function enrichEventMeta(item) {
    if (!item) return item;
    var defaultsByTitle = {
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
    var fallback = defaultsByTitle[item.title] || {};
    return Object.assign({}, item, {
      location: item.location || fallback.location || '',
      timeText: item.timeText || fallback.timeText || ''
    });
  }

  function getSectionsForLanguage(lang) {
    var base = managedPublicContent.sections || {};
    var arabic = getArabicI18n();
    if (lang === 'ar' && arabic && arabic.sections) {
      return Object.assign({}, base, arabic.sections, {
        visionCardTitle: 'رؤية القطاع',
        missionCardTitle: 'رسالة القطاع',
        objectivesCardTitle: 'أهداف القطاع'
      });
    }
    return base;
  }

  function applyLanguageShell(lang) {
    currentSiteLanguage = lang === 'ar' ? 'ar' : 'en';
    window.localStorage.setItem('must-site-language', currentSiteLanguage);
    document.documentElement.lang = currentSiteLanguage;
    document.documentElement.dir = currentSiteLanguage === 'ar' ? 'rtl' : 'ltr';
    body.classList.toggle('site-language-ar', currentSiteLanguage === 'ar');
    applyStaticUiLanguage(currentSiteLanguage);
  }

  function renderCurrentLanguageView() {
    var sections = getSectionsForLanguage(currentSiteLanguage);
    if (sections && Object.keys(sections).length) {
      applyManagedSections(sections);
      document.title = (sections.heroTitle || 'Environmental and Community Service Sector') + ' | MUST';
    }

    var newsItems = managedPublicContent.news && managedPublicContent.news.length
      ? managedPublicContent.news
      : parsePreferredManagedJson('official-managed-news-data', 'managed-news-data');
    var eventItems = managedPublicContent.events && managedPublicContent.events.length
      ? managedPublicContent.events
      : parsePreferredManagedJson('official-managed-events-data', 'managed-events-data');

    renderNews(translateItemsForLanguage('news', newsItems, currentSiteLanguage));
    renderEvents(translateItemsForLanguage('event', eventItems, currentSiteLanguage).map(enrichEventMeta));
  }

  function buildLocalDetailUrl(type, id) {
    return 'content-detail.html?type=' + encodeURIComponent(type) + '&id=' + encodeURIComponent(id) + '&lang=' + encodeURIComponent(currentSiteLanguage);
  }

  function localDetailLinkMarkup(type, item, className, text) {
    if (!item || !item.id) {
      return '<span class="' + escapeHtml(className || '') + ' static-card-link">' + escapeHtml(text || 'Read more') + '</span>';
    }

    return '<a href="' + escapeHtml(buildLocalDetailUrl(type, item.id)) + '" class="' + escapeHtml(className || '') + '">' + escapeHtml(text || 'Read more') + '</a>';
  }

  function truncateText(text, maxLength) {
    var value = String(text || '').trim();
    if (!value || value.length <= maxLength) return value;
    return value.slice(0, maxLength).trim() + '...';
  }

  function openMenu() {
    if (!menuBtn || !navMenu || !menuBackdrop) return;
    navMenu.classList.add('active');
    menuBackdrop.classList.add('active');
    menuBtn.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    navMenu.setAttribute('aria-hidden', 'false');
    body.classList.add('menu-open');
  }

  function closeMenu() {
    if (!menuBtn || !navMenu || !menuBackdrop) return;
    navMenu.classList.remove('active');
    menuBackdrop.classList.remove('active');
    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    navMenu.setAttribute('aria-hidden', 'true');
    body.classList.remove('menu-open');
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function (event) {
      event.preventDefault();
      if (navMenu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (menuCloseBtn) {
    menuCloseBtn.addEventListener('click', closeMenu);
  }

  if (menuBackdrop) {
    menuBackdrop.addEventListener('click', closeMenu);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMenu();
      closeActivityModal();
    }
  });

  submenuToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var parent = toggle.closest('.has-submenu');
      var expanded = toggle.getAttribute('aria-expanded') === 'true';

      submenuToggles.forEach(function (otherToggle) {
        if (otherToggle !== toggle) {
          otherToggle.setAttribute('aria-expanded', 'false');
          otherToggle.closest('.has-submenu').classList.remove('open');
        }
      });

      toggle.setAttribute('aria-expanded', String(!expanded));
      parent.classList.toggle('open', !expanded);
    });
  });

  menuLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeMenu();
    });
  });

  applyLanguageShell(currentSiteLanguage);
  renderCurrentLanguageView();

  if (languageToggleBtn) {
    languageToggleBtn.addEventListener('click', function () {
      applyLanguageShell(currentSiteLanguage === 'ar' ? 'en' : 'ar');
      renderCurrentLanguageView();
    });
  }

  if (heroQuickDropdowns.length) {
    function clearHeroDropdownPosition(dropdown) {
      var submenu = dropdown.querySelector('.hero-submenu');
      dropdown.classList.remove('drop-up');
      if (submenu) {
        submenu.style.removeProperty('--hero-submenu-height');
      }
    }

    function closeHeroDropdown(dropdown) {
      if (!dropdown) return;
      dropdown.open = false;
      clearHeroDropdownPosition(dropdown);
    }

    function closeAllHeroDropdowns(exceptDropdown) {
      heroQuickDropdowns.forEach(function (dropdown) {
        if (dropdown !== exceptDropdown) {
          closeHeroDropdown(dropdown);
        }
      });
    }

    function positionHeroDropdown(dropdown) {
      var submenu = dropdown.querySelector('.hero-submenu');
      var trigger = dropdown.querySelector('summary');
      var heroShell = dropdown.closest('.hero-slider-shell');

      if (!submenu || !trigger || !heroShell || window.innerWidth <= 768) {
        clearHeroDropdownPosition(dropdown);
        return;
      }

      clearHeroDropdownPosition(dropdown);

      var heroRect = heroShell.getBoundingClientRect();
      var triggerRect = trigger.getBoundingClientRect();
      var minHeight = 102;
      var maxHeight = 220;
      var spacing = 12;
      var availableBelow = Math.max(minHeight, Math.floor(heroRect.bottom - triggerRect.bottom - spacing));
      var availableAbove = Math.max(minHeight, Math.floor(triggerRect.top - heroRect.top - spacing));
      var openUp = availableBelow < 150 && availableAbove > availableBelow;
      var availableHeight = openUp ? availableAbove : availableBelow;

      submenu.style.setProperty('--hero-submenu-height', Math.max(minHeight, Math.min(availableHeight, maxHeight)) + 'px');
      dropdown.classList.toggle('drop-up', openUp);
    }

    function openHeroDropdown(dropdown) {
      if (!dropdown) return;
      closeAllHeroDropdowns(dropdown);
      dropdown.open = true;
      positionHeroDropdown(dropdown);
    }

    heroQuickDropdowns.forEach(function (dropdown) {
      dropdown.addEventListener('toggle', function () {
        if (!dropdown.open) {
          clearHeroDropdownPosition(dropdown);
          return;
        }
        closeAllHeroDropdowns(dropdown);
        positionHeroDropdown(dropdown);
      });

      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        dropdown.addEventListener('mouseenter', function () {
          if (dropdown._heroHoverTimerId) {
            window.clearTimeout(dropdown._heroHoverTimerId);
          }
          openHeroDropdown(dropdown);
        });

        dropdown.addEventListener('mouseleave', function () {
          if (dropdown._heroHoverTimerId) {
            window.clearTimeout(dropdown._heroHoverTimerId);
          }
          dropdown._heroHoverTimerId = window.setTimeout(function () {
            closeHeroDropdown(dropdown);
          }, 90);
        });
      }
    });

    document.addEventListener('click', function (event) {
      heroQuickDropdowns.forEach(function (dropdown) {
        if (!dropdown.contains(event.target)) {
          closeHeroDropdown(dropdown);
        }
      });
    });

    document.querySelectorAll('.hero-submenu a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeAllHeroDropdowns();
      });
    });

    window.addEventListener('resize', function () {
      heroQuickDropdowns.forEach(function (dropdown) {
        if (dropdown.open) {
          positionHeroDropdown(dropdown);
        }
      });
    });
  }

  function closeActivityModal() {
    if (!activityModal) return;
    activityModal.classList.add('hidden');
    activityModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    if (activityModalMedia && activityModalMedia._activityTimerId) {
      window.clearInterval(activityModalMedia._activityTimerId);
    }
  }

  function initModalActivitySlider() {
    if (!activityModalMedia) return;
    var slides = activityModalMedia.querySelectorAll('.content-modal-slide');
    if (!slides.length) return;
    var currentIndex = 0;
    var prevBtn = activityModalMedia.querySelector('.content-modal-prev');
    var nextBtn = activityModalMedia.querySelector('.content-modal-next');

    function showSlide(nextIndex) {
      currentIndex = (nextIndex + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (slide, index) {
        slide.classList.toggle('active', index === currentIndex);
      });
    }

    function restartAutoPlay() {
      if (activityModalMedia._activityTimerId) {
        window.clearInterval(activityModalMedia._activityTimerId);
      }
      activityModalMedia._activityTimerId = window.setInterval(function () {
        showSlide(currentIndex + 1);
      }, 4600);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        showSlide(currentIndex - 1);
        restartAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        showSlide(currentIndex + 1);
        restartAutoPlay();
      });
    }

    showSlide(0);
    restartAutoPlay();
  }

  function openActivityModal(groupIndex, itemIndex) {
    if (!activityModal) return;
    var group = managedActivityGroupsData[groupIndex];
    var item = group && Array.isArray(group.items) ? group.items[itemIndex] : null;
    if (!item) return;
    var arabic = getArabicI18n();
    var miscUi = arabic && arabic.ui && arabic.ui.misc ? arabic.ui.misc : null;

    var images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
    if (!images.length) {
      images = ['images/logo-png.png'];
    }

    if (activityModalDate) {
      activityModalDate.textContent = item.dateLabel || group.title || (currentSiteLanguage === 'ar' && miscUi ? miscUi.activityLabel : 'Sector activity');
    }
    if (activityModalTitle) {
      activityModalTitle.textContent = item.title || (currentSiteLanguage === 'ar' && miscUi ? miscUi.activityLabel : 'Activity');
    }
    if (activityModalText) {
      activityModalText.textContent = item.summary || '';
    }
    if (activityModalMedia) {
      activityModalMedia.innerHTML = images.length > 1
        ? images.map(function (image, index) {
            return '<div class="content-modal-slide' + (index === 0 ? ' active' : '') + '">' +
              '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml((item.title || 'Activity') + ' image ' + (index + 1)) + '">' +
            '</div>';
          }).join('') +
          '<button class="content-modal-nav content-modal-prev" type="button" aria-label="Previous image"><i class="fas fa-chevron-left"></i></button>' +
          '<button class="content-modal-nav content-modal-next" type="button" aria-label="Next image"><i class="fas fa-chevron-right"></i></button>'
        : '<div class="content-modal-slide active"><img src="' + escapeHtml(images[0]) + '" alt="' + escapeHtml(item.title || 'Activity') + '"></div>';
    }

    activityModal.classList.remove('hidden');
    activityModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    initModalActivitySlider();
  }

  if (activityModalBackdrop) {
    activityModalBackdrop.addEventListener('click', closeActivityModal);
  }

  if (activityModalCloseBtn) {
    activityModalCloseBtn.addEventListener('click', closeActivityModal);
  }

  function applyTheme(theme) {
    body.classList.toggle('dark-mode', theme === 'dark');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      themeToggle.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  window.localStorage.setItem('must-theme', 'light');
  applyTheme('light');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var nextTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(nextTheme);
      window.localStorage.setItem('must-theme', nextTheme);
    });
  }

  var animatedElements = document.querySelectorAll('.fade-in-up');
  var viceDeanSection = document.getElementById('about-sector');
  if ('IntersectionObserver' in window && animatedElements.length) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target !== viceDeanSection) {
            obs.unobserve(entry.target);
          }
        } else if (entry.target === viceDeanSection) {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    animatedElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  if ('IntersectionObserver' in window && viceDeanSection) {
    var viceDeanObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        viceDeanSection.classList.toggle('dean-active', entry.isIntersecting);
      });
    }, { threshold: 0.28 });
    viceDeanObserver.observe(viceDeanSection);
  } else if (viceDeanSection) {
    viceDeanSection.classList.add('dean-active');
  }

  var galleryDotsContainer = document.querySelector('.gallery-dots');
  var galleryPrevBtn = document.querySelector('.gallery-prev');
  var galleryNextBtn = document.querySelector('.gallery-next');
  var currentGallerySlide = 0;
  var galleryTimer = null;
  var awardsTrack = document.querySelector('.awards-track');
  var awardsDotsContainer = document.querySelector('.awards-dots');
  var awardsPrevBtn = document.querySelector('.awards-prev');
  var awardsNextBtn = document.querySelector('.awards-next');
  var currentAwardSlide = 0;
  var awardsTimer = null;

  function initGallerySlider() {
    var gallerySlides = document.querySelectorAll('.gallery-slide');
    if (!gallerySlides.length) return;

    currentGallerySlide = 0;
    if (galleryDotsContainer) {
      galleryDotsContainer.innerHTML = '';
      gallerySlides.forEach(function (_, index) {
        var dot = document.createElement('div');
        dot.className = 'gallery-dot' + (index === 0 ? ' active' : '');
        dot.onclick = function () {
          goToGallerySlide(index);
          resetGalleryTimer();
        };
        galleryDotsContainer.appendChild(dot);
      });
    }

    function goToGallerySlide(index) {
      var galleryDots = galleryDotsContainer ? galleryDotsContainer.querySelectorAll('.gallery-dot') : [];
      if (!gallerySlides.length) return;
      if (index >= gallerySlides.length) index = 0;
      if (index < 0) index = gallerySlides.length - 1;
      gallerySlides[currentGallerySlide].classList.remove('active');
      if (galleryDots.length) {
        galleryDots[currentGallerySlide].classList.remove('active');
      }
      currentGallerySlide = index;
      gallerySlides[currentGallerySlide].classList.add('active');
      if (galleryDots.length) {
        galleryDots[currentGallerySlide].classList.add('active');
      }
    }

    function resetGalleryTimer() {
      window.clearInterval(galleryTimer);
      galleryTimer = window.setInterval(function () {
        goToGallerySlide(currentGallerySlide + 1);
      }, 7000);
    }

    resetGalleryTimer();
  }

  function initAwardsSlider() {
    var awardsSlides = document.querySelectorAll('.awards-slide');
    if (!awardsTrack || !awardsSlides.length || !awardsDotsContainer) return;

    currentAwardSlide = 0;
    awardsTrack.style.transform = 'translateX(0)';
    awardsDotsContainer.innerHTML = '';
    awardsSlides.forEach(function (_, index) {
      var dot = document.createElement('div');
      dot.className = 'award-dot' + (index === 0 ? ' active' : '');
      dot.onclick = function () {
        goToAwardSlide(index);
        resetAwardsTimer();
      };
      awardsDotsContainer.appendChild(dot);
    });

    function goToAwardSlide(index) {
      var awardsDots = awardsDotsContainer.querySelectorAll('.award-dot');
      if (!awardsSlides.length || !awardsDots.length) return;
      if (index >= awardsSlides.length) index = 0;
      if (index < 0) index = awardsSlides.length - 1;
      awardsDots[currentAwardSlide].classList.remove('active');
      currentAwardSlide = index;
      awardsTrack.style.transform = 'translateX(' + (currentAwardSlide * -100) + '%)';
      awardsDots[currentAwardSlide].classList.add('active');
    }

    function nextAwardSlide() {
      goToAwardSlide(currentAwardSlide + 1);
    }

    function previousAwardSlide() {
      goToAwardSlide(currentAwardSlide - 1);
    }

    function resetAwardsTimer() {
      window.clearInterval(awardsTimer);
      awardsTimer = window.setInterval(nextAwardSlide, 7000);
    }

    if (awardsPrevBtn) {
      awardsPrevBtn.onclick = function () {
        previousAwardSlide();
        resetAwardsTimer();
      };
    }

    if (awardsNextBtn) {
      awardsNextBtn.onclick = function () {
        nextAwardSlide();
        resetAwardsTimer();
      };
    }

    resetAwardsTimer();
  }

  initGallerySlider();
  initAwardsSlider();

  function showAuthFeedback(message, type) {
    if (!authFeedback) return;
    authFeedback.textContent = localizeRuntimeMessage(message);
    authFeedback.className = 'auth-feedback ' + (type || 'error');
    authFeedback.classList.remove('hidden');
    window.requestAnimationFrame(function () {
      if (authModalCard) {
        authModalCard.scrollTo({ top: 0, behavior: 'smooth' });
      }
      authFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function clearAuthFeedback() {
    if (!authFeedback) return;
    authFeedback.textContent = '';
    authFeedback.className = 'auth-feedback hidden';
  }

  function toggleAuthTab(tabName, options) {
    if (!loginTabBtn || !registerTabBtn || !loginAuthForm || !registerAuthForm) return;
    var preserveFeedback = Boolean(options && options.preserveFeedback);
    var loginActive = tabName === 'login';
    loginTabBtn.classList.toggle('active', loginActive);
    registerTabBtn.classList.toggle('active', !loginActive);
    loginAuthForm.classList.toggle('hidden', !loginActive);
    registerAuthForm.classList.toggle('hidden', loginActive);
    if (!preserveFeedback) {
      clearAuthFeedback();
    }
  }

  function openAuthModal(defaultTab) {
    if (!authModal) return;
    toggleAuthTab(defaultTab || 'login');
    authModal.classList.remove('hidden');
    authModal.setAttribute('aria-hidden', 'false');
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.add('hidden');
    authModal.setAttribute('aria-hidden', 'true');
    clearAuthFeedback();
  }

  function updateAuthUI(user) {
    currentUser = user || null;
    body.classList.toggle('user-logged-in', !!currentUser);
    if (!openAuthModalBtn || !authUserChip || !authUserName || !adminDashboardLink) return;

    if (!currentUser) {
      openAuthModalBtn.classList.remove('hidden');
      authUserChip.classList.add('hidden');
      adminDashboardLink.classList.add('hidden');
      if (adminMenuDashboardItem) {
        adminMenuDashboardItem.classList.add('hidden');
      }
      authUserName.textContent = 'Guest';
      return;
    }

    openAuthModalBtn.classList.add('hidden');
    authUserChip.classList.remove('hidden');
    authUserName.textContent = currentUser.name || currentUser.email || 'User';
    var isAdmin = currentUser.role === 'admin';
    adminDashboardLink.classList.toggle('hidden', !isAdmin);
    if (adminMenuDashboardItem) {
      adminMenuDashboardItem.classList.toggle('hidden', !isAdmin);
    }
  }

  function loadSession() {
    return fetch('/api/session', { cache: 'no-store' })
      .then(function (response) { return response.json(); })
      .then(function (data) {
        updateAuthUI(data && data.authenticated ? data.user : null);
      })
      .catch(function (error) {
        console.error('Could not load session', error);
        updateAuthUI(null);
      });
  }

  function apiRequest(url, options) {
    return fetch(url, options).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok || !data.ok) {
          throw new Error((data && data.error) || 'Request failed');
        }
        return data;
      });
    });
  }

  if (openAuthModalBtn) {
    openAuthModalBtn.addEventListener('click', function () {
      openAuthModal('login');
    });
  }

  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
  }

  if (authModalBackdrop) {
    authModalBackdrop.addEventListener('click', closeAuthModal);
  }

  if (loginTabBtn) {
    loginTabBtn.addEventListener('click', function () { toggleAuthTab('login'); });
  }

  if (registerTabBtn) {
    registerTabBtn.addEventListener('click', function () { toggleAuthTab('register'); });
  }

  if (loginAuthForm) {
    loginAuthForm.addEventListener('submit', function (event) {
      event.preventDefault();
      clearAuthFeedback();
      apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: document.getElementById('loginEmail').value.trim(),
          password: document.getElementById('loginPassword').value
        })
      }).then(function (data) {
        updateAuthUI(data.user);
        loginAuthForm.reset();
        closeAuthModal();
      }).catch(function (error) {
        showAuthFeedback(error.message, 'error');
      });
    });
  }

  if (registerAuthForm) {
    registerAuthForm.addEventListener('submit', function (event) {
      event.preventDefault();
      clearAuthFeedback();
      var registerEmail = document.getElementById('registerEmail').value.trim().toLowerCase();

      apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: document.getElementById('registerFirstName').value.trim(),
          lastName: document.getElementById('registerLastName').value.trim(),
          email: registerEmail,
          password: document.getElementById('registerPassword').value
        })
      }).then(function (data) {
        var successMessage = data.message + (data.activationPreviewUrl ? ' Activation preview: ' + data.activationPreviewUrl : '');
        registerAuthForm.reset();
        toggleAuthTab('login', { preserveFeedback: true });
        showAuthFeedback(successMessage, 'success');
      }).catch(function (error) {
        showAuthFeedback(error.message, 'error');
      });
    });
  }

  if (siteLogoutBtn) {
    siteLogoutBtn.addEventListener('click', function () {
      apiRequest('/api/auth/logout', { method: 'POST' })
        .then(function () {
          updateAuthUI(null);
        })
        .catch(function (error) {
          showAuthFeedback(error.message, 'error');
        });
    });
  }

  function showContactFeedback(message, type) {
    if (!contactFeedback) return;
    contactFeedback.textContent = localizeRuntimeMessage(message);
    contactFeedback.className = 'auth-feedback ' + (type || 'success');
    contactFeedback.classList.remove('hidden');
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      apiRequest('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('contactName').value.trim(),
          email: document.getElementById('contactEmail').value.trim(),
          phone: document.getElementById('contactPhone').value.trim(),
          message: document.getElementById('contactMessage').value.trim()
        })
      }).then(function (data) {
        contactForm.reset();
        var checkbox = document.getElementById('robot-check');
        if (checkbox) checkbox.checked = false;
        showContactFeedback(data.message, 'success');
      }).catch(function (error) {
        showContactFeedback(error.message, 'error');
      });
    });
  }

  function setTextContent(id, value) {
    var node = document.getElementById(id);
    if (!node || typeof value !== 'string') return;
    node.textContent = value;
  }

  function setImageSource(id, value) {
    var node = document.getElementById(id);
    if (!node || !value) return;
    node.setAttribute('src', value);
  }

  function setLinkContent(id, href, text) {
    var node = document.getElementById(id);
    if (!node) return;
    if (href) node.setAttribute('href', href);
    if (typeof text === 'string') node.textContent = text;
  }

  function setPlanDownloadLink(fileUrl) {
    var node = document.getElementById('planDownloadLink');
    if (!node) return;
    var cleanUrl = normalizeUrl(fileUrl || '');
    if (!cleanUrl || cleanUrl === '#') {
      node.removeAttribute('href');
      node.setAttribute('aria-disabled', 'true');
      node.classList.add('is-disabled');
      return;
    }
    node.setAttribute('href', cleanUrl);
    node.setAttribute('download', '');
    node.removeAttribute('aria-disabled');
    node.classList.remove('is-disabled');
  }

  function renderObjectiveItems(items) {
    var target = document.getElementById('objectivesList');
    if (!target || !Array.isArray(items) || !items.length) return;
    target.innerHTML = items.map(function (item) {
      return '<li><i class="fas fa-check"></i> <span>' + escapeHtml(item) + '</span></li>';
    }).join('');
  }

  function renderCommitteeItems(items) {
    var target = document.getElementById('committeeCards');
    if (!target || !Array.isArray(items) || !items.length) return;
    target.classList.add('committees-grid-rich');
    target.innerHTML = items.map(function (item, index) {
      var responsibilities = Array.isArray(item.responsibilities) ? item.responsibilities : [];
      var delay = index ? ' style="transition-delay: ' + (index * 0.08).toFixed(2) + 's;"' : '';
      return (
        '<article id="' + escapeHtml(item.id || ('committee-' + index)) + '" class="committee-box fade-in-up visible committee-box-rich"' + delay + '>' +
          '<div class="committee-header">' +
            '<i class="' + escapeHtml(item.icon || 'fas fa-users') + '"></i>' +
            '<h3 class="navy-title">' + escapeHtml(item.title || 'Committee') + '</h3>' +
          '</div>' +
          '<p class="committee-summary">' + escapeHtml(item.summary || '') + '</p>' +
          (responsibilities.length
            ? '<ul class="custom-list committee-responsibilities">' + responsibilities.map(function (responsibility) {
                return '<li><i class="fas fa-check"></i> <span>' + escapeHtml(responsibility) + '</span></li>';
              }).join('') + '</ul>'
            : '') +
        '</article>'
      );
    }).join('');
  }

  function renderProtocolItems(items) {
    var target = document.getElementById('protocolCards');
    if (!target || !Array.isArray(items) || !items.length) return;
    target.innerHTML = items.map(function (item, index) {
      var delay = index ? ' style="transition-delay: ' + (index * 0.08).toFixed(2) + 's;"' : '';
      var media = item.imageUrl
        ? '<div class="protocol-media"><img src="' + escapeHtml(item.imageUrl) + '" alt="' + escapeHtml(item.title || 'Protocol') + '"></div>'
        : '<div class="protocol-icon"><i class="fas fa-handshake"></i></div>';
      return (
        '<article id="' + escapeHtml(item.id || ('protocol-' + index)) + '" class="protocol-card fade-in-up visible protocol-card-rich"' + delay + '>' +
          media +
          '<div class="protocol-content">' +
            (item.partner ? '<span class="protocol-partner">' + escapeHtml(item.partner) + '</span>' : '') +
            '<h3 class="navy-title">' + escapeHtml(item.title || 'Protocol') + '</h3>' +
            '<p class="protocol-objective">' + escapeHtml(item.objective || '') + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderActivityGroups(groups) {
    var target = document.getElementById('activityGroups');
    if (!target || !Array.isArray(groups) || !groups.length) return;
    managedActivityGroupsData = groups;
    var arabic = getArabicI18n();
    var miscUi = arabic && arabic.ui && arabic.ui.misc ? arabic.ui.misc : null;
    var readMoreLabel = currentSiteLanguage === 'ar' && miscUi ? miscUi.readMore : 'Read more';
    target.innerHTML = groups.map(function (group, groupIndex) {
      var items = Array.isArray(group.items) ? group.items : [];
      var cards = items.map(function (item, itemIndex) {
        var images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
        var mainImage = images[0] || 'images/logo-png.png';
        var summary = String(item.summary || '').trim();
        var summaryIsLong = summary.length > 180;
        var previewText = summaryIsLong ? truncateText(summary, 180) : summary;
        var media = images.length > 1
          ? '<div class="activity-item-media activity-media-slider" data-activity-slider>' +
              images.map(function (image, imageIndex) {
                return '<div class="activity-media-slide' + (imageIndex === 0 ? ' active' : '') + '">' +
                  '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml((item.title || 'Activity') + ' image ' + (imageIndex + 1)) + '">' +
                '</div>';
              }).join('') +
              '<button class="activity-slider-btn activity-slider-prev" type="button" aria-label="Previous image"><i class="fas fa-chevron-left"></i></button>' +
              '<button class="activity-slider-btn activity-slider-next" type="button" aria-label="Next image"><i class="fas fa-chevron-right"></i></button>' +
              '<span class="activity-date-chip">' + escapeHtml(item.dateLabel || '') + '</span>' +
            '</div>'
          : '<div class="activity-item-media">' +
              '<img src="' + escapeHtml(mainImage) + '" alt="' + escapeHtml(item.title || 'Activity') + '">' +
              '<span class="activity-date-chip">' + escapeHtml(item.dateLabel || '') + '</span>' +
            '</div>';
        return (
          '<article class="activity-item-card" role="button" tabindex="0" data-activity-open="' + groupIndex + ':' + itemIndex + '" aria-label="Open activity details">' +
            media +
            '<div class="activity-item-body">' +
              '<h4 class="navy-title">' + escapeHtml(item.title || 'Activity') + '</h4>' +
              (previewText ? '<p class="' + (summaryIsLong ? 'is-truncated' : '') + '">' + escapeHtml(previewText) + '</p>' : '') +
              '<button class="activity-read-more" type="button" data-activity-readmore="' + groupIndex + ':' + itemIndex + '">' + escapeHtml(readMoreLabel) + '</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');
      var itemsLabel = currentSiteLanguage === 'ar' && miscUi
        ? (items.length + ' ' + (items.length === 1 ? miscUi.itemLabelSingular : miscUi.itemLabelPlural))
        : (items.length + ' item' + (items.length === 1 ? '' : 's'));
      return (
        '<section id="' + escapeHtml(group.id || ('activity-group-' + groupIndex)) + '" class="activity-group-block fade-in-up visible">' +
          '<div class="activity-group-header">' +
            '<div>' +
              '<h3 class="navy-title">' + escapeHtml(group.title || 'Activities') + '</h3>' +
              (group.intro ? '<p>' + escapeHtml(group.intro) + '</p>' : '') +
            '</div>' +
            '<span class="activity-count-pill">' + escapeHtml(itemsLabel) + '</span>' +
          '</div>' +
          '<div class="activity-items-grid">' + cards + '</div>' +
        '</section>'
      );
    }).join('');
    initActivityMediaSliders();
  }

  function initActivityMediaSliders() {
    var sliders = document.querySelectorAll('[data-activity-slider]');
    Array.prototype.forEach.call(sliders, function (slider) {
      var slides = slider.querySelectorAll('.activity-media-slide');
      if (!slides.length) return;
      var currentIndex = 0;
      var prevBtn = slider.querySelector('.activity-slider-prev');
      var nextBtn = slider.querySelector('.activity-slider-next');

      function showSlide(nextIndex) {
        currentIndex = (nextIndex + slides.length) % slides.length;
        Array.prototype.forEach.call(slides, function (slide, slideIndex) {
          slide.classList.toggle('active', slideIndex === currentIndex);
        });
      }

      function restartAutoPlay() {
        if (slider._activityTimerId) {
          window.clearInterval(slider._activityTimerId);
        }
        slider._activityTimerId = window.setInterval(function () {
          showSlide(currentIndex + 1);
        }, 4200);
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          showSlide(currentIndex - 1);
          restartAutoPlay();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          showSlide(currentIndex + 1);
          restartAutoPlay();
        });
      }

      slider.addEventListener('mouseenter', function () {
        if (slider._activityTimerId) {
          window.clearInterval(slider._activityTimerId);
        }
      });

      slider.addEventListener('mouseleave', function () {
        restartAutoPlay();
      });

      showSlide(0);
      restartAutoPlay();
    });
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-activity-readmore]');
    var cardTrigger = event.target.closest('[data-activity-open]');

    if (event.target.closest('.activity-slider-btn')) {
      return;
    }

    if (!trigger && !cardTrigger) return;
    var source = trigger || cardTrigger;
    var rawValue = String(source.getAttribute('data-activity-readmore') || source.getAttribute('data-activity-open') || '');
    var parts = rawValue.split(':');
    openActivityModal(Number(parts[0]), Number(parts[1]));
  });

  document.addEventListener('keydown', function (event) {
    var cardTrigger = event.target.closest('[data-activity-open]');
    if (!cardTrigger) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    var rawValue = String(cardTrigger.getAttribute('data-activity-open') || '');
    var parts = rawValue.split(':');
    openActivityModal(Number(parts[0]), Number(parts[1]));
  });

  function renderGalleryItems(items) {
    var target = document.getElementById('managedGallerySlides');
    if (!target || !Array.isArray(items) || !items.length) return;
    target.innerHTML = items.map(function (item, index) {
      var imgSrc = escapeHtml(item.imageUrl || 'images/photo-slider1.jpeg');
      var altText = escapeHtml(item.alt || ('Gallery ' + (index + 1)));
      return '<div class="gallery-slide' + (index === 0 ? ' active' : '') + '"><img src="' + imgSrc + '" alt="' + altText + '"></div>';
    }).join('');
    initGallerySlider();
  }

  function renderNotableAlumni(items) {
    var target = document.getElementById('managedAlumniCards');
    if (!target || !Array.isArray(items) || !items.length) return;
    target.innerHTML = items.map(function (item, index) {
      return (
        '<div class="alumni-card fade-in-up visible">' +
          '<img src="' + escapeHtml(item.imageUrl || 'images/must-logo.png') + '" alt="' + escapeHtml(item.name || 'Alumni') + '">' +
          '<h4 class="green-text-bold">' + escapeHtml(item.name || 'Alumni') + '</h4>' +
          '<p>' + escapeHtml(item.text || '') + '</p>' +
        '</div>'
      );
    }).join('');
  }

  function renderAwardItems(items) {
    var target = document.getElementById('managedAwardsSlides');
    if (!target || !Array.isArray(items) || !items.length) return;
    target.innerHTML = items.map(function (item) {
      return (
        '<div class="awards-slide">' +
          '<div class="award-slide-card">' +
            '<img src="' + escapeHtml(item.imageUrl || 'images/Awards.png') + '" alt="' + escapeHtml(item.title || 'Award') + '">' +
            '<div class="award-slide-content">' +
              '<h4 class="navy-title">' + escapeHtml(item.title || 'Award') + '</h4>' +
              '<p>' + escapeHtml(item.description1 || '') + '</p>' +
              (item.description2 ? '<p class="mt-20">' + escapeHtml(item.description2) + '</p>' : '') +
              '<span class="go-to-event mt-20 static-card-link">Static item</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');
    initAwardsSlider();
  }

  function applyManagedSections(sections) {
    if (!sections || typeof sections !== 'object') return;

    var planCard = document.querySelector('.plan-card');
    var activitiesCard = document.getElementById('sector-activities');
    var annualPlanSection = document.getElementById('annual-plan');
    if (annualPlanSection) {
      annualPlanSection.classList.add('visible');
    }
    if (planCard) {
      planCard.classList.add('visible');
    }
    if (activitiesCard) {
      activitiesCard.classList.add('visible');
    }

    setTextContent('heroTitleText', sections.heroTitle);
    setTextContent('briefTitleText', sections.briefTitle);
    setTextContent('briefParagraph1Text', sections.briefParagraph1);
    setTextContent('briefParagraph2Text', sections.briefParagraph2);
    setTextContent('viceDeanSectionTitleText', sections.viceDeanSectionTitle);
    setTextContent('viceDeanHeadingText', sections.viceDeanHeading);
    setTextContent('viceDeanParagraph1Text', sections.viceDeanParagraph1);
    setTextContent('viceDeanParagraph2Text', sections.viceDeanParagraph2);
    setTextContent('viceDeanParagraph3Text', sections.viceDeanParagraph3);
    setTextContent('viceDeanClosingText', sections.viceDeanClosing);
    setTextContent('viceDeanSignatureRoleText', sections.viceDeanSignatureRole);
    setTextContent('viceDeanSignatureNameText', sections.viceDeanSignatureName);
    setImageSource('viceDeanImage', sections.viceDeanImageUrl);
    setTextContent('visionCardTitleText', sections.visionCardTitle || "Sector's Vision");
    setTextContent('missionCardTitleText', sections.missionCardTitle || "Sector's Mission");
    setTextContent('objectivesCardTitleText', sections.objectivesCardTitle || "Sector's Objectives");
    setTextContent('visionText', sections.visionText);
    setTextContent('missionText', sections.missionText);
    setTextContent('objective1Text', sections.objective1);
    setTextContent('objective2Text', sections.objective2);
    setTextContent('objective3Text', sections.objective3);
    setTextContent('objective4Text', sections.objective4);
    renderObjectiveItems(sections.objectiveItems);
    setTextContent('planSectionTitleText', sections.planSectionTitle);
    setTextContent('planIntroText', sections.planIntro);
    setTextContent('activitiesSectionTitleText', sections.activitiesSectionTitle);
    setTextContent('activitiesIntroText', sections.activitiesIntro);
    setTextContent('planFileTitleText', sections.planFileTitle);
    setTextContent('planFileMetaText', sections.planFileMeta);
    setTextContent('planButtonText', sections.planButtonText);
    setPlanDownloadLink(sections.planFileUrl);
    setTextContent('activity1MonthText', sections.activity1Month);
    setTextContent('activity1DayText', sections.activity1Day);
    setTextContent('activity1TitleText', sections.activity1Title);
    setTextContent('activity1DescriptionText', sections.activity1Description);
    setTextContent('activity2MonthText', sections.activity2Month);
    setTextContent('activity2DayText', sections.activity2Day);
    setTextContent('activity2TitleText', sections.activity2Title);
    setTextContent('activity2DescriptionText', sections.activity2Description);
    setTextContent('activity3MonthText', sections.activity3Month);
    setTextContent('activity3DayText', sections.activity3Day);
    setTextContent('activity3TitleText', sections.activity3Title);
    setTextContent('activity3DescriptionText', sections.activity3Description);
    setTextContent('committeesTitleText', sections.committeesTitle);
    setTextContent('committeesIntroText', sections.committeesIntro);
    renderCommitteeItems(sections.committeeItems);
    setTextContent('alumniCommitteeTitleText', sections.alumniCommitteeTitle);
    setTextContent('alumniCommitteeDescriptionText', sections.alumniCommitteeDescription);
    setTextContent('crisisCommitteeTitleText', sections.crisisCommitteeTitle);
    setTextContent('crisisCommitteeDescriptionText', sections.crisisCommitteeDescription);
    setTextContent('communityCommitteeTitleText', sections.communityCommitteeTitle);
    setTextContent('communityCommitteeDescriptionText', sections.communityCommitteeDescription);
    setTextContent('protocolsTitleText', sections.protocolsTitle);
    setTextContent('protocolsIntroText', sections.protocolsIntro);
    renderProtocolItems(sections.protocolItems);
    setTextContent('adminProtocolDescriptionText', sections.adminProtocolDescription);
    setTextContent('adminProtocolItem1Text', sections.adminProtocolItem1);
    setTextContent('adminProtocolItem2Text', sections.adminProtocolItem2);
    setTextContent('adminProtocolItem3Text', sections.adminProtocolItem3);
    setTextContent('notificationProtocolDescriptionText', sections.notificationProtocolDescription);
    setTextContent('notificationProtocolItem1Text', sections.notificationProtocolItem1);
    setTextContent('notificationProtocolItem2Text', sections.notificationProtocolItem2);
    setTextContent('notificationProtocolItem3Text', sections.notificationProtocolItem3);
    renderActivityGroups(sections.activityGroups);
    setTextContent('servicesTitleText', sections.servicesTitle);
    setTextContent('alumniCardTitleText', sections.alumniCardTitle);
    setTextContent('alumniCardDescriptionText', sections.alumniCardDescription);
    setTextContent('alumniBenefitsTitleText', sections.alumniBenefitsTitle);
    setTextContent('alumniBenefit1Text', sections.alumniBenefit1);
    setTextContent('alumniBenefit2Text', sections.alumniBenefit2);
    setTextContent('alumniBenefit3Text', sections.alumniBenefit3);
    setTextContent('alumniBenefit4Text', sections.alumniBenefit4);
    setTextContent('alumniCardNoticeText', sections.alumniCardNotice);
    setTextContent('emailServiceTitleText', sections.emailServiceTitle);
    setTextContent('emailServiceDescriptionText', sections.emailServiceDescription);
    setTextContent('serviceFeaturesTitleText', sections.serviceFeaturesTitle);
    setTextContent('serviceFeature1Text', sections.serviceFeature1);
    setTextContent('serviceFeature2Text', sections.serviceFeature2);
    setTextContent('serviceFeature3Text', sections.serviceFeature3);
    setTextContent('galleryTitleText', sections.galleryTitle);
    renderGalleryItems(sections.galleryItems);
    setTextContent('notableAlumniEyebrowText', sections.notableAlumniEyebrow);
    setTextContent('notableAlumniTitleText', sections.notableAlumniTitle);
    renderNotableAlumni(sections.notableAlumniItems);
    setTextContent('awardsTitleText', sections.awardsTitle);
    setTextContent('awardsSubtitleText', sections.awardsSubtitle);
    renderAwardItems(sections.awardItems);
    setTextContent('eventsSectionTitleText', sections.eventsSectionTitle);
    setTextContent('newsSectionTitleText', sections.newsSectionTitle);
    setTextContent('contactTitleText', sections.contactTitle);
    var contactSubtitle = sections.contactSubtitle;
    if (!contactSubtitle || /contact us by email/i.test(contactSubtitle)) {
      contactSubtitle = 'Send your message directly to the sector team.';
    }
    setTextContent('contactSubtitleText', contactSubtitle);
    setTextContent('contactFormTitleText', sections.contactFormTitle);
    setLinkContent('eventsCtaLink', sections.eventsCtaUrl, sections.eventsCtaText);
    setLinkContent('newsCtaLink', sections.newsCtaUrl, sections.newsCtaText);
    setTextContent('footerPhoneText', sections.footerPhone);
    setTextContent('footerEmailText', sections.footerEmail);
    setTextContent('footerAddressText', sections.footerAddress);
    setTextContent('footerCopyrightText', sections.footerCopyright);
  }

  function loadManagedContent() {
    return apiRequest('/api/content/public', { method: 'GET' })
      .then(function (data) {
        managedPublicContent.sections = data.sections || {};
        managedPublicContent.news = Array.isArray(data.news) ? data.news : [];
        managedPublicContent.events = Array.isArray(data.events) ? data.events : [];
        renderCurrentLanguageView();
      })
      .catch(function (error) {
        console.error('Could not load managed content', error);
        managedPublicContent.news = parsePreferredManagedJson('official-managed-news-data', 'managed-news-data');
        managedPublicContent.events = parsePreferredManagedJson('official-managed-events-data', 'managed-events-data');
        renderCurrentLanguageView();
      });
  }

  function renderNews(items) {
    var target = document.getElementById('managedNewsCards');
    if (!target) return;
    var arabic = getArabicI18n();
    var miscUi = arabic && arabic.ui && arabic.ui.misc ? arabic.ui.misc : null;

    target.innerHTML = items.map(function (item) {
      var imgSrc = item.imageUrl ? escapeHtml(item.imageUrl) : 'images/logo-png.png';
      var linkMarkup = localDetailLinkMarkup('news', item, 'news-link', item.linkText || (currentSiteLanguage === 'ar' && miscUi ? miscUi.readMore : 'Read more'));

      return (
        '<div class="news-card fade-in-up visible">' +
          '<img src="' + imgSrc + '" alt="News" style="width: 100%; height: 250px; object-fit: cover; object-position: center; display: block; margin: 0 auto;">' +
          '<div class="news-meta" style="padding: 20px 20px 0;">' +
            '<span><i class="far fa-calendar"></i> ' + escapeHtml(item.badge) + '</span>' +
          '</div>' +
          '<div style="padding: 0 20px 20px;">' +
            '<h4 class="navy-title" style="margin-bottom: 15px;">' + escapeHtml(item.title) + '</h4>' +
            linkMarkup +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderEvents(items) {
    var target = document.getElementById('managedEventsCards');
    if (!target) return;
    var arabic = getArabicI18n();
    var miscUi = arabic && arabic.ui && arabic.ui.misc ? arabic.ui.misc : null;

    target.innerHTML = items.map(function (item) {
      var imgSrc = item.imageUrl ? escapeHtml(item.imageUrl) : 'images/logo-png.png';
      var linkMarkup = localDetailLinkMarkup('event', item, 'event-link', item.linkText || (currentSiteLanguage === 'ar' && miscUi ? miscUi.readMore : 'Read more'));
      var metaPieces = [];
      if (item.location) {
        metaPieces.push('<span class="event-meta-item"><i class="fas fa-location-dot"></i><span>' + escapeHtml(item.location) + '</span></span>');
      }
      if (item.timeText) {
        metaPieces.push('<span class="event-meta-item"><i class="far fa-clock"></i><span>' + escapeHtml(item.timeText) + '</span></span>');
      }

      return (
        '<div class="event-card fade-in-up visible">' +
          '<div class="img-wrapper">' +
            '<img src="' + imgSrc + '" alt="Event" style="width: 100%; height: 250px; object-fit: cover; object-position: center; display: block; margin: 0 auto;">' +
            '<div class="date-box">' +
              '<span class="day">' + escapeHtml(item.day) + '</span>' +
              '<span class="month">' + escapeHtml(item.monthYear) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="event-content event-content-rich">' +
            (metaPieces.length ? '<div class="event-meta-row">' + metaPieces.join('') + '</div>' : '') +
            '<h4 class="navy-title">' + escapeHtml(item.title) + '</h4>' +
            '<p class="event-summary-text">' + escapeHtml(item.summary) + '</p>' +
            linkMarkup +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  loadManagedContent();
  loadSession();
});
