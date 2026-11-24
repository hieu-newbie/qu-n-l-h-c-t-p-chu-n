/* ============================================================================
   STUDYHUB FEATURE VIEWS (Dashboard, Schedule, Courses, Tasks, Exams, Notes,
   Finance, AI Study Assistant, Settings)
   ============================================================================ */
(function (global) {
  "use strict";

  const A = () => global.StudyHubApp;
  const S = () => global.StudyHubStore;
  const C = () => global.StudyHubCharts;
  const AI = () => global.StudyHubAI;

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }

  function courseById(courses, id) {
    return courses.find((c) => c.id === id) || null;
  }

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // ==========================================================================
  // 1. DASHBOARD
  // ==========================================================================
  function renderDashboard(user, data) {
    const app = A();
    const gpa = S().calculateOverallGpa(data.courses);
    const today = new Date();
    const todaySched = data.schedule
      .filter((s) => app.isScheduleActiveOn(s, today))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const nowMs = Date.now();
    const pendingTasks = data.tasks.filter((t) => t.status !== "done");
    const doneTasks = data.tasks.filter((t) => t.status === "done");
    const overdueTasks = pendingTasks.filter((t) => t.due_date && new Date(t.due_date).getTime() < nowMs);
    const taskPct = data.tasks.length ? Math.round((doneTasks.length / data.tasks.length) * 100) : 0;
    const gpaTargetPct = gpa.gpa4 !== null && user.gpa_target > 0 ? Math.min(100, Math.round((gpa.gpa4 / user.gpa_target) * 100)) : 0;

    const upcomingExams = data.exams
      .filter((e) => new Date(e.exam_date).getTime() >= nowMs - 3600000)
      .sort((a, b) => a.exam_date.localeCompare(b.exam_date));
    const reminderExams = upcomingExams.filter((e) => app.getCountdown(e.exam_date).days <= Number(e.reminder_days ?? 3));

    const mk = app.getMonthKey(today);
    const mTx = data.transactions.filter((t) => t.transaction_date.startsWith(mk));
    const mExpense = mTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const mBudget = data.budgets[mk] !== undefined ? Number(data.budgets[mk]) : Number(user.monthly_budget_default || 0);
    const budgetPct = mBudget > 0 ? Math.round((mExpense / mBudget) * 100) : 0;
    const isOverBudget = mBudget > 0 && mExpense > mBudget;

    const gradedChartItems = data.courses
      .map((c) => {
        const sum = S().calculateCourseGrade(c.grade_components);
        return { code: c.code, name: c.name, score10: sum.finalScore10, color: c.color };
      })
      .filter((x) => x.score10 !== null)
      .slice(0, 8);

    const todayStr = today.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

    return `
      <div class="stack">
        <div class="page-head">
          <div>
            <p style="font-size:12px;text-transform:capitalize;color:var(--muted-fg)">${app.esc(todayStr)}</p>
            <h2 id="dash-greeting">${app.esc(greeting())}, ${app.esc(user.full_name)}</h2>
            <p>Học kỳ: <strong>${app.esc(user.current_semester)}</strong> • ${data.courses.filter((c) => c.status !== "completed").length} môn đang học (${gpa.totalCredits} tín chỉ)</p>
          </div>
          <div class="row">
            <button type="button" class="btn btn-outline btn-sm" data-nav="tasks">${app.icon("plus", 15)} Thêm bài tập</button>
            <button type="button" class="btn btn-primary btn-sm btn-shine" data-nav="ai">${app.icon("sparkles", 15)} Lập kế hoạch AI</button>
          </div>
        </div>

        ${
          overdueTasks.length || reminderExams.length || isOverBudget
            ? `<div class="grid-3">
                ${overdueTasks.length ? `<div class="alert alert-danger" style="cursor:pointer" data-nav="tasks"><span class="row">${app.icon("alert", 18)}<div><strong>${overdueTasks.length} công việc quá hạn</strong><div style="font-size:12px">Bấm để xử lý ngay</div></div></span>${app.icon("arrowRight", 16)}</div>` : ""}
                ${reminderExams.length ? `<div class="alert alert-warning" style="cursor:pointer" data-nav="exams"><span class="row">${app.icon("bell", 18)}<div><strong>Nhắc thi: ${app.esc(reminderExams[0].title)}</strong><div style="font-size:12px">${app.getCountdown(reminderExams[0].exam_date).label}</div></div></span>${app.icon("arrowRight", 16)}</div>` : ""}
                ${isOverBudget ? `<div class="alert alert-danger" style="cursor:pointer" data-nav="finance"><span class="row">${app.icon("wallet", 18)}<div><strong>Vượt ngân sách tháng ${mk}</strong><div style="font-size:12px">Vượt ${app.formatVND(mExpense - mBudget)}</div></div></span>${app.icon("arrowRight", 16)}</div>` : ""}
              </div>`
            : ""
        }

        <div class="grid-4">
          <div class="glass-card spotlight card-pad">
            <div class="between" style="align-items:flex-start">
              <div>
                <p class="card-desc">Điểm trung bình (GPA)</p>
                <div class="row" style="align-items:baseline;gap:6px;margin-top:6px">
                  <span class="tabular-nums" style="font-size:26px;font-weight:800;color:var(--primary)" ${gpa.gpa4 !== null ? `data-countup="${gpa.gpa4}" data-decimals="2"` : ""}>${gpa.gpa4 !== null ? gpa.gpa4.toFixed(2) : "--"}</span>
                  <span class="muted" style="font-size:12px">/ 4.0</span>
                </div>
                ${gpa.gpa10 !== null ? `<span class="badge badge-secondary" style="margin-top:6px">${gpa.gpa10.toFixed(2)}/10</span>` : ""}
              </div>
              ${C().renderProgressRing(gpaTargetPct, 52, "#2563eb", gpa.gpa4 !== null ? gpaTargetPct + "%" : "--")}
            </div>
            <p class="card-desc" style="margin-top:10px">Xếp loại: <strong style="color:var(--fg)">${gpa.standing}</strong> • Mục tiêu ${Number(user.gpa_target).toFixed(2)}</p>
          </div>

          <div class="glass-card spotlight card-pad">
            <div class="between" style="align-items:flex-start">
              <div>
                <p class="card-desc">Tiến độ bài tập</p>
                <div class="row" style="align-items:baseline;gap:6px;margin-top:6px">
                  <span class="tabular-nums" style="font-size:26px;font-weight:800" data-countup="${taskPct}" data-suffix="%">${taskPct}%</span>
                  <span class="muted" style="font-size:12px">${doneTasks.length}/${data.tasks.length}</span>
                </div>
              </div>
              ${C().renderProgressRing(taskPct, 52, "#10b981", taskPct + "%")}
            </div>
            <div class="progress-track" style="margin-top:10px"><div class="progress-fill" style="width:${taskPct}%;background:#10b981"></div></div>
            <p class="card-desc" style="margin-top:8px">Còn <strong>${pendingTasks.length}</strong> việc đang chờ${overdueTasks.length ? ` <span style="color:var(--rose);font-weight:700">(${overdueTasks.length} quá hạn)</span>` : ""}</p>
          </div>

          <div class="glass-card spotlight card-pad">
            <div class="between">
              <p class="card-desc">Kỳ thi sắp tới</p>
              <span style="color:var(--amber)">${app.icon("fileText", 18)}</span>
            </div>
            <div style="font-size:26px;font-weight:800;margin-top:6px" class="tabular-nums" data-countup="${upcomingExams.length}">${upcomingExams.length}</div>
            <p class="card-desc truncate" style="margin-top:12px">
              ${upcomingExams[0] ? `Gần nhất: <strong style="color:var(--fg)">${app.esc(upcomingExams[0].title)}</strong> (${app.getCountdown(upcomingExams[0].exam_date).label})` : "Chưa có lịch thi sắp tới"}
            </p>
          </div>

          <div class="glass-card spotlight card-pad">
            <div class="between">
              <p class="card-desc">Chi tiêu tháng ${mk}</p>
              <span class="tabular-nums" style="font-size:12px;font-weight:700;color:${isOverBudget ? "var(--rose)" : budgetPct >= 80 ? "var(--amber)" : "var(--teal)"}">${budgetPct}%</span>
            </div>
            <div style="font-size:22px;font-weight:800;margin-top:6px" class="tabular-nums truncate" data-countup="${mExpense}" data-format="vnd">${app.formatVND(mExpense)}</div>
            <div class="progress-track" style="margin-top:10px"><div class="progress-fill" style="width:${Math.min(100, budgetPct)}%;background:${isOverBudget ? "var(--rose)" : budgetPct >= 80 ? "var(--amber)" : "var(--teal)"}"></div></div>
            <p class="card-desc truncate" style="margin-top:8px">${mBudget > 0 ? (isOverBudget ? `Vượt ${app.formatVND(mExpense - mBudget)}` : `Còn ${app.formatVND(mBudget - mExpense)} / ${app.formatVND(mBudget)}`) : "Chưa đặt ngân sách"}</p>
          </div>
        </div>

        <div class="grid-12">
          <div class="glass-card card-pad col-5">
            <div class="card-header">
              <div><div class="card-title">${app.icon("calendar", 17)} Thời khóa biểu hôm nay</div><div class="card-desc">${todaySched.length} buổi học</div></div>
              <button type="button" class="btn btn-ghost btn-sm" data-nav="schedule">Xem tuần →</button>
            </div>
            ${
              todaySched.length === 0
                ? `<div class="empty-state"><div class="empty-icon">${app.icon("calendar", 22)}</div><strong>Hôm nay trống lịch học</strong><p class="card-desc">Thêm lịch học theo tuần để theo dõi dễ dàng.</p><button type="button" class="btn btn-outline btn-sm" data-nav="schedule">Quản lý lịch học</button></div>`
                : `<div class="stack" style="gap:10px">${todaySched
                    .map(
                      (s) => `
                  <div class="schedule-slot" style="border-left-color:${app.esc(s.color || "#2563eb")}" data-nav="schedule">
                    <div class="between"><strong style="font-size:14px">${app.esc(s.title)}</strong><span class="badge badge-outline tabular-nums">${app.esc(s.start_time)} – ${app.esc(s.end_time)}</span></div>
                    <div class="row card-desc" style="margin-top:5px">${s.room ? `<span>Phòng: ${app.esc(s.room)}</span>` : ""}${s.instructor ? `<span>GV: ${app.esc(s.instructor)}</span>` : ""}</div>
                  </div>
                `
                    )
                    .join("")}</div>`
            }
          </div>

          <div class="glass-card card-pad col-7">
            <div class="card-header">
              <div><div class="card-title">${app.icon("clock", 17)} Công việc sắp đến hạn</div><div class="card-desc">Bấm vòng tròn để hoàn thành nhanh</div></div>
              <button type="button" class="btn btn-ghost btn-sm" data-nav="tasks">Tất cả →</button>
            </div>
            ${
              pendingTasks.length === 0
                ? `<div class="empty-state"><div class="empty-icon">${app.icon("checkCircle", 22)}</div><strong>Không có bài tập tồn đọng</strong><button type="button" class="btn btn-outline btn-sm" data-nav="tasks">Thêm bài tập</button></div>`
                : `<div class="stack" style="gap:9px">${pendingTasks
                    .slice(0, 6)
                    .map((t) => {
                      const ov = t.due_date && new Date(t.due_date).getTime() < nowMs;
                      const c = courseById(data.courses, t.course_id);
                      return `
                        <div class="glass-card spotlight" style="padding:11px 13px;${ov ? "border-color:rgba(244,63,94,0.45);background:rgba(244,63,94,0.05)" : ""}">
                          <div class="row" style="align-items:flex-start;flex-wrap:nowrap">
                            <button type="button" class="btn-ghost" data-quick-done="${t.id}" style="border:none;background:none;cursor:pointer;padding:2px;color:var(--muted-fg)" aria-label="Hoàn thành ${app.esc(t.title)}">${app.icon("circle", 19)}</button>
                            <div style="flex:1;min-width:0">
                              <div class="row" style="gap:6px">
                                <strong style="font-size:13.5px">${app.esc(t.title)}</strong>
                                ${c ? `<span class="badge badge-secondary">${app.esc(c.code)}</span>` : ""}
                                <span class="badge ${t.priority === "urgent" || t.priority === "high" ? "badge-danger" : t.priority === "medium" ? "badge-warning" : "badge-outline"}">${app.PRIORITY_LABELS[t.priority]}</span>
                              </div>
                              <p style="font-size:12px;margin-top:3px;color:${ov ? "var(--rose)" : "var(--muted-fg)"}">${ov ? "Quá hạn: " : "Hạn nộp: "}${app.formatDateTimeVN(t.due_date)}</p>
                            </div>
                          </div>
                        </div>
                      `;
                    })
                    .join("")}</div>`
            }
          </div>
        </div>

        <div class="grid-12">
          <div class="glass-card card-pad col-5">
            <div class="card-header">
              <div><div class="card-title">${app.icon("award", 17)} Biểu đồ điểm các môn</div><div class="card-desc">Điểm tổng kết dự kiến (thang 10)</div></div>
              <button type="button" class="btn btn-ghost btn-sm" data-nav="courses">Chi tiết</button>
            </div>
            ${gradedChartItems.length ? C().renderCourseBarChart(gradedChartItems) : `<div class="empty-state"><div class="empty-icon">${app.icon("book", 22)}</div><strong>Chưa có điểm môn học</strong><p class="card-desc">Thêm môn học & nhập điểm thành phần để xem biểu đồ.</p></div>`}
          </div>

          <div class="glass-card card-pad col-4">
            <div class="card-header">
              <div><div class="card-title">${app.icon("fileText", 17)} Lịch thi sắp tới</div><div class="card-desc">Đếm ngược tự động</div></div>
              <button type="button" class="btn btn-ghost btn-sm" data-nav="exams">Xem hết</button>
            </div>
            ${
              upcomingExams.length === 0
                ? `<div class="empty-state"><div class="empty-icon">${app.icon("fileText", 22)}</div><strong>Chưa có lịch thi</strong><button type="button" class="btn btn-outline btn-sm" data-nav="exams">Thêm lịch thi</button></div>`
                : `<div class="stack" style="gap:9px">${upcomingExams
                    .slice(0, 4)
                    .map((ex) => {
                      const cd = app.getCountdown(ex.exam_date);
                      return `
                        <div class="glass-card" style="padding:11px">
                          <div class="between"><strong style="font-size:13.5px">${app.esc(ex.title)}</strong><span class="badge ${cd.days <= ex.reminder_days ? "badge-danger" : "badge-secondary"}">${cd.label}</span></div>
                          <p class="card-desc" style="margin-top:4px">${app.formatDateTimeVN(ex.exam_date)} • ${app.EXAM_FORMATS[ex.exam_format] || ex.exam_format}</p>
                        </div>
                      `;
                    })
                    .join("")}</div>`
            }
          </div>

          <div class="glass-card card-pad col-3">
            <div class="card-header"><div><div class="card-title">${app.icon("clock", 17)} Hoạt động gần đây</div><div class="card-desc">Nhật ký thao tác</div></div></div>
            <div class="stack" style="gap:10px;max-height:240px;overflow-y:auto">
              ${data.activities.length ? data.activities.slice(0, 10).map((a) => `<div style="font-size:12px;border-left:2px solid var(--primary);padding-left:9px"><strong>${app.esc(a.title)}</strong>${a.details ? `<div class="muted truncate">${app.esc(a.details)}</div>` : ""}<div style="font-size:11px;color:var(--muted-fg)">${app.formatDateTimeVN(a.created_at)}</div></div>`).join("") : '<p class="card-desc" style="text-align:center;padding:20px 0">Chưa có hoạt động nào.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 2. SCHEDULE (Week & Day Views + Mobile 7-Day Strip)
  // ==========================================================================
  function renderSchedule(user, data) {
    const app = A();
    const st = app.state;
    const monday = getMonday(st.scheduleDate);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const todayStr = new Date().toDateString();

    const daySlots = data.schedule
      .filter((s) => app.isScheduleActiveOn(s, st.scheduleDate))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    return `
      <div class="stack">
        <div class="page-head">
          <div><h2>Thời khóa biểu</h2><p>Xem lịch theo tuần và ngày, lặp lại tự động, phòng học, giảng viên & màu môn học.</p></div>
          <div class="row">
            <div class="tabs">
              <button type="button" class="tab-btn ${st.scheduleView === "week" ? "active" : ""}" data-sched-view="week">Theo tuần</button>
              <button type="button" class="tab-btn ${st.scheduleView === "day" ? "active" : ""}" data-sched-view="day">Theo ngày</button>
            </div>
            <button type="button" class="btn btn-primary btn-shine" id="btn-add-sched">${app.icon("plus", 16)} Thêm lịch học</button>
          </div>
        </div>

        <div class="glass-card card-pad between" style="padding:12px 16px;flex-wrap:wrap">
          <div class="row">
            <button type="button" class="btn btn-outline btn-sm" id="sched-prev">← Trước</button>
            <button type="button" class="btn btn-outline btn-sm" id="sched-today">Hôm nay</button>
            <button type="button" class="btn btn-outline btn-sm" id="sched-next">Sau →</button>
          </div>
          <strong style="font-size:14px">${st.scheduleView === "week" ? `Tuần ${weekDates[0].toLocaleDateString("vi-VN")} – ${weekDates[6].toLocaleDateString("vi-VN")}` : st.scheduleDate.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</strong>
          <span class="card-desc">Tổng: <strong>${data.schedule.length}</strong> buổi học</span>
        </div>

        ${
          st.scheduleView === "week"
            ? `<div class="week-grid">
                ${weekDates
                  .map((d, idx) => {
                    const dow = idx + 1;
                    const isToday = d.toDateString() === todayStr;
                    const slots = data.schedule
                      .filter((s) => app.isScheduleActiveOn(s, d))
                      .sort((a, b) => a.start_time.localeCompare(b.start_time));
                    return `
                      <div class="glass-card" style="min-height:220px;display:flex;flex-direction:column;${isToday ? "border-color:var(--primary);box-shadow:0 0 0 2px var(--ring)" : ""}">
                        <div class="between" style="padding:10px 12px;border-bottom:1px solid var(--border);background:${isToday ? "rgba(37,99,235,0.1)" : "var(--muted)"}">
                          <div><strong style="font-size:12.5px;color:${isToday ? "var(--primary)" : "var(--fg)"}">${app.DAY_NAMES[dow]}</strong><div style="font-size:11px;color:var(--muted-fg)">${d.getDate()}/${d.getMonth() + 1}</div></div>
                          <button type="button" class="btn btn-ghost btn-icon" style="width:28px;height:28px" data-add-sched-day="${dow}" aria-label="Thêm ${app.DAY_NAMES[dow]}">${app.icon("plus", 14)}</button>
                        </div>
                        <div class="stack" style="padding:10px;gap:8px;flex:1">
                          ${slots.length ? slots.map((s) => `<button type="button" class="schedule-slot" style="border-left-color:${app.esc(s.color || "#2563eb")}" data-edit-sched="${s.id}"><div class="tabular-nums muted" style="font-size:11px;font-weight:600">${app.esc(s.start_time)} – ${app.esc(s.end_time)}</div><div style="font-size:12.5px;font-weight:700;margin-top:2px">${app.esc(s.title)}</div>${s.room ? `<div class="muted" style="font-size:11px;margin-top:3px">${app.esc(s.room)}</div>` : ""}</button>`).join("") : '<p class="card-desc" style="text-align:center;padding:24px 0">Trống lịch</p>'}
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>`
            : `<div class="glass-card card-pad stack">
                <div class="day-strip">
                  ${weekDates
                    .map((d, i) => {
                      const active = d.toDateString() === st.scheduleDate.toDateString();
                      return `<button type="button" class="btn ${active ? "btn-primary" : "btn-outline"} btn-sm" style="height:48px;flex-direction:column;gap:0;padding:4px" data-pick-date="${d.toISOString()}"><span>${app.DAY_SHORT[i + 1]}</span><span style="font-size:10px;opacity:.8">${d.getDate()}</span></button>`;
                    })
                    .join("")}
                </div>
                ${
                  daySlots.length === 0
                    ? `<div class="empty-state"><div class="empty-icon">${app.icon("calendar", 22)}</div><strong>Không có buổi học trong ngày này</strong><button type="button" class="btn btn-outline btn-sm" data-add-sched-day="${app.getIsoDow(st.scheduleDate)}">${app.icon("plus", 15)} Thêm buổi học</button></div>`
                    : daySlots
                        .map(
                          (s) => `
                        <div class="schedule-slot" style="border-left-color:${app.esc(s.color || "#2563eb")};padding:14px">
                          <div class="between" style="flex-wrap:wrap">
                            <div>
                              <div class="row" style="gap:6px;margin-bottom:5px"><span class="badge badge-outline tabular-nums">${app.esc(s.start_time)} – ${app.esc(s.end_time)}</span><span class="badge badge-secondary">${s.recurrence === "once" ? "Một lần" : s.recurrence === "biweekly" ? "Cách tuần" : "Hàng tuần"}</span></div>
                              <strong style="font-size:15px">${app.esc(s.title)}</strong>
                              <div class="row card-desc" style="margin-top:5px">${s.room ? `<span>Phòng: ${app.esc(s.room)}</span>` : ""}${s.instructor ? `<span>GV: ${app.esc(s.instructor)}</span>` : ""}</div>
                            </div>
                            <div class="row">
                              <button type="button" class="btn btn-outline btn-sm" data-edit-sched="${s.id}">Sửa</button>
                              <button type="button" class="btn btn-ghost btn-icon" style="color:var(--rose)" data-del-sched="${s.id}">${app.icon("trash", 16)}</button>
                            </div>
                          </div>
                        </div>
                      `
                        )
                        .join("")
                }
              </div>`
        }
      </div>
    `;
  }

  // ==========================================================================
  // 3. COURSES & GPA
  // ==========================================================================
  function renderCourses(user, data) {
    const app = A();
    const st = app.state;
    const sems = Array.from(new Set(data.courses.map((c) => c.semester).filter(Boolean)));
    const filtered = data.courses.filter((c) => {
      if (st.courseSemester !== "all" && c.semester !== st.courseSemester) return false;
      if (st.courseSearch.trim()) {
        const q = st.courseSearch.toLowerCase();
        return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.instructor || "").toLowerCase().includes(q);
      }
      return true;
    });
    const gpaAll = S().calculateOverallGpa(data.courses);
    const chartItems = filtered
      .map((c) => ({ code: c.code, name: c.name, score10: S().calculateCourseGrade(c.grade_components).finalScore10, color: c.color }))
      .filter((x) => x.score10 !== null);

    return `
      <div class="stack">
        <div class="page-head">
          <div><h2>Môn học & Tính điểm GPA</h2><p>Tùy chỉnh đầu điểm thành phần & trọng số (%), tự tính thang 10 / điểm chữ / thang 4.0.</p></div>
          <button type="button" class="btn btn-primary btn-shine" id="btn-add-course">${app.icon("plus", 16)} Thêm môn học</button>
        </div>

        <div class="grid-4">
          <div class="glass-card spotlight card-pad">
            <p class="card-desc">GPA tích lũy (Thang 4.0)</p>
            <div class="between" style="margin-top:8px">
              <span class="tabular-nums" style="font-size:28px;font-weight:800;color:var(--primary)" ${gpaAll.gpa4 !== null ? `data-countup="${gpaAll.gpa4}" data-decimals="2"` : ""}>${gpaAll.gpa4 !== null ? gpaAll.gpa4.toFixed(2) : "--"}</span>
              <span class="badge badge-secondary">${gpaAll.standing}</span>
            </div>
            <p class="card-desc" style="margin-top:8px">Thang 10: ${gpaAll.gpa10 !== null ? gpaAll.gpa10.toFixed(2) : "--"} • ${gpaAll.gradedCredits} TC có điểm</p>
          </div>
          <div class="glass-card spotlight card-pad">
            <p class="card-desc">Tổng tín chỉ</p>
            <div class="between" style="margin-top:8px">
              <span class="tabular-nums" style="font-size:28px;font-weight:800" data-countup="${gpaAll.totalCredits}">${gpaAll.totalCredits}</span>
              <span class="card-desc">${data.courses.length} môn học</span>
            </div>
            <p class="card-desc" style="margin-top:8px">${sems.length} học kỳ được theo dõi</p>
          </div>
          <div class="glass-card card-pad span-2-sm">
            <div class="card-title" style="margin-bottom:8px">${app.icon("award", 16)} Biểu đồ điểm các môn</div>
            ${chartItems.length ? C().renderCourseBarChart(chartItems) : '<p class="card-desc" style="text-align:center;padding:24px 0">Nhập điểm thành phần cho môn học để hiển thị biểu đồ.</p>'}
          </div>
        </div>

        <div class="grid-2" style="gap:10px">
          <input class="input" id="course-search" value="${app.esc(st.courseSearch)}" placeholder="Tìm mã môn, tên môn, giảng viên..." />
          <select class="select" id="course-sem-filter">
            <option value="all">Tất cả học kỳ</option>
            ${sems.map((s) => `<option value="${app.esc(s)}" ${st.courseSemester === s ? "selected" : ""}>${app.esc(s)}</option>`).join("")}
          </select>
        </div>

        ${
          filtered.length === 0
            ? `<div class="empty-state"><div class="empty-icon">${app.icon("book", 24)}</div><strong>Chưa có môn học nào</strong><p class="card-desc">Thêm môn học đầu tiên để bắt đầu quản lý điểm và GPA.</p><button type="button" class="btn btn-primary btn-shine" id="btn-add-course-empty">${app.icon("plus", 16)} Thêm môn học đầu tiên</button></div>`
            : `<div class="grid-3">
                ${filtered
                  .map((c) => {
                    const sum = S().calculateCourseGrade(c.grade_components);
                    return `
                      <div class="glass-card spotlight" style="display:flex;flex-direction:column">
                        <div style="height:6px;background:${app.esc(c.color || "#2563eb")}"></div>
                        <div class="card-pad" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;gap:14px">
                          <div>
                            <div class="between" style="align-items:flex-start">
                              <div>
                                <div class="row" style="gap:6px"><span class="badge badge-secondary">${app.esc(c.code)}</span><span class="badge badge-outline">${c.credits} TC</span></div>
                                <h3 style="font-size:15.5px;font-weight:700;margin-top:8px">${app.esc(c.name)}</h3>
                                <p class="card-desc" style="margin-top:4px">${app.esc(c.semester)}${c.instructor ? " • " + app.esc(c.instructor) : ""}</p>
                              </div>
                              <div style="text-align:right">
                                <div class="tabular-nums" style="font-size:22px;font-weight:800;color:var(--primary)">${sum.finalScore10 !== null ? sum.finalScore10.toFixed(2) : "--"}</div>
                                <div style="font-size:12px;font-weight:700;color:var(--muted-fg)">${sum.letterGrade}${sum.gpa4 !== null ? ` (${sum.gpa4.toFixed(1)})` : ""}</div>
                              </div>
                            </div>
                            <div style="margin-top:12px;padding:10px;border-radius:10px;background:var(--muted)">
                              <div class="between" style="font-size:11px;color:var(--muted-fg);margin-bottom:6px"><span>Điểm thành phần</span><span>Tổng trọng số: ${sum.totalWeight}%</span></div>
                              <div class="grid-2" style="gap:6px">
                                ${(c.grade_components || []).map((g) => `<div class="between" style="background:var(--card-solid);padding:5px 8px;border-radius:7px;font-size:12px"><span class="truncate muted">${app.esc(g.name)} (${g.weight}%)</span><strong class="tabular-nums">${g.score !== null && g.score !== undefined ? g.score : "–"}</strong></div>`).join("")}
                              </div>
                            </div>
                          </div>
                          <div class="row" style="gap:6px">
                            <button type="button" class="btn btn-primary btn-sm" style="flex:1" data-grade-course="${c.id}">${app.icon("calc", 14)} Nhập điểm & Trọng số</button>
                            <button type="button" class="btn btn-outline btn-icon" data-edit-course="${c.id}" aria-label="Sửa môn">${app.icon("edit", 15)}</button>
                            <button type="button" class="btn btn-ghost btn-icon" style="color:var(--rose)" data-del-course="${c.id}" aria-label="Xóa môn">${app.icon("trash", 15)}</button>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>`
        }
      </div>
    `;
  }

  // ==========================================================================
  // 4. TASKS
  // ==========================================================================
  function renderTasks(user, data) {
    const app = A();
    const st = app.state;
    const nowMs = Date.now();
    const isOv = (t) => t.status !== "done" && t.due_date && new Date(t.due_date).getTime() < nowMs;
    const overdueCount = data.tasks.filter(isOv).length;
    const doneCount = data.tasks.filter((t) => t.status === "done").length;
    const activeCount = data.tasks.length - doneCount;

    const filtered = data.tasks.filter((t) => {
      if (st.taskTab === "active" && t.status === "done") return false;
      if (st.taskTab === "done" && t.status !== "done") return false;
      if (st.taskTab === "overdue" && !isOv(t)) return false;
      if (st.taskCourse !== "all" && (t.course_id || "") !== st.taskCourse) return false;
      if (st.taskPriority !== "all" && t.priority !== st.taskPriority) return false;
      if (st.taskSearch.trim()) {
        const q = st.taskSearch.toLowerCase();
        return t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
      }
      return true;
    });

    return `
      <div class="stack">
        <div class="page-head">
          <div><h2>Bài tập & Công việc</h2><p>Đặt deadline theo môn học, phân loại ưu tiên và cảnh báo quá hạn tự động.</p></div>
          <button type="button" class="btn btn-primary btn-shine" id="btn-add-task">${app.icon("plus", 16)} Tạo công việc</button>
        </div>

        ${overdueCount ? `<div class="alert alert-danger"><span class="row">${app.icon("alert", 18)}<div><strong>Cảnh báo: Bạn có ${overdueCount} công việc đã quá hạn!</strong><div style="font-size:12px">Ưu tiên hoàn thành ngay hôm nay.</div></div></span><button type="button" class="btn btn-danger btn-sm" data-task-tab="overdue">Xem quá hạn</button></div>` : ""}

        <div class="tabs">
          <button type="button" class="tab-btn ${st.taskTab === "all" ? "active" : ""}" data-task-tab="all">Tất cả (${data.tasks.length})</button>
          <button type="button" class="tab-btn ${st.taskTab === "active" ? "active" : ""}" data-task-tab="active">Đang chờ (${activeCount})</button>
          <button type="button" class="tab-btn danger ${st.taskTab === "overdue" ? "active" : ""}" data-task-tab="overdue">Quá hạn (${overdueCount})</button>
          <button type="button" class="tab-btn ${st.taskTab === "done" ? "active" : ""}" data-task-tab="done">Hoàn thành (${doneCount})</button>
        </div>

        <div class="grid-3" style="gap:10px">
          <input class="input" id="task-search" value="${app.esc(st.taskSearch)}" placeholder="Tìm tên bài tập, mô tả..." />
          <select class="select" id="task-course-filter">
            <option value="all">Tất cả môn học</option>
            ${data.courses.map((c) => `<option value="${c.id}" ${st.taskCourse === c.id ? "selected" : ""}>[${app.esc(c.code)}] ${app.esc(c.name)}</option>`).join("")}
          </select>
          <select class="select" id="task-prio-filter">
            <option value="all">Mọi mức ưu tiên</option>
            <option value="urgent" ${st.taskPriority === "urgent" ? "selected" : ""}>Khẩn cấp</option>
            <option value="high" ${st.taskPriority === "high" ? "selected" : ""}>Cao</option>
            <option value="medium" ${st.taskPriority === "medium" ? "selected" : ""}>Trung bình</option>
            <option value="low" ${st.taskPriority === "low" ? "selected" : ""}>Thấp</option>
          </select>
        </div>

        ${
          filtered.length === 0
            ? `<div class="empty-state"><div class="empty-icon">${app.icon("checkCircle", 24)}</div><strong>Không có công việc phù hợp</strong><button type="button" class="btn btn-primary btn-sm" id="btn-add-task-empty">${app.icon("plus", 15)} Tạo bài tập mới</button></div>`
            : `<div class="stack" style="gap:10px">
                ${filtered
                  .map((t) => {
                    const ov = isOv(t);
                    const done = t.status === "done";
                    const c = courseById(data.courses, t.course_id);
                    return `
                      <div class="glass-card spotlight card-pad" style="padding:14px;${ov ? "border-color:rgba(244,63,94,0.45);background:rgba(244,63,94,0.04)" : ""};${done ? "opacity:.72" : ""}">
                        <div class="row" style="align-items:flex-start;flex-wrap:nowrap">
                          <button type="button" data-toggle-task="${t.id}" style="border:none;background:none;cursor:pointer;padding:2px;color:${done ? "var(--emerald)" : "var(--muted-fg)"}" aria-label="Đổi trạng thái">${app.icon(done ? "checkCircle" : "circle", 21)}</button>
                          <div style="flex:1;min-width:0">
                            <div class="row" style="gap:6px">
                              <strong style="font-size:15px;${done ? "text-decoration:line-through;color:var(--muted-fg)" : ""}">${app.esc(t.title)}</strong>
                              ${c ? `<span class="badge badge-secondary">${app.esc(c.code)}</span>` : ""}
                              <span class="badge ${t.priority === "urgent" || t.priority === "high" ? "badge-danger" : t.priority === "medium" ? "badge-warning" : "badge-outline"}">${app.PRIORITY_LABELS[t.priority]}</span>
                              <span class="badge badge-outline">${app.STATUS_LABELS[t.status]}</span>
                            </div>
                            ${t.description ? `<p class="card-desc" style="margin-top:5px">${app.esc(t.description)}</p>` : ""}
                            <p style="font-size:12px;margin-top:6px;color:${ov ? "var(--rose)" : "var(--muted-fg)"};font-weight:${ov ? "700" : "500"}">${ov ? "Quá hạn: " : "Deadline: "}${app.formatDateTimeVN(t.due_date)}</p>
                          </div>
                          <div class="row" style="gap:4px">
                            <button type="button" class="btn btn-ghost btn-icon" data-edit-task="${t.id}" aria-label="Sửa">${app.icon("edit", 15)}</button>
                            <button type="button" class="btn btn-ghost btn-icon" style="color:var(--rose)" data-del-task="${t.id}" aria-label="Xóa">${app.icon("trash", 15)}</button>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>`
        }
      </div>
    `;
  }

  // ==========================================================================
  // 5. EXAMS
  // ==========================================================================
  function renderExams(user, data) {
    const app = A();
    const st = app.state;
    const sorted = [...data.exams].sort((a, b) => a.exam_date.localeCompare(b.exam_date));
    const upcoming = sorted.filter((e) => !app.getCountdown(e.exam_date).isPast);
    const past = sorted.filter((e) => app.getCountdown(e.exam_date).isPast);
    const reminders = upcoming.filter((e) => app.getCountdown(e.exam_date).days <= Number(e.reminder_days ?? 3));
    const list = st.examTab === "upcoming" ? upcoming : past;

    return `
      <div class="stack">
        <div class="page-head">
          <div><h2>Lịch thi & Đếm ngược</h2><p>Theo dõi thời gian, phòng thi, hình thức thi và nhắc lịch thi sắp tới.</p></div>
          <button type="button" class="btn btn-primary btn-shine" id="btn-add-exam">${app.icon("plus", 16)} Thêm lịch thi</button>
        </div>

        ${
          reminders.length
            ? `<div class="alert alert-warning" style="flex-direction:column;align-items:stretch;gap:10px">
                <div class="row" style="font-weight:700">${app.icon("bell", 17)} Nhắc lịch thi sắp diễn ra (${reminders.length} kỳ thi)</div>
                <div class="grid-3">${reminders.map((e) => `<div style="background:var(--card-solid);padding:9px 11px;border-radius:10px" class="between"><div class="truncate"><strong>${app.esc(e.title)}</strong><div class="card-desc">${app.formatDateTimeVN(e.exam_date)}</div></div><span class="badge badge-danger">${app.getCountdown(e.exam_date).label}</span></div>`).join("")}</div>
              </div>`
            : ""
        }

        <div class="tabs">
          <button type="button" class="tab-btn ${st.examTab === "upcoming" ? "active" : ""}" data-exam-tab="upcoming">Sắp thi (${upcoming.length})</button>
          <button type="button" class="tab-btn ${st.examTab === "past" ? "active" : ""}" data-exam-tab="past">Đã thi (${past.length})</button>
        </div>

        ${
          list.length === 0
            ? `<div class="empty-state"><div class="empty-icon">${app.icon("fileText", 24)}</div><strong>${st.examTab === "upcoming" ? "Chưa có lịch thi sắp tới" : "Chưa có kỳ thi nào đã qua"}</strong><button type="button" class="btn btn-primary btn-sm" id="btn-add-exam-empty">${app.icon("plus", 15)} Thêm lịch thi</button></div>`
            : `<div class="grid-3">
                ${list
                  .map((ex) => {
                    const cd = app.getCountdown(ex.exam_date);
                    const c = courseById(data.courses, ex.course_id);
                    const urgent = !cd.isPast && cd.days <= Number(ex.reminder_days ?? 3);
                    return `
                      <div class="glass-card spotlight" style="display:flex;flex-direction:column">
                        <div style="height:6px;background:${app.esc(c ? c.color : "#2563eb")}"></div>
                        <div class="card-pad stack" style="gap:12px;flex:1;justify-content:space-between">
                          <div class="stack" style="gap:10px">
                            <div class="row" style="gap:6px">${c ? `<span class="badge badge-secondary">${app.esc(c.code)}</span>` : ""}<span class="badge badge-outline">${app.EXAM_FORMATS[ex.exam_format] || ex.exam_format}</span></div>
                            <h3 style="font-size:15.5px;font-weight:700">${app.esc(ex.title)}</h3>
                            <div style="padding:12px;border-radius:12px;text-align:center;background:${cd.isPast ? "var(--muted)" : urgent ? "rgba(244,63,94,0.1)" : "rgba(37,99,235,0.08)"}">
                              <div style="font-size:11px;text-transform:uppercase;color:var(--muted-fg);font-weight:700">${cd.isPast ? "Trạng thái" : "Đếm ngược ngày thi"}</div>
                              <div class="tabular-nums" style="font-size:17px;font-weight:800;margin-top:2px;color:${cd.isPast ? "var(--muted-fg)" : urgent ? "var(--rose)" : "var(--primary)"}">${cd.label}</div>
                            </div>
                            <div style="font-size:12.5px;display:flex;flex-direction:column;gap:5px" class="muted">
                              <div>Thời gian: <strong style="color:var(--fg)">${app.formatDateTimeVN(ex.exam_date)}</strong> (${ex.duration_minutes} phút)</div>
                              ${ex.location ? `<div>Địa điểm: ${app.esc(ex.location)}</div>` : ""}
                              ${ex.seat_number ? `<div>SBD / Ghế: ${app.esc(ex.seat_number)}</div>` : ""}
                              <div>Nhắc trước: ${ex.reminder_days} ngày</div>
                              ${ex.notes ? `<div style="padding:8px;border-radius:8px;background:var(--muted);color:var(--fg)">${app.esc(ex.notes)}</div>` : ""}
                            </div>
                          </div>
                          <div class="row" style="gap:6px">
                            <button type="button" class="btn btn-outline btn-sm" style="flex:1" data-edit-exam="${ex.id}">Chỉnh sửa</button>
                            <button type="button" class="btn btn-ghost btn-icon" style="color:var(--rose)" data-del-exam="${ex.id}">${app.icon("trash", 15)}</button>
                          </div>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>`
        }
      </div>
    `;
  }

  // ==========================================================================
  // 6. NOTES (Markdown + Tags + Reference Links + Mobile List/Editor Toggle)
  // ==========================================================================
  function renderNotes(user, data) {
    const app = A();
    const st = app.state;
    const sorted = [...data.notes].sort((a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned)) || b.updated_at.localeCompare(a.updated_at));
    const filtered = sorted.filter((n) => {
      if (st.noteCourse !== "all" && (n.course_id || "") !== st.noteCourse) return false;
      if (st.noteSearch.trim()) {
        const q = st.noteSearch.toLowerCase();
        return n.title.toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q) || (n.tags || []).some((t) => t.toLowerCase().includes(q));
      }
      return true;
    });

    if (!st.noteCreating && !st.noteSelectedId && sorted.length) {
      st.noteSelectedId = sorted[0].id;
    }
    const activeNote = st.noteCreating ? null : data.notes.find((n) => n.id === st.noteSelectedId) || null;
    const draftKey = st.noteCreating ? "__new__" : activeNote ? activeNote.id : null;
    if (draftKey !== st.noteDraftLoadedFor) {
      st.noteDraftLoadedFor = draftKey;
      st.noteDraftTitle = activeNote ? activeNote.title || "" : "";
      st.noteDraftCourse = activeNote ? activeNote.course_id || "" : "";
      st.noteDraftContent = activeNote ? activeNote.content || "" : "";
      st.noteDraftPin = Boolean(activeNote && activeNote.is_pinned);
      st.noteDraftTags = activeNote ? [...(activeNote.tags || [])] : [];
      st.noteDraftResources = activeNote ? [...(activeNote.resources || [])] : [];
    }
    const showEditor = st.noteCreating || Boolean(activeNote);
    const isMobile = window.innerWidth < 1024;

    return `
      <div class="stack">
        <div class="page-head">
          <div><h2>Ghi chú học tập</h2><p>Ghi chú Markdown theo môn học, gắn thẻ tìm kiếm và lưu đường dẫn tài liệu tham khảo.</p></div>
          <button type="button" class="btn btn-primary btn-shine" id="btn-new-note">${app.icon("plus", 16)} Tạo ghi chú mới</button>
        </div>

        <div class="grid-12" style="align-items:start">
          <div class="glass-card card-pad col-4 stack ${isMobile && st.noteMobilePane === "editor" ? "hidden" : ""}" style="gap:10px">
            <input class="input" id="note-search" value="${app.esc(st.noteSearch)}" placeholder="Tìm tiêu đề, nội dung, thẻ..." />
            <select class="select" id="note-course-filter">
              <option value="all">Tất cả môn học (${data.notes.length})</option>
              ${data.courses.map((c) => `<option value="${c.id}" ${st.noteCourse === c.id ? "selected" : ""}>[${app.esc(c.code)}] ${app.esc(c.name)}</option>`).join("")}
            </select>
            <div class="stack" style="gap:8px;max-height:540px;overflow-y:auto">
              ${
                filtered.length === 0
                  ? `<div class="empty-state" style="padding:24px 12px"><div class="empty-icon">${app.icon("note", 20)}</div><strong>Chưa có ghi chú</strong></div>`
                  : filtered
                      .map((n) => {
                        const c = courseById(data.courses, n.course_id);
                        const isSel = !st.noteCreating && st.noteSelectedId === n.id;
                        return `
                          <button type="button" data-select-note="${n.id}" style="width:100%;text-align:left;padding:11px;border-radius:12px;border:1px solid ${isSel ? "var(--primary)" : "var(--border)"};background:${isSel ? "rgba(37,99,235,0.08)" : "var(--card-solid)"};cursor:pointer">
                            <div class="between"><strong class="truncate" style="font-size:13.5px">${app.esc(n.title)}</strong>${n.is_pinned ? `<span style="color:var(--amber)">${app.icon("pin", 14)}</span>` : ""}</div>
                            <p class="card-desc truncate" style="margin-top:3px">${app.esc(n.content || "Trống")}</p>
                            <div class="row" style="gap:5px;margin-top:6px">
                              ${c ? `<span class="badge badge-secondary" style="font-size:10px">${app.esc(c.code)}</span>` : ""}
                              ${(n.resources || []).length ? `<span class="badge badge-outline" style="font-size:10px">${n.resources.length} tài liệu</span>` : ""}
                            </div>
                          </button>
                        `;
                      })
                      .join("")
              }
            </div>
          </div>

          <div class="glass-card card-pad col-8 ${isMobile && st.noteMobilePane === "list" ? "hidden" : ""}">
            ${isMobile ? `<button type="button" class="btn btn-ghost btn-sm" id="btn-note-back" style="margin-bottom:10px;margin-left:-8px">${app.icon("arrowLeft", 15)} Danh sách ghi chú (${data.notes.length})</button>` : ""}
            ${
              !showEditor
                ? `<div class="empty-state"><div class="empty-icon">${app.icon("note", 24)}</div><strong>Chọn ghi chú hoặc tạo mới</strong><button type="button" class="btn btn-primary btn-sm" id="btn-new-note-empty">${app.icon("plus", 15)} Tạo ghi chú</button></div>`
                : `<form id="note-editor-form" class="stack" style="gap:14px">
                    <div class="between" style="flex-wrap:wrap">
                      <strong>${st.noteCreating ? "Ghi chú mới" : "Chỉnh sửa ghi chú"}</strong>
                      <div class="row">
                        <label class="row" style="font-size:12.5px;cursor:pointer"><input type="checkbox" id="note-pin" ${st.noteDraftPin ? "checked" : ""} /> Ghim</label>
                        <button type="button" class="btn btn-outline btn-sm" id="btn-note-to-ai">${app.icon("sparkles", 14)} Tóm tắt / Quiz AI</button>
                        ${activeNote ? `<button type="button" class="btn btn-ghost btn-icon" style="color:var(--rose)" id="btn-del-note">${app.icon("trash", 16)}</button>` : ""}
                      </div>
                    </div>

                    <div class="grid-2" style="gap:10px">
                      <div class="field"><label for="note-title">Tiêu đề *</label><input class="input" id="note-title" required value="${app.esc(st.noteDraftTitle)}" placeholder="VD: Chương 1 - Khái niệm cơ bản" /></div>
                      <div class="field"><label for="note-course">Môn học</label><select class="select" id="note-course"><option value="">-- Ghi chú chung --</option>${data.courses.map((c) => `<option value="${c.id}" ${st.noteDraftCourse === c.id ? "selected" : ""}>[${app.esc(c.code)}] ${app.esc(c.name)}</option>`).join("")}</select></div>
                    </div>

                    <div class="field">
                      <label>Thẻ phân loại (Tags)</label>
                      <div class="row" style="gap:6px">
                        ${st.noteDraftTags.map((tg, i) => `<span class="badge badge-secondary">${app.esc(tg)} <button type="button" data-rm-tag="${i}" style="border:none;background:none;cursor:pointer;padding:0 2px">×</button></span>`).join("")}
                        <input class="input" id="note-tag-input" style="width:150px;height:32px;font-size:12.5px" placeholder="Thêm thẻ..." />
                        <button type="button" class="btn btn-outline btn-sm" id="btn-add-tag">Thêm</button>
                      </div>
                    </div>

                    <div class="field">
                      <div class="between">
                        <label for="note-content">Nội dung (Markdown)</label>
                        <div class="tabs">
                          <button type="button" class="tab-btn ${st.noteTab === "edit" ? "active" : ""}" data-note-tab="edit">Soạn thảo</button>
                          <button type="button" class="tab-btn ${st.noteTab === "preview" ? "active" : ""}" data-note-tab="preview">Xem trước</button>
                        </div>
                      </div>
                      ${
                        st.noteTab === "edit"
                          ? `<textarea class="textarea" id="note-content" rows="9" style="font-family:ui-monospace,monospace" placeholder="# Ý chính&#10;- Công thức 1&#10;- **Lưu ý quan trọng**">${app.esc(st.noteDraftContent)}</textarea>`
                          : `<div class="prose" style="min-height:200px;padding:14px;border-radius:12px;border:1px solid var(--border);background:var(--muted)">${AI().renderMarkdownSafe(st.noteDraftContent)}</div>`
                      }
                    </div>

                    <div class="stack" style="gap:8px;padding:12px;border-radius:12px;background:var(--muted)">
                      <strong style="font-size:13px">${app.icon("link", 14)} Tài liệu & Đường dẫn tham khảo (${st.noteDraftResources.length})</strong>
                      ${st.noteDraftResources.map((r, i) => `<div class="between" style="background:var(--card-solid);padding:7px 10px;border-radius:8px;font-size:12.5px"><a href="${app.esc(r.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--primary);font-weight:600" class="truncate">${app.esc(r.title)} ↗</a><button type="button" data-rm-res="${i}" style="border:none;background:none;color:var(--rose);cursor:pointer">×</button></div>`).join("")}
                      <div class="grid-3" style="gap:8px">
                        <input class="input" id="note-res-title" placeholder="Tên tài liệu (Slide...)" />
                        <input class="input" id="note-res-url" placeholder="https://drive.google.com/..." />
                        <button type="button" class="btn btn-outline btn-sm" id="btn-add-res">${app.icon("plus", 14)} Gắn link</button>
                      </div>
                    </div>

                    <div style="display:flex;justify-content:flex-end">
                      <button type="submit" class="btn btn-primary btn-shine">Lưu ghi chú</button>
                    </div>
                  </form>`
            }
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 7. FINANCE
  // ==========================================================================
  function renderFinance(user, data) {
    const app = A();
    const st = app.state;
    const mk = st.financeMonth;
    const mTx = data.transactions.filter((t) => t.transaction_date.startsWith(mk));
    const filtered = mTx.filter((t) => st.financeType === "all" || t.type === st.financeType);

    const income = mTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = mTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const budget = data.budgets[mk] !== undefined ? Number(data.budgets[mk]) : Number(user.monthly_budget_default || 3500000);
    const remaining = budget - expense;
    const pct = budget > 0 ? Math.round((expense / budget) * 100) : 0;
    const isOver = budget > 0 && expense > budget;

    const [yy, mm] = mk.split("-").map(Number);
    const trendMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(yy, mm - 1 - (5 - i), 1);
      const k = app.getMonthKey(d);
      const list = data.transactions.filter((t) => t.transaction_date.startsWith(k));
      return {
        label: "T" + (d.getMonth() + 1),
        income: list.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
        expense: list.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
      };
    });

    const catMap = new Map();
    mTx.filter((t) => t.type === "expense").forEach((t) => catMap.set(t.category, (catMap.get(t.category) || 0) + Number(t.amount)));
    const donutSlices = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    return `
      <div class="stack">
        <div class="page-head">
          <div><h2>Quản lý chi tiêu sinh viên</h2><p>Ghi nhận thu chi theo danh mục, ngân sách tháng, biểu đồ & cảnh báo vượt mức.</p></div>
          <div class="row">
            <input type="month" class="input" id="fin-month" value="${mk}" style="width:165px" />
            <button type="button" class="btn btn-outline btn-sm" id="btn-set-budget">Đặt ngân sách</button>
            <button type="button" class="btn btn-outline btn-sm" id="btn-add-income">+ Thu nhập</button>
            <button type="button" class="btn btn-primary btn-sm btn-shine" id="btn-add-expense">${app.icon("plus", 15)} Ghi chi tiêu</button>
          </div>
        </div>

        ${isOver || pct >= 80 ? `<div class="alert ${isOver ? "alert-danger" : "alert-warning"}"><span class="row">${app.icon("alert", 18)}<div><strong>${isOver ? `Cảnh báo vượt ngân sách tháng ${mk}!` : `Sắp chạm hạn mức ngân sách (${pct}%)`}</strong><div style="font-size:12px">${isOver ? `Đã chi ${app.formatVND(expense)} / ${app.formatVND(budget)} (vượt ${app.formatVND(expense - budget)})` : `Còn lại ${app.formatVND(remaining)}`}</div></div></span></div>` : ""}

        <div class="grid-4">
          <div class="glass-card spotlight card-pad"><p class="card-desc">Tổng thu nhập</p><div class="tabular-nums" style="font-size:22px;font-weight:800;color:var(--emerald);margin-top:8px" data-countup="${income}" data-format="vnd">${app.formatVND(income)}</div></div>
          <div class="glass-card spotlight card-pad"><p class="card-desc">Tổng chi tiêu</p><div class="tabular-nums" style="font-size:22px;font-weight:800;color:var(--rose);margin-top:8px" data-countup="${expense}" data-format="vnd">${app.formatVND(expense)}</div></div>
          <div class="glass-card spotlight card-pad"><p class="card-desc">Số dư (Thu – Chi)</p><div class="tabular-nums" style="font-size:22px;font-weight:800;margin-top:8px;color:${income - expense >= 0 ? "var(--fg)" : "var(--rose)"}" data-countup="${income - expense}" data-format="vnd">${app.formatVND(income - expense)}</div></div>
          <div class="glass-card spotlight card-pad">
            <div class="between">
              <div><p class="card-desc">Ngân sách còn lại</p><div class="tabular-nums" style="font-size:20px;font-weight:800;margin-top:4px;color:${isOver ? "var(--rose)" : "var(--teal)"}">${app.formatVND(remaining)}</div></div>
              ${C().renderProgressRing(Math.min(100, pct), 48, isOver ? "#f43f5e" : pct >= 80 ? "#f59e0b" : "#0d9488", pct + "%")}
            </div>
            <div class="progress-track" style="margin-top:8px"><div class="progress-fill" style="width:${Math.min(100, pct)}%;background:${isOver ? "var(--rose)" : pct >= 80 ? "var(--amber)" : "var(--teal)"}"></div></div>
          </div>
        </div>

        <div class="grid-12">
          <div class="glass-card card-pad col-7">
            <div class="card-header"><div><div class="card-title">Biểu đồ Thu – Chi (6 tháng)</div><div class="card-desc">So sánh thu nhập và chi tiêu theo tháng</div></div></div>
            ${C().renderFinanceTrendChart(trendMonths)}
          </div>
          <div class="glass-card card-pad col-5">
            <div class="card-header"><div><div class="card-title">Cơ cấu chi tiêu tháng ${mk}</div><div class="card-desc">Phân bổ theo danh mục</div></div></div>
            ${donutSlices.length ? C().renderDonutChart(donutSlices) : `<div class="empty-state"><div class="empty-icon">${app.icon("wallet", 22)}</div><strong>Chưa có khoản chi nào</strong></div>`}
          </div>
        </div>

        <div class="glass-card card-pad">
          <div class="card-header">
            <div><div class="card-title">Lịch sử giao dịch (${filtered.length})</div></div>
            <select class="select" id="fin-type-filter" style="width:150px">
              <option value="all" ${st.financeType === "all" ? "selected" : ""}>Tất cả loại</option>
              <option value="expense" ${st.financeType === "expense" ? "selected" : ""}>Chỉ chi tiêu</option>
              <option value="income" ${st.financeType === "income" ? "selected" : ""}>Chỉ thu nhập</option>
            </select>
          </div>
          ${
            filtered.length === 0
              ? `<div class="empty-state"><div class="empty-icon">${app.icon("wallet", 22)}</div><strong>Chưa có giao dịch trong tháng ${mk}</strong></div>`
              : `<div class="stack" style="gap:8px">${filtered
                  .map(
                    (tx) => `
                  <div class="between" style="padding:10px 12px;border-radius:11px;background:var(--muted)">
                    <div style="min-width:0">
                      <div class="row" style="gap:6px"><strong>${app.esc(tx.category)}</strong><span class="badge ${tx.type === "income" ? "badge-success" : "badge-secondary"}">${tx.type === "income" ? "Thu" : "Chi"}</span></div>
                      <p class="card-desc truncate">${app.esc(tx.description || "Không có ghi chú")} • ${app.formatDateVN(tx.transaction_date)}</p>
                    </div>
                    <div class="row" style="gap:8px;flex-shrink:0">
                      <strong class="tabular-nums" style="color:${tx.type === "income" ? "var(--emerald)" : "var(--rose)"}">${tx.type === "income" ? "+" : "-"}${app.formatVND(tx.amount)}</strong>
                      <button type="button" class="btn btn-ghost btn-icon" style="color:var(--rose)" data-del-tx="${tx.id}">${app.icon("trash", 15)}</button>
                    </div>
                  </div>
                `
                  )
                  .join("")}</div>`
          }
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 8. AI STUDY ASSISTANT
  // ==========================================================================
  function renderAI(user, data) {
    const app = A();
    const st = app.state;
    const cfg = S().getAIConfig(user.id);
    const hasKey = Boolean(cfg.apiKey && cfg.apiKey.trim());
    const activeMode = AI().AI_MODES.find((m) => m.id === st.aiMode) || AI().AI_MODES[0];
    const activeConv = data.aiConversations.find((c) => c.id === st.aiConvId) || null;

    return `
      <div class="stack">
        <div class="page-head">
          <div><h2 class="row" style="gap:8px">${app.icon("sparkles", 24)} AI Study Assistant</h2><p>Kết nối API AI thực tế (Gemini <code>gemini-4-hydrogen</code> hoặc OpenAI) — không giả lập phản hồi.</p></div>
          <div class="row">
            <span class="badge ${hasKey ? "badge-success" : "badge-warning"}">${hasKey ? `API sẵn sàng (${cfg.provider} • ${cfg.model})` : "Chưa nhập AI API Key"}</span>
            <button type="button" class="btn btn-outline btn-sm" id="btn-ai-config">Cấu hình API Key</button>
            <button type="button" class="btn btn-outline btn-sm" id="btn-ai-new">+ Phiên mới</button>
          </div>
        </div>

        ${
          !hasKey
            ? `<div class="alert alert-warning" style="flex-direction:column;gap:8px">
                <div class="row" style="font-weight:700">${app.icon("alert", 17)} Tính năng AI Study Assistant chưa hoạt động vì chưa cấu hình API Key</div>
                <p style="font-size:12.5px">STUDYHUB gọi API AI thực tế trực tiếp từ nhà cung cấp (không tạo câu trả lời giả). Hãy bấm <strong>"Cấu hình API Key"</strong> và dán Google Gemini API Key (lấy miễn phí tại <em>aistudio.google.com/apikey</em>) — khóa chỉ lưu cục bộ trên trình duyệt của riêng bạn.</p>
              </div>`
            : ""
        }

        <div class="ai-modes">
          ${AI().AI_MODES.map(
            (m) => `
            <button type="button" class="ai-mode-card ${st.aiMode === m.id ? "active" : ""}" data-ai-mode="${m.id}">
              <div style="font-size:13px;font-weight:700">${m.label}</div>
              <div style="font-size:11.5px;color:var(--muted-fg);margin-top:3px">${m.desc}</div>
            </button>
          `
          ).join("")}
        </div>

        <div class="grid-12" style="align-items:start">
          <div class="glass-card card-pad col-9 stack">
            <div class="between" style="flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:12px">
              <div><strong>${activeMode.label}</strong><div class="card-desc">${activeMode.desc}</div></div>
              <button type="button" class="btn btn-outline btn-sm" id="btn-ai-sample">Dùng câu mẫu</button>
            </div>

            <div class="stack" style="min-height:200px;max-height:400px;overflow-y:auto;gap:12px">
              ${
                activeConv && activeConv.messages.length
                  ? activeConv.messages
                      .map(
                        (m) => `
                      <div style="max-width:92%;padding:13px 15px;border-radius:15px;${m.role === "user" ? "margin-left:auto;background:var(--primary);color:#fff" : "margin-right:auto;background:var(--muted);border:1px solid var(--border)"}">
                        <div style="font-size:11px;font-weight:700;opacity:.8;margin-bottom:5px">${m.role === "user" ? "Bạn" : "STUDYHUB AI Study Assistant"}</div>
                        ${m.role === "assistant" ? `<div class="prose">${AI().renderMarkdownSafe(m.content)}</div>` : `<div style="white-space:pre-wrap;font-size:13.5px">${app.esc(m.content)}</div>`}
                      </div>
                    `
                      )
                      .join("")
                  : `<div class="empty-state"><div class="empty-icon">${app.icon("sparkles", 24)}</div><strong>Sẵn sàng hỗ trợ: ${activeMode.label}</strong><p class="card-desc">Tự động đọc môn học, GPA, thời khóa biểu, deadline và lịch thi thật của bạn làm ngữ cảnh.</p></div>`
              }
              ${st.aiError ? `<div class="alert alert-danger">${app.esc(st.aiError)}</div>` : ""}
            </div>

            <form id="ai-form" class="stack" style="gap:12px;border-top:1px solid var(--border);padding-top:14px">
              <div class="grid-3" style="gap:10px;padding:10px;border-radius:11px;background:var(--muted)">
                <label class="row" style="font-size:12.5px;cursor:pointer"><input type="checkbox" id="ai-include-ctx" ${st.aiIncludeCtx ? "checked" : ""} /> Gửi dữ liệu học tập thật</label>
                <select class="select" id="ai-course-select">
                  <option value="">Tập trung: Tất cả môn</option>
                  ${data.courses.map((c) => `<option value="${c.id}" ${st.aiCourseId === c.id ? "selected" : ""}>[${app.esc(c.code)}] ${app.esc(c.name)}</option>`).join("")}
                </select>
                <select class="select" id="ai-import-note">
                  <option value="">+ Nạp từ Ghi chú đã lưu...</option>
                  ${data.notes.map((n) => `<option value="${n.id}">${app.esc(n.title)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="ai-doc">Nội dung tài liệu đính kèm ${activeMode.needsDoc ? "(Khuyến nghị)" : "(Tùy chọn)"}</label>
                <textarea class="textarea" id="ai-doc" rows="${activeMode.needsDoc || st.aiDoc ? 4 : 2}" placeholder="Dán giáo trình, ghi chú bài giảng cần tóm tắt, giải thích hoặc tạo câu hỏi...">${app.esc(st.aiDoc)}</textarea>
              </div>
              <div class="field">
                <label for="ai-prompt">Yêu cầu gửi Trợ lý AI *</label>
                <div class="row" style="align-items:flex-end">
                  <textarea class="textarea" id="ai-prompt" rows="2" required style="flex:1" placeholder="${app.esc(activeMode.prompt)}">${app.esc(st.aiPrompt)}</textarea>
                  <button type="submit" class="btn btn-primary btn-shine" ${st.aiSending ? "disabled" : ""} style="height:44px;padding:0 18px">${app.icon("send", 15)} ${st.aiSending ? "Đang gọi AI..." : "Gửi AI"}</button>
                </div>
              </div>
            </form>
          </div>

          <div class="glass-card card-pad col-3 stack" style="gap:10px">
            <div class="card-title">Lịch sử hội thoại (${data.aiConversations.length})</div>
            ${
              data.aiConversations.length === 0
                ? '<p class="card-desc" style="text-align:center;padding:18px 0">Chưa có phiên hội thoại nào.</p>'
                : data.aiConversations
                    .map(
                      (c) => `
                  <div class="between" style="padding:8px 10px;border-radius:10px;border:1px solid ${st.aiConvId === c.id ? "var(--primary)" : "var(--border)"};background:${st.aiConvId === c.id ? "rgba(37,99,235,0.08)" : "var(--card-solid)"};font-size:12.5px">
                    <button type="button" data-open-conv="${c.id}" style="border:none;background:none;text-align:left;cursor:pointer;flex:1;min-width:0"><div class="truncate" style="font-weight:600">${app.esc(c.title)}</div><div style="font-size:10.5px;color:var(--muted-fg)">${app.formatDateTimeVN(c.updated_at)}</div></button>
                    <button type="button" data-del-conv="${c.id}" style="border:none;background:none;color:var(--rose);cursor:pointer">×</button>
                  </div>
                `
                    )
                    .join("")
            }
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // 9. SETTINGS (Profile, Theme, Password, JSON Backup/Restore)
  // ==========================================================================
  function renderSettings(user) {
    const app = A();
    const curTheme = app.getThemeSetting();
    const pwa = global.StudyHubPWA ? global.StudyHubPWA.getStatus() : { installed: false, canNativeInstall: false, swReady: false, swStatus: "checking", online: true };
    const swBadge = pwa.swReady
      ? '<span class="badge badge-success">Hỗ trợ Offline (SW hoạt động)</span>'
      : pwa.swStatus === "file_protocol"
        ? '<span class="badge badge-warning">Cần mở qua HTTPS / localhost để cài PWA</span>'
        : '<span class="badge badge-secondary">Đang kiểm tra Service Worker...</span>';
    return `
      <div class="stack" style="max-width:860px">
        <div class="page-head"><div><h2>Hồ sơ cá nhân & Cài đặt</h2><p>Cập nhật thông tin sinh viên, chế độ sáng/tối, cài đặt ứng dụng PWA, đổi mật khẩu và sao lưu dữ liệu.</p></div></div>

        <div class="glass-card card-pad">
          <div class="between" style="flex-wrap:wrap;gap:14px">
            <div class="row" style="gap:14px;flex:1;min-width:240px;flex-wrap:nowrap;align-items:flex-start">
              <img src="./icons/icon-192.png" alt="STUDYHUB PWA" width="48" height="48" style="border-radius:12px;flex-shrink:0;box-shadow:0 4px 12px rgba(37,99,235,0.25)" />
              <div style="min-width:0">
                <div class="row" style="gap:8px">
                  <strong style="font-size:15px">Cài đặt ứng dụng STUDYHUB (PWA)</strong>
                  ${pwa.installed ? '<span class="badge badge-success">Đã cài đặt</span>' : swBadge}
                </div>
                <p class="card-desc" style="margin-top:4px">
                  ${pwa.installed ? "Bạn đang chạy STUDYHUB ở chế độ ứng dụng độc lập toàn màn hình (hỗ trợ dùng ngoại tuyến)." : "Tải STUDYHUB về màn hình chính điện thoại (Android / iPhone) hoặc máy tính để mở nhanh không cần trình duyệt và dùng được cả khi mất mạng."}
                </p>
              </div>
            </div>
            ${
              pwa.installed
                ? `<span class="badge badge-primary" style="padding:8px 14px">${app.icon("checkCircle", 15)} Đang dùng bản App</span>`
                : `<button type="button" class="btn btn-primary btn-shine" data-pwa-install>${app.icon("download", 16)} ${pwa.canNativeInstall ? "Cài đặt ngay" : "Tải app về máy"}</button>`
            }
          </div>
        </div>

        <div class="glass-card card-pad">
          <div class="card-header"><div><div class="card-title">${app.icon("user", 17)} Hồ sơ sinh viên</div></div></div>
          <form id="profile-form" class="stack" style="gap:14px">
            <div class="grid-2">
              <div class="field"><label for="p-name">Họ và tên *</label><input class="input" id="p-name" required value="${app.esc(user.full_name)}" /></div>
              <div class="field"><label for="p-email">Email</label><input class="input" id="p-email" disabled value="${app.esc(user.email)}" style="opacity:.7" /></div>
            </div>
            <div class="grid-3">
              <div class="field"><label for="p-code">MSSV</label><input class="input" id="p-code" value="${app.esc(user.student_code || "")}" placeholder="VD: 22110045" /></div>
              <div class="field"><label for="p-year">Năm học</label><select class="select" id="p-year">${["Năm 1", "Năm 2", "Năm 3", "Năm 4", "Năm 5+", "Sau đại học"].map((y) => `<option ${user.academic_year === y ? "selected" : ""}>${y}</option>`).join("")}</select></div>
              <div class="field"><label for="p-sem">Học kỳ hiện tại</label><input class="input" id="p-sem" value="${app.esc(user.current_semester)}" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label for="p-uni">Trường đại học</label><input class="input" id="p-uni" value="${app.esc(user.university || "")}" /></div>
              <div class="field"><label for="p-major">Chuyên ngành</label><input class="input" id="p-major" value="${app.esc(user.major || "")}" /></div>
            </div>
            <div class="grid-2">
              <div class="field"><label for="p-gpa">Mục tiêu GPA (Thang 4.0)</label><input class="input" id="p-gpa" type="number" step="0.05" min="0" max="4" value="${user.gpa_target}" /></div>
              <div class="field"><label for="p-budget">Ngân sách tháng mặc định (VND)</label><input class="input" id="p-budget" type="number" step="100000" min="0" value="${user.monthly_budget_default}" /></div>
            </div>
            <div class="field">
              <label>Màu ảnh đại diện</label>
              <div class="color-swatches">${app.COLORS.map((col) => `<button type="button" class="swatch ${user.avatar_color === col ? "active" : ""}" style="background:${col}" data-pick-avatar="${col}"></button>`).join("")}</div>
              <input type="hidden" id="p-avatar" value="${app.esc(user.avatar_color || "#2563eb")}" />
            </div>
            <div style="display:flex;justify-content:flex-end"><button type="submit" class="btn btn-primary btn-shine">Lưu hồ sơ</button></div>
          </form>
        </div>

        <div class="grid-2">
          <div class="glass-card card-pad stack" style="gap:14px">
            <div class="card-title">Giao diện hiển thị</div>
            <div class="grid-3" style="gap:8px">
              ${[
                { id: "light", label: "Sáng", ic: "sun" },
                { id: "dark", label: "Tối", ic: "moon" },
                { id: "system", label: "Hệ thống", ic: "settings" },
              ]
                .map(
                  (t) => `<button type="button" class="btn ${curTheme === t.id ? "btn-primary" : "btn-outline"}" style="height:64px;flex-direction:column;gap:4px" data-set-theme="${t.id}">${app.icon(t.ic, 18)}<span style="font-size:12px">${t.label}</span></button>`
                )
                .join("")}
            </div>
            <div style="border-top:1px solid var(--border);padding-top:14px" class="stack">
              <div class="card-title">Sao lưu & Đồng bộ giữa thiết bị</div>
              <p class="card-desc">Xuất toàn bộ dữ liệu môn học, điểm, lịch học, ghi chú & chi tiêu ra file JSON để chuyển sang điện thoại hoặc máy tính khác.</p>
              <div class="row">
                <button type="button" class="btn btn-outline btn-sm" id="btn-export-json">${app.icon("download", 14)} Xuất JSON</button>
                <label class="btn btn-outline btn-sm" style="cursor:pointer">${app.icon("upload", 14)} Nhập JSON<input type="file" id="input-import-json" accept="application/json" class="hidden" /></label>
              </div>
            </div>
          </div>

          <div class="glass-card card-pad">
            <div class="card-title" style="margin-bottom:12px">${app.icon("lock", 16)} Đổi mật khẩu</div>
            <form id="pw-change-form" class="stack" style="gap:12px">
              <div class="field"><label for="cpw-cur">Mật khẩu hiện tại</label><input class="input" id="cpw-cur" type="password" required /></div>
              <div class="field"><label for="cpw-new">Mật khẩu mới (≥ 8 ký tự)</label><input class="input" id="cpw-new" type="password" required minlength="8" /></div>
              <div class="field"><label for="cpw-new2">Xác nhận mật khẩu mới</label><input class="input" id="cpw-new2" type="password" required minlength="8" /></div>
              <button type="submit" class="btn btn-outline" style="width:100%">Cập nhật mật khẩu</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // MODAL FORMS (Schedule, Course, Grades, Task, Exam, Finance, AI Key)
  // ==========================================================================
  function openScheduleModal(user, data, editItem, defaultDay) {
    const app = A();
    const it = editItem || { course_id: "", title: "", day_of_week: defaultDay || 1, start_time: "07:30", end_time: "09:15", room: "", instructor: "", recurrence: "weekly", specific_date: "", color: "#2563eb", notes: "" };
    app.openModal(
      editItem ? "Chỉnh sửa lịch học" : "Thêm lịch học mới",
      "Liên kết môn học hoặc nhập buổi học kèm chu kỳ lặp lại.",
      `
      <form id="modal-sched-form" class="stack" style="gap:12px">
        <div class="field"><label>Liên kết môn học</label><select class="select" id="ms-course"><option value="">-- Nhập tự do --</option>${data.courses.map((c) => `<option value="${c.id}" ${it.course_id === c.id ? "selected" : ""}>[${app.esc(c.code)}] ${app.esc(c.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Tên môn / Buổi học *</label><input class="input" id="ms-title" required value="${app.esc(it.title)}" placeholder="VD: Kinh tế vi mô" /></div>
        <div class="grid-3" style="gap:8px">
          <div class="field"><label>Thứ *</label><select class="select" id="ms-day">${[1, 2, 3, 4, 5, 6, 7].map((d) => `<option value="${d}" ${Number(it.day_of_week) === d ? "selected" : ""}>${app.DAY_NAMES[d]}</option>`).join("")}</select></div>
          <div class="field"><label>Bắt đầu *</label><input class="input" id="ms-start" type="time" required value="${app.esc(it.start_time)}" /></div>
          <div class="field"><label>Kết thúc *</label><input class="input" id="ms-end" type="time" required value="${app.esc(it.end_time)}" /></div>
        </div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Phòng học</label><input class="input" id="ms-room" value="${app.esc(it.room || "")}" placeholder="A2-304" /></div>
          <div class="field"><label>Giảng viên</label><input class="input" id="ms-inst" value="${app.esc(it.instructor || "")}" /></div>
        </div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Lặp lại</label><select class="select" id="ms-rec"><option value="weekly" ${it.recurrence === "weekly" ? "selected" : ""}>Hàng tuần</option><option value="biweekly" ${it.recurrence === "biweekly" ? "selected" : ""}>Cách tuần</option><option value="once" ${it.recurrence === "once" ? "selected" : ""}>Một lần</option></select></div>
          <div class="field"><label>Ngày cụ thể (nếu 1 lần)</label><input class="input" id="ms-date" type="date" value="${app.esc(it.specific_date || "")}" /></div>
        </div>
        <div class="field"><label>Màu nhận diện</label><div class="color-swatches">${app.COLORS.map((col) => `<button type="button" class="swatch ${it.color === col ? "active" : ""}" style="background:${col}" data-ms-color="${col}"></button>`).join("")}</div><input type="hidden" id="ms-color" value="${app.esc(it.color || "#2563eb")}" /></div>
        <div class="between" style="margin-top:6px">
          ${editItem ? `<button type="button" class="btn btn-danger btn-sm" id="ms-del">Xóa</button>` : "<span></span>"}
          <div class="row"><button type="button" class="btn btn-outline btn-sm" data-close-modal>Hủy</button><button type="submit" class="btn btn-primary btn-sm btn-shine">Lưu lịch học</button></div>
        </div>
      </form>
      `
    );

    document.getElementById("ms-course")?.addEventListener("change", (e) => {
      const c = courseById(data.courses, e.target.value);
      if (!c) return;
      document.getElementById("ms-title").value = `${c.code} - ${c.name}`;
      if (c.instructor) document.getElementById("ms-inst").value = c.instructor;
      if (c.room_default) document.getElementById("ms-room").value = c.room_default;
      if (c.color) document.getElementById("ms-color").value = c.color;
    });
    document.querySelectorAll("[data-ms-color]").forEach((b) =>
      b.addEventListener("click", () => {
        document.querySelectorAll("[data-ms-color]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        document.getElementById("ms-color").value = b.getAttribute("data-ms-color");
      })
    );
    document.getElementById("ms-del")?.addEventListener("click", () => {
      if (!confirm("Xóa buổi học này?")) return;
      S().deleteScheduleItem(user.id, editItem.id);
      app.closeModal();
      app.toast("Đã xóa lịch học", "info");
      app.render();
    });
    document.getElementById("modal-sched-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const start_time = document.getElementById("ms-start").value;
      const end_time = document.getElementById("ms-end").value;
      if (end_time <= start_time) return app.toast("Giờ kết thúc phải lớn hơn giờ bắt đầu", "error");
      S().saveScheduleItem(
        user.id,
        {
          course_id: document.getElementById("ms-course").value || null,
          title: document.getElementById("ms-title").value.trim(),
          day_of_week: Number(document.getElementById("ms-day").value),
          start_time,
          end_time,
          room: document.getElementById("ms-room").value.trim(),
          instructor: document.getElementById("ms-inst").value.trim(),
          recurrence: document.getElementById("ms-rec").value,
          specific_date: document.getElementById("ms-date").value || null,
          color: document.getElementById("ms-color").value || "#2563eb",
        },
        editItem ? editItem.id : null
      );
      app.closeModal();
      app.toast(editItem ? "Đã cập nhật lịch học" : "Đã thêm lịch học mới", "success");
      app.render();
    });
  }

  function openCourseModal(user, editItem) {
    const app = A();
    const it = editItem || { code: "", name: "", credits: 3, instructor: "", semester: user.current_semester || "HK1 2026-2027", color: "#2563eb", status: "active", room_default: "" };
    app.openModal(
      editItem ? "Chỉnh sửa môn học" : "Thêm môn học mới",
      "Quản lý thông tin tín chỉ, giảng viên và học kỳ.",
      `
      <form id="modal-course-form" class="stack" style="gap:12px">
        <div class="grid-3" style="gap:8px">
          <div class="field"><label>Mã môn *</label><input class="input" id="mc-code" required value="${app.esc(it.code)}" placeholder="FIN201" /></div>
          <div class="field span-2-sm"><label>Tên môn học *</label><input class="input" id="mc-name" required value="${app.esc(it.name)}" placeholder="Tài chính doanh nghiệp" /></div>
        </div>
        <div class="grid-3" style="gap:8px">
          <div class="field"><label>Số tín chỉ *</label><input class="input" id="mc-cr" type="number" min="1" max="15" required value="${it.credits}" /></div>
          <div class="field"><label>Học kỳ *</label><input class="input" id="mc-sem" required value="${app.esc(it.semester)}" /></div>
          <div class="field"><label>Trạng thái</label><select class="select" id="mc-st"><option value="active" ${it.status === "active" ? "selected" : ""}>Đang học</option><option value="completed" ${it.status === "completed" ? "selected" : ""}>Đã hoàn thành</option><option value="planned" ${it.status === "planned" ? "selected" : ""}>Dự kiến</option></select></div>
        </div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Giảng viên</label><input class="input" id="mc-inst" value="${app.esc(it.instructor || "")}" /></div>
          <div class="field"><label>Phòng học mặc định</label><input class="input" id="mc-room" value="${app.esc(it.room_default || "")}" /></div>
        </div>
        <div class="field"><label>Màu môn học</label><div class="color-swatches">${app.COLORS.map((col) => `<button type="button" class="swatch ${it.color === col ? "active" : ""}" style="background:${col}" data-mc-color="${col}"></button>`).join("")}</div><input type="hidden" id="mc-color" value="${app.esc(it.color || "#2563eb")}" /></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-outline btn-sm" data-close-modal>Hủy</button><button type="submit" class="btn btn-primary btn-sm btn-shine">Lưu môn học</button></div>
      </form>
      `
    );
    document.querySelectorAll("[data-mc-color]").forEach((b) =>
      b.addEventListener("click", () => {
        document.querySelectorAll("[data-mc-color]").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        document.getElementById("mc-color").value = b.getAttribute("data-mc-color");
      })
    );
    document.getElementById("modal-course-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      S().saveCourse(
        user.id,
        {
          code: document.getElementById("mc-code").value.trim(),
          name: document.getElementById("mc-name").value.trim(),
          credits: Number(document.getElementById("mc-cr").value),
          semester: document.getElementById("mc-sem").value.trim(),
          status: document.getElementById("mc-st").value,
          instructor: document.getElementById("mc-inst").value.trim(),
          room_default: document.getElementById("mc-room").value.trim(),
          color: document.getElementById("mc-color").value || "#2563eb",
        },
        editItem ? editItem.id : null
      );
      app.closeModal();
      app.toast(editItem ? "Đã cập nhật môn học" : "Đã thêm môn học mới", "success");
      app.render();
    });
  }

  function openGradesModal(user, course) {
    const app = A();
    let rows = (course.grade_components || []).map((g) => ({
      name: g.name,
      weight: g.weight,
      score: g.score !== null && g.score !== undefined ? String(g.score) : "",
    }));
    if (!rows.length) {
      rows = [
        { name: "Chuyên cần", weight: 10, score: "" },
        { name: "Giữa kỳ", weight: 30, score: "" },
        { name: "Cuối kỳ", weight: 60, score: "" },
      ];
    }

    function renderRowsUI() {
      const sum = S().calculateCourseGrade(rows);
      const preview = document.getElementById("grade-live-preview");
      if (preview) {
        preview.innerHTML = `
          <div><div class="card-desc">Tổng kết (10)</div><strong class="tabular-nums" style="font-size:20px;color:var(--primary)">${sum.finalScore10 !== null ? sum.finalScore10.toFixed(2) : "--"}</strong></div>
          <div><div class="card-desc">Chữ / Thang 4</div><strong class="tabular-nums" style="font-size:20px">${sum.letterGrade}${sum.gpa4 !== null ? ` (${sum.gpa4.toFixed(1)})` : ""}</strong></div>
          <div><div class="card-desc">Tổng trọng số</div><strong class="tabular-nums" style="font-size:20px;color:${Math.abs(sum.totalWeight - 100) < 0.01 ? "var(--emerald)" : "var(--amber)"}">${sum.totalWeight}%</strong></div>
        `;
      }
      const list = document.getElementById("grade-rows-wrap");
      if (list) {
        list.innerHTML = rows
          .map(
            (r, i) => `
          <div style="display:grid;grid-template-columns:5fr 3fr 3fr 36px;gap:6px;align-items:center">
            <input class="input" data-gr-name="${i}" value="${app.esc(r.name)}" required placeholder="Tên đầu điểm" />
            <input class="input tabular-nums" data-gr-w="${i}" type="number" min="1" max="100" step="0.5" value="${r.weight}" required />
            <input class="input tabular-nums" data-gr-s="${i}" type="number" min="0" max="10" step="0.05" value="${app.esc(r.score)}" placeholder="0–10" />
            <button type="button" class="btn btn-ghost btn-icon" style="color:var(--rose)" data-gr-del="${i}">×</button>
          </div>
        `
          )
          .join("");
        list.querySelectorAll("[data-gr-name]").forEach((el) => el.addEventListener("input", () => { rows[el.getAttribute("data-gr-name")].name = el.value; }));
        list.querySelectorAll("[data-gr-w]").forEach((el) => el.addEventListener("input", () => { rows[el.getAttribute("data-gr-w")].weight = Number(el.value); renderPreviewOnly(); }));
        list.querySelectorAll("[data-gr-s]").forEach((el) => el.addEventListener("input", () => { rows[el.getAttribute("data-gr-s")].score = el.value; renderPreviewOnly(); }));
        list.querySelectorAll("[data-gr-del]").forEach((el) => el.addEventListener("click", () => { rows.splice(Number(el.getAttribute("data-gr-del")), 1); renderRowsUI(); }));
      }
    }

    function renderPreviewOnly() {
      const sum = S().calculateCourseGrade(rows);
      const preview = document.getElementById("grade-live-preview");
      if (preview) {
        preview.innerHTML = `
          <div><div class="card-desc">Tổng kết (10)</div><strong class="tabular-nums" style="font-size:20px;color:var(--primary)">${sum.finalScore10 !== null ? sum.finalScore10.toFixed(2) : "--"}</strong></div>
          <div><div class="card-desc">Chữ / Thang 4</div><strong class="tabular-nums" style="font-size:20px">${sum.letterGrade}${sum.gpa4 !== null ? ` (${sum.gpa4.toFixed(1)})` : ""}</strong></div>
          <div><div class="card-desc">Tổng trọng số</div><strong class="tabular-nums" style="font-size:20px;color:${Math.abs(sum.totalWeight - 100) < 0.01 ? "var(--emerald)" : "var(--amber)"}">${sum.totalWeight}%</strong></div>
        `;
      }
    }

    app.openModal(
      `Bảng điểm & Trọng số — ${course.code}`,
      course.name,
      `
      <form id="modal-grades-form" class="stack" style="gap:12px">
        <div id="grade-live-preview" class="grid-3" style="text-align:center;padding:10px;border-radius:12px;background:var(--muted)"></div>
        <div style="display:grid;grid-template-columns:5fr 3fr 3fr 36px;gap:6px;font-size:11.5px;color:var(--muted-fg);font-weight:700"><span>Tên đầu điểm</span><span>Trọng số %</span><span>Điểm</span><span></span></div>
        <div id="grade-rows-wrap" class="stack" style="gap:8px"></div>
        <button type="button" class="btn btn-outline btn-sm" id="btn-add-grade-row" style="align-self:flex-start">${app.icon("plus", 14)} Thêm đầu điểm</button>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-outline btn-sm" data-close-modal>Đóng</button><button type="submit" class="btn btn-primary btn-sm btn-shine">Lưu bảng điểm</button></div>
      </form>
      `
    );
    renderRowsUI();
    document.getElementById("btn-add-grade-row")?.addEventListener("click", () => {
      rows.push({ name: "Bài tập lớn", weight: 10, score: "" });
      renderRowsUI();
    });
    document.getElementById("modal-grades-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const summary = S().saveCourseGrades(user.id, course.id, rows.filter((r) => r.name.trim()));
      if (summary && summary.finalScore10 !== null && summary.finalScore10 >= 8.5) {
        C().fireConfetti({ count: 55 });
      }
      app.closeModal();
      app.toast(`Đã lưu bảng điểm ${course.code}`, "success", summary?.finalScore10 !== null ? `Tổng kết: ${summary.finalScore10}/10 (${summary.letterGrade})` : "");
      app.render();
    });
  }

  function openTaskModal(user, data, editItem) {
    const app = A();
    const it = editItem || { title: "", description: "", course_id: "", due_date: "", priority: "medium", status: "todo" };
    const dtVal = app.toDateTimeLocal(it.due_date);
    app.openModal(
      editItem ? "Chỉnh sửa công việc" : "Tạo bài tập / công việc mới",
      "Đặt deadline rõ ràng để không bỏ lỡ hạn nộp.",
      `
      <form id="modal-task-form" class="stack" style="gap:12px">
        <div class="field"><label>Tên công việc *</label><input class="input" id="mt-title" required value="${app.esc(it.title)}" placeholder="VD: Nộp bài tập lớn chương 3" /></div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Môn học</label><select class="select" id="mt-course"><option value="">-- Việc chung --</option>${data.courses.map((c) => `<option value="${c.id}" ${it.course_id === c.id ? "selected" : ""}>[${app.esc(c.code)}] ${app.esc(c.name)}</option>`).join("")}</select></div>
          <div class="field"><label>Deadline</label><input class="input" id="mt-due" type="datetime-local" value="${dtVal}" /></div>
        </div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Ưu tiên</label><select class="select" id="mt-prio"><option value="low" ${it.priority === "low" ? "selected" : ""}>Thấp</option><option value="medium" ${it.priority === "medium" ? "selected" : ""}>Trung bình</option><option value="high" ${it.priority === "high" ? "selected" : ""}>Cao</option><option value="urgent" ${it.priority === "urgent" ? "selected" : ""}>Khẩn cấp</option></select></div>
          <div class="field"><label>Trạng thái</label><select class="select" id="mt-st"><option value="todo" ${it.status === "todo" ? "selected" : ""}>Cần làm</option><option value="in_progress" ${it.status === "in_progress" ? "selected" : ""}>Đang làm</option><option value="done" ${it.status === "done" ? "selected" : ""}>Hoàn thành</option></select></div>
        </div>
        <div class="field"><label>Mô tả</label><textarea class="textarea" id="mt-desc" rows="3">${app.esc(it.description || "")}</textarea></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-outline btn-sm" data-close-modal>Hủy</button><button type="submit" class="btn btn-primary btn-sm btn-shine">Lưu công việc</button></div>
      </form>
      `
    );
    document.getElementById("modal-task-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const rawDue = document.getElementById("mt-due").value;
      S().saveTask(
        user.id,
        {
          title: document.getElementById("mt-title").value.trim(),
          course_id: document.getElementById("mt-course").value || null,
          due_date: rawDue ? new Date(rawDue).toISOString() : null,
          priority: document.getElementById("mt-prio").value,
          status: document.getElementById("mt-st").value,
          description: document.getElementById("mt-desc").value.trim(),
        },
        editItem ? editItem.id : null
      );
      app.closeModal();
      app.toast(editItem ? "Đã cập nhật công việc" : "Đã tạo công việc mới", "success");
      app.render();
    });
  }

  function openExamModal(user, data, editItem) {
    const app = A();
    const it = editItem || { course_id: "", title: "", exam_date: "", duration_minutes: 90, location: "", seat_number: "", exam_format: "written", reminder_days: 3, notes: "" };
    const dtVal = app.toDateTimeLocal(it.exam_date);
    app.openModal(
      editItem ? "Chỉnh sửa lịch thi" : "Thêm lịch thi mới",
      "Thiết lập đếm ngược và nhắc lịch thi tự động.",
      `
      <form id="modal-exam-form" class="stack" style="gap:12px">
        <div class="field"><label>Môn thi</label><select class="select" id="me-course"><option value="">-- Chọn môn --</option>${data.courses.map((c) => `<option value="${c.id}" ${it.course_id === c.id ? "selected" : ""}>[${app.esc(c.code)}] ${app.esc(c.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Tên kỳ thi *</label><input class="input" id="me-title" required value="${app.esc(it.title)}" placeholder="VD: Thi cuối kỳ Xác suất thống kê" /></div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Ngày giờ thi *</label><input class="input" id="me-date" type="datetime-local" required value="${dtVal}" /></div>
          <div class="field"><label>Thời lượng (phút)</label><input class="input" id="me-dur" type="number" min="15" max="600" value="${it.duration_minutes}" /></div>
        </div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Hình thức thi</label><select class="select" id="me-fmt">${Object.entries(app.EXAM_FORMATS).map(([k, v]) => `<option value="${k}" ${it.exam_format === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="field"><label>Nhắc trước (ngày)</label><input class="input" id="me-rem" type="number" min="0" max="60" value="${it.reminder_days}" /></div>
        </div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Địa điểm / Phòng thi</label><input class="input" id="me-loc" value="${app.esc(it.location || "")}" placeholder="C1-402" /></div>
          <div class="field"><label>SBD / Ghế</label><input class="input" id="me-seat" value="${app.esc(it.seat_number || "")}" /></div>
        </div>
        <div class="field"><label>Ghi chú ôn tập</label><textarea class="textarea" id="me-notes" rows="2">${app.esc(it.notes || "")}</textarea></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-outline btn-sm" data-close-modal>Hủy</button><button type="submit" class="btn btn-primary btn-sm btn-shine">Lưu lịch thi</button></div>
      </form>
      `
    );
    document.getElementById("modal-exam-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      S().saveExam(
        user.id,
        {
          course_id: document.getElementById("me-course").value || null,
          title: document.getElementById("me-title").value.trim(),
          exam_date: new Date(document.getElementById("me-date").value).toISOString(),
          duration_minutes: Number(document.getElementById("me-dur").value) || 90,
          exam_format: document.getElementById("me-fmt").value,
          reminder_days: Number(document.getElementById("me-rem").value) || 3,
          location: document.getElementById("me-loc").value.trim(),
          seat_number: document.getElementById("me-seat").value.trim(),
          notes: document.getElementById("me-notes").value.trim(),
        },
        editItem ? editItem.id : null
      );
      app.closeModal();
      app.toast(editItem ? "Đã cập nhật lịch thi" : "Đã thêm lịch thi mới", "success");
      app.render();
    });
  }

  function openTransactionModal(user, defaultType) {
    const app = A();
    let txType = defaultType || "expense";
    const catsHtml = (t) => (t === "income" ? app.INCOME_CATS : app.EXPENSE_CATS).map((c) => `<option>${c}</option>`).join("");
    app.openModal(
      txType === "income" ? "Ghi nhận thu nhập" : "Ghi nhận chi tiêu",
      "Theo dõi thu chi thực tế và đối chiếu ngân sách tháng.",
      `
      <form id="modal-tx-form" class="stack" style="gap:12px">
        <div class="grid-2" style="gap:8px">
          <button type="button" class="btn ${txType === "expense" ? "btn-primary" : "btn-outline"} btn-sm" id="tx-pick-exp">Chi tiêu</button>
          <button type="button" class="btn ${txType === "income" ? "btn-primary" : "btn-outline"} btn-sm" id="tx-pick-inc">Thu nhập</button>
        </div>
        <div class="field"><label>Số tiền (VND) *</label><input class="input" id="tx-amt" type="number" min="1000" step="1000" required placeholder="55000" /></div>
        <div class="grid-2" style="gap:8px">
          <div class="field"><label>Danh mục</label><select class="select" id="tx-cat">${catsHtml(txType)}</select></div>
          <div class="field"><label>Ngày giao dịch</label><input class="input" id="tx-date" type="date" required value="${app.getTodayISO()}" /></div>
        </div>
        <div class="field"><label>Mô tả</label><input class="input" id="tx-desc" placeholder="VD: Cơm trưa, tiền phòng..." /></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-outline btn-sm" data-close-modal>Hủy</button><button type="submit" class="btn btn-primary btn-sm btn-shine">Lưu giao dịch</button></div>
      </form>
      `
    );
    const setType = (t) => {
      txType = t;
      document.getElementById("tx-pick-exp").className = `btn ${t === "expense" ? "btn-primary" : "btn-outline"} btn-sm`;
      document.getElementById("tx-pick-inc").className = `btn ${t === "income" ? "btn-primary" : "btn-outline"} btn-sm`;
      document.getElementById("tx-cat").innerHTML = catsHtml(t);
    };
    document.getElementById("tx-pick-exp")?.addEventListener("click", () => setType("expense"));
    document.getElementById("tx-pick-inc")?.addEventListener("click", () => setType("income"));
    document.getElementById("modal-tx-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      S().addTransaction(user.id, {
        type: txType,
        amount: Math.round(Number(document.getElementById("tx-amt").value)),
        category: document.getElementById("tx-cat").value,
        transaction_date: document.getElementById("tx-date").value,
        description: document.getElementById("tx-desc").value.trim(),
      });
      app.closeModal();
      app.toast(txType === "income" ? "Đã ghi nhận thu nhập" : "Đã ghi nhận chi tiêu", "success");
      app.render();
    });
  }

  function openBudgetModal(user, data) {
    const app = A();
    const mk = app.state.financeMonth;
    const cur = data.budgets[mk] !== undefined ? data.budgets[mk] : user.monthly_budget_default || 3500000;
    app.openModal(
      `Đặt ngân sách tháng ${mk}`,
      "Cảnh báo tự động khi chi tiêu chạm 80% hoặc vượt hạn mức.",
      `
      <form id="modal-budget-form" class="stack" style="gap:12px">
        <div class="field"><label>Hạn mức tháng (VND)</label><input class="input" id="mb-amt" type="number" min="0" step="50000" required value="${cur}" /></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-outline btn-sm" data-close-modal>Hủy</button><button type="submit" class="btn btn-primary btn-sm btn-shine">Lưu ngân sách</button></div>
      </form>
      `
    );
    document.getElementById("modal-budget-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      S().setMonthlyBudget(user.id, mk, Number(document.getElementById("mb-amt").value));
      app.closeModal();
      app.toast(`Đã cập nhật ngân sách tháng ${mk}`, "success");
      app.render();
    });
  }

  function openAIConfigModal(user) {
    const app = A();
    const cfg = S().getAIConfig(user.id);
    app.openModal(
      "Cấu hình AI Study Assistant API",
      "Khóa API chỉ lưu cục bộ trong trình duyệt cá nhân của bạn và gửi trực tiếp tới nhà cung cấp AI.",
      `
      <form id="modal-ai-cfg" class="stack" style="gap:12px">
        <div class="field"><label>Nhà cung cấp</label><select class="select" id="ac-prov"><option value="gemini" ${cfg.provider === "gemini" ? "selected" : ""}>Google Gemini (Khuyến nghị)</option><option value="openai" ${cfg.provider === "openai" ? "selected" : ""}>OpenAI</option><option value="openai-compatible" ${cfg.provider === "openai-compatible" ? "selected" : ""}>OpenAI-Compatible (OpenRouter / Groq...)</option></select></div>
        <div class="field"><label>API Key</label><input class="input" id="ac-key" type="password" value="${app.esc(cfg.apiKey || "")}" placeholder="AIza... hoặc sk-..." /></div>
        <div class="field"><label>Model</label><input class="input" id="ac-model" value="${app.esc(cfg.model || "gemini-4-hydrogen")}" placeholder="gemini-4-hydrogen" /></div>
        <div class="field"><label>Base URL (chỉ dùng cho OpenAI-Compatible)</label><input class="input" id="ac-base" value="${app.esc(cfg.baseUrl || "")}" placeholder="https://openrouter.ai/api/v1" /></div>
        <div class="row" style="justify-content:flex-end"><button type="button" class="btn btn-outline btn-sm" data-close-modal>Hủy</button><button type="submit" class="btn btn-primary btn-sm btn-shine">Lưu cấu hình</button></div>
      </form>
      `
    );
    document.getElementById("modal-ai-cfg")?.addEventListener("submit", (e) => {
      e.preventDefault();
      S().saveAIConfig(user.id, {
        provider: document.getElementById("ac-prov").value,
        apiKey: document.getElementById("ac-key").value.trim(),
        model: document.getElementById("ac-model").value.trim() || "gemini-4-hydrogen",
        baseUrl: document.getElementById("ac-base").value.trim(),
      });
      app.closeModal();
      app.toast("Đã lưu cấu hình AI API", "success");
      app.render();
    });
  }

  // ==========================================================================
  // VIEW EVENT BINDINGS
  // ==========================================================================
  function bindViewEvents(route, user, data) {
    const app = A();
    const st = app.state;

    if (route === "dashboard") {
      document.querySelectorAll("[data-quick-done]").forEach((btn) =>
        btn.addEventListener("click", (e) => {
          const id = btn.getAttribute("data-quick-done");
          S().saveTask(user.id, { status: "done" }, id);
          C().fireConfetti({ count: 40, x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
          app.toast("Đã hoàn thành công việc!", "success");
          app.render();
        })
      );
    }

    if (route === "schedule") {
      document.querySelectorAll("[data-sched-view]").forEach((b) => b.addEventListener("click", () => { st.scheduleView = b.getAttribute("data-sched-view"); app.render(); }));
      document.getElementById("sched-prev")?.addEventListener("click", () => { st.scheduleDate.setDate(st.scheduleDate.getDate() - (st.scheduleView === "week" ? 7 : 1)); app.render(); });
      document.getElementById("sched-next")?.addEventListener("click", () => { st.scheduleDate.setDate(st.scheduleDate.getDate() + (st.scheduleView === "week" ? 7 : 1)); app.render(); });
      document.getElementById("sched-today")?.addEventListener("click", () => { st.scheduleDate = new Date(); app.render(); });
      document.getElementById("btn-add-sched")?.addEventListener("click", () => openScheduleModal(user, data, null, app.getIsoDow(st.scheduleDate)));
      document.querySelectorAll("[data-add-sched-day]").forEach((b) => b.addEventListener("click", () => openScheduleModal(user, data, null, Number(b.getAttribute("data-add-sched-day")))));
      document.querySelectorAll("[data-edit-sched]").forEach((b) => b.addEventListener("click", () => { const it = data.schedule.find((x) => x.id === b.getAttribute("data-edit-sched")); if (it) openScheduleModal(user, data, it); }));
      document.querySelectorAll("[data-del-sched]").forEach((b) => b.addEventListener("click", () => { if (confirm("Xóa buổi học này?")) { S().deleteScheduleItem(user.id, b.getAttribute("data-del-sched")); app.toast("Đã xóa lịch học", "info"); app.render(); } }));
      document.querySelectorAll("[data-pick-date]").forEach((b) => b.addEventListener("click", () => { st.scheduleDate = new Date(b.getAttribute("data-pick-date")); app.render(); }));
    }

    if (route === "courses") {
      document.getElementById("btn-add-course")?.addEventListener("click", () => openCourseModal(user, null));
      document.getElementById("btn-add-course-empty")?.addEventListener("click", () => openCourseModal(user, null));
      document.getElementById("course-search")?.addEventListener("input", (e) => { st.courseSearch = e.target.value; app.render(); });
      document.getElementById("course-sem-filter")?.addEventListener("change", (e) => { st.courseSemester = e.target.value; app.render(); });
      document.querySelectorAll("[data-grade-course]").forEach((b) => b.addEventListener("click", () => { const c = courseById(data.courses, b.getAttribute("data-grade-course")); if (c) openGradesModal(user, c); }));
      document.querySelectorAll("[data-edit-course]").forEach((b) => b.addEventListener("click", () => { const c = courseById(data.courses, b.getAttribute("data-edit-course")); if (c) openCourseModal(user, c); }));
      document.querySelectorAll("[data-del-course]").forEach((b) => b.addEventListener("click", () => { if (confirm("Xóa môn học này?")) { S().deleteCourse(user.id, b.getAttribute("data-del-course")); app.toast("Đã xóa môn học", "info"); app.render(); } }));
    }

    if (route === "tasks") {
      document.getElementById("btn-add-task")?.addEventListener("click", () => openTaskModal(user, data, null));
      document.getElementById("btn-add-task-empty")?.addEventListener("click", () => openTaskModal(user, data, null));
      document.querySelectorAll("[data-task-tab]").forEach((b) => b.addEventListener("click", () => { st.taskTab = b.getAttribute("data-task-tab"); app.render(); }));
      document.getElementById("task-search")?.addEventListener("input", (e) => { st.taskSearch = e.target.value; app.render(); });
      document.getElementById("task-course-filter")?.addEventListener("change", (e) => { st.taskCourse = e.target.value; app.render(); });
      document.getElementById("task-prio-filter")?.addEventListener("change", (e) => { st.taskPriority = e.target.value; app.render(); });
      document.querySelectorAll("[data-toggle-task]").forEach((b) =>
        b.addEventListener("click", (e) => {
          const t = data.tasks.find((x) => x.id === b.getAttribute("data-toggle-task"));
          if (!t) return;
          const next = t.status === "done" ? "todo" : "done";
          S().saveTask(user.id, { status: next }, t.id);
          if (next === "done") C().fireConfetti({ count: 40, x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
          app.toast(next === "done" ? "Đã hoàn thành bài tập!" : "Đã đánh dấu chưa xong", "success");
          app.render();
        })
      );
      document.querySelectorAll("[data-edit-task]").forEach((b) => b.addEventListener("click", () => { const t = data.tasks.find((x) => x.id === b.getAttribute("data-edit-task")); if (t) openTaskModal(user, data, t); }));
      document.querySelectorAll("[data-del-task]").forEach((b) => b.addEventListener("click", () => { if (confirm("Xóa công việc này?")) { S().deleteTask(user.id, b.getAttribute("data-del-task")); app.toast("Đã xóa công việc", "info"); app.render(); } }));
    }

    if (route === "exams") {
      document.getElementById("btn-add-exam")?.addEventListener("click", () => openExamModal(user, data, null));
      document.getElementById("btn-add-exam-empty")?.addEventListener("click", () => openExamModal(user, data, null));
      document.querySelectorAll("[data-exam-tab]").forEach((b) => b.addEventListener("click", () => { st.examTab = b.getAttribute("data-exam-tab"); app.render(); }));
      document.querySelectorAll("[data-edit-exam]").forEach((b) => b.addEventListener("click", () => { const ex = data.exams.find((x) => x.id === b.getAttribute("data-edit-exam")); if (ex) openExamModal(user, data, ex); }));
      document.querySelectorAll("[data-del-exam]").forEach((b) => b.addEventListener("click", () => { if (confirm("Xóa lịch thi này?")) { S().deleteExam(user.id, b.getAttribute("data-del-exam")); app.toast("Đã xóa lịch thi", "info"); app.render(); } }));
    }

    if (route === "notes") {
      const startNew = () => {
        st.noteCreating = true;
        st.noteSelectedId = null;
        st.noteDraftLoadedFor = null;
        st.noteDraftTitle = "";
        st.noteDraftCourse = "";
        st.noteDraftContent = "";
        st.noteDraftPin = false;
        st.noteDraftTags = [];
        st.noteDraftResources = [];
        st.noteTab = "edit";
        st.noteMobilePane = "editor";
        app.render();
      };
      document.getElementById("btn-new-note")?.addEventListener("click", startNew);
      document.getElementById("btn-new-note-empty")?.addEventListener("click", startNew);
      document.getElementById("btn-note-back")?.addEventListener("click", () => { st.noteMobilePane = "list"; app.render(); });
      document.getElementById("note-search")?.addEventListener("input", (e) => { st.noteSearch = e.target.value; app.render(); });
      document.getElementById("note-course-filter")?.addEventListener("change", (e) => { st.noteCourse = e.target.value; app.render(); });
      document.getElementById("note-title")?.addEventListener("input", (e) => { st.noteDraftTitle = e.target.value; });
      document.getElementById("note-course")?.addEventListener("change", (e) => { st.noteDraftCourse = e.target.value; });
      document.getElementById("note-content")?.addEventListener("input", (e) => { st.noteDraftContent = e.target.value; });
      document.getElementById("note-pin")?.addEventListener("change", (e) => { st.noteDraftPin = e.target.checked; });
      document.querySelectorAll("[data-select-note]").forEach((b) =>
        b.addEventListener("click", () => {
          const n = data.notes.find((x) => x.id === b.getAttribute("data-select-note"));
          if (!n) return;
          st.noteCreating = false;
          st.noteSelectedId = n.id;
          st.noteDraftLoadedFor = null;
          st.noteTab = "edit";
          st.noteMobilePane = "editor";
          app.render();
        })
      );
      document.querySelectorAll("[data-note-tab]").forEach((b) => b.addEventListener("click", () => { st.noteTab = b.getAttribute("data-note-tab"); app.render(); }));
      document.getElementById("btn-add-tag")?.addEventListener("click", () => {
        const val = document.getElementById("note-tag-input").value.trim();
        if (val && !st.noteDraftTags.includes(val)) { st.noteDraftTags.push(val); app.render(); }
      });
      document.querySelectorAll("[data-rm-tag]").forEach((b) => b.addEventListener("click", () => { st.noteDraftTags.splice(Number(b.getAttribute("data-rm-tag")), 1); app.render(); }));
      document.getElementById("btn-add-res")?.addEventListener("click", () => {
        const rt = document.getElementById("note-res-title").value.trim();
        const ru = document.getElementById("note-res-url").value.trim();
        if (!rt || (!ru.startsWith("http://") && !ru.startsWith("https://"))) {
          return app.toast("Nhập tên tài liệu và đường dẫn http(s):// hợp lệ", "error");
        }
        st.noteDraftResources.push({ title: rt, url: ru });
        app.render();
      });
      document.querySelectorAll("[data-rm-res]").forEach((b) => b.addEventListener("click", () => { st.noteDraftResources.splice(Number(b.getAttribute("data-rm-res")), 1); app.render(); }));
      document.getElementById("btn-del-note")?.addEventListener("click", () => {
        if (!st.noteSelectedId || !confirm("Xóa ghi chú này?")) return;
        S().deleteNote(user.id, st.noteSelectedId);
        st.noteSelectedId = null;
        st.noteDraftLoadedFor = null;
        st.noteMobilePane = "list";
        app.toast("Đã xóa ghi chú", "info");
        app.render();
      });
      document.getElementById("btn-note-to-ai")?.addEventListener("click", () => {
        const title = st.noteDraftTitle || document.getElementById("note-title")?.value || "";
        const body = st.noteDraftContent || "";
        st.aiMode = "summarize";
        st.aiDoc = `Tiêu đề: ${title}\n\n${body}`;
        st.aiPrompt = `Hãy tóm tắt ghi chú "${title || "này"}" thành các ý cốt lõi và tạo 5 câu hỏi ôn tập.`;
        app.navigate("ai");
      });
      document.getElementById("note-editor-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const saved = S().saveNote(
          user.id,
          {
            title: (document.getElementById("note-title")?.value ?? st.noteDraftTitle).trim(),
            course_id: (document.getElementById("note-course")?.value ?? st.noteDraftCourse) || null,
            content: document.getElementById("note-content")?.value ?? st.noteDraftContent,
            tags: [...st.noteDraftTags],
            resources: [...st.noteDraftResources],
            is_pinned: Boolean(document.getElementById("note-pin")?.checked ?? st.noteDraftPin),
          },
          st.noteCreating ? null : st.noteSelectedId
        );
        st.noteCreating = false;
        st.noteSelectedId = saved.id;
        st.noteDraftLoadedFor = null;
        app.toast("Đã lưu ghi chú học tập", "success");
        app.render();
      });
    }

    if (route === "finance") {
      document.getElementById("fin-month")?.addEventListener("change", (e) => { st.financeMonth = e.target.value; app.render(); });
      document.getElementById("fin-type-filter")?.addEventListener("change", (e) => { st.financeType = e.target.value; app.render(); });
      document.getElementById("btn-add-expense")?.addEventListener("click", () => openTransactionModal(user, "expense"));
      document.getElementById("btn-add-income")?.addEventListener("click", () => openTransactionModal(user, "income"));
      document.getElementById("btn-set-budget")?.addEventListener("click", () => openBudgetModal(user, data));
      document.querySelectorAll("[data-del-tx]").forEach((b) => b.addEventListener("click", () => { if (confirm("Xóa giao dịch này?")) { S().deleteTransaction(user.id, b.getAttribute("data-del-tx")); app.toast("Đã xóa giao dịch", "info"); app.render(); } }));
    }

    if (route === "ai") {
      document.getElementById("btn-ai-config")?.addEventListener("click", () => openAIConfigModal(user));
      document.getElementById("btn-ai-new")?.addEventListener("click", () => { st.aiConvId = null; st.aiError = ""; app.render(); });
      document.querySelectorAll("[data-ai-mode]").forEach((b) =>
        b.addEventListener("click", () => {
          st.aiMode = b.getAttribute("data-ai-mode");
          const m = AI().AI_MODES.find((x) => x.id === st.aiMode);
          if (m && !st.aiPrompt) st.aiPrompt = m.prompt;
          app.render();
        })
      );
      document.getElementById("btn-ai-sample")?.addEventListener("click", () => {
        const m = AI().AI_MODES.find((x) => x.id === st.aiMode);
        if (m) { st.aiPrompt = m.prompt; app.render(); }
      });
      document.getElementById("ai-include-ctx")?.addEventListener("change", (e) => { st.aiIncludeCtx = e.target.checked; });
      document.getElementById("ai-course-select")?.addEventListener("change", (e) => { st.aiCourseId = e.target.value; });
      document.getElementById("ai-import-note")?.addEventListener("change", (e) => {
        const n = data.notes.find((x) => x.id === e.target.value);
        if (n) { st.aiDoc = `Tiêu đề: ${n.title}\n\n${n.content}`; app.toast(`Đã nạp ghi chú "${n.title}"`, "info"); app.render(); }
      });
      document.getElementById("ai-doc")?.addEventListener("input", (e) => { st.aiDoc = e.target.value; });
      document.getElementById("ai-prompt")?.addEventListener("input", (e) => { st.aiPrompt = e.target.value; });
      document.querySelectorAll("[data-open-conv]").forEach((b) => b.addEventListener("click", () => { st.aiConvId = b.getAttribute("data-open-conv"); st.aiError = ""; app.render(); }));
      document.querySelectorAll("[data-del-conv]").forEach((b) => b.addEventListener("click", () => { S().deleteAIConversation(user.id, b.getAttribute("data-del-conv")); if (st.aiConvId === b.getAttribute("data-del-conv")) st.aiConvId = null; app.render(); }));

      document.getElementById("ai-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const promptText = document.getElementById("ai-prompt").value.trim();
        const docText = document.getElementById("ai-doc").value;
        if (!promptText) return;
        st.aiSending = true;
        st.aiError = "";
        st.aiPrompt = promptText;
        st.aiDoc = docText;
        app.render();
        try {
          const cfg = S().getAIConfig(user.id);
          const ctx = st.aiIncludeCtx ? AI().buildStudentContext(user, data, st.aiCourseId) : "";
          const activeConv = data.aiConversations.find((c) => c.id === st.aiConvId);
          const reply = await AI().callAI({
            config: cfg,
            mode: st.aiMode,
            prompt: promptText,
            documentContent: docText,
            studentContext: ctx,
            history: activeConv ? activeConv.messages : [],
          });
          const savedConv = S().addAIMessagePair(user.id, st.aiConvId, st.aiMode, promptText, reply);
          st.aiConvId = savedConv.id;
          st.aiPrompt = "";
        } catch (err) {
          st.aiError = err.message || "Không thể kết nối AI API.";
          app.toast(err.code === "AI_NOT_CONFIGURED" ? "Chưa cấu hình AI API Key" : "Lỗi gọi AI", "error", st.aiError);
        } finally {
          st.aiSending = false;
          app.render();
        }
      });
    }

    if (route === "settings") {
      document.querySelectorAll("[data-pick-avatar]").forEach((b) =>
        b.addEventListener("click", () => {
          document.querySelectorAll("[data-pick-avatar]").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          document.getElementById("p-avatar").value = b.getAttribute("data-pick-avatar");
        })
      );
      document.getElementById("profile-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        S().updateProfile(user.id, {
          full_name: document.getElementById("p-name").value.trim(),
          student_code: document.getElementById("p-code").value.trim(),
          academic_year: document.getElementById("p-year").value,
          current_semester: document.getElementById("p-sem").value.trim(),
          university: document.getElementById("p-uni").value.trim(),
          major: document.getElementById("p-major").value.trim(),
          gpa_target: Number(document.getElementById("p-gpa").value) || 3.6,
          monthly_budget_default: Number(document.getElementById("p-budget").value) || 3500000,
          avatar_color: document.getElementById("p-avatar").value || "#2563eb",
        });
        app.toast("Đã lưu hồ sơ cá nhân!", "success");
        app.render();
      });
      document.querySelectorAll("[data-set-theme]").forEach((b) =>
        b.addEventListener("click", () => {
          app.applyTheme(b.getAttribute("data-set-theme"));
          app.render();
        })
      );
      document.getElementById("pw-change-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const cur = document.getElementById("cpw-cur").value;
        const n1 = document.getElementById("cpw-new").value;
        const n2 = document.getElementById("cpw-new2").value;
        if (n1 !== n2) return app.toast("Xác nhận mật khẩu mới không khớp", "error");
        try {
          await S().changePassword(user.id, cur, n1);
          app.toast("Đổi mật khẩu thành công!", "success");
          e.target.reset();
        } catch (err) {
          app.toast(err.message || "Không thể đổi mật khẩu", "error");
        }
      });
      document.getElementById("btn-export-json")?.addEventListener("click", () => {
        const blob = new Blob([S().exportUserBackup(user.id)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `studyhub-backup-${app.getTodayISO()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        app.toast("Đã tải xuống file sao lưu JSON", "success");
      });
      document.getElementById("input-import-json")?.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            S().importUserBackup(user.id, String(reader.result));
            app.toast("Khôi phục dữ liệu thành công!", "success");
            app.render();
          } catch (err) {
            app.toast(err.message || "File không hợp lệ", "error");
          }
        };
        reader.readAsText(file);
      });
    }
  }

  global.StudyHubViews = {
    renderDashboard,
    renderSchedule,
    renderCourses,
    renderTasks,
    renderExams,
    renderNotes,
    renderFinance,
    renderAI,
    renderSettings,
    bindViewEvents,
  };
})(window);
