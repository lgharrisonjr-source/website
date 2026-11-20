// FinancialTherapy360 design preview — shared behaviour.
(function () {
  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  // Demo notices (login and account pages). No real authentication is connected.
  function showNotice(id, message) {
    var el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  var signin = document.getElementById('demo-signin');
  if (signin) {
    signin.addEventListener('click', function (event) {
      event.preventDefault();
      showNotice('login-status', 'Secure sign-in is not connected yet. This preview continues with a fictional sample member.');
      var go = document.getElementById('demo-continue');
      if (go) go.hidden = false;
    });
  }
  var create = document.getElementById('demo-create');
  if (create) {
    create.addEventListener('click', function (event) {
      event.preventDefault();
      showNotice('login-status', 'Account registration opens at launch. For now, continue to the demo to explore the design.');
      var go = document.getElementById('demo-continue');
      if (go) go.hidden = false;
    });
  }
  var forgot = document.getElementById('demo-forgot');
  if (forgot) {
    forgot.addEventListener('click', function (event) {
      event.preventDefault();
      showNotice('login-status', 'Password recovery is not connected in this preview.');
    });
  }

  // My Account preview: consent toggles persist in this browser only.
  var CONSENT_KEY = 'ft360-site-consent.v1';
  var toggles = Array.prototype.slice.call(document.querySelectorAll('.toggle'));
  function saveConsent() {
    var state = {};
    toggles.forEach(function (t) { state[t.dataset.category] = t.getAttribute('aria-checked') === 'true'; });
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function loadConsent() {
    try {
      var state = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (state) {
        toggles.forEach(function (t) {
          if (Object.prototype.hasOwnProperty.call(state, t.dataset.category)) {
            t.setAttribute('aria-checked', String(!!state[t.dataset.category]));
          }
        });
      }
    } catch (e) {}
  }
  if (toggles.length) {
    loadConsent();
    toggles.forEach(function (t) {
      t.addEventListener('click', function () {
        t.setAttribute('aria-checked', String(t.getAttribute('aria-checked') !== 'true'));
        saveConsent();
        showNotice('consent-status', 'Preview choice saved in this browser only. Consent controls are enforced once accounts are connected.');
      });
      t.addEventListener('keydown', function (event) {
        if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); t.click(); }
      });
    });
  }

  // Privacy demo buttons
  var download = document.getElementById('demo-download');
  if (download) {
    download.addEventListener('click', function () {
      showNotice('privacy-status', 'Data export is not connected in this preview. At launch you will be able to download your information.');
    });
  }
  var del = document.getElementById('demo-delete');
  if (del) {
    del.addEventListener('click', function () {
      showNotice('privacy-status', 'Deletion requests are not connected in this preview. At launch, requesting deletion stops new processing and starts the disclosed retention and deletion workflow.');
    });
  }
  var signout = document.getElementById('demo-signout');
  if (signout) {
    signout.addEventListener('click', function () { window.location.href = 'login.html'; });
  }

  // Internal preview: finding review demo states.
  var reviewButtons = document.querySelectorAll('[data-review-action]');
  if (reviewButtons.length) {
    reviewButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        reviewButtons.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        showNotice('review-status', 'Demo only: marked "' + b.textContent.trim() + '". No case record was changed.');
      });
    });
  }
})();

