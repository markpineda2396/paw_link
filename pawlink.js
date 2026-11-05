/* PawLink theme persistence and temporary showcase report posting. */
(() => {
  const themeToggle = document.querySelector('#theme-toggle');
  const savedTheme = localStorage.getItem('pawlink-theme') === 'dark' ? 'dark' : 'light';
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (themeToggle) themeToggle.checked = theme === 'dark';
    localStorage.setItem('pawlink-theme', theme);
  };
  applyTheme(savedTheme);
  themeToggle?.addEventListener('change', () => applyTheme(themeToggle.checked ? 'dark' : 'light'));

  const forum = document.querySelector('#forum-posts');
  const reportForm = document.querySelector('#report-form');
  if (forum) {
    try {
      const report = sessionStorage.getItem('pawlink-pending-report');
      if (report) {
        const data = JSON.parse(report);
        const post = document.createElement('article');
        post.className = 'forum-post new-forum-post';
        const avatar = document.createElement('div');
        avatar.className = 'post-avatar ' + (data.type === 'Found pet' ? 'found-avatar' : 'lost-avatar');
        avatar.innerHTML = '<i class="fa-solid fa-paw" aria-hidden="true"></i>';
        const body = document.createElement('div'); body.className = 'post-body';
        const meta = document.createElement('div'); meta.className = 'post-meta';
        const badge = document.createElement('span'); badge.className = 'post-label ' + (data.type === 'Found pet' ? 'found-label' : 'lost-label'); badge.textContent = data.type;
        const time = document.createElement('span'); time.textContent = data.area + ' · Just now';
        meta.append(badge, time);
        const heading = document.createElement('h3'); heading.textContent = data.pet;
        const details = document.createElement('p'); details.textContent = data.details;
        const footer = document.createElement('div'); footer.className = 'post-footer';
        const contact = document.createElement('span'); contact.textContent = 'Community report';
        const email = document.createElement('a'); email.href = 'mailto:' + encodeURIComponent(data.contact); email.textContent = 'Contact reporter';
        footer.append(contact, email); body.append(meta, heading, details, footer); post.append(avatar, body);
        forum.insertBefore(post, forum.querySelector('.forum-post'));
        sessionStorage.removeItem('pawlink-pending-report');
      }
    } catch (_) { sessionStorage.removeItem('pawlink-pending-report'); }
  }
  reportForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!reportForm.reportValidity()) return;
    const values = new FormData(reportForm);
    const report = { type: values.get('type'), pet: values.get('pet'), area: values.get('area'), contact: values.get('contact'), details: values.get('details') };
    sessionStorage.setItem('pawlink-pending-report', JSON.stringify(report));
    window.location.href = 'reports.html#forum-posts';
  });
})();
