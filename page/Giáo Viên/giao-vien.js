const KEY='qurio_teacher_demo_v1';const initial={classes:[],questions:[{id:1,topic:'Dao động điều hòa',text:'Đơn vị của tần số là gì?',options:['Hz','m','s','N'],correct:0,explanation:'Tần số có đơn vị là hertz (Hz).',level:'Nhận biết'},{id:2,topic:'Dao động điều hòa',text:'Chu kì và tần số liên hệ như thế nào?',options:['T=f','T=1/f','T=f²','T=2f'],correct:1,explanation:'Chu kì bằng nghịch đảo tần số.',level:'Thông hiểu'}],exams:[],activities:[],assignments:[],plans:[],attempts:[]};let db;try{db=JSON.parse(localStorage.getItem(KEY))||structuredClone(initial)}catch{db=structuredClone(initial)};function save(){localStorage.setItem(KEY,JSON.stringify(db))}const $=id=>document.getElementById(id);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function toast(s){$('toast').textContent=s;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),3000)}function modal(html){$('modalContent').innerHTML=html;$('modal').classList.remove('hidden')}function closeModal(){$('modal').classList.add('hidden')}function log(title){db.activities.unshift({title,time:new Date().toLocaleString('vi-VN')});db.activities=db.activities.slice(0,20);save()}$('closeModal').onclick=closeModal;$('modal').onclick=e=>{if(e.target.id==='modal')closeModal()};document.getElementById('sideHelp')?.addEventListener('click',()=>modal('<h2>Hướng dẫn sử dụng</h2><p>Chọn một thẻ chức năng để quản lý lớp, câu hỏi, đề kiểm tra và bài giao. Dữ liệu bản demo lưu trong trình duyệt của bạn.</p><p>Để nhiều giáo viên/học sinh dùng chung cần kết nối Google Apps Script và Google Sheets.</p>'));
const svgIcon=(name)=>`<svg class="q-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]||ICON_PATHS.exams}</svg>`;const ICON_PATHS={"exams": "<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M9 8h6M9 12h6M9 16h3\"/>", "classes": "<circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1\"/>", "assignments": "<path d=\"m21 3-7.5 18-3.7-7.8L2 9.5 21 3ZM9.8 13.2 21 3\"/>", "bank": "<path d=\"m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5\"/>", "results": "<path d=\"M4 20V11M10 20V5M16 20v-9M22 20V8\"/>", "errors": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/><path d=\"m12 12 8-8\"/>", "paths": "<circle cx=\"5\" cy=\"5\" r=\"2\"/><circle cx=\"19\" cy=\"19\" r=\"2\"/><path d=\"M7 5h8a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h8\"/>", "plans": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 3v4m10-4v4M3 10h18m-13 4h3m3 0h3m-9 4h3\"/>", "reports": "<path d=\"M7 3h8l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z\"/><path d=\"M15 3v6h5M9 17v-3m4 3v-5m4 5v-2\"/>"};const features=[['exams','▤','Tạo đề kiểm tra','Tạo đề bằng AI từ PDF, chủ đề hoặc soạn đề thủ công.','purple'],['classes','♟','Quản lý lớp học','Tạo lớp, thêm học sinh và quản lý danh sách lớp.','blue'],['assignments','➤','Giao bài','Giao bài kiểm tra, bài luyện tập cho từng lớp.','purple'],['results','▥','Kết quả học sinh','Xem điểm, bài làm và mức độ hoàn thành của học sinh.','yellow'],['errors','◎','Phân tích lỗi sai','Phân tích các dạng lỗi, chủ đề còn yếu và gợi ý khắc phục.','pink'],['paths','♧','Lộ trình học tập','Gợi ý lộ trình ôn tập cá nhân hóa cho học sinh.','purple'],['plans','▦','Kế hoạch giảng dạy','Lập kế hoạch dạy học theo tuần, tháng, học kỳ.','green'],['reports','▤','Báo cáo thông minh','Tổng hợp, đánh giá và xuất báo cáo kết quả học tập.','yellow']];function heading(title,subtitle,buttons=''){return `<div class="pagehead"><div><h1>${title}</h1><p class="muted">${subtitle}</p></div><div class="actions">${buttons}</div></div>`}// Dữ liệu trang tổng quan chỉ lấy từ Apps Script; không lấy dữ liệu demo/localStorage.
let teacherDashboard = {classes:[],students:[],exams:[],activities:[],assignments:[]};
let dashboardStatus = 'loading'; // loading | ready | unavailable | error
function normalizedDashboard(raw){
  const obj=raw && typeof raw==='object'?raw:{};
  return {
    classes:Array.isArray(obj.classes)?obj.classes:[],
    students:Array.isArray(obj.students)?obj.students:[],
    exams:Array.isArray(obj.exams)?obj.exams:[],
    activities:Array.isArray(obj.activities)?obj.activities:[],
    assignments:Array.isArray(obj.assignments)?obj.assignments:[]
  };
}
function loadTeacherDashboard(){
  if(!(window.google&&google.script&&google.script.run)){
    dashboardStatus='unavailable';
    if(!location.hash||location.hash==='#home')render('home');
    return;
  }
  dashboardStatus='loading';
  google.script.run
    .withSuccessHandler(result=>{
      teacherDashboard=normalizedDashboard(result);
      dashboardStatus='ready';
      if(!location.hash||location.hash==='#home')render('home');
    })
    .withFailureHandler(error=>{
      dashboardStatus='error';
      console.error('Qurio dashboard:',error);
      if(!location.hash||location.hash==='#home')render('home');
    }).getDashboard();
}
function home(){
  const cards=features.map(([id,icon,title,desc,color])=>`<button class="feature" onclick="route('${id}')"><span class="fi ${color}">${svgIcon(id)}</span><span><strong>${title}</strong><small>${desc}</small></span><span class="arrow">→</span></button>`).join('');
  const profile=getTeacherProfile();
  const d=teacherDashboard;
  const ready=dashboardStatus==='ready';
  
const message = dashboardStatus === 'loading'
    ? 'Đang tải dữ liệu từ Google Sheets...'
    : dashboardStatus === 'unavailable'
    ? ''
    : dashboardStatus === 'error'
    ? 'Không tải được dữ liệu.'
    : '';

  const counts=[
    [svgIcon('classes'),ready?d.classes.length:'—','Lớp học','blue'],
    [svgIcon('exams'),ready?d.exams.length:'—','Đề đã tạo','purple'],
    [svgIcon('classes'),ready?d.students.length:'—','Học sinh','green']
  ];
  const activities=ready&&d.activities.length?d.activities.slice(0,5).map(a=>`<div class="activity"><span class="fi purple">◷</span><div><b>${esc(a.action||a.title||'Hoạt động')}</b><small>${esc(a.createdAt||a.time||'')}</small></div></div>`).join(''):
    `<div class="qurio-empty"><span class="qurio-empty-icon">◷</span><b>${ready?'':''}</b><p>${esc(message)}</p></div>`;
  const classes=ready&&d.classes.length?d.classes.slice(0,6).map(c=>{
    const number=d.students.filter(st=>String(st.classId)===String(c.id)).length;
    return `<div class="classrow"><span class="classpill">${esc(c.name||'Lớp học')}</span><span>${number} học sinh</span></div>`;
  }).join(''):`<div class="qurio-empty"><span class="qurio-empty-icon">♧</span><b>${ready?'':''}</b><p>${esc(message)}</p></div>`;
  return `<section class="teacher-welcome"><div class="welcome-copy"><span class="welcome-tag">✦ KHÔNG GIAN GIÁO VIÊN</span><p class="welcome-date">${new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())}</p><h1>Xin chào, <em>${esc(profile.name)}</em>! <span class="welcome-wave">✦</span></h1><p>Chúc thầy/cô một ngày giảng dạy thật nhiều cảm hứng. Hãy cùng Qurio đồng hành với học sinh trên hành trình khám phá tri thức nhé!</p><div class="welcome-foot"><span>✧ Cùng nhau tạo nên những giờ học ý nghĩa</span></div></div><div class="welcome-art" aria-hidden="true"><div class="art-halo"></div><div class="art-screen"><span class="art-logo">Q</span><span class="art-line"></span><span class="art-line short"></span></div><div class="art-books"><i></i><i></i><i></i></div><span class="art-spark one">✦</span><span class="art-spark two">✧</span></div></section>
  <div class="dashboard-section-head"><div><h2>Thống kê nhanh</h2><p>Tổng quan hoạt động giảng dạy của bạn</p></div><span class="dashboard-caption">${esc(message)}</span></div>
  <div class="stats teacher-stats">${counts.map(x=>`<div class="stat"><div class="fi ${x[3]}">${x[0]}</div><div class="stat-copy"><strong>${x[1]}</strong><small>${x[2]}</small></div></div>`).join('')}</div>
  <div class="dashboard-section-head"><div><h2>Các công cụ dành cho giáo viên</h2><p>Chọn chức năng để bắt đầu quản lý lớp học và giảng dạy</p></div></div><div class="features">${cards}</div>
  <div class="lower"><section class="panel"><div class="panel-head"><h2>◷ Hoạt động gần đây</h2></div><div id="recentActivities">${activities}</div></section>
  <section class="panel"><div class="panel-head"><h2>♟ Lớp học của bạn</h2></div><div id="teacherClasses">${classes}</div></section></div>`;
}
function route(page='home'){
  if(page==='home'||page==='teacher'){
    history.replaceState(null,'',location.pathname);
    render('home');window.scrollTo(0,0);return;
  }
  const destinations={
    exams:'tao-de-kiem-tra.html',classes:'quan-ly-lop-hoc.html',
    assignments:'giao-bai.html',
    results:'ket-qua-hoc-sinh.html',errors:'phan-tich-loi-sai.html',
    paths:'lo-trinh-hoc-tap.html',plans:'ke-hoach-giang-day.html',
    reports:'bao-cao-thong-minh.html',activity:'hoat-dong-gan-day.html'
  };

  if(destinations[page])window.location.href=destinations[page];
}function render(page=location.hash.slice(1)||'home'){let html;switch(page){case 'home':case 'teacher':html=home();break;case 'classes':html=classes();break;case 'exams':html=exams();break;case 'bank':html=bank();break;case 'assignments':html=assignments();break;case 'results':html=results();break;case 'errors':html=errors();break;case 'paths':html=paths();break;case 'plans':html=plans();break;case 'reports':html=reports();break;case 'activity':html=heading('Hoạt động gần đây','Nhật ký thay đổi trong bản demo')+`<section class="panel">${db.activities.map(a=>`<div class="activity"><b>${esc(a.title)}</b><small>${esc(a.time)}</small></div>`).join('')}</section>`;break;default:html=heading('Không gian Giáo viên','Các mục khác thuộc website Qurio của bạn')+'<section class="panel">Trang này là liên kết trong sidebar. Bạn có thể thay bằng đường dẫn đến trang hiện có trong dự án Qurio.</section>'} $('view').innerHTML=html}