/* Demo session + name menu (design preview only; no real authentication). */
(function () {
  var SESSION_KEY = 'ft360-demo-session.v1';
  function sessionOn() { try { return localStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; } }
  function sessionSet() { try { localStorage.setItem(SESSION_KEY, '1'); } catch (e) {} }
  function sessionClear() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

  // Starting the demo from the sign-in page marks the fictional session.
  var signin = document.getElementById('demo-signin');
  if (signin) signin.addEventListener('click', function () { sessionSet(); renderMemberMenu(); });
  var create = document.getElementById('demo-create');
  if (create) create.addEventListener('click', function () { sessionSet(); renderMemberMenu(); });

  // Swap the Sign in button for a name menu when the demo session is active.
  if (document.body.hasAttribute('data-demo-member')) sessionSet();
  function renderMemberMenu() {
  var signinLink = document.querySelector('#site-nav [data-signin]');
  if (signinLink && sessionOn()) {
    var menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML =
      '<button type="button" class="user-menu-btn" aria-haspopup="true" aria-expanded="false">' +
      '<span class="welcome-name"><small>Welcome</small><span>Alex Morgan</span></span><span class="user-menu-tag">demo</span>' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>' +
      '<div class="user-menu-list" role="menu" hidden>' +
      '<a role="menuitem" href="settings.html">Settings</a>' +
      '<a role="menuitem" href="dashboard.html">Dashboard</a>' +
      '<a role="menuitem" href="#" data-demo-logout>Log out</a>' +
      '</div>';
    signinLink.replaceWith(menu);
    var btn = menu.querySelector('.user-menu-btn');
    var list = menu.querySelector('.user-menu-list');
    btn.addEventListener('click', function () {
      var open = list.hidden;
      list.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (event) {
      if (!menu.contains(event.target)) { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
  }

  document.querySelectorAll('[data-demo-logout]').forEach(function (a) {
    a.addEventListener('click', function (event) {
      event.preventDefault();
      sessionClear();
      window.location.href = 'index.html';
    });
  });
  }
  renderMemberMenu();
  var signout = document.getElementById('demo-signout');
  if (signout) signout.addEventListener('click', sessionClear);

  // Demo forms: never send anything; say so plainly.
  document.querySelectorAll('form[data-demo-form]').forEach(function (f) {
    f.addEventListener('submit', function (event) {
      event.preventDefault();
      var note = document.getElementById(f.getAttribute('data-note'));
      if (note) note.textContent = 'Preview only: this form is not connected yet, so nothing was sent or stored. Working contact forms arrive with the launch backend.';
      f.reset();
    });
  });

  // Demo buttons with a fixed explanation.
  document.querySelectorAll('[data-demo-btn]').forEach(function (b) {
    b.addEventListener('click', function () {
      var note = document.getElementById(b.getAttribute('data-note'));
      if (note) note.textContent = b.getAttribute('data-message');
    });
  });
})();

// Uploaded-files demonstration: only fictional rows on this page change.
(function () {
  var table = document.querySelector('.files-table');
  if (!table) return;
  var active, editor = document.getElementById('file-editor'), confirm = document.getElementById('file-delete-confirm'), status = document.getElementById('files-status');
  function close() { editor.hidden = true; confirm.hidden = true; }
  table.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    active = button.closest('tr'); close();
    if (button.hasAttribute('data-file-update')) {
      editor.hidden = false;
      document.getElementById('file-category').value = active.querySelector('[data-label="Category"]').textContent;
      editor.scrollIntoView({block:'center'}); document.getElementById('file-category').focus();
    } else {
      confirm.hidden = false;
      document.getElementById('file-delete-name').textContent = (active.querySelector('.file-title') || active.querySelector('td')).textContent;
      confirm.scrollIntoView({block:'center'}); document.getElementById('file-delete-save').focus();
    }
  });
  document.querySelectorAll('[data-file-cancel]').forEach(function (b) { b.addEventListener('click', function () { close(); active.querySelector('button').focus(); }); });
  document.getElementById('file-save').addEventListener('click', function () {
    active.querySelector('[data-label="Category"]').textContent = document.getElementById('file-category').value;
    active.querySelector('[data-file-status]').textContent = 'Awaiting review (sample update)';
    status.textContent = 'Sample update applied on this page only. No real file was uploaded or changed. Reloading restores the fictional list.';
    close(); active.querySelector('button').focus();
  });
  document.getElementById('file-delete-save').addEventListener('click', function () {
    var name = (active.querySelector('.file-title') || active.querySelector('td')).textContent; active.remove(); close(); if(document.getElementById('file-search'))document.getElementById('file-search').dispatchEvent(new Event('input'));
    status.textContent = name + ' removed from this fictional list only. No real document was deleted. Reloading restores the sample.';
    status.setAttribute('tabindex','-1'); status.focus();
  });
})();

// Local-only profile design review. No data is stored or transmitted.
(function(){
 var state=document.getElementById('address-state'),county=document.getElementById('address-county');
 if(state) state.addEventListener('change',function(){
   county.replaceChildren(new Option(state.value?'Select a county or equivalent':'Choose a state first',''));
   county.disabled=!state.value;
   if(state.value) window.FT360_STATES[state.value].counties.forEach(function(name){county.add(new Option(name,name));});
   document.getElementById('county-help').textContent=state.value?'Showing '+window.FT360_STATES[state.value].counties.length+' counties or equivalents for '+window.FT360_STATES[state.value].name+'.':'County options depend on the selected state.';
 });
 var form=document.getElementById('personal-preview-form');
 if(form) form.addEventListener('submit',function(e){e.preventDefault();document.getElementById('personal-save-status').textContent='Preview only: nothing was submitted or saved. These fields demonstrate the planned layout.';});
 var search=document.getElementById('file-search');
 if(search) search.addEventListener('input',function(){var rows=[].slice.call(document.querySelectorAll('[data-file-row]')),q=search.value.toLowerCase();rows.forEach(function(row){row.hidden=!row.textContent.toLowerCase().includes(q);});document.getElementById('file-count').textContent=rows.filter(function(row){return !row.hidden;}).length+' of '+rows.length+' sample files';});
})();
