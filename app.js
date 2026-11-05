(() => {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('pawlink-theme');
  if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem('pawlink-theme', theme);
    const selector = document.querySelector('#theme-select');
    if (selector) selector.value = theme;
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
      button.classList.toggle('selected', button.dataset.themeChoice === theme);
    });
  };

  const loginForm = document.querySelector('#login-form');
  if (loginForm) loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.querySelector('#email').value.trim();
    localStorage.setItem('pawlink-user', JSON.stringify({ name: email.includes('@') ? email.split('@')[0] : 'Pet lover', email }));
    // Existing users go directly to their home; first-run setup is only for registration.
    window.location.href = 'dashboard.html';
  });

  const registerForm = document.querySelector('#register-form');
  if (registerForm) registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = new FormData(registerForm);
    localStorage.setItem('pawlink-user', JSON.stringify({ name: values.get('full_name'), email: values.get('email'), city: values.get('city'), interest: values.get('interest') }));
    window.location.href = 'onboarding.html';
  });

  const setupPage = document.querySelector('.setup-page');
  if (setupPage) {
    let step = 1;
    const showStep = (next) => {
      step = next;
      setupPage.querySelectorAll('.setup-step').forEach((panel) => { panel.hidden = Number(panel.dataset.step) !== step; });
      document.querySelector('#step-label').textContent = `STEP ${step} OF 2`;
      document.querySelector('#progress-fill').style.width = step === 1 ? '50%' : '100%';
      document.querySelector('#setup-back').hidden = step === 1;
      document.querySelector('#setup-next').innerHTML = step === 1 ? 'Continue <i class="fa-solid fa-arrow-right"></i>' : 'Go to home <i class="fa-solid fa-arrow-right"></i>';
      document.querySelector('#setup-skip').textContent = step === 1 ? 'Skip for now' : 'Finish setup later';
    };
    const completeSetup = () => {
      const prefs = [...document.querySelectorAll('input[name="preferences"]:checked')].map((input) => input.value);
      localStorage.setItem('pawlink-preferences', JSON.stringify({ interests: prefs, location: document.querySelector('#setup-location').value.trim(), notifications: document.querySelector('#setup-notifications').checked }));
      window.location.href = 'dashboard.html';
    };
    document.querySelectorAll('[data-theme-choice]').forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.themeChoice)));
    document.querySelector('#setup-next').addEventListener('click', () => step === 1 ? showStep(2) : completeSetup());
    document.querySelector('#setup-back').addEventListener('click', () => showStep(1));
    document.querySelector('#setup-skip').addEventListener('click', completeSetup);
    showStep(1);
  }

  const dashboard = document.querySelector('.app-shell');
  if (dashboard) {
    let user = {};
    try { user = JSON.parse(localStorage.getItem('pawlink-user') || '{}'); } catch (_) { user = {}; }
    const friendlyName = (user.name || 'friend').trim().split(/\s+/)[0];
    document.querySelector('#welcome-name').textContent = friendlyName;
    document.querySelector('#profile-display-name').textContent = user.name || 'Pet lover';
    document.querySelector('#profile-display-email').textContent = user.email || 'Welcome to PawLink';
    const avatar = document.querySelector('.avatar');
    avatar.textContent = friendlyName.charAt(0).toUpperCase() || 'P';

    const notificationButton = document.querySelector('#notifications-button');
    const notificationPopover = document.querySelector('#notification-popover');
    const profileButton = document.querySelector('#profile-button');
    const profilePopover = document.querySelector('#profile-popover');
    notificationButton.addEventListener('click', () => {
      const opening = notificationPopover.hidden;
      notificationPopover.hidden = !opening;
      profilePopover.hidden = true;
      notificationButton.setAttribute('aria-expanded', String(opening));
    });
    profileButton.addEventListener('click', () => {
      profilePopover.hidden = !profilePopover.hidden;
      notificationPopover.hidden = true;
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#notifications-button, #notification-popover')) { notificationPopover.hidden = true; notificationButton.setAttribute('aria-expanded', 'false'); }
      if (!event.target.closest('#profile-button, #profile-popover')) profilePopover.hidden = true;
    });

    const dialog = document.querySelector('#settings-dialog');
    const openSettings = () => { document.querySelector('#theme-select').value = root.dataset.theme || 'light'; dialog.showModal(); };
    document.querySelector('#settings-button').addEventListener('click', openSettings);
    document.querySelector('#profile-settings').addEventListener('click', () => { profilePopover.hidden = true; openSettings(); });
    document.querySelector('#theme-select').addEventListener('change', (event) => { applyTheme(event.target.value); document.querySelector('#settings-saved').textContent = 'Appearance updated.'; });
    const noticePreference = document.querySelector('#notifications-setting');
    try { const preferences = JSON.parse(localStorage.getItem('pawlink-preferences') || '{}'); if (typeof preferences.notifications === 'boolean') noticePreference.checked = preferences.notifications; } catch (_) { /* use the default */ }
    noticePreference.addEventListener('change', () => {
      let preferences = {};
      try { preferences = JSON.parse(localStorage.getItem('pawlink-preferences') || '{}'); } catch (_) { /* start fresh */ }
      preferences.notifications = noticePreference.checked;
      localStorage.setItem('pawlink-preferences', JSON.stringify(preferences));
      document.querySelector('#settings-saved').textContent = 'Notification preference saved.';
    });

    document.querySelector('#pet-search').addEventListener('input', (event) => {
      const query = event.target.value.trim().toLowerCase();
      let visible = 0;
      document.querySelectorAll('.pet-card').forEach((card) => {
        const match = card.dataset.search.includes(query);
        card.hidden = !match;
        if (match) visible += 1;
      });
      document.querySelector('#empty-search').hidden = visible > 0;
    });
    document.querySelectorAll('.favorite-button').forEach((button) => button.addEventListener('click', () => {
      const active = button.classList.toggle('is-favorite');
      button.innerHTML = active ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-regular fa-heart"></i>';
      button.setAttribute('aria-pressed', String(active));
    }));
    document.querySelectorAll('.pet-cta').forEach((button) => button.addEventListener('click', () => {
      const pet = button.closest('.pet-card').querySelector('h3').textContent;
      button.textContent = `Thanks for your interest in ${pet}!`;
    }));
  }
})();
