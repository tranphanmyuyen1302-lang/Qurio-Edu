/* Qurio Assignment Fast v1. Changes:
 * - Local approved exams appear immediately.
 * - Authenticated per-tab dashboard cache (no API keys, no tokens stored in cache).
 * - Two API fetches happen concurrently, no sequential fallback delay.
 * - Local exam is uploaded to the server BEFORE assignment creation.
 * - Successful dispatch updates the table immediately without blocking on reload.
 * WARNING: Only an acknowledged assignmentCreate response counts as published.
 */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const DRAFT_KEY = 'qurio_assignment_draft_v1';
  const EXAM_KEY = 'qurio_exam_page_v2';
  const CACHE_PREFIX = 'qurio_assignment_fast_cache_';
  const CACHE_MAX_AGE = 2 * 60 * 1000;
  const esc = value => String(value ?? '').replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt = value => String(value ?? '');
  const hasApi = () => typeof window.QurioAuth?.request === 'function';
  const call = (name, data) => {
    if (!hasApi()) return Promise.reject(new Error('Chưa kết nối Qurio. Hãy đăng nhập lại.'));
    return window.QurioAuth.request(name, data);
  };
  let dashboard = {classes:[], exams:[], assignments:[]};
  let busy = false;
  let refreshNumber = 0;
  let lastLoadPending = null;
  let refreshing = false;
  let localExams = [];

  function notice(message) {
    const el = $('notice');
    if (!el) return;
    el.textContent = message || '';
    el.hidden = !message;
    el.style.display = message ? '' : 'none';
  }
  function toast(message) {
    const node = $('toast');
    if (!node) return;
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { node.hidden = true; }, 4000);
  }
  function dateLabel(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d.toLocaleString('vi-VN',{
      day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'
    }) : txt(value);
  }
  function getSessionKey() {
    let raw;
    try {
      raw = sessionStorage.getItem('qurio_session') || localStorage.getItem('qurio_session');
      const s = JSON.parse(raw || 'null');
      if (!s || !s.token || Number(s.expiresAt) <= Date.now()) return '';
      // This is only a cache namespace, NOT a security/authentication token.
      let h = 2166136261;
      for (let i=0; i<s.token.length; i++) {
        h ^= s.token.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return CACHE_PREFIX + (h>>>0).toString(16);
    } catch (_) { return ''; }
  }
  function readCache() {
    const key = getSessionKey();
    if (!key) return null;
    try {
      const c = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (!c || !c.time || Date.now()-c.time > CACHE_MAX_AGE) return null;
      return c.data;
    } catch (_) { return null; }
  }
  function saveCache() {
    const key = getSessionKey();
    if (!key) return;
    try { sessionStorage.setItem(key, JSON.stringify({time:Date.now(), data:dashboard})); }
    catch (_) { /* Browsers with limited storage still work. */ }
  }
  function readLocalExams() {
    try {
      const list = JSON.parse(localStorage.getItem(EXAM_KEY) || '[]');
      localExams = Array.isArray(list) ? list.filter(e =>
        e && e.id && (e.status === 'approved' || e.status === 'assigned')) : [];
    } catch (_) { localExams = []; }
    return localExams;
  }
  function mergedExams(serverExams) {
    const map = new Map();
    for (const e of (Array.isArray(serverExams) ? serverExams : [])) {
      if (e && e.id && (!e.status || e.status === 'approved' || e.status === 'assigned'))
        map.set(txt(e.id), {...e, isCloud:true});
    }
    for (const e of readLocalExams()) {
      const key = txt(e.id);
      // Always use local details for matching IDs, but keep a cloud marker.
      map.set(key, {...(map.get(key)||{}), ...e, isLocal:true,
        isCloud:!!map.get(key)?.isCloud});
    }
    return [...map.values()];
  }
  function renderStats() {
    $('statClasses').textContent = dashboard.classes.length;
    $('statExams').textContent = dashboard.exams.length;
    $('statAssigned').textContent = dashboard.assignments.length;
    const now = Date.now();
    $('statUpcoming').textContent = dashboard.assignments.filter(a=>
      a.dueAt && new Date(a.dueAt).getTime() > now).length;
  }
  function populateOptions(select, list, placeholder, labeler) {
    const previous = select.value;
    select.innerHTML = `<option value="">${esc(placeholder)}</option>` + list.map(item =>
      `<option value="${esc(item.id)}">${esc(labeler(item))}</option>`).join('');
    select.value = list.some(item=>txt(item.id)===previous) ? previous : '';
  }
  const norm = x => txt(x).trim().toLocaleLowerCase('vi-VN');
  
function filteredExams() {
  return dashboard.exams;
}

  function renderExamPicker(value = $('examSelect').value) {
    const usable = filteredExams();
    populateOptions($('examSelect'), usable, 'Chọn đề kiểm tra', e =>
      e.title + (e.subject ? ' · '+e.subject : '') +
      (e.isLocal && !e.isCloud ? ' · đề trên máy này' : ''));
    $('examSelect').value = usable.some(e=>txt(e.id)===value) ? value : '';
  }
  function render() {
    renderStats();
    populateOptions($('classSelect'),dashboard.classes,'Chọn lớp học',c=>
      (c.name||'Lớp học') + (c.subject ? ' · '+c.subject : ''));
    const prevExam = $('examSelect').value;
    renderExamPicker(prevExam);
    const filter = $('assignmentFilter');
    const v = filter.value;
    populateOptions(filter, dashboard.classes, 'Tất cả lớp', c=>c.name||'Lớp học');
    // The first option is the aggregate view, not empty.
    filter.options[0].value='all';
    filter.value = v==='all' || !v ? 'all' :
      (dashboard.classes.some(c=>txt(c.id)===v) ? v : 'all');
    renderRows();
  }
  function renderRows() {
    const q = $('assignmentSearch').value.toLocaleLowerCase('vi-VN').trim();
    const f = $('assignmentFilter').value;
    const exams = new Map(dashboard.exams.map(e=>[txt(e.id),e]));
    const classes = new Map(dashboard.classes.map(c=>[txt(c.id),c]));
    const rows = dashboard.assignments.filter(a => {
      const label = txt(exams.get(txt(a.examId))?.title)+' '+txt(classes.get(txt(a.classId))?.name);
      return (!f || f==='all' || txt(a.classId)===f) && label.toLocaleLowerCase('vi-VN').includes(q);
    }).slice().reverse();
    $('assignmentRows').innerHTML = rows.length ? rows.map(a => {
      const e = exams.get(txt(a.examId));
      const c = classes.get(txt(a.classId));
      const future = a.dueAt && new Date(a.dueAt).getTime() >= Date.now();
      return `<tr><td><strong>${esc(e?.title||'Đề kiểm tra')}</strong></td>` +
       `<td>${esc(c?.name||'—')}</td><td>${esc(dateLabel(a.createdAt))}</td>` +
       `<td>${esc(dateLabel(a.dueAt))}</td><td><span class="as-chip ${future?'':'draft'}">`+
       `${future?'Còn hạn':'Đã hết hạn'}</span></td><td><button class="as-link" type="button"`+
       ` data-assignment="${esc(a.id)}">Chi tiết</button></td></tr>`;
    }).join('') : '<tr><td colspan="6" class="as-empty"><span class="symbol">📭</span></td></tr>';
  }
  async function loadDashboard(options={}) {
    if (!hasApi()) {
      notice('Chưa đăng nhập tài khoản Qurio.');
      $('publishBtn').disabled = true;
      return;
    }
    if (refreshing) return lastLoadPending;
    refreshing = true;
    const run = ++refreshNumber;
    const old = dashboard;
    const remotePromise = Promise.allSettled([
      call('assignmentDashboard'),
      call('classManager', {operation:'getDashboard'})
    ]);
    lastLoadPending = remotePromise.then(result => {
      if (run !== refreshNumber) return;
      const [assignmentResult, classResult] = result;
      const ad = assignmentResult.status==='fulfilled' ? assignmentResult.value : {};
      const cd = classResult.status==='fulfilled' ? classResult.value : {};
      const cls = Array.isArray(cd.classes) && cd.classes.length ? cd.classes :
        (Array.isArray(ad.classes) && ad.classes.length ? ad.classes : old.classes);
      const ex = Array.isArray(ad.exams) ? ad.exams : old.exams;
      const as = Array.isArray(ad.assignments) ? ad.assignments : old.assignments;
      dashboard = {classes:cls, exams:mergedExams(ex), assignments:as};
      render();
      if (assignmentResult.status==='rejected') {
        notice('Chưa đồng bộ được bài giao từ máy chủ: '+
          (assignmentResult.reason?.message||'Lỗi kết nối')+'. Đề đã duyệt trên máy vẫn hiện.');
      } else if (classResult.status==='rejected' && !dashboard.classes.length) {
        notice('Chưa tải được lớp học: '+(classResult.reason?.message||'Lỗi kết nối'));
      } else if (!dashboard.classes.length) {
        notice('Chưa có lớp học. Hãy tạo lớp trong Quản lý lớp học.');
      } else if (!dashboard.exams.length) {
        notice('Chưa có đề được duyệt. Hãy vào Tạo đề kiểm tra và chọn Duyệt đề.');
      } else {
        notice('');
      }
      saveCache();
    }).catch(err => {
      console.warn('Qurio assignment refresh',err);
      if (!options.quiet) notice('Không thể đồng bộ dữ liệu: '+err.message);
    }).finally(()=>{refreshing=false;lastLoadPending=null;});
    return lastLoadPending;
  }
  function applyDraft() {
    try {
      const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');
      if(!d)return;
      $('classSelect').value=d.classId||'';
      renderExamPicker(d.examId||'');
      $('dueAt').value=d.dueAt||'';
      $('assignmentType').value=d.type||'exam';
      $('instructions').value=d.instructions||'';
      $('monitorTab').checked=!!d.monitorTab;
      $('monitorCamera').checked=!!d.monitorCamera;
      $('requireCamera').checked=!!d.requireCamera;
      $('cameraNotice').value=d.cameraNotice||'';
      $('cameraOptions').hidden=!d.monitorCamera;
    } catch (_) { /* invalid draft is ignored */ }
  }
  function applyExamQuery() {
    const id=new URLSearchParams(location.search).get('examId');
    if (id && dashboard.exams.some(e=>txt(e.id)===id)) {
      renderExamPicker(id);
    }
  }
  function instantLoad() {
    const fromCache = readCache();
    if (fromCache) {
      dashboard = {...fromCache, exams:mergedExams(fromCache.exams)};
    } else {
      dashboard.exams = mergedExams([]);
    }
    render();
    applyDraft();
    applyExamQuery();
    loadDashboard().then(()=>{applyDraft();applyExamQuery();});
  }
  function markLocalAssigned(id) {
    try {
      const all=JSON.parse(localStorage.getItem(EXAM_KEY)||'[]');
      if (!Array.isArray(all)) return;
      const exam=all.find(x=>txt(x.id)===txt(id));
      if(exam){exam.status='assigned';localStorage.setItem(EXAM_KEY,JSON.stringify(all));}
    } catch (_) { /* do not break successful published assignment */ }
  }
  function dispatchRequestId(payload) {
    const key = 'qurio_pending_assignment_v1';
    const fingerprint = JSON.stringify(payload);
    let previous = null;
    try { previous=JSON.parse(sessionStorage.getItem(key)||'null'); } catch (_) {}
    if(previous && previous.fingerprint===fingerprint && previous.requestId)
      return previous.requestId;
    const requestId = typeof crypto!=='undefined' && crypto.randomUUID
      ? crypto.randomUUID() : 'qurio-'+Date.now()+'-'+Math.random().toString(16).slice(2);
    try {sessionStorage.setItem(key,JSON.stringify({requestId,fingerprint}));}catch(_){}
    return requestId;
  }
  function submitGuard() {
    const isCamera = $('monitorCamera').checked;
    return {
      trackTab:$('monitorTab').checked,
      trackCamera:isCamera,
      requireCamera:isCamera&&$('requireCamera').checked,
      cameraNote:isCamera ? $('cameraNotice').value.trim() : ''
    };
  }
  $('assignmentForm').addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy)return;
    const classId=$('classSelect').value;
    const examId=$('examSelect').value;
    const dueAt=$('dueAt').value;
    const deadline=new Date(dueAt);
    if(!classId||!examId||!dueAt) return toast('Vui lòng chọn lớp, đề và hạn nộp.');
    if(!Number.isFinite(deadline.getTime())||deadline.getTime()<=Date.now())
      return toast('Hạn nộp phải sau thời điểm hiện tại.');
    const exam = dashboard.exams.find(e=>txt(e.id)===examId);
    if(!exam) return toast('Không tìm thấy đề. Hãy đồng bộ lại.');
    const cls = dashboard.classes.find(c=>txt(c.id)===classId);
    if(!cls) return toast('Không tìm thấy lớp. Hãy đồng bộ lại.');
    if(cls.subject && exam.subject && norm(cls.subject)!==norm(exam.subject))
      return toast('Môn học của đề và lớp không trùng nhau.');
    if(exam.status!=='approved' && exam.status!=='assigned')
      return toast('Đề cần được duyệt trước khi giao.');

    busy=true;
    const btn=$('publishBtn');
    btn.disabled=true;
    const label=btn.textContent;
    let published=false;
    try {
      // Teacher localStorage is not visible to students; syncing the full exam
      // to the server is mandatory before attaching it to a class assignment.
      if(exam.isLocal) {
        btn.textContent='Đang đồng bộ đề...';
        const upload = await call('assignmentExamUpsert',{exam});
        if(upload?.ok===false || !upload?.examId)
          throw new Error('Máy chủ chưa xác nhận lưu đề.');
        exam.isCloud=true;
      }
      btn.textContent='Đang giao bài...';
      const payload={classId,examId,dueAt:deadline.toISOString(),
        type:$('assignmentType').value,
        instructions:$('instructions').value.trim(), guard:submitGuard()};
      payload.requestId=dispatchRequestId(payload);
      const result=await call('assignmentCreate',payload);
      if(result?.ok===false) throw new Error(result.message||'Không thể giao bài.');
      if(!result?.assignmentId) throw new Error('Máy chủ chưa xác nhận bài đã giao. Đừng bấm giao lại ngay.');
      published=true;
      dashboard.assignments.push({...payload,...(result.assignment||{}),
        id:result.assignmentId,createdAt:result.assignment?.createdAt||new Date().toISOString()});
      saveCache();
      renderStats();
      renderRows();
      markLocalAssigned(examId);
      localStorage.removeItem(DRAFT_KEY);
      try {sessionStorage.removeItem('qurio_pending_assignment_v1');} catch (_) {}
      $('assignmentForm').reset();
      $('cameraOptions').hidden=true;
      toast('✓ Đã giao bài thành công và lưu lên máy chủ.');
      notice('');
      // Refresh is background-only; do not hold the UI hostage.
      void loadDashboard({quiet:true});
    }catch(error){
      console.error('Qurio assignment:',error);
      toast(published?'Đã giao bài; chưa tải lại được danh sách.':
        (error?.message||'Không thể giao bài.'));
    }finally{
      busy=false;btn.disabled=false;btn.textContent=label;
    }
  });
  $('saveDraftBtn').addEventListener('click',()=>{
    try{
      localStorage.setItem(DRAFT_KEY,JSON.stringify({
        classId:$('classSelect').value, examId:$('examSelect').value,
        dueAt:$('dueAt').value, type:$('assignmentType').value,
        instructions:$('instructions').value,
        monitorTab:$('monitorTab').checked,
        monitorCamera:$('monitorCamera').checked,
        requireCamera:$('requireCamera').checked,
        cameraNotice:$('cameraNotice').value.trim()
      }));toast('Đã lưu bản nháp trên trình duyệt này.');
    }catch(_){toast('Không lưu được bản nháp.');}
  });
  $('clearBtn').addEventListener('click',()=>{
    $('assignmentForm').reset();
    $('cameraOptions').hidden=true;
    localStorage.removeItem(DRAFT_KEY);
    toast('Đã làm mới biểu mẫu.');
  });
  $('monitorCamera')?.addEventListener('change',()=>{
    $('cameraOptions').hidden=!$('monitorCamera').checked;
  });
  $('classSelect').addEventListener('change',()=>renderExamPicker());
  $('assignmentSearch').addEventListener('input',renderRows);
  $('assignmentFilter').addEventListener('change',renderRows);
  $('topSearch')?.addEventListener('input',e=>{
    $('assignmentSearch').value=e.target.value;renderRows();
  });
  $('refreshAssignments')?.addEventListener('click',async e=>{
    if(refreshing)return;
    const btn=e.currentTarget;
    const text=btn.textContent;
    btn.disabled=true;btn.textContent='Đang đồng bộ...';
    try{await loadDashboard();toast('Đã cập nhật danh sách.');}
    finally{btn.disabled=false;btn.textContent=text;}
  });
  $('assignmentRows').addEventListener('click',e=>{
    const btn=e.target.closest('[data-assignment]');
    if(!btn)return;
    const a=dashboard.assignments.find(v=>txt(v.id)===btn.dataset.assignment);
    if(!a)return;
    const ex=dashboard.exams.find(v=>txt(v.id)===txt(a.examId));
    const cl=dashboard.classes.find(v=>txt(v.id)===txt(a.classId));
    // Details are represented in a keyboard-accessible dialog, rather than a fleeting toast.
    let dialog=$('qurioAssignmentDetails');
    if(!dialog){
      dialog=document.createElement('dialog');dialog.id='qurioAssignmentDetails';
      dialog.style.cssText='border:1px solid #e6ddf6;border-radius:16px;padding:25px;max-width:520px;width:min(92vw,520px);box-shadow:0 15px 50px #0003';
      document.body.appendChild(dialog);
    }
    dialog.innerHTML=`<h3 style="margin:0 0 15px;color:#423367">Thông tin bài giao</h3>`+
      `<p><b>Đề:</b> ${esc(ex?.title||'Đề kiểm tra')}</p>`+
      `<p><b>Lớp:</b> ${esc(cl?.name||'—')}</p>`+
      `<p><b>Ngày giao:</b> ${esc(dateLabel(a.createdAt))}</p>`+
      `<p><b>Hạn nộp:</b> ${esc(dateLabel(a.dueAt))}</p>`+
      `<p><b>Hướng dẫn:</b> ${esc(a.instructions||'Không có')}</p>`+
      `<form method="dialog"><button class="as-btn secondary" style="margin-top:12px">Đóng</button></form>`;
    if(typeof dialog.showModal==='function')dialog.showModal();
  });

  const sidebar=$('sidebar'),toggle=$('sidebarToggle'),backdrop=$('sidebarBackdrop');
  function setSidebar(open){
    if(!sidebar||!toggle||!backdrop)return;
    sidebar.classList.toggle('is-open',open);
    backdrop.hidden=!open;
    toggle.setAttribute('aria-expanded',txt(open));
    document.body.classList.toggle('teacher-menu-open',open);
  }
  toggle?.addEventListener('click',()=>setSidebar(!sidebar.classList.contains('is-open')));
  backdrop?.addEventListener('click',()=>setSidebar(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setSidebar(false);});
  document.querySelectorAll('.sidebar [data-page]').forEach(node=>{
    node.addEventListener('click',e=>{
      if(node.dataset.page==='teacher'){
        e.preventDefault();location.href='giao-vien.html';
      }
    });
  });
  $('logoutButton')?.addEventListener('click',async()=>{
    try { await window.QurioAuth?.logout?.(); } catch (_) {}
    location.href='../../Đăng Nhập/dang-nhap.html';
  });
  window.addEventListener('storage',e=>{
    if(e.key===EXAM_KEY){
      dashboard.exams=mergedExams(dashboard.exams.filter(x=>x.isCloud));
      render();
    }
  });
  instantLoad();
})();
