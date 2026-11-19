// Draws the multi-panel GTA-style cover: photos in a poster grid, a Vice City sunset / neon colour grade,
// and bold caption lettering. Everything is drawn on the canvas at its own pixel size, so the same
// drawing code renders the live preview and the exported PNG at 1080 x 1080, 1080 x 1350 or 1920 x 1080.

/** Poster layouts: each panel is [x, y, width, height] in fractions of the cover. */
export const LAYOUTS = {
  grid: {
    name: 'Sunset Grid',
    panels: [
      [0, 0, 1, 0.615],
      [0, 0.63, 0.492, 0.37],
      [0.508, 0.63, 0.492, 0.37],
    ],
  },
  strip: {
    name: 'Neon Strip',
    panels: [
      [0, 0, 0.336, 1],
      [0.344, 0, 0.312, 1],
      [0.664, 0, 0.336, 1],
    ],
  },
  trio: {
    name: 'Hero Trio',
    panels: [
      [0, 0, 0.612, 1],
      [0.626, 0, 0.374, 0.322],
      [0.626, 0.339, 0.374, 0.322],
      [0.626, 0.678, 0.374, 0.322],
    ],
  },
};

/** Colour grades: sky ramp, wash tint, deep shadow, neon accent and sun disc colour. */
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    sky: ['#ff9a3d', '#ff5e62', '#c22e7a'],
    wash: 'rgba(255, 94, 98, 0.26)',
    deep: 'rgba(46, 8, 64, 0.55)',
    accent: '#ffd166',
    sun: '#ffcf5c',
  },
  neon: {
    name: 'Neon Nights',
    sky: ['#22d3ee', '#a855f7', '#ff2e88'],
    wash: 'rgba(168, 85, 247, 0.28)',
    deep: 'rgba(10, 4, 44, 0.60)',
    accent: '#22d3ee',
    sun: '#ff7ad9',
  },
  golden: {
    name: 'Golden Hour',
    sky: ['#fde68a', '#f59e0b', '#b45309'],
    wash: 'rgba(245, 158, 11, 0.24)',
    deep: 'rgba(64, 22, 0, 0.50)',
    accent: '#fff3b0',
    sun: '#fff3b0',
  },
};

/** Export sizes, in pixels. */
export const SIZES = {
  square: { name: 'Square 1080 x 1080', width: 1080, height: 1080 },
  portrait: { name: 'Portrait 1080 x 1350', width: 1080, height: 1350 },
  wide: { name: 'Wide 1920 x 1080', width: 1920, height: 1080 },
};

/** Panels of a layout as pixel rects on a canvas of width `w` and height `h`. */
export function layoutPanels(layout, w, h) {
  return LAYOUTS[layout].panels.map(([fx, fy, fw, fh]) => ({
    x: fx * w,
    y: fy * h,
    w: fw * w,
    h: fh * h,
  }));
}

/** Draws one photo into a panel rect, cover-fit, with per-panel zoom and pan offsets. */
function drawPanelPhoto(ctx, photo, rect, zoom, ox, oy) {
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const x = rect.x + (rect.w - pw) / 2 + ox * rect.w;
  const y = rect.y + (rect.h - ph) / 2 + oy * rect.h;
  ctx.drawImage(photo, x, y, pw, ph);
}

/** Empty-panel placeholder: a striped dusk gradient with an invitation to add a photo. */
function drawEmptyPanel(ctx, rect, grade) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, '#3b1d52');
  g.addColorStop(1, '#1c0b2e');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = grade.accent;
  for (let i = -rect.h; i < rect.w; i += Math.max(28, rect.w * 0.08)) {
    ctx.beginPath();
    ctx.moveTo(rect.x + i, rect.y + rect.h);
    ctx.lineTo(rect.x + i + rect.h * 0.5, rect.y);
    ctx.lineTo(rect.x + i + rect.h * 0.5 + Math.max(14, rect.w * 0.04), rect.y);
    ctx.lineTo(rect.x + i + Math.max(14, rect.w * 0.04), rect.y + rect.h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = `700 ${Math.max(14, rect.w * 0.045)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

/** Shrinks `font` until `text` fits `maxWidth`, then returns the fitted size in pixels. */
function fitFontSize(ctx, text, startSize, maxWidth, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px 'Arial Black', 'Helvetica Neue', system-ui, sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px 'Arial Black', 'Helvetica Neue', system-ui, sans-serif`;
  }
  return size;
}

