export async function fetchProjects() {
  const response = await fetch('./projects.json');
  if (!response.ok) throw new Error('Failed to load projects');
  return response.json();
}

export function renderCard(project) {
  const article = document.createElement('article');
  article.className = 'project-card';

  if (project.thumbnail) {
    const img = document.createElement('img');
    img.src = project.thumbnail;
    img.alt = '';
    img.className = 'project-card-thumb';
    img.loading = 'lazy';
    article.appendChild(img);
  }

  const body = document.createElement('div');
  body.className = 'project-card-body';

  const titleLink = document.createElement('a');
  titleLink.href = project.link;
  titleLink.target = '_blank';
  titleLink.rel = 'noopener noreferrer';
  titleLink.textContent = project.title;

  const title = document.createElement('h3');
  title.className = 'project-card-title';
  title.appendChild(titleLink);

  const desc = document.createElement('p');
  desc.className = 'project-card-desc';
  desc.textContent = project.description;

  const tagList = document.createElement('ul');
  tagList.className = 'project-card-tags';
  tagList.setAttribute('aria-label', 'Tags');

  for (const tag of project.tags) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = tag;
    li.appendChild(span);
    tagList.appendChild(li);
  }

  body.appendChild(title);
  body.appendChild(desc);
  body.appendChild(tagList);

  const storeLinks = renderStoreLinks(project.storeLinks, project.link, project.manifest);
  if (storeLinks) body.appendChild(storeLinks);

  article.appendChild(body);

  return article;
}

const ICON_ATTRS = 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

const ICONS = {
  web: `<svg ${ICON_ATTRS}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  googlePlay: `<svg ${ICON_ATTRS}><path d="M7 5.2Q7 4 8.1 4.6L18.3 11.1Q19.5 12 18.3 12.9L8.1 19.4Q7 20 7 18.8Z"/><line x1="7.5" y1="7.5" x2="15.5" y2="14"/><line x1="7.5" y1="16.5" x2="15.5" y2="10"/></svg>`,
  microsoftStore: `<svg ${ICON_ATTRS}><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>`,
  appStore: `<svg ${ICON_ATTRS}><path d="M12.5 4.3c.5-.6.8-1.4.7-2.3-.8.1-1.7.6-2.2 1.2-.5.5-.9 1.3-.7 2.1.8.1 1.7-.4 2.2-1z"/><path d="M16.8 8.1c-1.1-1.4-2.7-1.5-3.3-1.5-1.4 0-2 .7-3 .7s-1.8-.7-2.9-.7c-1.5 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s1.9.8 3.3.8c1.4 0 2.3-1.2 3.1-2.4.6-.9 1-1.7 1.3-2.6-3.2-1.2-3.7-5.8-.1-6.9z"/></svg>`,
};

const STORES = [
  { key: 'googlePlay', label: 'Google Play', icon: ICONS.googlePlay },
  { key: 'microsoftStore', label: 'Microsoft Store', icon: ICONS.microsoftStore },
  { key: 'appStore', label: 'App Store', icon: ICONS.appStore },
];

function createStoreBtn(href, label, icon, installManifest) {
  const btn = document.createElement('a');
  btn.className = 'store-btn';
  btn.href = href;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.setAttribute('aria-label', label);
  btn.innerHTML = `${icon}<span class="store-btn-label" aria-hidden="true">${label}</span>`;

  // Experimental Web Install API (navigator.install) — origin-trial gated as
  // of writing, so this is a no-op for almost everyone today. Where it *is*
  // exposed, install the app directly instead of just opening its link; any
  // failure other than the user cancelling falls back to that same link.
  if (installManifest && 'install' in navigator) {
    btn.addEventListener('click', async event => {
      event.preventDefault();
      try {
        await navigator.install({ manifest: installManifest });
      } catch (err) {
        if (err?.name === 'AbortError') return;
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    });
  }

  return btn;
}

function renderStoreLinks(storeLinks, webLink, manifestUrl) {
  if (!storeLinks) return null;

  const available = STORES.filter(store => storeLinks[store.key] && storeLinks[store.key] !== '#');
  if (available.length === 0) return null;

  const details = document.createElement('details');
  details.className = 'project-card-stores';

  const summary = document.createElement('summary');
  summary.textContent = 'Get the app';
  details.appendChild(summary);

  const list = document.createElement('div');
  list.className = 'store-links';

  if (webLink && webLink !== '#') {
    list.appendChild(createStoreBtn(webLink, 'Web App', ICONS.web, manifestUrl));
  }

  for (const store of available) {
    list.appendChild(createStoreBtn(storeLinks[store.key], store.label, store.icon));
  }

  details.appendChild(list);
  return details;
}

export function renderGrid(projects, container) {
  for (const project of projects) {
    container.appendChild(renderCard(project));
  }
}
