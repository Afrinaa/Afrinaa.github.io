/**
 * ============================================================
 * Afrina Akter Mim — PORTFOLIO JAVASCRIPT
 * ES6+ | No external dependencies
 * Modules: Loader, Theme, Navigation, TypedText, ScrollReveal,
 *          SkillBars, ProjectFilter, CounterAnim, ContactForm,
 *          BackToTop, ScrollProgress
 * ============================================================
 */

'use strict';

/* ============================================================
   UTILITY — safely query DOM elements
   ============================================================ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


/* ============================================================
   1. LOADING SCREEN
   Remove loader once page assets are ready.
   ============================================================ */
const Loader = (() => {
  const loader = $('#loader');
  if (!loader) return;

  const hide = () => {
    loader.classList.add('hidden');
    // Remove from DOM after transition
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  };

  // Ensure minimum display time for polish, then hide
  const minTime = 1500; // ms
  const startTime = performance.now();

  const ready = () => {
    const elapsed = performance.now() - startTime;
    const delay = Math.max(0, minTime - elapsed);
    setTimeout(hide, delay);
  };

  if (document.readyState === 'complete') {
    ready();
  } else {
    window.addEventListener('load', ready, { once: true });
  }
})();


/* ============================================================
   2. THEME TOGGLE (Dark / Light)
   Persists preference in localStorage.
   ============================================================ */
const Theme = (() => {
  const root     = document.documentElement;
  const btn      = $('#theme-toggle');
  const icon     = $('#theme-icon');
  const PREF_KEY = 'portfolio-theme';

  const themes = {
    dark:  { attr: 'dark',  icon: 'fa-sun',  label: 'Switch to light mode'  },
    light: { attr: 'light', icon: 'fa-moon', label: 'Switch to dark mode'   },
  };

  // Determine initial theme: localStorage → system preference → dark
  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

  let current = localStorage.getItem(PREF_KEY) || getSystemTheme();

  const apply = (theme) => {
    const cfg = themes[theme] || themes.dark;
    root.setAttribute('data-theme', cfg.attr);
    if (icon) {
      icon.className = `fas ${cfg.icon}`;
    }
    if (btn) {
      btn.setAttribute('aria-label', cfg.label);
    }
    current = theme;
    localStorage.setItem(PREF_KEY, theme);
  };

  const toggle = () => apply(current === 'dark' ? 'light' : 'dark');

  // Init
  apply(current);
  btn?.addEventListener('click', toggle);

  // Listen for system changes when no explicit preference is set
  window.matchMedia('(prefers-color-scheme: light)')
    .addEventListener('change', (e) => {
      if (!localStorage.getItem(PREF_KEY)) {
        apply(e.matches ? 'light' : 'dark');
      }
    });

  return { toggle, current: () => current };
})();


/* ============================================================
   3. NAVIGATION
   - Scroll-triggered background
   - Active link highlighting via IntersectionObserver
   - Mobile menu toggle
   - Smooth scroll on anchor clicks
   ============================================================ */
const Navigation = (() => {
  const navbar    = $('#navbar');
  const menuBtn   = $('#menu-toggle');
  const mobileMenu = $('#mobile-menu');
  const navLinks  = $$('.nav-link');
  const sections  = $$('section[id]');

  // ---- Scroll-triggered navbar style ----
  const handleScroll = () => {
    if (!navbar) return;
    const scrolled = window.scrollY > 60;
    navbar.classList.toggle('scrolled', scrolled);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Run on init

  // ---- Mobile menu ----
  const closeMenu = () => {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  };

  menuBtn?.addEventListener('click', () => {
    const isOpen = mobileMenu?.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close menu on mobile link click
  $$('.mobile-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (
      mobileMenu?.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !menuBtn?.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // ---- Active section highlighting ----
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          const match = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', match);
          if (match) link.setAttribute('aria-current', 'page');
          else       link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: `-${60}px 0px -60% 0px` }
  );

  sections.forEach((sec) => sectionObserver.observe(sec));

  // ---- Smooth scroll ----
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = $(href);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-height')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   4. TYPED TEXT ANIMATION
   Cycles through an array of role strings with a typewriter effect.
   ============================================================ */
const TypedText = (() => {
  const el = $('#typed-text');
  if (!el) return;

  const strings   = [
    'Machine Learning Researcher',
    'Neural Network Architect',
    'Open Source Learner',
    'Technical Writer',
    'Problem Solver',
  ];

  let strIdx  = 0;
  let charIdx = 0;
  let deleting = false;
  const SPEED_TYPE  = 80;
  const SPEED_DEL   = 45;
  const PAUSE_END   = 2000;
  const PAUSE_START = 350;

  const tick = () => {
    const current = strings[strIdx];

    if (!deleting) {
      // Typing
      el.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(tick, PAUSE_END);
        return;
      }
    } else {
      // Deleting
      el.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        strIdx = (strIdx + 1) % strings.length;
        setTimeout(tick, PAUSE_START);
        return;
      }
    }

    setTimeout(tick, deleting ? SPEED_DEL : SPEED_TYPE);
  };

  // Start after loader
  setTimeout(tick, 1600);
})();


/* ============================================================
   5. SCROLL REVEAL ANIMATIONS
   Observes elements with .animate-on-scroll and adds .visible
   when they enter the viewport.
   ============================================================ */
const ScrollReveal = (() => {
  const elements = $$('.animate-on-scroll');
  if (!elements.length) return;

  // Add staggered delays based on position in parent
  elements.forEach((el) => {
    const siblings = $$(
      '.animate-on-scroll',
      el.parentElement
    ).filter((s) => s.parentElement === el.parentElement);

    const idx = siblings.indexOf(el);
    if (idx > 0) {
      el.style.transitionDelay = `${idx * 0.08}s`;
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Animate only once
        }
      });
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
  );

  elements.forEach((el) => observer.observe(el));
})();


/* ============================================================
   6. SKILL BAR ANIMATIONS
   Fills progress bars when they enter the viewport.
   ============================================================ */
const SkillBars = (() => {
  const bars = $$('.skill-fill');
  if (!bars.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        const width = bar.dataset.width || '0';
        // Slight delay for visual appeal
        setTimeout(() => {
          bar.style.width = `${width}%`;
        }, 200);
        observer.unobserve(bar);
      });
    },
    { threshold: 0.3 }
  );

  bars.forEach((bar) => observer.observe(bar));
})();


