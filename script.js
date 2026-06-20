/* =========================================================================
   invertkilo — script.js
   - Theme toggle (the signature interaction: invert/revert, persisted),
     now torn open with a View Transition ripple instead of a flat swap
   - Decode-in headings: characters flip into place like a split-flap board
   - Hero load-in sequence + cursor-tracking glow
   - Scroll-triggered section reveals
   - Scope tag binary flip (tap/click fallback for touch)
   - Footer uptime ticker
   - Nav background on scroll
   All effects are skipped or instant if the user prefers reduced motion.
   ========================================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  var toggleLabel = document.getElementById('toggle-label');
  var nav = document.getElementById('nav');
  var yearEl = document.getElementById('year');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Theme toggle
     --------------------------------------------------------------------- */

  function syncToggleUI() {
    var inverted = root.dataset.theme === 'invert';
    if (toggle) toggle.setAttribute('aria-pressed', String(inverted));
    if (toggleLabel) toggleLabel.textContent = inverted ? 'REVERT' : 'INVERT';
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem('ik-theme', theme);
    } catch (e) {
      /* localStorage unavailable — theme still applies for this session */
    }
    syncToggleUI();
  }

  function setThemeWithRipple(theme, x, y) {
    var supportsViewTransitions = typeof document.startViewTransition === 'function';

    if (reduceMotion || !supportsViewTransitions) {
      setTheme(theme);
      return;
    }

    root.style.setProperty('--vt-x', x + 'px');
    root.style.setProperty('--vt-y', y + 'px');
    document.startViewTransition(function () {
      setTheme(theme);
    });
  }

  if (toggle) {
    syncToggleUI();
    toggle.addEventListener('click', function (e) {
      var inverted = root.dataset.theme === 'invert';
      var next = inverted ? 'kilo' : 'invert';

      var x = typeof e.clientX === 'number' ? e.clientX : 0;
      var y = typeof e.clientY === 'number' ? e.clientY : 0;

      if (!x && !y) {
        var rect = toggle.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      setThemeWithRipple(next, x, y);
    });
  }

  /* ---------------------------------------------------------------------
     Footer year + uptime
     --------------------------------------------------------------------- */

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  (function uptimeTicker() {
    var uptimeEl = document.getElementById('uptime');
    if (!uptimeEl) return;

    var start = Date.now();

    function pad(n) {
      return String(n).padStart(2, '0');
    }

    function tick() {
      var elapsed = Math.floor((Date.now() - start) / 1000);
      var hh = Math.floor(elapsed / 3600);
      var mm = Math.floor((elapsed % 3600) / 60);
      var ss = elapsed % 60;
      uptimeEl.textContent = pad(hh) + ':' + pad(mm) + ':' + pad(ss);
    }

    tick();
    setInterval(tick, 1000);
  })();

  /* ---------------------------------------------------------------------
     Decode-in text — wraps characters of [data-decode] elements in .fc
     spans and staggers them in. Skipped (left as plain text) under
     prefers-reduced-motion.
     --------------------------------------------------------------------- */

  function wrapChars(node, counter) {
    var children = Array.prototype.slice.call(node.childNodes);
    children.forEach(function (child) {
      if (child.nodeType === 3) {
        var text = child.textContent;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (ch === ' ') {
            frag.appendChild(document.createTextNode(' '));
          } else {
            var span = document.createElement('span');
            span.className = 'fc';
            span.textContent = ch;
            span.style.setProperty('--d', counter.n * 26 + 'ms');
            counter.n++;
            frag.appendChild(span);
          }
        }
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        wrapChars(child, counter);
      }
    });
  }

  function decodeText(el) {
    if (!el || el.dataset.decoded === 'true') return;
    el.dataset.decoded = 'true';

    if (reduceMotion) return; // leave plain, readable text — no animation

    wrapChars(el, { n: 0 });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add('is-decoded');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Hero load-in
     --------------------------------------------------------------------- */

  function markReady() {
    document.body.classList.add('is-ready');

    var brandWord = document.querySelector('.brand-word[data-decode]');
    if (brandWord) decodeText(brandWord);

    var heroTitle = document.querySelector('.hero-title[data-decode]');
    if (heroTitle) {
      setTimeout(function () {
        decodeText(heroTitle);
      }, 160);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markReady);
  } else {
    markReady();
  }

  /* ---------------------------------------------------------------------
     Hero cursor-tracking glow (pointer devices only)
     --------------------------------------------------------------------- */

  var hero = document.querySelector('.hero');
  var hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  if (hero && hasFinePointer && !reduceMotion) {
    hero.addEventListener(
      'pointermove',
      function (e) {
        var rect = hero.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        hero.style.setProperty('--mx', x + '%');
        hero.style.setProperty('--my', y + '%');
      },
      { passive: true }
    );
  }

  /* ---------------------------------------------------------------------
     Scroll-triggered reveals (also fires the decode-in for section titles)
     --------------------------------------------------------------------- */

  var revealTargets = document.querySelectorAll('.reveal-on-scroll');

  function decodeWithin(target) {
    var dt = target.querySelector('[data-decode]');
    if (dt) decodeText(dt);
  }

  if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            decodeWithin(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -40px 0px' }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('in-view');
      decodeWithin(el);
    });
  }

  /* ---------------------------------------------------------------------
     Scope tags — binary flip, with a click/tap fallback for touch
     --------------------------------------------------------------------- */

  document.querySelectorAll('.scope-tag').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.classList.toggle('is-flipped');
    });
  });

  /* ---------------------------------------------------------------------
     Nav: subtle border/background once the page has scrolled
     --------------------------------------------------------------------- */

  function handleScroll() {
    if (!nav) return;
    if (window.scrollY > 8) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
})();
