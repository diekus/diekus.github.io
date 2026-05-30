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
  article.appendChild(body);

  return article;
}

export function renderGrid(projects, container) {
  for (const project of projects) {
    container.appendChild(renderCard(project));
  }
}