/* ============================================================
   7. ANIMATED COUNTERS
   Counts up stat numbers when hero section is visible.
   ============================================================ */
const Counters = (() => {
  const statNumbers = $$('.stat-number');
  if (!statNumbers.length) return;

  const animateCounter = (el) => {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1800; // ms
    const start    = performance.now();

    const ease = (t) => t < 0.5
      ? 2 * t * t
      : -1 + (4 - 2 * t) * t; // ease-in-out quad

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(ease(progress) * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };

    requestAnimationFrame(step);
  };

  // Only animate once
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.5 }
  );

  // Start after loader clears
  setTimeout(() => {
    statNumbers.forEach((el) => observer.observe(el));
  }, 1600);
})();


/* ============================================================
   8. PROJECT FILTERING
   Filters .project-card elements by data-category attribute.
   ============================================================ */
const ProjectFilter = (() => {
  const filterBtns = $$('.filter-btn');
  const cards      = $$('.project-card');
  if (!filterBtns.length || !cards.length) return;

  const filter = (category) => {
    // Update button states
    filterBtns.forEach((btn) => {
      const active = btn.dataset.filter === category;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    // Show/hide cards with animation
    cards.forEach((card, i) => {
      const match = category === 'all' || card.dataset.category === category;

      if (match) {
        card.classList.remove('hidden');
        // Stagger reveal
        card.style.transitionDelay = `${i * 0.05}s`;
        // Force reflow then set visible state
        requestAnimationFrame(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        card.style.transitionDelay = '0s';
        // Hide after transition
        setTimeout(() => card.classList.add('hidden'), 300);
      }
    });
  };

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => filter(btn.dataset.filter));
  });

  // Initialize
  filter('all');
})();


/* ============================================================
   9. CONTACT FORM VALIDATION & SUBMISSION
   Client-side validation with field-level error messages.
   Simulates async form submission.
   ============================================================ */
const ContactForm = (() => {
  const form      = $('#contact-form');
  const submitBtn = $('#submit-btn');
  const success   = $('#form-success');
  if (!form) return;

  // Validation rules
  const rules = {
    name: {
      validate: (v) => v.trim().length >= 2,
      message: 'Please enter your full name (at least 2 characters).',
    },
    email: {
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: 'Please enter a valid email address.',
    },
    message: {
      validate: (v) => v.trim().length >= 10,
      message: 'Your message should be at least 10 characters.',
    },
  };

  const showError = (fieldId, message) => {
    const field = $(`#${fieldId}`);
    const error = $(`#${fieldId}-error`);
    if (field)  field.classList.add('invalid');
    if (error)  error.textContent = message;
  };

  const clearError = (fieldId) => {
    const field = $(`#${fieldId}`);
    const error = $(`#${fieldId}-error`);
    if (field)  field.classList.remove('invalid');
    if (error)  error.textContent = '';
  };

  // Live validation on blur
  ['name', 'email', 'message'].forEach((id) => {
    const el = $(`#${id}`);
    if (!el) return;
    el.addEventListener('blur', () => {
      const rule = rules[id];
      if (!rule) return;
      if (!rule.validate(el.value)) {
        showError(id, rule.message);
      } else {
        clearError(id);
      }
    });
    // Clear on input
    el.addEventListener('input', () => clearError(id));
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;

    // Validate all required fields
    Object.entries(rules).forEach(([id, rule]) => {
      const el = $(`#${id}`);
      if (!el) return;
      if (!rule.validate(el.value)) {
        showError(id, rule.message);
        isValid = false;
      } else {
        clearError(id);
      }
    });

    if (!isValid) return;

    // --- Simulate async submission ---
    if (submitBtn) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Sending';
    }

    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Show success
    if (submitBtn) {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Send Message';
    }

    if (success) {
      success.removeAttribute('hidden');
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    form.reset();

    // Hide success after 8s
    setTimeout(() => {
      if (success) success.setAttribute('hidden', '');
    }, 8000);
  });
})();


