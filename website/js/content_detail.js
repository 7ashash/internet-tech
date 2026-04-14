document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function apiRequest(url) {
    return fetch(url, { cache: 'no-store' }).then(async function (response) {
      var data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Could not load the selected item');
      }
      return data;
    });
  }

  function setStatus(message, type) {
    var status = document.getElementById('detailStatus');
    if (!status) return;
    status.className = 'detail-status ' + (type || 'error');
    status.textContent = message;
    status.classList.remove('hidden');
  }

  function buildNewsDescription(item) {
    return 'This news item is part of the Environmental and Community Service Sector updates on the MUST website. You can review the institutional source from the button below.';
  }

  function buildEventDescription(item) {
    return item.summary || 'This event belongs to the Environmental and Community Service Sector at Misr University for Science and Technology.';
  }

  function renderItem(type, item) {
    var title = document.getElementById('detailTitle');
    var eyebrow = document.getElementById('detailEyebrow');
    var meta = document.getElementById('detailMeta');
    var image = document.getElementById('detailImage');
    var description = document.getElementById('detailDescription');
    var sourceLink = document.getElementById('detailSourceLink');

    if (title) title.textContent = item.title || 'Untitled';
    if (eyebrow) eyebrow.textContent = type === 'event' ? 'MUST Event' : 'MUST News';
    if (image) {
      image.src = item.imageUrl || 'images/logo-png.png';
      image.alt = item.title || (type === 'event' ? 'Event image' : 'News image');
    }

    if (meta) {
      var parts = [];
      if (type === 'news' && item.badge) {
        parts.push('<span><i class="far fa-calendar"></i> ' + escapeHtml(item.badge) + '</span>');
      }
      if (type === 'event') {
        if (item.day || item.monthYear) {
          parts.push('<span><i class="far fa-calendar"></i> ' + escapeHtml((item.day || '') + ' ' + (item.monthYear || '')).trim() + '</span>');
        }
        if (item.location) {
          parts.push('<span><i class="fas fa-location-dot"></i> ' + escapeHtml(item.location) + '</span>');
        }
        if (item.timeText) {
          parts.push('<span><i class="far fa-clock"></i> ' + escapeHtml(item.timeText) + '</span>');
        }
      }
      meta.innerHTML = parts.join('');
    }

    if (description) {
      description.textContent = type === 'event' ? buildEventDescription(item) : buildNewsDescription(item);
    }

    if (sourceLink) {
      if (item.sourceUrl && item.sourceUrl !== '#') {
        sourceLink.href = item.sourceUrl;
        sourceLink.classList.remove('hidden');
      } else {
        sourceLink.classList.add('hidden');
      }
    }

    document.title = (item.title || 'Content Details') + ' | MUST';
  }

  var params = new URLSearchParams(window.location.search);
  var type = params.get('type');
  var id = params.get('id');

  if (!type || !id || (type !== 'news' && type !== 'event')) {
    setStatus('The selected content could not be identified.', 'error');
    return;
  }

  var endpoint = type === 'event'
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
