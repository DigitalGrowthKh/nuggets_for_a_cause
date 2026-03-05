/**
 * Nuggets for a Cause — Main JavaScript
 * Handles: mobile nav, FAQ accordion, donation form, progress bars,
 *          cookie consent, smooth scroll, and structured-data helpers.
 */

(function () {
  'use strict';

  /* ============================================================
     Utility helpers
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ============================================================
     Mobile navigation toggle
     ============================================================ */
  function initMobileNav() {
    const toggle = $('.menu-toggle');
    const nav = $('.primary-nav');
    if (!toggle || !nav) return;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'primary-nav');
    nav.id = 'primary-nav';

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open', !expanded);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      }
    });
  }

  /* ============================================================
     FAQ Accordion
     ============================================================ */
  function initFaqAccordion() {
    $$('.faq-question').forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');

      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const answer = btn.nextElementSibling;

        // Close all others (single-open mode)
        $$('.faq-question[aria-expanded="true"]').forEach((other) => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            const otherAnswer = other.nextElementSibling;
            if (otherAnswer) otherAnswer.classList.remove('open');
          }
        });

        btn.setAttribute('aria-expanded', String(!expanded));
        if (answer) answer.classList.toggle('open', !expanded);
      });
    });
  }

  /* ============================================================
     Donation amount selector
     ============================================================ */
  function initDonationAmounts() {
    const amountBtns = $$('.amount-btn');
    const customInput = $('#custom-amount');
    const hiddenAmount = $('#donation-amount-value');

    amountBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        amountBtns.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        const amount = btn.dataset.amount;
        if (customInput) {
          customInput.value = amount !== 'custom' ? amount : '';
          if (amount !== 'custom') customInput.blur();
          else customInput.focus();
        }
        if (hiddenAmount) hiddenAmount.value = amount;
        updateDonationSummary();
      });
    });

    if (customInput) {
      customInput.addEventListener('input', () => {
        amountBtns.forEach((b) => b.classList.remove('selected'));
        const customBtn = $('[data-amount="custom"]');
        if (customBtn) customBtn.classList.add('selected');
        if (hiddenAmount) hiddenAmount.value = customInput.value;
        updateDonationSummary();
      });
    }
  }

  function updateDonationSummary() {
    const amountDisplay = $('#summary-amount');
    const customInput = $('#custom-amount');
    const selectedBtn = $('.amount-btn.selected');

    if (!amountDisplay) return;

    let amount = 0;
    if (selectedBtn && selectedBtn.dataset.amount !== 'custom') {
      amount = parseFloat(selectedBtn.dataset.amount) || 0;
    } else if (customInput) {
      amount = parseFloat(customInput.value) || 0;
    }

    amountDisplay.textContent = amount > 0 ? `$${amount.toFixed(2)}` : '$0.00';
  }

  /* ============================================================
     Animated progress bar (fundraising goal)
     ============================================================ */
  function initProgressBars() {
    const bars = $$('[data-progress]');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const bar = entry.target;
        const percent = Math.min(parseFloat(bar.dataset.progress) || 0, 100);
        bar.style.width = percent + '%';
        observer.unobserve(bar);
      });
    }, { threshold: 0.2 });

    bars.forEach((bar) => {
      bar.style.width = '0%';
      observer.observe(bar);
    });
  }

  /* ============================================================
     Animated stat counters
     ============================================================ */
  function initStatCounters() {
    const stats = $$('[data-count-to]');
    if (!stats.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.countTo);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = 1500;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
          step++;
          current = Math.min(current + increment, target);
          el.textContent = prefix + Math.round(current).toLocaleString() + suffix;
          if (step >= steps) clearInterval(timer);
        }, duration / steps);

        observer.unobserve(el);
      });
    }, { threshold: 0.4 });

    stats.forEach((el) => observer.observe(el));
  }

  /* ============================================================
     Cookie consent banner
     ============================================================ */
  function initCookieBanner() {
    const banner = $('.cookie-banner');
    if (!banner) return;

    const STORAGE_KEY = 'nfc_cookie_consent';
    if (localStorage.getItem(STORAGE_KEY)) return;

    setTimeout(() => banner.classList.add('visible'), 800);

    const acceptBtn = banner.querySelector('[data-cookie-accept]');
    const declineBtn = banner.querySelector('[data-cookie-decline]');

    function dismiss(accepted) {
      localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'declined');
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 400);
    }

    if (acceptBtn) acceptBtn.addEventListener('click', () => dismiss(true));
    if (declineBtn) declineBtn.addEventListener('click', () => dismiss(false));
  }

  /* ============================================================
     Donation form validation
     ============================================================ */
  function initDonationForm() {
    const form = $('#donation-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing…';
      }

      // Replace with actual payment gateway integration
      console.info('[NFC] Donation form submitted — integrate payment gateway here');

      setTimeout(() => {
        window.location.href = 'thank-you.html';
      }, 1000);
    });
  }

  function validateForm(form) {
    let valid = true;
    const required = $$('[required]', form);

    required.forEach((field) => {
      const error = form.querySelector(`[data-error-for="${field.id}"]`);
      if (!field.value.trim()) {
        field.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = 'This field is required.';
        valid = false;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        field.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = 'Please enter a valid email address.';
        valid = false;
      } else {
        field.removeAttribute('aria-invalid');
        if (error) error.textContent = '';
      }
    });

    if (!valid) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    }

    return valid;
  }

  /* ============================================================
     Contact form
     ============================================================ */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form)) return;

      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      // Replace with your backend / form service endpoint
      console.info('[NFC] Contact form submitted — integrate form service here');

      const successMsg = $('#contact-success');
      if (successMsg) {
        successMsg.hidden = false;
        successMsg.focus();
      }
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }

  /* ============================================================
     Smooth scroll for anchor links
     ============================================================ */
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const target = document.getElementById(anchor.getAttribute('href').slice(1));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ============================================================
     Active nav link highlighting based on current page
     ============================================================ */
  function initActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    $$('.primary-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === current || (current === '' && href === 'index.html')) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ============================================================
     Lazy-load images with IntersectionObserver
     ============================================================ */
  function initLazyImages() {
    const lazyImgs = $$('img[data-src]');
    if (!lazyImgs.length || !('IntersectionObserver' in window)) {
      lazyImgs.forEach((img) => { img.src = img.dataset.src; });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      });
    }, { rootMargin: '200px 0px' });

    lazyImgs.forEach((img) => observer.observe(img));
  }

  /* ============================================================
     Newsletter signup
     ============================================================ */
  function initNewsletterForm() {
    $$('.newsletter-form').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('[type="email"]');
        if (!emailInput || !emailInput.value.trim()) return;

        // Replace with your email service integration (Mailchimp, ConvertKit, etc.)
        console.info('[NFC] Newsletter signup:', emailInput.value);

        const successMsg = form.querySelector('.newsletter-success');
        if (successMsg) {
          form.style.display = 'none';
          successMsg.hidden = false;
        }
      });
    });
  }

  /* ============================================================
     Structured data helper — dynamically inject breadcrumb JSON-LD
     ============================================================ */
  function injectBreadcrumbSchema(items) {
    if (!items || !items.length) return;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /* ============================================================
     Bootstrap
     ============================================================ */
  ready(() => {
    initMobileNav();
    initFaqAccordion();
    initDonationAmounts();
    initProgressBars();
    initStatCounters();
    initCookieBanner();
    initDonationForm();
    initContactForm();
    initSmoothScroll();
    initActiveNav();
    initLazyImages();
    initNewsletterForm();
  });

  // Expose breadcrumb helper globally for inline page scripts
  window.NFC = window.NFC || {};
  window.NFC.injectBreadcrumbSchema = injectBreadcrumbSchema;
})();
