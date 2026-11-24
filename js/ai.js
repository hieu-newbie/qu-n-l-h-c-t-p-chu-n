/* ============================================================================
   STUDYHUB AI STUDY ASSISTANT CLIENT (Real API calls — Zero Mocked Replies)
   Supports Google Gemini Interactions API (gemini-4-hydrogen) & OpenAI API
   ============================================================================ */
(function (global) {
  "use strict";

  const AI_MODES = [
    {
      id: "study_plan",
      label: "Lập kế hoạch học tập",
      desc: "Kế hoạch tuần bám sát lịch & deadline",
      prompt:
        "Dựa trên thời khóa biểu, bài tập sắp đến hạn và lịch thi hiện tại của tôi, hãy lập kế hoạch học tập chi tiết cho 7 ngày tới.",
      focus: "Lập kế hoạch học tập chi tiết theo từng ngày/khung giờ, ưu tiên bài tập gấp và kỳ thi gần nhất.",
    },
    {
      id: "schedule_analysis",
      label: "Phân tích lịch & deadline",
      desc: "Tìm ngày quá tải & xung đột",
      prompt:
        "Hãy phân tích thời khóa biểu và danh sách deadline của tôi để chỉ ra ngày quá tải và cách sắp xếp ưu tiên.",
      focus: "Phân tích mật độ lịch học, phát hiện ngày cao điểm, deadline chồng chéo/quá hạn và đề xuất tái phân bổ.",
    },
    {
      id: "review_schedule",
      label: "Đề xuất giờ ôn tập",
      desc: "Tận dụng khoảng trống để ôn thi",
      prompt:
        "Dựa vào khoảng trống trong thời khóa biểu và các kỳ thi sắp tới, hãy đề xuất khung giờ ôn tập hiệu quả nhất cho từng môn.",
      focus: "Tìm khoảng trống hợp lý trong lịch học và phân bổ các phiên ôn tập theo Pomodoro / Spaced Repetition.",
    },
    {
      id: "summarize",
      label: "Tóm tắt tài liệu",
      desc: "Cô đọng bài giảng thành ý chính",
      prompt:
        "Hãy tóm tắt tài liệu học tập đính kèm thành các ý cốt lõi, công thức quan trọng và checklist ôn thi nhanh.",
      focus: "Tóm tắt tài liệu cô đọng, có cấu trúc rõ ràng, nổi bật khái niệm cốt lõi và checklist ôn nhanh.",
      needsDoc: true,
    },
    {
      id: "explain",
      label: "Giải thích tài liệu",
      desc: "Làm rõ khái niệm khó + ví dụ",
      prompt:
        "Hãy giải thích dễ hiểu các khái niệm chính trong tài liệu đính kèm kèm ví dụ thực tế sinh động.",
      focus: "Giải thích từng bước từ cơ bản đến nâng cao kèm ví dụ trực quan và lỗi hiểu nhầm thường gặp.",
      needsDoc: true,
    },
    {
      id: "quiz",
      label: "Tạo câu hỏi ôn tập",
      desc: "Sinh đề trắc nghiệm & tự luận",
      prompt:
        "Hãy tạo 6 câu hỏi trắc nghiệm 4 lựa chọn và 2 câu tự luận ngắn ôn tập, kèm đáp án & giải thích chi tiết ở cuối.",
      focus: "Tạo bộ câu hỏi ôn tập sát nội dung tài liệu/môn học kèm đáp án và giải thích chi tiết ở cuối.",
      needsDoc: true,
    },
    {
      id: "grade_analysis",
      label: "Phân tích kết quả học tập",
      desc: "Đánh giá GPA & điểm từng môn",
      prompt:
        "Hãy phân tích bảng điểm hiện tại và GPA của tôi so với mục tiêu, chỉ rõ môn nào cần ưu tiên kéo điểm nhất.",
      focus: "Phân tích GPA, điểm mạnh/yếu từng môn và tính điểm tối thiểu cần đạt ở các đầu điểm còn lại.",
    },
    {
      id: "improvement",
      label: "Cải thiện kết quả",
      desc: "Chiến lược nâng điểm thực chiến",
      prompt:
        "Dựa trên kết quả học tập hiện tại, hãy đề xuất phương pháp học và lộ trình cải thiện GPA hiệu quả.",
      focus: "Đề xuất lộ trình học tập khoa học, thói quen ôn luyện và mẹo nâng điểm thực tế cho sinh viên.",
    },
  ];

  function buildStudentContext(user, data, focusCourseId) {
    const gpa = global.StudyHubStore.calculateOverallGpa(data.courses);
    const dayNames = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật" };
    const lines = [];
    lines.push("=== HỒ SƠ SINH VIÊN ===");
    lines.push(`Họ tên: ${user.full_name} | Trường: ${user.university || "Chưa rõ"} | Ngành: ${user.major || "Chưa rõ"}`);
    lines.push(`Học kỳ: ${user.current_semester} | Mục tiêu GPA: ${user.gpa_target}/4.0`);
    lines.push(`GPA hiện tại: ${gpa.gpa4 !== null ? `${gpa.gpa4}/4.0 (${gpa.gpa10}/10 - ${gpa.standing})` : "Chưa có điểm"} | Tổng TC: ${gpa.totalCredits}`);

    lines.push(`\n=== MÔN HỌC (${data.courses.length}) ===`);
    data.courses.forEach((c) => {
      const s = global.StudyHubStore.calculateCourseGrade(c.grade_components);
      const tag = focusCourseId && c.id === focusCourseId ? " [MÔN ĐANG TẬP TRUNG]" : "";
      lines.push(`- [${c.code}] ${c.name} (${c.credits} TC)${tag}: ${s.finalScore10 !== null ? `${s.finalScore10}/10 (${s.letterGrade})` : "Chưa có điểm"}`);
    });

    lines.push(`\n=== THỜI KHÓA BIỂU (${data.schedule.length}) ===`);
    data.schedule.forEach((s) => {
      lines.push(`- ${dayNames[s.day_of_week]} ${s.start_time}-${s.end_time}: ${s.title}${s.room ? ` (${s.room})` : ""}`);
    });

    const pending = data.tasks.filter((t) => t.status !== "done");
    lines.push(`\n=== BÀI TẬP CHƯA XONG (${pending.length}) ===`);
    pending.slice(0, 15).forEach((t) => {
      const overdue = t.due_date && new Date(t.due_date).getTime() < Date.now() ? " [QUÁ HẠN]" : "";
      lines.push(`- ${t.title} | Ưu tiên: ${t.priority} | Hạn: ${t.due_date || "Chưa đặt"}${overdue}`);
    });

    const upcomingExams = data.exams.filter((e) => new Date(e.exam_date).getTime() >= Date.now() - 86400000);
    lines.push(`\n=== LỊCH THI SẮP TỚI (${upcomingExams.length}) ===`);
    upcomingExams.forEach((e) => {
      lines.push(`- ${e.title} | Ngày giờ: ${e.exam_date} | Thời lượng: ${e.duration_minutes}p | Phòng: ${e.location || "Chưa rõ"}`);
    });

    return lines.join("\n");
  }

  function extractGeminiInteractionText(json) {
    if (typeof json.output_text === "string" && json.output_text.trim()) {
      return json.output_text.trim();
    }
    if (Array.isArray(json.steps)) {
      const texts = [];
      for (const step of json.steps) {
        if (step && step.type === "model_output" && Array.isArray(step.content)) {
          for (const part of step.content) {
            if (part && part.type === "text" && part.text) texts.push(part.text);
          }
        }
      }
      if (texts.length) return texts.join("\n").trim();
    }
    return "";
  }

  async function callAI({ config, mode, prompt, documentContent, studentContext, history }) {
    if (!config || !config.apiKey || !config.apiKey.trim()) {
      throw {
        code: "AI_NOT_CONFIGURED",
        message: "Bạn chưa nhập API Key AI. Vui lòng nhập Gemini API Key (hoặc OpenAI API Key) ở bảng cấu hình bên trên để kích hoạt AI Study Assistant.",
      };
    }

    const modeObj = AI_MODES.find((m) => m.id === mode) || AI_MODES[0];
    const systemInstruction = [
      "Bạn là STUDYHUB AI Study Assistant — trợ lý học tập đại học thông minh dành cho sinh viên Việt Nam.",
      "Luôn trả lời bằng tiếng Việt rõ ràng, có cấu trúc Markdown dễ đọc, thực tế và dễ áp dụng.",
      `Chế độ hiện tại: ${modeObj.label}. ${modeObj.focus}`,
    ].join("\n\n");

    const parts = [];
    if (studentContext) parts.push("DỮ LIỆU HỌC TẬP THỰC TẾ:\n" + studentContext);
    if (documentContent && documentContent.trim()) {
      parts.push('TÀI LIỆU ĐÍNH KÈM:\n"""\n' + documentContent.trim() + '\n"""');
    }
    if (history && history.length) {
      parts.push(
        "LỊCH SỬ GẦN ĐÂY:\n" +
          history
            .slice(-6)
            .map((m) => `${m.role === "user" ? "Sinh viên" : "Trợ lý AI"}: ${m.content}`)
            .join("\n\n")
      );
    }
    parts.push("YÊU CẦU HIỆN TẠI:\n" + prompt);
    const fullInput = parts.join("\n\n---\n\n");

    const provider = config.provider || "gemini";
    const model = (config.model || (provider === "gemini" ? "gemini-4-hydrogen" : "gpt-4o-mini")).trim();

    if (provider === "gemini") {
      const res = await fetch("https://generativelanguage.googleapis.com/v1/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey.trim(),
        },
        body: JSON.stringify({
          model,
          system_instruction: systemInstruction,
          input: fullInput,
          store: false,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw { code: "API_ERROR", message: `Lỗi Google Gemini API (${res.status}): ${errText.slice(0, 260)}` };
      }
      const data = await res.json();
      const text = extractGeminiInteractionText(data);
      if (!text) throw { code: "EMPTY_RESPONSE", message: "Mô hình Gemini không trả về nội dung văn bản." };
      return text;
    }

    const endpoint =
      provider === "openai"
        ? "https://api.openai.com/v1/chat/completions"
        : `${String(config.baseUrl || "").replace(/\/+$/, "")}/chat/completions`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: fullInput },
        ],
        temperature: 0.6,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw { code: "API_ERROR", message: `Lỗi AI Provider (${res.status}): ${errText.slice(0, 260)}` };
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw { code: "EMPTY_RESPONSE", message: "AI Provider không trả về nội dung." };
    return text;
  }

  // Safe lightweight Markdown renderer (XSS-escaped)
  function renderMarkdownSafe(md) {
    const esc = String(md || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const lines = esc.split(/\r?\n/);
    let html = "";
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) { html += "</ul>"; inUl = false; }
      if (inOl) { html += "</ol>"; inOl = false; }
    };

    const inlineFmt = (s) =>
      s
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        closeLists();
        continue;
      }
      if (trimmed.startsWith("### ")) {
        closeLists();
        html += `<h3>${inlineFmt(trimmed.slice(4))}</h3>`;
      } else if (trimmed.startsWith("## ")) {
        closeLists();
        html += `<h2>${inlineFmt(trimmed.slice(3))}</h2>`;
      } else if (trimmed.startsWith("# ")) {
        closeLists();
        html += `<h1>${inlineFmt(trimmed.slice(2))}</h1>`;
      } else if (trimmed.startsWith("> ")) {
        closeLists();
        html += `<blockquote>${inlineFmt(trimmed.slice(2))}</blockquote>`;
      } else if (/^[-*]\s+/.test(trimmed)) {
        if (inOl) { html += "</ol>"; inOl = false; }
        if (!inUl) { html += "<ul>"; inUl = true; }
        html += `<li>${inlineFmt(trimmed.replace(/^[-*]\s+/, ""))}</li>`;
      } else if (/^\d+\.\s+/.test(trimmed)) {
        if (inUl) { html += "</ul>"; inUl = false; }
        if (!inOl) { html += "<ol>"; inOl = true; }
        html += `<li>${inlineFmt(trimmed.replace(/^\d+\.\s+/, ""))}</li>`;
      } else {
        closeLists();
        html += `<p>${inlineFmt(trimmed)}</p>`;
      }
    }
    closeLists();
    return html || '<p class="muted">Chưa có nội dung.</p>';
  }

  global.StudyHubAI = {
    AI_MODES,
    buildStudentContext,
    callAI,
    renderMarkdownSafe,
  };
})(window);