function classes(){return heading('Quản lý lớp học','Tạo lớp và cập nhật số học sinh','<button class="primary" onclick="newClass()">＋ Tạo lớp mới</button>')+`<section class="panel"><div class="tablewrap"><table class="table"><thead><tr><th>Mã lớp</th><th>Tên lớp</th><th>Số học sinh</th><th>Thao tác</th></tr></thead><tbody>${db.classes.map(c=>`<tr><td>${esc(c.id)}</td><td>${esc(c.name)}</td><td>${c.count}</td><td><button onclick="route('classes')">Chỉnh sửa</button> <button onclick="removeClass('${esc(c.id)}')">Xóa</button></td></tr>`).join('')}</tbody></table></div></section>`}function newClass(){modal(`<h2>Tạo lớp học</h2><form id="classForm"><div class="field"><label>Mã lớp</label><input name="id" required maxlength="30" placeholder="VD: 11A3"></div><div class="field"><label>Tên lớp</label><input name="name" required placeholder="VD: Lớp 11A3"></div><div class="field"><label>Số học sinh</label><input name="count" type="number" min="0" max="200" value="0" required></div><button class="primary">Lưu lớp</button></form>`);$('classForm').onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));if(db.classes.some(c=>c.id===v.id)){toast('Mã lớp đã tồn tại');return}db.classes.push({...v,count:Number(v.count)});log('Đã tạo lớp '+v.name);closeModal();render('classes')}}function classDetail(id){let c=db.classes.find(x=>x.id===id);if(!c)return;modal(`<h2>Chỉnh sửa lớp ${esc(c.name)}</h2><form id="editClass"><div class="field"><label>Tên lớp</label><input name="name" required value="${esc(c.name)}"></div><div class="field"><label>Số học sinh (dữ liệu tổng hợp)</label><input type="number" name="count" min="0" max="200" required value="${c.count}"></div><button class="primary">Lưu thay đổi</button></form><p class="muted">Bản demo chỉ lưu số lượng. Danh sách tài khoản học sinh cần backend.</p>`);$('editClass').onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));c.name=v.name;c.count=Number(v.count);log('Đã cập nhật lớp '+c.name);closeModal();render('classes')}}function removeClass(id){if(!confirm('Xóa lớp này khỏi bản demo?'))return;db.classes=db.classes.filter(c=>c.id!==id);log('Đã xóa lớp '+id);render('classes')}
function exams(){return heading('Tạo đề kiểm tra','Tạo, xem và phê duyệt đề trước khi giao','<button class="primary" onclick="newExam()">＋ Tạo đề mới</button><button class="outline" onclick="uploadPdf()">☁ Tải PDF</button>')+`<section class="panel"><div class="tablewrap"><table class="table"><thead><tr><th>Tên đề</th><th>Số câu</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${db.exams.map(e=>`<tr><td>${esc(e.title)}</td><td>${e.questionIds.length}</td><td>${e.minutes} phút</td><td><span class="pill ${e.status==='approved'?'':'draft'}">${e.status==='approved'?'Đã duyệt':'Chờ duyệt'}</span></td><td><button onclick="examDetail(${e.id})">Xem / Duyệt</button></td></tr>`).join('')}</tbody></table></div></section>`}function newExam(){modal(`<h2>Tạo đề kiểm tra</h2><form id="examForm"><div class="field"><label>Tên đề</label><input name="title" required placeholder="VD: Kiểm tra Vật lý 11"></div><div class="grid2"><div class="field"><label>Thời gian (phút)</label><input type="number" name="minutes" min="1" max="180" value="30" required></div><div class="field"><label>Chủ đề</label><input name="topic" placeholder="VD: Dao động điều hòa"></div></div><p class="muted">Đề thủ công được tạo từ các câu hỏi hiện có trong Ngân hàng câu hỏi. AI từ PDF cần kết nối backend.</p><button class="primary">Tạo bản nháp</button></form>`);$('examForm').onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));let ids=db.questions.filter(q=>!v.topic||q.topic.toLowerCase().includes(v.topic.toLowerCase())).map(q=>q.id);db.exams.push({id:Date.now(),title:v.title,minutes:Number(v.minutes),questionIds:ids,status:'draft',classId:'',due:''});log('Đã tạo đề '+v.title);closeModal();render('exams')}}function examDetail(id){let e=db.exams.find(x=>x.id===id);if(!e)return;let qs=e.questionIds.map(id=>db.questions.find(q=>q.id===id)).filter(Boolean);modal(`<h2>${esc(e.title)}</h2><p class="muted">${e.minutes} phút · ${qs.length} câu · ${e.status==='approved'?'Đã duyệt':'Chờ duyệt'}</p>${qs.map((q,i)=>`<div class="question"><h3>Câu ${i+1}: ${esc(q.text)}</h3><div class="choices">${q.options.map((o,j)=>`<div class="choice">${'ABCD'[j]}. ${esc(o)} ${q.correct===j?'✓':''}</div>`).join('')}</div><p><b>Lời giải:</b> ${esc(q.explanation)}</p></div>`).join('')||'<p>Đề chưa có câu hỏi. Hãy thêm câu hỏi vào ngân hàng rồi tạo lại đề.</p>'}<div class="actions">${e.status==='draft'?`<button class="primary" onclick="approveExam(${id})" ${qs.length===0?'disabled':''}>✓ Duyệt đề</button>`:''}<button onclick="closeModal();route('bank')">Quản lý câu hỏi</button>${e.status==='approved'?`<button onclick="closeModal();route('assignments')">Giao bài →</button>`:''}</div>`)}function approveExam(id){let e=db.exams.find(x=>x.id===id);if(!e||!e.questionIds.length)return;if(!confirm('Xác nhận bạn đã kiểm tra câu hỏi, đáp án và lời giải?'))return;e.status='approved';log('Đã duyệt đề '+e.title);closeModal();render('exams')}
function bank(){return heading('Ngân hàng câu hỏi','Quản lý câu hỏi, đáp án và lời giải','<button class="primary" onclick="newQuestion()">＋ Thêm câu hỏi</button>')+`<section class="panel">${db.questions.map(q=>`<div class="question"><div class="panel-head"><b>${esc(q.text)}</b><span class="pill">${esc(q.level)}</span></div><p class="muted">${esc(q.topic)}</p><p>${q.options.map((o,i)=>`${'ABCD'[i]}. ${esc(o)}`).join(' · ')}</p><p><b>Đáp án:</b> ${'ABCD'[q.correct]} · <b>Lời giải:</b> ${esc(q.explanation)}</p><button onclick="editQuestion(${q.id})">Chỉnh sửa</button> <button onclick="deleteQuestion(${q.id})">Xóa</button></div>`).join('')}</section>`}function questionForm(q){modal(`<h2>${q?'Chỉnh sửa':'Thêm'} câu hỏi</h2><form id="questionForm"><div class="field"><label>Chủ đề</label><input name="topic" required value="${esc(q?.topic||'')}"></div><div class="field"><label>Nội dung câu hỏi</label><textarea name="text" required>${esc(q?.text||'')}</textarea></div>${[0,1,2,3].map(i=>`<div class="field"><label>Đáp án ${'ABCD'[i]}</label><input name="o${i}" required value="${esc(q?.options[i]||'')}"></div>`).join('')}<div class="grid2"><div class="field"><label>Đáp án đúng</label><select name="correct">${[0,1,2,3].map(i=>`<option value="${i}" ${q?.correct===i?'selected':''}>${'ABCD'[i]}</option>`).join('')}</select></div><div class="field"><label>Mức độ</label><select name="level">${['Nhận biết','Thông hiểu','Vận dụng','Vận dụng cao'].map(s=>`<option ${q?.level===s?'selected':''}>${s}</option>`).join('')}</select></div></div><div class="field"><label>Lời giải</label><textarea name="explanation" required>${esc(q?.explanation||'')}</textarea></div><button class="primary">Lưu câu hỏi</button></form>`);$('questionForm').onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));let record={id:q?.id||Date.now(),topic:v.topic,text:v.text,options:[v.o0,v.o1,v.o2,v.o3],correct:Number(v.correct),level:v.level,explanation:v.explanation};if(q)Object.assign(q,record);else db.questions.push(record);db.exams.filter(ex=>ex.questionIds.includes(record.id)).forEach(ex=>ex.status='draft');log((q?'Đã sửa':'Đã thêm')+' câu hỏi '+record.topic);closeModal();render('bank')}}function newQuestion(){questionForm(null)}function editQuestion(id){questionForm(db.questions.find(q=>q.id===id))}function deleteQuestion(id){if(!confirm('Xóa câu hỏi này?'))return;db.questions=db.questions.filter(q=>q.id!==id);db.exams.forEach(e=>{if(e.questionIds.includes(id)){e.questionIds=e.questionIds.filter(x=>x!==id);e.status='draft'}});log('Đã xóa câu hỏi');render('bank')}
function assignments(){return heading('Giao bài','Chỉ đề đã duyệt mới có thể giao cho lớp','<button class="primary" onclick="newAssignment()">＋ Giao bài mới</button>')+`<section class="panel"><div class="tablewrap"><table class="table"><thead><tr><th>Đề kiểm tra</th><th>Lớp</th><th>Hạn nộp</th><th>Trạng thái</th></tr></thead><tbody>${db.assignments.map(a=>`<tr><td>${esc(db.exams.find(e=>e.id===a.examId)?.title||'Đề đã xóa')}</td><td>${esc(a.classId)}</td><td>${esc(a.due||'Không đặt')}</td><td><span class="pill">Đã giao</span></td></tr>`).join('')||'<tr><td colspan="4"></td></tr>'}</tbody></table></div></section>`}function newAssignment(){let approved=db.exams.filter(e=>e.status==='approved');if(!approved.length||!db.classes.length){toast('Cần có đề đã duyệt và lớp học trước');return}modal(`<h2>Giao bài cho lớp</h2><form id="assignmentForm"><div class="field"><label>Chọn đề đã duyệt</label><select name="examId">${approved.map(e=>`<option value="${e.id}">${esc(e.title)}</option>`).join('')}</select></div><div class="field"><label>Chọn lớp</label><select name="classId">${db.classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Hạn nộp</label><input name="due" type="datetime-local" required></div><button class="primary">Xác nhận giao bài</button></form>`);$('assignmentForm').onsubmit=e=>{e.preventDefault();let v=Object.fromEntries(new FormData(e.target));db.assignments.push({id:Date.now(),examId:Number(v.examId),classId:v.classId,due:v.due});log('Đã giao bài cho lớp '+v.classId);closeModal();render('assignments')}}
function results(){return heading('Kết quả học sinh','Dữ liệu bài làm được ghi nhận khi kết nối hệ thống học sinh')+`<section class="panel"><h2>Thống kê bài làm</h2><p class="muted">${db.attempts.length?'Đã ghi nhận '+db.attempts.length+' lượt làm.':'Chưa có bài làm thực tế. Không hiển thị điểm số giả.'}</p><div class="tablewrap"><table class="table"><tr><th>Học sinh</th><th>Đề</th><th>Điểm</th><th>Thời gian</th></tr>${db.attempts.map(a=>`<tr><td>${esc(a.student)}</td><td>${esc(a.exam)}</td><td>${esc(a.score)}</td><td>${esc(a.time)}</td></tr>`).join('')}</table></div></section>`}function errors(){let counts={};for(let a of db.attempts){for(let err of (a.errors||[])){counts[err]=(counts[err]||0)+1}}let entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);return heading('Phân tích lỗi sai','Thống kê chủ đề cần củng cố từ bài làm thực tế')+`<section class="panel"><h2>Chủ đề thường mắc lỗi</h2>${entries.length?entries.map(([t,n])=>`<div class="chartbar"><span>${esc(t)}</span><div class="track"><div class="fill" style="width:${Math.round(n/Math.max(...entries.map(x=>x[1]))*100)}%"></div></div><b>${n} lỗi</b></div>`).join(''):'<p class="muted"></p>'}</section>`}function paths(){return heading('Lộ trình học tập','Đề xuất ôn tập dựa trên kết quả thực tế')+`<section class="panel"><h2>Gợi ý lộ trình</h2><p class="muted">Sau khi có dữ liệu bài làm, giáo viên có thể chọn chủ đề học sinh còn yếu để giao bài luyện bổ sung.</p><button onclick="route('errors')">Xem phân tích lỗi sai →</button></section>`}function plans(){return heading('Kế hoạch giảng dạy','Lưu kế hoạch theo tuần, tháng, học kỳ','<button class="primary" onclick="newPlan()">＋ Thêm kế hoạch</button>')+`<section class="panel">${db.plans.map(p=>`<div class="activity"><div><b>${esc(p.title)}</b><small>${esc(p.date)} · ${esc(p.note)}</small></div></div>`).join('')||'<p class="muted"></p>'}</section>`}function newPlan(){modal(`<h2>Thêm kế hoạch giảng dạy</h2><form id="planForm"><div class="field"><label>Tiêu đề</label><input name="title" required></div><div class="field"><label>Ngày dự kiến</label><input type="date" name="date" required></div><div class="field"><label>Ghi chú</label><textarea name="note"></textarea></div><button class="primary">Lưu kế hoạch</button></form>`);$('planForm').onsubmit=e=>{e.preventDefault();db.plans.push(Object.fromEntries(new FormData(e.target)));log('Đã tạo kế hoạch');closeModal();render('plans')}}function reports(){return heading('Báo cáo thông minh','Tổng hợp dữ liệu quản lý và xuất báo cáo')+`<div class="stats">${[[svgIcon('classes'),db.classes.length,'Lớp học','blue'],[svgIcon('exams'),db.exams.length,'Đề kiểm tra','purple'],[svgIcon('assignments'),db.assignments.length,'Bài đã giao','green']].map(x=>`<div class="stat"><div class="fi ${x[3]}">${x[0]}</div><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('')}</div><section class="panel" style="margin-top:18px"><h2>Xuất báo cáo</h2><p class="muted">Xuất bảng tổng hợp CSV có thể mở bằng Excel. Dữ liệu trong bản demo chỉ lưu trên trình duyệt.</p><button class="primary" onclick="exportCSV()">↓ Xuất CSV</button></section>`}function exportCSV(){let rows=[['Loại','Tên','Số lượng'],...db.classes.map(c=>['Lớp',c.name,c.count]),...db.exams.map(e=>['Đề',e.title,e.questionIds.length])];let csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n');let blob=new Blob([csv],{type:'text/csv;charset=utf-8'});let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download='Qurio_Bao_Cao.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function uploadPdf(){modal(`<h2>☁ Tải tài liệu PDF</h2><p>Chọn file PDF để chuẩn bị tạo đề Vật lý 11 (20 câu, 30 phút).</p><div class="field"><label>Chọn tài liệu PDF</label><input type="file" id="pdfFile" accept="application/pdf,.pdf"></div><div class="field"><label>Môn học</label><select id="pdfSubject"><option>Vật lý 11</option><option>Toán 11</option><option>Hóa học 11</option></select></div><div class="grid2"><div class="field"><label>Số câu</label><input type="number" id="pdfCount" value="20" min="1" max="60"></div><div class="field"><label>Thời gian (phút)</label><input type="number" id="pdfMinutes" value="30" min="1" max="180"></div></div><button class="primary" onclick="pdfNext()">Tiếp tục →</button><p class="muted">Bản giao diện hiện chưa gọi AI thật. Tích hợp Apps Script + API sẽ được thực hiện riêng để bảo vệ khóa API.</p>`)}function pdfNext(){let f=$('pdfFile').files[0];if(!f){toast('Hãy chọn file PDF');return}if(f.type!=='application/pdf'&&!f.name.toLowerCase().endsWith('.pdf')){toast('Chỉ chấp nhận PDF');return}if(f.size>10*1024*1024){toast('File demo tối đa 10 MB');return}modal(`<h2>Đã chọn tài liệu</h2><p><b>${esc(f.name)}</b> (${(f.size/1024/1024).toFixed(2)} MB)</p><p>Đã nhận file trong trình duyệt. Chưa tải lên máy chủ hoặc phân tích bằng AI.</p><p>Để tạo đề thật, cần bổ sung Google Apps Script đọc PDF, gọi Woku/Gemini và trả về bản nháp để giáo viên duyệt.</p><button class="primary" onclick="closeModal();route('bank')">Soạn câu hỏi thủ công →</button>`)}
$('search').addEventListener('keydown',e=>{if(e.key!=='Enter')return;let q=e.target.value.trim().toLowerCase();if(!q)return;let c=db.classes.find(x=>x.name.toLowerCase().includes(q));let ex=db.exams.find(x=>x.title.toLowerCase().includes(q));if(c){route('classes');classDetail(c.id)}else if(ex){route('exams');examDetail(ex.id)}else toast('Không tìm thấy lớp hoặc đề phù hợp')});document.querySelector('.main-nav')?.addEventListener('click',e=>{let a=e.target.closest('[data-nav]');if(!a||a.dataset.nav!=='teacher')return;e.preventDefault();route('home')});window.addEventListener('hashchange',()=>render());

$('logoutButton')?.addEventListener('click',()=>toast('Hãy kết nối chức năng đăng nhập/đăng xuất của Qurio chính.'));

// Hồ sơ demo lưu tại trình duyệt. Khi tích hợp đăng nhập thật, lấy dữ liệu từ backend Qurio.
const TEACHER_PROFILE_KEY='qurio_teacher_profile_v1';
function getTeacherProfile(){
  const verified = window.QurioAccountUI?.user;
  let local = {};
  try { local = JSON.parse(localStorage.getItem(TEACHER_PROFILE_KEY) || '{}') || {}; } catch (_) {}
  return {
    name: verified ? String(verified.fullName || verified.username || 'Giáo viên Qurio') : 'Giáo viên Qurio',
    email: verified ? String(verified.email || '') : '',
    subject: verified ? String(verified.subject || local.subject || '') : '',
    school: verified ? String(local.school || '') : ''
  };
}
function teacherInitials(name){return (name.trim().split(/\s+/).slice(-2).map(x=>x[0]||'').join('')||'GV').toUpperCase()}
function updateTeacherProfileUI(){const p=getTeacherProfile();for(const id of ['teacherHeaderName','teacherMenuName']){const e=document.getElementById(id);if(e)e.textContent=p.name}for(const id of ['teacherAvatar','teacherMenuAvatar']){const e=document.getElementById(id);if(e)e.textContent=teacherInitials(p.name)}const email=document.getElementById('teacherMenuEmail');if(email)email.textContent=p.email||'Chưa cập nhật email'}
function closeTeacherProfile(){document.getElementById('teacherProfileMenu')?.classList.add('hidden');document.getElementById('teacherProfileTrigger')?.setAttribute('aria-expanded','false')}
function showTeacherProfile(edit=false){closeTeacherProfile();const p=getTeacherProfile();if(!edit){modal(`<h2>Thông tin giáo viên</h2><div class="profile-detail"><div><span>Họ và tên</span><strong>${esc(p.name)}</strong></div><div><span>Email</span><strong>${esc(p.email||'Chưa cập nhật')}</strong></div><div><span>Môn giảng dạy</span><strong>${esc(p.subject||'Chưa cập nhật')}</strong></div><div><span>Trường học</span><strong>${esc(p.school||'Chưa cập nhật')}</strong></div></div><button class="primary" onclick="showTeacherProfile(true)">✎ Chỉnh sửa thông tin</button><p class="muted">Hồ sơ demo chỉ lưu trong trình duyệt này; chưa đồng bộ với tài khoản Qurio.</p>`);return}modal(`<h2>Chỉnh sửa thông tin giáo viên</h2><form id="teacherProfileForm"><div class="field"><label>Họ và tên</label><input name="name" required maxlength="80" value="${esc(p.name)}"></div><div class="field"><label>Email</label><input name="email" type="email" maxlength="120" value="${esc(p.email)}"></div><div class="field"><label>Môn giảng dạy</label><input name="subject" maxlength="80" value="${esc(p.subject)}"></div><div class="field"><label>Trường học</label><input name="school" maxlength="120" value="${esc(p.school)}"></div><button class="primary" type="submit">Lưu thông tin</button></form>`);document.getElementById('teacherProfileForm').addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));localStorage.setItem(TEACHER_PROFILE_KEY,JSON.stringify(data));updateTeacherProfileUI();closeModal();if(!location.hash||location.hash==='#home'||location.hash==='#teacher')render('home');toast('Đã lưu hồ sơ trên trình duyệt')})}
const profileTrigger=document.getElementById('teacherProfileTrigger');const profileMenu=document.getElementById('teacherProfileMenu');profileTrigger?.addEventListener('click',e=>{e.stopPropagation();const opened=profileMenu.classList.toggle('hidden')===false;profileTrigger.setAttribute('aria-expanded',String(opened))});document.addEventListener('click',e=>{if(!e.target.closest('.profile-wrap'))closeTeacherProfile()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTeacherProfile()});document.getElementById('teacherViewProfile')?.addEventListener('click',()=>showTeacherProfile());document.getElementById('teacherEditProfile')?.addEventListener('click',()=>showTeacherProfile(true));document.getElementById('teacherSubscription')?.addEventListener('click',()=>{closeTeacherProfile();modal('<h2>Gói dịch vụ Qurio</h2><p>Thông tin gói dịch vụ sẽ hiển thị khi kết nối hệ thống tài khoản và thanh toán thật.</p>')});document.getElementById('teacherProfileLogout')?.addEventListener('click',()=>{closeTeacherProfile();toast('Cần kết nối đăng xuất với hệ thống xác thực Qurio chính.')});updateTeacherProfileUI();

// Điều hướng các bookmark cũ đến trang chức năng riêng.
const oldHash=location.hash.slice(1);
if(oldHash && oldHash!=='home' && oldHash!=='teacher') route(oldHash);
else render('home');

// V7: luôn mở thanh điều hướng ở đầu trang khi tải lại.
const qurioSidebar = document.getElementById('sidebar');
if (qurioSidebar) qurioSidebar.scrollTop = 0;

// V8: Notification is a real clickable control (demo, no backend notifications yet).
document.getElementById('teacherNotification')?.addEventListener('click', () => {
  if (typeof toast === 'function') toast('Chưa có thông báo mới.');
});


// V9: Nút menu dùng chung cách mở/đóng với Trang Chủ Qurio trên tablet/điện thoại.
(() => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar || !toggle || !backdrop) return;
  function closeMenu(){
    sidebar.classList.remove('is-open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Mở menu điều hướng');
    backdrop.hidden = true;
    document.body.classList.remove('teacher-menu-open');
  }
  function openMenu(){
    sidebar.classList.add('is-open');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Đóng menu điều hướng');
    backdrop.hidden = false;
    document.body.classList.add('teacher-menu-open');
  }
  toggle.addEventListener('click',()=>sidebar.classList.contains('is-open')?closeMenu():openMenu());
  backdrop.addEventListener('click',closeMenu);
  sidebar.addEventListener('click',(e)=>{if(e.target.closest('a[href]'))closeMenu()});
  document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeMenu()});
  window.addEventListener('resize',()=>{if(window.innerWidth>1100)closeMenu()});
})();

// Tải dữ liệu thật sau khi khởi tạo giao diện.
loadTeacherDashboard();

// Đồng bộ banner và menu khi phiên đăng nhập Qurio đã được xác minh.
window.addEventListener('qurio:account', () => {
  updateTeacherProfileUI();
  if (!location.hash || location.hash === '#home' || location.hash === '#teacher') render('home');
});
