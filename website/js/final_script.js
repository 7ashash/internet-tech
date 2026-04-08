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
  var authUserChip = document.getElementById('authUserChip');
  var authUserName = document.getElementById('authUserName');
  var adminDashboardLink = document.getElementById('adminDashboardLink');
  var adminMenuDashboardItem = document.getElementById('adminMenuDashboardItem');
  var siteLogoutBtn = document.getElementById('siteLogoutBtn');
  var contactForm = document.getElementById('contactForm');
  var contactFeedback = document.getElementById('contactFeedback');
  var heroQuickDropdowns = document.querySelectorAll('.hero-quick-dropdown');
  var currentUser = null;

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

  if (heroQuickDropdowns.length) {
    heroQuickDropdowns.forEach(function (dropdown) {
      dropdown.addEventListener('toggle', function () {
        if (!dropdown.open) return;
        heroQuickDropdowns.forEach(function (otherDropdown) {
          if (otherDropdown !== dropdown) {
            otherDropdown.open = false;
          }
        });
      });
    });

    document.addEventListener('click', function (event) {
      heroQuickDropdowns.forEach(function (dropdown) {
        if (!dropdown.contains(event.target)) {
          dropdown.open = false;
        }
      });
    });

    document.querySelectorAll('.hero-submenu a').forEach(function (link) {
      link.addEventListener('click', function () {
        heroQuickDropdowns.forEach(function (dropdown) {
          dropdown.open = false;
        });
      });
    });
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
  if ('IntersectionObserver' in window && animatedElements.length) {
    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
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
    authFeedback.textContent = message;
    authFeedback.className = 'auth-feedback ' + (type || 'error');
    authFeedback.classList.remove('hidden');
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
          email: document.getElementById('loginEmail').value.trim(),
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
      var universityId = document.getElementById('registerUniversityId').value.trim();
      var registerEmail = document.getElementById('registerEmail').value.trim().toLowerCase();
      var expectedEmail = universityId + '@must.edu.eg';

      if (registerEmail !== expectedEmail) {
        showAuthFeedback('The university email must exactly match your University ID, for example: ' + expectedEmail, 'error');
        return;
      }

      apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('registerName').value.trim(),
          universityId: universityId,
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
    contactFeedback.textContent = message;
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
    target.innerHTML = groups.map(function (group, groupIndex) {
      var items = Array.isArray(group.items) ? group.items : [];
      var cards = items.map(function (item) {
        var images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
        var mainImage = images[0] || 'images/logo-png.png';
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
          '<article class="activity-item-card">' +
            media +
            '<div class="activity-item-body">' +
              '<h4 class="navy-title">' + escapeHtml(item.title || 'Activity') + '</h4>' +
              (item.summary ? '<p>' + escapeHtml(item.summary) + '</p>' : '') +
            '</div>' +
          '</article>'
        );
      }).join('');
      return (
        '<section id="' + escapeHtml(group.id || ('activity-group-' + groupIndex)) + '" class="activity-group-block fade-in-up visible">' +
          '<div class="activity-group-header">' +
            '<div>' +
              '<h3 class="navy-title">' + escapeHtml(group.title || 'Activities') + '</h3>' +
              (group.intro ? '<p>' + escapeHtml(group.intro) + '</p>' : '') +
            '</div>' +
            '<span class="activity-count-pill">' + items.length + ' item' + (items.length === 1 ? '' : 's') + '</span>' +
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
    setTextContent('contactSubtitleText', sections.contactSubtitle);
    setTextContent('contactFormTitleText', sections.contactFormTitle);
    if (sections.contactEmail) {
      setLinkContent('contactEmailLink', 'mailto:' + sections.contactEmail, sections.contactEmail);
    }
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
        applyManagedSections(data.sections);
        renderNews(Array.isArray(data.news) ? data.news : []);
        renderEvents(Array.isArray(data.events) ? data.events : []);
      })
      .catch(function (error) {
        console.error('Could not load managed content', error);
        renderNews(parsePreferredManagedJson('official-managed-news-data', 'managed-news-data'));
        renderEvents(parsePreferredManagedJson('official-managed-events-data', 'managed-events-data'));
      });
  }

  function renderNews(items) {
    var target = document.getElementById('managedNewsCards');
    if (!target) return;

    target.innerHTML = items.map(function (item) {
      var imgSrc = item.imageUrl ? escapeHtml(item.imageUrl) : 'images/logo-png.png';
      var linkMarkup = safeLinkMarkup(item.linkUrl, item.linkText || 'Read more', 'news-link');

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

    target.innerHTML = items.map(function (item) {
      var imgSrc = item.imageUrl ? escapeHtml(item.imageUrl) : 'images/logo-png.png';
      var linkMarkup = safeLinkMarkup(item.linkUrl, item.linkText || 'Register Now', 'event-link');

      return (
        '<div class="event-card fade-in-up visible">' +
          '<div class="img-wrapper">' +
            '<img src="' + imgSrc + '" alt="Event" style="width: 100%; height: 250px; object-fit: cover; object-position: center; display: block; margin: 0 auto;">' +
            '<div class="date-box">' +
              '<span class="day">' + escapeHtml(item.day) + '</span>' +
              '<span class="month" style="font-size:0.9rem;">' + escapeHtml(item.monthYear) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="event-content" style="padding: 40px 20px 20px;">' +
            '<h4 class="navy-title">' + escapeHtml(item.title) + '</h4>' +
            '<p style="font-size: 0.9rem; color: #555; margin-top: 10px; margin-bottom: 15px;">' + escapeHtml(item.summary) + '</p>' +
            linkMarkup +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  loadManagedContent();
  loadSession();
});
