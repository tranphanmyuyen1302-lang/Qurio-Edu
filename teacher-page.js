(() => {
  'use strict';
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabs = [['overview','Tổng quan','teacher'],['classes','Lớp học','users'],['questions','Câu hỏi','book'],['exams','Đề kiểm tra','file'],['assignments','Giao bài','calendar'],['results','Kết quả','chart'],['plans','Kế hoạch','route'],['reports','Báo cáo','chart']];
  const subjects = ['Toán học','Vật lý','Hóa học','Sinh học','Ngữ văn','Lịch sử','Địa lý','Ngoại ngữ','Tin học','Môn khác'];
  let root, tab = 'overview', selectedClass = '', query = '', saving = false, renderTicket = 0;
  const ws = () => window.QurioWorkspace;
  const db = () => ws()?.data || {};
  const items = key => Array.isArray(db()[key]) ? db()[key] : [];
  const byId = (key,id) => items(key).find(item => item.id === id);
  const ico = name => window.QurioUI?.icon?.(name) || '';
  const toast = text => window.QurioUI?.toast?.(text);
  const norm = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
  const matches = text => norm(text).includes(norm(query));
  const date = value => value ? new Date(value).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}) : 'Chưa đặt';
  const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const options = (list,label='name',chosen='') => list.map(item=>`<option value="${e(item.id)}" ${item.id===chosen?'selected':''}>${e(item[label])}</option>`).join('');
  const btn = (text,action,id='',kind='secondary') => `<button type="button" class="q-btn ${kind}" data-teacher="${action}" data-id="${e(id)}">${text}</button>`;
  const empty = (title,body,action='',label='') => `<div class="q-empty"><span class="q-empty-icon">${ico('book')}</span><h3>${title}</h3><p>${body}</p>${action?btn(label,action,'','primary'):''}</div>`;
  const tools = (label,action) => `<div class="q-toolbar"><div><p class="q-muted">Dữ liệu riêng của tài khoản giáo viên</p></div><div class="q-toolbar-actions"><input class="q-input" type="search" data-teacher-search placeholder="Tìm trong mục này…" aria-label="Tìm kiếm" value="${e(query)}">${action?btn(label,action,'','primary'):''}</div></div>`;
  const table = (heads,rows) => `<div class="q-table-wrap"><table class="q-table"><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  const field = (name,label,type='text',value='',extra='') => `<div class="q-field"><label for="t-${name}">${label}</label><input class="q-input" id="t-${name}" name="${name}" type="${type}" value="${e(value)}" ${extra}></div>`;
  const textarea = (name,label,value='',max=2000) => `<div class="q-field"><label for="t-${name}">${label}</label><textarea class="q-input" id="t-${name}" name="${name}" rows="3" maxlength="${max}">${e(value)}</textarea></div>`;
  const select = (name,label,content) => `<div class="q-field"><label for="t-${name}">${label}</label><select class="q-input" id="t-${name}" name="${name}">${content}</select></div>`;
  const read = form => Object.fromEntries(new FormData(form));

  function modal(title,markup,handler,afterMount) {
    if (saving) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'q-dialog';
    const headingId = 'teacher-dialog-' + Date.now();
    dialog.setAttribute('aria-labelledby',headingId);
    dialog.innerHTML = `<form><header class="q-dialog-head"><h2 id="${headingId}">${e(title)}</h2><button type="button" class="q-btn secondary" data-close aria-label="Đóng">×</button></header><div class="q-dialog-body">${markup}<p class="q-alert" role="alert" data-error hidden></p></div><footer class="q-dialog-actions"><button type="button" class="q-btn secondary" data-close>Hủy</button><button type="submit" class="q-btn primary">Lưu dữ liệu</button></footer></form>`;
    document.body.append(dialog);
    const form = dialog.querySelector('form');
    dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>{if(!saving)dialog.close();}));
    dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();});
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(saving || !form.reportValidity())return;
      const error = form.querySelector('[data-error]');
      error.hidden = true;
      saving = true;
      const controls = [...form.querySelectorAll('button')];
      controls.forEach(button=>button.disabled=true);
      form.setAttribute('aria-busy','true');
      try { await handler(form); dialog.close(); toast('Đã lưu dữ liệu.'); paint(); }
      catch(problem){error.textContent=problem.message||'Chưa lưu được dữ liệu. Bạn thử lại nhé.';error.hidden=false;}
      finally{saving=false;controls.forEach(button=>button.disabled=false);form.removeAttribute('aria-busy');}
    });
    afterMount?.(form);
    dialog.showModal();
  }

  async function mutate(op,payload){
    await ws().request(op,payload);
  }
  function route(next){tab=next;query='';location.hash=next;paint();}
  function pickedTab(){const aliases={home:'overview',teacher:'overview',bank:'questions',errors:'reports',paths:'plans',activity:'overview'};const value=location.hash.slice(1)||new URLSearchParams(location.search).get('tab')||document.body.dataset.teacherTab||'overview';return aliases[value]||value;}
  function heading(){return `<header class="q-page-head"><div><span class="q-eyebrow">KHÔNG GIAN GIÁO VIÊN</span><h1>${tabs.find(item=>item[0]===tab)?.[1]||'Giáo viên'}</h1><p>Cùng Qurio biến những ý tưởng giảng dạy thành giờ học ý nghĩa.</p></div>${btn('Hướng dẫn dữ liệu','guide','','secondary')}</header><nav class="q-tabs" aria-label="Chức năng giáo viên">${tabs.map(([id,label])=>`<button type="button" data-teacher="tab" data-id="${id}" class="${tab===id?'active':''}" aria-pressed="${tab===id}">${label}</button>`).join('')}</nav>`;}
  function overview(){
    const user=db().user||{};
    const cards=[['classes','Lớp học','Quản lý danh sách học sinh và từng lớp.','users'],['questions','Ngân hàng câu hỏi','Soạn câu hỏi và lời giải theo môn học.','book'],['exams','Đề kiểm tra','Ghép câu hỏi thành đề kiểm tra của bạn.','file'],['assignments','Giao bài','Chọn lớp, đề kiểm tra và hạn hoàn thành.','calendar'],['results','Kết quả học sinh','Ghi nhận điểm số và nhận xét cụ thể.','chart'],['reports','Báo cáo','Tổng hợp kết quả và xuất bảng CSV.','chart']];
    const recent=items('assignments').slice().sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,4);
    return `<section class="q-hero"><div><span class="q-badge">DẠY HỌC CÓ TỔ CHỨC</span><h2>Xin chào, ${e(user.name||'thầy/cô')}!</h2><p>Một nơi để chuẩn bị bài, đồng hành cùng lớp và nhìn thấy sự tiến bộ của từng học sinh.</p><div class="q-toolbar-actions">${btn('Tạo lớp đầu tiên','class-new','','primary')}${btn('Soạn câu hỏi','question-new')}</div></div><div class="q-hero-art" aria-hidden="true">${ico('teacher')}</div></section><div class="q-grid q-stats">${[['classes','Lớp học','users'],['students','Học sinh','users'],['exams','Đề kiểm tra','file'],['assignments','Bài đã giao','calendar']].map(([key,label,icon])=>`<article class="q-card q-stat"><span class="q-stat-icon">${ico(icon)}</span><strong>${items(key).length}</strong><span>${label}</span></article>`).join('')}</div><div class="q-section-head"><h2>Bắt đầu một giờ học tốt</h2><span class="q-muted">Công cụ dành cho thầy/cô</span></div><div class="q-grid">${cards.map(([id,title,body,icon])=>`<button type="button" class="q-card q-feature" data-teacher="tab" data-id="${id}"><span class="q-feature-icon">${ico(icon)}</span><h3>${title}</h3><p>${body}</p><span class="q-feature-link">Mở công cụ ↗</span></button>`).join('')}</div><section class="q-card" style="margin-top:24px"><div class="q-section-head"><h2>Bài giao gần đây</h2>${btn('Xem tất cả','tab','assignments')}</div>${recent.length?table(['Bài giao','Lớp','Hạn hoàn thành'],recent.map(item=>`<tr><td><strong>${e(item.title)}</strong></td><td>${e(byId('classes',item.classId)?.name||'Lớp đã xóa')}</td><td>${date(item.dueAt)}</td></tr>`)):'<p class="q-muted">Chưa có bài giao. Tạo một lớp học và một đề kiểm tra để bắt đầu.</p>'}</section>`;
  }
  function classes(){
    const list=items('classes').filter(item=>matches(item.name+' '+item.subject));
    const selected=byId('classes',selectedClass);
    let html=tools('Tạo lớp','class-new');
    html+=list.length?`<div class="q-grid">${list.map(item=>`<article class="q-card"><div class="q-section-head"><span class="q-badge">${e(item.subject)}</span><span class="q-muted">${items('students').filter(s=>s.classId===item.id).length} học sinh</span></div><h2>${e(item.name)}</h2><p class="q-muted">${e(item.description||'Thêm mô tả để ghi nhớ mục tiêu của lớp.')}</p><div class="q-toolbar-actions" style="margin-top:18px">${btn('Danh sách lớp','class-open',item.id,'primary')}${btn('Sửa','class-edit',item.id)}${btn('Xóa','delete-classes',item.id)}</div></article>`).join('')}</div>`:empty('Lớp học đang chờ thầy/cô','Tạo lớp đầu tiên, sau đó thêm danh sách học sinh.','class-new','Tạo lớp mới');
    if(selected){const students=items('students').filter(item=>item.classId===selected.id);html+=`<section class="q-card" style="margin-top:24px"><div class="q-section-head"><div><span class="q-eyebrow">DANH SÁCH LỚP</span><h2>${e(selected.name)}</h2></div>${btn('Thêm học sinh','student-new',selected.id,'primary')}</div><p class="q-muted">Email giúp liên kết với tài khoản học sinh Qurio khi có tài khoản tương ứng.</p>${students.length?table(['Học sinh','Email','Thao tác'],students.map(item=>`<tr><td><strong>${e(item.name)}</strong></td><td>${e(item.email||'Chưa cập nhật')}</td><td>${btn('Sửa','student-edit',item.id)} ${btn('Xóa','delete-students',item.id)}</td></tr>`)):'<div class="q-empty"><h3>Chưa có học sinh</h3><p>Thêm học sinh vào lớp để bắt đầu giao bài.</p></div>'}</section>`;}
    return html;
  }
  function questions(){const list=items('questions').filter(item=>matches(item.prompt+' '+item.subject));
return tools('Soạn câu hỏi','question-new')
  + `<div class="q-toolbar-actions" style="margin:12px 0 20px">
       ${btn('✨ Tạo câu hỏi bằng AI','ai-question-new','','primary')}
     </div>`
+(list.length?`<div class="q-grid">${list.map(item=>`<article class="q-card"><span class="q-badge">${e(item.subject)}</span><h3 style="margin:14px 0">${e(item.prompt)}</h3><ol type="A" class="q-answer-list">${item.options.map((value,index)=>`<li ${index===item.answer?'class="correct"':''}>${e(value)}${index===item.answer?' ✓':''}</li>`).join('')}</ol><p class="q-muted">${e(item.explanation||'Chưa thêm giải thích.')}</p><div class="q-toolbar-actions" style="margin-top:16px">${btn('Chỉnh sửa','question-edit',item.id)}${btn('Xóa','delete-questions',item.id)}</div></article>`).join('')}</div>`:empty('Ngân hàng câu hỏi còn trống','Soạn câu hỏi, bốn lựa chọn và đáp án để tạo đề của riêng bạn.','question-new','Soạn câu hỏi'));}
  function exams(){const list=items('exams').filter(item=>matches(item.title));return tools('Tạo đề kiểm tra','exam-new')+(list.length?`<div class="q-grid">${list.map(item=>`<article class="q-card"><span class="q-badge">ĐỀ KIỂM TRA</span><h2 style="margin:14px 0 8px">${e(item.title)}</h2><p class="q-muted">${item.questionIds.length} câu hỏi · ${item.minutes} phút</p><div class="q-toolbar-actions" style="margin-top:20px">${btn('Xem đề','exam-view',item.id,'primary')}${btn('Sửa','exam-edit',item.id)}${btn('Xóa','delete-exams',item.id)}</div></article>`).join('')}</div>`:empty('Chuẩn bị đề kiểm tra đầu tiên','Chọn câu hỏi đã soạn, đặt tên đề và thời gian làm bài.','exam-new','Tạo đề'));}
  function assignments(){const list=items('assignments').filter(item=>matches(item.title+' '+byId('classes',item.classId)?.name));return tools('Giao bài mới','assignment-new')+(list.length?`<section class="q-card">${table(['Bài giao','Lớp','Đề kiểm tra','Hạn hoàn thành','Thao tác'],list.map(item=>`<tr><td><strong>${e(item.title)}</strong></td><td>${e(byId('classes',item.classId)?.name||'—')}</td><td>${e(byId('exams',item.examId)?.title||'—')}</td><td>${date(item.dueAt)}</td><td>${btn('Sửa','assignment-edit',item.id)} ${btn('Xóa','delete-assignments',item.id)}</td></tr>`))}</section>`:empty('Chưa giao bài cho lớp','Khi đã có lớp và đề kiểm tra, thầy/cô có thể giao bài tại đây.','assignment-new','Giao bài'));}
  function results(){const list=items('results').filter(item=>matches(byId('students',item.studentId)?.name+' '+byId('assignments',item.assignmentId)?.title));return tools('Ghi nhận kết quả','result-new')+`<p class="q-alert">Điểm nhập thủ công được ghi rõ nguồn. Báo cáo chỉ tổng hợp những kết quả đã lưu.</p>`+(list.length?`<section class="q-card">${table(['Học sinh','Bài giao','Điểm / 10','Nhận xét','Nguồn','Thao tác'],list.map(item=>`<tr><td><strong>${e(byId('students',item.studentId)?.name||'Học sinh')}</strong></td><td>${e(byId('assignments',item.assignmentId)?.title||'—')}</td><td><span class="q-badge">${Number(item.score).toFixed(1)}</span></td><td>${e(item.feedback||'—')}</td><td>${item.source==='submitted'?'Bài làm học sinh':'Giáo viên nhập'}</td><td>${item.source!=='submitted'?btn('Sửa','result-edit',item.id):''} ${btn('Xóa','delete-results',item.id)}</td></tr>`))}</section>`:empty('Chưa có kết quả học tập','Ghi nhận kết quả theo từng bài giao và từng học sinh.','result-new','Nhập kết quả'));}
  function plans(){const list=items('plans').filter(item=>matches(item.title+' '+item.description)).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));return tools('Thêm kế hoạch','plan-new')+(list.length?`<div class="q-grid">${list.map(item=>`<article class="q-card"><div class="q-section-head"><span class="q-badge">${item.done?'Đã hoàn thành':'Đang thực hiện'}</span><span class="q-muted">${date(item.date+'T00:00:00+07:00')}</span></div><h3>${e(item.title)}</h3><p class="q-muted">${e(byId('classes',item.classId)?.name||'Kế hoạch cá nhân')}</p><p style="margin-top:12px;white-space:pre-wrap">${e(item.description)}</p><div class="q-toolbar-actions" style="margin-top:18px">${btn(item.done?'Mở lại':'Hoàn thành','plan-toggle',item.id,'primary')}${btn('Sửa','plan-edit',item.id)}${btn('Xóa','delete-plans',item.id)}</div></article>`).join('')}</div>`:empty('Lên kế hoạch cho giờ học tới','Ghi lại nội dung cần chuẩn bị và ngày thực hiện.','plan-new','Tạo kế hoạch'));}
  function reports(){const results=items('results'),total=results.length,average=total?results.reduce((sum,item)=>sum+Number(item.score),0)/total:0;const ranges=[['Dưới 5',0,5],['5 – dưới 6,5',5,6.5],['6,5 – dưới 8',6.5,8],['8 – 10',8,10.01]];return `<div class="q-toolbar"><p class="q-muted">Tổng hợp từ ${total} kết quả đã lưu, không bao gồm bài chưa chấm.</p>${btn('Xuất báo cáo CSV','export','','primary')}</div><div class="q-grid q-stats"><article class="q-card q-stat"><strong>${total}</strong><span>Kết quả đã ghi nhận</span></article><article class="q-card q-stat"><strong>${total?average.toFixed(1):'—'}</strong><span>Điểm trung bình / 10</span></article><article class="q-card q-stat"><strong>${total?Math.round(results.filter(item=>Number(item.score)>=5).length/total*100)+'%':'—'}</strong><span>Kết quả từ 5 điểm</span></article></div><div class="q-split" style="margin-top:24px"><section class="q-card"><h2>Phân bố điểm</h2>${total?ranges.map(([label,min,max])=>{const count=results.filter(item=>Number(item.score)>=min&&Number(item.score)<max).length;return `<div style="margin-top:18px"><div class="q-section-head"><strong>${label}</strong><span class="q-muted">${count} kết quả</span></div><div class="q-meter"><span style="width:${Math.round(count/total*100)}%"></span></div></div>`;}).join(''):'<p class="q-muted" style="margin-top:16px">Biểu đồ sẽ xuất hiện khi có điểm.</p>'}</section><section class="q-card"><h2>Đọc báo cáo đúng cách</h2><p style="margin-top:14px">Điểm số giúp phát hiện những bài cần ôn lại. Thầy/cô nên kết hợp với bài làm và nhận xét trực tiếp.</p><p class="q-muted" style="margin-top:14px">Chưa thể suy ra lỗi sai theo từng câu từ điểm nhập thủ công. Chức năng này cần dữ liệu câu trả lời của bài làm thực tế.</p>${btn('Xem kết quả chi tiết','tab','results')}</section></div>`;}

  function classForm(item){modal(item?'Chỉnh sửa lớp':'Tạo lớp học',field('name','Tên lớp','text',item?.name||'','required maxlength="80"')+select('subject','Môn học',subjects.map(s=>`<option ${s===item?.subject?'selected':''}>${s}</option>`).join(''))+textarea('description','Mục tiêu hoặc ghi chú',item?.description||'',1000),form=>mutate('classSave',{...read(form),...(item?{id:item.id}:{})}));}
  function studentForm(item,classId){if(!byId('classes',item?.classId||classId)){toast('Tạo và chọn một lớp trước nhé.');route('classes');return;}modal(item?'Chỉnh sửa học sinh':'Thêm học sinh',select('classId','Lớp',options(items('classes'),'name',item?.classId||classId))+field('name','Họ và tên','text',item?.name||'','required maxlength="100"')+field('email','Email tài khoản Qurio (nếu có)','email',item?.email||'','maxlength="254"'),form=>mutate('studentSave',{...read(form),...(item?{id:item.id}:{})}));}
  
async function aiQuestionForm() {
  if (saving) return;

  const dialog = document.createElement("dialog");
  dialog.className = "q-dialog";

  dialog.innerHTML = `
    <form id="qurio-ai-exam-form">
      <header class="q-dialog-head">
        <h2>Tạo câu hỏi bằng Qurio AI</h2>
        <button type="button" class="q-btn secondary"
          data-close>Đóng</button>
      </header>

      <div class="q-dialog-body">
        ${select("subject", "Môn học",
          subjects.map(s =>
            '<option value="' + e(s) + '">' +
            e(s) + '</option>'
          ).join("")
        )}

        ${select("grade", "Khối lớp",
          [10, 11, 12].map(g =>
            '<option value="' + g + '">' +
            'Lớp ' + g + '</option>'
          ).join("")
        )}

        ${field("topic", "Chủ đề kiến thức",
          "text", "", 'required maxlength="300"')}

        ${field("count", "Số câu hỏi",
          "number", 5,
          'required min="1" max="20"')}

        ${select("difficulty", "Độ khó", `
          <option value="easy">Dễ</option>
          <option value="medium">Trung bình</option>
          <option value="hard">Khó</option>
          <option value="mixed" selected>
            Kết hợp
          </option>
        `)}

        <p class="q-muted">
          AI tạo bản nháp. Giáo viên cần kiểm tra
          đáp án và lời giải trước khi lưu.
        </p>

        <p id="ai-exam-status" role="status"></p>
        <div id="ai-exam-preview"></div>
      </div>

      <footer class="q-dialog-actions">
        <button type="submit"
          class="q-btn primary" id="ai-exam-generate">
          Tạo câu hỏi bằng AI
        </button>

        <button type="button"
          class="q-btn primary"
          id="ai-exam-save"
          hidden>
          Lưu câu đã chọn
        </button>
      </footer>
    </form>
  `;

  document.body.appendChild(dialog);

  const form = dialog.querySelector("form");
  const preview = dialog.querySelector("#ai-exam-preview");
  const status = dialog.querySelector("#ai-exam-status");
  const saveBtn = dialog.querySelector("#ai-exam-save");
  const generateBtn = dialog.querySelector("#ai-exam-generate");

  let questionsAI = [];
  let busy = false;

  dialog.querySelector("[data-close]").onclick = () => {
    if (!busy) dialog.close();
  };

  dialog.addEventListener("cancel", event => {
    if (busy) event.preventDefault();
  });

  dialog.addEventListener("close", () => dialog.remove());

  form.onsubmit = async event => {
    event.preventDefault();

    if (busy || !form.reportValidity()) return;

    busy = true;
    generateBtn.disabled = true;
    saveBtn.hidden = true;
    preview.innerHTML = "";
    status.textContent = "Đang tạo câu hỏi...";

    try {
      const values = read(form);

      const result = await window.QurioAuth.request(
        "aiGenerateExam",
        {
          subject: values.subject,
          grade: Number(values.grade),
          topic: values.topic,
          count: Number(values.count),
          difficulty: values.difficulty
        }
      );

      if (!result.ok || !Array.isArray(result.questions)) {
        throw new Error(
          result.message || "Không tạo được câu hỏi"
        );
      }

      questionsAI = result.questions;

      preview.innerHTML = questionsAI.map((q, i) => `
        <article class="q-card" style="margin-top:14px">
          <label>
            <input type="checkbox"
              class="ai-question-check"
              value="${i}" checked>
            <strong>Câu ${i + 1}</strong>
          </label>

          <p style="margin:12px 0">${e(q.prompt)}</p>

          <ol type="A" class="q-answer-list">
            ${q.options.map((option, index) => `
              <li>
                ${e(option)}
                ${index === q.answer ? " ✓" : ""}
              </li>
            `).join("")}
          </ol>

          <p class="q-muted">
            <strong>Giải thích:</strong>
            ${e(q.explanation)}
          </p>
        </article>
      `).join("");

      status.textContent =
        "Đã tạo " + questionsAI.length +
        " câu. Hãy kiểm tra và chọn câu muốn lưu.";

      saveBtn.hidden = false;

    } catch (error) {
      status.textContent =
        error.message || "Không thể tạo câu hỏi.";
    } finally {
      busy = false;
      generateBtn.disabled = false;
    }
  };

  saveBtn.onclick = async () => {
    if (busy) return;

    const selected = [
      ...preview.querySelectorAll(
        ".ai-question-check:checked"
      )
    ].map(el => questionsAI[Number(el.value)]);

    if (!selected.length) {
      status.textContent = "Hãy chọn ít nhất một câu.";
      return;
    }

    if (!confirm(
      "Bạn đã kiểm tra đáp án và muốn lưu " +
      selected.length + " câu vào ngân hàng?"
    )) return;

    busy = true;
    saveBtn.disabled = true;
    generateBtn.disabled = true;

    let saved = 0;

    try {
      for (const q of selected) {
        status.textContent =
          "Đang lưu câu " + (saved + 1) +
          "/" + selected.length;

        await mutate("questionSave", {
          subject: q.subject,
          prompt: q.prompt,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation
        });

        saved++;
      }

      toast("Đã lưu " + saved + " câu hỏi.");
      dialog.close();
      paint();

    } catch (error) {
      status.textContent =
        "Đã lưu " + saved + " câu. " +
        (error.message || "Có lỗi khi lưu.") +
        " Không nhấn lưu lại toàn bộ để tránh trùng câu.";
      saveBtn.hidden = true;
      await ws().refresh();
      paint();
    } finally {
      busy = false;
      saveBtn.disabled = false;
      generateBtn.disabled = false;
    }
  };

  dialog.showModal();
}

  function questionForm(item){modal(item?'Chỉnh sửa câu hỏi':'Soạn câu hỏi',select('subject','Môn học',subjects.map(s=>`<option ${s===item?.subject?'selected':''}>${s}</option>`).join(''))+textarea('prompt','Nội dung câu hỏi',item?.prompt||'',2000)+`<div class="q-form-grid">${[0,1,2,3].map(i=>field('option'+i,'Lựa chọn '+String.fromCharCode(65+i),'text',item?.options[i]||'','required maxlength="500"')).join('')}</div>`+select('answer','Đáp án đúng',[0,1,2,3].map(i=>`<option value="${i}" ${i===item?.answer?'selected':''}>${String.fromCharCode(65+i)}</option>`).join(''))+textarea('explanation','Giải thích đáp án',item?.explanation||'',2000),form=>{const value=read(form);if(!value.prompt.trim())throw Error('Bạn cần nhập nội dung câu hỏi.');return mutate('questionSave',{...(item?{id:item.id}:{}),subject:value.subject,prompt:value.prompt,options:[0,1,2,3].map(i=>value['option'+i]),answer:Number(value.answer),explanation:value.explanation});});}
  function examForm(item){if(!items('questions').length){toast('Soạn ít nhất một câu hỏi trước khi tạo đề.');route('questions');return;}modal(item?'Chỉnh sửa đề':'Tạo đề kiểm tra',field('title','Tên đề','text',item?.title||'','required maxlength="160"')+field('minutes','Thời gian làm bài (phút)','number',item?.minutes||30,'required min="1" max="180"')+`<div class="q-field"><label>Chọn câu hỏi cho đề</label><div class="q-check-list">${items('questions').map(question=>`<label class="q-check-row"><input type="checkbox" name="questionIds" value="${e(question.id)}" ${item?.questionIds.includes(question.id)?'checked':''}><span><strong>${e(question.prompt)}</strong><small class="q-muted">${e(question.subject)}</small></span></label>`).join('')}</div></div>`,form=>{const value=read(form),questionIds=new FormData(form).getAll('questionIds');if(!questionIds.length)throw Error('Chọn ít nhất một câu hỏi.');return mutate('examSave',{...(item?{id:item.id}:{}),title:value.title,minutes:Number(value.minutes),questionIds});});}
  function examView(id){const item=byId('exams',id);if(!item)return;const popup=document.createElement('dialog');popup.className='q-dialog';popup.innerHTML=`<div class="q-dialog-head"><h2>${e(item.title)}</h2><button class="q-btn secondary" type="button" data-close>Đóng</button></div><div class="q-dialog-body"><p class="q-muted">${item.questionIds.length} câu hỏi · ${item.minutes} phút · Bản xem của giáo viên có đáp án</p>${item.questionIds.map((id,index)=>{const question=byId('questions',id);return question?`<section class="q-card" style="margin-top:16px"><h3>${index+1}. ${e(question.prompt)}</h3><ol type="A">${question.options.map((value,i)=>`<li>${e(value)}${i===question.answer?' ✓':''}</li>`).join('')}</ol><p class="q-muted">${e(question.explanation)}</p></section>`:'<p class="q-alert">Một câu hỏi đã bị xóa.</p>';}).join('')}</div>`;document.body.append(popup);popup.querySelector('[data-close]').onclick=()=>popup.close();popup.addEventListener('close',()=>popup.remove(),{once:true});popup.showModal();}
  
function assignmentForm(item) {
  if (!items('classes').length || !items('exams').length) {
    toast('Bạn cần có lớp học và đề kiểm tra trước.');
    route(!items('classes').length ? 'classes' : 'exams');
    return;
  }

  const due = item?.dueAt
    ? new Date(new Date(item.dueAt).getTime() + 7 * 3600000)
        .toISOString().slice(0, 16)
    : '';

  const guard = item?.examGuard || {};

  const markup =
    field('title', 'Tên bài giao', 'text',
      item?.title || '', 'required maxlength="160"') +

    select('classId', 'Lớp nhận bài',
      options(items('classes'), 'name', item?.classId)) +

    select('examId', 'Đề kiểm tra',
      options(items('exams'), 'title', item?.examId)) +

    field('dueAt', 'Hạn hoàn thành (giờ Việt Nam)',
      'datetime-local', due, 'required') +

    `
    <div class="q-field">
      <h3>🛡️ Qurio ExamGuard</h3>
      <p>Tùy chọn giám sát khi học sinh làm bài.</p>

      <label>
        <input type="checkbox" name="trackTab"
          ${guard.trackTab ? 'checked' : ''}>
        Giám sát chuyển tab
      </label>

      <label>
        <input type="checkbox" name="trackCamera"
          ${guard.trackCamera ? 'checked' : ''}>
        Giám sát trạng thái camera
      </label>

      <label>
        <input type="checkbox" name="requireCamera"
          ${guard.requireCamera ? 'checked' : ''}>
        Yêu cầu camera trước khi làm bài
      </label>

      <label for="t-cameraNote">Lời nhắc camera</label>
      <textarea class="q-input"
        id="t-cameraNote"
        name="cameraNote"
        maxlength="500"
        rows="3"></textarea>
    </div>
    `;

  modal(
    item ? 'Chỉnh sửa bài giao' : 'Giao bài cho lớp',
    markup,

    async form => {
      const value = read(form);

      const parsed = new Date(
        value.dueAt + ':00+07:00'
      );

      if (!Number.isFinite(parsed.getTime())) {
        throw Error('Ngày giờ chưa hợp lệ.');
      }

      const trackCamera =
        form.elements.trackCamera.checked;

      const examGuard = {
        trackTab: form.elements.trackTab.checked,
        trackCamera,
        requireCamera:
          trackCamera &&
          form.elements.requireCamera.checked,
        cameraNote: trackCamera
          ? form.elements.cameraNote.value.trim()
          : ''
      };

      await mutate('assignmentSave', {
        ...value,
        ...(item ? { id: item.id } : {}),
        dueAt: parsed.toISOString(),
        examGuard
      });
    },

    form => {
      form.elements.cameraNote.value =
        guard.cameraNote || '';
    }
  );
}

  function resultForm(item){if(!items('assignments').length){toast('Giao bài cho lớp trước khi nhập kết quả.');route('assignments');return;}modal(item?'Chỉnh sửa kết quả':'Ghi nhận kết quả',select('assignmentId','Bài giao',options(items('assignments'),'title',item?.assignmentId))+select('studentId','Học sinh','')+field('score','Điểm (thang 10)','number',item?.score??'','required min="0" max="10" step="0.1"')+textarea('feedback','Nhận xét của giáo viên',item?.feedback||'',2000),form=>{const value=read(form);if(!value.studentId)throw Error('Lớp chưa có học sinh. Hãy thêm học sinh vào danh sách lớp.');return mutate('resultSave',{...value,...(item?{id:item.id}:{}),score:Number(value.score)});},form=>{const update=()=>{const assignment=byId('assignments',form.elements.assignmentId.value);form.elements.studentId.innerHTML=options(items('students').filter(s=>s.classId===assignment?.classId),'name',item?.studentId);};form.elements.assignmentId.addEventListener('change',update);update();});}
  function planForm(item){modal(item?'Chỉnh sửa kế hoạch':'Tạo kế hoạch giảng dạy',field('title','Nội dung cần chuẩn bị','text',item?.title||'','required maxlength="160"')+field('date','Ngày thực hiện','date',item?.date||today(),'required')+select('classId','Lớp học (nếu có)',`<option value="">Kế hoạch cá nhân</option>${options(items('classes'),'name',item?.classId)}`)+textarea('description','Nội dung chi tiết',item?.description||'',2000),form=>mutate('planSave',{...read(form),...(item?{id:item.id}:{}),done:item?.done===true}));}
  function guide(){const dialog=document.createElement('dialog');dialog.className='q-dialog';dialog.innerHTML=`<div class="q-dialog-head"><h2>Kết nối Google Sheets</h2><button type="button" class="q-btn secondary" data-close>Đóng</button></div><div class="q-dialog-body"><p>Mã giao diện gọi cùng Web App với hệ thống đăng nhập Qurio. Không nhập lại mật khẩu Google và không đặt khóa bí mật trong trình duyệt.</p><ol style="line-height:2"><li>Trong Apps Script của dự án, thêm mã <strong>Workspace.gs</strong> được cung cấp cùng bộ mã.</li><li>Đăng ký hàm <code>workspace: workspace_</code> trong đối tượng xử lý <code>actions</code> của Code.gs.</li><li>Kiểm tra thuộc tính <code>SPREADSHEET_ID</code> trỏ đến bảng tính Qurio đang dùng.</li><li>Chạy hàm <code>setupWorkspace</code> một lần và cấp quyền Google Sheets.</li><li>Triển khai phiên bản Web App mới. Dùng URL kết thúc bằng <code>/exec</code> trong Chung/chung.js.</li><li>Tài khoản giáo viên phải có vai trò <code>teacher</code> do quản trị viên cấp trong bảng tài khoản. Giao diện không tự cấp quyền.</li></ol><p class="q-muted">Các bảng được tạo rỗng. Bài, lớp học và điểm chỉ xuất hiện sau khi bạn tự nhập hoặc học sinh gửi bài thật.</p></div>`;document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();}
  function exportCSV(){const safe=value=>{let text=String(value??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};const rows=[['Lớp','Học sinh','Bài giao','Điểm / 10','Nhận xét','Nguồn'],...items('results').map(item=>{const student=byId('students',item.studentId),assignment=byId('assignments',item.assignmentId);return [byId('classes',assignment?.classId)?.name||'',student?.name||'',assignment?.title||'',item.score,item.feedback,item.source==='submitted'?'Học sinh nộp':'Giáo viên nhập'];})];const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Qurio-ket-qua-hoc-tap.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

  async function action(event){const target=event.target.closest('[data-teacher]');if(!target)return;const{teacher:command,id}=target.dataset;if(saving)return;if(command==='tab'){route(id);return;}if(command==='guide'){guide();return;}
if (command === "ai-question-new") {
  aiQuestionForm();
  return;
}
if(command==='export'){exportCSV();return;}if(command==='class-open'){selectedClass=id;paint();return;}const forms={'class-new':()=>classForm(),'class-edit':()=>classForm(byId('classes',id)),'student-new':()=>studentForm(null,id),'student-edit':()=>studentForm(byId('students',id)),'question-new':()=>questionForm(),'question-edit':()=>questionForm(byId('questions',id)),'exam-new':()=>examForm(),'exam-edit':()=>examForm(byId('exams',id)),'exam-view':()=>examView(id),'assignment-new':()=>assignmentForm(),'assignment-edit':()=>assignmentForm(byId('assignments',id)),'result-new':()=>resultForm(),'result-edit':()=>resultForm(byId('results',id)),'plan-new':()=>planForm(),'plan-edit':()=>planForm(byId('plans',id))};if(forms[command]){forms[command]();return;}if(command.startsWith('delete-')||command==='plan-toggle'){if(command.startsWith('delete-')&&!confirm('Xóa mục này? Máy chủ sẽ kiểm tra các dữ liệu đang liên kết trước khi xóa.'))return;saving=true;target.disabled=true;try{if(command==='plan-toggle'){const item=byId('plans',id);await mutate('planSave',{id,title:item.title,date:item.date,classId:item.classId||'',description:item.description||'',done:!item.done});}else await mutate('delete',{entity:command.slice(7),id});toast('Đã cập nhật dữ liệu.');paint();}catch(error){toast(error.message||'Chưa cập nhật được dữ liệu.');}finally{saving=false;if(target.isConnected)target.disabled=false;}}}
  function paint(){if(!root||!root.isConnected)return;const user=db().user;if(!user?.id){root.innerHTML=empty('Đăng nhập để mở không gian giáo viên','Sử dụng tài khoản Qurio của bạn để quản lý lớp học.')+`<p style="text-align:center"><a class="q-btn primary" href="${e(window.QurioUI?.url?.('login')||'#')}">Đăng nhập</a></p>`;return;}if(user.role!=='teacher'){root.innerHTML=`<header class="q-page-head"><div><span class="q-eyebrow">KHÔNG GIAN GIÁO VIÊN</span><h1>Cùng tạo nên giờ học tốt hơn</h1><p>Đây là khu vực quản lý dành cho tài khoản giáo viên.</p></div></header>`+empty('Tài khoản của bạn là học sinh','Nếu bạn là giáo viên, liên hệ quản trị viên để kiểm tra vai trò tài khoản. Dữ liệu lớp học được kiểm tra quyền ở máy chủ.');return;}if(!tabs.some(item=>item[0]===tab))tab='overview';const views={overview,classes,questions,exams,assignments,results,plans,reports};root.innerHTML=heading()+views[tab]();}
  async function render(element){root=element;const ticket=++renderTicket;root.innerHTML='<div class="q-empty"><h3>Đang mở không gian giáo viên…</h3><p>Đang kiểm tra tài khoản và tải dữ liệu.</p></div>';root.removeEventListener('click',action);root.addEventListener('click',action);if(!root.dataset.teacherBound){root.dataset.teacherBound='true';root.addEventListener('input',event=>{if(!event.target.matches('[data-teacher-search]'))return;query=event.target.value;const position=event.target.selectionStart;paint();const input=root.querySelector('[data-teacher-search]');input?.focus();try{input?.setSelectionRange(position,position);}catch{}});}try{if(!ws())throw Error('Chưa tải được bộ kết nối dữ liệu. Kiểm tra workspace-client.js.');await ws().ready;if(ticket!==renderTicket)return;if(ws().error)throw Error(ws().error);tab=pickedTab();paint();}catch(error){if(ticket!==renderTicket)return;root.innerHTML=`<section class="q-card"><h1>Chưa mở được dữ liệu giáo viên</h1><p class="q-alert">${e(error.message||'Kết nối chưa sẵn sàng.')}</p><p class="q-muted">Kiểm tra đăng nhập, chạy setupWorkspace trong Apps Script và triển khai phiên bản Web App mới.</p><div class="q-toolbar-actions">${btn('Hướng dẫn kết nối','guide')}<a class="q-btn primary" href="${e(window.QurioUI?.url?.('login')||'#')}">Đăng nhập</a></div></section>`;}}
  window.addEventListener('hashchange',()=>{if(root?.isConnected){tab=pickedTab();query='';paint();}});
  window.QurioTeacher={render};
})();
