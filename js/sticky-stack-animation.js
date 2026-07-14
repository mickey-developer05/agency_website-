/**
 * sticky-stack-animation.js  v3.0  — FIXED
 * =============================================================
 * ROOT CAUSE FIXES IN THIS VERSION:
 *
 * 1. Cards have `.reveal-left` / `.reveal-right` classes.
 *    styles.css sets these to opacity:0 + transform:translateX with !important.
 *    FIX: We inject a <style> block that overrides !important for our cards
 *    using a higher-specificity rule, so JS can control transform freely.
 *
 * 2. Cards have `transition-all duration-300` — this fights JS animation.
 *    FIX: Override transition on our tagged cards to only allow
 *    box-shadow and border-color (hover effects), not transform/opacity.
 *
 * 3. `getBoundingClientRect()` returns WRONG position for sticky elements
 *    when called mid-scroll (returns clamped sticky position, not natural flow).
 *    FIX: Use offsetTop traversal (getAbsoluteTop) for true document position.
 *
 * 4. reveal-active (opacity:1, transform:translate(0,0) !important) must be
 *    added immediately to our cards so the CSS doesn't hide them.
 *    FIX: Add reveal-active immediately on all cards we control,
 *    then JS overrides transform via inline style (inline > class).
 *
 * 5. Wait for main.js IntersectionObserver to run first,
 *    then take control. We use a small timeout after DOMContentLoaded.
 * =============================================================
 */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────── */
  var SLIDE_IN_PX    = 80;   // px cards slide up from during entry
  var SLIDE_RANGE_PX = 220;  // px of scroll over which the slide completes
  var LERP_SPEED     = 0.11; // smoothing (lower = smoother, 0.1 is good)
  var SCALE_ENTRY    = 0.97; // scale when card starts entering

  /* ── Utils ───────────────────────────────────────────────── */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function easeOutQuart(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 4); }

  /* Get element's true document-flow top, ignoring sticky clamping */
  function getDocTop(el) {
    var top = 0;
    var e   = el;
    while (e) {
      top += (e.offsetTop || 0);
      e    = e.offsetParent;
    }
    return top;
  }

  /* ── CSS Override Injection ──────────────────────────────── */
  /* We inject a high-specificity rule to neutralise the !important
     rules from styles.css on .reveal-left / .reveal-right / .reveal-active
     for ONLY the cards we are animating (they get .lsa-driven class). */
  function injectOverrideCSS() {
    if (document.getElementById('lsa-override')) return;
    var s = document.createElement('style');
    s.id  = 'lsa-override';
    /* Override:
       - Remove transition on transform/opacity (JS drives these)
       - Let JS inline styles win over CSS class rules */
    s.textContent = [
      '/* sticky-stack-animation overrides */',
      /* Disable the CSS transition on transform/opacity for our cards.
         Keep border/shadow transitions for hover effects. */
      'section .lsa-driven {',
      '  transition: box-shadow 0.3s ease, border-color 0.3s ease !important;',
      '}',
      /* Ensure reveal-active does not lock transform when we are driving it */
      'section .lsa-driven.reveal-active {',
      '  opacity: 1 !important;',
      '  transform: none !important;',  /* JS inline style will override this */
      '}',
      /* Initial hidden state — override reveal-left/right start position */
      'section .lsa-driven.reveal-left,',
      'section .lsa-driven.reveal-right {',
      '  opacity: 1 !important;',
      '  transform: none !important;',  /* JS inline style will override this */
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Engine: Process Section ─────────────────────────────── */
  function initProcessAnim(section) {
    if (!section) return null;

    var container = section.querySelector('.max-w-5xl');
    if (!container) return null;

    var cards = Array.prototype.slice.call(
      container.querySelectorAll(':scope > div')
    );
    if (cards.length < 2) return null;

    /* Extract sticky top values from Tailwind classes */
    var stickyTops = cards.map(function (card) {
      var m = card.className.match(/top-\[(\d+)px\]/);
      return m ? parseInt(m[1], 10) : 88;
    });

    /* State */
    var docTops = []; /* true document-flow tops for each card */
    var curY    = window.pageYOffset;
    var tgtY    = curY;
    var raf     = null;
    var running = false;

    /* ── Measure ── */
    function measure() {
      /* getDocTop uses offsetTop chain — unaffected by sticky clamping */
      docTops = cards.map(function (c) { return getDocTop(c); });
    }

    /* ── Render ── */
    function applyState(scrollY) {
      if (!docTops.length) return;

      cards.forEach(function (card, i) {
        /* ScrollY at which this card reaches its sticky pin */
        var arrivalY = docTops[i] - stickyTops[i];
        /* How far BEFORE arrival are we? positive = haven't arrived yet */
        var distBefore = arrivalY - scrollY;
        /* Slide phase: 1 = fully slid in, 0 = at start of animation range */
        var phase  = clamp(1 - (distBefore / SLIDE_RANGE_PX), 0, 1);
        var eased  = easeOutQuart(phase);

        var ty  = lerp(SLIDE_IN_PX, 0, eased);   /* 80px → 0 */
        var sc  = lerp(SCALE_ENTRY, 1.0, eased);
        var op  = clamp(eased * 1.6, 0, 1);       /* quick fade in */

        /* Inline styles override CSS class rules (even !important from class) */
        card.style.setProperty('transform',
          'translateY(' + ty.toFixed(2) + 'px) scale(' + sc.toFixed(4) + ')',
          'important');
        card.style.setProperty('opacity', op.toFixed(3), 'important');
      });
    }

    /* ── rAF Loop ── */
    function onScroll() {
      tgtY = window.pageYOffset;
      if (!running) { running = true; raf = requestAnimationFrame(tick); }
    }
    function tick() {
      curY = lerp(curY, tgtY, LERP_SPEED);
      applyState(curY);
      if (Math.abs(curY - tgtY) > 0.15) {
        raf = requestAnimationFrame(tick);
      } else {
        curY = tgtY; applyState(curY); running = false;
      }
    }
    function onResize() {
      clearTimeout(onResize._t);
      onResize._t = setTimeout(function () {
        measure();
        curY = window.pageYOffset;
        tgtY = curY;
        applyState(curY);
      }, 150);
    }

    /* ── Start ── */
    function start() {
      injectOverrideCSS();

      cards.forEach(function (c) {
        /* Mark card so our CSS override applies */
        c.classList.add('lsa-driven');
        /* Add reveal-active immediately so CSS does not hide the card */
        c.classList.add('reveal-active');
        /* GPU layer hint */
        c.style.willChange = 'transform, opacity';
      });

      /* Measure AFTER reveal-active is added (transforms cleared by CSS) */
      measure();
      curY = window.pageYOffset;
      tgtY = curY;
      applyState(curY);

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
    }

    /* ── Stop ── */
    function stop() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      running = false;
      cards.forEach(function (c) {
        c.classList.remove('lsa-driven');
        c.style.removeProperty('transform');
        c.style.removeProperty('opacity');
        c.style.willChange = '';
      });
      docTops = [];
    }

    return { start: start, stop: stop };
  }

  /* ── Engine: Team Section (mobile only) ─────────────────── */
  function initTeamAnim(section) {
    if (!section) return null;

    var grid = section.querySelector('#homepage-team-grid');
    if (!grid) return null;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(':scope > div'));
    if (cards.length < 2) return null;

    var docTops     = [];
    var curY        = window.pageYOffset;
    var tgtY        = curY;
    var raf         = null;
    var running     = false;

    function measure() {
      docTops = cards.map(function (c) { return getDocTop(c); });
    }

    function applyState(scrollY) {
      if (!docTops.length) return;
      cards.forEach(function (card, i) {
        /* On mobile, cards are single-column, each below the previous.
           We animate each in as it enters the viewport from below. */
        var viewportBottom = scrollY + window.innerHeight;
        /* Card starts animating when its top is 80% from viewport bottom */
        var triggerY = docTops[i] - window.innerHeight * 0.80;
        var distBefore = triggerY - scrollY;
        var phase  = clamp(1 - (distBefore / SLIDE_RANGE_PX), 0, 1);
        var eased  = easeOutQuart(phase);

        var ty = lerp(60, 0, eased);
        var op = clamp(eased * 1.8, 0, 1);

        card.style.setProperty('transform',
          'translateY(' + ty.toFixed(2) + 'px) scale(' + lerp(0.97, 1, eased).toFixed(4) + ')',
          'important');
        card.style.setProperty('opacity', op.toFixed(3), 'important');
      });
    }

    function onScroll() {
      tgtY = window.pageYOffset;
      if (!running) { running = true; raf = requestAnimationFrame(tick); }
    }
    function tick() {
      curY = lerp(curY, tgtY, LERP_SPEED);
      applyState(curY);
      if (Math.abs(curY - tgtY) > 0.15) {
        raf = requestAnimationFrame(tick);
      } else {
        curY = tgtY; applyState(curY); running = false;
      }
    }
    function onResize() {
      clearTimeout(onResize._t);
      onResize._t = setTimeout(function () {
        measure();
        curY = window.pageYOffset;
        tgtY = curY;
        applyState(curY);
      }, 150);
    }

    function start() {
      injectOverrideCSS();
      cards.forEach(function (c) {
        c.classList.add('lsa-driven');
        c.style.willChange = 'transform, opacity';
      });
      measure();
      curY = window.pageYOffset;
      tgtY = curY;
      applyState(curY);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
    }

    function stop() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      running = false;
      cards.forEach(function (c) {
        c.classList.remove('lsa-driven');
        c.style.removeProperty('transform');
        c.style.removeProperty('opacity');
        c.style.willChange = '';
      });
      docTops = [];
    }

    return { start: start, stop: stop };
  }

  /* ── Bootstrap ───────────────────────────────────────────── */
  function init() {
    /* Wait a tick so main.js IntersectionObserver initialises first,
       then we take control of our cards */
    setTimeout(function () {

      /* SECTION 1: Our Process — all viewports */
      var procAnim = initProcessAnim(document.getElementById('process-sec'));
      if (procAnim) procAnim.start();

      /* SECTION 2: Meet the Team — mobile only */
      var teamSec  = document.getElementById('team-sec');
      var teamAnim = null;
      var teamMQ   = window.matchMedia('(max-width: 768px)');

      function onMQChange(e) {
        var mobile = typeof e.matches !== 'undefined' ? e.matches : !!e;
        if (mobile) {
          if (!teamAnim) {
            teamAnim = initTeamAnim(teamSec);
            if (teamAnim) teamAnim.start();
          }
        } else {
          if (teamAnim) { teamAnim.stop(); teamAnim = null; }
        }
      }

      if (teamMQ.addEventListener) teamMQ.addEventListener('change', onMQChange);
      else if (teamMQ.addListener) teamMQ.addListener(onMQChange);
      onMQChange(teamMQ);

    }, 100); /* 100ms after DOMContentLoaded — lets main.js run first */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
