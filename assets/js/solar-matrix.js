/**
 * Maths Manthan | Solar Matrix Harmonic Tunnel Animation
 * GPU-efficient, 60fps harmonic dot lattice with interactive Mouse Warp Field.
 * Dual-Theme Reactive Engine (Dark & Light Mode).
 *
 * SUPPORTED MODES:
 * 1. 'hybrid'    -> Full-page dynamic continuous flow (Scroll-reactive 60fps ambient background).
 * 2. 'hero-only' -> Original localized animation confined strictly to the hero section.
 *
 * REVERSIBILITY:
 * - To revert to hero-only: Change DEFAULT_FLOW_MODE below to 'hero-only', OR change
 *   <body data-bg-flow="hybrid"> to <body data-bg-flow="hero-only"> in index.html.
 * - An exact 1:1 original backup is also preserved at 'assets/js/solar-matrix.original.js'.
 */

(function () {
  // MASTER CONFIGURATION
  const DEFAULT_FLOW_MODE = "hybrid"; // Options: 'hybrid' | 'hero-only'

  function getFlowMode() {
    if (document.body) {
      const attr = document.body.getAttribute("data-bg-flow");
      if (attr === "hero-only") return "hero-only";
      if (attr === "hybrid") return "hybrid";
    }
    return DEFAULT_FLOW_MODE;
  }

  const flowMode = getFlowMode();
  const isHybrid = flowMode === "hybrid";

  // SETTINGS (from configuration)
  const SETTINGS = {
    symmetry: 3,           // Harmonic Symmetry: 3-Fold
    zoomSpeed: 0.1,        // Tunnel Depth Speed: 0.1x
    twistRate: 3.0,        // Rotational Swirl: 3.0x
    morphAmplitude: 0.20,  // Morph Depth (Shape Shift): 0.20
    morphSpeed: 0.0001,    // Breathing rate between circle & triangle
    rotationSpeed: 0.0001, // Baseline spin speed
    numRings: 52,          // Concentric tunnel density
    pointsPerRing: 64,     // Dots per ring
    baseDotSize: 1.9,      // Outer dot radius

    // Solar Mood Palette (Dark Mode)
    coreGlowDark: "rgba(245, 158, 11, 0.32)", // Warm solar amber core
    midGlowDark: "rgba(180, 83, 9, 0.12)",
    dotHueDark: 38,                           // Solar gold/amber hue

    // Solar Mood Palette (Light Mode: Oxford Dark Navy Blue Core)
    coreGlowLight: "rgba(11, 37, 69, 0.42)",  // Majestic Dark Navy Blue core
    midGlowLight: "rgba(15, 52, 96, 0.18)",   // Navy mid-glow aura
    dotColorLight: "rgba(11, 37, 69, ",       // Base solid navy prefix
    dotHueLightCore: 215,                     // Oxford Navy hue for core
    dotHueLightRim: 38,                       // Solar gold hue for outer rim

    // Interactive Warp Field
    warpRadius: 130,       // Distance of mouse influence in pixels
    warpStrength: 25,      // Max repulsion/attraction displacement
  };

  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const heroSection = document.querySelector(".hero-section");

  let width = 0;
  let height = 0;
  let maxRadius = 0;
  let animationFrameId = null;
  let isVisible = true;

  // Track Theme Changes Dynamically
  let currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  window.addEventListener("mm-theme-change", (e) => {
    currentTheme = e.detail.theme;
  });

  // Mouse & Touch Tracking with Smooth Inertia
  let mouse = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    isHovering: false,
    activeMultiplier: 0
  };

  // Scroll tracking for Hybrid Mode
  let scrollY = window.scrollY || window.pageYOffset || 0;
  let smoothScrollY = scrollY;
  let scrollVelocity = 0;
  let lastScrollY = scrollY;
  let lastScrollTime = performance.now();

  function onScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
    const now = performance.now();
    const dt = Math.max(1, now - lastScrollTime);
    scrollVelocity = Math.abs(scrollY - lastScrollY) / dt * 1000;
    lastScrollY = scrollY;
    lastScrollTime = now;
  }

  if (isHybrid) {
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (isHybrid) {
      width = window.innerWidth;
      height = window.innerHeight;
    } else if (heroSection) {
      const rect = heroSection.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    } else {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    maxRadius = Math.hypot(width, height) * (isHybrid ? 0.60 : 0.55);
  }

  window.addEventListener("resize", resize);
  resize();

  // Mouse & Touch Event Listeners
  if (isHybrid) {
    // Hybrid Mode: Viewport-wide interaction
    window.addEventListener("mousemove", (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isHovering = true;
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      mouse.isHovering = false;
    });

    window.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.isHovering = true;
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      mouse.isHovering = false;
    });
  } else if (heroSection) {
    // Hero-Only Mode: Strictly bounded to hero section
    heroSection.addEventListener("mousemove", (e) => {
      const rect = heroSection.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isHovering = true;
    });

    heroSection.addEventListener("mouseleave", () => {
      mouse.isHovering = false;
    });

    heroSection.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        const rect = heroSection.getBoundingClientRect();
        mouse.targetX = e.touches[0].clientX - rect.left;
        mouse.targetY = e.touches[0].clientY - rect.top;
        mouse.isHovering = true;
      }
    }, { passive: true });

    heroSection.addEventListener("touchend", () => {
      mouse.isHovering = false;
    });
  }

  // Text Exclusion Zones (Fade near text boundary)
  let textZones = [];
  let lastZoneScan = 0;

  function updateTextZones() {
    const now = performance.now();
    if (now - lastZoneScan < 300 && textZones.length > 0) return;
    lastZoneScan = now;

    const selectors = [
      '.section-header',
      '.hero-title',
      '.hero-lead',
      '.hero-highlights',
      '.hero-pill',
      '[data-fade-zone]'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const zones = [];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (el.offsetParent === null && window.getComputedStyle(el).display === 'none') continue;
      const rect = el.getBoundingClientRect();
      if (rect.bottom >= -100 && rect.top <= vh + 100 && rect.right >= -100 && rect.left <= vw + 100) {
        zones.push({
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom
        });
      }
    }
    textZones = zones;
  }

  window.addEventListener('scroll', () => { lastZoneScan = 0; }, { passive: true });

  const FADE_BUFFER = 50; // 50px soft boundary cushion

  function getSolarOcclusionFactor(px, py) {
    if (!textZones.length) return 1.0;
    for (let i = 0; i < textZones.length; i++) {
      const z = textZones[i];
      if (px < z.left - FADE_BUFFER || px > z.right + FADE_BUFFER ||
          py < z.top - FADE_BUFFER || py > z.bottom + FADE_BUFFER) {
        continue;
      }
      const dx = Math.max(z.left - px, 0, px - z.right);
      const dy = Math.max(z.top - py, 0, py - z.bottom);
      const dist = Math.hypot(dx, dy);
      if (dist <= 0) return 0;
      if (dist < FADE_BUFFER) {
        return Math.sin((dist / FADE_BUFFER) * (Math.PI * 0.5));
      }
    }
    return 1.0;
  }

  let time = 0;
  let lastTimestamp = performance.now();

  function render(timestamp) {
    if (!isVisible) return;

    updateTextZones();

    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;
    time += dt;

    const isDark = currentTheme === "dark";

    // Smooth Mouse Coordinates & Interaction Multiplier
    if (mouse.isHovering) {
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;
      mouse.activeMultiplier += (1 - mouse.activeMultiplier) * 0.08;
    } else {
      mouse.activeMultiplier += (0 - mouse.activeMultiplier) * 0.05;
    }

    // Decay scroll velocity smoothly
    scrollVelocity *= 0.92;

    // Smooth scroll position for hybrid mode
    if (isHybrid) {
      smoothScrollY += (scrollY - smoothScrollY) * 0.08;
    }

    // 1. Base Fill (Dark Void or Light Parchment)
    ctx.fillStyle = isDark ? "#07080b" : "#fdfbf7";
    ctx.fillRect(0, 0, width, height);

    // Scroll progress calculations (Hybrid Mode)
    let heroScrollProgress = 0;
    let scrollDim = 1.0;
    let scrollSpeedBonus = 0;

    if (isHybrid) {
      const heroHeight = heroSection ? heroSection.offsetHeight : 700;
      heroScrollProgress = Math.min(1, Math.max(0, smoothScrollY / heroHeight));

      // Graceful dimming when scrolling into reading sections (preserves 100% text readability)
      scrollDim = 1 - (heroScrollProgress * 0.28);

      // Subtle dynamic acceleration during active scrolling
      scrollSpeedBonus = Math.min(0.08, scrollVelocity * 0.00008);
    }

    // Center harmonic anchor
    const isMobile = width < 768;
    const baseCx = isMobile ? width / 2 : width * 0.48;
    const baseCy = height / 2;

    // In hybrid mode, anchor shifts subtly with scroll for a gentle vertical parallax
    const anchorY = isHybrid 
      ? baseCy + ((smoothScrollY * 0.10) % (height * 0.4)) * 0.35 
      : baseCy;

    const pullStrength = 0.05 * mouse.activeMultiplier;
    const cx = baseCx + (mouse.x - baseCx) * pullStrength;
    const cy = anchorY + (mouse.y - anchorY) * pullStrength;

    // 2. Solar Amber / Oxford Navy Central Radial Aura
    const auraRadius = isHybrid 
      ? maxRadius * (0.58 + heroScrollProgress * 0.22) 
      : maxRadius * 0.58;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraRadius);
    const coreAlphaMul = isHybrid ? (1 - heroScrollProgress * 0.25) : 1;

    if (isDark) {
      glow.addColorStop(0, `rgba(245, 158, 11, ${0.32 * coreAlphaMul})`);
      glow.addColorStop(0.5, `rgba(180, 83, 9, ${0.12 * coreAlphaMul})`);
      glow.addColorStop(1, "rgba(7, 8, 11, 0)");
    } else {
      // Light Mode: Soft delicate ambient core glow (non-intrusive)
      glow.addColorStop(0, `rgba(11, 37, 69, ${0.16 * coreAlphaMul})`);
      glow.addColorStop(0.45, `rgba(15, 52, 96, ${0.06 * coreAlphaMul})`);
      glow.addColorStop(0.85, "rgba(10, 29, 55, 0.01)");
      glow.addColorStop(1, "rgba(253, 251, 247, 0)");
    }
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Optional Cursor Aura Spotlight when interacting
    if (mouse.activeMultiplier > 0.02) {
      const cursorGlow = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, SETTINGS.warpRadius * 0.95
      );
      if (isDark) {
        cursorGlow.addColorStop(0, `rgba(245, 158, 11, ${0.16 * mouse.activeMultiplier})`);
        cursorGlow.addColorStop(0.5, `rgba(180, 83, 9, ${0.06 * mouse.activeMultiplier})`);
        cursorGlow.addColorStop(1, "rgba(7, 8, 11, 0)");
      } else {
        cursorGlow.addColorStop(0, `rgba(10, 29, 55, ${0.22 * mouse.activeMultiplier})`);
        cursorGlow.addColorStop(0.5, `rgba(14, 45, 80, ${0.08 * mouse.activeMultiplier})`);
        cursorGlow.addColorStop(1, "rgba(253, 251, 247, 0)");
      }
      ctx.fillStyle = cursorGlow;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Dynamic Shape Modulation
    const ampMod = SETTINGS.morphAmplitude * (0.5 + 0.5 * Math.sin(time * SETTINGS.morphSpeed));

    const rings = SETTINGS.numRings;
    const points = SETTINGS.pointsPerRing;
    const warpRadiusSq = SETTINGS.warpRadius * SETTINGS.warpRadius;
    const effectiveZoomSpeed = SETTINGS.zoomSpeed + scrollSpeedBonus;

    // 4. Draw Harmonic Dot Lattice with Warp Field
    for (let i = 0; i < rings; i++) {
      let u = (i / rings - time * effectiveZoomSpeed * 0.2) % 1;
      if (u < 0) u += 1;

      // Depth perspective scaling
      const rBase = Math.pow(u, 2.2) * maxRadius;
      if (rBase < 3) continue;

      const depthAlpha = Math.min(1, Math.pow(u, 0.72));
      const baseDotRadius = Math.max(0.6, u * SETTINGS.baseDotSize);
      const ringRotation = time * SETTINGS.rotationSpeed + (1 - u) * SETTINGS.twistRate;

      // Palette tinting based on Dark vs Light Mode
      if (isDark) {
        // Dark Mode: glowing warm solar gold dots
        const ringSat = Math.floor(70 * (1 - u * 0.45));
        const ringLight = Math.floor(78 + 14 * u);
        const finalAlpha = depthAlpha * 0.88 * scrollDim;
        ctx.fillStyle = `hsla(${SETTINGS.dotHueDark}, ${ringSat}%, ${ringLight}%, ${finalAlpha})`;
      } else {
        // Light Mode: Refined Oxford Dark Navy Blue dots with subtle ambient depth
        const finalAlpha = depthAlpha * 0.80*scrollDim;
        ctx.fillStyle = `rgba(11, 37, 69, ${finalAlpha})`;
      }

      ctx.beginPath();
      for (let j = 0; j < points; j++) {
        const theta = (j / points) * Math.PI * 2 + ringRotation;
        const harmonic = 1 + ampMod * Math.cos(SETTINGS.symmetry * theta);
        const rFinal = rBase * harmonic;

        let px = cx + rFinal * Math.cos(theta);
        let py = cy + rFinal * Math.sin(theta);
        let dotRadius = baseDotRadius;

        // --- Option 2: Text Exclusion & Gentle Deflection ---
        if (textZones.length > 0) {
          const DEFLECT_BUFFER = 60;
          for (let k = 0; k < textZones.length; k++) {
            const z = textZones[k];
            if (px >= z.left - DEFLECT_BUFFER && px <= z.right + DEFLECT_BUFFER &&
                py >= z.top - DEFLECT_BUFFER && py <= z.bottom + DEFLECT_BUFFER) {
              const cxBox = (z.left + z.right) * 0.5;
              const cyBox = (z.top + z.bottom) * 0.5;
              const dx = px - cxBox;
              const dy = py - cyBox;
              const dist = Math.hypot(dx, dy);
              if (dist > 1) {
                const maxRange = Math.max(z.right - z.left, z.bottom - z.top) * 0.65 + DEFLECT_BUFFER;
                if (dist < maxRange) {
                  const push = (1 - dist / maxRange) * 16;
                  px += (dx / dist) * push;
                  py += (dy / dist) * push;
                }
              }
            }
          }
        }

        const occ = getSolarOcclusionFactor(px, py);
        if (occ <= 0.04) {
          continue; // completely invisible behind text
        }
        dotRadius *= occ;

        // --- Mouse Warp Field Calculation ---
        if (mouse.activeMultiplier > 0.01) {
          const dx = px - mouse.x;
          const dy = py - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < warpRadiusSq && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const normDist = dist / SETTINGS.warpRadius;
            const factor = Math.cos(normDist * Math.PI * 0.5);

            const force = (SETTINGS.warpStrength * factor * mouse.activeMultiplier);
            const angle = Math.atan2(dy, dx);
            const swirlOffset = 0.22 * factor;

            px += Math.cos(angle + swirlOffset) * force;
            py += Math.sin(angle + swirlOffset) * force;

            dotRadius += factor * 0.65 * mouse.activeMultiplier;
          }
        }

        ctx.moveTo(px + dotRadius, py);
        ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  // 0% CPU consumption when browser tab is inactive or hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      isVisible = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    } else {
      isVisible = true;
      lastTimestamp = performance.now();
      animationFrameId = requestAnimationFrame(render);
    }
  });

  // In Hero-Only mode: IntersectionObserver pauses rendering when scrolled away
  if (!isHybrid && "IntersectionObserver" in window && heroSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              lastTimestamp = performance.now();
              animationFrameId = requestAnimationFrame(render);
            }
          } else {
            isVisible = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(heroSection);
  }

  animationFrameId = requestAnimationFrame(render);
})();
