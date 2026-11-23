
const QURIO_AI_API =
  "https://script.google.com/macros/s/AKfycbzB94y2i27gDUvH6stYkV5FqpI4aLAfXVomNfl9TSw8ckREkc7VvjCzjbnqqAISV2OL/exec";

async function guiCauHoiAI(question, token) {
  if (!question || !question.trim()) {
    throw new Error("Vui lòng nhập câu hỏi.");
  }

  if (!token) {
    throw new Error("Vui lòng đăng nhập.");
  }

  const response = await fetch(QURIO_AI_API, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      action: "aiTutor",
      token: token,
      content: question.trim()
    }),
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error("Lỗi kết nối: " + response.status);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || "AI gặp lỗi.");
  }

  return data.answer;
}
