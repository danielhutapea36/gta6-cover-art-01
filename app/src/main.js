// Wires the Vice City Cover Maker: pick photos per panel, crop and position each by dragging,
// choose a poster layout and a colour grade, write the caption, export the PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).

import { drawCover, LAYOUTS, GRADES, SIZES, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subcaptionInput = document.getElementById('subcaption');
const status = document.getElementById('status');
const panelList = document.getElementById('panel-list');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('pan-x');
const panYInput = document.getElementById('pan-y');

const state = {
  layout: 'grid',
  grade: 'sunset',
  size: 'square',
  caption: 'Sunset Heist',
  subcaption: 'Vice City',
  panels: [{}, {}, {}, {}],
};
let selectedPanel = 0;

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Redraws the preview canvas from the current state. */
function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  drawCover(canvas, state);
}

/** Syncs the panel controls (zoom and pan sliders) with the selected panel. */
function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  zoomInput.value = panel.zoom ?? 1;
  panXInput.value = panel.ox ?? 0;
  panYInput.value = panel.oy ?? 0;
  panelList.querySelectorAll('.panel-row').forEach((row, i) => {
    row.classList.toggle('selected', i === selectedPanel);
  });
}

/** Rebuilds the panel list: one row per panel of the current layout. */
function buildPanelList() {
  const count = LAYOUTS[state.layout].panels.length;
  panelList.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'panel-row';
    row.innerHTML = `
      <button type="button" class="panel-pick">Panel ${i + 1}</button>
      <label class="panel-file">Choose photo
        <input type="file" accept="image/*" hidden>
      </label>
      <span class="panel-state">empty</span>`;
    row.querySelector('.panel-pick').addEventListener('click', () => {
      selectedPanel = i;
      syncPanelControls();
    });
    row.querySelector('input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      state.panels[i] = {
        photo: await loadImage(URL.createObjectURL(file)),
        zoom: 1, ox: 0, oy: 0,
      };
      selectedPanel = i;
      row.querySelector('.panel-state').textContent = file.name;
      syncPanelControls();
      redraw();
    });
    panelList.appendChild(row);
  }
  syncPanelControls();
}

/** Fills every panel of the current layout with the same photo. */
function fillAllPanels(photo) {
  const count = LAYOUTS[state.layout].panels.length;
  for (let i = 0; i < count; i++) {
    state.panels[i] = { photo, zoom: 1, ox: 0, oy: 0 };
  }
  panelList.querySelectorAll('.panel-state').forEach((el) => { el.textContent = 'same photo'; });
  redraw();
}

/** Loads a bundled sample photo into every panel (the demo path, and the screenshot path). */
export async function loadSample(name) {
  const photo = await loadImage(`samples/${name}.jpg`);
  fillAllPanels(photo);
  return photo;
}

/** Loads the two bundled samples: `first` into panel 1, `second` into the rest. */
export async function loadSamples(first, second) {
  const a = await loadImage(`samples/${first}.jpg`);
  const b = await loadImage(`samples/${second}.jpg`);
  const count = LAYOUTS[state.layout].panels.length;
  state.panels[0] = { photo: a, zoom: 1, ox: 0, oy: 0 };
  for (let i = 1; i < count; i++) state.panels[i] = { photo: b, zoom: 1, ox: 0, oy: 0 };
  panelList.querySelectorAll('.panel-state').forEach((el, i) => {
    el.textContent = i === 0 ? `${first}.jpg` : `${second}.jpg`;
  });
  redraw();
}

/** Renders the cover at the chosen export size and downloads it as a PNG. */
function exportCover() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.width;
  off.height = size.height;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-city-cover-${size.width}x${size.height}.png`;
    a.click();
    status.textContent = `Saved vice-city-cover-${size.width}x${size.height}.png`;
  }, 'image/png');
}

/** Builds a row of option buttons; clicking one sets `key` and redraws. */
function buildOptions(containerId, options, key) {
  const container = document.getElementById(containerId);
  Object.entries(options).forEach(([value, def]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.textContent = def.name;
    button.addEventListener('click', () => {
      state[key] = value;
      container.querySelectorAll('.option').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      if (key === 'layout') buildPanelList();
      redraw();
    });
    if (state[key] === value) button.classList.add('active');
    container.appendChild(button);
  });
}

/** Finds which panel a point on the canvas (in CSS pixels) falls in, or -1. */
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width * canvas.width;
  const y = (clientY - rect.top) / rect.height * canvas.height;
  return layoutPanels(state.layout, canvas.width, canvas.height)
    .findIndex((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
}

// Drag a photo inside its panel to position it; the wheel zooms it.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0 || !state.panels[i].photo) return;
  selectedPanel = i;
  syncPanelControls();
  drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const panel = layoutPanels(state.layout, canvas.width, canvas.height)[selectedPanel];
  const p = state.panels[selectedPanel];
  p.ox = (p.ox ?? 0) + (e.clientX - drag.x) / rect.width * (canvas.width / panel.w);
  p.oy = (p.oy ?? 0) + (e.clientY - drag.y) / rect.height * (canvas.height / panel.h);
  drag = { x: e.clientX, y: e.clientY };
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0 || !state.panels[i].photo) return;
  e.preventDefault();
  const p = state.panels[i];
  p.zoom = Math.min(4, Math.max(1, (p.zoom ?? 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
  selectedPanel = i;
  syncPanelControls();
  redraw();
}, { passive: false });

zoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  state.panels[selectedPanel].ox = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  state.panels[selectedPanel].oy = Number(panYInput.value);
  redraw();
});
captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subcaptionInput.addEventListener('input', () => { state.subcaption = subcaptionInput.value; redraw(); });
document.getElementById('export').addEventListener('click', exportCover);
document.getElementById('fill-all').addEventListener('click', async (e) => {
  const file = document.getElementById('fill-all-file').files[0];
  if (!file) { status.textContent = 'Choose a photo first, then fill all panels.'; return; }
  fillAllPanels(await loadImage(URL.createObjectURL(file)));
  status.textContent = 'One photo fills every panel — pick a panel to swap it.';
});
document.getElementById('sample-pier').addEventListener('click', () => loadSample('pier'));
document.getElementById('sample-boulevard').addEventListener('click', () => loadSample('boulevard'));

buildOptions('layout-options', LAYOUTS, 'layout');
buildOptions('grade-options', GRADES, 'grade');
buildOptions('size-options', SIZES, 'size');
buildPanelList();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    apply: async (scene) => {
      state.layout = scene.layout;
      state.grade = scene.grade;
      state.size = scene.size;
      state.caption = scene.caption;
      state.subcaption = scene.subcaption;
      captionInput.value = scene.caption;
      subcaptionInput.value = scene.subcaption;
      document.querySelectorAll('#layout-options .option').forEach((b, i) => {
        b.classList.toggle('active', Object.keys(LAYOUTS)[i] === scene.layout);
      });
      document.querySelectorAll('#grade-options .option').forEach((b, i) => {
        b.classList.toggle('active', Object.keys(GRADES)[i] === scene.grade);
      });
      document.querySelectorAll('#size-options .option').forEach((b, i) => {
        b.classList.toggle('active', Object.keys(SIZES)[i] === scene.size);
      });
      buildPanelList();
      await loadSamples(scene.photo, scene.photo2);
    },
    draw: redraw,
  });
} else {
  redraw();
}
