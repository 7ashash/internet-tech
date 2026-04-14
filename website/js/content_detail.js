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

  function apiRequest(url) {
    return fetch(url, { cache: 'no-store' }).then(async function (response) {
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Could not load the selected item');
      }
      return data;
    });
  }

  function setStatus(message, type) {
    const status = document.getElementById('detailStatus');
    if (!status) return;
    status.className = 'detail-status ' + (type || 'error');
    status.textContent = message;
    status.classList.remove('hidden');
  }

  function buildFallbackSections(type, item) {
    return [
      {
        title: type === 'event' ? 'Overview' : 'Details',
        paragraphs: [
          item.summary || 'The selected item is part of the Environmental and Community Service Sector updates at Misr University for Science and Technology.'
        ]
      }
    ];
  }

  function resolveSections(type, item) {
    const group = DETAIL_COPY[type] || {};
    const byTitle = group[item.title];
    if (byTitle && Array.isArray(byTitle.sections)) {
      return byTitle.sections;
    }
    return buildFallbackSections(type, item);
  }

  function renderSections(target, sections) {
    if (!target) return;
    target.innerHTML = sections.map(function (section) {
      const titleMarkup = section.title ? '<h3 class="detail-section-title">' + section.title + '</h3>' : '';
      const paragraphsMarkup = Array.isArray(section.paragraphs)
        ? section.paragraphs.map(function (paragraph) {
            return '<p>' + paragraph + '</p>';
          }).join('')
        : '';
      const bulletsMarkup = Array.isArray(section.bullets) && section.bullets.length
        ? '<ul>' + section.bullets.map(function (bullet) {
            return '<li>' + bullet + '</li>';
          }).join('') + '</ul>'
        : '';
      return titleMarkup + paragraphsMarkup + bulletsMarkup;
    }).join('');
  }

  function renderItem(type, item) {
    const title = document.getElementById('detailTitle');
    const eyebrow = document.getElementById('detailEyebrow');
    const meta = document.getElementById('detailMeta');
    const image = document.getElementById('detailImage');
    const description = document.getElementById('detailDescription');

    if (title) title.textContent = item.title || 'Untitled';
    if (eyebrow) eyebrow.textContent = type === 'event' ? 'MUST Event' : 'MUST News';
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
        if (item.day || item.monthYear) {
          parts.push('<span><i class="far fa-calendar"></i> ' + ((item.day || '') + ' ' + (item.monthYear || '')).trim() + '</span>');
        }
        if (item.location) {
          parts.push('<span><i class="fas fa-location-dot"></i> ' + item.location + '</span>');
        }
        if (item.timeText) {
          parts.push('<span><i class="far fa-clock"></i> ' + item.timeText + '</span>');
        }
      }
      meta.innerHTML = parts.join('');
    }

    renderSections(description, resolveSections(type, item));
    document.title = (item.title || 'Content Details') + ' | MUST';
  }

  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const id = params.get('id');

  if (!type || !id || (type !== 'news' && type !== 'event')) {
    setStatus('The selected content could not be identified.', 'error');
    return;
  }

  const endpoint = type === 'event'
    ? '/api/content/public/events/' + encodeURIComponent(id)
    : '/api/content/public/news/' + encodeURIComponent(id);

  apiRequest(endpoint)
    .then(function (data) {
      renderItem(type, data.item || {});
    })
    .catch(function (error) {
      setStatus(error.message || 'Could not load the selected item.', 'error');
    });
});
