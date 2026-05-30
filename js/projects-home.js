import { fetchProjects, renderGrid } from './projects.js';

const container = document.querySelector('#projects .projects-grid');
if (container) {
  fetchProjects()
    .then(projects => renderGrid(projects.filter(p => p.featured), container))
    .catch(() => {});
}
