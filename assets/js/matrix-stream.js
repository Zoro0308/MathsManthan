/**
 * Maths Manthan | Floating Mathematical Matrix Stream Engine
 * 3D Parallax Depth, Digit Mutation, and Interactive Cursor Repulsion.
 * Dual-Theme Reactive Engine (Dark & Light Mode).
 */

(function () {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Palettes configuration (Dark Mode Themes)
  const THEMES = {
    midnight: {
      bg: "#050a12",
      bgGlow: "rgba(14, 45, 80, 0.28)",
      shadow: "#38bdf8",
      getColor: (z, alpha) => {
        if (z < 0.4) {
          return `rgba(28, 52, 82, ${alpha * 0.45})`;
        } else if (z < 0.75) {
          return `rgba(56, 189, 248, ${alpha * 0.75})`;
        } else {
          return `rgba(224, 242, 254, ${alpha})`;
        }
      }
    },
    cyber: {
      bg: "#080612",
      bgGlow: "rgba(112, 26, 117, 0.28)",
      shadow: "#f43f5e",
      getColor: (z, alpha) => {
        if (z < 0.4) return `rgba(55, 19, 78, ${alpha * 0.45})`;
        if (z < 0.75) return `rgba(217, 70, 239, ${alpha * 0.75})`;
        return `rgba(255, 228, 242, ${alpha})`;
      }
    },
    solar: {
      bg: "#0b0805",
      bgGlow: "rgba(146, 64, 14, 0.28)",
      shadow: "#f59e0b",
      getColor: (z, alpha) => {
        if (z < 0.4) return `rgba(74, 38, 14, ${alpha * 0.45})`;
        if (z < 0.75) return `rgba(245, 158, 11, ${alpha * 0.75})`;
        return `rgba(254, 243, 199, ${alpha})`;
      }
    },
    emerald: {
      bg: "#040d0a",
      bgGlow: "rgba(6, 78, 59, 0.32)",
      shadow: "#10b981",
      getColor: (z, alpha) => {
        if (z < 0.4) return `rgba(18, 53, 36, ${alpha * 0.45})`;
        if (z < 0.75) return `rgba(16, 185, 129, ${alpha * 0.75})`;
        return `rgba(209, 250, 229, ${alpha})`;
      }
    }
  };

  // Global Parameter Configuration Object
  const CONFIG = {
    density: 70,           // Total count of numbers
    speed: 0.4,            // Vertical drift speed factor
    parallaxFactor: 1,    // Speed multiplier difference between far and near
    minFontSize: 14,        // Font size at z = 0 (far)
    maxFontSize: 50,        // Font size at z = 1 (near)
    mutationChance: 0.035,  // Probability of a digit changing per frame
    glowSize: 16,           // Blur radius for foreground digits
    repulsionRadius: 120,   // Cursor interaction field radius
    currentTheme: "solar"
  };

  let width = 0;
  let height = 0;
  let particles = [];
  const mouse = { x: -9999, y: -9999, active: false };

  // Site Theme Tracking
  let currentSiteTheme = document.documentElement.getAttribute("data-theme") || "dark";
  window.addEventListener("mm-theme-change", (e) => {
    currentSiteTheme = e.detail.theme;
  });

  // High-DPI Canvas Resizing
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    initParticles();
  }
  window.addEventListener("resize", resize);

  // Particle Factory
  function createParticle(randomizeY = true) {
    const z = Math.pow(Math.random(), 1.4);
    return {
      digit: Math.floor(Math.random() * 10).toString(),
      x: Math.random() * width,
      y: randomizeY ? Math.random() * height : (CONFIG.speed >= 0 ? -60 : height + 60),
      z: z, // 0 = deepest background, 1 = extreme foreground
      vx: 0,
      vy: 0,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.5 + Math.random() * 1.5,
    };
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.density; i++) {
      particles.push(createParticle(true));
    }
    particles.sort((a, b) => a.z - b.z);
  }

  // Cursor interaction
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener("pointerleave", () => {
    mouse.active = false;
  });

  // Wire Interactive Controls
  function bindSlider(id, key, valId, formatFn = (v) => v, onUpdate = null) {
    const slider = document.getElementById(id);
    const display = document.getElementById(valId);
    if (!slider || !display) return;

    slider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      CONFIG[key] = val;
      display.textContent = formatFn(val);
      if (onUpdate) onUpdate(val);
    });
  }

  bindSlider("param-density", "density", "val-density", (v) => Math.round(v), () => initParticles());
  bindSlider("param-speed", "speed", "val-speed", (v) => v.toFixed(2));
  bindSlider("param-parallax", "parallaxFactor", "val-parallax", (v) => v.toFixed(1));
  bindSlider("param-minFont", "minFontSize", "val-minFont", (v) => `${v}px`);
  bindSlider("param-maxFont", "maxFontSize", "val-maxFont", (v) => `${v}px`);
  bindSlider("param-mutation", "mutationChance", "val-mutation", (v) => v.toFixed(3));
  bindSlider("param-glow", "glowSize", "val-glow", (v) => `${v}px`);
  bindSlider("param-repulsion", "repulsionRadius", "val-repulsion", (v) => `${v}px`);

  document.querySelectorAll(".theme-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".theme-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      CONFIG.currentTheme = btn.dataset.theme;
    });
  });

  // Drawer Toggle Button
  const toggleBtn = document.getElementById("toggleControlsBtn");
  const panel = document.querySelector(".controls-panel");
  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      panel.classList.toggle("collapsed");
      toggleBtn.classList.toggle("active");
    });
  }

  // Text Exclusion Zones & Option 2 Deflection Field
  let textZones = [];
  let lastZoneScan = 0;

  function updateTextZones() {
    const now = performance.now();
    if (now - lastZoneScan < 250 && textZones.length > 0) return;
    lastZoneScan = now;

    const selectors = [
      '.resources-hero h1',
      '.resources-hero p',
      '.resources-hero .section-tag',
      '.resources-title',
      '.hero-badge-row',
      '.section-header .section-title',
      '.section-header .section-subtitle',
      '.section-header .section-tag',
      '#inpageBookTitle',
      '#inpageBookSubtitle',
      '.hero-title',
      '.hero-lead',
      '[data-fade-zone]'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const rawZones = [];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (el.offsetParent === null && window.getComputedStyle(el).display === 'none') continue;

      let rect = null;
      try {
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        if (r.width > 20 && r.height > 8) {
          rect = r;
        }
      } catch (_) {}

      if (!rect) {
        rect = el.getBoundingClientRect();
      }

      if (rect.bottom >= -80 && rect.top <= vh + 80 && rect.right >= -80 && rect.left <= vw + 80) {
        rawZones.push({
          left: rect.left - 6,
          top: rect.top - 4,
          right: rect.right + 6,
          bottom: rect.bottom + 4,
          cx: (rect.left + rect.right) * 0.5,
          cy: (rect.top + rect.bottom) * 0.5,
          hw: (rect.right - rect.left) * 0.5 + 6,
          hh: (rect.bottom - rect.top) * 0.5 + 4
        });
      }
    }
    textZones = rawZones;
  }

  window.addEventListener('scroll', () => { lastZoneScan = 0; }, { passive: true });

  const FADE_BUFFER = 60; // 60px soft boundary cushion

  
