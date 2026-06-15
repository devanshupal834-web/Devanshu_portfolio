/* ===================================================
   ProCuts — Rekorder-Inspired Interactivity
   Devanshu Pal · 2026
=================================================== */

/* ─── Page Loader ────────────────────────────────── */
const loader = document.getElementById('pageLoader');

function finishLoader() {
  loader.classList.add('is-done');
  document.body.classList.remove('is-loading');
  // Trigger hero entrance
  initHeroEntrance();
}

// Wait for CSS animation (loader-fill: 1.6s) + small buffer
window.addEventListener('load', () => {
  setTimeout(finishLoader, 2000);
});

/* ─── Hero Background Canvas Video (Ken Burns) ────── */
function initHeroBgVideo() {
  const canvas = document.getElementById('heroBgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let frameId;
  let startTime;

  // Duration of one full Ken Burns cycle (ms)
  const CYCLE = 18000;

  // Load the thumbnail as the "video" source
  const img = new Image();
  img.src = 'assets/teaser_thumbnail.png';

  img.onload = function () {
    function resize() {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    }
    resize();
    window.addEventListener('resize', () => { resize(); });

    function draw(ts) {
      if (!startTime) startTime = ts;
      const elapsed = (ts - startTime) % CYCLE;
      const t = elapsed / CYCLE;  // 0 → 1 linear

      const W = canvas.width;
      const H = canvas.height;

      // Ken Burns: slowly zoom from 1.08 → 1.18 and pan horizontally
      const scale = 1.08 + t * 0.12;
      const panX = Math.sin(t * Math.PI) * 0.04;  // subtle left→right→left
      const panY = t * 0.04;                        // slight downward drift

      const srcW = img.naturalWidth / scale;
      const srcH = img.naturalHeight / scale;
      const srcX = (img.naturalWidth - srcW) * (0.5 + panX);
      const srcY = (img.naturalHeight - srcH) * (0.5 + panY);

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, W, H);

      frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);
  };

  img.onerror = () => console.warn('ProCuts: hero bg image not found.');
}

/* ─── Header scroll behaviour ────────────────────── */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
  updateActiveNavLink();
}, { passive: true });

function updateActiveNavLink() {
  const links = document.querySelectorAll('.hn-link');
  const sections = ['home', 'portfolio', 'about', 'contact'];
  let current = 'home';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 200) current = id;
  });
  links.forEach(l => {
    const href = l.getAttribute('href').replace('#', '');
    l.classList.toggle('is-active', href === current);
  });
}

/* ─── Mobile Menu ────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobileOverlay');
let menuOpen = false;

hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen;
  hamburger.classList.toggle('is-open', menuOpen);
  hamburger.setAttribute('aria-expanded', menuOpen);
  mobileOverlay.classList.toggle('is-open', menuOpen);
  mobileOverlay.setAttribute('aria-hidden', !menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';
});

// Close on link click
mobileOverlay.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    menuOpen = false;
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileOverlay.classList.remove('is-open');
    mobileOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
});

/* ─── Split-Text Reveal ──────────────────────────── */
// Elements with [data-split-lines] get each text-line wrapped:
//   <div class="split-line">
//     <span class="split-line-inner">text...</span>
//   </div>
function initSplitLines() {
  document.querySelectorAll('[data-split-lines]').forEach(el => {
    // Preserve inner HTML (including <em>, <br>)
    const rawHTML = el.innerHTML;

    // Convert to plain text lines by splitting on <br>
    const parts = rawHTML.split(/<br\s*\/?>/gi);

    el.innerHTML = parts.map(part => `
      <span class="split-line">
        <span class="split-line-inner">${part.trim()}</span>
      </span>
    `).join('');
  });
}

/* ─── Hero Entrance (runs after loader) ──────────── */
function initHeroEntrance() {
  const heroLabel = document.querySelector('.hero-label');
  const heroLines = document.querySelectorAll('.hero-headline .split-line-inner');
  const heroAnimEls = document.querySelectorAll('.hero [data-anim]');

  if (heroLabel) {
    setTimeout(() => heroLabel.classList.add('is-visible'), 100);
  }

  heroLines.forEach((line, i) => {
    setTimeout(() => line.classList.add('is-visible'), 200 + i * 150);
  });

  heroAnimEls.forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0) * 1000;
    setTimeout(() => el.classList.add('is-visible'), delay + 100);
  });
}

/* ─── IntersectionObserver for scroll reveals ───── */
function initScrollAnimations() {
  // Observer for split-line-inner elements
  const lineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Animate all lines within this block
        entry.target.querySelectorAll('.split-line-inner').forEach((inner, i) => {
          setTimeout(() => inner.classList.add('is-visible'), i * 120);
        });
        lineObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-split-lines]').forEach(el => {
    // Skip hero (handled by initHeroEntrance)
    if (!el.closest('.hero')) lineObserver.observe(el);
  });

  // Observer for [data-anim] elements (fade-up, fade)
  const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseFloat(entry.target.dataset.delay || 0) * 1000;
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        animObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('[data-anim]').forEach(el => {
    if (!el.closest('.hero')) animObserver.observe(el);
  });
}

