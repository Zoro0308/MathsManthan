/**
 * Maths Manthan | Resources Filter, Live Search, Dynamic PDF Binder, & In-Page Chapter Directory Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  let globalCatalog = {};
  let chaptersDatabase = {};

  // 1. Dynamic PDF Catalog Auto-Binder
  fetch('assets/data/pdf-catalog.json?t=' + Date.now())
    .then(res => {
      if (!res.ok) throw new Error('Catalog not available');
      return res.json();
    })
    .then(catalog => {
      globalCatalog = catalog;
      bindCatalogToCards(catalog);
      // If in-page chapter directory is currently open, re-render with fresh catalog
      if (currentInpageClassKey && chaptersDatabase[currentInpageClassKey]) {
        renderInpageChapters(chaptersDatabase[currentInpageClassKey].chapters);
      }
    })
    .catch(err => {
      console.log('PDF catalog dynamic bind note:', err);
    });

  function bindCatalogToCards(catalog) {
    document.querySelectorAll('[data-folder]').forEach(el => {
      const folderKey = el.getAttribute('data-folder');
      if (catalog && catalog[folderKey]) {
        const rawUrl = catalog[folderKey];
        const pdfUrl = encodeURI(rawUrl);
        const viewLink = el.querySelector('a.btn-view, .btn-view');
        if (viewLink && !viewLink.classList.contains('btn-open-dir')) {
          viewLink.href = pdfUrl;
        }
        const downloadLink = el.querySelector('a.btn-download');
        if (downloadLink) {
          downloadLink.href = pdfUrl;
        }
      }
    });
  }

  // 2. Load Chapters Database for In-Page Directory
  fetch('assets/data/chapters-data.json?t=' + Date.now())
    .then(res => {
      if (!res.ok) throw new Error('Chapters DB not found');
      return res.json();
    })
    .then(data => {
      chaptersDatabase = data;
      // Check if URL hash specifies a class to open immediately
      checkUrlHashForDirectory();
    })
    .catch(err => {
      console.log('Chapters DB load notice:', err);
    });

  // 3. Search & Category Filters for Main Hub & Classroom Hub Pages
  const searchInput = document.getElementById('resourceSearch');

  let currentCategory = 'all';
  let searchQuery = '';

  function filterCards() {
    const cards = document.querySelectorAll('#resourcesGrid .resource-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const title = card.querySelector('.resource-title')?.textContent.toLowerCase() || '';
      const desc = card.querySelector('.resource-desc')?.textContent.toLowerCase() || '';
      const code = card.querySelector('.resource-code')?.textContent.toLowerCase() || '';
      const category = card.getAttribute('data-category') || 'all';

      const matchesSearch = !searchQuery || title.includes(searchQuery) || desc.includes(searchQuery) || code.includes(searchQuery);
      const matchesCategory = (currentCategory === 'all') || (category === currentCategory) || category.split(' ').includes(currentCategory);

      if (matchesSearch && matchesCategory) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    const noResults = document.getElementById('noResults');
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterCards();
    });
  }

  // Delegated click handling for ANY category filter pill across ALL classroom and hub pages
  document.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill[data-filter]');
    if (pill) {
      const parentContainer = pill.closest('.filter-pills');
      if (parentContainer) {
        parentContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      }
      pill.classList.add('active');
      currentCategory = pill.getAttribute('data-filter') || 'all';
      filterCards();
    }
  });

  // 4. In-Page Chapter Directory Switcher Engine
  const booksOverviewSection = document.getElementById('booksOverviewSection');
  const inpageChapterSection = document.getElementById('inpageChapterSection');
  const backToBooksBtn = document.getElementById('backToBooksBtn');
  const inpageBookTag = document.getElementById('inpageBookTag');
  const inpageChapterCountBadge = document.getElementById('inpageChapterCountBadge');
  const inpageBookTitle = document.getElementById('inpageBookTitle');
  const inpageBookSubtitle = document.getElementById('inpageBookSubtitle');
  const inpageChapterSearch = document.getElementById('inpageChapterSearch');
  const inpagePartFilterGroup = document.getElementById('inpagePartFilterGroup');
  const inpagePartFilterPills = document.getElementById('inpagePartFilterPills');
  const inpageChaptersGrid = document.getElementById('inpageChaptersGrid');
  const noInpageChapters = document.getElementById('noInpageChapters');

  let currentInpageClassKey = '';
  let currentInpagePartFilter = 'all';
  let inpageSearchQuery = '';

  const classDisplayMeta = {
    class8: {
      tag: 'CLASS 8TH MATHEMATICS',
      title: 'NCERT Class 8 Ganita Prakash',
      parts: [
        { label: 'All 14 Chapters', filter: 'all' },
        { label: 'Part I (Ch 1–7)', filter: 'part1' },
        { label: 'Part II (Ch 1–7)', filter: 'part2' }
      ]
    },
    class9: {
      tag: 'CLASS 9TH MATHEMATICS',
      title: 'NCERT Class 9 Ganita Manjari',
      parts: [
        { label: 'All 14 Chapters', filter: 'all' },
        { label: 'Part 1 (Ch 1–8)', filter: 'part1' },
        { label: 'Part 2 (Ch 9–14)', filter: 'part2' }
      ]
    },
    class10: {
      tag: 'CLASS 10TH MATHEMATICS',
      title: 'NCERT Class 10 Mathematics',
      parts: [
        { label: 'All 14 Chapters', filter: 'all' }
      ]
    },
    class11: {
      tag: 'CLASS 11TH MATHEMATICS',
      title: 'NCERT Class 11 Mathematics',
      parts: [
        { label: 'All 14 Chapters', filter: 'all' }
      ]
    },
    class12: {
      tag: 'CLASS 12TH MATHEMATICS',
      title: 'NCERT Class 12 Mathematics',
      parts: [
        { label: 'All 13 Chapters', filter: 'all' },
        { label: 'Part 1 (Ch 1–6)', filter: 'part1' },
        { label: 'Part 2 (Ch 7–13)', filter: 'part2' }
      ]
    }
  };

  function openInpageDirectory(classKey, pushHistory = true) {
    if (!booksOverviewSection || !inpageChapterSection || !chaptersDatabase[classKey]) return;
    currentInpageClassKey = classKey;
    currentInpagePartFilter = 'all';
    inpageSearchQuery = '';

    const book = chaptersDatabase[classKey];
    const meta = classDisplayMeta[classKey] || {
      tag: `${classKey.toUpperCase()} MATHEMATICS`,
      title: book.bookTitle,
      parts: [{ label: 'All Chapters', filter: 'all' }]
    };

    if (inpageBookTag) inpageBookTag.textContent = meta.tag;
    if (inpageChapterCountBadge) inpageChapterCountBadge.textContent = `${book.chapters.length} CHAPTERS`;
    if (inpageBookTitle) inpageBookTitle.textContent = book.bookTitle;
    if (inpageBookSubtitle) inpageBookSubtitle.textContent = book.subtitle;
    if (inpageChapterSearch) inpageChapterSearch.value = '';

    // Render Part Filter Pills if applicable
    if (inpagePartFilterGroup && inpagePartFilterPills) {
      if (meta.parts && meta.parts.length > 1) {
        inpagePartFilterGroup.style.display = 'block';
        inpagePartFilterPills.innerHTML = meta.parts.map((p, idx) => `
          <button class="filter-pill ${idx === 0 ? 'active' : ''}" data-inpage-part="${p.filter}">${p.label}</button>
        `).join('');

        inpagePartFilterPills.querySelectorAll('.filter-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            inpagePartFilterPills.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentInpagePartFilter = btn.getAttribute('data-inpage-part');
            filterInpageChapters();
          });
        });
      } else {
        inpagePartFilterGroup.style.display = 'none';
        inpagePartFilterPills.innerHTML = '';
      }
    }

    // Populate chapters
    renderInpageChapters(book.chapters);

    // Switch view in-place on the same page!
    booksOverviewSection.style.display = 'none';
    inpageChapterSection.style.display = 'block';

    if (pushHistory) {
      try {
        history.pushState({ view: 'directory', classKey: classKey }, '', `#${classKey}`);
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeInpageDirectory(pushHistory = true) {
    if (!booksOverviewSection || !inpageChapterSection) return;
    inpageChapterSection.style.display = 'none';
    booksOverviewSection.style.display = 'block';
    currentInpageClassKey = '';

    if (pushHistory) {
      try {
        history.pushState({ view: 'overview' }, '', window.location.pathname);
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderInpageChapters(chapters) {
    if (!inpageChaptersGrid) return;
    inpageChaptersGrid.innerHTML = '';

    const folderPrefix = chaptersDatabase[currentInpageClassKey]?.folderPrefix || '';

    chapters.forEach(ch => {
      const folderKey = `${folderPrefix}/${ch.ch}`;
      const resolvedPdf = (globalCatalog && globalCatalog[folderKey]) ? globalCatalog[folderKey] : ch.pdf;

      // Determine part attribute
      let partCategory = 'all';
      if (ch.num.toLowerCase().includes('part i ') || ch.num.toLowerCase().includes('part 1')) {
        partCategory = 'part1';
      } else if (ch.num.toLowerCase().includes('part ii') || ch.num.toLowerCase().includes('part 2')) {
        partCategory = 'part2';
      }

      const card = document.createElement('div');
      card.className = 'resource-card inpage-chapter-card';
      card.setAttribute('data-inpage-part', partCategory);
      card.setAttribute('data-ch-title', ch.title.toLowerCase());
      card.setAttribute('data-ch-desc', ch.desc.toLowerCase());
      card.setAttribute('data-ch-num', ch.num.toLowerCase());

      const safePdf = encodeURI(resolvedPdf || '');
      card.innerHTML = `
        <div>
          <div class="resource-meta">
            <span class="resource-code">${ch.ch.toUpperCase()}</span>
            <span class="resource-badge badge-standard">${ch.num}</span>
          </div>
          <h3 class="resource-title">${ch.title}</h3>
          <p class="resource-desc">${ch.desc}</p>
        </div>
        <div class="resource-footer">
          <span class="resource-stats">NCERT Official • PDF</span>
          <div class="pdf-toggle-box">
            <a href="${safePdf}" target="_blank" rel="noopener noreferrer" class="pdf-toggle-btn btn-view" title="View PDF in browser without downloading">View PDF</a>
            <a href="${safePdf}" download class="pdf-toggle-btn btn-download" title="Download to device">Download</a>
          </div>
        </div>
      `;
      inpageChaptersGrid.appendChild(card);
    });

    filterInpageChapters();
  }

  function filterInpageChapters() {
    if (!inpageChaptersGrid) return;
    const cards = inpageChaptersGrid.querySelectorAll('.inpage-chapter-card');
    let visible = 0;

    cards.forEach(card => {
      const title = card.getAttribute('data-ch-title') || '';
      const desc = card.getAttribute('data-ch-desc') || '';
      const num = card.getAttribute('data-ch-num') || '';
      const part = card.getAttribute('data-inpage-part') || 'all';

      const matchesSearch = !inpageSearchQuery || title.includes(inpageSearchQuery) || desc.includes(inpageSearchQuery) || num.includes(inpageSearchQuery);
      const matchesPart = (currentInpagePartFilter === 'all') || (part === currentInpagePartFilter);

      if (matchesSearch && matchesPart) {
        card.style.display = 'flex';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noInpageChapters) {
      noInpageChapters.style.display = visible === 0 ? 'block' : 'none';
    }
  }

  if (inpageChapterSearch) {
    inpageChapterSearch.addEventListener('input', (e) => {
      inpageSearchQuery = e.target.value.toLowerCase().trim();
      filterInpageChapters();
    });
  }

  // Delegated click for Open Directory buttons
  document.addEventListener('click', (e) => {
    const dirBtn = e.target.closest('.btn-open-dir, .open-chapter-modal');
    if (dirBtn) {
      e.preventDefault();
      const classKey = dirBtn.getAttribute('data-class');
      if (classKey) {
        openInpageDirectory(classKey);
      }
    }
  });

  if (backToBooksBtn) {
    backToBooksBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeInpageDirectory();
    });
  }

  // Check URL Hash on Load
  function checkUrlHashForDirectory() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && chaptersDatabase[hash]) {
      openInpageDirectory(hash, false);
    }
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view === 'directory' && e.state.classKey) {
      openInpageDirectory(e.state.classKey, false);
    } else {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && chaptersDatabase[hash]) {
        openInpageDirectory(hash, false);
      } else if (inpageChapterSection && inpageChapterSection.style.display === 'block') {
        closeInpageDirectory(false);
      }
    }
  });

  // ==========================================================================
  // 4. Maths Manthan Built-in PDF.js Study Reader Modal System
  //    Fast, in-page HTML5 canvas rendering without any browser download prompts
  // ==========================================================================
  let pdfModalEl = null;
  let pdfCanvasEl = null;
  let pdfCanvasCtx = null;
  let pdfLoaderEl = null;
  let pdfLoaderTextEl = null;
  let pdfTitleEl = null;
  let pdfBadgeEl = null;
  let pdfDownloadBtn = null;
  let pdfNewTabBtn = null;
  let pdfPageNumInput = null;
  let pdfPageCountEl = null;
  let pdfPrevBtn = null;
  let pdfNextBtn = null;
  let pdfZoomInBtn = null;
  let pdfZoomOutBtn = null;
  let pdfFitBtn = null;
  let pdfZoomValEl = null;
  let pdfBodyEl = null;

  // PDF.js State
  let currentPdfDoc = null;
  let currentPageNum = 1;
  let isPageRendering = false;
  let pendingPageNum = null;
  let currentZoomScale = 1.25;
  let currentRenderTask = null;
  let currentPdfLoadingTask = null;

  function loadPdfJsLibrary() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/vendor/pdf.worker.min.js';
      return Promise.resolve(window.pdfjsLib);
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'assets/js/vendor/pdf.min.js';
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/vendor/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else {
          reject(new Error('PDF.js library failed to initialize'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load assets/js/vendor/pdf.min.js'));
      document.head.appendChild(script);
    });
  }

  function ensurePdfModal() {
    if (pdfModalEl) return;

    pdfModalEl = document.createElement('div');
    pdfModalEl.id = 'mmPdfModal';
    pdfModalEl.className = 'mm-pdf-modal';
    pdfModalEl.setAttribute('role', 'dialog');
    pdfModalEl.setAttribute('aria-modal', 'true');
    pdfModalEl.setAttribute('aria-labelledby', 'mmPdfTitle');
    pdfModalEl.style.display = 'none';

    pdfModalEl.innerHTML = `
      <div class="mm-pdf-backdrop" id="mmPdfBackdrop"></div>
      <div class="mm-pdf-dialog">
        <div class="mm-pdf-header">
          <div class="mm-pdf-header-left">
            <div class="mm-pdf-logo-pill">
              <span>📖</span>
              <span id="mmPdfBadge">NCERT PDF</span>
            </div>
            <h3 class="mm-pdf-title" id="mmPdfTitle">Class 10 Mathematics Complete</h3>
          </div>
          <div class="mm-pdf-header-center">
            <button id="mmPdfPrevBtn" class="mm-pdf-ctrl-btn" title="Previous Page (Left Arrow)" aria-label="Previous Page">◀ Prev</button>
            <span class="mm-pdf-page-indicator">
              Page
              <input type="number" id="mmPdfPageNum" class="mm-pdf-page-input" min="1" value="1" aria-label="Current Page">
              / <span id="mmPdfPageCount">--</span>
            </span>
            <button id="mmPdfNextBtn" class="mm-pdf-ctrl-btn" title="Next Page (Right Arrow)" aria-label="Next Page">Next ▶</button>
            <span class="mm-pdf-sep"></span>
            <button id="mmPdfZoomOutBtn" class="mm-pdf-ctrl-btn" title="Zoom Out (-)" aria-label="Zoom Out">−</button>
            <span id="mmPdfZoomVal" class="mm-pdf-zoom-val">125%</span>
            <button id="mmPdfZoomInBtn" class="mm-pdf-ctrl-btn" title="Zoom In (+)" aria-label="Zoom In">+</button>
            <button id="mmPdfFitBtn" class="mm-pdf-ctrl-btn" title="Fit to Width" aria-label="Fit to Width">Fit Width</button>
          </div>
          <div class="mm-pdf-header-right">
            <a id="mmPdfDownloadBtn" href="#" download class="mm-pdf-btn mm-btn-download" title="Download PDF to device">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Download</span>
            </a>
            <a id="mmPdfNewTabBtn" href="#" target="_blank" rel="noopener noreferrer" class="mm-pdf-btn mm-btn-tab" title="Open in separate browser tab">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              <span>New Tab ↗</span>
            </a>
            <button id="mmPdfCloseBtn" class="mm-pdf-btn mm-btn-close" aria-label="Close PDF Viewer (ESC)" title="Close Viewer (ESC)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Close</span>
            </button>
          </div>
        </div>
        <div class="mm-pdf-body" id="mmPdfBody">
          <div class="mm-pdf-loader" id="mmPdfLoader">
            <div class="mm-pdf-spinner"></div>
            <span id="mmPdfLoaderText">Opening in Maths Manthan Reader...</span>
          </div>
          <div class="mm-pdf-canvas-wrapper" id="mmPdfCanvasWrapper">
            <canvas id="mmPdfCanvas" class="mm-pdf-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(pdfModalEl);

    pdfCanvasEl = pdfModalEl.querySelector('#mmPdfCanvas');
    pdfCanvasCtx = pdfCanvasEl ? pdfCanvasEl.getContext('2d') : null;
    pdfLoaderEl = pdfModalEl.querySelector('#mmPdfLoader');
    pdfLoaderTextEl = pdfModalEl.querySelector('#mmPdfLoaderText');
    pdfTitleEl = pdfModalEl.querySelector('#mmPdfTitle');
    pdfBadgeEl = pdfModalEl.querySelector('#mmPdfBadge');
    pdfDownloadBtn = pdfModalEl.querySelector('#mmPdfDownloadBtn');
    pdfNewTabBtn = pdfModalEl.querySelector('#mmPdfNewTabBtn');
    pdfPageNumInput = pdfModalEl.querySelector('#mmPdfPageNum');
    pdfPageCountEl = pdfModalEl.querySelector('#mmPdfPageCount');
    pdfPrevBtn = pdfModalEl.querySelector('#mmPdfPrevBtn');
    pdfNextBtn = pdfModalEl.querySelector('#mmPdfNextBtn');
    pdfZoomInBtn = pdfModalEl.querySelector('#mmPdfZoomInBtn');
    pdfZoomOutBtn = pdfModalEl.querySelector('#mmPdfZoomOutBtn');
    pdfFitBtn = pdfModalEl.querySelector('#mmPdfFitBtn');
    pdfZoomValEl = pdfModalEl.querySelector('#mmPdfZoomVal');
    pdfBodyEl = pdfModalEl.querySelector('#mmPdfBody');

    // Event listeners
    pdfModalEl.querySelector('#mmPdfCloseBtn').addEventListener('click', closePdfModal);
    pdfModalEl.querySelector('#mmPdfBackdrop').addEventListener('click', closePdfModal);

    pdfPrevBtn.addEventListener('click', () => {
      if (currentPageNum > 1) {
        currentPageNum--;
        queueRenderPage(currentPageNum);
      }
    });

    pdfNextBtn.addEventListener('click', () => {
      if (currentPdfDoc && currentPageNum < currentPdfDoc.numPages) {
        currentPageNum++;
        queueRenderPage(currentPageNum);
      }
    });

    pdfPageNumInput.addEventListener('change', () => {
      let val = parseInt(pdfPageNumInput.value, 10);
      if (isNaN(val)) val = 1;
      if (currentPdfDoc) {
        val = Math.max(1, Math.min(val, currentPdfDoc.numPages));
      }
      currentPageNum = val;
      queueRenderPage(currentPageNum);
    });

    pdfZoomInBtn.addEventListener('click', () => {
      setPdfZoom(currentZoomScale + 0.2);
    });

    pdfZoomOutBtn.addEventListener('click', () => {
      setPdfZoom(currentZoomScale - 0.2);
    });

    pdfFitBtn.addEventListener('click', () => {
      fitPdfToWidth();
    });
  }

  function renderPdfPage(num) {
    if (!currentPdfDoc) return;
    isPageRendering = true;

    // Update controls
    if (pdfPageNumInput) pdfPageNumInput.value = num;
    if (pdfPrevBtn) pdfPrevBtn.disabled = (num <= 1);
    if (pdfNextBtn) pdfNextBtn.disabled = (num >= currentPdfDoc.numPages);

    currentPdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: currentZoomScale });
      const pixelRatio = window.devicePixelRatio || 1;

      pdfCanvasEl.width = Math.floor(viewport.width * pixelRatio);
      pdfCanvasEl.height = Math.floor(viewport.height * pixelRatio);
      pdfCanvasEl.style.width = Math.floor(viewport.width) + 'px';
      pdfCanvasEl.style.height = Math.floor(viewport.height) + 'px';

      const renderContext = {
        canvasContext: pdfCanvasCtx,
        transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null,
        viewport: viewport
      };

      if (currentRenderTask) {
        try {
          currentRenderTask.cancel();
        } catch (_) {}
      }

      currentRenderTask = page.render(renderContext);

      currentRenderTask.promise.then(() => {
        isPageRendering = false;
        hidePdfLoader();

        if (pendingPageNum !== null) {
          const nextTarget = pendingPageNum;
          pendingPageNum = null;
          renderPdfPage(nextTarget);
        }
      }).catch((err) => {
        if (err && err.name === 'RenderingCancelledException') {
          return; // Cancelled normally when user flips page quickly
        }
        console.error('PDF Page render error:', err);
        isPageRendering = false;
        hidePdfLoader();
      });
    }).catch((err) => {
      console.error('PDF getPage error:', err);
      isPageRendering = false;
      hidePdfLoader();
    });
  }

  function queueRenderPage(num) {
    if (isPageRendering) {
      pendingPageNum = num;
    } else {
      renderPdfPage(num);
    }
  }

  function setPdfZoom(newScale) {
    currentZoomScale = Math.min(Math.max(newScale, 0.5), 3.0);
    if (pdfZoomValEl) {
      pdfZoomValEl.textContent = Math.round(currentZoomScale * 100) + '%';
    }
    if (currentPdfDoc) {
      renderPdfPage(currentPageNum);
    }
  }

  function fitPdfToWidth() {
    if (!currentPdfDoc || !pdfBodyEl) return;
    currentPdfDoc.getPage(currentPageNum).then((page) => {
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const availableWidth = pdfBodyEl.clientWidth - 48;
      const targetScale = Math.min(Math.max(availableWidth / unscaledViewport.width, 0.6), 2.5);
      setPdfZoom(targetScale);
    });
  }

  function showPdfLoader(text) {
    if (pdfLoaderEl) {
      if (pdfLoaderTextEl && text) pdfLoaderTextEl.textContent = text;
      pdfLoaderEl.style.display = 'flex';
      pdfLoaderEl.style.opacity = '1';
    }
  }

  function hidePdfLoader() {
    if (pdfLoaderEl) {
      pdfLoaderEl.style.opacity = '0';
      setTimeout(() => {
        pdfLoaderEl.style.display = 'none';
      }, 200);
    }
  }

  function openPdfModal(pdfUrl, title, badge) {
    ensurePdfModal();

    if (!pdfUrl) return;

    const safeUrl = encodeURI(decodeURI(pdfUrl));

    if (pdfTitleEl) pdfTitleEl.textContent = title || 'Maths Manthan Study Material';
    if (pdfBadgeEl) pdfBadgeEl.textContent = badge || 'NCERT Official';
    if (pdfDownloadBtn) pdfDownloadBtn.href = safeUrl;
    if (pdfNewTabBtn) pdfNewTabBtn.href = safeUrl;

    pdfModalEl.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    showPdfLoader('Opening in Maths Manthan Reader...');

    if (currentRenderTask) {
      try { currentRenderTask.cancel(); } catch (_) {}
      currentRenderTask = null;
    }
    if (currentPdfLoadingTask) {
      try { currentPdfLoadingTask.destroy(); } catch (_) {}
      currentPdfLoadingTask = null;
    }

    loadPdfJsLibrary()
      .then((pdfjs) => {
        currentPdfLoadingTask = pdfjs.getDocument({
          url: safeUrl,
          cMapPacked: true
        });

        return currentPdfLoadingTask.promise;
      })
      .then((pdfDoc) => {
        currentPdfDoc = pdfDoc;
        currentPageNum = 1;
        if (pdfPageCountEl) pdfPageCountEl.textContent = pdfDoc.numPages;
        if (pdfPageNumInput) {
          pdfPageNumInput.value = 1;
          pdfPageNumInput.max = pdfDoc.numPages;
        }

        // Auto-calculate comfortable zoom for dialog width
        if (pdfBodyEl) {
          pdfDoc.getPage(1).then((page) => {
            const unscaled = page.getViewport({ scale: 1.0 });
            const bodyWidth = pdfBodyEl.clientWidth - 48;
            if (bodyWidth > 0 && unscaled.width > 0) {
              const optimalScale = Math.min(Math.max(bodyWidth / unscaled.width, 0.8), 1.5);
              currentZoomScale = optimalScale;
              if (pdfZoomValEl) pdfZoomValEl.textContent = Math.round(optimalScale * 100) + '%';
            }
            renderPdfPage(1);
          }).catch(() => {
            renderPdfPage(1);
          });
        } else {
          renderPdfPage(1);
        }
      })
      .catch((err) => {
        console.error('Maths Manthan PDF.js load error:', err);
        if (pdfLoaderTextEl) {
          pdfLoaderTextEl.innerHTML = `
            <div style="text-align: center; max-width: 380px;">
              <p style="margin: 0 0 0.75rem; color: #f87171;">⚠️ Could not render PDF directly in this browser view.</p>
              <a href="${safeUrl}" download class="mm-pdf-btn mm-btn-download" style="display:inline-block; margin-top: 0.5rem;">
                📥 Download PDF Directly
              </a>
            </div>
          `;
        }
      });
  }

  function closePdfModal() {
    if (!pdfModalEl || pdfModalEl.style.display === 'none') return;
    pdfModalEl.style.display = 'none';
    document.body.style.overflow = '';

    if (currentRenderTask) {
      try { currentRenderTask.cancel(); } catch (_) {}
      currentRenderTask = null;
    }
    if (currentPdfLoadingTask) {
      try { currentPdfLoadingTask.destroy(); } catch (_) {}
      currentPdfLoadingTask = null;
    }
    currentPdfDoc = null;

    if (pdfCanvasEl && pdfCanvasCtx) {
      pdfCanvasCtx.clearRect(0, 0, pdfCanvasEl.width, pdfCanvasEl.height);
      pdfCanvasEl.width = 0;
      pdfCanvasEl.height = 0;
    }
  }

  // Keyboard shortcut: ESC to close, Arrow keys for page flip, +/- for zoom
  document.addEventListener('keydown', (e) => {
    if (!pdfModalEl || pdfModalEl.style.display === 'none') return;

    if (e.key === 'Escape') {
      closePdfModal();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (currentPageNum > 1) {
        currentPageNum--;
        queueRenderPage(currentPageNum);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (currentPdfDoc && currentPageNum < currentPdfDoc.numPages) {
        currentPageNum++;
        queueRenderPage(currentPageNum);
      }
    } else if (e.key === '+' || e.key === '=') {
      setPdfZoom(currentZoomScale + 0.15);
    } else if (e.key === '-' || e.key === '_') {
      setPdfZoom(currentZoomScale - 0.15);
    }
  });

  // Global click interceptor for all "View PDF" buttons
  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('a.btn-view, .pdf-toggle-btn.btn-view');
    if (viewBtn && !viewBtn.classList.contains('btn-open-dir')) {
      const href = viewBtn.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        e.preventDefault();
        const card = viewBtn.closest('.resource-card, .inpage-chapter-card, .resource-item') || viewBtn.parentElement;
        const titleEl = card ? card.querySelector('.resource-title, h3, h4') : null;
        const badgeEl = card ? card.querySelector('.resource-badge, .resource-code, .badge') : null;

        const title = titleEl ? titleEl.innerText.trim() : 'Maths Manthan Study Material';
        const badge = badgeEl ? badgeEl.innerText.trim() : 'NCERT Official';

        openPdfModal(href, title, badge);
      }
    }
  });
});
