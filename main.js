/* Selection Lab — page behaviour.
   Ports the design-canvas component logic to plain DOM:
   header colour, mobile menu, word-by-word manifesto reveal,
   scroll-in reveals, and the hero video fade. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOBILE_QUERY = window.matchMedia('(max-width: 820px)');

  /* --- Header colour ---------------------------------------------------- */

  var header = document.getElementById('site-header');

  /* --- Mobile menu ------------------------------------------------------ */

  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var toggleLabel = toggle.querySelector('.menu-toggle-label');
  var toggleSection = document.getElementById('menu-toggle-section');

  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Close' : 'Menu';
  }

  toggle.addEventListener('click', function () {
    setMenu(menu.hidden);
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) {
      setMenu(false);
      toggle.focus();
    }
  });

  MOBILE_QUERY.addEventListener('change', function (e) {
    if (!e.matches) setMenu(false);
  });

  /* --- Active section ----------------------------------------------------
     Both navs point at the same ids, so one entry per section drives every
     link that targets it — desktop pill, mobile menu, and the burger label. */

  var navPill = document.querySelector('.nav-pill');
  var sections = [];
  var byId = {};

  Array.prototype.forEach.call(
    document.querySelectorAll('.nav-pill a[href^="#"], .mobile-menu a[href^="#"]'),
    function (link) {
      var id = link.getAttribute('href').slice(1);
      var el = id && document.getElementById(id);
      if (!el) return;
      if (!byId[id]) {
        byId[id] = { id: id, el: el, name: link.textContent.trim(), links: [], pill: null };
        sections.push(byId[id]);
      }
      byId[id].links.push(link);
      if (navPill && navPill.contains(link)) byId[id].pill = link;
    }
  );

  /* One accent pill travels between links instead of each link carrying its
     own background, so the highlight slides from section to section. */
  var indicator = null;

  if (navPill && sections.length) {
    indicator = document.createElement('span');
    indicator.className = 'nav-indicator no-anim';
    indicator.setAttribute('aria-hidden', 'true');
    navPill.insertBefore(indicator, navPill.firstChild);
  }

  function moveIndicator(link, animate) {
    if (!indicator) return;
    if (!link) {
      navPill.classList.remove('has-active');
      return;
    }
    /* Coming from nowhere there is no previous position to travel from, so
       that first placement (and any re-measure) is written without motion. */
    if (!animate) indicator.classList.add('no-anim');
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    navPill.classList.add('has-active');
    if (!animate) {
      void indicator.offsetWidth;
      indicator.classList.remove('no-anim');
    }
  }

  /* Nav order need not match document order — sort so "last one passed" holds. */
  sections.sort(function (a, b) {
    return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });

  /* A section becomes current exactly where clicking its link would park it,
     which CSS states as scroll-margin-top. Measuring that instead of guessing
     a header offset keeps the two in step: guess low and the link you just
     clicked stays unlit, because the anchor lands the section below the line. */
  var SPY_SLACK = 4;

  function measureOffsets() {
    sections.forEach(function (section) {
      section.offset = parseFloat(getComputedStyle(section.el).scrollMarginTop) || 0;
    });
  }

  measureOffsets();

  var activeId = null;

  function paintActive() {
    if (!sections.length) return;

    var doc = document.documentElement;
    var next = null;

    /* The last section is often shorter than the viewport; at the very bottom
       it can never cross its line on its own, so claim it explicitly. */
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
      next = sections[sections.length - 1].id;
    } else {
      for (var i = 0; i < sections.length; i++) {
        var section = sections[i];
        var top = section.el.getBoundingClientRect().top + window.scrollY;
        if (top <= window.scrollY + section.offset + SPY_SLACK) next = section.id;
      }
    }

    if (next === activeId) return;
    var hadActive = activeId !== null;
    activeId = next;

    sections.forEach(function (section) {
      var on = section.id === activeId;
      section.links.forEach(function (link) {
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });

    moveIndicator(activeId ? byId[activeId].pill : null, hadActive && !!activeId);

    toggleSection.textContent = activeId ? byId[activeId].name : '';
    toggle.classList.toggle('has-section', !!activeId);
  }

  /* A resize changes link widths (the nav trims its padding at 1060px), so the
     pill has to be re-measured against the new layout. */
  function remeasureIndicator() {
    if (activeId) moveIndicator(byId[activeId].pill, false);
  }

  /* --- Manifesto: split into words, light them up as it scrolls through -- */

  var manifesto = document.getElementById('manifesto');
  var words = [];

  if (manifesto) {
    var source = manifesto.textContent.trim().split(/\s+/);
    manifesto.textContent = '';
    source.forEach(function (word, i) {
      var span = document.createElement('span');
      span.textContent = i < source.length - 1 ? word + ' ' : word;
      manifesto.appendChild(span);
      words.push(span);
    });
    manifesto.classList.add('is-split');
  }

  var lit = -1;

  function paintManifesto(vh) {
    if (!words.length) return;
    var top = manifesto.getBoundingClientRect().top;
    var progress = Math.max(0, Math.min(1, (vh * 0.9 - top) / (vh * 0.55)));
    var next = Math.round(progress * words.length);
    if (next === lit) return;
    for (var i = Math.min(lit, next); i < Math.max(lit, next); i++) {
      if (i >= 0 && words[i]) words[i].classList.toggle('is-lit', i < next);
    }
    lit = next;
  }

  /* --- Scroll loop ------------------------------------------------------ */

  var ticking = false;

  function onScroll() {
    var vh = window.innerHeight;
    header.classList.toggle('is-scrolled', window.scrollY >= vh - 140);
    paintActive();
    paintManifesto(vh);
    ticking = false;
  }

  function requestScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', function () {
    measureOffsets();
    remeasureIndicator();
    requestScroll();
  }, { passive: true });
  onScroll();

  /* Web fonts land after first paint and shift the link widths under it. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(remeasureIndicator);
  }

  /* --- Reveal on scroll -------------------------------------------------- */

  var duration = reduceMotion ? '.3s' : '.7s';
  var ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var targets = document.querySelectorAll('[data-reveal]');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = el.getAttribute('data-reveal-delay') || '0';
      el.style.transition =
        'opacity ' + duration + ' ' + ease + ' ' + delay + 's, ' +
        'transform ' + duration + ' ' + ease + ' ' + delay + 's';
      el.classList.add('is-revealed');
      observer.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  targets.forEach(function (el) { observer.observe(el); });

  /* --- Hero video ------------------------------------------------------- */

  var video = document.getElementById('hero-video');
  if (video) {
    var show = function () { video.classList.add('is-ready'); };
    video.addEventListener('load', show);
    setTimeout(show, 2500);
  }

  /* --- Footer year ------------------------------------------------------ */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