/* ─── Skill bar animations ───────────────────────── */
function initSkillBars() {
  const bars = document.querySelectorAll('.sk-fill');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const w = entry.target.dataset.w;
        setTimeout(() => {
          entry.target.style.width = w + '%';
        }, 200);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => observer.observe(b));
}

/* ─── Portfolio Filtering ────────────────────────── */
function initFilters() {
  const chips = document.querySelectorAll('.f-chip');
  const cards = document.querySelectorAll('.work-card');
  const worksGrid = document.querySelector('.works-grid');
  const moodBoard = document.getElementById('photoMoodboard');

  // Default: show Photographs (mood board), hide Videos grid
  worksGrid.style.display = 'none';
  moodBoard.style.display = 'block';

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');

      const filter = chip.dataset.filter;

      if (filter === 'photography') {
        // Show mood board
        worksGrid.style.display = 'none';
        moodBoard.style.display = 'block';
        moodBoard.style.opacity = '0';
        setTimeout(() => {
          moodBoard.style.transition = 'opacity .5s var(--ease-out)';
          moodBoard.style.opacity = '1';
        }, 40);
      } else {
        // Show all video work cards
        moodBoard.style.display = 'none';
        worksGrid.style.display = '';
        cards.forEach(card => {
          card.classList.remove('is-hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.transition = 'opacity .5s var(--ease-out), transform .5s var(--ease-out)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 40);
        });
      }
    });
  });
}

/* ─── Lightbox / Video Modal ─────────────────────── */
function initLightbox() {
  const lb = document.getElementById('videoLightbox');
  const container = document.getElementById('videoContainer');
  const closeBtn = document.getElementById('lightboxClose');
  let activeVideo = null;

  function openLb(videoSrc, isPortrait) {
    container.innerHTML = '';

    const vid = document.createElement('video');
    vid.src = videoSrc;
    vid.controls = true;
    vid.autoplay = true;
    vid.playsInline = true;
    vid.style.cssText = isPortrait
      ? 'max-height:88vh; width:auto; max-width:100%; display:block; margin:0 auto; border-radius:8px;'
      : 'width:100%; max-height:88vh; display:block; border-radius:8px;';

    container.appendChild(vid);
    activeVideo = vid;

    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    vid.play().catch(() => {/* autoplay blocked — user can press play */ });
  }

  function closeLb() {
    if (activeVideo) {
      activeVideo.pause();
      activeVideo.src = '';   // release file handle & memory
      activeVideo = null;
    }
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => container.innerHTML = '', 400);
  }

  closeBtn.addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

  // Trigger from work cards — read actual data-video-src
  document.querySelectorAll('.wc-media').forEach(media => {
    media.style.cursor = 'pointer';
    media.addEventListener('click', () => {
      const src = media.dataset.videoSrc;
      if (!src) return;
      const isPortrait = !media.closest('.wc-landscape');
      openLb(src, isPortrait);
    });
  });
}


/* ─── Contact Form ───────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.ff-submit span');
    if (btn) btn.textContent = 'Sending…';
    setTimeout(() => {
      form.reset();
      form.style.display = 'none';
      success.classList.add('visible');
    }, 1200);
  });
}

/* ─── Smooth anchor scrolling ────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const offset = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });
}

/* ─── Section divider line draw ──────────────────── */
function initLineDraw() {
  // The border-bottom of .section-head draws in on scroll
  // We handle it via a pseudo element width animation
  const heads = document.querySelectorAll('.section-head');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('line-drawn');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  heads.forEach(h => obs.observe(h));
}

/* ─── Hire Me Card ───────────────────────────────── */
function initHireCard() {
  const card = document.getElementById('hireCard');
  const closeBtn = document.getElementById('hireClose');
  const hireBtn = document.getElementById('hireBtn');
  if (!card) return;

  // Don't show again if already dismissed this session
  if (sessionStorage.getItem('hireCardDismissed')) return;

  // Slide up after 3s
  setTimeout(() => {
    card.classList.add('is-visible');
  }, 3000);

  function dismiss() {
    card.classList.remove('is-visible');
    card.classList.add('is-dismissed');
    sessionStorage.setItem('hireCardDismissed', '1');
  }

  closeBtn.addEventListener('click', dismiss);
  // Also dismiss when Hire Me is clicked (user is navigating to contact)
  hireBtn.addEventListener('click', () => setTimeout(dismiss, 600));
}

/* ─── Init ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSplitLines();       // Must run first – restructures DOM
  initHeroBgVideo();      // Background canvas animation
  initScrollAnimations();
  initSkillBars();
  initFilters();
  initLightbox();
  initContactForm();
  initSmoothScroll();
  initLineDraw();
  initHireCard();
});
