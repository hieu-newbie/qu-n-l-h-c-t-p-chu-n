/* ============================================================================
   STUDYHUB CHARTS, COUNT-UP & OFFLINE CONFETTI ENGINE
   Zero external CDN dependency — crisp animated SVG charts + Canvas confetti
   ============================================================================ */
(function (global) {
  "use strict";

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function escapeXml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatCompact(n) {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
    if (Math.abs(n) >= 1_000) return Math.round(n / 1_000) + "k";
    return String(n);
  }

  // Circular SVG Progress Ring
  function renderProgressRing(percent, size, strokeColor, labelText) {
    const s = size || 52;
    const stroke = 5;
    const r = (s - stroke) / 2;
    const c = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
    const offset = c - (clamped / 100) * c;
    return `
      <div style="position:relative;width:${s}px;height:${s}px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="${s}" height="${s}" style="transform:rotate(-90deg)">
          <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="var(--muted)" stroke-width="${stroke}" />
          <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${strokeColor || "var(--primary)"}"
            stroke-width="${stroke}" stroke-linecap="round"
            stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
            style="transition:stroke-dashoffset 0.85s cubic-bezier(0.22,1,0.36,1)" />
        </svg>
        <span class="tabular-nums" style="position:absolute;font-size:11px;font-weight:700">${escapeXml(labelText)}</span>
      </div>
    `;
  }

  // Animated Course Grade Bar Chart (0..10 scale)
  function renderCourseBarChart(items) {
    if (!items || !items.length) return "";
    const W = 460, H = 190, padL = 30, padR = 12, padT = 16, padB = 30;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const slotW = plotW / items.length;
    const barW = Math.min(36, Math.max(16, slotW * 0.56));

    const gridLines = [0, 2.5, 5, 7.5, 10]
      .map((val) => {
        const y = padT + plotH - (val / 10) * plotH;
        return `
          <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-dasharray="3 3" />
          <text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--muted-fg)">${val}</text>
        `;
      })
      .join("");

    const bars = items
      .map((item, idx) => {
        const val = Math.max(0, Math.min(10, Number(item.score10) || 0));
        const h = (val / 10) * plotH;
        const x = padL + idx * slotW + (slotW - barW) / 2;
        const y = padT + plotH - h;
        const delay = (idx * 0.06).toFixed(2);
        return `
          <g>
            <rect class="chart-bar-rect" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${barW}" height="${h}" rx="6" fill="${escapeXml(item.color || "#2563eb")}">
              <title>${escapeXml(item.name)}: ${val.toFixed(2)}/10</title>
            </rect>
            <text x="${x + barW / 2}" y="${Math.max(12, y - 5)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--fg)">${val.toFixed(1)}</text>
            <text x="${x + barW / 2}" y="${H - 10}" text-anchor="middle" font-size="10.5" fill="var(--muted-fg)">${escapeXml(item.code.slice(0, 8))}</text>
          </g>
        `;
      })
      .join("");

    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${gridLines}${bars}</svg>`;
  }

  // Animated 6-Month Income vs Expense Dual Bar Chart
  function renderFinanceTrendChart(months) {
    const W = 500, H = 210, padL = 42, padR = 12, padT = 18, padB = 34;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxVal = Math.max(100000, ...months.flatMap((m) => [m.income, m.expense])) * 1.15;
    const slotW = plotW / months.length;
    const barW = Math.min(20, Math.max(10, slotW * 0.28));

    const grids = [0, 0.33, 0.66, 1]
      .map((ratio) => {
        const y = padT + plotH - ratio * plotH;
        const val = Math.round(maxVal * ratio);
        return `
          <line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-dasharray="3 3" />
          <text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--muted-fg)">${formatCompact(val)}</text>
        `;
      })
      .join("");

    const groups = months
      .map((m, i) => {
        const cx = padL + i * slotW + slotW / 2;
        const incH = (m.income / maxVal) * plotH;
        const expH = (m.expense / maxVal) * plotH;
        const delay = (i * 0.05).toFixed(2);
        return `
          <g>
            <rect class="chart-bar-rect" style="animation-delay:${delay}s" x="${cx - barW - 2}" y="${padT + plotH - incH}" width="${barW}" height="${incH}" rx="4" fill="#10b981">
              <title>${m.label} Thu: ${m.income.toLocaleString("vi-VN")}₫</title>
            </rect>
            <rect class="chart-bar-rect" style="animation-delay:${delay}s" x="${cx + 2}" y="${padT + plotH - expH}" width="${barW}" height="${expH}" rx="4" fill="#f43f5e">
              <title>${m.label} Chi: ${m.expense.toLocaleString("vi-VN")}₫</title>
            </rect>
            <text x="${cx}" y="${H - 12}" text-anchor="middle" font-size="11" fill="var(--muted-fg)">${escapeXml(m.label)}</text>
          </g>
        `;
      })
      .join("");

    return `
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${grids}${groups}</svg>
      <div class="row" style="justify-content:center;font-size:12px;margin-top:4px">
        <span class="row" style="gap:5px"><span style="width:10px;height:10px;border-radius:3px;background:#10b981;display:inline-block"></span>Thu nhập</span>
        <span class="row" style="gap:5px"><span style="width:10px;height:10px;border-radius:3px;background:#f43f5e;display:inline-block"></span>Chi tiêu</span>
      </div>
    `;
  }

  // Category Expense Donut Chart
  function renderDonutChart(slices) {
    const colors = ["#2563eb", "#059669", "#ea580c", "#7c3aed", "#db2777", "#d97706", "#0284c7", "#64748b"];
    const total = slices.reduce((s, x) => s + x.value, 0);
    if (total <= 0) return "";
    const R = 64, r = 40, cx = 85, cy = 85;
    let angle = -Math.PI / 2;

    const paths = slices
      .map((sl, i) => {
        const frac = sl.value / total;
        const sweep = frac * Math.PI * 2;
        const x1 = cx + R * Math.cos(angle);
        const y1 = cy + R * Math.sin(angle);
        const end = angle + sweep;
        const x2 = cx + R * Math.cos(end);
        const y2 = cy + R * Math.sin(end);
        const ix1 = cx + r * Math.cos(end);
        const iy1 = cy + r * Math.sin(end);
        const ix2 = cx + r * Math.cos(angle);
        const iy2 = cy + r * Math.sin(angle);
        const large = sweep > Math.PI ? 1 : 0;
        const color = colors[i % colors.length];
        angle = end;
        if (slices.length === 1) {
          return `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${color}" stroke-width="${R - r}"><title>${escapeXml(sl.name)}: ${sl.value.toLocaleString("vi-VN")}₫</title></circle>`;
        }
        return `
          <path d="M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${large} 0 ${ix2} ${iy2} Z" fill="${color}">
            <title>${escapeXml(sl.name)}: ${sl.value.toLocaleString("vi-VN")}₫ (${Math.round(frac * 100)}%)</title>
          </path>
        `;
      })
      .join("");

    const legend = slices
      .slice(0, 6)
      .map(
        (sl, i) => `
        <div class="between" style="font-size:12px">
          <span class="row truncate" style="gap:6px;min-width:0">
            <span style="width:9px;height:9px;border-radius:99px;background:${colors[i % colors.length]};flex-shrink:0"></span>
            <span class="truncate">${escapeXml(sl.name)}</span>
          </span>
          <span class="tabular-nums" style="font-weight:600;flex-shrink:0">${formatCompact(sl.value)}</span>
        </div>
      `
      )
      .join("");

    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px">
        <svg viewBox="0 0 170 170" style="width:168px;height:168px">
          ${paths}
          <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="10" fill="var(--muted-fg)">Tổng chi</text>
          <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="13" font-weight="800" fill="var(--fg)">${formatCompact(total)}</text>
        </svg>
        <div class="grid-2" style="width:100%;gap:8px">${legend}</div>
      </div>
    `;
  }

  // Smooth Number Count-up for KPIs
  function animateCountUps(container) {
    const els = (container || document).querySelectorAll("[data-countup]");
    els.forEach((el) => {
      const target = Number(el.getAttribute("data-countup"));
      const decimals = Number(el.getAttribute("data-decimals") || 0);
      const format = el.getAttribute("data-format") || "";
      const suffix = el.getAttribute("data-suffix") || "";
      if (Number.isNaN(target)) return;

      const renderVal = (v) => {
        if (format === "vnd") return Math.round(v).toLocaleString("vi-VN") + " ₫";
        return (decimals > 0 ? v.toFixed(decimals) : String(Math.round(v))) + suffix;
      };

      if (reducedMotion()) {
        el.textContent = renderVal(target);
        return;
      }

      const start = performance.now();
      const duration = 720;
      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = renderVal(target * eased);
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }

  // Built-in Lightweight Offline Confetti Engine
  let confettiAnimId = null;
  let particles = [];

  function fireConfetti(options = {}) {
    if (reducedMotion()) return;
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = options.count || 75;
    const ox = (options.x ?? 0.5) * canvas.width;
    const oy = (options.y ?? 0.6) * canvas.height;
    const palette = ["#2563eb", "#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI * 1.4) - Math.PI * 1.2;
      const speed = 5 + Math.random() * 9;
      particles.push({
        x: ox,
        y: oy,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
        vy: Math.sin(angle) * speed - Math.random() * 3,
        size: 5 + Math.random() * 5,
        color: palette[i % palette.length],
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 12,
        life: 1,
      });
    }

    if (confettiAnimId) return;
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => p.life > 0.02 && p.y < canvas.height + 30);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24;
        p.vx *= 0.99;
        p.rot += p.vrot;
        p.life -= 0.012;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        ctx.restore();
      }
      if (particles.length > 0) {
        confettiAnimId = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiAnimId = null;
      }
    }
    confettiAnimId = requestAnimationFrame(tick);
  }

  global.StudyHubCharts = {
    renderProgressRing,
    renderCourseBarChart,
    renderFinanceTrendChart,
    renderDonutChart,
    animateCountUps,
    fireConfetti,
  };
})(window);
