// Pagefind search integration for command dialog
// Lazy-loads Pagefind on first use, renders results as menuitem elements

let pagefind = null;

async function loadPagefind() {
  if (!pagefind) {
    pagefind = await import('/pagefind/pagefind.js');
    await pagefind.init();
  }
  return pagefind;
}

function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

function reinitCommand(container) {
  // Remove initialization flag so basecoat re-inits
  const commandEl = container.querySelector('.command');
  if (commandEl) {
    commandEl.removeAttribute('data-command-initialized');
    window.basecoat?.init('command');
  }
}

function renderResults(items, menuEl, dialog) {
  if (items.length === 0) {
    menuEl.innerHTML = `<div role="menuitem" aria-disabled="true" class="empty">${menuEl.dataset.empty || 'No results found.'}</div>`;
    reinitCommand(dialog);
    return;
  }

  menuEl.innerHTML = items.map((item, i) => `
    <a id="search-result-${i}" href="${item.url}" role="menuitem">
      <span class="search-title">${item.meta?.title || 'Untitled'}</span>
      ${item.excerpt ? `<span class="search-excerpt">${item.excerpt}</span>` : ''}
    </a>
  `).join('');

  reinitCommand(dialog);
}

async function search(query, menuEl, dialog) {
  const trimmed = query.trim();

  if (!trimmed) {
    menuEl.innerHTML = '<div role="menuitem" aria-disabled="true" class="empty">Type to search documentation...</div>';
    reinitCommand(dialog);
    return;
  }

  menuEl.innerHTML = '<div role="menuitem" aria-disabled="true" class="loading">Searching...</div>';

  try {
    const pf = await loadPagefind();
    const results = await pf.search(trimmed);

    const items = await Promise.all(
      results.results.slice(0, 8).map(r => r.data())
    );

    renderResults(items, menuEl, dialog);
  } catch (err) {
    console.error('Search error:', err);
    menuEl.innerHTML = '<div role="menuitem" aria-disabled="true" class="error">Search failed. Try again.</div>';
    reinitCommand(dialog);
  }
}

function initPagefindSearch() {
  document.querySelectorAll('dialog.command-dialog[data-pagefind-search]').forEach(dialog => {
    const input = dialog.querySelector('header input');
    const menu = dialog.querySelector('[role="menu"]');
    if (!input || !menu) return;

    menu.innerHTML = '<div role="menuitem" aria-disabled="true" class="empty">Type to search documentation...</div>';

    const debouncedSearch = debounce(() => search(input.value, menu, dialog), 150);
    input.addEventListener('input', debouncedSearch);

    dialog.addEventListener('close', () => {
      input.value = '';
      menu.innerHTML = '<div role="menuitem" aria-disabled="true" class="empty">Type to search documentation...</div>';
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPagefindSearch);
} else {
  initPagefindSearch();
}
