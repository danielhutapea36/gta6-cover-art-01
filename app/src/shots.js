// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the exported cover alone. `photo` picks the sample for panel 1, `photo2` for
// the rest, `caption` and `sub` the words, `layout`, `grade` and `size` the poster.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, api) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const scene = {
    photo: query.get('photo') ?? 'pier',
    photo2: query.get('photo2') ?? 'boulevard',
    caption: query.get('caption') ?? 'Sunset Heist',
    subcaption: query.get('sub') ?? 'Vice City',
    layout: query.get('layout') ?? 'grid',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? 'square',
  };
  await api.apply(scene);
  api.draw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
