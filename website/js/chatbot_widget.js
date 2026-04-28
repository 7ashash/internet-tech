document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var suggestedQuestions = [
    'What is the sector vision?',
    'What are the sector objectives?',
    'Show me the committees',
    'What protocols are available?',
    'How can I contact the sector?',
    'What are the latest events?'
  ];

  var quickLinks = [
    { label: 'Open Committees', target: '#committees', response: 'Opening the Committees section.' },
    { label: 'Open Protocols', target: '#protocols', response: 'Opening the Protocols section.' },
    { label: 'Contact Us', target: '#contact', response: 'Opening the Contact Us section.' },
    { label: 'View Events', target: '#events', response: 'Opening the Events section.' }
  ];

  var settings = {
    enabled: true,
    welcomeMessage: 'Hello. I can help with the sector vision, mission, objectives, committees, protocols, annual plan, news, events, gallery, and contact information.',
    assistantName: 'Sector AI Assistant',
    showSuggestedQuestions: true
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getVisitorId() {
    var key = 'must-chat-visitor-id';
    var existing = window.localStorage.getItem(key);
    if (existing) return existing;
    var generated = 'guest-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    window.localStorage.setItem(key, generated);
    return generated;
  }

  function getCurrentSessionId() {
    return window.localStorage.getItem('must-chat-session-id') || '';
  }

  function setCurrentSessionId(sessionId) {
    if (!sessionId) return;
    window.localStorage.setItem('must-chat-session-id', String(sessionId));
  }

  function clearCurrentSessionId() {
    window.localStorage.removeItem('must-chat-session-id');
  }

  function getSectionUrl(hash) {
    var isDetailPage = document.body && document.body.classList.contains('content-detail-page');
    return isDetailPage ? 'index.html' + hash : hash;
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  var wrapper = document.createElement('div');
  wrapper.className = 'ai-chatbot-widget';
  wrapper.innerHTML = [
    '<button class="ai-chatbot-toggle" type="button" aria-label="Open Sector AI Assistant">',
      '<i class="fas fa-comments"></i>',
    '</button>',
    '<section class="ai-chatbot-panel" aria-hidden="true" aria-label="Sector AI Assistant">',
      '<div class="ai-chatbot-header">',
        '<div>',
          '<strong class="ai-chatbot-title">Sector AI Assistant</strong>',
          '<span>Website assistant</span>',
        '</div>',
        '<button class="ai-chatbot-close" type="button" aria-label="Close chat"><i class="fas fa-times"></i></button>',
      '</div>',
      '<div class="ai-chatbot-tools" aria-label="Chat tools">',
        '<button type="button" class="ai-chatbot-tool" data-action="new">New Chat</button>',
        '<button type="button" class="ai-chatbot-tool" data-action="history">Chat History</button>',
        '<button type="button" class="ai-chatbot-tool ai-chatbot-tool-danger" data-action="clear">Clear Chat</button>',
      '</div>',
      '<div class="ai-chatbot-history hidden" aria-label="Chat history"></div>',
      '<div class="ai-chatbot-messages" role="log" aria-live="polite"></div>',
      '<div class="ai-chatbot-suggestions" aria-label="Suggested questions"></div>',
      '<div class="ai-chatbot-quicklinks" aria-label="Quick links"></div>',
      '<form class="ai-chatbot-form">',
        '<input class="ai-chatbot-input" type="text" maxlength="1000" placeholder="Ask about the sector..." autocomplete="off">',
        '<button class="ai-chatbot-send" type="submit" aria-label="Send message"><i class="fas fa-paper-plane"></i></button>',
      '</form>',
    '</section>'
  ].join('');
  document.body.appendChild(wrapper);

  var toggleBtn = wrapper.querySelector('.ai-chatbot-toggle');
  var closeBtn = wrapper.querySelector('.ai-chatbot-close');
  var panel = wrapper.querySelector('.ai-chatbot-panel');
  var titleEl = wrapper.querySelector('.ai-chatbot-title');
  var toolsEl = wrapper.querySelector('.ai-chatbot-tools');
  var historyEl = wrapper.querySelector('.ai-chatbot-history');
  var messagesEl = wrapper.querySelector('.ai-chatbot-messages');
  var suggestionsEl = wrapper.querySelector('.ai-chatbot-suggestions');
  var quickLinksEl = wrapper.querySelector('.ai-chatbot-quicklinks');
  var form = wrapper.querySelector('.ai-chatbot-form');
  var input = wrapper.querySelector('.ai-chatbot-input');
  var isOpen = false;
  var isSending = false;

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderFeedbackControls(item, messageId, currentRating) {
    if (!messageId || !item) return;
    var feedback = document.createElement('div');
    feedback.className = 'ai-chatbot-feedback';
    feedback.innerHTML = [
      '<span>Was this helpful?</span>',
      '<button type="button" class="ai-chatbot-feedback-btn' + (currentRating === 'helpful' ? ' is-active' : '') + '" data-rating="helpful" data-message-id="' + escapeHtml(messageId) + '">Helpful</button>',
      '<button type="button" class="ai-chatbot-feedback-btn' + (currentRating === 'not_helpful' ? ' is-active' : '') + '" data-rating="not_helpful" data-message-id="' + escapeHtml(messageId) + '">Not helpful</button>'
    ].join('');
    item.appendChild(feedback);
  }

  function addMessage(role, content, loading, messageId, feedback) {
    var item = document.createElement('div');
    item.className = 'ai-chatbot-message ai-chatbot-message-' + role + (loading ? ' is-loading' : '');
    item.innerHTML = '<span>' + escapeHtml(content) + '</span>';
    if (role === 'assistant' && messageId && !loading) {
      renderFeedbackControls(item, messageId, feedback);
    }
    messagesEl.appendChild(item);
    scrollToBottom();
    return item;
  }

  function clearMessages() {
    messagesEl.innerHTML = '';
  }

  function showWelcome() {
    clearMessages();
    addMessage('assistant', settings.welcomeMessage);
  }

  function hideHistory() {
    historyEl.classList.add('hidden');
  }

  function setOpen(nextOpen) {
    isOpen = nextOpen;
    wrapper.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('ai-chatbot-open', isOpen);
    panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    if (isOpen) {
      setTimeout(function () { input.focus(); }, 80);
    }
  }

  function renderHistory(sessions) {
    if (!sessions.length) {
      historyEl.innerHTML = '<p class="ai-chatbot-history-empty">No chat history yet.</p>';
      return;
    }

    historyEl.innerHTML = sessions.map(function (session) {
      return [
        '<button type="button" class="ai-chatbot-history-item" data-session-id="' + escapeHtml(session.id) + '">',
          '<strong>' + escapeHtml(session.title || 'New chat') + '</strong>',
          '<span>' + escapeHtml((session.lastMessage || '').slice(0, 90)) + '</span>',
          '<small>' + escapeHtml(formatDate(session.updatedAt)) + ' · ' + escapeHtml(session.messageCount || 0) + ' messages</small>',
        '</button>'
      ].join('');
    }).join('');
  }

  function loadHistory() {
    historyEl.classList.remove('hidden');
    historyEl.innerHTML = '<p class="ai-chatbot-history-empty">Loading history...</p>';

    fetch('/api/chat/sessions?visitorId=' + encodeURIComponent(getVisitorId()), {
      method: 'GET'
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || !data.ok) {
            throw new Error(data && data.error ? data.error : 'Could not load chat history.');
          }
          return data;
        });
      })
      .then(function (data) {
        renderHistory(Array.isArray(data.sessions) ? data.sessions : []);
      })
      .catch(function (error) {
        historyEl.innerHTML = '<p class="ai-chatbot-history-empty">' + escapeHtml(error.message || 'Could not load chat history.') + '</p>';
      });
  }

  function loadSessionMessages(sessionId) {
    if (!sessionId) return;
    historyEl.innerHTML = '<p class="ai-chatbot-history-empty">Loading conversation...</p>';

    fetch('/api/chat/sessions/' + encodeURIComponent(sessionId) + '/messages?visitorId=' + encodeURIComponent(getVisitorId()), {
      method: 'GET'
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || !data.ok) {
            throw new Error(data && data.error ? data.error : 'Could not load this conversation.');
          }
          return data;
        });
      })
      .then(function (data) {
        setCurrentSessionId(data.sessionId || sessionId);
        clearMessages();
        (Array.isArray(data.messages) ? data.messages : []).forEach(function (message) {
          addMessage(message.role === 'user' ? 'user' : 'assistant', message.content, false, message.role === 'assistant' ? message.id : '', message.feedback);
        });
        hideHistory();
        input.focus();
      })
      .catch(function (error) {
        historyEl.innerHTML = '<p class="ai-chatbot-history-empty">' + escapeHtml(error.message || 'Could not load this conversation.') + '</p>';
      });
  }

  function startNewChat() {
    clearCurrentSessionId();
    hideHistory();
    showWelcome();
    input.focus();
  }

  function clearCurrentChat() {
    var sessionId = getCurrentSessionId();
    clearCurrentSessionId();
    hideHistory();
    showWelcome();

    if (!sessionId) return;

    fetch('/api/chat/sessions/' + encodeURIComponent(sessionId), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId: getVisitorId() })
    }).catch(function () {
      addMessage('assistant', 'The local chat was cleared. The saved conversation could not be deleted right now.');
    });
  }

  function sendQuestion(question) {
    var message = String(question || '').trim();
    if (!message || isSending) return;

    hideHistory();
    addMessage('user', message);
    input.value = '';
    isSending = true;
    form.classList.add('is-sending');
    var loadingMessage = addMessage('assistant', 'Thinking...', true);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        visitorId: getVisitorId(),
        sessionId: getCurrentSessionId()
      })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || !data.ok) {
            var requestError = new Error(data && data.error ? data.error : 'The assistant could not answer right now.');
            requestError.sessionId = data && data.sessionId ? data.sessionId : '';
            throw requestError;
          }
          return data;
        });
      })
      .then(function (data) {
        if (data.sessionId) {
          setCurrentSessionId(data.sessionId);
        }
        loadingMessage.classList.remove('is-loading');
        loadingMessage.innerHTML = '<span>' + escapeHtml(data.answer) + '</span>';
        renderFeedbackControls(loadingMessage, data.messageId, '');
      })
      .catch(function (error) {
        if (error && error.sessionId) {
          setCurrentSessionId(error.sessionId);
        }
        loadingMessage.classList.remove('is-loading');
        loadingMessage.innerHTML = '<span>' + escapeHtml(error.message || 'The assistant could not answer right now.') + '</span>';
      })
      .finally(function () {
        isSending = false;
        form.classList.remove('is-sending');
        scrollToBottom();
      });
  }

  function renderSuggestions() {
    if (!settings.showSuggestedQuestions) {
      suggestionsEl.innerHTML = '';
      suggestionsEl.hidden = true;
      return;
    }
    suggestionsEl.hidden = false;
    suggestionsEl.innerHTML = suggestedQuestions.map(function (question) {
      return '<button type="button" class="ai-chatbot-chip" data-question="' + escapeHtml(question) + '">' + escapeHtml(question) + '</button>';
    }).join('');
  }

  function renderQuickLinks() {
    quickLinksEl.innerHTML = quickLinks.map(function (link) {
      return '<button type="button" class="ai-chatbot-link" data-target="' + escapeHtml(link.target) + '" data-response="' + escapeHtml(link.response) + '">' + escapeHtml(link.label) + '</button>';
    }).join('');
  }

  function applySettings(nextSettings) {
    settings.enabled = nextSettings && nextSettings.enabled !== false;
    settings.welcomeMessage = nextSettings && nextSettings.welcomeMessage ? nextSettings.welcomeMessage : settings.welcomeMessage;
    settings.assistantName = nextSettings && nextSettings.assistantName ? nextSettings.assistantName : settings.assistantName;
    settings.showSuggestedQuestions = !(nextSettings && nextSettings.showSuggestedQuestions === false);
    if (!settings.enabled) {
      wrapper.style.display = 'none';
      return;
    }
    wrapper.style.display = '';
    if (titleEl) titleEl.textContent = settings.assistantName;
    renderSuggestions();
    renderQuickLinks();
    showWelcome();
  }

  function loadSettings() {
    fetch('/api/chat/settings', { method: 'GET' })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || !data.ok) throw new Error('Could not load chatbot settings.');
          return data;
        });
      })
      .then(function (data) {
        applySettings(data.settings || {});
      })
      .catch(function () {
        applySettings(settings);
      });
  }

  toggleBtn.addEventListener('click', function () {
    setOpen(!isOpen);
  });

  closeBtn.addEventListener('click', function () {
    setOpen(false);
  });

  toolsEl.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    var action = button.getAttribute('data-action');
    if (action === 'new') startNewChat();
    if (action === 'history') {
      if (historyEl.classList.contains('hidden')) {
        loadHistory();
      } else {
        hideHistory();
      }
    }
    if (action === 'clear') clearCurrentChat();
  });

  historyEl.addEventListener('click', function (event) {
    var button = event.target.closest('[data-session-id]');
    if (!button) return;
    loadSessionMessages(button.getAttribute('data-session-id'));
  });

  suggestionsEl.addEventListener('click', function (event) {
    var button = event.target.closest('[data-question]');
    if (!button) return;
    sendQuestion(button.getAttribute('data-question'));
  });

  quickLinksEl.addEventListener('click', function (event) {
    var button = event.target.closest('[data-target]');
    if (!button) return;
    var target = button.getAttribute('data-target');
    addMessage('assistant', button.getAttribute('data-response') || 'Opening section.');
    window.location.href = getSectionUrl(target);
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    sendQuestion(input.value);
  });

  messagesEl.addEventListener('click', function (event) {
    var button = event.target.closest('.ai-chatbot-feedback-btn');
    if (!button) return;
    var messageId = button.getAttribute('data-message-id');
    var rating = button.getAttribute('data-rating');
    fetch('/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: messageId,
        rating: rating,
        visitorId: getVisitorId()
      })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok || !data.ok) throw new Error(data && data.error ? data.error : 'Could not save feedback.');
          return data;
        });
      })
      .then(function () {
        var group = button.closest('.ai-chatbot-feedback');
        if (!group) return;
        group.querySelectorAll('.ai-chatbot-feedback-btn').forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
      })
      .catch(function () {
        addMessage('assistant', 'Feedback could not be saved right now.');
      });
  });

  loadSettings();
});
