/* Qurio Teacher: connect exam approval to the assignment workflow.
   Existing exam editor remains unchanged; approved drafts are selected for dispatch. */
(() => {
  'use strict';
  if (typeof render !== 'function' || typeof exams === 'undefined') return;
  const previousRender = render;
  const KEY = 'qurio_exam_page_v2';

  // Enhance existing renderer without modifying the exam builder.
  render = function () {
    previousRender();
    const rows = document.querySelectorAll('#examRows tr');
    const filter = document.getElementById('filter')?.value || 'all';
    const search = document.getElementById('search')?.value.toLowerCase().trim() || '';
    const visible = exams.filter(e =>
      (filter === 'all' || e.status === filter) &&
      (`${e.title || ''} ${e.subject || ''}`).toLowerCase().includes(search)
    );
    rows.forEach((row, index) => {
      const exam = visible[index];
      if (!exam) return;
      const holder = row.querySelector('.row-actions');
      if (!holder) return;
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'mini';
      action.style.color = '#6535ce';
      if (exam.status === 'draft') {
        action.textContent = '✓ Duyệt đề';
        action.dataset.approveExam = exam.id;
      } else {
        action.textContent = '✈ Giao bài';
        action.dataset.assignExam = exam.id;
      }
      holder.appendChild(action);
    });
  };

  // Capture before the page's main click listener, so these actions do not
  // unintentionally trigger the editor's other buttons.
  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-approve-exam], [data-assign-exam]');
    if (!btn) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const id = btn.dataset.approveExam || btn.dataset.assignExam;
    const exam = exams.find(x => String(x.id) === String(id));
    if (!exam) return;

    if (btn.dataset.approveExam) {
      if (!String(exam.title || '').trim() || !Array.isArray(exam.questions) ||
          !exam.questions.length || exam.questions.some(q => !String(q.text || '').trim())) {
        notice('Hãy hoàn thành tên đề và nội dung các câu hỏi trước khi duyệt.');
        return;
      }
      exam.status = 'approved';
      save(); // Local draft remains fast, cloud sync happens when dispatching.
      render();
      notice('Đã duyệt đề trên máy này. Chọn “Giao bài” để đồng bộ lên máy chủ.');
      return;
    }

    if (exam.status !== 'approved' && exam.status !== 'assigned') {
      notice('Cần duyệt đề trước khi giao bài.');
      return;
    }
    location.href = 'giao-bai.html?examId=' + encodeURIComponent(exam.id);
  }, true);

  // An exam approved in another tab becomes available after returning.
  window.addEventListener('focus', () => {
    try {
      const incoming = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(incoming) && JSON.stringify(incoming) !== JSON.stringify(exams)) {
        exams = incoming;
        render();
      }
    } catch (_) { /* Keep currently loaded drafts. */ }
  });

  render();
})();
