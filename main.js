// Coopa — landing interactions. Vanilla JS, no deps.
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Footer year ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Nav: shadow on scroll + mobile toggle ----------
  const nav = document.getElementById('siteNav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('primaryNav');

  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!open));
      navToggle.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
      navLinks.classList.toggle('is-open', !open);
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menú');
        navLinks.classList.remove('is-open');
      }
    });
  }

  // ---------- Smooth scroll with nav offset ----------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight - 4 : 0);
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      history.pushState(null, '', href);
    });
  });

  // ---------- Tabs: roles ----------
  const tabs = Array.from(document.querySelectorAll('.role-tab'));
  const panels = Array.from(document.querySelectorAll('.role-panel'));

  const activateTab = (tab) => {
    tabs.forEach((t) => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.setAttribute('tabindex', selected ? '0' : '-1');
    });
    panels.forEach((p) => {
      const match = p.id === tab.getAttribute('aria-controls');
      p.classList.toggle('is-active', match);
      if (match) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      const idx = tabs.indexOf(tab);
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(idx - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) {
        e.preventDefault();
        activateTab(next);
        next.focus();
      }
    });
  });

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
    });
  });

  // ---------- Billing toggle (planes) ----------
  // Cambia los precios entre mensual y anual leyendo data-mensual / data-anual.
  // El descuento anual (10%) ya está pre-calculado en esos atributos en index.html.
  const planes = document.getElementById('planes');
  if (planes) {
    const billingOpts = Array.from(planes.querySelectorAll('.billing-opt'));
    const priceNums = Array.from(planes.querySelectorAll('.price-num'));
    const annualNotes = Array.from(planes.querySelectorAll('.price-annual-note'));

    const setBilling = (mode) => {
      planes.setAttribute('data-billing', mode);
      billingOpts.forEach((opt) => {
        const active = opt.dataset.billingOpt === mode;
        opt.classList.toggle('is-active', active);
        opt.setAttribute('aria-pressed', String(active));
      });
      priceNums.forEach((num) => {
        const val = num.dataset[mode]; // dataset.mensual / dataset.anual
        if (val) num.textContent = val;
      });
      annualNotes.forEach((note) => { note.hidden = mode !== 'anual'; });
    };

    billingOpts.forEach((opt) => {
      opt.addEventListener('click', () => setBilling(opt.dataset.billingOpt));
    });
  }

  // ---------- Modules carousel ----------
  const carousel = document.getElementById('modulesCarousel');
  if (carousel) {
    const track = carousel.querySelector('#carouselTrack');
    const slides = Array.from(track.querySelectorAll('.carousel-slide'));
    const dotsHost = carousel.querySelector('#carouselDots');
    const btns = carousel.querySelectorAll('[data-dir]');
    let idx = 0;
    let timer = null;
    const AUTOPLAY_MS = 5000;

    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'carousel-dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', `Ir al módulo ${i + 1}`);
      d.addEventListener('click', () => go(i, true));
      dotsHost.appendChild(d);
      return d;
    });

    const go = (n, userInitiated) => {
      idx = (n + slides.length) % slides.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      slides.forEach((s, i) => s.toggleAttribute('aria-current', i === idx));
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === idx)));
      if (userInitiated) restart();
    };

    const restart = () => {
      if (timer) clearInterval(timer);
      if (prefersReducedMotion) return;
      timer = setInterval(() => go(idx + 1, false), AUTOPLAY_MS);
    };

    btns.forEach((b) => {
      b.addEventListener('click', () => {
        const dir = Number(b.dataset.dir) || 1;
        go(idx + dir, true);
      });
    });

    // Pause on hover / focus
    carousel.addEventListener('mouseenter', () => timer && clearInterval(timer));
    carousel.addEventListener('mouseleave', restart);
    carousel.addEventListener('focusin', () => timer && clearInterval(timer));
    carousel.addEventListener('focusout', restart);

    // Basic swipe support
    let startX = null;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1), true);
      startX = null;
    });

    go(0, false);
    restart();
  }

  // ---------- Contact form ----------
  const form = document.getElementById('contactForm');
  if (form) {
    const feedback = form.querySelector('#formFeedback');
    form.addEventListener('submit', async (e) => {
      // Honeypot check
      const hp = form.querySelector('input[name="_honey"]');
      if (hp && hp.value) { e.preventDefault(); return; }

      if (!form.checkValidity()) {
        e.preventDefault();
        feedback.textContent = 'Revisá los campos marcados, por favor.';
        feedback.classList.add('is-error');
        form.reportValidity();
        return;
      }

      // Submit via fetch so we can stay on the page
      e.preventDefault();
      feedback.classList.remove('is-error');
      feedback.textContent = 'Enviando…';
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          form.reset();
          feedback.textContent = '¡Gracias! Te respondemos en menos de 24 hs.';
        } else {
          throw new Error('bad status');
        }
      } catch (err) {
        feedback.textContent = 'No pudimos enviar el mensaje. Probá de nuevo o escribinos a tiago.roccatagliata@agrosistemas.com.ar';
        feedback.classList.add('is-error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // ---------- Cookie consent ----------
  // Storage contract: localStorage["coopa.cookieConsent.v1"] = JSON {
  //   essential: true, analytics: bool, marketing: bool,
  //   decidedAt: ISO string, version: 1
  // }
  // Future analytics integrations should listen for the "coopa:consent"
  // CustomEvent or read the same key before loading any tracking script.
  const CONSENT_KEY = 'coopa.cookieConsent.v1';
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); }
      catch { return null; }
    })();

    const saveConsent = (consent) => {
      const payload = {
        essential: true,
        analytics: !!consent.analytics,
        marketing: !!consent.marketing,
        decidedAt: new Date().toISOString(),
        version: 1,
      };
      try { localStorage.setItem(CONSENT_KEY, JSON.stringify(payload)); } catch {}
      window.dispatchEvent(new CustomEvent('coopa:consent', { detail: payload }));
      banner.classList.remove('is-visible');
      setTimeout(() => { banner.hidden = true; }, 240);
    };

    if (!stored) {
      setTimeout(() => {
        banner.hidden = false;
        requestAnimationFrame(() => banner.classList.add('is-visible'));
      }, 600);
    }

    const acceptBtn = document.getElementById('cookieAccept');
    const rejectBtn = document.getElementById('cookieReject');
    if (acceptBtn) acceptBtn.addEventListener('click', () => saveConsent({ analytics: true, marketing: true }));
    if (rejectBtn) rejectBtn.addEventListener('click', () => saveConsent({ analytics: false, marketing: false }));
  }

  // ---------- Cookie preferences page (cookies.html#preferencias) ----------
  const prefsForm = document.getElementById('cookiePreferences');
  if (prefsForm) {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); }
      catch { return null; }
    })();
    const analyticsToggle = prefsForm.querySelector('input[name="analytics"]');
    const marketingToggle = prefsForm.querySelector('input[name="marketing"]');
    if (stored) {
      if (analyticsToggle) analyticsToggle.checked = !!stored.analytics;
      if (marketingToggle) marketingToggle.checked = !!stored.marketing;
    }
    prefsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        essential: true,
        analytics: !!analyticsToggle?.checked,
        marketing: !!marketingToggle?.checked,
        decidedAt: new Date().toISOString(),
        version: 1,
      };
      try { localStorage.setItem(CONSENT_KEY, JSON.stringify(payload)); } catch {}
      window.dispatchEvent(new CustomEvent('coopa:consent', { detail: payload }));
      const feedback = prefsForm.querySelector('.prefs-feedback');
      if (feedback) {
        feedback.textContent = 'Preferencias guardadas.';
        feedback.classList.add('is-success');
      }
    });
  }

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in-view'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  }
})();
