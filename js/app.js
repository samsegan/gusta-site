/* Gusta: artist site preview. Plain JavaScript, no libraries. */
(() => {
  const D = window.GUSTA || { records: [], vault: [] };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const wide = matchMedia('(min-width: 1025px)');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  // Phones and tablets: Play opens SoundCloud itself (its embedded player needs several taps there).
  const handheld = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const inDock = () => wide.matches && !handheld;
  // SoundCloud refuses to play a few label releases inside other sites; those open SoundCloud too.
  const docks = (r) => !!(r && r.soundcloud && r.embed !== false && inDock());
  const rec = (id) => D.records.find((r) => r.id === id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const clock = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // ---------- letters: every big word is set letter by letter, each a touch off the line ----------
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const NUDGE = [0, 0, 0, -0.03, 0.03, -0.05, 0.05, 0.02];
  function letters(node, start) {
    const text = node.textContent;
    node.textContent = '';
    let i = start;
    for (const c of text) {
      if (c === ' ') { node.appendChild(Object.assign(document.createElement('span'), { className: 'sp' })); continue; }
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      s.style.setProperty('--dy', NUDGE[Math.floor(rnd() * NUDGE.length)] + 'em');
      s.style.setProperty('--d', (0.05 + rnd() * 0.45).toFixed(2) + 's');
      node.appendChild(s);
      i++;
    }
    return i;
  }
  $$('[data-split]').forEach((el) => {
    const parts = $$('.grp, .line', el);
    let n = 0;
    (parts.length ? parts : [el]).forEach((p) => { p.setAttribute('aria-hidden', 'true'); n = letters(p, n); });
  });

  // Letters "develop" out of a blur when their title comes into view.
  let gooN = 0;
  function develop(el) {
    el.classList.add('in');
    if (calm.matches || !wide.matches) return;
    const id = 'goo' + (++gooN);
    const f = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    f.setAttribute('id', id);
    f.setAttribute('x', '-20%'); f.setAttribute('y', '-40%'); f.setAttribute('width', '140%'); f.setAttribute('height', '180%');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML = '<feGaussianBlur in="SourceGraphic" stdDeviation="0" result="b"/><feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -6"/>';
    $('#filters defs').appendChild(f);
    const blur = f.firstChild;
    const size = parseFloat(getComputedStyle(el).fontSize) || 100;
    const from = size * 0.11, t0 = performance.now(), dur = 1500;
    el.style.filter = `url(#${id})`;
    const step = (t) => {
      const k = clamp((t - t0) / dur);
      const v = from * Math.pow(1 - k, 3);
      blur.setAttribute('stdDeviation', v.toFixed(2));
      if (k < 1) requestAnimationFrame(step);
      else { el.style.filter = ''; f.remove(); }
    };
    requestAnimationFrame(step);
  }

  // ---------- listen blocks and the list of every record ----------
  const DASH = '<svg viewBox="0 0 480 4" preserveAspectRatio="none" aria-hidden="true"><path d="M0 2h44m7 0h3m6 0h96m5 0h2m7 0h150m4 0h9m6 0h58m5 0h2m6 0h70"/></svg>';
  function listenHTML(r) {
    const a = [];
    if (r.soundcloud) a.push(`<button type="button" class="go" data-play="${r.id}">${docks(r) ? 'Play' : 'Play on SoundCloud'}</button>`);
    if (docks(r)) a.push(`<a href="${r.soundcloud}" target="_blank" rel="noopener">SoundCloud</a>`);
    if (r.spotify) a.push(`<a href="${r.spotify}" target="_blank" rel="noopener">Spotify</a>`);
    return `<div class="h3 listen-title"><span>Listen</span>${DASH}</div><div class="links">${a.join('')}</div>`;
  }
  $$('[data-listen]').forEach((el) => { const r = rec(el.dataset.listen); if (r) el.innerHTML = listenHTML(r); });

  const withWho = (r) => {
    const others = r.by.split(',').map((s) => s.trim()).filter((s) => s !== 'Gusta');
    return others.length ? 'with ' + others.join(', ') : '';
  };
  const list = $('#crate-list');
  if (list) {
    const groups = [
      ['Singles', D.records.filter((r) => r.kind === 'release')],
      ['SoundCloud only', D.records.filter((r) => r.kind === 'soundcloud')],
    ];
    let h = '';
    for (const [name, rows] of groups) {
      h += `<div class="crate-group"><h3><span>${name}</span><span>(&nbsp;&nbsp;${rows.length}&nbsp;&nbsp;)</span></h3>`;
      for (const r of rows) {
        const w = withWho(r);
        h += `<a class="rec" href="${r.soundcloud || r.spotify}" target="_blank" rel="noopener" data-id="${r.id}">` +
          `<img class="thumb" src="${r.art}" alt="" width="46" height="46" loading="lazy" decoding="async">` +
          `<span class="y">${r.date.slice(0, 4)}</span>` +
          `<span class="t">${esc(r.title)}${w ? `<span class="w">${esc(w)}</span>` : ''}</span>` +
          `<span class="l">${r.label ? '(&nbsp;' + esc(r.label) + '&nbsp;)' : (r.soundcloud ? '' : 'Spotify')}</span></a>`;
      }
      h += '</div>';
    }
    if (D.vault && D.vault.length) {
      h += `<div class="crate-group"><h3><span>In the vault, unreleased</span><span>(&nbsp;&nbsp;${D.vault.length}&nbsp;&nbsp;)</span></h3>`;
      for (const v of D.vault) h += `<div class="rec"><span class="y">ID</span><span class="t">${esc(v.title)}${v.with ? `<span class="w">with ${esc(v.with)}</span>` : ''}</span><span class="l"></span></div>`;
      h += '</div>';
    }
    list.innerHTML = h;
    $('#crate-count').innerHTML = `(&nbsp;&nbsp;&nbsp;${D.records.length}&nbsp;&nbsp;&nbsp;)`;
  }

  // The big sleeve beside the list follows the pointer; a click plays.
  let shown = null, held = null;
  function show(id, hold) {
    const r = rec(id);
    if (!r) return;
    if (hold) held = id;
    if (shown === id) return;
    shown = id;
    const img = $('#now-art');
    img.classList.remove('swap');
    img.src = r.art; img.alt = 'Cover of ' + r.title;
    void img.offsetWidth; img.classList.add('swap');
    $('#now-title').textContent = r.title;
    $('#now-by').textContent = [r.by, r.date.slice(0, 4), r.label].filter(Boolean).join('  ·  ');
    $('#now-listen').innerHTML = listenHTML(r);
    $$('a.rec', list).forEach((a) => a.classList.toggle('on', a.dataset.id === id));
  }
  if (list && D.records.length) {
    show(D.records[0].id, true);
    list.addEventListener('pointerover', (e) => { const a = e.target.closest('a.rec'); if (a && wide.matches) show(a.dataset.id); });
    list.addEventListener('pointerleave', () => { if (held && wide.matches) show(held); });
    list.addEventListener('focusin', (e) => { const a = e.target.closest('a.rec'); if (a && wide.matches) show(a.dataset.id); });
    list.addEventListener('click', (e) => {
      const a = e.target.closest('a.rec');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const r = rec(a.dataset.id);
      if (!docks(r)) return;      // phones, Spotify-only records, records SoundCloud will not embed: the link opens
      e.preventDefault();
      show(r.id, true);
      play(r.id);
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-play]');
    if (b) { e.preventDefault(); play(b.dataset.play); }
  });
  $$('.card[data-play]').forEach((c) => { if (!docks(rec(c.dataset.play))) $('.card-tag', c).textContent = 'Play on SoundCloud'; });

  // ---------- things appear as they scroll into view ----------
  const revealables = $$('.panel, .crate, .end, .hero');
  revealables.forEach((s) => s.classList.add('reveal'));
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      seen.unobserve(e.target);
    }
  }, { threshold: 0.18 });
  revealables.forEach((s) => seen.observe(s));
  const titles = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      develop(e.target);
      titles.unobserve(e.target);
    }
  }, { threshold: 0.5 });
  $$('[data-split]').forEach((t) => { if (!t.closest('#contact')) titles.observe(t); });

  // ---------- drift: cards and crops move at their own pace (wide screens) ----------
  const movers = $$('[data-speed]').map((el) => ({ el, target: el.classList.contains('bg') ? $('img', el) : el, speed: +el.dataset.speed, host: el.closest('section, header') }));
  const heroImg = $('.hero-img');
  const sections = $$('main [data-name]');
  const navLinks = $$('.nav-items a');
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight, y = scrollY;
    const drift = wide.matches && !calm.matches;
    for (const m of movers) {
      if (!drift) { if (m.on) { m.target.style.transform = ''; m.on = false; } continue; }
      const r = m.host.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
      const off = (r.top + r.height / 2 - vh / 2) / vh;          // 0 when the section is centred
      m.target.style.transform = `translate3d(0, ${(off * m.speed * innerWidth / 1440).toFixed(1)}px, 0)`;
      m.on = true;
    }
    if (heroImg) heroImg.style.transform = drift && y < vh ? `translate3d(0, ${(y * 0.18).toFixed(1)}px, 0) scale(${(1 + y / vh * 0.05).toFixed(4)})` : '';

    // where we are
    let cur = sections[0];
    for (const s of sections) { if (s.getBoundingClientRect().top <= vh * 0.45) cur = s; }
    if (cur !== frame.cur) {
      frame.cur = cur;
      const label = $('#bar-label');
      if (label) label.textContent = cur.dataset.name;
      const group = cur.id === 'top' ? '#top' : cur.id === 'about' ? '#about' : cur.id === 'live' || cur.id === 'end' ? '#live' : '#records';
      navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === group));
    }
    const max = document.documentElement.scrollHeight - vh;
    const fill = $('#bar-fill');
    if (fill) fill.style.transform = `scaleX(${max > 0 ? clamp(y / max).toFixed(4) : 0})`;
    const hint = $('#scroll-hint');
    if (hint) {
      const end = max > 0 && y > max - vh * 0.3;
      if (end !== frame.end) { frame.end = end; hint.textContent = end ? 'Back to top' : 'Scroll'; hint.setAttribute('href', end ? '#top' : '#about'); }
    }
  }
  const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  frame();

  // phone bar: the brackets step through the sections
  const stepTo = (d) => {
    const i = sections.indexOf(frame.cur || sections[0]);
    const to = sections[clamp(i + d, 0, sections.length - 1)];
    to.scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth', block: 'start' });
  };
  const prev = $('#bar-prev'), next = $('#bar-next');
  if (prev) prev.addEventListener('click', () => stepTo(-1));
  if (next) next.addEventListener('click', () => stepTo(1));

  // ---------- contact ----------
  const contact = $('#contact');
  const MAIL = 'anson@notoriously-good.com';
  let lastFocus = null;
  function openContact() {
    lastFocus = document.activeElement;
    contact.hidden = false;
    html.classList.add('contact-open');
    const mail = $('#contact-mail');
    mail.classList.remove('in');
    setTimeout(() => { develop(mail); contact.focus({ preventScroll: true }); }, 450);
  }
  function closeContact() {
    html.classList.remove('contact-open');
    contact.classList.remove('copied');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-contact]')) { e.preventDefault(); openContact(); return; }
    const c = e.target.closest('[data-close]');
    if (c) { if (c.tagName === 'BUTTON') e.preventDefault(); closeContact(); }
  });
  document.addEventListener('keydown', (e) => {
    if (!html.classList.contains('contact-open')) return;
    if (e.key === 'Escape') closeContact();
    if (e.key === 'Tab') {                       // keep the keyboard inside the open screen
      const f = $$('a, button', contact);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('#contact-mail').addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(MAIL); ok = true; } catch (err) {
      try {
        const t = Object.assign(document.createElement('textarea'), { value: MAIL });
        t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); ok = document.execCommand('copy'); t.remove();
      } catch (err2) { ok = false; }
    }
    if (!ok) { location.href = 'mailto:' + MAIL; return; }
    contact.classList.add('copied');
    $('#contact-hint').textContent = 'Copied: ' + MAIL;
    clearTimeout(openContact.t);
    openContact.t = setTimeout(() => contact.classList.remove('copied'), 1900);
  });
  if (location.hash === '#contact') openContact();

  // ---------- player: SoundCloud's own widget, our controls (wide screens) ----------
  const dock = { el: $('#dock'), widget: null, frame: null, dur: 0, rel: null, started: false, on: false };
  function play(id) {
    const r = rec(id);
    if (!r) return;
    if (!r.soundcloud) { window.open(r.spotify, '_blank', 'noopener'); return; }
    if (!docks(r)) { window.open(r.soundcloud, '_blank', 'noopener'); return; }
    if (dock.rel && dock.rel.id === r.id && dock.widget && !dock.el.hidden) { dock.widget.toggle(); return; }
    loadSC().then(() => start(r)).catch(() => window.open(r.soundcloud, '_blank', 'noopener'));
  }
  function loadSC() {
    if (window.SC && window.SC.Widget) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://w.soundcloud.com/player/api.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function state() {
    $$('.record').forEach((p) => p.classList.toggle('playing', !!(dock.on && dock.rel && dock.rel.id === p.dataset.id)));
    $$('a.rec').forEach((a) => a.classList.toggle('playing', !!(dock.on && dock.rel && dock.rel.id === a.dataset.id)));
  }
  const paused = (p) => { dock.on = !p; $('#dock-play').classList.toggle('paused', p); state(); };
  function start(r) {
    const url = r.soundcloud;
    $('#dock-title').textContent = r.by === 'Gusta' ? r.title : `${r.title}  ·  ${r.by}`;
    $('#dock-art').src = r.art;
    $('#dock-out').href = url;
    $('#dock-time').textContent = 'Loading';
    $('#dock-fill').style.width = '0';
    dock.el.hidden = false;
    html.style.setProperty('--dock', dock.el.offsetHeight + 'px');
    dock.rel = r; dock.started = false; dock.dur = 0;
    paused(true);
    const opts = { auto_play: true, show_artwork: false, show_comments: false, visual: false };
    if (!dock.frame) {
      const src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&auto_play=true&show_artwork=false&show_comments=false&visual=false';
      dock.frame = Object.assign(document.createElement('iframe'), { className: 'sc-frame', allow: 'autoplay; encrypted-media', title: 'SoundCloud player', src });
      dock.tap.appendChild(dock.frame);
      dock.widget = window.SC.Widget(dock.frame);
      const E = window.SC.Widget.Events;
      dock.widget.bind(E.READY, () => { dock.widget.getDuration((ms) => { dock.dur = ms; }); expectSound(); });
      dock.widget.bind(E.PLAY_PROGRESS, (e) => {
        if (!dock.started && e.currentPosition > 0) { dock.started = true; needTap(false); }
        if (!dock.dur) dock.widget.getDuration((ms) => { dock.dur = ms; });
        $('#dock-fill').style.width = (e.relativePosition * 100).toFixed(2) + '%';
        $('#dock-bar').setAttribute('aria-valuenow', Math.round(e.relativePosition * 100));
        $('#dock-time').textContent = `${clock(e.currentPosition)} / ${clock(dock.dur || dock.rel.seconds * 1000)}`;
      });
      dock.widget.bind(E.PLAY, () => paused(false));
      dock.widget.bind(E.PAUSE, () => paused(true));
      dock.widget.bind(E.FINISH, () => paused(true));
    } else {
      dock.widget.load(url, Object.assign({ callback: () => { dock.widget.getDuration((ms) => { dock.dur = ms; }); expectSound(); } }, opts));
    }
  }
  // If the browser will not start sound by itself, SoundCloud's own play button slides up for one click.
  dock.tap = Object.assign(document.createElement('div'), { className: 'sc-tap', innerHTML: '<p>Press play once to start the sound</p>' });
  document.body.appendChild(dock.tap);
  function needTap(on) {
    clearTimeout(dock.wait);
    if (on) $('#dock-time').textContent = 'Press play';
    dock.tap.classList.toggle('on', on);
  }
  function expectSound() {
    clearTimeout(dock.wait);
    dock.wait = setTimeout(() => { if (!dock.started && !dock.el.hidden) needTap(true); }, 2500);
  }
  $('#dock-play').addEventListener('click', () => { if (dock.widget) { dock.widget.toggle(); if (!dock.started) expectSound(); } });
  $('#dock-close').addEventListener('click', () => {
    if (dock.widget) dock.widget.pause();
    needTap(false); dock.el.hidden = true; html.style.setProperty('--dock', '0px'); paused(true);
  });
  const seek = (frac) => { if (dock.widget && dock.dur) dock.widget.seekTo(dock.dur * clamp(frac)); };
  $('#dock-bar').addEventListener('click', (e) => { const b = e.currentTarget.getBoundingClientRect(); seek((e.clientX - b.left) / b.width); });
  $('#dock-bar').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (!dock.widget || !dock.dur) return;
    dock.widget.getPosition((ms) => dock.widget.seekTo(clamp(ms + (e.key === 'ArrowRight' ? 5000 : -5000), 0, dock.dur)));
  });
})();
