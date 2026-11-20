/* Listing template v5 · motion: door (or elevator) intro · hero cascade · signature pan · pinned story · before/after ·
   pinned floor plans · price odometer + grid · menu · coverflow · zoomable lightbox. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (!hasGsap) { root.classList.add('rm'); root.classList.remove('has-intro'); }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const clamp01 = v => clamp(v, 0, 1);
  const smooth = t => t * t * (3 - 2 * t);
  const pad2 = n => String(n).padStart(2, '0');
  const boxOf = el => el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el;

  /* ---------------- deferred photos: load a section's photos when it is ~1.5 screens away ---------------- */
  const loadImg = im => { if (!im.dataset.src) return; if (im.dataset.srcset) im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); im.removeAttribute('data-srcset'); };
  const deferred = $$('img[data-src]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      $$('img[data-src]', e.target).forEach(loadImg); io.unobserve(e.target);
    }), { rootMargin: '0px 0px 150% 0px' });
    new Set(deferred.map(im => im.closest('section') || im.parentElement)).forEach(s => io.observe(s));
  } else deferred.forEach(loadImg);

  /* ---------------- English words never cut off: scale to fit the width ---------------- */
  function fitAll() {
    $$('.fit').forEach(el => {
      el.style.fontSize = '';
      const box = el.parentElement.clientWidth, w = el.scrollWidth;
      if (box > 0 && w > box) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * box / w * 0.98).toFixed(1) + 'px';
    });
  }
  fitAll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  /* ---------------- in-page navigation · menu · lightbox · gallery · before/after (work with or without GSAP) ---------------- */
  let lenis = null;
  const jumps = {};   // hash -> () => y   (pinned sections register a better target)
  function scrollToHash(hash) {
    const t = hash && hash.length > 1 && $(hash);
    if (!t) return false;
    const y = hash === '#hero' ? 0 : jumps[hash] ? jumps[hash]() : boxOf(t).getBoundingClientRect().top + scrollY;
    if (lenis) lenis.scrollTo(y, { duration: 1.6 }); else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    return true;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.closest('.menu')) return;
    if (scrollToHash(a.getAttribute('href'))) e.preventDefault();
  });
  initMenu();
  const LB = initLightbox();
  initGallery();
  const BA = initBeforeAfter();
  initPlanTaps();

  /* ---------------- top bar · progress · dark wash · pill (plain scroll listener: cheap) ---------------- */
  const bar = $('.topbar'), prog = $('.progress i'), hero = $('#hero'), facts = $('#facts'), sig = $('#house'), motif = $('.motif');
  const darkMotif = root.dataset.theme !== 'light';
  let lastY = scrollY;
  const sizeMotif = () => { if (!darkMotif || !motif) return; motif.style.height = Math.ceil(innerHeight + Math.max(0, root.scrollHeight - innerHeight) * 0.1 + 2) + 'px'; };
  function onScroll() {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (darkMotif && motif && !reduce) motif.style.transform = `translate3d(0, ${(-y * 0.1).toFixed(1)}px, 0)`;
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
    bar.classList.toggle('is-solid', y > 40);
    if (Math.abs(y - lastY) > 6) { bar.classList.toggle('is-up', y > lastY && y > 120 && y > heroBottom - 60); lastY = y; }
    let w = 0;
    if (facts) {
      // the dark section: crossfade in over its first ~30%, back out over its last ~25%
      const r = facts.getBoundingClientRect(), h = innerHeight;
      const inP = clamp01((h - r.top) / (r.height * 0.3));
      const outP = clamp01((h * 0.55 - r.bottom) / (h * 0.45));
      w = r.top > h ? 0 : smooth(inP) * (1 - smooth(outP));
      root.style.setProperty('--wash', w.toFixed(3));
    }
    if (sig) { const r = boxOf(sig).getBoundingClientRect(); bar.classList.toggle('on-photo', r.top <= 28 && r.bottom > 56); }
    bar.classList.toggle('on-dark', w > 0.5);
    updatePill();
  }

  /* ---------------- floating pill: never in pinned sequences or the hero, gone from the visit section on ---------------- */
  const pill = $('.pill');
  const noPillZones = ['#hero', '#house', '#story', '#plan'].map(s => $(s)).filter(Boolean);
  const visit = $('#visit');
  const guard = $$('.sh, .story-line, .price-sub, .extras, .loc-line, .text-link, .ba-chips, .ba-note, .cf-meta, .cf-bar');
  const frames = $$('.frame').filter(f => !f.closest('#story, #plan, #hero'));
  let pillHidden = true;
  function updatePill() {
    if (!pill) return;
    const h = innerHeight, vw = innerWidth;
    let hide = false;
    for (const el of noPillZones) {
      const r = boxOf(el).getBoundingClientRect();
      if (r.top < h * 0.6 && r.bottom > h * 0.4) { hide = true; break; }
      if (el.id === 'hero' && r.bottom > h * 0.25) { hide = true; break; }
    }
    if (!hide && visit && visit.getBoundingClientRect().top < h) hide = true;
    if (!hide && LB && LB.isOpen()) hide = true;
    if (!hide) {
      const zoneTop = h - 20 - 44 - 16, half = 130, mid = vw / 2;
      hide = guard.some(el => {
        const r = el.getBoundingClientRect();
        return r.height && r.bottom > zoneTop && r.top < h && r.left < mid + half && r.right > mid - half;
      }) || frames.some(el => {
        const r = el.getBoundingClientRect();
        if (!r.height || r.right < 0 || r.left > vw) return false;
        const cy = (r.top + r.bottom) / 2, band = Math.min(120, r.height * 0.3);
        return cy + band > zoneTop && cy - band < h;
      });
    }
    if (hide !== pillHidden) { pillHidden = hide; pill.classList.toggle('is-hidden', hide); }
  }

  const digits = $$('.pd');
  const setDigit = (pd, v) => { $('.pd-col', pd).style.transform = `translateY(${-v * 5}%)`; };

  if (!hasGsap || reduce) {
    digits.forEach(pd => setDigit(pd, +pd.dataset.d));
    $$('.intro').forEach(el => el.remove());
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { fitAll(); sizeMotif(); onScroll(); });
    sizeMotif(); onScroll();
    if (hasGsap) simpleFades();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'power3.out' });

  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), touchMultiplier: 1.2 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- shared pieces: header reveal, frame draw, photo rise ---------------- */
  function revealHead(sh, tl = gsap.timeline(), at = 0) {
    const lab = $('.sh-label', sh), lns = $$('.ln > span', sh), rule = $('.sh-rule', sh);
    if (lab) tl.fromTo(lab, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7 }, at);
    if (lns.length) tl.fromTo(lns, { yPercent: 105, y: 0 }, { yPercent: 0, duration: 0.9, stagger: 0.08 }, at + 0.1);
    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.inOut' }, at + 0.25);
    return tl;
  }
  const edges = el => ['t', 'l', 'b', 'r'].map(k => $('.fr-' + k, el));
  function hideFrame(el, inner) {
    const [t, l, b, r] = edges(el);
    gsap.set([t, b], { scaleX: 0 }); gsap.set([l, r], { scaleY: 0 });
    if (inner) gsap.set(inner, { clipPath: 'inset(100% 0% 0% 0%)' });
  }
  function drawFrame(tl, el, at, dur, w, h) {
    const [t, l, b, r] = edges(el), per = dur / (2 * (w + h));
    tl.fromTo(t, { scaleX: 0 }, { scaleX: 1, duration: w * per, ease: 'none' }, at)
      .fromTo(l, { scaleY: 0 }, { scaleY: 1, duration: h * per, ease: 'none' }, at + w * per)
      .fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: w * per, ease: 'none' }, at + (w + h) * per)
      .fromTo(r, { scaleY: 0 }, { scaleY: 1, duration: h * per, ease: 'none' }, at + (2 * w + h) * per);
    return tl;
  }
  const risePhoto = (tl, inner, at, dur) => tl.fromTo(inner, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur, ease: 'power2.inOut' }, at);

  /* ---------------- the intro, then the hero cascade ---------------- */
  if (hero) {
    const hframe = $('.hero-frame', hero), himg = $('.hero-img', hero);
    const heroIn = (t, at) => {
      const S = 0.08;
      hideFrame(hframe);
      drawFrame(t, hframe, at + 0.05, 0.7, hframe.offsetWidth + 20, hframe.offsetHeight + 20);
      const rise = (els, i) => { els = [].concat(els).filter(Boolean); if (els.length) t.fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, at + i * S); };
      rise([$('.brand', bar), $('.menu-btn', bar)], 0);
      t.fromTo($('.topbar-line', bar), { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: 'power2.inOut' }, at);
      rise($('.hero-label', hero), 1); rise($('.hero-title', hero), 2); rise($('.hero-meta', hero), 3); rise($('.hero-price', hero), 4);
      t.fromTo($('.hero-rule', hero), { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: 'power2.inOut' }, at + 5 * S);
      rise($$('.hero-bottom > *', hero), 6);
      rise($('.hero-chip', hero), 7);
    };
    const intro = $('div.intro');
    if (root.classList.contains('has-intro') && intro) {
      intro.style.animation = 'none';
      let done = false;
      const evs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
      const skip = () => { if (!done) itl.progress(1); };
      const end = () => { if (done) return; done = true; evs.forEach(e => removeEventListener(e, skip)); root.classList.remove('has-intro'); intro.remove(); gsap.set(hero, { clearProps: 'transform' }); ScrollTrigger.refresh(); };
      const itl = gsap.timeline({ onComplete: end });
      if (intro.classList.contains('intro-door')) {
        // 0.3 the handle brightens · 0.5–1.5 the door swings in on its hinge · the hero settles 1.05 → 1 behind it
        const door = $('.door', intro), shade = $('.door-shade', intro);
        itl.fromTo($('.door-num', intro), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0)
          .to($('.door-handle b', intro), { opacity: 1, duration: 0.22, ease: 'power1.out' }, 0.3)
          .fromTo(door, { rotateY: 0 }, { rotateY: -100, duration: 1.0, ease: 'power3.inOut' }, 0.5)
          .fromTo(shade, { opacity: 1 }, { opacity: 0, duration: 0.8, ease: 'power1.inOut' }, 0.75)
          .fromTo(hero, { scale: 1.05 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, 0.5);
        heroIn(itl, 1.15);
      } else {
        const fl = $('.floor', intro), col = $('.floor-col', intro), seam = $('.edoor-seam', intro);
        const n = $$('.floor-col > span', intro).length, steps = n - 1;
        itl.fromTo(fl, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0.05);
        let at = 0.4;
        for (let k = 1; k <= steps; k++) {
          const last = k === steps, dur = steps === 1 ? 1 : last ? 0.36 : 0.64 / (steps - 1);
          itl.to(col, { yPercent: -100 * k / n, duration: dur, ease: last ? 'power3.out' : 'power2.inOut' }, at);
          at += dur;
        }
        itl.to(seam, { opacity: 1, duration: 0.08, ease: 'none' }, 1.38).to(seam, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 1.5)
          .to(fl, { opacity: 0, duration: 0.25, ease: 'power1.in' }, 1.4)
          .to($('.edoor-l', intro), { xPercent: -100, duration: 0.6, ease: 'power3.inOut' }, 1.4)
          .to($('.edoor-r', intro), { xPercent: 100, duration: 0.6, ease: 'power3.inOut' }, 1.4);
        heroIn(itl, 1.5);
      }
      evs.forEach(e => addEventListener(e, skip, { passive: true }));
    } else {
      if (intro) intro.remove();
      heroIn(gsap.timeline(), 0.1);
    }
    // slow push-in on the hero photo as it scrolls away
    gsap.fromTo(himg, { scale: 1 }, { scale: 1.06, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------------- the signature: pinned, the landscape photo pans across, the headline rises ---------------- */
  if (sig) {
    const im = $('.sig-img', sig), sh = $('.sh', sig), sub = $('.sig-sub', sig);
    gsap.set(im, { transformOrigin: '100% 50%' });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sig, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.7), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    tl.fromTo(im, { x: 0, scale: 1.05 }, { x: () => Math.max(0, im.offsetWidth - innerWidth), scale: 1, duration: 1 }, 0);
    const lab = $('.sh-label', sh), lns = $$('.ln > span', sh), rule = $('.sh-rule', sh);
    tl.fromTo(lab, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.08)
      .fromTo(lns, { yPercent: 105 }, { yPercent: 0, duration: 0.14, stagger: 0.03, ease: 'power3.out' }, 0.12)
      .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.12, ease: 'power2.inOut' }, 0.24);
    if (sub) tl.fromTo(sub, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.3);
    jumps['#house'] = () => tl.scrollTrigger.start + (tl.scrollTrigger.end - tl.scrollTrigger.start) * 0.4;
  }

  /* ---------------- the story: pinned; the framed photo rises away while the next frame draws ---------------- */
  const story = $('#story');
  if (story) {
    const items = $$('.story-item', story), now = $('.story-now', story), n = items.length;
    const parts = items.map(it => ({ it, word: $('.story-word', it), fr: $('.frame', it), inner: $('.frame-in', it), img: $('.frame-in img', it), line: $('.story-line', it) }));
    parts.forEach(p => { hideFrame(p.fr, p.inner); gsap.set([p.word, p.line], { opacity: 0, y: 30 }); });
    let cur = -1;
    const setNow = i => { if (i !== cur) { cur = i; now.textContent = pad2(i + 1); } };
    const HOLD = 0.6, TRANS = 1.3, STEP = TRANS + HOLD;
    const total = HOLD + (n - 1) * STEP + 0.3;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: story, start: 'top top', end: () => '+=' + Math.round(innerHeight * total * 0.75), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: s => { const u = s.progress * total; setNow(Math.min(n - 1, Math.max(0, Math.floor((u - HOLD - TRANS * 0.5) / STEP) + 1))); }
      }
    });
    ScrollTrigger.create({ trigger: story, start: 'top 55%', once: true, onEnter: () => {
      const p = parts[0], t = gsap.timeline();
      revealHead($('.sh', story), t, 0);
      t.to(p.word, { opacity: 1, y: 0, duration: 0.9 }, 0);
      drawFrame(t, p.fr, 0.15, 0.9, p.fr.offsetWidth, p.fr.offsetHeight);
      risePhoto(t, p.inner, 1.0, 0.9);
      t.to(p.line, { opacity: 1, y: 0, duration: 0.7 }, 1.3);
    } });
    parts.forEach((p, i) => {
      const t0 = i === 0 ? 0 : HOLD + (i - 1) * STEP;
      tl.fromTo(p.img, { scale: 1 }, { scale: 1.05, duration: (i === 0 ? HOLD : STEP) + (i < n - 1 ? TRANS * 0.5 : 0.3) }, t0);
      if (i === 0) return;
      tl.to(parts[i - 1].it, { y: -90, opacity: 0, duration: 0.55, ease: 'power1.in' }, t0)
        .fromTo(p.word, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, t0 + 0.35);
      drawFrame(tl, p.fr, t0 + 0.25, 0.6, p.fr.offsetWidth || 1, p.fr.offsetHeight || 1);
      risePhoto(tl, p.inner, t0 + 0.7, 0.55);
      tl.fromTo(p.line, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, t0 + 0.95);
    });
    tl.to({}, { duration: 0.3 }, total - 0.3);
  }

  /* ---------------- the plan: pinned; scroll steps through the floors, each one draws itself in ---------------- */
  const plan = $('#plan');
  if (plan) {
    const tabs = $$('.pl-tab', plan), barFill = $('.pl-bar b', plan);
    const parts = $$('.pl-floor', plan).map(f => ({ f, ink: $('.pl-ink', f), note: $('.pl-note', f), en: $('.pl-en', f), lis: $$('.pl-rooms li', f), fr: $('.pl-photo', f), inner: $('.pl-photo .frame-in', f) }));
    const n = parts.length;
    parts.forEach(p => { gsap.set(p.ink, { clipPath: 'inset(0% 100% 0% 0%)' }); gsap.set([p.note, p.en, ...p.lis].filter(Boolean), { opacity: 0 }); if (p.fr) { hideFrame(p.fr); gsap.set(p.fr, { opacity: 0 }); } });
    parts[0].f.classList.remove('is-on');
    let cur = -1, stl = null, entered = false;
    const show = (i, dir) => {
      if (i === cur) return;
      if (stl) stl.progress(1);
      const old = parts[cur], nu = parts[i];
      cur = i;
      tabs.forEach((t, k) => { t.classList.toggle('is-on', k === i); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      gsap.to(barFill, { scaleX: (i + 1) / n, duration: 0.6, ease: 'power2.inOut' });
      stl = gsap.timeline();
      const at = old ? 0.32 : 0;
      if (old) stl.to(old.f, { y: -60 * dir, opacity: 0, duration: 0.42, ease: 'power2.in', onComplete: () => old.f.classList.remove('is-on') }, 0);
      nu.f.classList.add('is-on');
      stl.fromTo(nu.f, { y: old ? 70 * dir : 0, opacity: old ? 0 : 1 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, at)
        .fromTo(nu.ink, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power2.inOut' }, at + 0.1)
        .fromTo([nu.note, nu.en].filter(Boolean), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' }, at + 0.6)
        .fromTo(nu.lis, { opacity: 0, y: 10, '--s': 0 }, { opacity: 1, y: 0, '--s': 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, at + 0.7);
      if (nu.fr) {
        stl.fromTo(nu.fr, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.5)' }, at + 0.8);
        drawFrame(stl, nu.fr, at + 0.9, 0.5, nu.fr.offsetWidth, nu.fr.offsetHeight);
      }
    };
    const st = ScrollTrigger.create({
      trigger: plan, start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.85 * n), pin: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: s => { if (entered) { const i = Math.min(n - 1, Math.floor(s.progress * n * 0.999)); show(i, i > cur ? 1 : -1); } }
    });
    ScrollTrigger.create({ trigger: plan, start: 'top 60%', once: true, onEnter: () => { entered = true; revealHead($('.sh', plan)); show(Math.min(n - 1, Math.floor(st.progress * n * 0.999)), 1); } });
    const floorY = j => st.start + (st.end - st.start) * ((j + 0.5) / n);
    tabs.forEach((t, j) => t.addEventListener('click', () => { if (lenis) lenis.scrollTo(floorY(j), { duration: 1.2 }); else scrollTo({ top: floorY(j), behavior: 'smooth' }); }));
    jumps['#plan'] = () => st.start + 2;
  }

  /* ---------------- generic reveals (created after the pins so their positions include the pin spacing) ---------------- */
  $$('.sh').filter(sh => !sh.closest('#hero, #house, #story, #plan')).forEach(sh => {
    ScrollTrigger.create({ trigger: sh, start: 'top 86%', once: true, onEnter: () => revealHead(sh) });
  });
  const fadeIn = (el, delay = 0) => gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, delay });
  $$('[data-fade]').forEach(el => {
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => fadeIn(el, el.matches('.slot') ? 0.06 * $$('.slot').indexOf(el) : 0.08) });
  });
  $$('.frame[data-reveal]').forEach(fr => {
    const inner = $('.frame-in', fr), im = $('img', fr), isBA = fr.classList.contains('ba-frame');
    ScrollTrigger.create({ trigger: fr, start: 'top 80%', once: true, onEnter: () => {
      const tl = gsap.timeline();
      drawFrame(tl, fr, 0, 0.9, fr.offsetWidth, fr.offsetHeight);
      risePhoto(tl, inner, 0.9, 0.9);
      if (isBA && BA) tl.add(() => BA.hint(), 1.6);
    } });
    if (!isBA) gsap.fromTo(im, { scale: 1 }, { scale: 1.05, ease: 'none', scrollTrigger: { trigger: fr, start: 'top 80%', end: 'bottom top', scrub: true } });
  });

  /* ---------------- the price: odometer roll + the grid draws in from the centre, once ---------------- */
  const price = $('#price');
  if (price) {
    digits.forEach(pd => { $('.pd-col', pd).style.transform = ''; });
    ScrollTrigger.create({ trigger: $('.price-num', price), start: 'top 78%', once: true, onEnter: () => {
      const tl = gsap.timeline();
      const ringPaths = $$('.price-rings path', price);
      if (ringPaths.length) tl.to(ringPaths, { strokeDashoffset: 0, duration: 2.4, stagger: 0.07, ease: 'power2.out' }, 0);
      const gh = $('.pg-h', price), gv = $('.pg-v', price);
      if (gh) tl.to(gh, { scaleX: 1, duration: 1.6, ease: 'power3.inOut' }, 0).to(gv, { scaleY: 1, duration: 1.6, ease: 'power3.inOut' }, 0.15);
      digits.forEach((pd, i) => {
        const d = +pd.dataset.d, col = $('.pd-col', pd);
        tl.fromTo(col, { yPercent: 0 }, { yPercent: -(10 + d) * 5, duration: 1.2, ease: 'power4.out' }, 0.1 + i * 0.06);
      });
      tl.to($$('.pc', price), { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.9);
    } });
  }

  /* ---------------- in numbers: count up once ---------------- */
  $$('.fact-num').forEach(el => {
    const raw = el.dataset.count, to = parseFloat(raw), dec = (raw.split('.')[1] || '').length;
    if (!isFinite(to)) return;
    const o = { v: 0 };
    el.textContent = (0).toFixed(dec);
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1, ease: 'power2.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); } }) });
  });

  /* ---------------- refresh discipline ---------------- */
  ScrollTrigger.addEventListener('refreshInit', fitAll);
  ScrollTrigger.addEventListener('refresh', () => { sizeMotif(); onScroll(); });
  ScrollTrigger.refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  const himg0 = $('.hero-img');
  if (himg0 && !himg0.complete) himg0.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  addEventListener('load', () => ScrollTrigger.refresh(), { once: true });

  /* ================================================================ */
  function simpleFades() {
    gsap.registerPlugin(ScrollTrigger);
    $$('[data-fade], [data-lines], .sh').forEach(el => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  }

  function initMenu() {
    const menu = $('#menu'), btn = $('.menu-btn');
    if (!menu || !btn) return;
    const closeBtn = $('.menu-close', menu), links = $$('.menu-link', menu);
    const anim = () => !!window.gsap && !reduce;
    let isOpen = false;
    const open = () => {
      if (isOpen) return; isOpen = true;
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      root.classList.add('menu-open'); if (lenis) lenis.stop();
      if (anim()) {
        gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
        gsap.fromTo(links, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.05, ease: 'power3.out', delay: 0.08 });
      }
      closeBtn.focus();
    };
    const close = then => {
      if (!isOpen) return; isOpen = false;
      btn.setAttribute('aria-expanded', 'false');
      const done = () => { menu.hidden = true; root.classList.remove('menu-open'); if (lenis) lenis.start(); if (then) then(); else btn.focus(); };
      if (anim()) gsap.to(menu, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: done }); else done();
    };
    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', () => close());
    links.forEach(a => a.addEventListener('click', e => { e.preventDefault(); const h = a.getAttribute('href'); close(() => scrollToHash(h)); }));
    menu.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') {
        const f = [closeBtn, ...links], first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---- the full-screen lightbox: a list of photos (swipe), or one plan (pinch / double-tap zoom) ---- */
  function initLightbox() {
    const lb = $('.lightbox');
    if (!lb) return null;
    const track = $('.lb-track', lb), count = $('.lb-count', lb), closeBtn = $('.lb-close', lb), prev = $('.lb-prev', lb), next = $('.lb-next', lb);
    let items = [], slides = [], idx = 0, opener = null, onClose = null, raf = 0, open = false;
    const load = i => { const im = slides[i] && $('img', slides[i]); if (im && !im.src) im.src = im.dataset.src; };
    const setCount = i => { idx = i; count.textContent = items.length > 1 ? `${pad2(i + 1)} / ${pad2(items.length)}` : ''; load(i - 1); load(i); load(i + 1); };
    const go = (i, sm = true) => {
      i = clamp(i, 0, items.length - 1);
      track.scrollTo({ left: i * track.clientWidth, behavior: sm && !reduce ? 'smooth' : 'auto' });
      setCount(i);
    };
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { const i = Math.round(track.scrollLeft / track.clientWidth); if (i !== idx) setCount(i); });
    }, { passive: true });
    function show(list, i, from, opts = {}) {
      items = list; opener = from || document.activeElement; onClose = opts.onClose || null;
      lb.classList.toggle('is-plan', !!opts.zoom);
      track.style.overflowX = list.length > 1 ? '' : 'hidden';
      prev.hidden = next.hidden = list.length < 2;
      track.innerHTML = list.map((p, k) => `<figure class="lb-slide${opts.zoom ? ' lb-zoom' : ''}" data-i="${k}"><img data-src="${p.src}" alt="${String(p.alt).replace(/"/g, '&quot;')}" width="${p.w}" height="${p.h}" decoding="async"></figure>`).join('');
      slides = $$('.lb-slide', track);
      lb.hidden = false; open = true;
      root.classList.add('lb-open');
      if (lenis) lenis.stop();
      setCount(i);
      if (opts.zoom) slides.forEach(s => zoomable($('img', s)));
      requestAnimationFrame(() => { go(i, false); closeBtn.focus(); });
      updatePill();
    }
    const close = () => {
      lb.hidden = true; open = false;
      root.classList.remove('lb-open');
      if (lenis) lenis.start();
      if (onClose) onClose(idx); else if (opener) opener.focus({ preventScroll: true });
      updatePill();
    };
    closeBtn.addEventListener('click', close);
    prev.addEventListener('click', () => go(idx - 1));
    next.addEventListener('click', () => go(idx + 1));
    lb.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
      else if (e.key === 'Tab') {
        const f = $$('button', lb).filter(b => !b.hidden && b.offsetParent !== null);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    // pinch, drag and double-tap zoom on one image (transform only)
    function zoomable(im) {
      let s = 1, tx = 0, ty = 0, base = null, g = null, lastTap = 0;
      const pts = new Map();
      const apply = () => { im.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${s.toFixed(4)})`; };
      const measure = () => { const t = im.style.transform; im.style.transform = 'none'; const r = im.getBoundingClientRect(); im.style.transform = t; base = { x: r.left, y: r.top }; };
      const zoomAt = (px, py, ns) => { ns = clamp(ns, 1, 5); const ux = (px - base.x - tx) / s, uy = (py - base.y - ty) / s; s = ns; if (s === 1) { tx = ty = 0; } else { tx = px - base.x - ux * s; ty = py - base.y - uy * s; } apply(); };
      const start = () => {
        const p = [...pts.values()];
        if (p.length === 2) { const mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2; g = { pinch: true, d0: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) || 1, s0: s, ux: (mx - base.x - tx) / s, uy: (my - base.y - ty) / s }; }
        else if (p.length === 1) g = { pinch: false, x0: p[0].x, y0: p[0].y, tx0: tx, ty0: ty };
      };
      im.addEventListener('pointerdown', e => { if (!base) measure(); im.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); start(); });
      im.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const p = [...pts.values()];
        if (g && g.pinch && p.length === 2) {
          const mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2, d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
          s = clamp(g.s0 * d / g.d0, 1, 5); tx = mx - base.x - g.ux * s; ty = my - base.y - g.uy * s; apply();
        } else if (g && !g.pinch && s > 1) { tx = g.tx0 + e.clientX - g.x0; ty = g.ty0 + e.clientY - g.y0; apply(); }
      });
      const up = e => {
        if (!pts.has(e.pointerId)) return;
        const moved = g && !g.pinch && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 10;
        pts.delete(e.pointerId);
        if (s <= 1.02) { s = 1; tx = ty = 0; apply(); }
        if (e.type === 'pointerup' && !pts.size && !moved && !(g && g.pinch)) {
          const t = performance.now();
          if (t - lastTap < 320) { zoomAt(e.clientX, e.clientY, s > 1.2 ? 1 : 2.5); lastTap = 0; } else lastTap = t;
        }
        start();
      };
      im.addEventListener('pointerup', up); im.addEventListener('pointercancel', up);
      im.addEventListener('wheel', e => { e.preventDefault(); if (!base) measure(); zoomAt(e.clientX, e.clientY, s * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
      addEventListener('resize', () => { base = null; s = 1; tx = ty = 0; apply(); });
    }
    return { open: show, isOpen: () => open };
  }

  function initPlanTaps() {
    $$('.pl-draw').forEach(b => b.addEventListener('click', () => {
      if (!LB) return;
      const f = b.closest('.pl-floor'), name = f ? f.getAttribute('aria-label') : '';
      LB.open([{ src: b.dataset.src, alt: `תוכנית ${name}`, w: +b.dataset.w, h: +b.dataset.h }], 0, b, { zoom: true });
    }));
  }

  function initGallery() {
    const data = $('#gallery-data'), cf = $('.cf');
    if (!data || !cf) return;
    const photos = JSON.parse(data.textContent);
    const track = $('.cf-track', cf), slides = $$('.cf-slide', track);
    const cards = slides.map(sl => $('.cf-card', sl)), dims = slides.map(sl => $('.cf-dim', sl));
    const segs = $$('.cf-seg'), now = $('.cf-now'), en = $('.cf-en'), he = $('.cf-he'), cap = $('.cf-cap');
    const last = slides.length - 1;
    let W = 1, active = 0, ticking = 0;
    const prevA = slides.map(() => -1);
    const measure = () => { W = slides[0].offsetWidth || 1; };
    const setActive = i => {
      if (i === active) return;
      slides[active].classList.remove('is-on'); if (segs[active]) segs[active].classList.remove('is-on');
      active = i;
      slides[i].classList.add('is-on'); if (segs[i]) segs[i].classList.add('is-on');
      now.textContent = pad2(i + 1); en.textContent = photos[i].latin; he.textContent = photos[i].he;
      if (!reduce && cap.animate) cap.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.22,.9,.3,1)' });
    };
    const render = () => {
      ticking = 0;
      const p = track.scrollLeft / W;
      for (let i = 0; i <= last; i++) {
        const d = i - p, a = Math.min(1, Math.abs(d));
        if (a === 1 && prevA[i] === 1) continue;
        prevA[i] = a;
        const sc = 1 - 0.22 * a, tx = -Math.sign(d) * a * W * 0.05;
        cards[i].style.transform = `translate3d(${tx.toFixed(1)}px,0,0) scale(${sc.toFixed(4)})`;
        cards[i].style.opacity = (1 - 0.6 * a).toFixed(3);
        dims[i].style.opacity = (0.3 * a).toFixed(3);
      }
      setActive(clamp(Math.round(p), 0, last));
    };
    const go = (i, sm = true) => { i = clamp(i, 0, last); track.scrollTo({ left: i * W, behavior: sm && !reduce ? 'smooth' : 'auto' }); };
    track.addEventListener('scroll', () => { if (!ticking) ticking = requestAnimationFrame(render); }, { passive: true });
    addEventListener('resize', () => { measure(); prevA.fill(-1); go(active, false); render(); });
    measure(); render();
    const openLb = (i, c) => LB && LB.open(photos, i, c, { onClose: k => { go(k, false); if (cards[k]) cards[k].focus({ preventScroll: true }); } });
    cards.forEach((c, i) => c.addEventListener('click', () => {
      if (track.dataset.dragged) return;
      if (i === active) openLb(i, c); else go(i);
    }));
    segs.forEach((b, i) => b.addEventListener('click', () => go(i)));
    $('.cf-prev', cf).addEventListener('click', () => go(active - 1));
    $('.cf-next', cf).addEventListener('click', () => go(active + 1));
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
      else if (e.key === 'Enter' && e.target === track) openLb(active, cards[active]);
    });
    let down = null;
    track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = { x: e.clientX, s: track.scrollLeft, moved: false, v: 0, lx: e.clientX, lt: performance.now() }; });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.x, t = performance.now();
      if (!down.moved && Math.abs(dx) > 6) { down.moved = true; track.classList.add('is-drag'); track.dataset.dragged = '1'; }
      if (down.moved) { track.scrollLeft = down.s - dx; down.v = (e.clientX - down.lx) / Math.max(1, t - down.lt); down.lx = e.clientX; down.lt = t; }
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      const d = down; down = null;
      if (!d.moved) return;
      track.classList.remove('is-drag');
      go(Math.round((track.scrollLeft - d.v * 220) / W));
      setTimeout(() => { delete track.dataset.dragged; }, 50);
    });
  }

  /* ---- before / after: drag anywhere on the photo (horizontal intent), arrow keys via the range input, style chips ---- */
  function initBeforeAfter() {
    const ba = $('.ba');
    if (!ba) return null;
    const range = $('.ba-range', ba), styles = $$('.ba-style', ba), chips = $$('.ba-chip');
    let pos = 50, anim = 0, touched = false;
    const set = v => { pos = clamp(v, 0, 100); ba.style.setProperty('--pos', pos.toFixed(2)); range.value = String(Math.round(pos)); };
    const stop = () => { touched = true; cancelAnimationFrame(anim); };
    range.addEventListener('input', () => { stop(); set(+range.value); });
    const at = e => { const r = ba.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
    let drag = null;
    ba.addEventListener('pointerdown', e => {
      if (ba.classList.contains('is-real')) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, on: e.pointerType === 'mouse' };
      if (drag.on) { e.preventDefault(); ba.setPointerCapture(e.pointerId); stop(); set(at(e)); }
    });
    ba.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.on) {
        const dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
        if (dx > 6 && dx > dy) { drag.on = true; try { ba.setPointerCapture(e.pointerId); } catch (_) {} stop(); }
        else if (dy > 8) { drag = null; return; }
      }
      if (drag.on) set(at(e));
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (e.type === 'pointerup' && !drag.on && e.pointerType !== 'mouse') { stop(); tween(at(e), 0.35); }   // a tap moves the divider there
      drag = null;
    };
    ba.addEventListener('pointerup', end); ba.addEventListener('pointercancel', end);
    function tween(to, dur, delay = 0) {
      cancelAnimationFrame(anim);
      const from = pos, t0 = performance.now() + delay * 1000;
      const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const step = now => { const t = clamp01((now - t0) / (dur * 1000)); set(from + (to - from) * ease(t)); if (t < 1) anim = requestAnimationFrame(step); };
      anim = requestAnimationFrame(step);
    }
    chips.forEach(c => c.addEventListener('click', () => {
      const k = +c.dataset.style;
      chips.forEach(x => x.setAttribute('aria-pressed', x === c ? 'true' : 'false'));
      ba.classList.toggle('is-real', k < 0);
      range.disabled = k < 0;
      if (k >= 0) styles.forEach((im, i) => im.classList.toggle('is-on', i === k));
    }));
    // a hint, once: the divider sweeps 85% → 50% when the section is in view
    let hinted = false;
    const hint = () => { if (hinted || touched || reduce) return; hinted = true; if (pos !== 85) set(85); tween(50, 1.3, 0.25); };
    if (!reduce && (!window.gsap || !window.ScrollTrigger) && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { hint(); io.disconnect(); } }, { threshold: 0.5 });
      io.observe(ba);
    }
    set(!reduce && window.gsap && window.ScrollTrigger ? 85 : 50);   // revealed already at 85, then the hint sweeps it to 50
    return { hint };
  }
})();
