/**
 * Maths Manthan | Solar Matrix Harmonic Tunnel Animation
 * GPU-efficient, 60fps harmonic dot lattice with interactive Mouse Warp Field.
 * Dual-Theme Reactive Engine (Dark & Light Mode).
 */

(function () {
  // SETTINGS (from configuration)
  const SETTINGS = {
    symmetry: 3,           // Harmonic Symmetry: 3-Fold
    zoomSpeed: 0.1,        // Tunnel Depth Speed: 0.4x
    twistRate: 3.0,        // Rotational Swirl: 3.0x
    morphAmplitude: 0.20,  // Morph Depth (Shape Shift): 0.20
    morphSpeed: 0.0001,      // Breathing rate between circle & triangle
    rotationSpeed: 0.0001,   // Baseline spin speed
    numRings: 52,          // Concentric tunnel density
    pointsPerRing: 64,     // Dots per ring
    baseDotSize: 1.9,     // Outer dot radius

    // Solar Mood Palette (Dark Mode)
    coreGlowDark: "rgba(245, 158, 11, 0.32)", // Warm solar amber core
    midGlowDark: "rgba(180, 83, 9, 0.12)",
    dotHueDark: 38,                           // Solar gold/amber hue

    // Solar Mood Palette (Light Mode: Oxford Dark Navy Blue Core)
    coreGlowLight: "rgba(11, 37, 69, 0.42)",  // Majestic Dark Navy Blue core
    midGlowLight: "rgba(15, 52, 96, 0.18)",   // Navy mid-glow aura
	dotColorLight: "rgba(11, 37, 69, ", // Base solid navy prefix
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

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (heroSection) {
      const rect = heroSection.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    } else {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.scale(dpr, dpr);
    maxRadius = Math.hypot(width, height) * 0.55;
  }

  window.addEventListener("resize", resize);
  resize();

  // Mouse & Touch Event Listeners on the Hero Section
  if (heroSection) {
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

  let time = 0;
  let lastTimestamp = performance.now();

  function render(timestamp) {
    if (!isVisible) return;

    const dt = (timestamp - lastTimestamp) / 1000;
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

    // 1. Base Fill (Dark Void or Light Parchment)
    ctx.fillStyle = isDark ? "#07080b" : "#fdfbf7";
    ctx.fillRect(0, 0, width, height);

    // Center harmonic anchor (dynamically gently pulled toward mouse when hovering)
    const isMobile = width < 768;
    const baseCx = isMobile ? width / 2 : width * 0.48;
    const baseCy = height / 2;

    const pullStrength = 0.05 * mouse.activeMultiplier;
    const cx = baseCx + (mouse.x - baseCx) * pullStrength;
    const cy = baseCy + (mouse.y - baseCy) * pullStrength;

    // 2. Solar Amber Central Radial Aura
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.58);
    if (isDark) {
      glow.addColorStop(0, SETTINGS.coreGlowDark);
      glow.addColorStop(0.5, SETTINGS.midGlowDark);
      glow.addColorStop(1, "rgba(7, 8, 11, 0)");
    } else {
      // Light Mode: Majestic Dark Navy Blue central core
      glow.addColorStop(0, SETTINGS.coreGlowLight);
      glow.addColorStop(0.45, SETTINGS.midGlowLight);
      glow.addColorStop(0.85, "rgba(10, 29, 55, 0.02)");
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

    // 4. Draw Harmonic Dot Lattice with Warp Field
    for (let i = 0; i < rings; i++) {
      let u = (i / rings - time * SETTINGS.zoomSpeed * 0.2) % 1;
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
        ctx.fillStyle = `hsla(${SETTINGS.dotHueDark}, ${ringSat}%, ${ringLight}%, ${depthAlpha * 0.88})`;
      } else {
        // Light Mode: Solid Oxford Dark Navy Blue across all dots
        // Exactly matches the "#0B2545" title color (hsl: 213°, 72%, 16%)
        ctx.fillStyle = `rgba(11, 37, 69, ${depthAlpha * 0.95})`;
      }

      ctx.beginPath();
      for (let j = 0; j < points; j++) {
        const theta = (j / points) * Math.PI * 2 + ringRotation;
        const harmonic = 1 + ampMod * Math.cos(SETTINGS.symmetry * theta);
        const rFinal = rBase * harmonic;

        let px = cx + rFinal * Math.cos(theta);
        let py = cy + rFinal * Math.sin(theta);
        let dotRadius = baseDotRadius;

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

  // IntersectionObserver for 0% CPU consumption when scrolling past hero
  if ("IntersectionObserver" in window && heroSection) {
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
