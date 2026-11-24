/* ============================================================================
   STUDYHUB STORAGE, AUTH & DOMAIN LOGIC (Per-User Isolated Persistent Store)
   ============================================================================ */
(function (global) {
  "use strict";

  const USERS_KEY = "studyhub_v2_users";
  const SESSION_KEY = "studyhub_v2_session";
  const RESET_KEY = "studyhub_v2_resets";
  const DATA_PREFIX = "studyhub_v2_data_";
  const AI_CFG_PREFIX = "studyhub_v2_aicfg_";

  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  // Fallback pure-JS hash if crypto.subtle unavailable (e.g., file:// context)
  function fallbackHash(str) {
    let h1 = 0xdeadbeef ^ str.length;
    let h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
  }

  async function hashPassword(password, salt) {
    const actualSalt = salt || uuid().replace(/-/g, "");
    const payload = actualSalt + "::studyhub::" + password;
    try {
      if (typeof crypto !== "undefined" && crypto.subtle) {
        const bytes = new TextEncoder().encode(payload);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const hex = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        return { hash: "sha256:" + hex, salt: actualSalt };
      }
    } catch (_) {
      // fall back cleanly
    }
    return { hash: "fb:" + fallbackHash(payload), salt: actualSalt };
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function getUsers() {
    return readJson(USERS_KEY, []);
  }

  function saveUsers(users) {
    writeJson(USERS_KEY, users);
  }

  function emptyUserData() {
    return {
      courses: [],
      schedule: [],
      tasks: [],
      exams: [],
      notes: [],
      transactions: [],
      budgets: {},
      aiConversations: [],
      activities: [],
    };
  }

  function getUserData(userId) {
    const data = readJson(DATA_PREFIX + userId, null);
    if (!data) {
      const fresh = emptyUserData();
      writeJson(DATA_PREFIX + userId, fresh);
      return fresh;
    }
    return Object.assign(emptyUserData(), data);
  }

  function saveUserData(userId, data) {
    writeJson(DATA_PREFIX + userId, data);
  }

  function logActivity(userId, actionType, title, details) {
    const data = getUserData(userId);
    data.activities.unshift({
      id: uuid(),
      action_type: actionType,
      title: title,
      details: details || "",
      created_at: nowIso(),
    });
    data.activities = data.activities.slice(0, 40);
    saveUserData(userId, data);
  }

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  function getCurrentUser() {
    const session = readJson(SESSION_KEY, null);
    if (!session || !session.userId) return null;
    const user = getUsers().find((u) => u.id === session.userId);
    if (!user) return null;
    const safe = Object.assign({}, user);
    delete safe.password_hash;
    delete safe.password_salt;
    return safe;
  }

  async function register({ full_name, email, password, university = "", major = "" }) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(full_name || "").trim();
    if (cleanName.length < 2) throw { code: "VALIDATION", message: "Họ và tên cần ít nhất 2 ký tự." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw { code: "VALIDATION", message: "Địa chỉ email không hợp lệ." };
    }
    if (!password || password.length < 8) {
      throw { code: "VALIDATION", message: "Mật khẩu phải có ít nhất 8 ký tự." };
    }

    const users = getUsers();
    if (users.some((u) => u.email === cleanEmail)) {
      throw {
        code: "EMAIL_EXISTS",
        message: "Email đã tồn tại trong hệ thống. Vui lòng đăng nhập hoặc dùng email khác.",
      };
    }

    const { hash, salt } = await hashPassword(password);
    const id = uuid();
    const now = nowIso();
    const newUser = {
      id,
      email: cleanEmail,
      full_name: cleanName,
      student_code: "",
      university: String(university || "").trim(),
      major: String(major || "").trim(),
      academic_year: "Năm 1",
      current_semester: "HK1 2026-2027",
      gpa_target: 3.6,
      monthly_budget_default: 3500000,
      avatar_color: "#2563eb",
      password_hash: hash,
      password_salt: salt,
      created_at: now,
      updated_at: now,
    };

    users.push(newUser);
    saveUsers(users);
    saveUserData(id, emptyUserData());
    logActivity(id, "profile", "Khởi tạo tài khoản STUDYHUB", `Chào mừng ${cleanName} đến với STUDYHUB`);
    writeJson(SESSION_KEY, { userId: id, created_at: now });
    return getCurrentUser();
  }

  async function login({ email, password }) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const users = getUsers();
    const found = users.find((u) => u.email === cleanEmail);
    if (!found) {
      throw { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không chính xác." };
    }
    const { hash } = await hashPassword(password, found.password_salt);
    if (hash !== found.password_hash) {
      throw { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không chính xác." };
    }
    writeJson(SESSION_KEY, { userId: found.id, created_at: nowIso() });
    return getCurrentUser();
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function requestPasswordReset(email) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const found = getUsers().find((u) => u.email === cleanEmail);
    if (!found) {
      return {
        found: false,
        message: "Nếu email tồn tại trên trình duyệt này, mã đặt lại mật khẩu đã được tạo.",
      };
    }
    const token = uuid().replace(/-/g, "");
    const resets = readJson(RESET_KEY, {});
    resets[token] = {
      userId: found.id,
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    writeJson(RESET_KEY, resets);
    return {
      found: true,
      token,
      message:
        "Phiên bản web tĩnh lưu dữ liệu cục bộ trên trình duyệt nên không gửi email tự động. Bấm nút bên dưới để đặt lại mật khẩu ngay (hiệu lực 30 phút).",
    };
  }

  async function resetPassword(token, newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw { code: "VALIDATION", message: "Mật khẩu mới cần ít nhất 8 ký tự." };
    }
    const resets = readJson(RESET_KEY, {});
    const record = resets[token];
    if (!record || record.expiresAt < Date.now()) {
      throw { code: "INVALID_TOKEN", message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." };
    }
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === record.userId);
    if (idx === -1) throw { code: "NOT_FOUND", message: "Không tìm thấy tài khoản." };
    const { hash, salt } = await hashPassword(newPassword);
    users[idx].password_hash = hash;
    users[idx].password_salt = salt;
    users[idx].updated_at = nowIso();
    saveUsers(users);
    delete resets[token];
    writeJson(RESET_KEY, resets);
  }

  async function changePassword(userId, currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw { code: "VALIDATION", message: "Mật khẩu mới cần ít nhất 8 ký tự." };
    }
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw { code: "NOT_FOUND", message: "Không tìm thấy tài khoản." };
    const check = await hashPassword(currentPassword, users[idx].password_salt);
    if (check.hash !== users[idx].password_hash) {
      throw { code: "WRONG_PASSWORD", message: "Mật khẩu hiện tại không chính xác." };
    }
    const next = await hashPassword(newPassword);
    users[idx].password_hash = next.hash;
    users[idx].password_salt = next.salt;
    users[idx].updated_at = nowIso();
    saveUsers(users);
    logActivity(userId, "profile", "Đổi mật khẩu tài khoản", "Cập nhật bảo mật thành công");
  }

  function updateProfile(userId, patch) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw { code: "NOT_FOUND", message: "Không tìm thấy hồ sơ." };
    const allowed = [
      "full_name",
      "student_code",
      "university",
      "major",
      "academic_year",
      "current_semester",
      "gpa_target",
      "monthly_budget_default",
      "avatar_color",
    ];
    for (const k of allowed) {
      if (patch[k] !== undefined) users[idx][k] = patch[k];
    }
    users[idx].updated_at = nowIso();
    saveUsers(users);
    logActivity(userId, "profile", "Cập nhật hồ sơ cá nhân", users[idx].full_name);
    return getCurrentUser();
  }

  // ==========================================================================
  // GPA & GRADE CALCULATIONS (Vietnam University Scale)
  // ==========================================================================
  function score10ToGpa4(score10) {
    if (score10 >= 9.0) return { gpa4: 4.0, letter: "A+" };
    if (score10 >= 8.5) return { gpa4: 4.0, letter: "A" };
    if (score10 >= 8.0) return { gpa4: 3.5, letter: "B+" };
    if (score10 >= 7.0) return { gpa4: 3.0, letter: "B" };
    if (score10 >= 6.5) return { gpa4: 2.5, letter: "C+" };
    if (score10 >= 5.5) return { gpa4: 2.0, letter: "C" };
    if (score10 >= 5.0) return { gpa4: 1.5, letter: "D+" };
    if (score10 >= 4.0) return { gpa4: 1.0, letter: "D" };
    return { gpa4: 0.0, letter: "F" };
  }

  function getAcademicStanding(gpa4) {
    if (gpa4 === null) return "Chưa có điểm";
    if (gpa4 >= 3.6) return "Xuất sắc";
    if (gpa4 >= 3.2) return "Giỏi";
    if (gpa4 >= 2.5) return "Khá";
    if (gpa4 >= 2.0) return "Trung bình";
    return "Cảnh báo học vụ";
  }

  function calculateCourseGrade(components = []) {
    const totalWeight = components.reduce((s, c) => s + Number(c.weight || 0), 0);
    const scored = components.filter(
      (c) => c.score !== null && c.score !== undefined && c.score !== "" && !Number.isNaN(Number(c.score))
    );
    const scoredWeight = scored.reduce((s, c) => s + Number(c.weight || 0), 0);
    if (scored.length === 0 || scoredWeight <= 0) {
      return {
        totalWeight: Math.round(totalWeight * 100) / 100,
        scoredWeight: 0,
        finalScore10: null,
        gpa4: null,
        letterGrade: "--",
      };
    }
    const wSum = scored.reduce((s, c) => s + Number(c.score) * Number(c.weight), 0);
    const finalScore10 = Math.round((wSum / scoredWeight) * 100) / 100;
    const conv = score10ToGpa4(finalScore10);
    return {
      totalWeight: Math.round(totalWeight * 100) / 100,
      scoredWeight: Math.round(scoredWeight * 100) / 100,
      finalScore10,
      gpa4: conv.gpa4,
      letterGrade: conv.letter,
    };
  }

  function calculateOverallGpa(courses = []) {
    let wGpa4 = 0, wScore10 = 0, gradedCredits = 0, totalCredits = 0;
    const semMap = new Map();
    for (const c of courses) {
      const cr = Number(c.credits) || 0;
      totalCredits += cr;
      const sem = c.semester || "Chưa phân kỳ";
      if (!semMap.has(sem)) semMap.set(sem, { w4: 0, w10: 0, gcr: 0, cr: 0, count: 0 });
      const acc = semMap.get(sem);
      acc.cr += cr;
      acc.count += 1;
      const sum = calculateCourseGrade(c.grade_components);
      if (sum.finalScore10 !== null && sum.gpa4 !== null) {
        wGpa4 += sum.gpa4 * cr;
        wScore10 += sum.finalScore10 * cr;
        gradedCredits += cr;
        acc.w4 += sum.gpa4 * cr;
        acc.w10 += sum.finalScore10 * cr;
        acc.gcr += cr;
      }
    }
    const gpa4 = gradedCredits > 0 ? Math.round((wGpa4 / gradedCredits) * 100) / 100 : null;
    const gpa10 = gradedCredits > 0 ? Math.round((wScore10 / gradedCredits) * 100) / 100 : null;
    const bySemester = Array.from(semMap.entries()).map(([semester, d]) => ({
      semester,
      gpa4: d.gcr > 0 ? Math.round((d.w4 / d.gcr) * 100) / 100 : null,
      gpa10: d.gcr > 0 ? Math.round((d.w10 / d.gcr) * 100) / 100 : null,
      credits: d.cr,
      courseCount: d.count,
    }));
    return { gpa4, gpa10, totalCredits, gradedCredits, standing: getAcademicStanding(gpa4), bySemester };
  }

  // ==========================================================================
  // DOMAIN CRUD HELPERS
  // ==========================================================================
  function saveCourse(userId, payload, editId) {
    const data = getUserData(userId);
    const now = nowIso();
    if (editId) {
      const idx = data.courses.findIndex((c) => c.id === editId);
      if (idx === -1) return null;
      data.courses[idx] = Object.assign({}, data.courses[idx], payload, { updated_at: now });
      saveUserData(userId, data);
      logActivity(userId, "course", `Cập nhật môn học ${payload.code}`, payload.name);
      return data.courses[idx];
    }
    const item = Object.assign(
      {
        id: uuid(),
        grade_components: [
          { id: uuid(), name: "Chuyên cần", weight: 10, score: null },
          { id: uuid(), name: "Giữa kỳ", weight: 30, score: null },
          { id: uuid(), name: "Cuối kỳ", weight: 60, score: null },
        ],
        created_at: now,
        updated_at: now,
      },
      payload
    );
    data.courses.unshift(item);
    saveUserData(userId, data);
    logActivity(userId, "course", `Thêm môn học ${payload.code}`, payload.name);
    return item;
  }

  function deleteCourse(userId, id) {
    const data = getUserData(userId);
    const found = data.courses.find((c) => c.id === id);
    if (!found) return;
    data.courses = data.courses.filter((c) => c.id !== id);
    saveUserData(userId, data);
    logActivity(userId, "course", `Xóa môn học ${found.code}`, found.name);
  }

  function saveCourseGrades(userId, courseId, components) {
    const data = getUserData(userId);
    const idx = data.courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return null;
    data.courses[idx].grade_components = components.map((c) => ({
      id: c.id || uuid(),
      name: c.name,
      weight: Number(c.weight),
      score: c.score === "" || c.score === null || c.score === undefined ? null : Number(c.score),
    }));
    data.courses[idx].updated_at = nowIso();
    saveUserData(userId, data);
    const summary = calculateCourseGrade(data.courses[idx].grade_components);
    logActivity(
      userId,
      "grade",
      `Cập nhật điểm môn ${data.courses[idx].code}`,
      summary.finalScore10 !== null ? `Tổng kết: ${summary.finalScore10}/10 (${summary.letterGrade})` : "Đã lưu trọng số"
    );
    return summary;
  }

  function saveScheduleItem(userId, payload, editId) {
    const data = getUserData(userId);
    const now = nowIso();
    if (editId) {
      const idx = data.schedule.findIndex((s) => s.id === editId);
      if (idx === -1) return null;
      data.schedule[idx] = Object.assign({}, data.schedule[idx], payload, { updated_at: now });
      saveUserData(userId, data);
      logActivity(userId, "schedule", `Cập nhật lịch học: ${payload.title}`, `${payload.start_time} - ${payload.end_time}`);
      return data.schedule[idx];
    }
    const item = Object.assign({ id: uuid(), created_at: now, updated_at: now }, payload);
    data.schedule.push(item);
    saveUserData(userId, data);
    logActivity(userId, "schedule", `Thêm lịch học: ${payload.title}`, `${payload.start_time} - ${payload.end_time}`);
    return item;
  }

  function deleteScheduleItem(userId, id) {
    const data = getUserData(userId);
    const found = data.schedule.find((s) => s.id === id);
    if (!found) return;
    data.schedule = data.schedule.filter((s) => s.id !== id);
    saveUserData(userId, data);
    logActivity(userId, "schedule", `Xóa lịch học: ${found.title}`, "");
  }

  function saveTask(userId, payload, editId) {
    const data = getUserData(userId);
    const now = nowIso();
    if (editId) {
      const idx = data.tasks.findIndex((t) => t.id === editId);
      if (idx === -1) return null;
      const prevStatus = data.tasks[idx].status;
      const nextStatus = payload.status !== undefined ? payload.status : prevStatus;
      const completed_at = nextStatus === "done" ? data.tasks[idx].completed_at || now : null;
      data.tasks[idx] = Object.assign({}, data.tasks[idx], payload, { completed_at, updated_at: now });
      saveUserData(userId, data);
      if (nextStatus === "done" && prevStatus !== "done") {
        logActivity(userId, "task", "Hoàn thành công việc", data.tasks[idx].title);
      }
      return data.tasks[idx];
    }
    const item = Object.assign(
      {
        id: uuid(),
        completed_at: payload.status === "done" ? now : null,
        created_at: now,
        updated_at: now,
      },
      payload
    );
    data.tasks.unshift(item);
    saveUserData(userId, data);
    logActivity(userId, "task", "Tạo bài tập / công việc", payload.title);
    return item;
  }

  function deleteTask(userId, id) {
    const data = getUserData(userId);
    const found = data.tasks.find((t) => t.id === id);
    if (!found) return;
    data.tasks = data.tasks.filter((t) => t.id !== id);
    saveUserData(userId, data);
    logActivity(userId, "task", "Xóa công việc", found.title);
  }

  function saveExam(userId, payload, editId) {
    const data = getUserData(userId);
    const now = nowIso();
    if (editId) {
      const idx = data.exams.findIndex((e) => e.id === editId);
      if (idx === -1) return null;
      data.exams[idx] = Object.assign({}, data.exams[idx], payload, { updated_at: now });
      saveUserData(userId, data);
      logActivity(userId, "exam", "Cập nhật lịch thi", payload.title);
      return data.exams[idx];
    }
    const item = Object.assign({ id: uuid(), created_at: now, updated_at: now }, payload);
    data.exams.push(item);
    saveUserData(userId, data);
    logActivity(userId, "exam", "Thêm lịch thi", payload.title);
    return item;
  }

  function deleteExam(userId, id) {
    const data = getUserData(userId);
    const found = data.exams.find((e) => e.id === id);
    if (!found) return;
    data.exams = data.exams.filter((e) => e.id !== id);
    saveUserData(userId, data);
    logActivity(userId, "exam", "Xóa lịch thi", found.title);
  }

  function saveNote(userId, payload, editId) {
    const data = getUserData(userId);
    const now = nowIso();
    if (editId) {
      const idx = data.notes.findIndex((n) => n.id === editId);
      if (idx === -1) return null;
      data.notes[idx] = Object.assign({}, data.notes[idx], payload, { updated_at: now });
      saveUserData(userId, data);
      logActivity(userId, "note", "Cập nhật ghi chú", payload.title);
      return data.notes[idx];
    }
    const item = Object.assign({ id: uuid(), created_at: now, updated_at: now }, payload);
    data.notes.unshift(item);
    saveUserData(userId, data);
    logActivity(userId, "note", "Tạo ghi chú học tập", payload.title);
    return item;
  }

  function deleteNote(userId, id) {
    const data = getUserData(userId);
    const found = data.notes.find((n) => n.id === id);
    if (!found) return;
    data.notes = data.notes.filter((n) => n.id !== id);
    saveUserData(userId, data);
    logActivity(userId, "note", "Xóa ghi chú", found.title);
  }

  function addTransaction(userId, payload) {
    const data = getUserData(userId);
    const now = nowIso();
    const item = Object.assign({ id: uuid(), created_at: now }, payload);
    data.transactions.unshift(item);
    saveUserData(userId, data);
    logActivity(
      userId,
      "finance",
      payload.type === "income" ? `Ghi nhận thu nhập: ${payload.category}` : `Ghi nhận chi tiêu: ${payload.category}`,
      Number(payload.amount).toLocaleString("vi-VN") + "₫"
    );
    return item;
  }

  function deleteTransaction(userId, id) {
    const data = getUserData(userId);
    const found = data.transactions.find((t) => t.id === id);
    if (!found) return;
    data.transactions = data.transactions.filter((t) => t.id !== id);
    saveUserData(userId, data);
    logActivity(userId, "finance", "Xóa giao dịch", found.category);
  }

  function setMonthlyBudget(userId, monthKey, amount) {
    const data = getUserData(userId);
    data.budgets[monthKey] = Number(amount);
    saveUserData(userId, data);
    logActivity(userId, "finance", `Cập nhật ngân sách tháng ${monthKey}`, Number(amount).toLocaleString("vi-VN") + "₫");
  }

  function getAIConfig(userId) {
    return readJson(AI_CFG_PREFIX + userId, {
      provider: "gemini",
      apiKey: "",
      model: "gemini-4-hydrogen",
      baseUrl: "",
    });
  }

  function saveAIConfig(userId, cfg) {
    writeJson(AI_CFG_PREFIX + userId, cfg);
  }

  function addAIMessagePair(userId, convId, mode, userText, assistantText) {
    const data = getUserData(userId);
    const now = nowIso();
    let conv = convId ? data.aiConversations.find((c) => c.id === convId) : null;
    if (!conv) {
      conv = {
        id: uuid(),
        title: userText.length > 48 ? userText.slice(0, 48).trim() + "…" : userText,
        mode,
        messages: [],
        created_at: now,
        updated_at: now,
      };
      data.aiConversations.unshift(conv);
    }
    conv.messages.push(
      { id: uuid(), role: "user", content: userText, created_at: now },
      { id: uuid(), role: "assistant", content: assistantText, created_at: now }
    );
    conv.updated_at = now;
    saveUserData(userId, data);
    logActivity(userId, "ai", "Sử dụng AI Study Assistant", conv.title);
    return conv;
  }

  function deleteAIConversation(userId, convId) {
    const data = getUserData(userId);
    data.aiConversations = data.aiConversations.filter((c) => c.id !== convId);
    saveUserData(userId, data);
  }

  function exportUserBackup(userId) {
    return JSON.stringify(
      {
        version: "studyhub-web-v2",
        exported_at: nowIso(),
        profile: getCurrentUser(),
        data: getUserData(userId),
      },
      null,
      2
    );
  }

  function importUserBackup(userId, jsonStr) {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !parsed.data || !Array.isArray(parsed.data.courses)) {
      throw new Error("File sao lưu không đúng định dạng STUDYHUB.");
    }
    saveUserData(userId, Object.assign(emptyUserData(), parsed.data));
    logActivity(userId, "profile", "Khôi phục dữ liệu từ file sao lưu JSON", "");
  }

  global.StudyHubStore = {
    uuid,
    getCurrentUser,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
    changePassword,
    updateProfile,
    getUserData,
    saveCourse,
    deleteCourse,
    saveCourseGrades,
    saveScheduleItem,
    deleteScheduleItem,
    saveTask,
    deleteTask,
    saveExam,
    deleteExam,
    saveNote,
    deleteNote,
    addTransaction,
    deleteTransaction,
    setMonthlyBudget,
    getAIConfig,
    saveAIConfig,
    addAIMessagePair,
    deleteAIConversation,
    exportUserBackup,
    importUserBackup,
    calculateCourseGrade,
    calculateOverallGpa,
    score10ToGpa4,
  };
})(window);
