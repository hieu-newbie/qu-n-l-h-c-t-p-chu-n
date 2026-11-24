/* ============================================================================
   STUDYHUB APP CORE: Icons, Theme, Toast, Modal, Router, Auth & Shell
   ============================================================================ */
(function (global) {
  "use strict";

  const COLORS = [
    "#2563eb", "#4f46e5", "#7c3aed", "#db2777", "#e11d48",
    "#ea580c", "#d97706", "#059669", "#0d9488", "#0284c7",
  ];
  const DAY_NAMES = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật" };
  const DAY_SHORT = { 1: "T2", 2: "T3", 3: "T4", 4: "T5", 5: "T6", 6: "T7", 7: "CN" };
  const PRIORITY_LABELS = { low: "Thấp", medium: "Trung bình", high: "Cao", urgent: "Khẩn cấp" };
  const STATUS_LABELS = { todo: "Cần làm", in_progress: "Đang làm", done: "Hoàn thành" };
  const EXAM_FORMATS = {
    written: "Tự luận",
    multiple_choice: "Trắc nghiệm",
    oral: "Vấn đáp",
    practical: "Thực hành máy",
    project: "Tiểu luận / Đồ án",
    online: "Thi trực tuyến",
  };
  const EXPENSE_CATS = ["Ăn uống", "Nhà trọ & Điện nước", "Di chuyển", "Học phí & Tài liệu", "Giải trí", "Mua sắm", "Sức khỏe", "Khác"];
  const INCOME_CATS = ["Gia đình chu cấp", "Làm thêm", "Học bổng", "Thưởng / Freelance", "Khác"];

  // Crisp Inline SVG Icons
  const SVG_PATHS = {
    cap: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    checkSquare: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>',
    fileText: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>',
    note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.25.4-1.51 1Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    trash: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
    panelLeft: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
    pin: '<line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
  };

  function icon(name, size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${SVG_PATHS[name] || ""}</svg>`;
  }

  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatVND(amount) {
    return Math.round(Number(amount) || 0).toLocaleString("vi-VN") + " ₫";
  }

  function formatDateTimeVN(iso) {
    if (!iso) return "Chưa đặt";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function formatDateVN(iso) {
    if (!iso) return "Chưa đặt";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function getTodayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function toDateTimeLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function getMonthKey(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function getIsoDow(d = new Date()) {
    const day = d.getDay();
    return day === 0 ? 7 : day;
  }

  function getCountdown(iso) {
    const target = new Date(iso).getTime();
    const diff = target - Date.now();
    if (Number.isNaN(target)) return { isPast: false, days: 99, label: "Chưa rõ" };
    if (diff <= 0) {
      const pd = Math.floor(Math.abs(diff) / 86400000);
      return { isPast: true, days: -pd, label: pd === 0 ? "Đã qua hôm nay" : `Đã qua ${pd} ngày` };
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const label = days > 0 ? `Còn ${days} ngày ${hours} giờ` : hours > 0 ? `Còn ${hours} giờ ${mins} phút` : `Còn ${Math.max(1, mins)} phút`;
    return { isPast: false, days, hours, label };
  }

  function isScheduleActiveOn(item, dateObj) {
    const ds = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    if (item.recurrence === "once") {
      return item.specific_date ? item.specific_date === ds : Number(item.day_of_week) === getIsoDow(dateObj);
    }
    return Number(item.day_of_week) === getIsoDow(dateObj);
  }

  // ==========================================================================
  // THEME MANAGEMENT (300ms Smooth Transition)
  // ==========================================================================
  function getThemeSetting() {
    return localStorage.getItem("studyhub_theme") || "system";
  }

  function isDarkActive() {
    return document.documentElement.classList.contains("dark");
  }

  function applyTheme(mode) {
    document.documentElement.classList.add("theme-transition");
    localStorage.setItem("studyhub_theme", mode);
    const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    setTimeout(() => document.documentElement.classList.remove("theme-transition"), 340);
  }

  function toggleTheme() {
    applyTheme(isDarkActive() ? "light" : "dark");
    render();
  }

  // ==========================================================================
  // TOAST WITH COUNTDOWN BAR & MODAL (Esc / Outside Click)
  // ==========================================================================
  function toast(title, type = "info", desc = "") {
    const root = document.getElementById("toast-root");
    if (!root) return;
    const color = type === "success" ? "#10b981" : type === "error" ? "#f43f5e" : "#2563eb";
    const ic = type === "success" ? "checkCircle" : type === "error" ? "alert" : "sparkles";
    const el = document.createElement("div");
    el.className = "toast";
    el.style.borderColor = color + "66";
    el.innerHTML = `
      <span style="color:${color};margin-top:2px">${icon(ic, 18)}</span>
      <div style="flex:1;min-width:0">
        <p style="font-size:13.5px;font-weight:700">${esc(title)}</p>
        ${desc ? `<p style="font-size:12px;color:var(--muted-fg);margin-top:2px">${esc(desc)}</p>` : ""}
      </div>
      <div class="toast-bar" style="background:${color}"></div>
    `;
    root.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(28px)";
      el.style.transition = "all 0.22s ease";
      setTimeout(() => el.remove(), 240);
    }, 3800);
  }

  function openModal(title, desc, bodyHtml) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `
      <div class="modal-panel" role="dialog" aria-modal="true">
        <div class="sheet-handle"></div>
        <button type="button" class="modal-close" data-close-modal aria-label="Đóng">${icon("x", 18)}</button>
        <h3 style="font-size:18px;font-weight:800;padding-right:34px">${esc(title)}</h3>
        ${desc ? `<p style="font-size:13px;color:var(--muted-fg);margin-top:4px;margin-bottom:14px">${esc(desc)}</p>` : '<div style="height:12px"></div>'}
        <div>${bodyHtml}</div>
      </div>
    `;
    root.classList.add("open");
    root.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    const root = document.getElementById("modal-root");
    root.classList.remove("open");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = "";
  }

  // Global Esc & outside click handler for modal + button ripples + spotlight
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      if (state.mobileDrawer) {
        state.mobileDrawer = false;
        render();
      }
    }
  });

  document.addEventListener("click", (e) => {
    const modalRoot = document.getElementById("modal-root");
    if (e.target === modalRoot || e.target.closest("[data-close-modal]")) {
      closeModal();
    }
    const pwaBtn = e.target.closest("[data-pwa-install]");
    if (pwaBtn && global.StudyHubPWA) {
      global.StudyHubPWA.triggerInstall();
    }
    const btn = e.target.closest(".btn");
    if (btn && !btn.disabled) {
      const rect = btn.getBoundingClientRect();
      const sp = document.createElement("span");
      sp.className = "btn-ripple";
      const d = Math.max(rect.width, rect.height);
      sp.style.width = sp.style.height = d + "px";
      sp.style.left = e.clientX - rect.left + "px";
      sp.style.top = e.clientY - rect.top + "px";
      btn.appendChild(sp);
      setTimeout(() => sp.remove(), 520);
    }
  });

  document.addEventListener("mousemove", (e) => {
    const spot = e.target.closest(".spotlight");
    if (spot) {
      const r = spot.getBoundingClientRect();
      spot.style.setProperty("--mx", e.clientX - r.left + "px");
      spot.style.setProperty("--my", e.clientY - r.top + "px");
    }
    const tilt = e.target.closest(".auth-card");
    if (tilt && window.innerWidth >= 768) {
      const r = tilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg)`;
    }
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.classList && e.target.classList.contains("auth-card")) {
      e.target.style.transform = "";
    }
  });

  // ==========================================================================
  // APPLICATION STATE & ROUTER
  // ==========================================================================
  const state = {
    route: "home",
    sidebarCollapsed: localStorage.getItem("studyhub_sidebar_collapsed") === "true",
    mobileDrawer: false,
    resetToken: "",
    // Feature sub-states
    scheduleView: "week",
    scheduleDate: new Date(),
    courseSearch: "",
    courseSemester: "all",
    taskTab: "all",
    taskSearch: "",
    taskCourse: "all",
    taskPriority: "all",
    examTab: "upcoming",
    noteSearch: "",
    noteCourse: "all",
    noteSelectedId: null,
    noteCreating: false,
    noteTab: "edit",
    noteMobilePane: "list",
    noteDraftLoadedFor: null,
    noteDraftTitle: "",
    noteDraftCourse: "",
    noteDraftContent: "",
    noteDraftPin: false,
    noteDraftTags: [],
    noteDraftResources: [],
    financeMonth: getMonthKey(),
    financeType: "all",
    aiMode: "study_plan",
    aiConvId: null,
    aiDoc: "",
    aiPrompt: "",
    aiCourseId: "",
    aiIncludeCtx: true,
    aiSending: false,
    aiError: "",
  };

  function pulseRouteProgress() {
    const wrap = document.getElementById("route-progress");
    const bar = document.getElementById("route-progress-bar");
    if (!wrap || !bar) return;
    wrap.classList.add("active");
    bar.style.width = "45%";
    requestAnimationFrame(() => {
      bar.style.width = "100%";
      setTimeout(() => {
        wrap.classList.remove("active");
        setTimeout(() => { bar.style.width = "0%"; }, 200);
      }, 240);
    });
  }

  function navigate(route) {
    state.route = route;
    state.mobileDrawer = false;
    window.location.hash = "#" + route;
    pulseRouteProgress();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function syncRouteFromHash() {
    const raw = (window.location.hash || "").replace(/^#/, "");
    const user = global.StudyHubStore.getCurrentUser();
    const authRoutes = ["home", "login", "register", "forgot", "reset"];
    const appRoutes = ["dashboard", "schedule", "courses", "tasks", "exams", "notes", "finance", "ai", "settings"];

    if (user) {
      state.route = appRoutes.includes(raw) ? raw : "dashboard";
    } else {
      state.route = authRoutes.includes(raw) ? raw : "home";
    }
  }

  window.addEventListener("hashchange", () => {
    state.mobileDrawer = false;
    closeModal();
    syncRouteFromHash();
    render();
  });

  // Password Strength Helper
  function evaluatePwStrength(pw) {
    const checks = [
      { label: "≥ 8 ký tự", ok: pw.length >= 8 },
      { label: "Hoa & thường", ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
      { label: "Chữ số", ok: /\d/.test(pw) },
      { label: "Ký tự đặc biệt", ok: /[^A-Za-z0-9]/.test(pw) },
    ];
    let score = checks.filter((c) => c.ok).length;
    if (pw.length < 6 && pw.length > 0) score = 1;
    const meta = [
      { label: "Chưa nhập", color: "#94a3b8" },
      { label: "Yếu", color: "#f43f5e" },
      { label: "Trung bình", color: "#f59e0b" },
      { label: "Khá mạnh", color: "#2563eb" },
      { label: "Rất mạnh", color: "#10b981" },
    ][score];
    return { score, label: meta.label, color: meta.color, checks };
  }

  // ==========================================================================
  // PUBLIC VIEWS: LANDING, LOGIN, REGISTER, FORGOT, RESET
  // ==========================================================================
  function renderLanding() {
    const feats = [
      { ic: "calendar", t: "Thời khóa biểu thông minh", d: "Xem lịch theo ngày & tuần, lặp lại tự động, quản lý phòng học, giảng viên và phân màu môn." },
      { ic: "book", t: "Môn học & Tính GPA tự động", d: "Tùy chỉnh trọng số điểm thành phần, quy đổi điểm chữ & thang 4.0, thống kê GPA từng học kỳ." },
      { ic: "checkSquare", t: "Bài tập & Deadline", d: "Mức độ ưu tiên, lọc theo môn học, đánh dấu hoàn thành bắn confetti và cảnh báo quá hạn." },
      { ic: "fileText", t: "Lịch thi & Đếm ngược", d: "Theo dõi phòng thi, hình thức thi, bộ đếm ngược thời gian thực và nhắc lịch ôn thi." },
      { ic: "note", t: "Ghi chú & Tài liệu", d: "Ghi chú Markdown theo môn học, thẻ tag, ghim bài quan trọng và lưu link tài liệu tham khảo." },
      { ic: "wallet", t: "Chi tiêu sinh viên & Ngân sách", d: "Ghi chép thu chi theo danh mục, ngân sách tháng, biểu đồ trực quan và cảnh báo vượt mức." },
    ];
    return `
      <header class="landing-nav">
        <div class="landing-nav-inner">
          <a href="#home" class="brand">
            <div class="brand-logo">${icon("cap", 20)}</div>
            <div><div class="brand-title">STUDYHUB</div><div class="brand-sub">Smart Student Management</div></div>
          </a>
          <div class="row" style="gap:6px;flex-wrap:nowrap">
            <button type="button" class="btn btn-ghost btn-icon" id="btn-theme-top" aria-label="Đổi giao diện sáng tối">
              ${icon(isDarkActive() ? "sun" : "moon", 18)}
            </button>
            <button type="button" class="btn btn-ghost btn-sm" data-nav="login">Đăng nhập</button>
            <button type="button" class="btn btn-primary btn-sm btn-shine" data-nav="register"><span class="hide-xs">Bắt đầu </span>Miễn phí ${icon("arrowRight", 14)}</button>
          </div>
        </div>
      </header>
      <main class="fade-page">
        <section class="hero">
          <span class="badge badge-primary" style="padding:6px 14px;font-size:12px;white-space:normal;text-align:center;line-height:1.4">${icon("sparkles", 14)} Hệ sinh thái quản lý học tập & đời sống sinh viên tích hợp AI</span>
          <h1>Làm chủ học kỳ đại học với <span class="gradient-text">STUDYHUB</span></h1>
          <p class="hero-sub">Quản lý thời khóa biểu, điểm số GPA, bài tập deadline, lịch thi, ghi chú môn học, ngân sách chi tiêu hàng tháng và Trợ lý AI Study Assistant trên cả máy tính lẫn điện thoại.</p>
          <div class="hero-cta">
            <button type="button" class="btn btn-primary btn-lg btn-shine" data-nav="register">Tạo tài khoản sinh viên ${icon("arrowRight", 16)}</button>
            <button type="button" class="btn btn-outline btn-lg" data-nav="login">Đăng nhập tài khoản có sẵn</button>
            ${!(global.StudyHubPWA && global.StudyHubPWA.isStandalone()) ? `<button type="button" class="btn btn-outline btn-lg" data-pwa-install style="border-color:rgba(37,99,235,0.4);color:var(--primary)">${icon("download", 16)} Tải app về máy (PWA)</button>` : ""}
          </div>
        </section>
        <section class="features-grid">
          ${feats
            .map(
              (f) => `
            <div class="glass-card spotlight card-pad">
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(37,99,235,0.12);color:var(--primary);display:flex;align-items:center;justify-content:center;margin-bottom:14px">${icon(f.ic, 21)}</div>
              <h3 style="font-size:16px;font-weight:700;margin-bottom:6px">${f.t}</h3>
              <p style="font-size:13.5px;color:var(--muted-fg)">${f.d}</p>
            </div>
          `
            )
            .join("")}
        </section>
      </main>
    `;
  }

  function renderAuthWrapper(title, subtitle, formHtml, footerHtml) {
    return `
      <div class="auth-page fade-page">
        <div class="auth-top-toggle">
          <button type="button" class="btn btn-outline btn-icon" id="btn-theme-top" aria-label="Đổi giao diện sáng tối">
            ${icon(isDarkActive() ? "sun" : "moon", 18)}
          </button>
        </div>
        <a href="#home" class="brand" style="margin-bottom:20px">
          <div class="brand-logo">${icon("cap", 20)}</div>
          <div><div class="brand-title">STUDYHUB</div><div class="brand-sub">Smart Student Management</div></div>
        </a>
        <div class="auth-card-wrap">
          <div class="glass-card spotlight auth-card" id="auth-card">
            <h2 style="font-size:21px;font-weight:800">${title}</h2>
            <p style="font-size:13px;color:var(--muted-fg);margin-top:4px">${subtitle}</p>
            <div id="auth-error-slot" style="margin-top:12px"></div>
            ${formHtml}
            <div style="margin-top:18px;text-align:center;font-size:13.5px;color:var(--muted-fg)">${footerHtml}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderLogin() {
    return renderAuthWrapper(
      "Đăng nhập tài khoản",
      "Truy cập không gian quản lý học tập và đời sống sinh viên của bạn.",
      `
      <form id="login-form" class="auth-form">
        <div class="float-group">
          <span class="float-icon">${icon("mail", 16)}</span>
          <input class="float-input" id="login-email" type="email" required placeholder=" " autocomplete="email" />
          <label class="float-label" for="login-email">Email sinh viên</label>
        </div>
        <div>
          <div class="float-group">
            <span class="float-icon">${icon("lock", 16)}</span>
            <input class="float-input" id="login-pw" type="password" required placeholder=" " autocomplete="current-password" />
            <label class="float-label" for="login-pw">Mật khẩu</label>
            <button type="button" class="pw-toggle" data-toggle-pw="login-pw" aria-label="Hiện/ẩn mật khẩu">${icon("eye", 16)}</button>
          </div>
          <div style="text-align:right;margin-top:6px">
            <button type="button" class="btn-ghost" data-nav="forgot" style="border:none;background:none;color:var(--primary);font-size:12px;font-weight:600;cursor:pointer">Quên mật khẩu?</button>
          </div>
        </div>
        <button type="submit" id="login-submit" class="btn btn-primary btn-lg btn-shine" style="width:100%">Đăng nhập</button>
      </form>
      `,
      `Chưa có tài khoản STUDYHUB? <button type="button" data-nav="register" style="border:none;background:none;color:var(--primary);font-weight:700;cursor:pointer">Đăng ký ngay</button>`
    );
  }

  function renderRegister() {
    return renderAuthWrapper(
      "Tạo tài khoản sinh viên",
      "Mỗi tài khoản có không gian dữ liệu học tập và tài chính hoàn toàn riêng biệt.",
      `
      <form id="register-form" class="auth-form">
        <div class="float-group">
          <span class="float-icon">${icon("user", 16)}</span>
          <input class="float-input" id="reg-name" type="text" required placeholder=" " />
          <label class="float-label" for="reg-name">Họ và tên *</label>
        </div>
        <div class="float-group">
          <span class="float-icon">${icon("mail", 16)}</span>
          <input class="float-input" id="reg-email" type="email" required placeholder=" " autocomplete="email" />
          <label class="float-label" for="reg-email">Email *</label>
        </div>
        <div class="form-row-2">
          <div class="float-group">
            <span class="float-icon">${icon("cap", 16)}</span>
            <input class="float-input" id="reg-uni" type="text" placeholder=" " />
            <label class="float-label" for="reg-uni">Trường đại học</label>
          </div>
          <div class="float-group">
            <span class="float-icon">${icon("book", 16)}</span>
            <input class="float-input" id="reg-major" type="text" placeholder=" " />
            <label class="float-label" for="reg-major">Chuyên ngành</label>
          </div>
        </div>
        <div class="form-row-2">
          <div class="float-group">
            <span class="float-icon">${icon("lock", 16)}</span>
            <input class="float-input" id="reg-pw" type="password" required minlength="8" placeholder=" " autocomplete="new-password" />
            <label class="float-label" for="reg-pw">Mật khẩu *</label>
            <button type="button" class="pw-toggle" data-toggle-pw="reg-pw" aria-label="Hiện/ẩn mật khẩu">${icon("eye", 16)}</button>
          </div>
          <div class="float-group">
            <span class="float-icon">${icon("lock", 16)}</span>
            <input class="float-input" id="reg-pw2" type="password" required minlength="8" placeholder=" " autocomplete="new-password" />
            <label class="float-label" for="reg-pw2">Nhập lại mật khẩu *</label>
            <button type="button" class="pw-toggle" data-toggle-pw="reg-pw2" aria-label="Hiện/ẩn mật khẩu">${icon("eye", 16)}</button>
          </div>
        </div>
        <div id="reg-pw-meter"></div>
        <button type="submit" id="reg-submit" class="btn btn-primary btn-lg btn-shine" style="width:100%">Đăng ký tài khoản</button>
      </form>
      `,
      `Đã có tài khoản? <button type="button" data-nav="login" style="border:none;background:none;color:var(--primary);font-weight:700;cursor:pointer">Đăng nhập</button>`
    );
  }

  function renderForgot() {
    return renderAuthWrapper(
      "Quên mật khẩu",
      "Nhập email đã đăng ký để tạo liên kết đặt lại mật khẩu mới.",
      `
      <form id="forgot-form" class="auth-form">
        <div class="float-group">
          <span class="float-icon">${icon("mail", 16)}</span>
          <input class="float-input" id="forgot-email" type="email" required placeholder=" " />
          <label class="float-label" for="forgot-email">Email đăng ký</label>
        </div>
        <button type="submit" class="btn btn-primary btn-lg btn-shine" style="width:100%">Tạo liên kết đặt lại mật khẩu</button>
      </form>
      <div id="forgot-result" style="margin-top:12px"></div>
      `,
      `<button type="button" data-nav="login" style="border:none;background:none;color:var(--primary);font-weight:600;cursor:pointer">← Quay lại đăng nhập</button>`
    );
  }

  function renderReset() {
    return renderAuthWrapper(
      "Đặt lại mật khẩu mới",
      "Nhập mật khẩu mới cho tài khoản STUDYHUB của bạn.",
      `
      <form id="reset-form" class="auth-form">
        <div class="float-group">
          <span class="float-icon">${icon("lock", 16)}</span>
          <input class="float-input" id="reset-pw" type="password" required minlength="8" placeholder=" " />
          <label class="float-label" for="reset-pw">Mật khẩu mới *</label>
          <button type="button" class="pw-toggle" data-toggle-pw="reset-pw" aria-label="Hiện/ẩn">${icon("eye", 16)}</button>
        </div>
        <div class="float-group">
          <span class="float-icon">${icon("lock", 16)}</span>
          <input class="float-input" id="reset-pw2" type="password" required minlength="8" placeholder=" " />
          <label class="float-label" for="reset-pw2">Xác nhận mật khẩu *</label>
        </div>
        <button type="submit" class="btn btn-primary btn-lg btn-shine" style="width:100%">Lưu mật khẩu mới</button>
      </form>
      `,
      `<button type="button" data-nav="login" style="border:none;background:none;color:var(--primary);font-weight:600;cursor:pointer">← Quay lại đăng nhập</button>`
    );
  }

  // ==========================================================================
  // APP SHELL WRAPPER (Sidebar + Mobile Drawer + Mobile Bottom Nav)
  // ==========================================================================
  const NAV_GROUPS = [
    {
      label: "Học tập",
      items: [
        { id: "dashboard", label: "Dashboard", ic: "dashboard" },
        { id: "schedule", label: "Thời khóa biểu", ic: "calendar" },
        { id: "courses", label: "Môn học & Điểm", ic: "book" },
        { id: "tasks", label: "Bài tập & Công việc", ic: "checkSquare" },
        { id: "exams", label: "Lịch thi", ic: "fileText" },
        { id: "notes", label: "Ghi chú học tập", ic: "note" },
      ],
    },
    {
      label: "Đời sống & AI",
      items: [
        { id: "finance", label: "Chi tiêu sinh viên", ic: "wallet" },
        { id: "ai", label: "AI Study Assistant", ic: "sparkles", ai: true },
      ],
    },
    {
      label: "Tài khoản",
      items: [{ id: "settings", label: "Hồ sơ & Cài đặt", ic: "settings" }],
    },
  ];

  function renderSidebarInner(user, isDrawer) {
    const initials = (user.full_name || "SV")
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((s) => s[0].toUpperCase())
      .join("");
    return `
      <div class="sidebar-brand">
        <a href="#dashboard" class="brand" style="min-width:0">
          <div class="brand-logo">${icon("cap", 20)}</div>
          <div class="hide-collapsed" style="min-width:0">
            <div class="brand-title truncate">STUDYHUB</div>
            <div class="brand-sub truncate">Smart Student OS</div>
          </div>
        </a>
        ${
          isDrawer
            ? `<button type="button" class="btn btn-ghost btn-icon" id="btn-close-drawer" aria-label="Đóng menu">${icon("x", 18)}</button>`
            : `<button type="button" class="btn btn-ghost btn-icon hide-collapsed" id="btn-collapse-sidebar" title="Thu gọn thanh bên" aria-label="Thu gọn thanh bên">${icon("panelLeft", 17)}</button>`
        }
      </div>
      ${
        !isDrawer && state.sidebarCollapsed
          ? `<div style="display:flex;justify-content:center;padding-top:8px"><button type="button" class="btn btn-ghost btn-icon" id="btn-collapse-sidebar" title="Mở rộng thanh bên" aria-label="Mở rộng thanh bên">${icon("panelLeft", 17)}</button></div>`
          : ""
      }
      <nav class="sidebar-nav">
        ${NAV_GROUPS.map(
          (g) => `
          <div>
            <div class="nav-group-label hide-collapsed">${g.label}</div>
            <div style="display:flex;flex-direction:column;gap:3px">
              ${g.items
                .map(
                  (it) => `
                <button type="button" class="nav-link ${state.route === it.id ? "active" : ""}" data-nav="${it.id}" title="${it.label}">
                  ${icon(it.ic, 17)}
                  <span class="hide-collapsed truncate" style="flex:1">${it.label}</span>
                  ${it.ai && state.route !== it.id ? '<span class="badge badge-primary hide-collapsed" style="font-size:10px;padding:1px 6px">AI</span>' : ""}
                </button>
              `
                )
                .join("")}
            </div>
          </div>
        `
        ).join("")}
      </nav>
      <div class="sidebar-footer">
        <div class="user-pill">
          <div class="avatar" style="background:${esc(user.avatar_color || "#2563eb")}">${esc(initials)}</div>
          <div class="hide-collapsed" style="min-width:0;flex:1">
            <div class="truncate" style="font-size:13px;font-weight:700">${esc(user.full_name)}</div>
            <div class="truncate" style="font-size:11px;color:var(--muted-fg)">${esc(user.current_semester || user.email)}</div>
          </div>
        </div>
        ${
          !(global.StudyHubPWA && global.StudyHubPWA.isStandalone())
            ? `<button type="button" class="btn btn-outline btn-sm" data-pwa-install style="justify-content:center;border-color:rgba(37,99,235,0.35);color:var(--primary)" title="Tải app STUDYHUB về máy">
                ${icon("download", 15)} <span class="hide-collapsed">Tải app về máy</span>
              </button>`
            : ""
        }
        <button type="button" class="btn btn-ghost btn-sm" id="${isDrawer ? "btn-logout-drawer" : "btn-logout"}" style="justify-content:center;color:var(--rose)">
          ${icon("logout", 15)} <span class="hide-collapsed">Đăng xuất</span>
        </button>
      </div>
    `;
  }

  function renderAppShell(user, pageHtml) {
    const activeItem = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === state.route);
    return `
      <div class="app-shell">
        <aside class="sidebar ${state.sidebarCollapsed ? "collapsed" : ""}">
          ${renderSidebarInner(user, false)}
        </aside>

        ${
          state.mobileDrawer
            ? `<div class="drawer-backdrop" id="drawer-backdrop"><aside class="drawer-panel">${renderSidebarInner(user, true)}</aside></div>`
            : ""
        }

        <div class="app-main-wrap ${state.sidebarCollapsed ? "sidebar-collapsed" : ""}">
          <header class="topbar">
            <div class="row" style="min-width:0">
              <button type="button" class="btn btn-ghost btn-icon mobile-only" id="btn-open-drawer" aria-label="Mở menu">
                ${icon("menu", 20)}
              </button>
              <div style="min-width:0">
                <h1 class="truncate" style="font-size:17px;font-weight:800">${esc(activeItem ? activeItem.label : "STUDYHUB")}</h1>
                ${user.university ? `<p class="truncate" style="font-size:11.5px;color:var(--muted-fg)">${esc(user.university)}${user.major ? " • " + esc(user.major) : ""}</p>` : ""}
              </div>
            </div>
            <div class="row" style="gap:8px;flex-shrink:0">
              <button type="button" class="btn btn-outline btn-sm" data-nav="ai" style="border-color:rgba(79,70,229,0.35);color:var(--indigo)">
                ${icon("sparkles", 14)} <span class="hide-xs">Hỏi AI</span>
              </button>
              <button type="button" class="btn btn-ghost btn-icon" id="btn-theme-top" aria-label="Đổi giao diện sáng tối">
                ${icon(isDarkActive() ? "sun" : "moon", 18)}
              </button>
            </div>
          </header>

          <main class="app-content fade-page">
            ${pageHtml}
          </main>

          <nav class="mobile-nav" aria-label="Điều hướng nhanh điện thoại">
            ${[
              { id: "dashboard", label: "Tổng quan", ic: "dashboard" },
              { id: "schedule", label: "Lịch học", ic: "calendar" },
              { id: "tasks", label: "Bài tập", ic: "checkSquare" },
              { id: "ai", label: "Trợ lý AI", ic: "sparkles" },
            ]
              .map(
                (t) => `
              <button type="button" class="mobile-nav-btn ${state.route === t.id ? "active" : ""}" data-nav="${t.id}">
                ${icon(t.ic, 20)}
                <span>${t.label}</span>
              </button>
            `
              )
              .join("")}
            <button type="button" class="mobile-nav-btn ${state.mobileDrawer ? "active" : ""}" id="btn-mobile-more">
              ${icon("menu", 20)}
              <span>Thêm</span>
            </button>
          </nav>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // RENDER DISPATCHER & AUTH BINDINGS
  // ==========================================================================
  function showAuthError(msg) {
    const slot = document.getElementById("auth-error-slot");
    const card = document.getElementById("auth-card");
    if (slot) {
      slot.innerHTML = `<div class="alert alert-danger" role="alert"><span class="row" style="gap:8px">${icon("alert", 16)}<span>${esc(msg)}</span></span></div>`;
    }
    if (card) {
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
    }
  }

  function bindAuthEvents() {
    document.querySelectorAll("[data-toggle-pw]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.getAttribute("data-toggle-pw"));
        if (!input) return;
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        btn.innerHTML = icon(showing ? "eye" : "eyeOff", 16);
      });
    });

    const regPw = document.getElementById("reg-pw");
    if (regPw) {
      regPw.addEventListener("input", () => {
        const meter = document.getElementById("reg-pw-meter");
        if (!meter) return;
        const val = regPw.value;
        if (!val) { meter.innerHTML = ""; return; }
        const st = evaluatePwStrength(val);
        meter.innerHTML = `
          <div class="pw-strength">
            <div class="between"><span class="muted">Độ mạnh mật khẩu</span><strong style="color:${st.color}">${st.label}</strong></div>
            <div class="pw-bars">${[1, 2, 3, 4].map((s) => `<div class="pw-bar"><div class="pw-bar-fill" style="width:${st.score >= s ? "100%" : "0%"};background:${st.color}"></div></div>`).join("")}</div>
            <div class="row" style="gap:10px;font-size:11px">
              ${st.checks.map((c) => `<span style="color:${c.ok ? "#10b981" : "var(--muted-fg)"}">${c.ok ? "✓" : "•"} ${c.label}</span>`).join("")}
            </div>
          </div>
        `;
      });
    }

    const regForm = document.getElementById("register-form");
    if (regForm) {
      regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const full_name = document.getElementById("reg-name").value;
        const email = document.getElementById("reg-email").value;
        const university = document.getElementById("reg-uni").value;
        const major = document.getElementById("reg-major").value;
        const password = document.getElementById("reg-pw").value;
        const pw2 = document.getElementById("reg-pw2").value;

        if (password.length < 8) return showAuthError("Mật khẩu phải có ít nhất 8 ký tự.");
        if (password !== pw2) return showAuthError("Mật khẩu xác nhận không khớp.");

        const btn = document.getElementById("reg-submit");
        btn.disabled = true;
        btn.innerHTML = "Đang khởi tạo tài khoản...";
        try {
          await global.StudyHubStore.register({ full_name, email, password, university, major });
          btn.classList.remove("btn-primary");
          btn.classList.add("btn-success");
          btn.innerHTML = `${icon("check", 17)} Đăng ký thành công!`;
          global.StudyHubCharts.fireConfetti({ count: 90, x: 0.5, y: 0.6 });
          toast("Tạo tài khoản thành công!", "success", "Chào mừng bạn đến với STUDYHUB.");
          setTimeout(() => navigate("dashboard"), 800);
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = "Đăng ký tài khoản";
          showAuthError(err.message || "Không thể đăng ký tài khoản.");
        }
      });
    }

    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-pw").value;
        const btn = document.getElementById("login-submit");
        btn.disabled = true;
        btn.innerHTML = "Đang xác thực...";
        try {
          const user = await global.StudyHubStore.login({ email, password });
          btn.classList.remove("btn-primary");
          btn.classList.add("btn-success");
          btn.innerHTML = `${icon("check", 17)} Đăng nhập thành công!`;
          toast("Đăng nhập thành công", "success", `Chào mừng trở lại, ${user.full_name}!`);
          setTimeout(() => navigate("dashboard"), 550);
        } catch (err) {
          btn.disabled = false;
          btn.innerHTML = "Đăng nhập";
          showAuthError(err.message || "Email hoặc mật khẩu không chính xác.");
        }
      });
    }

    const forgotForm = document.getElementById("forgot-form");
    if (forgotForm) {
      forgotForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("forgot-email").value;
        const res = global.StudyHubStore.requestPasswordReset(email);
        const slot = document.getElementById("forgot-result");
        if (slot) {
          slot.innerHTML = `
            <div class="alert alert-info" style="flex-direction:column;gap:8px">
              <p>${esc(res.message)}</p>
              ${res.token ? `<button type="button" class="btn btn-primary btn-sm" id="btn-go-reset">Đặt lại mật khẩu ngay →</button>` : ""}
            </div>
          `;
          const goBtn = document.getElementById("btn-go-reset");
          if (goBtn) {
            goBtn.addEventListener("click", () => {
              state.resetToken = res.token;
              navigate("reset");
            });
          }
        }
      });
    }

    const resetForm = document.getElementById("reset-form");
    if (resetForm) {
      resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pw = document.getElementById("reset-pw").value;
        const pw2 = document.getElementById("reset-pw2").value;
        if (pw !== pw2) return showAuthError("Mật khẩu xác nhận không khớp.");
        try {
          await global.StudyHubStore.resetPassword(state.resetToken, pw);
          toast("Đặt lại mật khẩu thành công!", "success", "Bạn có thể đăng nhập bằng mật khẩu mới.");
          navigate("login");
        } catch (err) {
          showAuthError(err.message || "Không thể đặt lại mật khẩu.");
        }
      });
    }
  }

  function render() {
    const app = document.getElementById("app");
    const prevEl = document.activeElement;
    const prevFocus =
      prevEl && prevEl.id && (prevEl.tagName === "INPUT" || prevEl.tagName === "TEXTAREA")
        ? { id: prevEl.id, start: prevEl.selectionStart, end: prevEl.selectionEnd }
        : null;
    const user = global.StudyHubStore.getCurrentUser();

    if (!user) {
      if (state.route === "login") app.innerHTML = renderLogin();
      else if (state.route === "register") app.innerHTML = renderRegister();
      else if (state.route === "forgot") app.innerHTML = renderForgot();
      else if (state.route === "reset") app.innerHTML = renderReset();
      else app.innerHTML = renderLanding();

      document.getElementById("btn-theme-top")?.addEventListener("click", toggleTheme);
      document.querySelectorAll("[data-nav]").forEach((el) =>
        el.addEventListener("click", () => navigate(el.getAttribute("data-nav")))
      );
      bindAuthEvents();
      return;
    }

    const data = global.StudyHubStore.getUserData(user.id);
    const views = global.StudyHubViews;
    let content = "";
    switch (state.route) {
      case "schedule": content = views.renderSchedule(user, data); break;
      case "courses": content = views.renderCourses(user, data); break;
      case "tasks": content = views.renderTasks(user, data); break;
      case "exams": content = views.renderExams(user, data); break;
      case "notes": content = views.renderNotes(user, data); break;
      case "finance": content = views.renderFinance(user, data); break;
      case "ai": content = views.renderAI(user, data); break;
      case "settings": content = views.renderSettings(user, data); break;
      default: content = views.renderDashboard(user, data); break;
    }

    app.innerHTML = renderAppShell(user, content);

    // Common Shell Bindings
    document.getElementById("btn-theme-top")?.addEventListener("click", toggleTheme);
    document.getElementById("btn-open-drawer")?.addEventListener("click", () => {
      state.mobileDrawer = true;
      render();
    });
    document.getElementById("btn-mobile-more")?.addEventListener("click", () => {
      state.mobileDrawer = true;
      render();
    });
    document.getElementById("btn-close-drawer")?.addEventListener("click", () => {
      state.mobileDrawer = false;
      render();
    });
    document.getElementById("drawer-backdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "drawer-backdrop") {
        state.mobileDrawer = false;
        render();
      }
    });
    document.getElementById("btn-collapse-sidebar")?.addEventListener("click", () => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem("studyhub_sidebar_collapsed", String(state.sidebarCollapsed));
      render();
    });

    const handleLogout = () => {
      global.StudyHubStore.logout();
      toast("Đã đăng xuất khỏi STUDYHUB", "info");
      navigate("login");
    };
    document.getElementById("btn-logout")?.addEventListener("click", handleLogout);
    document.getElementById("btn-logout-drawer")?.addEventListener("click", handleLogout);

    document.querySelectorAll("[data-nav]").forEach((el) =>
      el.addEventListener("click", () => navigate(el.getAttribute("data-nav")))
    );

    // Bind active page interactions + animate numbers
    views.bindViewEvents(state.route, user, data);
    global.StudyHubCharts.animateCountUps(app);

    // Restore focus & caret position for live-search inputs
    if (prevFocus) {
      const nextEl = document.getElementById(prevFocus.id);
      if (nextEl) {
        nextEl.focus({ preventScroll: true });
        if (typeof prevFocus.start === "number" && typeof nextEl.setSelectionRange === "function") {
          try { nextEl.setSelectionRange(prevFocus.start, prevFocus.end); } catch {}
        }
      }
    }
  }

  global.StudyHubApp = {
    COLORS,
    DAY_NAMES,
    DAY_SHORT,
    PRIORITY_LABELS,
    STATUS_LABELS,
    EXAM_FORMATS,
    EXPENSE_CATS,
    INCOME_CATS,
    state,
    icon,
    esc,
    formatVND,
    formatDateTimeVN,
    formatDateVN,
    getTodayISO,
    toDateTimeLocal,
    getMonthKey,
    getIsoDow,
    getCountdown,
    isScheduleActiveOn,
    getThemeSetting,
    applyTheme,
    toast,
    openModal,
    closeModal,
    navigate,
    render,
    refreshPWAButtons: () => {
      if (state.route === "settings") render();
    },
    evaluatePwStrength,
  };

  window.addEventListener("DOMContentLoaded", () => {
    syncRouteFromHash();
    render();
  });
})(window);