function getTextOcclusionFactor(px, py) {
  return 1.0;
}


  // Animation Render Loop
  let lastTime = performance.now();

  function render(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    updateTextZones();

    const isDark = currentSiteTheme === "dark";
    const theme = THEMES[CONFIG.currentTheme] || THEMES.midnight;

    // 1. Fill Background
    ctx.fillStyle = isDark ? theme.bg : "#fdfbf7";
    ctx.fillRect(0, 0, width, height);

    // 2. Central Subtle Ambient Glow
    const glowGrad = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.hypot(width, height) * 0.55
    );
    if (isDark) {
      glowGrad.addColorStop(0, theme.bgGlow);
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    } else {
      glowGrad.addColorStop(0, "rgba(216, 150, 23, 0.08)");
      glowGrad.addColorStop(0.6, "rgba(10, 29, 55, 0.03)");
      glowGrad.addColorStop(1, "rgba(253, 251, 247, 0)");
    }
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // Keep particles array matched with density slider
    if (particles.length < CONFIG.density) {
      for (let i = particles.length; i < CONFIG.density; i++) {
        particles.push(createParticle(true));
      }
      particles.sort((a, b) => a.z - b.z);
    } else if (particles.length > CONFIG.density) {
      particles.length = CONFIG.density;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 3. Render and Update Particles (sorted by depth z)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Random digit mutation
      if (Math.random() < CONFIG.mutationChance * dt * 60) {
        p.digit = Math.floor(Math.random() * 10).toString();
      }

      // Calculate size & velocity based on depth z
      const fontSize = CONFIG.minFontSize + (CONFIG.maxFontSize - CONFIG.minFontSize) * p.z;
      const speed = (0.2 + p.z * CONFIG.parallaxFactor) * CONFIG.speed * 60 * dt;

      // Vertical drift
      p.y += speed;

      // Subtle lateral sinusoidal sway
      p.swayPhase += p.swaySpeed * dt;
      const sway = Math.sin(p.swayPhase) * (0.3 + p.z * 0.7);
      p.x += sway;

      // Mouse Repulsion Field (foreground elements react more vigorously)
      if (mouse.active && CONFIG.repulsionRadius > 0) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const maxDist = CONFIG.repulsionRadius * (0.5 + p.z * 0.8);

        if (dist < maxDist && dist > 1) {
          const force = (1 - dist / maxDist) * (80 + p.z * 160) * dt;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // --- OPTION 2: GENTLE TEXT BOX DEFLECTION FIELD ---
      // Particles detect oncoming text boxes and smoothly curve/part around the letters
      if (textZones.length > 0) {
        const DEFLECT_DISTANCE = 140; // Starts curving 140px ahead of the text box
        const DEFLECT_SIDE_MARGIN = 40; // Lateral margin to clear the text width

        for (let j = 0; j < textZones.length; j++) {
          const z = textZones[j];

          // Is particle in the approach corridor above or alongside this text box?
          if (p.y >= z.top - DEFLECT_DISTANCE && p.y <= z.bottom + 15) {
            const sideBoxLeft = z.left - DEFLECT_SIDE_MARGIN;
            const sideBoxRight = z.right + DEFLECT_SIDE_MARGIN;

            if (p.x >= sideBoxLeft && p.x <= sideBoxRight) {
              const totalHalfWidth = z.hw + DEFLECT_SIDE_MARGIN;
              const relX = (p.x - z.cx) / Math.max(totalHalfWidth, 1);
              const dirX = relX >= 0 ? 1 : -1;

              // Vertical proximity: approaches 1 as particle nears z.top
              const approachDist = Math.max(0, p.y - (z.top - DEFLECT_DISTANCE));
              const approachFactor = Math.min(1.0, approachDist / DEFLECT_DISTANCE);

              // Center urgency: particles closer to the center steer stronger
              const centerUrgency = Math.max(0.6, 1.4 - Math.abs(relX) * 0.7);

              // Steer lateral force
              const lateralSteer = dirX * centerUrgency * approachFactor * (50 + p.z * 60) * dt;
              p.vx += lateralSteer;

              // Aerodynamic deceleration near top edge
              if (p.y < z.top + 8) {
                p.vy -= 14 * approachFactor * dt;
              }
            }
          }
        }
      }

      // Apply velocity with damping
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;

      // Boundary wrapping
      if (CONFIG.speed >= 0 && p.y > height + 80) {
        p.y = -80;
        p.x = Math.random() * width;
      } else if (CONFIG.speed < 0 && p.y < -80) {
        p.y = height + 80;
        p.x = Math.random() * width;
      }

      if (p.x < -60) p.x = width + 60;
      if (p.x > width + 60) p.x = -60;

      // Typography styling
      ctx.font = `700 ${fontSize}px ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      // Check Text Exclusion Zone (Fade near text boundary)
      const occlusion = getTextOcclusionFactor(p.x, p.y);
      if (occlusion <= 0.04) {
        continue; // Completely hidden behind/near text
      }

      // Bloom shadow
      if (p.z > 0.75 && CONFIG.glowSize > 0) {
        ctx.shadowColor = isDark ? theme.shadow : "rgba(10, 29, 55, 0.25)";
        ctx.shadowBlur = CONFIG.glowSize * (p.z - 0.75) * 4 * occlusion;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      // Depth-blended text fill based on Dark vs Light with occlusion factor
      const alpha = Math.min(1, 0.25 + p.z * 0.75) * occlusion;
      if (isDark) {
        ctx.fillStyle = theme.getColor(p.z, alpha);
      } else {
        // Light Mode: Refined Oxford Navy & Slate numbers on parchment (delicate watermark style)
        if (p.z < 0.4) {
          ctx.fillStyle = `rgba(10, 29, 55, ${alpha * 0.16})`;
        } else if (p.z < 0.75) {
          ctx.fillStyle = `rgba(14, 45, 80, ${alpha * 0.32})`;
        } else {
          ctx.fillStyle = `rgba(10, 29, 55, ${alpha * 0.48})`;
        }
      }

      ctx.fillText(p.digit, p.x, p.y);
    }

    // Reset shadow for next frame
    ctx.shadowBlur = 0;
    requestAnimationFrame(render);
  }

  // Initialize and run
  resize();
  requestAnimationFrame(render);
})();
