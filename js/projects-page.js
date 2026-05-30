import { fetchProjects, renderCard } from './projects.js';

const grid = document.querySelector('#all-projects .projects-grid');
const filterBar = document.querySelector('.tag-filters');

if (grid && filterBar) {
  fetchProjects().then(projects => {
    const tags = [...new Set(projects.flatMap(p => p.tags))];

    // Build filter bar
    const allBtn = document.createElement('button');
    allBtn.className = 'tag-filter tag-filter--active';
    allBtn.textContent = 'All';
    allBtn.setAttribute('aria-pressed', 'true');
    filterBar.appendChild(allBtn);

    for (const tag of tags) {
      const btn = document.createElement('button');
      btn.className = 'tag-filter';
      btn.textContent = tag;
      btn.dataset.tag = tag;
      btn.setAttribute('aria-pressed', 'false');
      filterBar.appendChild(btn);
    }

    // Render cards, storing tags as data attribute for filtering
    const cards = projects.map(project => {
      const card = renderCard(project);
      card.dataset.tags = JSON.stringify(project.tags);
      grid.appendChild(card);
      return card;
    });

    filterBar.addEventListener('click', e => {
      const btn = e.target.closest('.tag-filter');
      if (!btn) return;

      const activeBtn = filterBar.querySelector('[aria-pressed="true"]');

      if (btn === activeBtn) {
        // Clicking the already-active button clears the filter
        activateAll();
        return;
      }

      activeBtn.setAttribute('aria-pressed', 'false');
      activeBtn.classList.remove('tag-filter--active');
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('tag-filter--active');

      if (btn === allBtn) {
        cards.forEach(c => c.classList.remove('card--hidden'));
      } else {
        const selected = btn.dataset.tag;
        cards.forEach(c => {
          const cardTags = JSON.parse(c.dataset.tags);
          c.classList.toggle('card--hidden', !cardTags.includes(selected));
        });
      }
    });

    function activateAll() {
      const activeBtn = filterBar.querySelector('[aria-pressed="true"]');
      if (activeBtn) {
        activeBtn.setAttribute('aria-pressed', 'false');
        activeBtn.classList.remove('tag-filter--active');
      }
      allBtn.setAttribute('aria-pressed', 'true');
      allBtn.classList.add('tag-filter--active');
      cards.forEach(c => c.classList.remove('card--hidden'));
    }
  }).catch(() => {});
}
