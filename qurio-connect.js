(() => {
  'use strict';

  async function ask(mode, data) {
    const result = await window.QurioAuth.request('qurioAi', { mode, data });
    return result.output;
  }

  async function history() {
    const result = await window.QurioAuth.request('qurioChatHistory');
    return result.history;
  }

  async function showAdvice(button, output, mode, data, prefix = '') {
    if (button.disabled) return;
    button.disabled = true;
    output.textContent = 'Đang tạo gợi ý…';

    try {
      output.textContent = prefix + await ask(mode, data);
    } catch (error) {
      output.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  }

  
async function exam(source, input) {
  if (!window.QurioAuth?.request) {
    throw new Error("Chưa tải hệ thống đăng nhập Qurio.");
  }

  const { file, ...data } = input || {};

  if (source === "pdf" || file) {
    throw new Error(
      "Chưa hỗ trợ phân tích PDF/DOCX trực tiếp. " +
      "Hãy dán nội dung đặc tả vào ô văn bản."
    );
  }

  const subject = String(data.subject || "").trim();
  const grade = Number(data.grade || 11);
  const count = Number(data.count || 10);

  const difficultyMap = {
    "Hỗn hợp": "mixed",
    "Nhận biết": "easy",
    "Thông hiểu": "medium",
    "Vận dụng": "hard"
  };

  const difficulty = difficultyMap[data.level] || "mixed";

  const topic = source === "spec"
    ? String(data.text || "").trim()
    : String(data.topic || "").trim();

  if (!subject) {
    throw new Error("Vui lòng chọn môn học.");
  }

  if (!topic) {
    throw new Error("Vui lòng nhập chủ đề hoặc đặc tả.");
  }

  if (topic.length > 300) {
    throw new Error(
      "Nội dung yêu cầu tối đa 300 ký tự."
    );
  }

  if (!Number.isInteger(count) ||
      count < 1 || count > 20) {
    throw new Error("Chọn từ 1 đến 20 câu hỏi.");
  }

  const result = await window.QurioAuth.request(
    "aiGenerateExam",
    {
      subject,
      grade,
      topic,
      count,
      difficulty
    }
  );

  if (!result.ok || !Array.isArray(result.questions)) {
    throw new Error(
      result.message || "AI không trả về đề hợp lệ."
    );
  }

  return {
    title: "Đề " + subject + " - " + topic.slice(0, 70),
    subject,
    grade,
    questions: result.questions.map((q) => ({
      type: "single",
      text: String(q.prompt || ""),
      options: q.options,
      correct: [q.answer],
      explanation: String(q.explanation || ""),
      points: 1,
      required: true
    }))
  };
}


  window.QurioAI = { ask, history, showAdvice };
  window.QurioExamAPI = {
    topic: data => exam('topic', data),
    spec: data => exam('spec', data),
    pdf: data => exam('pdf', data)
  };
})();