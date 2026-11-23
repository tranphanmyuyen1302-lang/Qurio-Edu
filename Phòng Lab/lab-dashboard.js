(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const savedKey='qurio_lab_saved_v1',recentKey='qurio_lab_recent_v1',goalsKey='qurio_lab_dashboard_goals_v1',filesKey='qurio_lab_uploaded_files_v1';
const names={math:['Toán học','∑','toan'],physics:['Vật lý','⚛','vat-ly'],chemistry:['Hóa học','⚗','hoa'],biology:['Sinh học','❀','sinh']};
const safe=(key)=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return []}};
let showAll=false,files=[];
function shell(){window.QurioLayout?.mountHome();const side=$('#sidebar'),toggle=$('#sidebarToggle'),backdrop=$('#sidebarBackdrop');$$('.sidebar .nav-item').forEach(a=>{const on=a.dataset.nav==='lab';a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});function setOpen(on){side?.classList.toggle('is-open',on);if(backdrop)backdrop.hidden=!on;toggle?.setAttribute('aria-expanded',String(on))}toggle?.addEventListener('click',()=>setOpen(!side?.classList.contains('is-open')));backdrop?.addEventListener('click',()=>setOpen(false));const profile=$('#profileToggle'),menu=$('#profileMenu');profile?.addEventListener('click',e=>{e.stopPropagation();if(menu)menu.hidden=!menu.hidden});document.addEventListener('click',e=>{if(menu&&!e.target.closest('.profile-wrap'))menu.hidden=true});$('#profileLoginLink')?.setAttribute('href',window.QurioRoute?.url('login')||'../../Đăng Nhập/dang-nhap.html')}

