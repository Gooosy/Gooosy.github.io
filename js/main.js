/* =====================================================
   main.js — Siyuan Gong's Academic Page
   ===================================================== */

/* ----- Scroll-based fade-in via IntersectionObserver ----- */
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target); // animate once only
      }
    });
  },
  { threshold: 0.08 }
);

document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

/* ----- Active nav link tracking on scroll ----- */
const sections   = document.querySelectorAll('section[id], div[id]');
const navLinks   = document.querySelectorAll('.nav-links a[href^="#"]');
const NAV_OFFSET = 80; // px below nav before activating

const activateNav = () => {
  let current = '';
  sections.forEach((sec) => {
    if (window.scrollY >= sec.offsetTop - NAV_OFFSET) {
      current = sec.getAttribute('id');
    }
  });
  navLinks.forEach((link) => {
    link.classList.toggle(
      'active',
      link.getAttribute('href') === `#${current}`
    );
  });
};

window.addEventListener('scroll', activateNav, { passive: true });
activateNav(); // run once on load

/* ----- Back-to-top button ----- */
const topBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  topBtn.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

topBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ----- Mobile hamburger menu ----- */
const toggle  = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

toggle.addEventListener('click', () => {
  const open = navMenu.classList.toggle('mobile-open');
  toggle.setAttribute('aria-expanded', open);
  toggle.innerHTML = open
    ? '<i class="fas fa-times"></i>'
    : '<i class="fas fa-bars"></i>';
});

// Close on link click
navMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('mobile-open');
    toggle.setAttribute('aria-expanded', false);
    toggle.innerHTML = '<i class="fas fa-bars"></i>';
  });
});

/* ----- Photo lightbox ----- */
const lightbox = document.getElementById('lightbox');
const heroPhoto = document.querySelector('.hero-photo');

heroPhoto.addEventListener('click', () => lightbox.classList.add('open'));

lightbox.addEventListener('click', () => lightbox.classList.remove('open'));

document.getElementById('lightbox-close').addEventListener('click', (e) => {
  e.stopPropagation();
  lightbox.classList.remove('open');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') lightbox.classList.remove('open');
});

/* ----- Stagger delay on award items ----- */
document.querySelectorAll('.award-item').forEach((el, i) => {
  el.style.transitionDelay = `${i * 60}ms`;
});
