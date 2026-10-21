/* Selection Lab — page behaviour.
   Ports the design-canvas component logic to plain DOM:
   header colour, mobile menu, word-by-word manifesto reveal,
   scroll-in reveals, and the hero video fade. */

console.log(
  '%c Selection Lab %c\n Site by Ali Ayati — github.com/cpt9m0 ',
  'color:#fff; background:#111; font-size:16px; font-weight:700; padding:6px 10px; border-radius:4px 4px 0 0;',
  'color:#888; background:#111; font-size:12px; padding:4px 10px 8px; border-radius:0 0 4px 4px;'
);

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

/* Selection Lab podcast — one shared <audio> element drives every episode
   card. The episode list in index.html is a static snapshot of the RSS feed
   (so it renders with no JS); this block first wires the player to that
   snapshot, then fetches the live feed — Anchor sends
   `Access-Control-Allow-Origin: *`, so the browser can read it directly —
   and re-renders the list if the feed loads. New episodes therefore appear
   on the site with no code change, and a failed fetch simply leaves the
   snapshot in place. */
(function () {
  'use strict';

  var FEED_URL = 'https://anchor.fm/s/1181d71f8/podcast/rss';
  var list = document.getElementById('episode-list');
  var audio = document.getElementById('podcast-audio');
  if (!list || !audio) return;

  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="#fff"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="#fff"/><rect x="14" y="5" width="4" height="14" rx="1" fill="#fff"/></svg>';

  var currentCard = null;

  /* A seek requested before the episode's metadata has loaded (duration is
     NaN until then) is queued here and applied by the loadedmetadata
     handler, instead of being dropped. `src` ties it to one episode so a
     stale seek can never land on a different episode. */
  var pendingSeek = null;

  function resolveSeek(seek) {
    if (!isFinite(audio.duration) || !audio.duration) return null;
    var t;
    if (seek.ratio != null) t = seek.ratio * audio.duration;
    else if (seek.time != null) t = seek.time;
    else t = (audio.currentTime || 0) + (seek.delta || 0);
    return Math.max(0, Math.min(audio.duration, t));
  }

  function applyPendingSeek() {
    if (!pendingSeek || !currentCard) return;
    if (pendingSeek.src !== currentCard.getAttribute('data-audio')) {
      pendingSeek = null;
      return;
    }
    var t = resolveSeek(pendingSeek);
    if (t === null) return;
    pendingSeek = null;
    audio.currentTime = t;
  }

  function fmtClock(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    sec = Math.floor(sec);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function cardParts(card) {
    return {
      btn: card.querySelector('.play-btn'),
      track: card.querySelector('.player-track'),
      fill: card.querySelector('.player-fill'),
      time: card.querySelector('.player-time'),
      total: parseFloat(card.getAttribute('data-duration')) || 0
    };
  }

  function paintCard(card) {
    var p = cardParts(card);
    var isCurrent = card === currentCard;
    var playing = isCurrent && !audio.paused && !audio.ended;
    if (p.btn) {
      p.btn.innerHTML = playing ? PAUSE : PLAY;
      var title = card.querySelector('.episode-title');
      p.btn.setAttribute('aria-label',
        (playing ? 'Pause episode: ' : 'Play episode: ') +
        (title ? title.textContent : 'podcast episode'));
    }
    card.classList.toggle('is-current', isCurrent);
    var cur = isCurrent ? audio.currentTime : 0;
    var total = (isCurrent && isFinite(audio.duration) && audio.duration) || p.total;
    if (p.fill) p.fill.style.width = total ? (cur / total * 100) + '%' : '0%';
    if (p.track) p.track.setAttribute('aria-valuenow', String(total ? Math.round(cur / total * 100) : 0));
    if (p.time) p.time.textContent = fmtClock(cur) + ' / ' + fmtClock(total);
  }

  function paintAll() {
    Array.prototype.forEach.call(list.querySelectorAll('.episode-card'), paintCard);
  }

  function playCard(card) {
    var src = card.getAttribute('data-audio');
    if (!src) return;
    if (card !== currentCard) {
      currentCard = card;
      pendingSeek = null;
      audio.src = src;
    }
    audio.play();
    paintAll();
  }

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.play-btn');
    if (btn) {
      var card = btn.closest('.episode-card');
      if (card === currentCard && !audio.paused) audio.pause();
      else playCard(card);
      paintAll();
      return;
    }
    var track = e.target.closest('.player-track');
    if (track) seekFromEvent(track.closest('.episode-card'), track, e);
  });

  list.addEventListener('keydown', function (e) {
    var track = e.target.closest('.player-track');
    if (!track || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var card = track.closest('.episode-card');
    var delta = e.key === 'ArrowRight' ? 10 : -10;
    if (card !== currentCard) playCard(card);
    if (isFinite(audio.duration) && audio.duration) {
      pendingSeek = null;
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + delta));
    } else {
      /* Metadata not in yet — queue the offset (repeated presses add up)
         and let loadedmetadata land it. */
      var prev = (pendingSeek && pendingSeek.src === card.getAttribute('data-audio') && pendingSeek.delta != null)
        ? pendingSeek.delta : 0;
      pendingSeek = { src: card.getAttribute('data-audio'), delta: prev + delta };
    }
    e.preventDefault();
  });

  function seekFromEvent(card, track, e) {
    var rect = track.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (card !== currentCard) playCard(card);
    if (isFinite(audio.duration) && audio.duration) {
      pendingSeek = null;
      audio.currentTime = ratio * audio.duration;
    } else {
      pendingSeek = { src: card.getAttribute('data-audio'), ratio: ratio };
    }
    paintAll();
  }

  audio.addEventListener('timeupdate', function () { if (currentCard) paintCard(currentCard); });
  audio.addEventListener('loadedmetadata', function () {
    applyPendingSeek();
    if (currentCard) paintCard(currentCard);
  });
  audio.addEventListener('play', paintAll);
  audio.addEventListener('pause', paintAll);
  audio.addEventListener('ended', paintAll);

  /* --- Live feed refresh -------------------------------------------------- */

  function childText(el, tag) {
    var n = el.getElementsByTagName(tag)[0];
    return n ? n.textContent.trim() : '';
  }

  function fmtDate(rfc) {
    var d = new Date(rfc);
    if (isNaN(d)) return '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  function parseDuration(raw) {
    if (!raw) return 0;
    var parts = raw.split(':').map(function (x) { return parseInt(x, 10) || 0; });
    while (parts.length < 3) parts.unshift(0);
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  function fmtMetaDuration(sec) {
    if (!sec) return '';
    var m = Math.round(sec / 60);
    return m + ' min';
  }

  function excerpt(htmlText) {
    var tmp = document.createElement('div');
    tmp.innerHTML = htmlText || '';
    var text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length <= 300) return text;
    var cut = text.slice(0, 300);
    return cut.slice(0, cut.lastIndexOf(' ')) + '…';
  }

  function buildCard(ep) {
    var card = document.createElement('article');
    card.className = 'episode-card';
    card.setAttribute('data-audio', ep.audio);
    if (ep.duration) card.setAttribute('data-duration', String(ep.duration));

    var img = document.createElement('img');
    img.className = 'episode-art';
    img.src = ep.image;
    img.alt = '';
    img.loading = 'lazy';
    card.appendChild(img);

    var body = document.createElement('div');
    body.className = 'episode-body';

    var meta = document.createElement('p');
    meta.className = 'episode-meta';
    meta.textContent = [fmtDate(ep.date), fmtMetaDuration(ep.duration)].filter(Boolean).join(' · ');
    body.appendChild(meta);

    var h = document.createElement('h3');
    h.className = 'episode-title';
    h.textContent = ep.title;
    body.appendChild(h);

    var desc = document.createElement('p');
    desc.className = 'episode-desc';
    desc.textContent = excerpt(ep.description);
    body.appendChild(desc);

    var player = document.createElement('div');
    player.className = 'player';
    player.innerHTML =
      '<button class="play-btn" type="button"></button>' +
      '<div class="player-track" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><div class="player-fill"></div></div>' +
      '<span class="player-time">0:00 / ' + fmtClock(ep.duration) + '</span>';
    body.appendChild(player);

    if (ep.link) {
      var a = document.createElement('a');
      a.className = 'episode-link';
      a.href = ep.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = 'Open episode <span class="icon icon-sm" data-icon="arrow-up-right"></span>';
      body.appendChild(a);
    }

    card.appendChild(body);
    return card;
  }

  function refreshFromFeed() {
    if (!window.fetch || !window.DOMParser) return;
    fetch(FEED_URL)
      .then(function (r) { if (!r.ok) throw new Error('feed'); return r.text(); })
      .then(function (xmlText) {
        var xml = new DOMParser().parseFromString(xmlText, 'text/xml');
        if (xml.getElementsByTagName('parsererror').length) return;
        var channel = xml.getElementsByTagName('channel')[0];
        if (!channel) return;
        var channelImg = channel.getElementsByTagName('itunes:image')[0];
        var fallbackArt = channelImg ? channelImg.getAttribute('href') : '';
        var items = Array.prototype.map.call(xml.getElementsByTagName('item'), function (item) {
          var enc = item.getElementsByTagName('enclosure')[0];
          var img = item.getElementsByTagName('itunes:image')[0];
          return {
            title: childText(item, 'title'),
            date: childText(item, 'pubDate'),
            link: childText(item, 'link'),
            description: childText(item, 'description'),
            audio: enc ? enc.getAttribute('url') : '',
            duration: parseDuration(childText(item, 'itunes:duration')),
            image: (img && img.getAttribute('href')) || fallbackArt
          };
        }).filter(function (ep) { return ep.title && ep.audio; });
        if (!items.length) return;

        var wasPlayingSrc = currentCard ? currentCard.getAttribute('data-audio') : null;
        list.textContent = '';
        items.forEach(function (ep) { list.appendChild(buildCard(ep)); });
        /* If the playing episode is still in the feed, keep it marked. */
        if (wasPlayingSrc) {
          Array.prototype.forEach.call(list.querySelectorAll('.episode-card'), function (c) {
            if (c.getAttribute('data-audio') === wasPlayingSrc) currentCard = c;
          });
        }
        paintAll();
      })
      .catch(function () { /* Snapshot in the HTML stays as the fallback. */ });
  }

  paintAll();
  refreshFromFeed();
})();
