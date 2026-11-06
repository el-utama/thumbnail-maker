/* Thumbnail Lab — UI wiring, checks, export. */

(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const stage = $('#stage');
  const stageCtx = stage.getContext('2d', { willReadFrequently: true });
  const mini = $('#mini');
  const miniCtx = mini.getContext('2d', { willReadFrequently: true });
  const shell = $('#canvasShell');

  let img = null;
  let imgUrl = null;
  let toastTimer = null;
  let frame = 0;

  const state = {
    title: DEFAULTS.title,
    accent: DEFAULTS.accent,
    subtitle: DEFAULTS.subtitle,
    genre: DEFAULTS.genre,
    badge: DEFAULTS.badge,
    channel: DEFAULTS.channel,
    template: DEFAULTS.template,
    theme: DEFAULTS.theme,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    scrim: 1,
    grain: 0.45,
    autoPlace: true,
  };

  const els = {
    title: $('#title'),
    accent: $('#accent'),
    subtitle: $('#subtitle'),
    genre: $('#genre'),
    badge: $('#badge'),
    channel: $('#channel'),
    scale: $('#scale'),
    offsetX: $('#offsetX'),
    offsetY: $('#offsetY'),
    scrim: $('#scrim'),
    grain: $('#grain'),
    autoPlace: $('#autoPlace'),
    fileName: $('#fileName'),
    status: $('#status'),
    meta: $('#stageMeta'),
    checks: $('#checks'),
  };

  const out = {
    scale: $('#outScale'),
    offsetX: $('#outX'),
    offsetY: $('#outY'),
    scrim: $('#outScrim'),
    grain: $('#outGrain'),
  };

  function slugify(text) {
    return String(text || 'thumbnail')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'thumbnail';
  }

  function toast(msg) {
    let el = $('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function syncStateFromInputs() {
    state.title = els.title.value;
    state.accent = els.accent.value;
    state.subtitle = els.subtitle.value;
    state.genre = els.genre.value;
    state.badge = els.badge.value;
    state.channel = els.channel.value;
    state.scale = parseFloat(els.scale.value);
    state.offsetX = parseFloat(els.offsetX.value);
    state.offsetY = parseFloat(els.offsetY.value);
    state.scrim = parseFloat(els.scrim.value);
    state.grain = parseFloat(els.grain.value);
    state.autoPlace = els.autoPlace.checked;

    out.scale.textContent = state.scale.toFixed(2);
    out.offsetX.textContent = Math.round(state.offsetX * 100);
    out.offsetY.textContent = Math.round(state.offsetY * 100);
    out.scrim.textContent = state.scrim.toFixed(2);
    out.grain.textContent = state.grain.toFixed(2);
  }

  function scheduleRender(thumbs = false) {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      syncStateFromInputs();
      const metrics = drawMain();
      updateChecks(metrics);
      if (thumbs) drawTemplateThumbs();
    });
  }

  function drawMain() {
    const metrics = Renderer.render(stageCtx, stage.width, stage.height, state, img);
    Renderer.render(miniCtx, mini.width, mini.height, state, img);
    els.meta.textContent = `${metrics.templateId} · ${metrics.themeId}${metrics.mirrored ? ' · flipped' : ''}`;
    return metrics;
  }

  function drawTemplateThumbs() {
    const canvases = $$('#templates canvas');
    canvases.forEach((c) => {
      const id = c.dataset.id;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      Renderer.render(ctx, c.width, c.height, { ...state, template: id }, img);
    });
    $$('.tcard').forEach((card) => {
      card.classList.toggle('on', card.dataset.id === state.template);
    });
  }

  function checkItem(level, label, detail, fix) {
    return `<li class="${level}"><b>${label}</b><span>${detail}</span>${fix ? '<button data-fix="' + fix + '">fix</button>' : ''}</li>`;
  }

  function updateChecks(m) {
    const items = [];
    const ratio = m.contrast;
    items.push(
      ratio >= 4.5
        ? checkItem('ok', 'contrast', `${ratio.toFixed(1)}:1`)
        : checkItem('bad', 'contrast', `${ratio.toFixed(1)}:1`, 'contrast')
    );

    if (m.words <= 4) items.push(checkItem('ok', 'hook', `${m.words} words`));
    else if (m.words === 5) items.push(checkItem('warn', 'hook', `${m.words} words`));
    else items.push(checkItem('warn', 'hook', `${m.words} words — trim`));

    if (m.capPx >= 6) items.push(checkItem('ok', 'mobile', `${m.capPx.toFixed(1)} px cap`));
    else if (m.capPx >= 4.5) items.push(checkItem('warn', 'mobile', `${m.capPx.toFixed(1)} px cap`));
    else items.push(checkItem('bad', 'mobile', `${m.capPx.toFixed(1)} px cap`));

    items.push(
      m.safeZoneClear
        ? checkItem('ok', 'duration zone', 'clear')
        : checkItem('bad', 'duration zone', 'text under badge')
    );

    items.push(
      m.coverage <= 0.45
        ? checkItem('ok', 'balance', `${Math.round(m.coverage * 100)}% type`)
        : checkItem('warn', 'balance', `${Math.round(m.coverage * 100)}% type`)
    );

    els.checks.innerHTML = items.join('');
  }

  els.checks.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-fix]');
    if (!btn) return;
    if (btn.dataset.fix === 'contrast') {
      const next = Math.min(1.3, parseFloat(els.scrim.value) + 0.15);
      els.scrim.value = next.toFixed(2);
      scheduleRender();
      toast('Scrim raised — contrast should pass now.');
    }
  });

  /* ---------- artwork ---------- */

  function setImage(image, name) {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    imgUrl = null;
    img = image;
    els.fileName.textContent = name;
    scheduleRender(true);
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      toast('That file is not an image.');
      return;
    }
    imgUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setImage(image, `${file.name} · ${image.naturalWidth}×${image.naturalHeight}`);
    image.onerror = () => toast('Could not read that image.');
    image.src = imgUrl;
  }

  function createDemoArt() {
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const x = c.getContext('2d');

    const sky = x.createLinearGradient(0, 0, 200, 720);
    sky.addColorStop(0, '#06202a');
    sky.addColorStop(0.55, '#0d2c33');
    sky.addColorStop(1, '#26150d');
    x.fillStyle = sky;
    x.fillRect(0, 0, 1280, 720);

    // bokeh through a rainy windshield
    const lights = [
      [980, 210, 190, '#ffb066', 0.55],
      [1120, 300, 120, '#ff8a3d', 0.5],
      [880, 120, 90, '#7fd4e3', 0.35],
      [1180, 140, 70, '#ffd9a0', 0.45],
      [760, 260, 60, '#8fe0ea', 0.25],
      [1040, 420, 150, '#c8542a', 0.35],
      [660, 140, 50, '#ffcf9c', 0.3],
    ];
    for (const [cx, cy, r, color, a] of lights) {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, Renderer.hexA(color, a));
      g.addColorStop(0.45, Renderer.hexA(color, a * 0.45));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    // road haze
    const haze = x.createLinearGradient(0, 420, 0, 720);
    haze.addColorStop(0, 'rgba(255,138,61,0.02)');
    haze.addColorStop(1, 'rgba(255,138,61,0.16)');
    x.fillStyle = haze;
    x.fillRect(0, 420, 1280, 300);

    // dashboard silhouette
    x.fillStyle = '#050708';
    x.beginPath();
    x.moveTo(0, 720);
    x.lineTo(0, 596);
    x.quadraticCurveTo(280, 552, 520, 616);
    x.quadraticCurveTo(760, 660, 1280, 600);
    x.lineTo(1280, 720);
    x.closePath();
    x.fill();

    // instrument glow
    const dial = x.createRadialGradient(330, 664, 0, 330, 664, 150);
    dial.addColorStop(0, 'rgba(255,138,61,0.34)');
    dial.addColorStop(1, 'rgba(255,138,61,0)');
    x.fillStyle = dial;
    x.fillRect(150, 520, 380, 220);

    // rain streaks
    x.save();
    x.strokeStyle = 'rgba(210,240,255,0.10)';
    x.lineWidth = 1.4;
    for (let i = 0; i < 170; i++) {
      const rx = Math.random() * 1280;
      const ry = Math.random() * 560;
      const len = 10 + Math.random() * 34;
      x.beginPath();
      x.moveTo(rx, ry);
      x.lineTo(rx - 3, ry + len);
      x.stroke();
    }
    x.restore();

    // window edge
    x.fillStyle = 'rgba(4,6,8,0.55)';
    x.fillRect(0, 0, 26, 720);
    x.fillRect(1254, 0, 26, 720);
    x.fillRect(0, 0, 1280, 18);

    return c;
  }

  /* ---------- template / theme pickers ---------- */

  function buildPickers() {
    const tWrap = $('#templates');
    tWrap.innerHTML = '';
    for (const t of TEMPLATES) {
      const card = document.createElement('button');
      card.className = 'tcard';
      card.dataset.id = t.id;
      card.innerHTML = `<canvas width="256" height="144"></canvas><strong>${t.name}</strong><span>${t.hint}</span>`;
      card.addEventListener('click', () => {
        state.template = t.id;
        drawTemplateThumbs();
        scheduleRender();
      });
      tWrap.appendChild(card);
    }

    const wrap = $('#themes');
    wrap.innerHTML = '';
    for (const th of THEMES) {
      const b = document.createElement('button');
      b.className = 'theme';
      b.dataset.id = th.id;
      const grad = `linear-gradient(135deg, ${th.swatch[0]} 0 33%, ${th.swatch[1]} 33% 66%, ${th.swatch[2]} 66%)`;
      b.innerHTML = `<span class="swatch" style="background:${grad}"></span><span><strong>${th.name}</strong><span>${th.note}</span></span>`;
      b.addEventListener('click', () => {
        state.theme = th.id;
        $$('.theme').forEach((el) => el.classList.toggle('on', el.dataset.id === th.id));
        drawTemplateThumbs();
        scheduleRender();
      });
      wrap.appendChild(b);
    }
  }

  /* ---------- export ---------- */

  function downloadBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  async function exportOne(type) {
    const ext = type === 'image/png' ? 'png' : 'jpg';
    const blob = await canvasBlob(stage, type, 0.92);
    const name = `${slugify(state.title)}-${state.template}-${state.theme}.${ext}`;
    downloadBlob(blob, name);
    toast(`Saved ${name}`);
  }

  async function exportABC() {
    const ids = ['cinematic', 'gold', 'pop'];
    const c = document.createElement('canvas');
    c.width = 1280;
    c.height = 720;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const files = [];
    for (const id of ids) {
      Renderer.render(ctx, 1280, 720, { ...state, theme: id }, img);
      const blob = await canvasBlob(c, 'image/png');
      const buf = new Uint8Array(await blob.arrayBuffer());
      files.push({ name: `${slugify(state.title)}-${id}.png`, data: buf });
    }
    const zip = Zip.build(files);
    downloadBlob(zip, `${slugify(state.title)}-abc.zip`);
    toast('A/B/C pack downloaded (3 palettes).');
  }

  $('#btnPng').addEventListener('click', () => exportOne('image/png'));
  $('#btnJpg').addEventListener('click', () => exportOne('image/jpeg'));
  $('#btnAbc').addEventListener('click', exportABC);

  /* ---------- wiring ---------- */

  ['title', 'accent', 'subtitle', 'genre', 'badge', 'channel'].forEach((key) => {
    els[key].addEventListener('input', () => scheduleRender(true));
  });
  ['scale', 'offsetX', 'offsetY', 'scrim', 'grain'].forEach((key) => {
    els[key].addEventListener('input', () => scheduleRender());
  });
  els.autoPlace.addEventListener('change', () => scheduleRender());

  $('#fileInput').addEventListener('change', (e) => loadFile(e.target.files[0]));

  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    drop.addEventListener(ev, (e) => {
      e.preventDefault();
      drop.classList.remove('drag');
      if (ev === 'drop' && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
    })
  );

  $('#btnClearArt').addEventListener('click', () => {
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    imgUrl = null;
    img = null;
    els.fileName.textContent = 'no image loaded';
    scheduleRender(true);
    toast('Image cleared — using generated backdrop.');
  });

  $('#btnDemo').addEventListener('click', () => {
    setImage(createDemoArt(), 'demo art · generated locally');
    toast('Demo artwork loaded.');
  });

  $('#btnReset').addEventListener('click', () => {
    for (const key of ['title', 'accent', 'subtitle', 'genre', 'badge', 'channel']) els[key].value = DEFAULTS[key];
    state.template = DEFAULTS.template;
    state.theme = DEFAULTS.theme;
    els.scale.value = 1;
    els.offsetX.value = 0;
    els.offsetY.value = 0;
    els.scrim.value = 1;
    els.grain.value = 0.45;
    els.autoPlace.checked = true;
    $$('.theme').forEach((el) => el.classList.toggle('on', el.dataset.id === DEFAULTS.theme));
    drawTemplateThumbs();
    scheduleRender();
    toast('Reset to the eL Utama test copy.');
  });

  const EXAMPLES = {
    dashboard: {
      title: 'Dashboard Light',
      accent: 'Light',
      subtitle: 'Indie folk for night driving, mile markers & open roads',
      genre: 'Indie Folk',
      badge: '1 Hour',
      template: 'night-drive',
      theme: 'cinematic',
    },
    quiet: {
      title: 'Quiet Indie Folk',
      accent: 'Folk',
      subtitle: 'Love songs for study, sleep & rainy days',
      genre: 'Indie Folk',
      badge: '1 Hour',
      template: 'rainy',
      theme: 'cozy',
    },
  };

  $('#examples').addEventListener('change', (e) => {
    const ex = EXAMPLES[e.target.value];
    if (!ex) return;
    for (const key of ['title', 'accent', 'subtitle', 'genre', 'badge']) els[key].value = ex[key];
    state.template = ex.template;
    state.theme = ex.theme;
    $$('.tcard').forEach((el) => el.classList.toggle('on', el.dataset.id === ex.template));
    $$('.theme').forEach((el) => el.classList.toggle('on', el.dataset.id === ex.theme));
    els.scale.value = 1;
    els.offsetX.value = 0;
    els.offsetY.value = 0;
    drawTemplateThumbs();
    scheduleRender();
    toast(`Loaded example: ${ex.title}`);
    e.target.value = '';
  });

  $$('#viewSeg button').forEach((b) => {
    b.addEventListener('click', () => {
      $$('#viewSeg button').forEach((x) => x.classList.toggle('on', x === b));
      shell.classList.toggle('feed', b.dataset.view === 'feed');
    });
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      exportOne('image/png');
    }
  });

  /* ---------- boot ---------- */

  async function loadFonts() {
    const specs = [
      '400 40px Anton',
      '400 40px "Bebas Neue"',
      '400 40px "Archivo Black"',
      '700 40px "Playfair Display"',
      'italic 900 40px "Playfair Display"',
      '700 40px "Cormorant Garamond"',
      '900 40px "Inter Tight"',
      '400 40px "Great Vibes"',
      '700 40px "Space Grotesk"',
    ];
    await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => null)));
    await document.fonts.ready;
  }

  async function boot() {
    const params = new URLSearchParams(location.search);
    if (params.get('title')) state.title = params.get('title');
    if (params.get('accent')) state.accent = params.get('accent');
    if (params.get('subtitle')) state.subtitle = params.get('subtitle');
    if (params.get('genre')) state.genre = params.get('genre');
    if (params.get('badge')) state.badge = params.get('badge');
    if (params.get('channel')) state.channel = params.get('channel');
    if (TEMPLATES.some((t) => t.id === params.get('template'))) state.template = params.get('template');
    if (THEMES.some((t) => t.id === params.get('theme'))) state.theme = params.get('theme');

    els.title.value = state.title;
    els.accent.value = state.accent;
    els.subtitle.value = state.subtitle;
    els.genre.value = state.genre;
    els.badge.value = state.badge;
    els.channel.value = state.channel;

    buildPickers();
    $$('.tcard').forEach((el) => el.classList.toggle('on', el.dataset.id === state.template));
    $$('.theme').forEach((el) => el.classList.toggle('on', el.dataset.id === state.theme));

    await loadFonts();

    if (params.get('art')) {
      const image = new Image();
      image.onload = () => {
        setImage(image, `art · ${params.get('art').split('/').pop()}`);
        els.status.textContent = 'ready';
      };
      image.onerror = () => {
        img = createDemoArt();
        toast('Artwork not found — demo backdrop loaded.');
        scheduleRender(true);
      };
      image.src = params.get('art');
    } else {
      img = createDemoArt();
      els.fileName.textContent = 'demo art · generated locally';
    }
    els.status.textContent = 'ready';

    drawTemplateThumbs();
    scheduleRender();
    window.ThumbnailLab = { state, stage, exportABC, render: () => scheduleRender(true) };
  }

  boot();
})();