/* ============================================================
   10. SCROLL PROGRESS INDICATOR
   Updates a fixed bar at the top showing scroll position.
   ============================================================ */
const ScrollProgress = (() => {
  const bar = $('#scroll-progress');
  if (!bar) return;

  const update = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const pct = (scrollTop / (scrollHeight - clientHeight)) * 100;
    bar.style.width = `${Math.min(pct, 100)}%`;
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ============================================================
   11. BACK TO TOP BUTTON
   Shows after scrolling 400px; scrolls smoothly to top.
   ============================================================ */
const BackToTop = (() => {
  const btn = $('#back-to-top');
  if (!btn) return;

  const toggle = () => {
    const show = window.scrollY > 400;
    if (show) btn.removeAttribute('hidden');
    else      btn.setAttribute('hidden', '');
  };

  window.addEventListener('scroll', toggle, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  toggle();
})();


/* ============================================================
   12. SET FOOTER YEAR
   Automatically keeps the copyright year current.
   ============================================================ */
const FooterYear = (() => {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ============================================================
   13. PARALLAX — subtle grid background depth effect
   Moves the decorative grid slightly on scroll for depth.
   ============================================================ */
const Parallax = (() => {
  const grid = $('.hero-grid');
  if (!grid) return;

  // Only run if no motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const handleScroll = () => {
    const offset = window.scrollY * 0.15;
    grid.style.transform = `translateY(${offset}px)`;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
})();


/* ============================================================
   14. RESUME DOWNLOAD BUTTON
   Intercepts the "Download Résumé" click and shows a brief
   toast notification (since there's no actual PDF in this demo).
   ============================================================ */
const ResumeDownload = (() => {
  const btn = $('a[download]');
  if (!btn) return;

 /* btn.addEventListener('click', (e) => {
    // In production, remove this handler and just let the link work.
    // For demo: show a toast message.
    e.preventDefault();
    showToast('📄 Resume download would start here in production.');
  });
*/
  const showToast = (msg) => {
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
      position:     'fixed',
      bottom:       '2rem',
      left:         '50%',
      transform:    'translateX(-50%) translateY(20px)',
      background:   'var(--bg-card)',
      border:       '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      padding:      '0.85rem 1.5rem',
      fontSize:     '0.875rem',
      color:        'var(--text-primary)',
      boxShadow:    'var(--shadow-lg)',
      zIndex:       '9999',
      opacity:      '0',
      transition:   'opacity 0.3s, transform 0.3s',
      fontFamily:   'var(--font-display)',
      maxWidth:     'calc(100vw - 4rem)',
      textAlign:    'center',
    });
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3500);
  };
})();


/* ============================================================
   15. KEYBOARD ACCESSIBILITY ENHANCEMENTS
   Ensures interactive elements respond correctly to keyboard.
   ============================================================ */
const KeyboardA11y = (() => {
  // Space/Enter key on project filter buttons (already buttons, but explicit)
  $$('.filter-btn').forEach((btn) => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Add focus-visible outline styles via JS (complement CSS :focus-visible)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.setAttribute('data-focus-visible', '');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.removeAttribute('data-focus-visible');
  });
})();


/* ============================================================
   16. LAZY LOAD — native + polyfill fallback
   All images use loading="lazy" in HTML; this adds an observer
   fallback for older browsers.
   ============================================================ */
const LazyImages = (() => {
  // Modern browsers support loading="lazy" natively.
  // Only run observer for browsers that don't.
  if ('loading' in HTMLImageElement.prototype) return;

  const images = $$('img[loading="lazy"]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
      observer.unobserve(img);
    });
  });

  images.forEach((img) => observer.observe(img));
})();


/* ============================================================
   INIT COMPLETE — Log in development
   ============================================================ */
if (typeof window !== 'undefined') {
  console.log(
    '%c🚀 Portfolio loaded',
    'color: #c8a96e; font-family: monospace; font-size: 14px;'
  );
}
