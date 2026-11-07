/**
 * Maths Manthan | CBSE Class 10 Exam Announcement Popup Controller
 * Manages modal visibility, accessibility, session persistence, keyboard interactions,
 * and dynamic real-time calculation of days remaining until the exam.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'mm_cbse2027_popup_seen';
  const POPUP_ID = 'cbseExamPopup';
  const CLOSE_BTN_ID = 'cbsePopupClose';

  // Official CBSE Class 10 Mathematics Exam Date & Time:
  // 17 February 2027 at 10:30 AM IST (UTC+05:30)
  const EXAM_DATE_ISO = '2027-02-17T10:30:00+05:30';

  let popupEl = null;
  let closeBtnEl = null;
  let lastActiveElement = null;
  let countdownTimer = null;

  /**
   * Dynamically calculates current date & time and updates the "Days Left" display.
   */
  function updateDaysRemaining() {
    const textEl = document.getElementById('cbseDaysText');
    const pillEl = document.getElementById('cbseCountdownPill');
    if (!textEl && !pillEl) return;

    const now = new Date();
    const examDate = new Date(EXAM_DATE_ISO);
    const diffMs = examDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      if (textEl) textEl.textContent = 'Exam Today / Concluded';
      return;
    }

    const oneDayMs = 24 * 60 * 60 * 1000;
    const days = Math.ceil(diffMs / oneDayMs);
    const daysFloor = Math.floor(diffMs / oneDayMs);
    const hoursRemaining = Math.floor((diffMs % oneDayMs) / (60 * 60 * 1000));
    const minutesRemaining = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

    if (textEl) {
      if (days > 1) {
        textEl.innerHTML = `<strong>${days}</strong> Days Remaining`;
      } else if (days === 1) {
        textEl.innerHTML = `<strong>1</strong> Day Left (Tomorrow)`;
      } else {
        const totalHours = Math.floor(diffMs / (60 * 60 * 1000));
        textEl.innerHTML = `<strong>${totalHours}h</strong> Left (Today)`;
      }
    }

    if (pillEl) {
      pillEl.setAttribute(
        'title',
        `Current Time: ${now.toLocaleString()} | Live countdown: ${daysFloor} days, ${hoursRemaining} hours, and ${minutesRemaining} minutes remaining until 17 Feb 2027, 10:30 AM IST`
      );
    }
  }

  function initPopup() {
    popupEl = document.getElementById(POPUP_ID);
    if (!popupEl) return;

    closeBtnEl = document.getElementById(CLOSE_BTN_ID);

    // Initial calculation so UI is instantly ready
    updateDaysRemaining();

    // Event listeners
    if (closeBtnEl) {
      closeBtnEl.addEventListener('click', closePopup);
    }

    // Dismiss when clicking on backdrop
    popupEl.addEventListener('click', function (e) {
      if (e.target === popupEl || e.target.getAttribute('data-action') === 'close') {
        closePopup();
      }
    });

    // Escape key listener & Tab focus trap
    document.addEventListener('keydown', handleKeydown);

    // Check query params for preview override (?preview_cbse=1 or ?cbse=1)
    const urlParams = new URLSearchParams(window.location.search);
    const forcePreview = urlParams.has('preview_cbse') || urlParams.has('cbse') || urlParams.has('popup');

    // Check sessionStorage
    const hasSeen = sessionStorage.getItem(STORAGE_KEY);

    if (forcePreview || !hasSeen) {
      // Gentle reveal after initial render
      setTimeout(openPopup, 600);
    }
  }

  function openPopup() {
    if (!popupEl) return;

    // Recalculate precisely at the moment the popup appears
    updateDaysRemaining();

    // Keep live counter updated every minute while active
    if (!countdownTimer) {
      countdownTimer = setInterval(updateDaysRemaining, 60000);
    }

    lastActiveElement = document.activeElement;
    popupEl.classList.add('is-active');
    document.body.classList.add('cbse-popup-open');

    // Accessibility focus
    if (closeBtnEl) {
      closeBtnEl.focus();
    } else {
      popupEl.focus();
    }
  }

  function closePopup() {
    if (!popupEl) return;

    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }

    popupEl.classList.remove('is-active');
    document.body.classList.remove('cbse-popup-open');

    // Mark as seen in this browser session
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (e) {
      // Fallback if sessionStorage is disabled
    }

    // Restore focus
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  function handleKeydown(e) {
    if (!popupEl || !popupEl.classList.contains('is-active')) return;

    // ESC key closes
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closePopup();
      return;
    }

    // Focus trap
    if (e.key === 'Tab') {
      const focusableElements = popupEl.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  // Expose global methods for manual invocation or testing
  window.openCbsePopup = openPopup;
  window.closeCbsePopup = closePopup;
  window.updateCbseDaysRemaining = updateDaysRemaining;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPopup);
  } else {
    initPopup();
  }
})();
