
(() => {
  "use strict";

  const subjects = {
    "geogebra-lab.html": ["math", "Toán học"],
    "vat-ly.html": ["physics", "Vật lý"],
    "hoa-hoc.html": ["chemistry", "Hóa học"],
    "sinh-hoc.html": ["biology", "Sinh học"]
  };

  const page = decodeURIComponent(
    window.location.pathname.split("/").pop()
  );

  const subject = subjects[page];
  if (!subject) return;

  window.addEventListener("load", async () => {
    if (!window.QurioLabCloud?.historyAdd) return;

    try {
      await window.QurioLabCloud.historyAdd({
        title: "Khám phá " + subject[1],
        subject: subject[0],
        grade: "",
        status: "Đã mở"
      });

      console.log("Đã ghi lịch sử Phòng Lab.");
    } catch (error) {
      console.warn("Không thể ghi lịch sử:", error.message);
    }
  });
})();
