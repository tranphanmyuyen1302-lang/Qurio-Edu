(()=>{'use strict';const $=id=>document.getElementById(id);
const DATA_CONNECTED=true;
const NAMES={math:'Toán 11',physics:'Vật lý 11',informatics:'Tin học 11'};const TOPICS={math:['Công thức lượng giác','Hàm số lượng giác','Phương trình lượng giác','Điều kiện nghiệm','Vận dụng tổng hợp'],physics:['Dao động điều hòa','Các đại lượng dao động','Con lắc','Năng lượng dao động','Vận dụng tổng hợp'],informatics:['Kiến thức cơ bản','Dữ liệu và biến','Cấu trúc điều khiển','Thuật toán','Vận dụng tổng hợp']};let selected='all';function account(){try{const u=JSON.parse(localStorage.getItem('nguoiDungHienTai')||'null');return u?.email||u?.Email||u?.tenDangNhap||'local'}catch{return 'local'}}function load(){if(!DATA_CONNECTED)return {};try{const o=JSON.parse(localStorage.getItem('qurio_roadmap_v1_'+account())||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch{return {}}}function scores(r){return Array.isArray(r?.scores)?r.scores.filter(x=>Number.isFinite(x)&&x>=0&&x<=100):[]}function avg(v){return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null}function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function attempts(r){return Array.isArray(r?.history)?r.history.filter(x=>x&&typeof x==='object'):[]}function dataset(){const all=load();return Object.entries(NAMES).filter(([id])=>selected==='all'||id===selected).map(([id,name])=>({id,name,record:all[id]||{},values:scores(all[id]),history:attempts(all[id])}))}function render(){const data=dataset(),vals=data.flatMap(d=>d.values),hist=data.flatMap(d=>d.history.map(h=>({...h,subject:d.id})));$('metricAverage').textContent=avg(vals)===null?'—':avg(vals)+'%';$('metricAttempts').textContent=hist.length?hist.length:'—';$('metricMastered').textContent=vals.length?vals.filter(v=>v>=80).length:'—';$('metricWeak').textContent=vals.length?vals.filter(v=>v<60).length:'—';renderBars(data);renderTopics(data);renderHistory(hist);renderTrend(data);renderInsight(data)}function renderBars(data){const el=$('subjectBars');if(!data.some(d=>d.values.length)){el.innerHTML='<div class="q-empty-state"><span class="q-empty-icon">◫</span><strong>Chưa có kết quả đánh giá</strong><p>Năng lực theo môn học sẽ hiển thị khi được kết nối với dữ liệu học tập.</p></div>';return}el.innerHTML=data.map(d=>{const v=avg(d.values);return `<div><div class="bar-head"><strong>${esc(d.name)}</strong><span>${v===null?'—':v+'%'}</span></div><div class="bar-track"><div class="bar-fill" style="width:${v||0}%"></div></div><div class="bar-sub">${d.values.length} chủ đề đã được đánh giá</div></div>`}).join('')}function renderTopics(data){const topics=data.flatMap(d=>(d.record.scores||[]).map((v,i)=>({v,i,name:TOPICS[d.id]?.[i]||'Chủ đề '+(i+1),subject:d.name}))).filter(x=>Number.isFinite(x.v)&&x.v>=0&&x.v<=100).sort((a,b)=>a.v-b.v);$('topicList').innerHTML=topics.length?topics.slice(0,12).map(t=>`<div class="topic-item"><div><div class="topic-title">${esc(t.name)}</div><div class="topic-meta">${esc(t.subject)} · ${t.v>=80?'Nắm vững':t.v>=60?'Cần củng cố':'Cần ưu tiên'}</div></div><div class="topic-side">${Math.round(t.v)}%<div class="topic-track"><span class="${t.v<60?'low':t.v>=80?'high':''}" style="width:${t.v}%"></span></div></div></div>`).join(''):'<div class="q-empty-state"><span class="q-empty-icon">◇</span><strong>Chưa có dữ liệu chủ đề</strong><p>Kết quả sẽ được cập nhật khi có dữ liệu học tập.</p></div>'}function renderHistory(hist){hist.sort((a,b)=>Date.parse(b.date||'')-Date.parse(a.date||''));$('activityList').innerHTML=hist.length?hist.slice(0,8).map(h=>{const label=h.mode==='practice'?'Luyện tập':h.mode==='diagnostic'?'Đánh giá chuyên sâu':'Đánh giá năng lực';const date=Number.isFinite(Date.parse(h.date||''))?new Date(h.date).toLocaleString('vi-VN'):'Lần đánh giá';const score=Number.isFinite(h.correct)&&Number.isFinite(h.total)?`${h.correct}/${h.total} câu đúng`:'Đã cập nhật năng lực';return `<div class="activity"><div class="activity-icon">✓</div><div><strong>${label} · ${esc(NAMES[h.subject]||'Qurio')}</strong><p>${esc(score)}</p><time>${esc(date)}</time></div></div>`}).join(''):'<div class="q-empty-state"><span class="q-empty-icon">◷</span><strong>Chưa có hoạt động</strong><p>Lịch sử sẽ xuất hiện sau khi kết nối dữ liệu.</p></div>'}function renderTrend(data){const events=data.flatMap(d=>d.history.map(h=>({date:h.date,score:avg(Array.isArray(h.scores)?h.scores.filter(Number.isFinite):[]),subject:d.id}))).filter(e=>e.score!==null&&Number.isFinite(Date.parse(e.date||''))).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)).slice(-16);const el=$('trendChart');if(!events.length){el.innerHTML='<div class="q-empty-state"><span class="q-empty-icon">↗</span><strong>Chưa có dữ liệu biểu đồ</strong><p>Xu hướng tiến bộ sẽ hiển thị khi có kết quả đánh giá.</p></div>';return}const w=640,h=255,l=42,r=17,t=18,b=42,iw=w-l-r,ih=h-t-b;const points=events.map((e,i)=>({x:l+(events.length===1?iw/2:i*iw/(events.length-1)),y:t+ih*(1-e.score/100),score:e.score,date:e.date}));const lines=[0,25,50,75,100].map(v=>{const y=t+ih*(1-v/100);return `<line x1="${l}" y1="${y}" x2="${w-r}" y2="${y}" stroke="#eeeaf6"/><text x="${l-10}" y="${y+4}" text-anchor="end" font-size="11" fill="#9992ac">${v}</text>`}).join('');const path=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${events.length} lần ghi nhận năng lực"><g>${lines}</g><path d="${path}" stroke="#7850df" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#fff" stroke="#7850df" stroke-width="3"><title>${p.score}% · ${esc(new Date(p.date).toLocaleDateString('vi-VN'))}</title></circle>`).join('')}<text x="${l}" y="${h-10}" font-size="11" fill="#9992ac">${esc(new Date(events[0].date).toLocaleDateString('vi-VN'))}</text><text x="${w-r}" y="${h-10}" text-anchor="end" font-size="11" fill="#9992ac">${esc(new Date(events[events.length-1].date).toLocaleDateString('vi-VN'))}</text></svg>`}function renderInsight(data){const weak=data.flatMap(d=>(d.record.scores||[]).map((v,i)=>({v,name:TOPICS[d.id]?.[i],subject:d.name}))).filter(x=>Number.isFinite(x.v)&&x.v<60).sort((a,b)=>a.v-b.v);if(weak.length){$('insightTitle').textContent='Ưu tiên củng cố '+weak[0].name;$('insightText').textContent=`Ở môn ${weak[0].subject}, mức thành thạo ước lượng của chủ đề này là ${Math.round(weak[0].v)}%. Bạn có thể luyện tập theo lộ trình để cải thiện từng bước.`}else if(data.some(d=>d.values.length)){$('insightTitle').textContent='Tiếp tục phát huy kết quả học tập';$('insightText').textContent='Bạn đã có những kết quả đánh giá đầu tiên. Hãy duy trì luyện tập và theo dõi sự thay đổi năng lực qua từng lần học.'}else{$('insightTitle').textContent='Bắt đầu hành trình tiến bộ';$('insightText').textContent='Làm bài đánh giá ở Lộ trình học tập để Qurio xây dựng hồ sơ năng lực và ghi nhận tiến bộ của bạn.'}}function init(){
if (window.QurioLearningSync) {
  window.QurioLearningSync.refresh()
    .then(result => {
      if (result?.ok) {
        render();
      }
    })
    .catch(error => {
      console.error("Lỗi đồng bộ tiến độ:", error);
    });
}

if (window.QurioAuth?.request) {
  window.QurioAuth.request(
    "learningProfileLoad",
    {}
  ).then(result => {
    if (
      result?.ok &&
      result.found &&
      result.records
    ) {
      const user = account();

      localStorage.setItem(
        "qurio_roadmap_v1_" + user,
        JSON.stringify(result.records)
      );

      render();
    }
  }).catch(error => {
    console.warn(
      "Không tải được tiến độ từ Sheets:",
      error.message
    );
  });
}
$('subjectFilter').addEventListener('change',e=>{selected=e.target.value;render()});render();window.addEventListener('storage',e=>{if(e.key?.startsWith('qurio_roadmap_v1_'))render()});document.addEventListener('qurio:attempt',render);const sidebar=$('sidebar'),toggle=$('sidebarToggle'),backdrop=$('sidebarBackdrop');
const closeMenu=()=>{sidebar?.classList.remove('is-open','open');if(backdrop)backdrop.hidden=true;toggle?.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')};
toggle?.addEventListener('click',()=>{const opening=!sidebar?.classList.contains('is-open');sidebar?.classList.toggle('is-open',opening);sidebar?.classList.toggle('open',opening);if(backdrop)backdrop.hidden=!opening;toggle?.setAttribute('aria-expanded',String(opening));document.body.classList.toggle('menu-open',opening)});
backdrop?.addEventListener('click',closeMenu);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
$('searchForm')?.addEventListener('submit',e=>e.preventDefault());
$('notificationToggle')?.addEventListener('click',()=>{const pop=$('notificationPopover');if(pop)pop.hidden=!pop.hidden});
$('profileToggle')?.addEventListener('click',()=>{const pop=$('profileMenu');if(pop)pop.hidden=!pop.hidden});
$('logoutButton')?.addEventListener('click',()=>{location.href='../../Đăng Nhập/dang-nhap.html'});
document.querySelectorAll('body > .sidebar .nav-item').forEach(a=>{const is=a.dataset.nav==='progress';a.classList.toggle('active',is);if(is)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();