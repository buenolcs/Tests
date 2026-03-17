/* ========================================
   ORVYA — Main JavaScript
   UX Guidelines Applied:
   - #1  Smooth scroll (scroll-behavior: smooth on html)
   - #2  Sticky nav padding compensation
   - #3  Active nav state
   - #7  Max 1-2 animations per view
   - #8  150-300ms micro-interactions
   - #9  Respect prefers-reduced-motion
   - #10 Loading states / feedback
   - #11 Hover vs tap — click/tap for primary
   - #14 Ease-out for entering
   - #28 Focus states visible
   - #30 Active press feedback
   - #32 Loading buttons (prevent double submit)
   - #33 Error feedback near problem
   - #34 Success feedback
   - #41 Keyboard navigation
   - #56 Inline validation on blur
   - #57 Correct input types (already in HTML)
   - #61 Submit feedback
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Check reduced motion preference — UX #9
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Header scroll effect ----
  const header = document.getElementById('header');
  if (header) {
    let lastScroll = 0;
    const onScroll = () => {
      const scrollY = window.scrollY;
      header.classList.toggle('scrolled', scrollY > 20);
      lastScroll = scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---- Mobile nav toggle ---- UX #40 (ARIA)
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    const toggleNav = () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');

      const spans = navToggle.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    };

    navToggle.addEventListener('click', toggleNav);

    // Close nav when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('open')) {
          toggleNav();
        }
      });
    });

    // Close on Escape key — UX #41 keyboard nav
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        toggleNav();
        navToggle.focus();
      }
    });
  }

  // ---- Scroll reveal (fade-up) ---- UX #7, #9
  if (!prefersReducedMotion) {
    const fadeEls = document.querySelectorAll('.fade-up');
    if (fadeEls.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

      fadeEls.forEach(el => observer.observe(el));
    }
  } else {
    // Show all immediately if reduced motion
    document.querySelectorAll('.fade-up').forEach(el => {
      el.classList.add('visible');
    });
  }

  // ---- Accordion (Como Funciona) ---- UX #41 keyboard, #28 focus
  const stepItems = document.querySelectorAll('.step-item');
  if (stepItems.length > 0) {
    // Set initial active state
    stepItems.forEach(item => {
      const body = item.querySelector('.step-body');
      if (item.classList.contains('active') && body) {
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });

    const toggleStep = (item) => {
      const isActive = item.classList.contains('active');
      const body = item.querySelector('.step-body');
      const header = item.querySelector('.step-header');

      // Close all
      stepItems.forEach(other => {
        other.classList.remove('active');
        const otherBody = other.querySelector('.step-body');
        const otherHeader = other.querySelector('.step-header');
        if (otherBody) otherBody.style.maxHeight = '0';
        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
      });

      // Open clicked if it was closed
      if (!isActive && body) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
        if (header) header.setAttribute('aria-expanded', 'true');
      }
    };

    stepItems.forEach(item => {
      const header = item.querySelector('.step-header');
      if (!header) return;

      // Click
      header.addEventListener('click', () => toggleStep(item));

      // Keyboard — Enter and Space — UX #41
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleStep(item);
        }
      });
    });
  }

  // ---- Phone mask ---- UX #63 mobile keyboards (inputmode already in HTML)
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 6) {
        v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
      } else if (v.length > 2) {
        v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      } else if (v.length > 0) {
        v = `(${v}`;
      }
      e.target.value = v;
    });
  });

  // ---- Form validation & submission ---- UX #33, #34, #56, #61, #32
  document.querySelectorAll('form').forEach(form => {

    // Inline validation on blur — UX #56
    form.querySelectorAll('input[required], textarea[required]').forEach(input => {
      input.addEventListener('blur', () => {
        validateField(input);
      });

      // Clear error on input
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          clearFieldError(input);
        }
      });
    });

    // Submit handler — UX #32 (prevent double), #34 (success), #61 (feedback)
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate all fields
      let isValid = true;
      form.querySelectorAll('input[required], textarea[required]').forEach(input => {
        if (!validateField(input)) {
          isValid = false;
        }
      });

      if (!isValid) {
        // Focus first error — UX #33
        const firstError = form.querySelector('.error');
        if (firstError) firstError.focus();
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      if (!btn || btn.disabled) return;

      // Loading state — UX #32
      btn.disabled = true;
      btn.classList.add('btn--disabled');
      const originalText = btn.textContent;
      btn.textContent = 'Enviando...';

      // Simulate submission (replace with real API call)
      setTimeout(() => {
        // Show success — UX #34
        const successEl = form.parentElement.querySelector('.form-success');
        if (successEl) {
          form.style.display = 'none';
          successEl.style.display = 'block';
        } else {
          btn.textContent = 'Enviado com sucesso!';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.classList.remove('btn--disabled');
            form.reset();
          }, 3000);
        }
      }, 1000);
    });
  });

  /**
   * Validate a single form field
   * @param {HTMLInputElement} input
   * @returns {boolean}
   */
  function validateField(input) {
    const value = input.value.trim();
    let errorMsg = '';

    if (input.required && !value) {
      errorMsg = 'Este campo é obrigatório';
    } else if (input.type === 'email' && value && !isValidEmail(value)) {
      errorMsg = 'Por favor, insira um email válido';
    } else if (input.type === 'tel' && value && value.replace(/\D/g, '').length < 10) {
      errorMsg = 'Por favor, insira um telefone válido';
    }

    if (errorMsg) {
      showFieldError(input, errorMsg);
      return false;
    }

    clearFieldError(input);
    return true;
  }

  /**
   * Show error on field — UX #33 error near problem
   */
  function showFieldError(input, message) {
    input.classList.add('error');
    input.setAttribute('aria-invalid', 'true');

    let errorEl = input.parentElement.querySelector('.error-message');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'error-message';
      errorEl.setAttribute('role', 'alert'); // UX #44 aria-live
      errorEl.id = input.id + '-error';
      input.setAttribute('aria-describedby', errorEl.id);
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  /**
   * Clear error on field
   */
  function clearFieldError(input) {
    input.classList.remove('error');
    input.removeAttribute('aria-invalid');
    const errorEl = input.parentElement.querySelector('.error-message');
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  /**
   * Basic email validation
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

});