/** Draws the caption in bold capitals with a sunset gradient fill and a dark outline. */
function drawCaption(ctx, w, h, caption, subcaption, grade) {
  const bandTop = h * 0.8;
  const scrim = ctx.createLinearGradient(0, bandTop - h * 0.06, 0, h);
  scrim.addColorStop(0, 'rgba(20, 4, 32, 0)');
  scrim.addColorStop(1, 'rgba(20, 4, 32, 0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandTop - h * 0.06, w, h - bandTop + h * 0.06);

  const sub = (subcaption || '').trim().toUpperCase();
  if (sub) {
    const subSize = fitFontSize(ctx, sub, h * 0.032, w * 0.86, 700);
    ctx.font = `700 ${subSize}px 'Arial Black', 'Helvetica Neue', system-ui, sans-serif`;
    try { ctx.letterSpacing = `${subSize * 0.42}px`; } catch { /* letterSpacing is optional */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, w / 2, h * 0.875);
    try { ctx.letterSpacing = '0px'; } catch { /* reset */ }
  }

  const text = (caption || '').trim().toUpperCase();
  if (!text) return;
  const size = fitFontSize(ctx, text, h * 0.105, w * 0.92, 900);
  ctx.font = `900 ${size}px 'Arial Black', 'Helvetica Neue', system-ui, sans-serif`;
  try { ctx.letterSpacing = `${size * 0.04}px`; } catch { /* letterSpacing is optional */ }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fill = ctx.createLinearGradient(0, h - size * 1.25, 0, h - size * 0.1);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.55, '#fff6d8');
  fill.addColorStop(1, grade.accent);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(24, 4, 38, 0.9)';
  ctx.lineWidth = size * 0.09;
  ctx.shadowColor = 'rgba(255, 46, 136, 0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.03;
  ctx.strokeText(text, w / 2, h - h * 0.045);
  ctx.fillStyle = fill;
  ctx.fillText(text, w / 2, h - h * 0.045);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  try { ctx.letterSpacing = '0px'; } catch { /* reset */ }
}

/**
 * Draws the whole cover onto `canvas`.
 * `state` is { layout, grade, caption, subcaption, panels: [{ photo, zoom, ox, oy }] }.
 * A panel entry may hold no photo yet; it then draws as an empty placeholder.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const panels = layoutPanels(state.layout, w, h);

  ctx.fillStyle = '#14091f';
  ctx.fillRect(0, 0, w, h);

  const radius = Math.min(w, h) * 0.014;
  panels.forEach((rect, i) => {
    const panel = state.panels[i] ?? {};
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
    ctx.clip();
    if (panel.photo) {
      drawPanelPhoto(ctx, panel.photo, rect, panel.zoom ?? 1, panel.ox ?? 0, panel.oy ?? 0);
    } else {
      drawEmptyPanel(ctx, rect, grade);
    }
    ctx.restore();
  });

  // The sun: a glowing disc high in the hero panel's sky, clipped to it.
  const hero = panels[0];
  const sunX = hero.x + hero.w * 0.8;
  const sunY = hero.y + hero.h * 0.16;
  const sunR = Math.min(w, h) * 0.12;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(hero.x, hero.y, hero.w, hero.h, radius);
  ctx.clip();
  const sun = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR);
  sun.addColorStop(0, grade.sun);
  sun.addColorStop(0.45, grade.sky[0]);
  sun.addColorStop(1, 'rgba(255, 94, 98, 0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The grade: a warm wash over everything, deepening toward the foot.
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, 'rgba(255, 154, 61, 0.10)');
  wash.addColorStop(0.55, grade.wash);
  wash.addColorStop(1, grade.deep);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  // Vignette: darkened corners pull the eye to the middle.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(10, 2, 20, 0)');
  vig.addColorStop(1, 'rgba(10, 2, 20, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Neon frame lines around each panel.
  ctx.save();
  ctx.strokeStyle = grade.accent;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = Math.max(2, w * 0.0035);
  ctx.shadowColor = grade.accent;
  ctx.shadowBlur = Math.max(6, w * 0.012);
  panels.forEach((rect) => {
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
    ctx.stroke();
  });
  ctx.restore();

  drawCaption(ctx, w, h, state.caption, state.subcaption, grade);
}
