/**
 * Maths Manthan | Main Interactive Logic
 * Global Theme Switcher (Dark/Light), Mobile nav toggle, scroll spy, WhatsApp generator, and Font adjuster
 */

// Immediate Theme Initialization (runs immediately to prevent flash)
(function initTheme() {
  const savedTheme = localStorage.getItem('mm_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Switcher System
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  function updateThemeButton(theme) {
    if (!themeToggleBtn) return;
    const iconSpan = themeToggleBtn.querySelector('.theme-icon') || themeToggleBtn;
    if (theme === 'dark') {
      iconSpan.textContent = '☀️';
      themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
      themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
      iconSpan.textContent = '🌙';
      themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
      themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    }
  }

  const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeButton(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = current === 'dark' ? 'light' : 'dark';

      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('mm_theme', nextTheme);
      updateThemeButton(nextTheme);

      // Dispatch custom event for real-time canvas animation re-theming
      window.dispatchEvent(new CustomEvent('mm-theme-change', { detail: { theme: nextTheme } }));
    });
  }

  // 2. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });

    // Close menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
        navMenu.classList.remove('mobile-open');
      }
    });

    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      });
    });
  }

  // 3. Sticky Navbar Glassmorphism on Scroll
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // 4. Dynamic WhatsApp Query Generator
  const inquiryForm = document.getElementById('inquiryForm');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('studentName')?.value.trim();
      const studentClass = document.getElementById('studentClass')?.value;
      const subjects = document.getElementById('studentSubject')?.value;
      const notes = document.getElementById('studentNotes')?.value.trim();

      if (!name || !studentClass) {
        alert('Please fill in student name and class.');
        return;
      }

      const phoneNumber = '918171546558'; // Institute Phone Number
      let message = `Hello Sir, I would like to inquire about admission at Maths Manthan Tuition Classes.%0A%0A`;
      message += `*Student Name:* ${encodeURIComponent(name)}%0A`;
      message += `*Class / Grade:* ${encodeURIComponent(studentClass)}%0A`;
      message += `*Subject:* ${encodeURIComponent(subjects)}%0A`;
      if (notes) {
        message += `*Specific Query:* ${encodeURIComponent(notes)}%0A`;
      }
      message += `%0ALooking forward to your guidance!`;

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    });
  }

  // 5. Live Headline Font Size Adjuster Controls
  const heroTitle = document.getElementById('heroTitle');
  const fontDecBtn = document.getElementById('fontDecBtn');
  const fontIncBtn = document.getElementById('fontIncBtn');
  const fontResetBtn = document.getElementById('fontResetBtn');
  const fontSizeDisplay = document.getElementById('fontSizeDisplay');

  if (heroTitle && fontSizeDisplay) {
    const DEFAULT_SIZE = 4.4;
    let currentRem = parseFloat(localStorage.getItem('mm_hero_fontsize')) || DEFAULT_SIZE;

    function applyFontSize(remVal) {
      currentRem = Math.round(remVal * 10) / 10;
      heroTitle.style.fontSize = `clamp(2.6rem, 5.5vw, ${currentRem}rem)`;
      fontSizeDisplay.textContent = `${currentRem}rem`;
      localStorage.setItem('mm_hero_fontsize', currentRem);
    }

    if (localStorage.getItem('mm_hero_fontsize')) {
      applyFontSize(currentRem);
    }

    fontIncBtn?.addEventListener('click', () => {
      if (currentRem < 7.0) {
        applyFontSize(currentRem + 0.2);
      }
    });

    fontDecBtn?.addEventListener('click', () => {
      if (currentRem > 2.4) {
        applyFontSize(currentRem - 0.2);
      }
    });

    fontResetBtn?.addEventListener('click', () => {
      localStorage.removeItem('mm_hero_fontsize');
      currentRem = DEFAULT_SIZE;
      heroTitle.style.fontSize = '';
      fontSizeDisplay.textContent = `${DEFAULT_SIZE}rem`;
    });
  }
});
