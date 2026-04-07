'use strict';

(function () {
  const AUTH_API = '/api/auth/login';
  const LOGOUT_API = '/api/auth/logout';
  const SESSION_API = '/api/session';
  const CONTENT_API = '/api/admin/content';
  const USERS_API = '/api/admin/users';
  const MESSAGES_API = '/api/admin/messages';
  const ASSET_UPLOAD_API = '/api/admin/assets';
  const LOCAL_ACTIVATION_BASE_URL = 'http://127.0.0.1:3000';
  const ONLINE_ACTIVATION_BASE_URL = 'https://internet-tech-production.up.railway.app';

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

  const authScreen = document.getElementById('authScreen');
  const dashboardLayout = document.getElementById('dashboardLayout');
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const authError = document.getElementById('authError');
  const logoutBtn = document.getElementById('logoutBtn');
  const publishBtn = document.getElementById('publishBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const openWebsiteBtn = document.getElementById('openWebsiteBtn');
  const saveState = document.getElementById('saveState');
  const connectionBadge = document.getElementById('connectionBadge');
  const reloadNewsBtn = document.getElementById('reloadNewsBtn');
  const reloadEventsBtn = document.getElementById('reloadEventsBtn');
  const usersList = document.getElementById('usersList');
  const messagesList = document.getElementById('messagesList');

  const newsForm = document.getElementById('newsCardForm');
  const newsEditingIdInput = document.getElementById('newsCardEditingIndex');
  const newsBadgeInput = document.getElementById('newsCardBadge');
  const newsTitleInput = document.getElementById('newsCardTitle');
  const newsImageInput = document.getElementById('newsCardImageUrl');
  const newsLinkTextInput = document.getElementById('newsCardLinkText');
  const newsLinkUrlInput = document.getElementById('newsCardLinkUrl');
  const newsSubmitBtn = document.getElementById('newsCardSubmitBtn');
  const newsCancelEditBtn = document.getElementById('newsCardCancelEditBtn');
  const newsClearBtn = document.getElementById('newsCardClearBtn');
  const newsUploadBtn = document.getElementById('newsCardUploadBtn');
  const newsImagePreview = document.getElementById('newsCardImagePreview');
  const newsList = document.getElementById('newsCardsManagerList');

  const eventForm = document.getElementById('eventCardForm');
  const eventEditingIdInput = document.getElementById('eventCardEditingIndex');
  const eventDayInput = document.getElementById('eventCardDay');
  const eventMonthYearInput = document.getElementById('eventCardMonthYear');
  const eventTitleInput = document.getElementById('eventCardTitle');
  const eventImageInput = document.getElementById('eventCardImageUrl');
  const eventSummaryInput = document.getElementById('eventCardSummary');
  const eventLinkTextInput = document.getElementById('eventCardLinkText');
  const eventLinkUrlInput = document.getElementById('eventCardLinkUrl');
  const eventSubmitBtn = document.getElementById('eventCardSubmitBtn');
  const eventCancelEditBtn = document.getElementById('eventCardCancelEditBtn');
  const eventClearBtn = document.getElementById('eventCardClearBtn');
  const eventUploadBtn = document.getElementById('eventCardUploadBtn');
  const eventImagePreview = document.getElementById('eventCardImagePreview');
  const eventsList = document.getElementById('eventsCardsManagerList');

  const siteContentForm = document.getElementById('siteContentForm');
  const resetSiteContentBtn = document.getElementById('resetSiteContentBtn');
  const viceDeanUploadBtn = document.getElementById('viceDeanUploadBtn');
  const viceDeanImagePreview = document.getElementById('viceDeanImagePreview');
  const viceDeanImageInput = document.getElementById('contentViceDeanImageUrl');
  const galleryForm = document.getElementById('galleryForm');
  const galleryEditingIdInput = document.getElementById('galleryEditingId');
  const galleryImageInput = document.getElementById('galleryImageUrl');
  const galleryAltInput = document.getElementById('galleryAlt');
  const gallerySubmitBtn = document.getElementById('gallerySubmitBtn');
  const galleryCancelEditBtn = document.getElementById('galleryCancelEditBtn');
  const galleryUploadBtn = document.getElementById('galleryUploadBtn');
  const galleryImagePreview = document.getElementById('galleryImagePreview');
  const galleryList = document.getElementById('galleryList');
  const alumniForm = document.getElementById('alumniForm');
  const alumniEditingIdInput = document.getElementById('alumniEditingId');
  const alumniNameInput = document.getElementById('alumniName');
  const alumniImageInput = document.getElementById('alumniImageUrl');
  const alumniTextInput = document.getElementById('alumniText');
  const alumniSubmitBtn = document.getElementById('alumniSubmitBtn');
  const alumniCancelEditBtn = document.getElementById('alumniCancelEditBtn');
  const alumniUploadBtn = document.getElementById('alumniUploadBtn');
  const alumniImagePreview = document.getElementById('alumniImagePreview');
  const alumniList = document.getElementById('alumniList');
  const awardForm = document.getElementById('awardForm');
  const awardEditingIdInput = document.getElementById('awardEditingId');
  const awardTitleInput = document.getElementById('awardTitle');
  const awardImageInput = document.getElementById('awardImageUrl');
  const awardDescription1Input = document.getElementById('awardDescription1');
  const awardDescription2Input = document.getElementById('awardDescription2');
  const awardSubmitBtn = document.getElementById('awardSubmitBtn');
  const awardCancelEditBtn = document.getElementById('awardCancelEditBtn');
  const awardUploadBtn = document.getElementById('awardUploadBtn');
  const awardImagePreview = document.getElementById('awardImagePreview');
  const awardList = document.getElementById('awardList');

  const state = {
    news: [],
    events: [],
    users: [],
    messages: [],
    sections: { ...DEFAULT_SITE_CONTENT },
    dirty: 0,
    connected: false,
    newsDraftDirty: false,
    eventDraftDirty: false
  };

  function showDashboard() {
    authScreen.classList.add('hidden');
    dashboardLayout.style.display = 'block';
    authError.style.display = 'none';
    emailInput.value = '';
    passwordInput.value = '';
    loadAll();
  }

  function showLogin() {
    authScreen.classList.remove('hidden');
    dashboardLayout.style.display = 'none';
  }

  function setSaveState(type, text) {
    saveState.className = 'status-pill ' + (type === 'good' ? 'good' : 'warn');
    saveState.innerHTML = '<i class="bi ' + (type === 'good' ? 'bi-check-circle-fill' : 'bi-hourglass-split') + '"></i> ' + text;
  }

  function setConnection(ok) {
    state.connected = ok;
    connectionBadge.className = 'status-pill ' + (ok ? 'good' : 'warn');
    connectionBadge.innerHTML = ok ? '<i class="bi bi-wifi"></i> Connected' : '<i class="bi bi-wifi-off"></i> Offline';
  }

  function markDirty() {
    state.dirty += 1;
    document.getElementById('dirtyCount').textContent = String(state.dirty);
    setSaveState('warn', 'Unsaved content form changes');
  }

  function resetDirty() {
    state.dirty = 0;
    document.getElementById('dirtyCount').textContent = '0';
    setSaveState('good', 'Saved to database');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function apiRequest(url, options) {
    return fetch(url, options).then(async function (response) {
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    });
  }

  function normalizeSections(sections) {
    return Object.assign({}, DEFAULT_SITE_CONTENT, sections && typeof sections === 'object' ? sections : {});
  }

  function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.value = value || '';
    }
  }

  function resolveAssetUrl(url) {
    if (!url) return '';
    if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    return '/website/' + String(url).replace(/^\/+/, '');
  }

  function updateImagePreview(container, url) {
    if (!container) return;
    if (!url) {
      container.textContent = 'No image selected';
      return;
    }
    container.innerHTML = '<img src="' + escapeHtml(resolveAssetUrl(url)) + '" alt="Image preview">';
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('Could not read the image file')); };
      reader.readAsDataURL(file);
    });
  }

  function uploadImage(file) {
    return fileToDataUrl(file).then(function (dataUrl) {
      return apiRequest(ASSET_UPLOAD_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, dataUrl: dataUrl })
      });
    });
  }

  function bindUploadButton(button, targetInput, previewNode) {
    if (!button || !targetInput) return;
    button.addEventListener('click', function () {
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.addEventListener('change', function () {
        const file = picker.files && picker.files[0];
        if (!file) return;
        const originalLabel = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Uploading...';
        uploadImage(file)
          .then(function (data) {
            targetInput.value = data.imageUrl || '';
            updateImagePreview(previewNode, targetInput.value);
            setSaveState('good', 'Image uploaded');
          })
          .catch(function (error) {
            alert(error.message);
          })
          .finally(function () {
            button.disabled = false;
            button.innerHTML = originalLabel;
          });
      });
      picker.click();
    });
  }

  function bindPreviewOnInput(input, previewNode) {
    if (!input || !previewNode) return;
    input.addEventListener('input', function () {
      updateImagePreview(previewNode, input.value.trim());
    });
  }

  function fillSiteContentForm() {
    const sections = normalizeSections(state.sections);
    Object.keys(sections).forEach(function (key) {
      const inputId = 'content' + key.charAt(0).toUpperCase() + key.slice(1);
      const value = sections[key];
      if (Array.isArray(value)) {
        setInputValue(inputId, JSON.stringify(value, null, 2));
      } else {
        setInputValue(inputId, value);
      }
    });
    updateImagePreview(viceDeanImagePreview, sections.viceDeanImageUrl);
  }

  function parseJsonField(id, fallbackValue) {
    const rawValue = getInputValue(id);
    if (!rawValue) return fallbackValue;
    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed : fallbackValue;
    } catch (error) {
      alert('Invalid JSON in ' + id + '. Please check the format.');
      throw error;
    }
  }

  function readSiteContentForm() {
    return normalizeSections({
      heroTitle: getInputValue('contentHeroTitle'),
      briefTitle: getInputValue('contentBriefTitle'),
      briefParagraph1: getInputValue('contentBriefParagraph1'),
      briefParagraph2: getInputValue('contentBriefParagraph2'),
      viceDeanSectionTitle: getInputValue('contentViceDeanSectionTitle'),
      viceDeanHeading: getInputValue('contentViceDeanHeading'),
      viceDeanParagraph1: getInputValue('contentViceDeanParagraph1'),
      viceDeanParagraph2: getInputValue('contentViceDeanParagraph2'),
      viceDeanParagraph3: getInputValue('contentViceDeanParagraph3'),
      viceDeanClosing: getInputValue('contentViceDeanClosing'),
      viceDeanSignatureRole: getInputValue('contentViceDeanSignatureRole'),
      viceDeanSignatureName: getInputValue('contentViceDeanSignatureName'),
      viceDeanImageUrl: getInputValue('contentViceDeanImageUrl'),
      visionText: getInputValue('contentVisionText'),
      missionText: getInputValue('contentMissionText'),
      objective1: getInputValue('contentObjective1'),
      objective2: getInputValue('contentObjective2'),
      objective3: getInputValue('contentObjective3'),
      objective4: getInputValue('contentObjective4'),
      planSectionTitle: getInputValue('contentPlanSectionTitle'),
      planIntro: getInputValue('contentPlanIntro'),
      activitiesSectionTitle: getInputValue('contentActivitiesSectionTitle'),
      planFileTitle: getInputValue('contentPlanFileTitle'),
      planFileMeta: getInputValue('contentPlanFileMeta'),
      planButtonText: getInputValue('contentPlanButtonText'),
      activity1Month: getInputValue('contentActivity1Month'),
      activity1Day: getInputValue('contentActivity1Day'),
      activity1Title: getInputValue('contentActivity1Title'),
      activity1Description: getInputValue('contentActivity1Description'),
      activity2Month: getInputValue('contentActivity2Month'),
      activity2Day: getInputValue('contentActivity2Day'),
      activity2Title: getInputValue('contentActivity2Title'),
      activity2Description: getInputValue('contentActivity2Description'),
      activity3Month: getInputValue('contentActivity3Month'),
      activity3Day: getInputValue('contentActivity3Day'),
      activity3Title: getInputValue('contentActivity3Title'),
      activity3Description: getInputValue('contentActivity3Description'),
      committeesTitle: getInputValue('contentCommitteesTitle'),
      committeesIntro: getInputValue('contentCommitteesIntro'),
      alumniCommitteeTitle: getInputValue('contentAlumniCommitteeTitle'),
      alumniCommitteeDescription: getInputValue('contentAlumniCommitteeDescription'),
      crisisCommitteeTitle: getInputValue('contentCrisisCommitteeTitle'),
      crisisCommitteeDescription: getInputValue('contentCrisisCommitteeDescription'),
      communityCommitteeTitle: getInputValue('contentCommunityCommitteeTitle'),
      communityCommitteeDescription: getInputValue('contentCommunityCommitteeDescription'),
      protocolsTitle: getInputValue('contentProtocolsTitle'),
      protocolsIntro: getInputValue('contentProtocolsIntro'),
      adminProtocolDescription: getInputValue('contentAdminProtocolDescription'),
      adminProtocolItem1: getInputValue('contentAdminProtocolItem1'),
      adminProtocolItem2: getInputValue('contentAdminProtocolItem2'),
      adminProtocolItem3: getInputValue('contentAdminProtocolItem3'),
      notificationProtocolDescription: getInputValue('contentNotificationProtocolDescription'),
      notificationProtocolItem1: getInputValue('contentNotificationProtocolItem1'),
      notificationProtocolItem2: getInputValue('contentNotificationProtocolItem2'),
      notificationProtocolItem3: getInputValue('contentNotificationProtocolItem3'),
      servicesTitle: getInputValue('contentServicesTitle'),
      alumniCardTitle: getInputValue('contentAlumniCardTitle'),
      alumniCardDescription: getInputValue('contentAlumniCardDescription'),
      alumniBenefitsTitle: getInputValue('contentAlumniBenefitsTitle'),
      alumniBenefit1: getInputValue('contentAlumniBenefit1'),
      alumniBenefit2: getInputValue('contentAlumniBenefit2'),
      alumniBenefit3: getInputValue('contentAlumniBenefit3'),
      alumniBenefit4: getInputValue('contentAlumniBenefit4'),
      alumniCardNotice: getInputValue('contentAlumniCardNotice'),
      emailServiceTitle: getInputValue('contentEmailServiceTitle'),
      emailServiceDescription: getInputValue('contentEmailServiceDescription'),
      serviceFeaturesTitle: getInputValue('contentServiceFeaturesTitle'),
      serviceFeature1: getInputValue('contentServiceFeature1'),
      serviceFeature2: getInputValue('contentServiceFeature2'),
      serviceFeature3: getInputValue('contentServiceFeature3'),
      galleryTitle: getInputValue('contentGalleryTitle'),
      galleryItems: parseJsonField('contentGalleryItems', DEFAULT_SITE_CONTENT.galleryItems),
      notableAlumniEyebrow: getInputValue('contentNotableAlumniEyebrow'),
      notableAlumniTitle: getInputValue('contentNotableAlumniTitle'),
      notableAlumniItems: parseJsonField('contentNotableAlumniItems', DEFAULT_SITE_CONTENT.notableAlumniItems),
      awardsTitle: getInputValue('contentAwardsTitle'),
      awardsSubtitle: getInputValue('contentAwardsSubtitle'),
      awardItems: parseJsonField('contentAwardItems', DEFAULT_SITE_CONTENT.awardItems),
      eventsSectionTitle: getInputValue('contentEventsSectionTitle'),
      newsSectionTitle: getInputValue('contentNewsSectionTitle'),
      contactTitle: getInputValue('contentContactTitle'),
      contactSubtitle: getInputValue('contentContactSubtitle'),
      contactEmail: getInputValue('contentContactEmail'),
      contactFormTitle: getInputValue('contentContactFormTitle'),
      eventsCtaText: getInputValue('contentEventsCtaText'),
      eventsCtaUrl: getInputValue('contentEventsCtaUrl'),
      newsCtaText: getInputValue('contentNewsCtaText'),
      newsCtaUrl: getInputValue('contentNewsCtaUrl'),
      footerPhone: getInputValue('contentFooterPhone'),
      footerEmail: getInputValue('contentFooterEmail'),
      footerAddress: getInputValue('contentFooterAddress'),
      footerCopyright: getInputValue('contentFooterCopyright')
    });
  }

  function resetNewsFormState() {
    state.newsDraftDirty = false;
    newsEditingIdInput.value = '';
    newsBadgeInput.value = '';
    newsTitleInput.value = '';
    newsImageInput.value = '';
    newsLinkTextInput.value = 'Read more';
    newsLinkUrlInput.value = '#';
    newsSubmitBtn.textContent = 'Add news item';
    newsCancelEditBtn.hidden = true;
    updateImagePreview(newsImagePreview, '');
  }

  function resetEventFormState() {
    state.eventDraftDirty = false;
    eventEditingIdInput.value = '';
    eventDayInput.value = '';
    eventMonthYearInput.value = '';
    eventTitleInput.value = '';
    eventImageInput.value = '';
    eventSummaryInput.value = '';
    eventLinkTextInput.value = 'Register Now';
    eventLinkUrlInput.value = '#';
    eventSubmitBtn.textContent = 'Add event';
    eventCancelEditBtn.hidden = true;
    updateImagePreview(eventImagePreview, '');
  }

  function resetGalleryFormState() {
    galleryEditingIdInput.value = '';
    galleryForm.reset();
    gallerySubmitBtn.textContent = 'Add memory slide';
    galleryCancelEditBtn.hidden = true;
    updateImagePreview(galleryImagePreview, '');
  }

  function resetAlumniFormState() {
    alumniEditingIdInput.value = '';
    alumniForm.reset();
    alumniSubmitBtn.textContent = 'Add alumni card';
    alumniCancelEditBtn.hidden = true;
    updateImagePreview(alumniImagePreview, '');
  }

  function resetAwardFormState() {
    awardEditingIdInput.value = '';
    awardForm.reset();
    awardSubmitBtn.textContent = 'Add award slide';
    awardCancelEditBtn.hidden = true;
    updateImagePreview(awardImagePreview, '');
  }

  function populateNewsForm(item, index) {
    newsEditingIdInput.value = String(index);
    newsBadgeInput.value = item.badge || '';
    newsTitleInput.value = item.title || '';
    newsImageInput.value = item.imageUrl || '';
    newsLinkTextInput.value = item.linkText || 'Read more';
    newsLinkUrlInput.value = item.linkUrl || '#';
    newsSubmitBtn.textContent = 'Update news item';
    newsCancelEditBtn.hidden = false;
    updateImagePreview(newsImagePreview, item.imageUrl || '');
    document.getElementById('newsManager').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function populateEventForm(item, index) {
    eventEditingIdInput.value = String(index);
    eventDayInput.value = item.day || '';
    eventMonthYearInput.value = item.monthYear || '';
    eventTitleInput.value = item.title || '';
    eventImageInput.value = item.imageUrl || '';
    eventSummaryInput.value = item.summary || '';
    eventLinkTextInput.value = item.linkText || 'Register Now';
    eventLinkUrlInput.value = item.linkUrl || '#';
    eventSubmitBtn.textContent = 'Update event';
    eventCancelEditBtn.hidden = false;
    updateImagePreview(eventImagePreview, item.imageUrl || '');
    document.getElementById('eventsManager').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function populateGalleryForm(item, index) {
    galleryEditingIdInput.value = String(index);
    galleryImageInput.value = item.imageUrl || '';
    galleryAltInput.value = item.alt || '';
    gallerySubmitBtn.textContent = 'Update memory slide';
    galleryCancelEditBtn.hidden = false;
    updateImagePreview(galleryImagePreview, item.imageUrl || '');
    document.getElementById('galleryManager').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function populateAlumniForm(item, index) {
    alumniEditingIdInput.value = String(index);
    alumniNameInput.value = item.name || '';
    alumniImageInput.value = item.imageUrl || '';
    alumniTextInput.value = item.text || '';
    alumniSubmitBtn.textContent = 'Update alumni card';
    alumniCancelEditBtn.hidden = false;
    updateImagePreview(alumniImagePreview, item.imageUrl || '');
    document.getElementById('alumniManager').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function populateAwardForm(item, index) {
    awardEditingIdInput.value = String(index);
    awardTitleInput.value = item.title || '';
    awardImageInput.value = item.imageUrl || '';
    awardDescription1Input.value = item.description1 || '';
    awardDescription2Input.value = item.description2 || '';
    awardSubmitBtn.textContent = 'Update award slide';
    awardCancelEditBtn.hidden = false;
    updateImagePreview(awardImagePreview, item.imageUrl || '');
    document.getElementById('awardsManager').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderNews() {
    document.getElementById('newsCount').textContent = String(state.news.length);
    document.getElementById('newsMiniCount').textContent = String(state.news.length);
    if (!state.news.length) {
      newsList.innerHTML = '<div class="empty-state"><i class="bi bi-newspaper fs-3 d-block mb-2"></i>No news items yet.</div>';
      return;
    }
    newsList.innerHTML = state.news.map(function (item, index) {
      const imageMarkup = item.imageUrl
        ? '<img class="admin-thumb" src="' + escapeHtml(resolveAssetUrl(item.imageUrl)) + '" alt="News preview">'
        : '<div class="admin-thumb placeholder">No image</div>';
      return (
        '<article class="content-card">' +
          imageMarkup +
          '<div class="d-flex gap-2 flex-wrap mb-2"><span class="status-pill good">' + escapeHtml(item.badge) + '</span></div>' +
          '<h4 class="h6 mb-2">' + escapeHtml(item.title) + '</h4>' +
          '<div class="summary">' +
            '<div><strong>Link text:</strong> ' + escapeHtml(item.linkText || 'Read more') + '</div>' +
            '<div><strong>Link URL:</strong> ' + escapeHtml(item.linkUrl || '#') + '</div>' +
          '</div>' +
          '<div class="card-foot">' +
            '<button class="btn btn-soft btn-sm rounded-pill px-3" type="button" onclick="editNewsItem(' + index + ')">Edit</button>' +
            '<button class="btn btn-outline-danger btn-sm rounded-pill px-3" type="button" onclick="deleteNewsItem(' + index + ')">Delete</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderEvents() {
    document.getElementById('eventsCount').textContent = String(state.events.length);
    document.getElementById('eventsMiniCount').textContent = String(state.events.length);
    if (!state.events.length) {
      eventsList.innerHTML = '<div class="empty-state"><i class="bi bi-calendar2-event fs-3 d-block mb-2"></i>No upcoming events yet.</div>';
      return;
    }
    eventsList.innerHTML = state.events.map(function (item, index) {
      const imageMarkup = item.imageUrl
        ? '<img class="admin-thumb" src="' + escapeHtml(resolveAssetUrl(item.imageUrl)) + '" alt="Event preview">'
        : '<div class="admin-thumb placeholder">No image</div>';
      return (
        '<article class="content-card">' +
          imageMarkup +
          '<div class="d-flex gap-3 align-items-start">' +
            '<div class="date-box"><div>' + escapeHtml(item.day) + '</div><small>' + escapeHtml(item.monthYear) + '</small></div>' +
            '<div class="flex-grow-1">' +
              '<h4 class="h6 mb-2">' + escapeHtml(item.title) + '</h4>' +
              '<div class="summary" style="min-height: 84px;">' + escapeHtml(item.summary) + '</div>' +
              '<div class="small muted mt-2">' + escapeHtml(item.linkText || 'Register Now') + ' → ' + escapeHtml(item.linkUrl || '#') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="card-foot">' +
            '<button class="btn btn-soft btn-sm rounded-pill px-3" type="button" onclick="editEventItem(' + index + ')">Edit</button>' +
            '<button class="btn btn-outline-danger btn-sm rounded-pill px-3" type="button" onclick="deleteEventItem(' + index + ')">Delete</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderGallery() {
    const items = Array.isArray(state.sections.galleryItems) ? state.sections.galleryItems : [];
    if (!galleryList) return;
    if (!items.length) {
      galleryList.innerHTML = '<div class="empty-state"><i class="bi bi-images fs-3 d-block mb-2"></i>No memory slides yet.</div>';
      return;
    }
    galleryList.innerHTML = items.map(function (item, index) {
      return (
        '<article class="content-card">' +
          '<img class="admin-thumb" src="' + escapeHtml(resolveAssetUrl(item.imageUrl || '')) + '" alt="Memory preview">' +
          '<h4 class="h6 mb-2">' + escapeHtml(item.alt || ('Gallery ' + (index + 1))) + '</h4>' +
          '<div class="summary"><div><strong>Image:</strong> ' + escapeHtml(item.imageUrl || '') + '</div></div>' +
          '<div class="card-foot">' +
            '<button class="btn btn-soft btn-sm rounded-pill px-3" type="button" onclick="editGalleryItem(' + index + ')">Edit</button>' +
            '<button class="btn btn-outline-danger btn-sm rounded-pill px-3" type="button" onclick="deleteGalleryItem(' + index + ')">Delete</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderAlumni() {
    const items = Array.isArray(state.sections.notableAlumniItems) ? state.sections.notableAlumniItems : [];
    if (!alumniList) return;
    if (!items.length) {
      alumniList.innerHTML = '<div class="empty-state"><i class="bi bi-person-badge fs-3 d-block mb-2"></i>No alumni cards yet.</div>';
      return;
    }
    alumniList.innerHTML = items.map(function (item, index) {
      return (
        '<article class="content-card">' +
          '<img class="admin-thumb" src="' + escapeHtml(resolveAssetUrl(item.imageUrl || '')) + '" alt="Alumni preview">' +
          '<h4 class="h6 mb-2">' + escapeHtml(item.name || 'Alumni') + '</h4>' +
          '<div class="summary">' + escapeHtml(item.text || '') + '</div>' +
          '<div class="card-foot">' +
            '<button class="btn btn-soft btn-sm rounded-pill px-3" type="button" onclick="editAlumniItem(' + index + ')">Edit</button>' +
            '<button class="btn btn-outline-danger btn-sm rounded-pill px-3" type="button" onclick="deleteAlumniItem(' + index + ')">Delete</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderAwards() {
    const items = Array.isArray(state.sections.awardItems) ? state.sections.awardItems : [];
    if (!awardList) return;
    if (!items.length) {
      awardList.innerHTML = '<div class="empty-state"><i class="bi bi-award fs-3 d-block mb-2"></i>No awards slides yet.</div>';
      return;
    }
    awardList.innerHTML = items.map(function (item, index) {
      return (
        '<article class="content-card">' +
          '<img class="admin-thumb" src="' + escapeHtml(resolveAssetUrl(item.imageUrl || '')) + '" alt="Award preview">' +
          '<h4 class="h6 mb-2">' + escapeHtml(item.title || 'Award') + '</h4>' +
          '<div class="summary">' +
            '<div>' + escapeHtml(item.description1 || '') + '</div>' +
            (item.description2 ? '<div class="mt-2">' + escapeHtml(item.description2) + '</div>' : '') +
          '</div>' +
          '<div class="card-foot">' +
            '<button class="btn btn-soft btn-sm rounded-pill px-3" type="button" onclick="editAwardItem(' + index + ')">Edit</button>' +
            '<button class="btn btn-outline-danger btn-sm rounded-pill px-3" type="button" onclick="deleteAwardItem(' + index + ')">Delete</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function getActivationToken(user) {
    const sourceUrl = String((user && user.activationUrl) || '');
    const tokenMatch = sourceUrl.match(/[?&]token=([^&]+)/);
    return tokenMatch ? tokenMatch[1] : '';
  }

  function buildActivationUrl(user, mode) {
    const token = getActivationToken(user);
    if (!token) return '';
    const baseUrl = mode === 'online' ? ONLINE_ACTIVATION_BASE_URL : LOCAL_ACTIVATION_BASE_URL;
    return baseUrl + '/activate.html?token=' + token;
  }

  function buildActivationMessage(user, mode) {
    const activationUrl = buildActivationUrl(user, mode || 'local');
    if (!activationUrl) return '';
    return 'Hello ' + user.name + ',\n\nActivate your account by opening this link:\n' + activationUrl + '\n\nIf you did not create this account, ignore this email.';
  }

  function renderUsers() {
    document.getElementById('usersCount').textContent = String(state.users.length);
    if (!state.users.length) {
      usersList.innerHTML = '<div class="empty-state"><i class="bi bi-people fs-3 d-block mb-2"></i>No registered users yet.</div>';
      return;
    }
    usersList.innerHTML = state.users.map(function (user) {
      const localActivationUrl = buildActivationUrl(user, 'local');
      return (
        '<article class="content-card">' +
          '<h4 class="h6 mb-2">' + escapeHtml(user.name) + '</h4>' +
          '<div class="summary" style="min-height: 104px;">' +
            '<div><strong>Email:</strong> ' + escapeHtml(user.email) + '</div>' +
            '<div><strong>University ID:</strong> ' + escapeHtml(user.universityId || '-') + '</div>' +
            '<div><strong>Role:</strong> ' + escapeHtml(user.role) + '</div>' +
            '<div><strong>Active:</strong> ' + (user.isActive ? 'Yes' : 'No') + '</div>' +
            (!user.isActive && localActivationUrl ? '<div class="mt-2"><strong>Local Activation Link:</strong> <span class="small">' + escapeHtml(localActivationUrl) + '</span></div>' : '') +
            (!user.isActive && localActivationUrl ? '<div class="mt-2 small" style="white-space: pre-line; color: #475467; background: #f8fbff; border: 1px dashed #d7e1ed; border-radius: 14px; padding: 12px;">' + escapeHtml(buildActivationMessage(user, 'local')) + '</div>' : '') +
          '</div>' +
          '<div class="card-foot">' +
            '<button class="btn btn-soft btn-sm rounded-pill px-3" type="button" onclick="toggleUserStatus(' + user.id + ', ' + (user.isActive ? 'false' : 'true') + ')">' + (user.isActive ? 'Deactivate' : 'Activate') + '</button>' +
            '<button class="btn btn-outline-primary btn-sm rounded-pill px-3" type="button" onclick="changeUserRole(' + user.id + ', \'' + (user.role === 'admin' ? 'user' : 'admin') + '\')">' + (user.role === 'admin' ? 'Make user' : 'Make admin') + '</button>' +
            (!user.isActive && localActivationUrl ? '<button class="btn btn-success btn-sm rounded-pill px-3" type="button" onclick="copyActivationMessage(' + user.id + ', \'local\')">Copy Local Message</button>' : '') +
            (!user.isActive && localActivationUrl ? '<button class="btn btn-outline-success btn-sm rounded-pill px-3" type="button" onclick="copyActivationMessage(' + user.id + ', \'online\')">Copy Online Message</button>' : '') +
            '<button class="btn btn-outline-danger btn-sm rounded-pill px-3" type="button" onclick="deleteUser(' + user.id + ', \'' + escapeHtml(user.name) + '\')">Delete</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderMessages() {
    document.getElementById('messagesCount').textContent = String(state.messages.length);
    if (!state.messages.length) {
      messagesList.innerHTML = '<div class="empty-state"><i class="bi bi-envelope fs-3 d-block mb-2"></i>No contact messages yet.</div>';
      return;
    }
    messagesList.innerHTML = state.messages.map(function (message) {
      return (
        '<article class="content-card">' +
          '<h4 class="h6 mb-2">' + escapeHtml(message.name) + '</h4>' +
          '<div class="summary" style="min-height: 116px;">' +
            '<div><strong>Email:</strong> ' + escapeHtml(message.email) + '</div>' +
            '<div><strong>Phone:</strong> ' + escapeHtml(message.phone || '-') + '</div>' +
            '<div><strong>Status:</strong> ' + escapeHtml(message.status) + '</div>' +
            '<div class="mt-2">' + escapeHtml(message.message) + '</div>' +
          '</div>' +
          '<div class="card-foot">' +
            '<span class="muted small">' + escapeHtml(message.created_at) + '</span>' +
            '<button class="btn btn-soft btn-sm rounded-pill px-3" type="button" onclick="markMessageReviewed(' + message.id + ')">Mark reviewed</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderAll() {
    renderNews();
    renderEvents();
    renderGallery();
    renderAlumni();
    renderAwards();
    renderUsers();
    renderMessages();
    fillSiteContentForm();
  }

  function persistManagedCollections(successText) {
    setSaveState('warn', 'Saving content');
    return apiRequest(CONTENT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        news: state.news,
        events: state.events,
        sections: state.sections
      })
    }).then(function () {
      setConnection(true);
      setSaveState('good', successText || 'Collections saved');
    }).catch(function (error) {
      console.error(error);
      setConnection(false);
      setSaveState('warn', 'Save failed');
      alert(error.message);
      loadAll();
      throw error;
    });
  }

  function savePublishedContent() {
    state.sections = readSiteContentForm();
    setSaveState('warn', 'Saving published content');
    return apiRequest(CONTENT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        news: state.news,
        events: state.events,
        sections: state.sections
      })
    }).then(function (data) {
      state.sections = normalizeSections(data.sections || state.sections);
      fillSiteContentForm();
      setConnection(true);
      resetDirty();
      setSaveState('good', 'Published content saved');
      alert('Published content was updated successfully.');
    }).catch(function (error) {
      console.error(error);
      setConnection(false);
      setSaveState('warn', 'Save failed');
      alert(error.message);
    });
  }

  function loadAll() {
    setSaveState('warn', 'Loading');
    Promise.all([
      apiRequest(CONTENT_API, { method: 'GET' }),
      apiRequest(USERS_API, { method: 'GET' }),
      apiRequest(MESSAGES_API, { method: 'GET' })
    ]).then(function (results) {
      state.news = Array.isArray(results[0].news) ? results[0].news : [];
      state.events = Array.isArray(results[0].events) ? results[0].events : [];
      state.sections = normalizeSections(results[0].sections);
      state.users = Array.isArray(results[1].users) ? results[1].users : [];
      state.messages = Array.isArray(results[2].messages) ? results[2].messages : [];
      renderAll();
      if (!state.newsDraftDirty && !(newsForm && newsForm.matches(':focus-within'))) {
        resetNewsFormState();
      }
      if (!state.eventDraftDirty && !(eventForm && eventForm.matches(':focus-within'))) {
        resetEventFormState();
      }
      setConnection(true);
      resetDirty();
    }).catch(function (error) {
      console.error(error);
      setConnection(false);
      setSaveState('warn', error.message);
      if (error.message === 'Login required' || error.message === 'Admin access required') {
        showLogin();
      }
    });
  }

  window.editNewsItem = function (index) {
    const item = state.news[index];
    if (item) populateNewsForm(item, index);
  };

  window.deleteNewsItem = function (index) {
    const confirmed = window.confirm('Delete this news item from the website?');
    if (!confirmed) return;
    state.news = state.news.filter(function (_, itemIndex) { return itemIndex !== index; });
    renderNews();
    persistManagedCollections('News list saved');
  };

  window.editEventItem = function (index) {
    const item = state.events[index];
    if (item) populateEventForm(item, index);
  };

  window.deleteEventItem = function (index) {
    const confirmed = window.confirm('Delete this event from the website?');
    if (!confirmed) return;
    state.events = state.events.filter(function (_, itemIndex) { return itemIndex !== index; });
    renderEvents();
    persistManagedCollections('Events list saved');
  };

  window.editGalleryItem = function (index) {
    const items = Array.isArray(state.sections.galleryItems) ? state.sections.galleryItems : [];
    if (items[index]) populateGalleryForm(items[index], index);
  };

  window.deleteGalleryItem = function (index) {
    const confirmed = window.confirm('Delete this memory slide?');
    if (!confirmed) return;
    state.sections.galleryItems = (state.sections.galleryItems || []).filter(function (_, itemIndex) { return itemIndex !== index; });
    renderGallery();
    fillSiteContentForm();
    savePublishedContent();
  };

  window.editAlumniItem = function (index) {
    const items = Array.isArray(state.sections.notableAlumniItems) ? state.sections.notableAlumniItems : [];
    if (items[index]) populateAlumniForm(items[index], index);
  };

  window.deleteAlumniItem = function (index) {
    const confirmed = window.confirm('Delete this alumni card?');
    if (!confirmed) return;
    state.sections.notableAlumniItems = (state.sections.notableAlumniItems || []).filter(function (_, itemIndex) { return itemIndex !== index; });
    renderAlumni();
    fillSiteContentForm();
    savePublishedContent();
  };

  window.editAwardItem = function (index) {
    const items = Array.isArray(state.sections.awardItems) ? state.sections.awardItems : [];
    if (items[index]) populateAwardForm(items[index], index);
  };

  window.deleteAwardItem = function (index) {
    const confirmed = window.confirm('Delete this award slide?');
    if (!confirmed) return;
    state.sections.awardItems = (state.sections.awardItems || []).filter(function (_, itemIndex) { return itemIndex !== index; });
    renderAwards();
    fillSiteContentForm();
    savePublishedContent();
  };

  window.toggleUserStatus = function (id, nextState) {
    apiRequest(USERS_API + '/' + id + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: nextState === true || nextState === 'true' })
    }).then(loadAll).catch(function (error) {
      alert(error.message);
    });
  };

  window.changeUserRole = function (id, role) {
    apiRequest(USERS_API + '/' + id + '/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: role })
    }).then(loadAll).catch(function (error) {
      alert(error.message);
    });
  };

  window.deleteUser = function (id, name) {
    const confirmed = window.confirm('Delete user "' + name + '" permanently from the database?');
    if (!confirmed) return;
    apiRequest(USERS_API + '/' + id, { method: 'DELETE' }).then(loadAll).catch(function (error) {
      alert(error.message);
    });
  };

  window.copyActivationMessage = function (id, mode) {
    const user = state.users.find(function (item) { return item.id === id; });
    const activationMode = mode === 'online' ? 'online' : 'local';
    const message = user ? buildActivationMessage(user, activationMode) : '';
    if (!user || !message) {
      alert('Activation message is not available for this user.');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(function () {
        alert((activationMode === 'online' ? 'Online' : 'Local') + ' activation message copied. You can now paste it anywhere.');
      }).catch(function () {
        window.prompt('Copy this activation message:', message);
      });
      return;
    }
    window.prompt('Copy this activation message:', message);
  };

  window.markMessageReviewed = function (id) {
    apiRequest(MESSAGES_API + '/' + id + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reviewed' })
    }).then(loadAll).catch(function (error) {
      alert(error.message);
    });
  };

  newsSubmitBtn.addEventListener('click', function () {
    const editingIndex = Number(newsEditingIdInput.value || -1);
    const item = {
      id: editingIndex >= 0 && state.news[editingIndex] ? state.news[editingIndex].id : Date.now(),
      badge: newsBadgeInput.value.trim(),
      title: newsTitleInput.value.trim(),
      imageUrl: newsImageInput.value.trim(),
      linkText: newsLinkTextInput.value.trim() || 'Read more',
      linkUrl: newsLinkUrlInput.value.trim() || '#'
    };
    if (!item.badge || !item.title) {
      alert('Please complete the badge and title for the news item.');
      return;
    }
    if (editingIndex >= 0) {
      state.news = state.news.map(function (entry, index) { return index === editingIndex ? item : entry; });
    } else {
      state.news.unshift(item);
    }
    renderNews();
    persistManagedCollections(editingIndex >= 0 ? 'News item updated' : 'News item added').then(resetNewsFormState);
  });

  eventSubmitBtn.addEventListener('click', function () {
    const editingIndex = Number(eventEditingIdInput.value || -1);
    const item = {
      id: editingIndex >= 0 && state.events[editingIndex] ? state.events[editingIndex].id : Date.now(),
      day: eventDayInput.value.trim(),
      monthYear: eventMonthYearInput.value.trim(),
      title: eventTitleInput.value.trim(),
      summary: eventSummaryInput.value.trim(),
      imageUrl: eventImageInput.value.trim(),
      linkText: eventLinkTextInput.value.trim() || 'Register Now',
      linkUrl: eventLinkUrlInput.value.trim() || '#'
    };
    if (!item.day || !item.monthYear || !item.title || !item.summary) {
      alert('Please complete the event date, title, and summary.');
      return;
    }
    if (editingIndex >= 0) {
      state.events = state.events.map(function (entry, index) { return index === editingIndex ? item : entry; });
    } else {
      state.events.unshift(item);
    }
    renderEvents();
    persistManagedCollections(editingIndex >= 0 ? 'Event updated' : 'Event added').then(resetEventFormState);
  });

  newsForm.addEventListener('input', function () {
    state.newsDraftDirty = true;
  });
  eventForm.addEventListener('input', function () {
    state.eventDraftDirty = true;
  });
  newsClearBtn.addEventListener('click', resetNewsFormState);
  eventClearBtn.addEventListener('click', resetEventFormState);
  newsCancelEditBtn.addEventListener('click', resetNewsFormState);
  eventCancelEditBtn.addEventListener('click', resetEventFormState);

  if (galleryForm) {
    galleryForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const editingIndex = Number(galleryEditingIdInput.value || -1);
      const item = {
        imageUrl: galleryImageInput.value.trim(),
        alt: galleryAltInput.value.trim() || 'Gallery'
      };
      if (!item.imageUrl) {
        alert('Please choose a gallery image.');
        return;
      }
      const items = Array.isArray(state.sections.galleryItems) ? state.sections.galleryItems.slice() : [];
      if (editingIndex >= 0) {
        items[editingIndex] = item;
      } else {
        items.push(item);
      }
      state.sections.galleryItems = items;
      renderGallery();
      fillSiteContentForm();
      savePublishedContent().then(resetGalleryFormState);
    });
    galleryForm.addEventListener('reset', function () { window.setTimeout(resetGalleryFormState, 0); });
    galleryCancelEditBtn.addEventListener('click', resetGalleryFormState);
  }

  if (alumniForm) {
    alumniForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const editingIndex = Number(alumniEditingIdInput.value || -1);
      const item = {
        name: alumniNameInput.value.trim(),
        imageUrl: alumniImageInput.value.trim(),
        text: alumniTextInput.value.trim()
      };
      if (!item.name || !item.imageUrl || !item.text) {
        alert('Please complete the alumni card fields.');
        return;
      }
      const items = Array.isArray(state.sections.notableAlumniItems) ? state.sections.notableAlumniItems.slice() : [];
      if (editingIndex >= 0) {
        items[editingIndex] = item;
      } else {
        items.push(item);
      }
      state.sections.notableAlumniItems = items;
      renderAlumni();
      fillSiteContentForm();
      savePublishedContent().then(resetAlumniFormState);
    });
    alumniForm.addEventListener('reset', function () { window.setTimeout(resetAlumniFormState, 0); });
    alumniCancelEditBtn.addEventListener('click', resetAlumniFormState);
  }

  if (awardForm) {
    awardForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const editingIndex = Number(awardEditingIdInput.value || -1);
      const item = {
        title: awardTitleInput.value.trim(),
        imageUrl: awardImageInput.value.trim(),
        description1: awardDescription1Input.value.trim(),
        description2: awardDescription2Input.value.trim()
      };
      if (!item.title || !item.imageUrl || !item.description1) {
        alert('Please complete the award title, image, and first description.');
        return;
      }
      const items = Array.isArray(state.sections.awardItems) ? state.sections.awardItems.slice() : [];
      if (editingIndex >= 0) {
        items[editingIndex] = item;
      } else {
        items.push(item);
      }
      state.sections.awardItems = items;
      renderAwards();
      fillSiteContentForm();
      savePublishedContent().then(resetAwardFormState);
    });
    awardForm.addEventListener('reset', function () { window.setTimeout(resetAwardFormState, 0); });
    awardCancelEditBtn.addEventListener('click', resetAwardFormState);
  }

  if (siteContentForm) {
    siteContentForm.addEventListener('submit', function (event) {
      event.preventDefault();
      savePublishedContent();
    });
    siteContentForm.addEventListener('input', function () {
      markDirty();
      updateImagePreview(viceDeanImagePreview, viceDeanImageInput.value.trim());
    });
  }

  if (resetSiteContentBtn) {
    resetSiteContentBtn.addEventListener('click', function () {
      fillSiteContentForm();
      resetDirty();
    });
  }

  publishBtn.addEventListener('click', savePublishedContent);
  refreshBtn.addEventListener('click', loadAll);
  reloadNewsBtn.addEventListener('click', loadAll);
  reloadEventsBtn.addEventListener('click', loadAll);
  openWebsiteBtn.addEventListener('click', function () { window.open('/website/index.html', '_blank'); });

  bindUploadButton(newsUploadBtn, newsImageInput, newsImagePreview);
  bindUploadButton(eventUploadBtn, eventImageInput, eventImagePreview);
  bindUploadButton(viceDeanUploadBtn, viceDeanImageInput, viceDeanImagePreview);
  bindUploadButton(galleryUploadBtn, galleryImageInput, galleryImagePreview);
  bindUploadButton(alumniUploadBtn, alumniImageInput, alumniImagePreview);
  bindUploadButton(awardUploadBtn, awardImageInput, awardImagePreview);
  bindPreviewOnInput(newsImageInput, newsImagePreview);
  bindPreviewOnInput(eventImageInput, eventImagePreview);
  bindPreviewOnInput(viceDeanImageInput, viceDeanImagePreview);
  bindPreviewOnInput(galleryImageInput, galleryImagePreview);
  bindPreviewOnInput(alumniImageInput, alumniImagePreview);
  bindPreviewOnInput(awardImageInput, awardImagePreview);

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    authError.style.display = 'none';
    apiRequest(AUTH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    }).then(function (data) {
      if (!data.user || data.user.role !== 'admin' || !data.user.isActive) {
        throw new Error('This account is not an active admin');
      }
      showDashboard();
    }).catch(function (error) {
      authError.textContent = error.message;
      authError.style.display = 'block';
      passwordInput.select();
    });
  });

  logoutBtn.addEventListener('click', function () {
    apiRequest(LOGOUT_API, { method: 'POST' })
      .catch(function (error) { console.error(error); })
      .finally(showLogin);
  });

  apiRequest(SESSION_API, { method: 'GET' })
    .then(function (data) {
      if (data.authenticated && data.user && data.user.role === 'admin' && data.user.isActive) {
        showDashboard();
      } else {
        showLogin();
      }
    })
    .catch(function () {
      showLogin();
    });
})();
