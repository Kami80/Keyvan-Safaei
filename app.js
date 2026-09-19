(() => {
  'use strict';
  const themeToggles = [...document.querySelectorAll('.theme-toggle')];
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('keyvan-theme'); } catch {}
  function applyTheme(theme, persist = true) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    themeToggles.forEach(toggle => {
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', dark ? 'Switch to light appearance' : 'Switch to dark appearance');
      const label = toggle.querySelector('#theme-toggle-label');
      if (label) label.textContent = dark ? 'Light appearance' : 'Dark appearance';
    });
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#000000' : '#f5f5f7');
    if (persist) { savedTheme = dark ? 'dark' : 'light'; try { localStorage.setItem('keyvan-theme', savedTheme); } catch {} }
  }
  applyTheme(savedTheme || (systemTheme.matches ? 'dark' : 'light'), false);
  themeToggles.forEach(toggle => toggle.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')));
  systemTheme.addEventListener?.('change', event => { if (!savedTheme) applyTheme(event.matches ? 'dark' : 'light', false); });

  const publications = JSON.parse(document.getElementById('publication-data').textContent);
  const papers = new Map(publications.map(p => [p.id, p]));
  const cards = [...document.querySelectorAll('.publication-card')];
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const search = document.getElementById('publication-search');
  let activeFilter = 'All';

  document.getElementById('publication-controls').hidden = false;
  function filterPublications() {
    const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach(card => {
      const visible = (activeFilter === 'All' || card.dataset.category === activeFilter) && terms.every(term => card.dataset.search.includes(term));
      card.hidden = !visible;
      if (visible) count++;
    });
    filterButtons.forEach(button => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('result-count').textContent = `${count} ${count === 1 ? 'publication' : 'publications'}${activeFilter === 'All' && !terms.length ? ' selected' : ' found'}`;
    document.getElementById('empty-state').hidden = count !== 0;
  }
  filterButtons.forEach(button => button.addEventListener('click', () => {activeFilter = button.dataset.filter; filterPublications();}));
  search.addEventListener('input', filterPublications);
  document.getElementById('reset-search').addEventListener('click', () => {activeFilter = 'All'; search.value = ''; filterPublications(); search.focus();});
  document.querySelectorAll('[data-research-filter]').forEach(link => link.addEventListener('click', () => {activeFilter = link.dataset.researchFilter; search.value = ''; filterPublications();}));

  const menu = document.getElementById('main-nav');
  const menuButton = document.querySelector('.menu-toggle');
  function closeMenu() {menu.classList.remove('is-open'); menuButton?.setAttribute('aria-expanded', 'false'); menuButton?.setAttribute('aria-label', 'Open navigation');}
  menuButton?.addEventListener('click', () => {const open = menu.classList.toggle('is-open'); menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');});
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.querySelectorAll('.mobile-footer-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {if (event.key === 'Escape') closeMenu();});
  document.addEventListener('click', event => {if (!event.target.closest('.site-header')) closeMenu();});
  matchMedia('(min-width: 601px)').addEventListener('change', event => {if (event.matches) closeMenu();});

  const dialogs = [...document.querySelectorAll('dialog')];
  let returnFocus;
  function openDialog(dialog, trigger) {returnFocus = trigger; dialog.showModal(); document.body.classList.add('modal-open');}
  dialogs.forEach(dialog => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {document.body.classList.remove('modal-open'); returnFocus?.focus({preventScroll:true});});
  });

  const contactDialog = document.getElementById('contact-dialog');
  const contactFab = document.getElementById('contact-fab');
  contactFab?.addEventListener('click', () => openDialog(contactDialog, contactFab));

  const figureDialog = document.getElementById('figure-dialog');
  let currentPaper, currentFigure = 0;
  function renderFigure() {
    const figure = currentPaper.figures[currentFigure];
    const image = document.getElementById('expanded-figure');
    image.src = `assets/figures/${figure.file}.webp`;
    image.alt = figure.caption;
    document.getElementById('figure-paper-year').textContent = `${currentPaper.journal} / ${currentPaper.year}`;
    document.getElementById('figure-dialog-title').textContent = currentPaper.title;
    document.getElementById('figure-caption').textContent = `Figure ${figure.number}. ${figure.caption}`;
    document.getElementById('figure-position').textContent = `${currentFigure + 1} / ${currentPaper.figures.length}`;
    document.getElementById('figure-credit').textContent = currentPaper.credit;
    document.getElementById('figure-source').href = currentPaper.url;
    document.getElementById('figure-license').href = currentPaper.licenseUrl;
    document.getElementById('figure-license').textContent = currentPaper.license;
    document.getElementById('figure-original').href = image.src;
    document.getElementById('previous-figure').disabled = currentFigure === 0;
    document.getElementById('next-figure').disabled = currentFigure === currentPaper.figures.length - 1;
  }
  document.querySelectorAll('[data-open-figure]').forEach(button => button.addEventListener('click', () => {
    currentPaper = papers.get(button.dataset.openFigure);
    currentFigure = Number(button.dataset.figureIndex);
    renderFigure(); openDialog(figureDialog, button);
  }));
  function advanceFigure(direction) {const next = currentFigure + direction; if (next >= 0 && next < currentPaper.figures.length) {currentFigure = next; renderFigure();}}
  document.getElementById('previous-figure').addEventListener('click', () => advanceFigure(-1));
  document.getElementById('next-figure').addEventListener('click', () => advanceFigure(1));
  figureDialog.addEventListener('keydown', event => {if (event.key === 'ArrowLeft') {event.preventDefault(); advanceFigure(-1);} if (event.key === 'ArrowRight') {event.preventDefault(); advanceFigure(1);}});

  let citationPaper;
  const citationDialog = document.getElementById('citation-dialog');
  const citationText = document.getElementById('citation-text');
  const copyStatus = document.getElementById('copy-status');
  function bibtex(paper) {
    return `@article{${paper.id.replaceAll('-', '')}${paper.year},\n  title = {${paper.title}},\n  author = {${paper.authors.split(', ').join(' and ')}},\n  journal = {${paper.journal}},\n  year = {${paper.year}},\n  doi = {${paper.doi}},\n  url = {https://doi.org/${paper.doi}}\n}`;
  }
  document.querySelectorAll('[data-cite]').forEach(button => button.addEventListener('click', () => {
    citationPaper = papers.get(button.dataset.cite);
    citationText.value = bibtex(citationPaper);
    document.getElementById('citation-paper-title').textContent = citationPaper.title;
    copyStatus.textContent = '';
    document.getElementById('copy-citation').textContent = 'Copy BibTeX';
    openDialog(citationDialog, button);
  }));
  document.getElementById('copy-citation').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(citationText.value);
      copyStatus.textContent = 'Citation copied.';
      document.getElementById('copy-citation').textContent = 'Copied';
    } catch {
      citationText.focus(); citationText.select();
      copyStatus.textContent = 'Citation selected. Use your keyboard to copy.';
    }
  });
  document.getElementById('download-citation').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([citationText.value], {type:'application/x-bibtex;charset=utf-8'}));
    const link = document.createElement('a');link.href = url;link.download = `${citationPaper.id}.bib`;document.body.append(link);link.click();link.remove();setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById('print-profile').addEventListener('click', () => window.print());

  if ('IntersectionObserver' in window) {
    const navLinks = [...menu.querySelectorAll('a[href^="#"]'), ...document.querySelectorAll('.mobile-footer-nav a[href^="#"]')];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {if(entry.isIntersecting) navLinks.forEach(link => {if(link.hash === `#${entry.target.id}`) link.setAttribute('aria-current','true'); else link.removeAttribute('aria-current');});});
    }, {rootMargin:'-15% 0px -65% 0px',threshold:0});
    document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
  }
})();
