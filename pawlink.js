/* PawLink browser demo: theme, profile, temporary reports, and marketplace interactions. */
(() => {
  const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (_) { return fallback; } };
  const themeToggle = document.querySelector('#theme-toggle');
  const setTheme = (theme) => {
    const value = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
    if (themeToggle) themeToggle.checked = value === 'dark';
    localStorage.setItem('pawlink-theme', value);
  };
  setTheme(localStorage.getItem('pawlink-theme'));
  themeToggle?.addEventListener('change', () => setTheme(themeToggle.checked ? 'dark' : 'light'));

  const profileKey = 'pawlink-user';
  const profile = readJSON(profileKey, {});
  const profileForm = document.querySelector('#profile-edit-form');
  if (profileForm) {
    ['name','email','phone','age','city','interest'].forEach((key) => {
      const field = profileForm.elements.namedItem(key);
      if (field && profile[key]) field.value = profile[key];
      const view = document.querySelector(`[data-profile="${key}"]`);
      if (view) view.textContent = profile[key] || (key === 'interest' ? 'Not selected' : 'Not provided');
    });
    const show = (editing) => {
      document.querySelector('#profile-preview')?.toggleAttribute('hidden', editing);
      document.querySelector('#profile-edit')?.toggleAttribute('hidden', !editing);
    };
    document.querySelector('#profile-edit-button')?.addEventListener('click', () => show(true));
    document.querySelector('#profile-cancel-button')?.addEventListener('click', () => { profileForm.reset(); Object.keys(profile).forEach((key) => { if (profileForm.elements.namedItem(key)) profileForm.elements.namedItem(key).value = profile[key]; }); show(false); });
    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!profileForm.reportValidity()) return;
      const data = Object.fromEntries(new FormData(profileForm).entries());
      localStorage.setItem(profileKey, JSON.stringify({...readJSON(profileKey, {}), ...data}));
      location.reload();
    });
  }

  const registerForm = document.querySelector('#register-form');
  registerForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!registerForm.reportValidity()) return;
    const data = Object.fromEntries(new FormData(registerForm).entries());
    localStorage.setItem(profileKey, JSON.stringify(data));
    location.href = 'onboarding.html';
  });
  const loginForm = document.querySelector('#login-form');
  loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    const email = String(new FormData(loginForm).get('email') || '').trim().toLowerCase();
    const saved = readJSON(profileKey, {});
    if (saved.email && saved.email.toLowerCase() === email) location.href = 'dashboard.html';
    else {
      const message = document.querySelector('#login-message');
      if (message) message.textContent = 'No matching demo profile was found. Please register first using this browser.';
    }
  });

  const reportForm = document.querySelector('#report-form');
  const forum = document.querySelector('#forum-posts');
  const renderReport = (data) => {
    if (!forum) return;
    const post = document.createElement('article'); post.className = 'forum-post new-forum-post';
    if (data.image) { const image = document.createElement('img'); image.className = 'report-photo'; image.src = data.image; image.alt = `Photo for ${data.pet}`; post.append(image); }
    const body = document.createElement('div'); body.className = 'post-body';
    const meta = document.createElement('div'); meta.className = 'post-meta';
    const tag = document.createElement('span'); tag.className = `post-label ${data.type === 'Found pet' ? 'found-label' : 'lost-label'}`; tag.textContent = data.type;
    const location = document.createElement('span'); location.textContent = `${data.area} · Just now`; meta.append(tag, location);
    const heading = document.createElement('h3'); heading.textContent = data.pet;
    const details = document.createElement('p'); details.textContent = data.details;
    const contact = document.createElement('p'); contact.className = 'report-contact'; contact.textContent = `Contact: ${data.contact}`;
    body.append(meta, heading, details, contact); post.append(body); forum.insertBefore(post, forum.querySelector('.forum-post'));
  };
  if (forum) {
    try { const report = sessionStorage.getItem('pawlink-pending-report'); if (report) { renderReport(JSON.parse(report)); sessionStorage.removeItem('pawlink-pending-report'); } } catch (_) { sessionStorage.removeItem('pawlink-pending-report'); }
  }
  reportForm?.addEventListener('submit', (event) => {
    event.preventDefault(); if (!reportForm.reportValidity()) return;
    const values = new FormData(reportForm); const file = values.get('image');
    const submit = (image = '') => {
      const report = {type:values.get('type'),pet:values.get('pet'),area:values.get('area'),contact:values.get('contact'),details:values.get('details'),image};
      try { sessionStorage.setItem('pawlink-pending-report', JSON.stringify(report)); location.href = 'reports.html#forum-posts'; }
      catch (_) { const status = document.querySelector('#report-status'); if (status) status.textContent = 'Image is too large for this temporary browser demo. Choose a smaller image and try again.'; }
    };
    if (file instanceof File && file.size) {
      if (!file.type.startsWith('image/') || file.size > 1200000) { const status=document.querySelector('#report-status'); if(status) status.textContent='Please choose an image smaller than 1.2 MB.'; return; }
      const reader = new FileReader(); reader.onload = () => submit(String(reader.result)); reader.onerror = () => submit(); reader.readAsDataURL(file);
    } else submit();
  });

  const marketGrid = document.querySelector('#market-listings');
  const marketForm = document.querySelector('#sale-form');
  const userListingsKey = 'pawlink-market-listings';
  const commentsKey = 'pawlink-market-comments';
  const makeProductCard = (product, userCreated = false) => {
    const card = document.createElement('article'); card.className = 'product-card';
    if (product.image) { const img = document.createElement('img'); img.className='product-image'; img.src=product.image; img.alt=product.name; card.append(img); }
    else { const pic=document.createElement('div'); pic.className=`product-image ${product.photo || 'product-food'}`; pic.setAttribute('role','img'); pic.setAttribute('aria-label',product.name); card.append(pic); }
    const content=document.createElement('div'); content.className='product-content';
    const name=document.createElement('h3'); name.textContent=product.name;
    const price=document.createElement('strong'); price.className='product-price'; price.textContent=`$${Number(product.price).toFixed(2)} · Demo listing`;
    const description=document.createElement('p'); description.textContent=product.description;
    const rating=document.createElement('p'); rating.className='product-rating'; rating.textContent=product.rating ? `★★★★★ ${product.rating} · ${product.reviewCount || 0} reviews` : 'New listing';
    const actions=document.createElement('div'); actions.className='product-actions';
    const buy=document.createElement('button'); buy.type='button'; buy.className='button button-primary demo-buy'; buy.textContent='Demo purchase'; buy.addEventListener('click',()=>{buy.textContent='Demo purchase noted';buy.disabled=true;const note=card.querySelector('.purchase-note');if(note)note.hidden=false;});
    const note=document.createElement('p');note.className='purchase-note';note.hidden=true;note.textContent='Showcase only — no payment or order was made.';
    actions.append(buy);
    if(userCreated){const remove=document.createElement('button');remove.type='button';remove.className='text-button delist-button';remove.textContent='Delist my item';remove.addEventListener('click',()=>{const items=readJSON(userListingsKey,[]).filter(item=>item.id!==product.id);localStorage.setItem(userListingsKey,JSON.stringify(items));card.remove();});actions.append(remove);}
    const comments=document.createElement('div');comments.className='product-comments';const commentList=document.createElement('div');commentList.className='comment-list';commentList.dataset.productId=product.id;
    const allComments=readJSON(commentsKey,{});(allComments[product.id]||[]).forEach(text=>{const p=document.createElement('p');p.textContent=text;commentList.append(p);});
    const form=document.createElement('form');form.className='comment-form';const input=document.createElement('input');input.name='comment';input.maxLength=180;input.placeholder='Write a review or comment';input.required=true;input.setAttribute('aria-label',`Review ${product.name}`);const submit=document.createElement('button');submit.type='submit';submit.textContent='Add';form.append(input,submit);
    form.addEventListener('submit',(event)=>{event.preventDefault();const text=input.value.trim();if(!text)return;const store=readJSON(commentsKey,{});store[product.id]=[...(store[product.id]||[]),text].slice(-30);localStorage.setItem(commentsKey,JSON.stringify(store));const p=document.createElement('p');p.textContent=text;commentList.append(p);input.value='';});
    comments.append(commentList,form);content.append(name,price,description,rating,actions,note,comments);card.append(content);return card;
  };
  if(marketGrid){
    const existing=[...marketGrid.querySelectorAll('[data-product]')];
    existing.forEach(card=>{
      const product={id:card.dataset.id,name:card.dataset.name,price:Number(card.dataset.price),description:card.dataset.description,rating:card.dataset.rating,reviewCount:card.dataset.reviews,photo:card.dataset.photo};
      const replacement=makeProductCard(product,false);card.replaceWith(replacement);
    });
    readJSON(userListingsKey,[]).forEach(product=>marketGrid.prepend(makeProductCard(product,true)));
  }
  marketForm?.addEventListener('submit',(event)=>{
    event.preventDefault();if(!marketForm.reportValidity())return;
    const values=new FormData(marketForm);const file=values.get('image');
    const save=(image='')=>{const listing={id:`user-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:String(values.get('name')).trim(),price:Number(values.get('price')),description:String(values.get('description')).trim(),rating:'',reviewCount:0,image};const items=readJSON(userListingsKey,[]);items.unshift(listing);try{localStorage.setItem(userListingsKey,JSON.stringify(items));location.reload();}catch(_){const status=document.querySelector('#sale-status');if(status)status.textContent='Could not save this image; please use a smaller file.';}};
    if(file instanceof File&&file.size){if(!file.type.startsWith('image/')||file.size>900000){const status=document.querySelector('#sale-status');if(status)status.textContent='Choose an image smaller than 900 KB.';return;}const reader=new FileReader();reader.onload=()=>save(String(reader.result));reader.onerror=()=>save();reader.readAsDataURL(file);}else save();
  });
})();
