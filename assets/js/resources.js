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



  // ==========================================================================

  // 1b. Chapter Tests Drilldown Engine (Option B - Adaptive & Non-Disruptive)

  // ==========================================================================

  let currentActiveChapterFolder = null;



  function getChapterItems(folderKey, catalog) {

    if (catalog && catalog[folderKey + '__items'] && Array.isArray(catalog[folderKey + '__items'])) {

      return catalog[folderKey + '__items'];

    }

    const allFiles = (catalog && catalog[folderKey + '__all']) || (catalog && catalog[folderKey] ? [catalog[folderKey]] : []);

    const items = [];

    const realFiles = allFiles.filter(path => {

      const fn = path.split('/').pop().toLowerCase();

      return !(/^class-?\d+-ch-?\d+\.pdf$/.test(fn)) || allFiles.length === 1;

    });



    realFiles.forEach(path => {

      const filename = path.split('/').pop();

      const fnLower = filename.toLowerCase();



      if (fnLower.includes('solution') || fnLower.includes('sol') || fnLower.includes('ans') || fnLower.includes('key') || fnLower.includes('marking')) {

        const m = fnLower.match(/test[-_\s]*(\d+)/);

        const num = m ? m[1] : '';

        items.push({

          name: filename,

          path: path,

          title: num ? `Class Test ${num} — Solutions / Answer Key` : 'Solutions & Answer Key',

          code: num ? `TEST-${String(num).padStart(2, '0')}-SOL` : 'SOLUTIONS',

          badge: 'Answer Key',

          type: 'solution',

          order: num ? (parseInt(num, 10) * 10 + 2) : 95

        });

      } else if (fnLower.includes('test')) {

        const m = fnLower.match(/test[-_\s]*(\d+)/);

        const num = m ? m[1] : '';

        items.push({

          name: filename,

          path: path,

          title: num ? `Class Test ${num}` : 'Chapter Practice Test',

          code: num ? `TEST-${String(num).padStart(2, '0')}` : 'TEST',

          badge: 'Test Paper',

          type: 'test',

          order: num ? (parseInt(num, 10) * 10 + 1) : 50

        });

      } else {

        items.push({

          name: filename,

          path: path,

          title: 'Chapter Study Material & Theory Notes',

          code: 'CHAPTER NOTES',

          badge: 'Study Material',

          type: 'material',

          order: 0

        });

      }

    });



    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    return items;

  }



  function adaptCardForChapterTests(el, folderKey, items, testCount) {

    const metaContainer = el.querySelector('.resource-meta');

    if (metaContainer) {

      let existingBadge = metaContainer.querySelector('.badge-tests');

      if (testCount > 0) {

        if (!existingBadge) {

          const badge = document.createElement('span');

          badge.className = 'resource-badge badge-tests';

          badge.textContent = `[ ${testCount} Test${testCount > 1 ? 's' : ''} Available ]`;

          metaContainer.appendChild(badge);

        } else {

          existingBadge.textContent = `[ ${testCount} Test${testCount > 1 ? 's' : ''} Available ]`;

        }

      } else if (existingBadge) {

        existingBadge.remove();

      }

    }



    const footer = el.querySelector('.resource-footer');

    if (footer) {

      // Completely remove the old view/download toggle pill on chapter cards

      const toggleBox = footer.querySelector('.pdf-toggle-box');

      if (toggleBox) {

        toggleBox.remove();

      }



      let openBtn = footer.querySelector('.btn-open-chapter-tests');

      if (!openBtn) {

        openBtn = document.createElement('button');

        openBtn.type = 'button';

        openBtn.className = 'btn-open-chapter-tests';

        openBtn.setAttribute('data-folder', folderKey);

        footer.appendChild(openBtn);

      }

      openBtn.innerHTML = `<span>📂 Open Test Papers &rarr;</span>`;

      openBtn.onclick = (e) => {

        e.stopPropagation();

        openChapterTestsView(folderKey, el);

      };

    }



    el.classList.add('has-tests-drilldown');

    el.style.cursor = 'pointer';

    el.onclick = (e) => {

      if (e.target.closest('a, button')) return;

      openChapterTestsView(folderKey, el);

    };

  }



  function openChapterTestsView(folderKey, cardEl, pushHistory = true) {

    const resourcesGrid = document.getElementById('resourcesGrid');

    if (!resourcesGrid) return;



    const items = getChapterItems(folderKey, globalCatalog);

    if (!items || items.length === 0) return;



    currentActiveChapterFolder = folderKey;



    const title = cardEl?.querySelector('.resource-title')?.textContent?.trim() || 'Chapter Test Papers';

    const desc = cardEl?.querySelector('.resource-desc')?.textContent?.trim() || 'Official chapter-wise practice tests, solutions, and study material.';

    const code = cardEl?.querySelector('.resource-code')?.textContent?.trim() || folderKey.split('/').pop().toUpperCase();

    const metaBadge = cardEl?.querySelector('.badge-standard')?.textContent?.trim() || '';

    const testCount = items.filter(i => i.type === 'test').length;



    const heroTitle = document.querySelector('.resources-hero h1')?.textContent || '';

    const pageClassTitle = heroTitle.split('(')[0]?.trim() || 'Classroom';



    let drilldownView = document.getElementById('chapterTestsView');

    if (!drilldownView) {

      drilldownView = document.createElement('div');

      drilldownView.id = 'chapterTestsView';

      drilldownView.className = 'chapter-tests-view-container';

      resourcesGrid.parentNode.insertBefore(drilldownView, resourcesGrid);

    }



    const currentViewMode = localStorage.getItem('mm_view_mode') || 'extra-large';



    drilldownView.innerHTML = `

      <div class="chapter-drilldown-header">

        <button type="button" class="btn-back-chapters" id="btnBackChapters" title="Return to chapters list">

          <span>&larr;</span> Back to All Chapters

        </button>

        <div class="drilldown-breadcrumbs">

          <a href="index.html">Home</a> &gt; 

          <span class="crumb-parent">${pageClassTitle}</span> &gt; 

          <span class="active-crumb">${title}</span>

        </div>

      </div>



      <div class="chapter-drilldown-banner">

        <div class="resource-meta" style="margin-bottom: 0.5rem;">

          <span class="resource-code">${code}</span>

          ${metaBadge ? `<span class="resource-badge badge-standard">${metaBadge}</span>` : ''}

          ${testCount > 0 ? `<span class="resource-badge badge-tests">[ ${testCount} Test${testCount > 1 ? 's' : ''} Available ]</span>` : ''}

        </div>

        <h2 class="drilldown-title">${title}</h2>

        <p class="drilldown-desc">${desc}</p>

      </div>



      <div class="drilldown-toolbar-bar">

        <div class="drilldown-status-info">

          <span>Available Resources: <strong>${items.length}</strong> document${items.length > 1 ? 's' : ''}</span>

        </div>

        <div class="view-mode-selector-wrap">

          <button type="button" class="view-mode-btn" data-view-mode="extra-large" title="Extra large icons">

            <span>⬜</span> Extra Large

          </button>

          <button type="button" class="view-mode-btn" data-view-mode="large" title="Large icons">

            <span>🔲</span> Large

          </button>

          <button type="button" class="view-mode-btn" data-view-mode="content" title="Content row view">

            <span>☰</span> Content

          </button>

        </div>

      </div>



      <div class="resources-grid chapter-tests-grid view-${currentViewMode}" id="chapterTestsGrid">

        ${items.map(it => {

          const safeUrl = encodeURI(it.path);

          const typeDesc = (it.type === 'material')

            ? 'Official NCERT chapter theory, comprehensive concept notes, and textbook exercises.'

            : (it.type === 'solution')

            ? 'Complete step-by-step verified solutions and marking scheme for this class test.'

            : 'Official chapter practice test paper designed for high-scoring board exam preparation.';

          return `

            <div class="resource-card chapter-paper-card ${it.type}-card">

              <div>

                <div class="resource-meta">

                  <span class="resource-code">${it.code}</span>

                  <span class="resource-badge badge-${it.type}">${it.badge}</span>

                </div>

                <h3 class="resource-title">${it.title}</h3>

                <p class="resource-desc">${typeDesc}</p>

              </div>

              <div class="resource-footer">

                <span class="resource-stats">${it.size ? it.size + ' • ' : ''}PDF</span>

                <div class="pdf-toggle-box">

                  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="pdf-toggle-btn btn-view" title="View PDF in browser without downloading">View PDF</a>

                  <span class="pdf-toggle-divider"></span>

                  <a href="${safeUrl}" download class="pdf-toggle-btn btn-download" title="Download to device">Download</a>

                </div>

              </div>

            </div>

          `;

        }).join('')}

        ${testCount === 0 ? `

          <div class="resource-card chapter-paper-card upcoming-card" style="border-style: dashed;">

            <div>

              <div class="resource-meta">

                <span class="resource-code">TEST SERIES</span>

                <span class="resource-badge badge-coming-soon">Coming Soon</span>

              </div>

              <h3 class="resource-title">Classroom Test Papers</h3>

              <p class="resource-desc">Official practice tests and step-by-step answer keys for this chapter will be uploaded soon. Use the study notes above to prepare!</p>

            </div>

            <div class="resource-footer">

              <span class="resource-stats">PREPARING</span>

              <span class="upcoming-status-text">In Development</span>

            </div>

          </div>

        ` : ''}

      </div>

    `;



    drilldownView.querySelector('#btnBackChapters').onclick = () => {

      closeChapterTestsView();

    };



    const filterSection = document.querySelector('.filter-section');

    if (filterSection) {

      filterSection.classList.add('drilldown-hidden');

      filterSection.style.setProperty('display', 'none', 'important');

    }

    resourcesGrid.classList.add('drilldown-hidden');

    resourcesGrid.style.setProperty('display', 'none', 'important');

    drilldownView.style.display = 'block';



    applyViewMode(currentViewMode);



    const chSlug = folderKey.split('/').pop();

    if (pushHistory) {

      try {

        history.pushState({ view: 'chapter-tests', folderKey: folderKey }, '', '#' + chSlug);

      } catch (e) {}

    }



    window.scrollTo({ top: 0, behavior: 'smooth' });

  }



  function closeChapterTestsView(pushHistory = true) {

    const drilldownView = document.getElementById('chapterTestsView');

    const resourcesGrid = document.getElementById('resourcesGrid');

    const filterSection = document.querySelector('.filter-section');



    if (drilldownView) drilldownView.style.display = 'none';

    if (resourcesGrid) {

      resourcesGrid.classList.remove('drilldown-hidden');

      resourcesGrid.style.removeProperty('display');

      resourcesGrid.style.display = '';

    }

    if (filterSection) {

      filterSection.classList.remove('drilldown-hidden');

      filterSection.style.removeProperty('display');

      filterSection.style.display = '';

    }



    const prevFolder = currentActiveChapterFolder;

    currentActiveChapterFolder = null;



    if (pushHistory) {

      try {

        history.pushState({ view: 'overview' }, '', window.location.pathname);

      } catch (e) {}

    }



    if (prevFolder) {

      const card = document.querySelector(`.resource-card[data-folder="${prevFolder}"]`);

      if (card) {

        card.scrollIntoView({ behavior: 'smooth', block: 'center' });

      }

    }

  }




  // ==========================================================================
  // Class 10 Chapter-Wise Formula Handbooks In-Page Hub
  // ==========================================================================
  let class10FormulasData = null;
  let isFormulaHubOpen = false;

  // ==========================================================================
  // Multi-Class: In-Page View Switcher Engine (Overview Dashboard <-> Chapters Grid)
  // Supports Classes 8, 9, 10, 11, and 12
  // ==========================================================================
  const classConfigs = [
    {
      key: '8',
      overviewId: 'class8OverviewSection',
      chaptersId: 'class8ChaptersSection',
      titleId: 'class8PageTitle',
      defaultTitle: 'Class 8 Mathematics',
      chaptersTitle: 'Class 8 Mathematics (Chapter Tests)',
      btnBackId: 'btnBackToClass8Overview',
      crumbHomeId: 'crumbClass8Home',
      triggerSelectors: '#btnOpenClass8Chapters, #cardOpenChapterTests8, .btn-open-class8-tests'
    },
    {
      key: '9',
      overviewId: 'class9OverviewSection',
      chaptersId: 'class9ChaptersSection',
      titleId: 'class9PageTitle',
      defaultTitle: 'Class 9 Mathematics',
      chaptersTitle: 'Class 9 Mathematics (Chapter Tests)',
      btnBackId: 'btnBackToClass9Overview',
      crumbHomeId: 'crumbClass9Home',
      triggerSelectors: '#btnOpenClass9Chapters, #cardOpenChapterTests9, .btn-open-class9-tests'
    },
    {
      key: '10',
      overviewId: 'class10OverviewSection',
      chaptersId: 'class10ChaptersSection',
      titleId: 'class10PageTitle',
      defaultTitle: 'CBSE-Class 10 Mathematics',
      chaptersTitle: 'CBSE-Class 10 Mathematics (Chapter Tests)',
      btnBackId: 'btnBackToClass10Overview',
      crumbHomeId: 'crumbClass10Home',
      triggerSelectors: '#btnOpenClass10Chapters, #cardOpenChapterTests, .btn-open-class10-tests'
    },
    {
      key: '11',
      overviewId: 'class11OverviewSection',
      chaptersId: 'class11ChaptersSection',
      titleId: 'class11PageTitle',
      defaultTitle: 'CBSE Class 11 Mathematics',
      chaptersTitle: 'CBSE Class 11 Mathematics (Chapter Tests)',
      btnBackId: 'btnBackToClass11Overview',
      crumbHomeId: 'crumbClass11Home',
      triggerSelectors: '#btnOpenClass11Chapters, #cardOpenChapterTests11, .btn-open-class11-tests'
    },
    {
      key: '12',
      overviewId: 'class12OverviewSection',
      chaptersId: 'class12ChaptersSection',
      titleId: 'class12PageTitle',
      defaultTitle: 'CBSE Class 12 Core Maths',
      chaptersTitle: 'CBSE Class 12 Core Maths (Chapter Tests)',
      btnBackId: 'btnBackToClass12Overview',
      crumbHomeId: 'crumbClass12Home',
      triggerSelectors: '#btnOpenClass12Chapters, #cardOpenChapterTests12, .btn-open-class12-tests'
    }
  ];

  const activeClassConfig = classConfigs.find(cfg => document.getElementById(cfg.overviewId) && document.getElementById(cfg.chaptersId));

  let isClassChaptersGridOpen = false;

  function openClassChaptersGrid(pushHistory = true) {
    if (!activeClassConfig) return;
    const overviewSection = document.getElementById(activeClassConfig.overviewId);
    const chaptersSection = document.getElementById(activeClassConfig.chaptersId);
    const pageTitle = document.getElementById(activeClassConfig.titleId);
    if (!overviewSection || !chaptersSection) return;

    if (typeof isFormulaHubOpen !== 'undefined' && isFormulaHubOpen && typeof closeFormulaHubView === 'function') {
      closeFormulaHubView(false);
    }
    if (typeof currentActiveChapterFolder !== 'undefined' && currentActiveChapterFolder && typeof closeChapterTestsView === 'function') {
      closeChapterTestsView(false);
    }

    isClassChaptersGridOpen = true;
    overviewSection.style.display = 'none';
    chaptersSection.style.display = 'block';

    if (typeof applyViewMode === 'function') {
      applyViewMode(localStorage.getItem('mm_view_mode') || 'extra-large');
    }

    if (pageTitle) {
      pageTitle.textContent = activeClassConfig.chaptersTitle;
    }

    if (pushHistory) {
      try {
        history.pushState({ view: 'class' + activeClassConfig.key + '-chapters' }, '', '#chapters');
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeClassChaptersGrid(pushHistory = true) {
    if (!activeClassConfig) return;
    const overviewSection = document.getElementById(activeClassConfig.overviewId);
    const chaptersSection = document.getElementById(activeClassConfig.chaptersId);
    const pageTitle = document.getElementById(activeClassConfig.titleId);
    if (!overviewSection || !chaptersSection) return;

    if (typeof currentActiveChapterFolder !== 'undefined' && currentActiveChapterFolder && typeof closeChapterTestsView === 'function') {
      closeChapterTestsView(false);
    }

    isClassChaptersGridOpen = false;
    chaptersSection.style.display = 'none';
    overviewSection.style.display = 'block';

    if (typeof applyViewMode === 'function') {
      applyViewMode(localStorage.getItem('mm_view_mode') || 'extra-large');
    }

    if (pageTitle) {
      pageTitle.textContent = activeClassConfig.defaultTitle;
    }

    if (pushHistory) {
      try {
        history.pushState({ view: 'overview' }, '', window.location.pathname);
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Backwards-compatible aliases for Class 10
  const class10OverviewSection = document.getElementById('class10OverviewSection');
  const class10ChaptersSection = document.getElementById('class10ChaptersSection');
  const class10PageTitle = document.getElementById('class10PageTitle');
  const btnBackToClass10Overview = document.getElementById('btnBackToClass10Overview');
  const crumbClass10Home = document.getElementById('crumbClass10Home');
  let isClass10ChaptersGridOpen = false;
  function openClass10ChaptersGrid(pushHistory = true) {
    isClass10ChaptersGridOpen = true;
    openClassChaptersGrid(pushHistory);
  }
  function closeClass10ChaptersGrid(pushHistory = true) {
    isClass10ChaptersGridOpen = false;
    closeClassChaptersGrid(pushHistory);
  }

  if (activeClassConfig) {
    const btnBack = document.getElementById(activeClassConfig.btnBackId);
    if (btnBack) {
      btnBack.addEventListener('click', (e) => {
        e.preventDefault();
        closeClassChaptersGrid();
      });
    }

    const crumbHome = document.getElementById(activeClassConfig.crumbHomeId);
    if (crumbHome) {
      crumbHome.addEventListener('click', (e) => {
        e.preventDefault();
        closeClassChaptersGrid();
      });
    }
  }

  // ==========================================================================
  // Class 10: In-Page NCERT Sample Papers View Switcher & Drilldown Engine
  // ==========================================================================
  const class10SamplePapersSection = document.getElementById('class10SamplePapersSection');
  const btnBackFromSamplesToOverview = document.getElementById('btnBackFromSamplesToOverview');
  const crumbClass10HomeFromSamples = document.getElementById('crumbClass10HomeFromSamples');
  let isClass10SamplePapersOpen = false;
  let activeSamplePaperFolder = null;

  function openClass10SamplePapers(pushHistory = true) {
    if (!class10OverviewSection || !class10SamplePapersSection) return;

    if (typeof isFormulaHubOpen !== 'undefined' && isFormulaHubOpen && typeof closeFormulaHubView === 'function') {
      closeFormulaHubView(false);
    }
    if (typeof currentActiveChapterFolder !== 'undefined' && currentActiveChapterFolder && typeof closeChapterTestsView === 'function') {
      closeChapterTestsView(false);
    }
    if (isClassChaptersGridOpen) {
      closeClassChaptersGrid(false);
    }

    isClass10SamplePapersOpen = true;
    class10OverviewSection.style.display = 'none';
    if (class10ChaptersSection) class10ChaptersSection.style.display = 'none';
    class10SamplePapersSection.style.display = 'block';

    const hubView = document.getElementById('samplePapersHubView');
    if (hubView) {
      hubView.style.setProperty('display', 'block', 'important');
      hubView.classList.remove('drilldown-hidden');
    }

    const drilldownView = document.getElementById('samplePaperDrilldownView');
    if (drilldownView) {
      drilldownView.style.setProperty('display', 'none', 'important');
      drilldownView.classList.add('drilldown-hidden');
    }

    const sampleGrid = document.getElementById('samplePapersGrid');
    if (sampleGrid) {
      sampleGrid.style.setProperty('display', 'grid', 'important');
      sampleGrid.classList.remove('drilldown-hidden', 'view-extra-large', 'view-large', 'view-content');
    }

    if (class10PageTitle) {
      class10PageTitle.textContent = 'CBSE-Class 10 Mathematics (NCERT Sample Papers)';
    }

    if (pushHistory) {
      try {
        history.pushState({ view: 'class10-sample-papers' }, '', '#sample-papers');
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeClass10SamplePapers(pushHistory = true) {
    if (!class10OverviewSection || !class10SamplePapersSection) return;

    if (activeSamplePaperFolder) {
      closeSamplePaperDrilldown(false);
    }

    isClass10SamplePapersOpen = false;
    class10SamplePapersSection.style.display = 'none';
    class10OverviewSection.style.display = 'block';

    const hubView = document.getElementById('samplePapersHubView');
    if (hubView) {
      hubView.style.setProperty('display', 'block', 'important');
      hubView.classList.remove('drilldown-hidden');
    }

    const drilldownView = document.getElementById('samplePaperDrilldownView');
    if (drilldownView) {
      drilldownView.style.setProperty('display', 'none', 'important');
      drilldownView.classList.add('drilldown-hidden');
    }

    if (class10PageTitle) {
      class10PageTitle.textContent = 'CBSE-Class 10 Mathematics';
    }

    if (pushHistory) {
      try {
        history.pushState({ view: 'overview' }, '', window.location.pathname);
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openSamplePaperDrilldown(folderKey, cardEl, pushHistory = true) {
    const sampleGrid = document.getElementById('samplePapersGrid');
    const hubView = document.getElementById('samplePapersHubView');
    if (!sampleGrid) return;

    const items = getChapterItems(folderKey, globalCatalog);
    if (!items || items.length === 0) return;

    activeSamplePaperFolder = folderKey;

    const title = cardEl?.querySelector('.resource-title')?.textContent?.trim() || 'NCERT Sample Paper';
    const desc = cardEl?.querySelector('.resource-desc')?.textContent?.trim() || 'Official sample question paper, marking scheme, and step-by-step solutions.';
    const code = cardEl?.querySelector('.resource-code')?.textContent?.trim() || 'SAMPLE-PAPER';
    const metaBadge = cardEl?.querySelector('.badge-standard')?.textContent?.trim() || '2026-27';

    let drilldownView = document.getElementById('samplePaperDrilldownView');
    if (!drilldownView) {
      drilldownView = document.createElement('div');
      drilldownView.id = 'samplePaperDrilldownView';
      drilldownView.className = 'chapter-tests-view-container container';
      const sampleSection = document.getElementById('class10SamplePapersSection');
      if (sampleSection) {
        sampleSection.appendChild(drilldownView);
      } else {
        sampleGrid.parentNode.insertBefore(drilldownView, sampleGrid);
      }
    }

    const currentViewMode = localStorage.getItem('mm_view_mode') || 'extra-large';

    drilldownView.innerHTML = `
      <div class="chapter-drilldown-header">
        <button type="button" class="btn-back-chapters" id="btnBackFromSampleDrilldown" title="Return to Sample Papers">
          <span>&larr;</span> Back to NCERT Sample Papers
        </button>
        <div class="drilldown-breadcrumbs">
          <a href="index.html">Home</a> &gt; 
          <a href="class-10.html" id="crumbClass10HomeFromSampleDrilldown">Class 10</a> &gt; 
          <span style="cursor: pointer; text-decoration: underline;" id="crumbSamplePapersHub">NCERT Sample Papers</span> &gt; 
          <span class="active-crumb">${title}</span>
        </div>
      </div>

      <div class="drilldown-toolbar-bar">
        <div class="drilldown-status-info">
          <span>Available Documents: <strong>${items.length}</strong> PDF file${items.length > 1 ? 's' : ''}</span>
        </div>
        <div class="view-mode-selector-wrap">
          <button type="button" class="view-mode-btn ${currentViewMode === 'extra-large' ? 'active' : ''}" data-view-mode="extra-large" title="Extra large icons">
            <span>⬜</span> Extra Large
          </button>
          <button type="button" class="view-mode-btn ${currentViewMode === 'large' ? 'active' : ''}" data-view-mode="large" title="Large icons">
            <span>🔲</span> Large
          </button>
          <button type="button" class="view-mode-btn ${currentViewMode === 'content' ? 'active' : ''}" data-view-mode="content" title="Content row view">
            <span>☰</span> Content
          </button>
        </div>
      </div>

      <div class="resources-grid chapter-tests-grid view-${currentViewMode}" id="samplePaperTestsGrid">
        ${items.map(it => {
          const safeUrl = encodeURI(it.path);
          const typeDesc = (it.type === 'solution')
            ? 'Official step-by-step verified solutions and marking scheme.'
            : 'Official sample question paper strictly based on CBSE/NCERT blueprint.';
          return `
            <div class="resource-card chapter-paper-card ${it.type}-card">
              <div>
                <div class="resource-meta">
                  <span class="resource-code">${it.code}</span>
                  <span class="resource-badge badge-${it.type === 'solution' ? 'solution' : 'standard'}">${it.badge}</span>
                </div>
                <h3 class="resource-title">${it.title}</h3>
                <p class="resource-desc">${typeDesc}</p>
              </div>
              <div class="resource-footer">
                <span class="resource-stats">${it.size ? it.size + ' • ' : ''}PDF</span>
                <div class="pdf-toggle-box">
                  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="pdf-toggle-btn btn-view" title="View PDF in browser without downloading">View PDF</a>
                  <span class="pdf-toggle-divider"></span>
                  <a href="${safeUrl}" download class="pdf-toggle-btn btn-download" title="Download to device">Download</a>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    drilldownView.querySelector('#btnBackFromSampleDrilldown').onclick = () => {
      closeSamplePaperDrilldown();
    };

    const crumbHub = drilldownView.querySelector('#crumbSamplePapersHub');
    if (crumbHub) {
      crumbHub.onclick = () => {
        closeSamplePaperDrilldown();
      };
    }

    const crumbHome = drilldownView.querySelector('#crumbClass10HomeFromSampleDrilldown');
    if (crumbHome) {
      crumbHome.onclick = (e) => {
        e.preventDefault();
        closeSamplePaperDrilldown(false);
        closeClass10SamplePapers();
      };
    }

    drilldownView.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.onclick = () => {
        const mode = btn.dataset.viewMode;
        const grid = document.getElementById('samplePaperTestsGrid');
        if (grid) {
          grid.className = `resources-grid chapter-tests-grid view-${mode}`;
          localStorage.setItem('mm_view_mode', mode);
          drilldownView.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      };
    });

    if (hubView) {
      hubView.style.setProperty('display', 'none', 'important');
      hubView.classList.add('drilldown-hidden');
    }
    if (sampleGrid) {
      sampleGrid.style.setProperty('display', 'none', 'important');
      sampleGrid.classList.add('drilldown-hidden');
    }
    drilldownView.style.setProperty('display', 'block', 'important');
    drilldownView.classList.remove('drilldown-hidden');

    const subSlug = folderKey.split('/').pop();
    if (pushHistory) {
      try {
        history.pushState({ view: 'sample-paper-drilldown', folderKey }, '', `#sample-papers/${subSlug}`);
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeSamplePaperDrilldown(pushHistory = true) {
    const sampleGrid = document.getElementById('samplePapersGrid');
    const hubView = document.getElementById('samplePapersHubView');
    const drilldownView = document.getElementById('samplePaperDrilldownView');

    activeSamplePaperFolder = null;
    if (drilldownView) {
      drilldownView.style.setProperty('display', 'none', 'important');
      drilldownView.classList.add('drilldown-hidden');
    }
    if (hubView) {
      hubView.style.setProperty('display', 'block', 'important');
      hubView.classList.remove('drilldown-hidden');
    }
    if (sampleGrid) {
      sampleGrid.style.setProperty('display', 'grid', 'important');
      sampleGrid.classList.remove('drilldown-hidden', 'view-extra-large', 'view-large', 'view-content');
    }

    if (pushHistory) {
      try {
        history.pushState({ view: 'class10-sample-papers' }, '', '#sample-papers');
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (btnBackFromSamplesToOverview) {
    btnBackFromSamplesToOverview.addEventListener('click', (e) => {
      e.preventDefault();
      closeClass10SamplePapers();
    });
  }

  if (crumbClass10HomeFromSamples) {
    crumbClass10HomeFromSamples.addEventListener('click', (e) => {
      e.preventDefault();
      closeClass10SamplePapers();
    });
  }

  // ==========================================================================
  // Class 8: In-Page Ganita Prakash Solutions View Switcher & Drilldown Engine
  // ==========================================================================
  const class8SolutionsSection = document.getElementById('class8SolutionsSection');
  const btnBackFromSolutionsToClass8Overview = document.getElementById('btnBackFromSolutionsToClass8Overview');
  const crumbClass8HomeFromSolutions = document.getElementById('crumbClass8HomeFromSolutions');
  let isClass8SolutionsOpen = false;

  function renderClass8SolutionsGrid(catalog) {
    const grid = document.getElementById('class8SolutionsGrid');
    const countEl = document.getElementById('class8SolutionsCountText');
    if (!grid) return;

    const items = getChapterItems('class-8/solutions', catalog || globalCatalog) || [];
    if (countEl) {
      countEl.innerHTML = `Available Documents: <strong>${items.length}</strong> PDF file${items.length === 1 ? '' : 's'}`;
    }

    const currentViewMode = localStorage.getItem('mm_view_mode') || 'extra-large';
    grid.className = `resources-grid chapter-tests-grid view-${currentViewMode}`;

    const toolbar = document.getElementById('class8SolutionsToolbar');
    if (toolbar) {
      toolbar.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.viewMode === currentViewMode);
      });
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem;">
          <p style="font-size: 1.25rem; font-weight: 600; color: var(--color-gold); margin-bottom: 0.5rem;">
            No Ganita Prakash solution PDFs found yet.
          </p>
          <p style="color: var(--color-text-muted); max-width: 500px; margin: 0 auto;">
            Add your solution PDF files into <code>assets/pdfs/class-8/solutions/</code> and run <code>update-pdfs.bat</code> to display them here automatically.
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items.map(it => {
      const safeUrl = encodeURI(it.path);
      return `
        <div class="resource-card chapter-paper-card" data-category="solution" style="cursor: default;">
          <div>
            <div class="resource-meta">
              <span class="resource-code">${it.code || 'CH-SOL'}</span>
              <span class="resource-badge badge-standard">${it.badge || 'NCERT Solution'}</span>
            </div>
            <h3 class="resource-title">${it.title}</h3>
            <p class="resource-desc">Official step-by-step verified solutions and textbook answers for Class 8 Ganita Prakash.</p>
          </div>
          <div class="resource-footer">
            <span class="resource-stats">${it.size ? `${it.size} • PDF` : 'PDF'}</span>
            <div class="pdf-toggle-box">
              <a href="${safeUrl}" target="_blank" class="pdf-toggle-btn btn-view" data-pdf-url="${safeUrl}" data-pdf-title="${it.title.replace(/"/g, '&quot;')}" title="View PDF in browser without downloading">View PDF</a>
              <span class="pdf-toggle-divider"></span>
              <a href="${safeUrl}" download class="pdf-toggle-btn btn-download" title="Download to device">Download</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function openClass8Solutions(pushHistory = true) {
    const class8Overview = document.getElementById('class8OverviewSection');
    const class8Solutions = document.getElementById('class8SolutionsSection');
    const class8Chapters = document.getElementById('class8ChaptersSection');
    const class8Title = document.getElementById('class8PageTitle');
    if (!class8Overview || !class8Solutions) return;

    if (typeof isFormulaHubOpen !== 'undefined' && isFormulaHubOpen && typeof closeFormulaHubView === 'function') {
      closeFormulaHubView(false);
    }
    if (typeof currentActiveChapterFolder !== 'undefined' && currentActiveChapterFolder && typeof closeChapterTestsView === 'function') {
      closeChapterTestsView(false);
    }
    if (isClassChaptersGridOpen) {
      closeClassChaptersGrid(false);
    }

    isClass8SolutionsOpen = true;
    class8Overview.style.display = 'none';
    if (class8Chapters) class8Chapters.style.display = 'none';
    class8Solutions.style.display = 'block';

    if (class8Title) {
      class8Title.textContent = 'Class 8 Mathematics (Ganita Prakash Solutions)';
    }

    renderClass8SolutionsGrid(globalCatalog);

    if (pushHistory) {
      try {
        history.pushState({ view: 'class8-solutions' }, '', '#solutions');
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeClass8Solutions(pushHistory = true) {
    const class8Overview = document.getElementById('class8OverviewSection');
    const class8Solutions = document.getElementById('class8SolutionsSection');
    const class8Title = document.getElementById('class8PageTitle');
    if (!class8Overview || !class8Solutions) return;

    isClass8SolutionsOpen = false;
    class8Solutions.style.display = 'none';
    class8Overview.style.display = 'block';

    if (class8Title) {
      class8Title.textContent = 'Class 8 Mathematics';
    }

    if (pushHistory) {
      try {
        history.pushState({ view: 'overview' }, '', window.location.pathname);
      } catch (e) {}
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (btnBackFromSolutionsToClass8Overview) {
    btnBackFromSolutionsToClass8Overview.addEventListener('click', (e) => {
      e.preventDefault();
      closeClass8Solutions();
    });
  }

  if (crumbClass8HomeFromSolutions) {
    crumbClass8HomeFromSolutions.addEventListener('click', (e) => {
      e.preventDefault();
      closeClass8Solutions();
    });
  }

  const class8SolutionsToolbar = document.getElementById('class8SolutionsToolbar');
  if (class8SolutionsToolbar) {
    class8SolutionsToolbar.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.viewMode;
        const grid = document.getElementById('class8SolutionsGrid');
        if (grid) {
          grid.className = `resources-grid chapter-tests-grid view-${mode}`;
          localStorage.setItem('mm_view_mode', mode);
          class8SolutionsToolbar.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }

  function updateClass8SolutionsBadgeCounts(catalog) {
    if (!catalog) return;
    const card = document.getElementById('cardOpenClass8Solutions');
    if (!card) return;
    const items = getChapterItems('class-8/solutions', catalog);
    const metaContainer = card.querySelector('.resource-meta');
    if (metaContainer && items && items.length > 0) {
      let countBadge = metaContainer.querySelector('.badge-tests');
      if (!countBadge) {
        countBadge = document.createElement('span');
        countBadge.className = 'resource-badge badge-tests';
        metaContainer.appendChild(countBadge);
      }
      countBadge.textContent = `[ ${items.length} PDF${items.length > 1 ? 's' : ''} Available ]`;
      const stats = card.querySelector('.resource-stats');
      if (stats) {
        stats.textContent = `${items.length} Chapter${items.length > 1 ? 's' : ''}`;
      }
    }
  }

  function updateSamplePaperBadgeCounts(catalog) {
    if (!catalog) return;
    ['cardSampleOfficial', 'cardSamplePractice'].forEach(cardId => {
      const card = document.getElementById(cardId);
      if (!card) return;
      const folderKey = card.getAttribute('data-folder');
      if (!folderKey) return;
      const items = getChapterItems(folderKey, catalog);
      const metaContainer = card.querySelector('.resource-meta');
      if (metaContainer && items && items.length > 0) {
        let countBadge = metaContainer.querySelector('.badge-tests');
        if (!countBadge) {
          countBadge = document.createElement('span');
          countBadge.className = 'resource-badge badge-tests';
          metaContainer.appendChild(countBadge);
        }
        countBadge.textContent = `[ ${items.length} PDF${items.length > 1 ? 's' : ''} Available ]`;
      }
    });
  }

  const allClassTriggerSelectors = classConfigs.map(c => c.triggerSelectors).join(', ') + ', .btn-open-dir[class*="btn-open-class"], .has-chapter-drilldown';
  document.addEventListener('click', (e) => {
    // 1. Sample Papers sub-drilldown trigger ("Open Sample Paper" on either card)
    const sampleItemTrigger = e.target.closest('.btn-open-sample-drilldown, .has-sample-item-drilldown');
    if (sampleItemTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const card = sampleItemTrigger.closest('.resource-card') || sampleItemTrigger;
      const folder = card.getAttribute('data-folder');
      if (folder) {
        openSamplePaperDrilldown(folder, card);
      }
      return;
    }

    // 2. Sample Papers hub trigger (Class 10 Overview card)
    const sampleTrigger = e.target.closest('#btnOpenClass10Samples, #cardOpenSamplePapers, .btn-open-class10-samples, .has-sample-drilldown');
    if (sampleTrigger) {
      e.preventDefault();
      e.stopPropagation();
      openClass10SamplePapers();
      return;
    }

    // 3. Class 8 Solutions trigger (Class 8 Overview card)
    const solutionsTrigger = e.target.closest('#btnOpenClass8Solutions, #cardOpenClass8Solutions, .btn-open-class8-solutions, .has-solutions-drilldown');
    if (solutionsTrigger) {
      e.preventDefault();
      e.stopPropagation();
      openClass8Solutions();
      return;
    }

    if (!activeClassConfig) return;
    const trigger = e.target.closest(allClassTriggerSelectors);
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      openClassChaptersGrid();
      return;
    }
  }, true);

  function checkUrlHashForClassChapters() {
    if (!activeClassConfig) return;
    const hash = window.location.hash.replace('#', '').trim();
    if (hash.startsWith('sample-papers/')) {
      const sub = hash.replace('sample-papers/', '');
      openClass10SamplePapers(false);
      const targetCard = document.querySelector(`.resource-card[data-folder$="${sub}"]`);
      if (targetCard) {
        const folder = targetCard.getAttribute('data-folder');
        openSamplePaperDrilldown(folder, targetCard, false);
      }
    } else if (hash === 'sample-papers') {
      if (activeSamplePaperFolder) closeSamplePaperDrilldown(false);
      openClass10SamplePapers(false);
    } else if (isClass10SamplePapersOpen && !hash.startsWith('sample-papers')) {
      closeClass10SamplePapers(false);
    } else if (hash === 'solutions') {
      if (isClassChaptersGridOpen) closeClassChaptersGrid(false);
      openClass8Solutions(false);
    } else if (isClass8SolutionsOpen && hash !== 'solutions') {
      closeClass8Solutions(false);
    } else if (hash === 'chapters') {
      if (isClass10SamplePapersOpen) closeClass10SamplePapers(false);
      if (isClass8SolutionsOpen) closeClass8Solutions(false);
      openClassChaptersGrid(false);
    } else if (hash.startsWith('ch-')) {
      if (isClass10SamplePapersOpen) closeClass10SamplePapers(false);
      if (isClass8SolutionsOpen) closeClass8Solutions(false);
      openClassChaptersGrid(false);
    } else if (isClassChaptersGridOpen && hash !== 'chapters' && !hash.startsWith('ch-') && hash !== 'formulas' && !hash.startsWith('sample-papers') && hash !== 'solutions') {
      closeClassChaptersGrid(false);
    }
  }
  const checkUrlHashForClass10Chapters = checkUrlHashForClassChapters;

  window.addEventListener('hashchange', checkUrlHashForClassChapters);

  function loadClass10Formulas() {
    if (class10FormulasData) return Promise.resolve(class10FormulasData);
    return fetch('assets/data/class10-formulas.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        class10FormulasData = data;
        return data;
      })
      .catch(err => {
        console.error('Failed to load class10-formulas.json:', err);
        return [];
      });
  }

  function openFormulaHubView(pushHistory = true) {
    const overviewSection = document.getElementById('class10OverviewSection');
    const chaptersSection = document.getElementById('class10ChaptersSection');
    const samplePapersSection = document.getElementById('class10SamplePapersSection');
    const pageTitle = document.getElementById('class10PageTitle');
    const resourcesGrid = document.getElementById('resourcesGrid');

    loadClass10Formulas().then(chapters => {
      if (!chapters || chapters.length === 0) return;

      isFormulaHubOpen = true;

      // Close other sub-views if open
      if (typeof closeChapterTestsView === 'function' && typeof currentActiveChapterFolder !== 'undefined' && currentActiveChapterFolder) {
        closeChapterTestsView(false);
      }
      if (typeof isClassChaptersGridOpen !== 'undefined' && isClassChaptersGridOpen && typeof closeClassChaptersGrid === 'function') {
        closeClassChaptersGrid(false);
      }
      if (typeof isClass10SamplePapersOpen !== 'undefined' && isClass10SamplePapersOpen && typeof closeClass10SamplePapers === 'function') {
        closeClass10SamplePapers(false);
      }

      // Hide other Class 10 view sections completely
      if (overviewSection) overviewSection.style.display = 'none';
      if (chaptersSection) chaptersSection.style.display = 'none';
      if (samplePapersSection) samplePapersSection.style.display = 'none';

      let formulaView = document.getElementById('formulaHubView');
      if (!formulaView) {
        formulaView = document.createElement('div');
        formulaView.id = 'formulaHubView';
        formulaView.className = 'chapter-tests-view-container container formula-drilldown-container';
        if (overviewSection && overviewSection.parentNode) {
          overviewSection.parentNode.insertBefore(formulaView, overviewSection.nextSibling);
        } else if (resourcesGrid && resourcesGrid.parentNode) {
          resourcesGrid.parentNode.insertBefore(formulaView, resourcesGrid);
        } else {
          document.body.appendChild(formulaView);
        }
      }

      const currentViewMode = localStorage.getItem('mm_view_mode') || 'extra-large';

      formulaView.innerHTML = `
        <div class="chapter-drilldown-header">
          <button type="button" class="btn-back-chapters" id="btnBackFromFormulas" title="Return to Class 10 Material">
            <span>&larr;</span> Back to Class 10 Material
          </button>
          <div class="drilldown-breadcrumbs">
            <a href="index.html">Home</a> &gt; 
            <a href="class-10.html" id="crumbClass10">Class 10</a> &gt; 
            <span class="active-crumb">Formula Sheets (All 14 Chapters)</span>
          </div>
        </div>

        <div class="chapter-drilldown-banner">
          <div class="resource-meta" style="margin-bottom: 0.5rem;">
            <span class="resource-code">10TH-FORMULAS</span>
            <span class="resource-badge badge-formula">Quick Revision Handbooks</span>
            <span class="resource-badge badge-tests" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border-color: rgba(245, 158, 11, 0.4);">
              [ 14 Chapters Available ]
            </span>
          </div>
          <h2 class="drilldown-title">Complete Class 10 Formula Cheat Sheets</h2>
          <p class="drilldown-desc">
            Chapter-wise comprehensive mathematical handbooks covering every definition, theorem, algebraic formula, trigonometric identity, and mensuration relation for board exam revision.
          </p>
        </div>

        <div class="drilldown-toolbar-bar">
          <div class="search-box" style="flex: 1; max-width: 380px;">
            <span class="search-icon">🔍</span>
            <input type="text" id="formulaChapterSearch" class="search-input" placeholder="Search chapter (e.g. Real Numbers, Circles, Ch 8)...">
          </div>
          <div class="view-mode-selector-wrap">
            <button type="button" class="view-mode-btn" data-view-mode="extra-large" title="Extra large icons">
              <span>⬜</span> Extra Large
            </button>
            <button type="button" class="view-mode-btn" data-view-mode="large" title="Large icons">
              <span>🔲</span> Large
            </button>
            <button type="button" class="view-mode-btn" data-view-mode="content" title="Content row view">
              <span>☰</span> Content
            </button>
          </div>
        </div>

        <div class="resources-grid chapter-tests-grid view-${currentViewMode}" id="formulaChaptersGrid">
          ${chapters.map((ch, idx) => {
            const safePdf = encodeURI(ch.file);
            return `
              <div class="resource-card chapter-paper-card material-card formula-chapter-card" data-title="${ch.title.toLowerCase()}" data-num="${ch.num.toLowerCase()}" data-desc="${ch.desc.toLowerCase()}">
                <div>
                  <div class="resource-meta">
                    <span class="resource-code">CH-${String(idx + 1).padStart(2, '0')}</span>
                    <span class="resource-badge badge-formula">${ch.num}</span>
                  </div>
                  <h3 class="resource-title">${ch.title}</h3>
                  <p class="resource-desc">${ch.desc}</p>
                </div>
                <div class="resource-footer">
                  <span class="resource-stats">Formula Handbook • PDF</span>
                  <div class="pdf-toggle-box">
                    <a href="${safePdf}" target="_blank" rel="noopener noreferrer" class="pdf-toggle-btn btn-view" title="View formula booklet in browser">View PDF</a>
                    <span class="pdf-toggle-divider"></span>
                    <a href="${safePdf}" download class="pdf-toggle-btn btn-download" title="Download formula booklet">Download</a>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div id="noFormulaResults" style="display: none; text-align: center; padding: 3rem 1rem; color: var(--color-text-muted);">
          <p style="font-size: 1.15rem; font-weight: 600;">No formula handbooks match your query.</p>
        </div>
      `;

      // Hide main resources grid & main filter section if present
      if (resourcesGrid) {
        resourcesGrid.classList.add('drilldown-hidden');
        resourcesGrid.style.display = 'none';
      }

      const filterSection = document.querySelector('.filter-section');
      if (filterSection) {
        filterSection.classList.add('drilldown-hidden');
        filterSection.style.display = 'none';
      }

      formulaView.style.setProperty('display', 'block', 'important');
      formulaView.classList.remove('drilldown-hidden');

      if (pageTitle) {
        pageTitle.textContent = 'CBSE-Class 10 Mathematics (Formula Handbooks)';
      }

      // Attach back button
      const btnBack = document.getElementById('btnBackFromFormulas');
      if (btnBack) {
        btnBack.onclick = (e) => {
          e.preventDefault();
          closeFormulaHubView();
        };
      }
      const crumb10 = document.getElementById('crumbClass10');
      if (crumb10) {
        crumb10.onclick = (e) => {
          e.preventDefault();
          closeFormulaHubView();
        };
      }

      // Live search filter inside formula hub
      const formulaSearchInput = document.getElementById('formulaChapterSearch');
      if (formulaSearchInput) {
        formulaSearchInput.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase().trim();
          const cards = formulaView.querySelectorAll('.formula-chapter-card');
          let visible = 0;
          cards.forEach(card => {
            const title = card.getAttribute('data-title') || '';
            const num = card.getAttribute('data-num') || '';
            const desc = card.getAttribute('data-desc') || '';
            if (!q || title.includes(q) || num.includes(q) || desc.includes(q)) {
              card.classList.remove('is-hidden');
              card.style.display = '';
              visible++;
            } else {
              card.classList.add('is-hidden');
              card.style.display = 'none';
            }
          });
          const noRes = document.getElementById('noFormulaResults');
          if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
        });
      }

      // View mode buttons inside formula hub
      formulaView.querySelectorAll('.view-mode-btn').forEach(btn => {
        const mode = btn.getAttribute('data-view-mode');
        if (mode === currentViewMode) btn.classList.add('active');
        btn.onclick = () => {
          if (typeof applyViewMode === 'function') {
            applyViewMode(mode);
          } else {
            const grid = document.getElementById('formulaChaptersGrid');
            if (grid) {
              grid.classList.remove('view-extra-large', 'view-large', 'view-content');
              grid.classList.add('view-' + mode);
            }
          }
        };
      });

      if (pushHistory) {
        try {
          history.pushState({ view: 'formulas' }, '', '#formulas');
        } catch (e) {}
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function closeFormulaHubView(pushHistory = true) {
    const formulaView = document.getElementById('formulaHubView');
    const overviewSection = document.getElementById('class10OverviewSection');
    const chaptersSection = document.getElementById('class10ChaptersSection');
    const samplePapersSection = document.getElementById('class10SamplePapersSection');
    const pageTitle = document.getElementById('class10PageTitle');
    const resourcesGrid = document.getElementById('resourcesGrid');
    const filterSection = document.querySelector('.filter-section');

    if (formulaView) {
      formulaView.style.setProperty('display', 'none', 'important');
      formulaView.classList.add('drilldown-hidden');
    }
    if (overviewSection) {
      overviewSection.style.removeProperty('display');
      overviewSection.style.display = 'block';
    }
    if (chaptersSection) chaptersSection.style.display = 'none';
    if (samplePapersSection) samplePapersSection.style.display = 'none';

    if (resourcesGrid) {
      resourcesGrid.classList.remove('drilldown-hidden');
      resourcesGrid.style.removeProperty('display');
    }
    if (filterSection) {
      filterSection.classList.remove('drilldown-hidden');
      filterSection.style.removeProperty('display');
    }

    if (pageTitle) {
      pageTitle.textContent = 'CBSE-Class 10 Mathematics';
    }

    isFormulaHubOpen = false;

    if (pushHistory) {
      try {
        history.pushState({ view: 'overview' }, '', window.location.pathname);
      } catch (e) {}
    }

    const formulaCard = document.getElementById('class10FormulaCard');
    if (formulaCard) {
      formulaCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Handle formula card clicks
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#btnOpenFormulaHub, .btn-open-formula-hub');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      openFormulaHubView();
      return;
    }

    const card = e.target.closest('#class10FormulaCard, .has-formula-drilldown');
    if (card && !e.target.closest('a, button')) {
      e.preventDefault();
      openFormulaHubView();
    }
  });

  // Check URL hash for #formulas
  function checkUrlHashForFormulas() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash === 'formulas') {
      openFormulaHubView(false);
    } else if (isFormulaHubOpen && hash !== 'formulas') {
      closeFormulaHubView(false);
    }
  }

  window.addEventListener('hashchange', checkUrlHashForFormulas);

    function checkUrlHashForChapterTests() {

    const hash = window.location.hash.replace('#', '').trim();

    if (!hash) {

      if (currentActiveChapterFolder) {

        closeChapterTestsView(false);

      }

      return;

    }

    const card = document.querySelector(`.resource-card[data-folder$="/${hash}"]`);

    if (card) {

      const folderKey = card.getAttribute('data-folder');

      openChapterTestsView(folderKey, card, false);

    }

  }



  window.addEventListener('hashchange', checkUrlHashForChapterTests);



  function bindCatalogToCards(catalog) {

    document.querySelectorAll('.resource-card[data-folder]').forEach(el => {

      const folderKey = el.getAttribute('data-folder');

      if (!folderKey) return;



      const items = getChapterItems(folderKey, catalog);

      const testItems = items.filter(it => it.type === 'test');

      const isClassTestChapter = /^class-\d+\/ch-\d+$/i.test(folderKey);



      if (isClassTestChapter) {

        adaptCardForChapterTests(el, folderKey, items, testItems.length);

      } else if (catalog && catalog[folderKey]) {

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



    if (typeof updateSamplePaperBadgeCounts === 'function') {
      updateSamplePaperBadgeCounts(catalog);
    }
    if (typeof updateClass8SolutionsBadgeCounts === 'function') {
      updateClass8SolutionsBadgeCounts(catalog);
    }

    checkUrlHashForChapterTests();
    checkUrlHashForFormulas();
    checkUrlHashForClass10Chapters();

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

        card.classList.remove('is-hidden');

        card.style.display = '';

        visibleCount++;

      } else {

        card.classList.add('is-hidden');

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



  // 3b. Windows File Explorer-Style View Mode Engine (Extra Large, Large, Content)

  const savedViewMode = localStorage.getItem('mm_view_mode') || 'extra-large';



  function applyViewMode(mode) {
    const validModes = ['extra-large', 'large', 'content'];
    const chosen = validModes.includes(mode) ? mode : 'extra-large';

    // Target any resources grids or folder/paper grids across all views & overview dashboards (excluding locked showcase grids)
    const grids = document.querySelectorAll('.resources-grid:not(#samplePapersGrid), #resourcesGrid, #foldersGrid, #papersGrid, #inpageChaptersGrid, #chapterTestsGrid, #samplePaperTestsGrid, [id$="DashboardGrid"]');
    grids.forEach(grid => {
      grid.classList.remove('view-extra-large', 'view-large', 'view-content');
      grid.classList.add('view-' + chosen);
    });

    const sampleGrid = document.getElementById('samplePapersGrid');
    if (sampleGrid) {
      sampleGrid.classList.remove('view-extra-large', 'view-large', 'view-content');
    }

    // Update all view mode buttons on the page
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      if (btn.getAttribute('data-view-mode') === chosen) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    localStorage.setItem('mm_view_mode', chosen);
  }

  // Inject View Mode Selector into filter bars / toolbars if not already manually placed
  function injectViewModeSelectors() {
    const containers = document.querySelectorAll('.filter-bar, .resources-toolbar, .inpage-chapter-toolbar .filter-bar, .mode-indicator-bar');
    containers.forEach(bar => {
      if (!bar.querySelector('.view-mode-selector-wrap')) {
        const wrapRow = document.createElement('div');
        wrapRow.className = 'filter-bar-view-mode-row';
        wrapRow.innerHTML = `
          <div class="view-mode-selector-wrap">
            <button type="button" class="view-mode-btn" data-view-mode="extra-large" title="Extra large icons">
              <span>■</span> Extra Large
            </button>
            <button type="button" class="view-mode-btn" data-view-mode="large" title="Large icons">
              <span>■</span> Large
            </button>
            <button type="button" class="view-mode-btn" data-view-mode="content" title="Content row view">
              <span>☰</span> Content
            </button>
          </div>
        `;
        bar.appendChild(wrapRow);
      }
    });
  }



  // Listen to clicks on view-mode buttons

  document.addEventListener('click', (e) => {

    const btn = e.target.closest('.view-mode-btn');

    if (btn) {

      const mode = btn.getAttribute('data-view-mode');

      if (mode) {

        applyViewMode(mode);

      }

    }

  });



  injectViewModeSelectors();

  applyViewMode(savedViewMode);



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

        card.classList.remove('is-hidden');

        card.style.display = '';

        visible++;

      } else {

        card.classList.add('is-hidden');

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

  // Desktop keyboard convenience: Escape key returns to overview
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (inpageChapterSection && inpageChapterSection.style.display === 'block') {
        closeInpageDirectory();
      } else if (typeof isClass8SolutionsOpen !== 'undefined' && isClass8SolutionsOpen) {
        closeClass8Solutions();
      }
    }
  });



  // Check URL Hash on Load

  function checkUrlHashForDirectory() {

    const hash = window.location.hash.replace('#', '').trim();

    if (hash && chaptersDatabase[hash]) {

      openInpageDirectory(hash, false);

    }

  }



  // Handle browser back/forward buttons

  window.addEventListener('popstate', (e) => {

    // 1. Chapter Tests Drilldown View popstate

    if (currentActiveChapterFolder && (!e.state || e.state.view !== 'chapter-tests')) {

      closeChapterTestsView(false);

      return;

    } else if (e.state && e.state.view === 'chapter-tests' && e.state.folderKey) {

      const card = document.querySelector(`.resource-card[data-folder="${e.state.folderKey}"]`);

      if (card) {

        openChapterTestsView(e.state.folderKey, card, false);

        return;

      }

    }



    // 2. Books In-Page Directory Switcher popstate

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

    // 3. Multi-Class In-Page Chapters Grid popstate
    if (activeClassConfig) {
      const targetView = 'class' + activeClassConfig.key + '-chapters';
      if (e.state && (e.state.view === targetView || e.state.view === 'class10-chapters')) {
        openClassChaptersGrid(false);
      } else if (isClassChaptersGridOpen && (!e.state || (e.state.view !== targetView && e.state.view !== 'class10-chapters'))) {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash !== 'chapters' && !hash.startsWith('ch-')) {
          closeClassChaptersGrid(false);
        }
      }
    }

    // 4. Class 10 In-Page Sample Papers popstate
    if (class10SamplePapersSection) {
      if (e.state && e.state.view === 'sample-paper-drilldown') {
        openClass10SamplePapers(false);
        const targetCard = document.querySelector(`.resource-card[data-folder="${e.state.folderKey}"]`);
        openSamplePaperDrilldown(e.state.folderKey, targetCard, false);
      } else if (e.state && e.state.view === 'class10-sample-papers') {
        if (activeSamplePaperFolder) closeSamplePaperDrilldown(false);
        openClass10SamplePapers(false);
      } else if (isClass10SamplePapersOpen && (!e.state || (e.state.view !== 'class10-sample-papers' && e.state.view !== 'sample-paper-drilldown'))) {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash !== 'sample-papers' && !hash.startsWith('sample-papers/')) {
          if (activeSamplePaperFolder) closeSamplePaperDrilldown(false);
          closeClass10SamplePapers(false);
        }
      }
    }

    // 5. Class 8 In-Page Solutions popstate
    if (class8SolutionsSection) {
      if (e.state && e.state.view === 'class8-solutions') {
        openClass8Solutions(false);
      } else if (isClass8SolutionsOpen && (!e.state || e.state.view !== 'class8-solutions')) {
        const hash = window.location.hash.replace('#', '').trim();
        if (hash !== 'solutions') {
          closeClass8Solutions(false);
        }
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
      if (!href || href === '#' || href.startsWith('javascript:')) {
        e.preventDefault();
        return;
      }
      // Ensure target="_blank" and rel="noopener noreferrer" to open directly in a new tab with native browser viewer
      if (!viewBtn.getAttribute('target')) {
        viewBtn.setAttribute('target', '_blank');
      }
      if (!viewBtn.getAttribute('rel')) {
        viewBtn.setAttribute('rel', 'noopener noreferrer');
      }
      // Native browser event proceeds directly: instant loading with native C++ PDF engine
    }
  });

});