function goals() {
  const host = document.querySelector('.goal-items');
  const form = document.querySelector('#labGoalForm');
  const input = document.querySelector('#labGoalText');
  const add = document.querySelector('#labGoalAdd');
  const cancel = document.querySelector('#labGoalCancel');

  if (!host || !form || !input || !add || !cancel) return;

  let items = [];

  function draw() {
    host.replaceChildren();

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'lab-goal-row';

      const label = document.createElement('label');
      label.className = 'lab-goal-label';

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = !!item.done;
      check.setAttribute('aria-label', 'Hoàn thành: ' + item.text);

      
check.addEventListener('change', async () => {
  const oldDone = item.done;
  const newDone = check.checked;
  check.disabled = true;

  try {
    const result = await QurioLabCloud.goalSave({
      id: item.id,
      text: item.text,
      done: newDone
    });

    if (result?.ok === false) {
      throw new Error(result.message || 'Cập nhật thất bại.');
    }

    item.done = newDone;
    await loadGoals();

  } catch (error) {
    check.checked = oldDone;
    alert('Không thể cập nhật mục tiêu: ' + error.message);
  } finally {
    check.disabled = false;
  }
});


      const span = document.createElement('span');
      span.textContent = item.text;

      label.append(check, span);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'lab-goal-delete';
      remove.textContent = '×';
      remove.title = 'Xóa mục tiêu';

      remove.addEventListener('click', async () => {
        if (!confirm('Xóa mục tiêu này?')) return;

        remove.disabled = true;

        try {
          if (typeof QurioLabCloud.goalDelete !== 'function') {
            throw new Error('API xóa mục tiêu chưa được kết nối.');
          }

          
const result = await QurioLabCloud.goalDelete(item.id);


          if (result?.ok === false) {
            throw new Error(result.message || 'Xóa thất bại.');
          }

          await loadGoals();
        } catch (error) {
          alert(error.message);
          remove.disabled = false;
        }
      });

      row.append(label, remove);
      host.append(row);
    });
  }

  async function loadGoals() {
    if (!window.QurioLabCloud?.list) {
      console.warn('QurioLabCloud chưa được tải.');
      return;
    }

    const data = await QurioLabCloud.list();

    if (data?.ok === false) {
      throw new Error(data.message || 'Không thể tải mục tiêu.');
    }

    items = Array.isArray(data.goals) ? data.goals : [];
    draw();
  }

  add.addEventListener('click', () => {
    form.hidden = false;
    add.hidden = true;
    input.focus();
  });

  cancel.addEventListener('click', () => {
    form.reset();
    form.hidden = true;
    add.hidden = false;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const value = input.value.trim();
    if (!value) return;

    if (!window.QurioLabCloud?.goalSave) {
      alert('Chưa kết nối cơ sở dữ liệu Qurio Lab.');
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;

    try {
      const result = await QurioLabCloud.goalSave({
        text: value,
        done: false
      });

      if (result?.ok === false) {
        throw new Error(result.message || 'Không thể lưu mục tiêu.');
      }

      await loadGoals();

      form.reset();
      form.hidden = true;
      add.hidden = false;

      console.log('Đã lưu mục tiêu vào CSDL.');
    } catch (error) {
      console.error(error);
      alert('Lỗi lưu mục tiêu: ' + error.message);
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  loadGoals().catch(error => {
    console.error('Không thể tải mục tiêu:', error);
  });
}

// Data is intentionally empty until the official Google Apps Script/Sheets connection is configured.
// Integration contract: window.QurioLabData.setHistory(rows), setFiles(rows).
// Expected history row: {title,subject,grade,date,status,url}; subject: math/physics/chemistry/biology.
// Expected file row: {id,name,date,url,mimeType}. URLs must be produced by the authorized backend.
function renderHistory(rows){
  const host=$('#labHistoryRows'),wrap=$('.lab-history-table-wrap');
  host.replaceChildren();
  const valid=Array.isArray(rows)?rows.filter(x=>x&&typeof x==='object'):[];
  wrap.hidden=false; // Keep the table headers visible even when the backend has no history yet.
  for(const item of valid){
    const row=document.createElement('tr');
    const cell=value=>{const td=document.createElement('td');td.textContent=String(value??'');row.append(td);return td};
    const title=cell(item.title||'');title.className='history-name';
    cell(names[item.subject]?.[0]||item.subject||'');
    cell(item.grade?`Lớp ${item.grade}`:'');
    const stamp=item.date?new Date(item.date):null;
    cell(stamp&&!Number.isNaN(stamp.valueOf())?stamp.toLocaleString('vi-VN'):'');
    const state=cell(item.status||'');state.className='history-state';
    const actions=cell('');
    if(typeof item.url==='string'&&/^https?:\/\//i.test(item.url)){
      const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Mở ↗';actions.append(link);
    }
    host.append(row);
  }
}

function renderFiles(rows) {
  const host = document.querySelector('#labFiles');
  if (!host) return;

  host.replaceChildren();

  for (const item of Array.isArray(rows) ? rows : []) {
    const row = document.createElement('div');
    row.className = 'lab-file-row';

    const icon = document.createElement('span');
    icon.className = 'lab-file-type';
    icon.textContent = '📝';

    const info = document.createElement('div');
    info.className = 'lab-file-info';

    const name = document.createElement('strong');
    name.textContent = item.name || 'Ghi chú thí nghiệm';

    const date = document.createElement('small');
    if (item.date) {
      const d = new Date(item.date);
      if (!isNaN(d.getTime())) {
        date.textContent = d.toLocaleDateString('vi-VN');
      }
    }

    info.append(name, date);
    row.append(icon, info);

    if (item.note) {
      const view = document.createElement('button');
      view.type = 'button';
      view.textContent = 'Xem';
      view.onclick = () =>
        alert((item.name || 'Ghi chú') + '\n\n' + item.note);
      row.append(view);
    }

    host.append(row);
  }
}


window.QurioLabHistory = {
  async add(title, subject, grade, status = 'Đã thực hiện') {
    if (!window.QurioLabCloud?.historyAdd) {
      throw new Error('Chưa kết nối CSDL Phòng Lab.');
    }

    const result = await QurioLabCloud.historyAdd({
      title,
      subject,
      grade,
      status,
      date: new Date().toISOString()
    });

    if (result?.ok === false) {
      throw new Error(result.message || 'Không thể lưu lịch sử.');
    }

    const data = await QurioLabCloud.list();
    renderHistory(data.history || []);

    return result;
  }
};

async function init() {
  shell();
  goals();

  renderHistory([]);
  renderFiles([]);

  if (!window.QurioLabCloud?.list) {
    console.error('Chưa tải lab-cloud.js');
    return;
  }

  try {
    const data = await QurioLabCloud.list();

    if (data?.ok === false) {
      throw new Error(data.message || 'Không tải được dữ liệu.');
    }

    renderHistory(data.history || []);
    renderFiles(data.files || []);

    console.log('Đã tải dữ liệu Phòng Lab:', {
      goals: data.goals?.length || 0,
      files: data.files?.length || 0,
      history: data.history?.length || 0
    });

  } catch (error) {
    console.error('Lỗi tải dữ liệu Phòng Lab:', error);
  }
}

window.QurioLabData=Object.freeze({setHistory:renderHistory,setFiles:renderFiles});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
