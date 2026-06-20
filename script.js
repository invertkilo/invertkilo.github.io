/* =========================================================================
   invertkilo — script.js
   - Theme toggle (the signature interaction: invert/revert, persisted)
   - Hero load-in sequence
   - Scroll-triggered section reveals
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

  if (toggle) {
    syncToggleUI();
    toggle.addEventListener('click', function () {
      var inverted = root.dataset.theme === 'invert';
      setTheme(inverted ? 'kilo' : 'invert');
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------------------------------------------------------------------
     Hero load-in
     --------------------------------------------------------------------- */

  function markReady() {
    document.body.classList.add('is-ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markReady);
  } else {
    markReady();
  }

  /* ---------------------------------------------------------------------
     Scroll-triggered reveals
     --------------------------------------------------------------------- */

  var revealTargets = document.querySelectorAll('.reveal-on-scroll');

  if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
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
    });
  }

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
