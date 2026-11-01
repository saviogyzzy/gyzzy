(() => {
  'use strict';
  const search = document.getElementById('manual-search');
  const articles = Array.from(document.querySelectorAll('article.guide'));
  if (!search || !articles.length) return;
  document.documentElement.classList.add('js');
  const clear = document.getElementById('clear-search');
  const count = document.getElementById('result-count');
  const empty = document.getElementById('no-results');
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.getElementById('toc-toggle');
  const filters = Array.from(document.querySelectorAll('[data-category]'));
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const texts = new Map(articles.map(article => [article, normalize(article.textContent + ' ' + article.dataset.keywords)]));
  let category = 'all';
  let printState = null;
  for (const id of ['search-wrap', 'search-hint', 'filters', 'print-manual', 'toc-toggle']) document.getElementById(id).hidden = false;

  function filter() {
    const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const article of articles) {
      const match = (category === 'all' || category === article.dataset.group) && words.every(word => texts.get(article).includes(word));
      article.hidden = !match;
      if (match) visible++;
    }
    clear.hidden = !search.value;
    empty.hidden = visible > 0;
    count.textContent = !words.length && category === 'all' ? articles.length + ' guias disponíveis' : visible + (visible === 1 ? ' guia encontrado' : ' guias encontrados');
    for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.category === category));
  }
  function reset(focus = false) {
    search.value = '';
    category = 'all';
    filter();
    if (focus) search.focus();
  }
  function closeIndex() {
    sidebar.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function revealHash(hash) {
    let id;
    try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return; }
    const target = document.getElementById(id);
    if (target && target.closest('article.guide')) reset();
  }
  search.addEventListener('input', filter);
  clear.addEventListener('click', () => reset(true));
  document.getElementById('reset-search').addEventListener('click', () => reset(true));
  for (const button of filters) button.addEventListener('click', () => { category = button.dataset.category; filter(); });
  toggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor) return;
    revealHash(anchor.hash);
    closeIndex();
  });
  window.addEventListener('hashchange', () => revealHash(location.hash));
  document.addEventListener('keydown', event => {
    const editing = event.target instanceof Element && (event.target.closest('input,textarea,select,[contenteditable="true"]'));
    if ((event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault();
      search.focus();
      search.select();
    }
    if (event.key === 'Escape') { if (event.target === search) reset(); closeIndex(); }
  });
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = {search: search.value, category, details: Array.from(document.querySelectorAll('details')).map(element => [element, element.open])};
    reset();
    for (const [element] of printState.details) element.open = true;
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    for (const [element, open] of printState.details) element.open = open;
    search.value = printState.search;
    category = printState.category;
    printState = null;
    filter();
  });
  document.getElementById('print-manual').addEventListener('click', () => window.print());
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        for (const anchor of document.querySelectorAll('.toc a')) {
          if (anchor.hash === '#' + entry.target.id) anchor.setAttribute('aria-current', 'location');
          else anchor.removeAttribute('aria-current');
        }
      }
    }, {rootMargin: '-100px 0px -65% 0px', threshold: 0});
    for (const article of articles) observer.observe(article);
  }
  revealHash(location.hash);
  filter();
})();
