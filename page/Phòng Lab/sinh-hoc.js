
(()=>{'use strict';
const $=s=>document.querySelector(s);
const topics=[
 {id:'membrane',icon:'💧',title:'01. Vận chuyển chất qua màng',subtitle:'Vận chuyển thụ động · Vận chuyển chủ động',hint:'Quan sát sự di chuyển của phân tử qua màng, vai trò của protein vận chuyển và sự chênh lệch nồng độ.',exps:[{id:'membrane-transport',name:'Vận chuyển qua màng – PhET',type:'phet',sim:'membrane-transport'},{id:'diffusion-phet',name:'Khuếch tán – PhET',type:'phet',sim:'diffusion'}]},
 {id:'animal',icon:'🫀',title:'02. Cảm ứng và tuần hoàn động vật',subtitle:'Xung thần kinh · Nhịp tim',hint:'Thay đổi cường độ kích thích hoặc nhịp tim và quan sát đáp ứng của hệ.',exps:[{id:'neuron',name:'Điện thế hoạt động – Neuron',type:'phet',sim:'neuron'},{id:'heart',name:'Nhịp tim và cung lượng tim',type:'heart'}]},
 {id:'dna',icon:'🧬',title:'03. Sinh học phân tử (DNA và Gen)',subtitle:'Bắt cặp bazơ · Biểu hiện gen',hint:'Quan sát nguyên tắc bổ sung A–T, G–C và quá trình biểu hiện gen.',exps:[{id:'dna',name:'DNA và nguyên tắc bổ sung',type:'dna'},{id:'gene',name:'Biểu hiện gen – PhET',type:'phet',sim:'gene-expression-essentials'}]},
 {id:'ecology',icon:'🌱',title:'04. Tiến hóa và sinh thái học',subtitle:'Chọn lọc tự nhiên · Quần thể',hint:'Thay đổi điều kiện môi trường và quan sát sự biến động quần thể.',exps:[{id:'selection',name:'Chọn lọc tự nhiên – PhET',type:'phet',sim:'natural-selection'},{id:'population',name:'Tăng trưởng quần thể',type:'population'}]}
];
let topic=0,exp=0,params={},iframeUrl='',lastExplanation='';
const $topics=$('#bioTopics'),$exps=$('#bioExperiments'),$viewport=$('#bioViewport'),$controls=$('#bioControls'),$explanation=$('#bioExplanation'),$credit=$('#bioCredit');
function renderMenu(){ $topics.innerHTML=topics.map((t,i)=>`<button class="bio-topic ${topic===i?'active':''}" data-t="${i}"><span class="bio-topic-icon" aria-hidden="true">${t.icon}</span><span class="bio-topic-text">${t.title}</span></button>`).join('');$exps.innerHTML=topics[topic].exps.map((e,i)=>`<button class="bio-exp ${exp===i?'active':''}" data-e="${i}">◉ &nbsp;${e.name}</button>`).join('');$topics.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{topic=+b.dataset.t;exp=0;load()});$exps.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{exp=+b.dataset.e;load()})}
function slider(key,label,min,max,step,value,unit=''){return `<div class="bio-control"><label for="bio-${key}">${label}<output id="out-${key}">${value}${unit}</output></label><input id="bio-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-key="${key}" data-unit="${unit}"></div>`}
function select(key,label,options){return `<div class="bio-control"><label for="bio-${key}">${label}</label><select id="bio-${key}" data-key="${key}">${options.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>`}
function svg(inner){return `<svg viewBox="0 0 850 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mô phỏng sinh học">${inner}</svg>`}
function pill(x,y,text,color='#4c2e91'){return `<text x="${x}" y="${y}" text-anchor="middle" font-size="17" font-weight="700" fill="${color}">${text}</text>`}
function draw(){
 const e=topics[topic].exps[exp];let html='',explain='';
 if(e.type==='osmosis'){
 const left=+params.left,right=+params.right,diff=right-left,flow=Math.abs(diff)*1.6;
 const arrow=diff===0?'↔':diff>0?'→':'←';
 const dots=(n,x,color)=>Array.from({length:Math.round(n*1.5)},(_,i)=>{const xx=x+(i*37%210),yy=150+(i*61%160);return `<circle cx="${xx}" cy="${yy}" r="5" fill="${color}" opacity=".85"/>`}).join('');
 html=svg(`<rect x="92" y="105" width="666" height="270" rx="24" fill="#e8f5ff" stroke="#adc7f8" stroke-width="3"/><rect x="420" y="105" width="11" height="270" fill="#b18bf4" opacity=".8"/>${dots(left,128,'#8760df')}${dots(right,475,'#e99b52')}${pill(254,74,'Dung dịch A')}${pill(594,74,'Dung dịch B')}${pill(254,410,left+' đơn vị chất tan')}${pill(594,410,right+' đơn vị chất tan')}<text x="425" y="235" text-anchor="middle" font-size="45" fill="#5e32d3">${arrow}</text>${pill(425,275,'Nước', '#4d5fa3')}`);
 explain=diff===0?'Hai bên có nồng độ chất tan bằng nhau: không có dòng nước thuần theo một chiều.':`Theo mô hình màng bán thấm chỉ cho nước đi qua, nước có xu hướng chuyển từ phía có nồng độ chất tan thấp sang phía cao hơn (${diff>0?'A → B':'B → A'}).`;
 }else if(e.type==='diffusion'){
 const l=+params.left,r=+params.right,d=l-r,arrow=d===0?'↔':d>0?'→':'←';
 const dots=(n,x,color)=>Array.from({length:Math.round(n*1.3)},(_,i)=>`<circle cx="${x+(i*43%260)}" cy="${150+(i*71%180)}" r="5" fill="${color}"/>`).join('');
 html=svg(`<rect x="90" y="100" width="670" height="280" rx="22" fill="#f0f7ff" stroke="#c7d7f6"/><rect x="415" y="100" width="15" height="280" fill="#bba2f3" opacity=".7"/>${dots(l,120,'#7448e2')}${dots(r,460,'#7448e2')}${pill(250,72,'Phía A')}${pill(590,72,'Phía B')}<text x="423" y="270" text-anchor="middle" font-size="48" fill="#5e32d3">${arrow}</text>${pill(250,411,l+' hạt')}${pill(590,411,r+' hạt')}`);
 explain=d===0?'Số hạt hai phía bằng nhau: khuếch tán vẫn diễn ra hai chiều, nhưng không có dòng thuần.':`Chất tan khuếch tán thuần theo chiều ${d>0?'A → B':'B → A'}, từ vùng nồng độ cao đến vùng nồng độ thấp (giả định hai ngăn có thể tích bằng nhau và màng cho chất tan đi qua).`;
 }else if(e.type==='heart'){
 const hr=+params.hr,sv=+params.sv,co=hr*sv/1000;
 const pts=Array.from({length:190},(_,i)=>{const x=70+i*3.8,phase=(i*hr/60/28)%1;const y=230-(phase<.04?phase/.04*110:phase<.07?110-(phase-.04)/.03*150:phase<.12?-40+(phase-.07)/.05*40:0);return `${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`}).join(' ');
 html=svg(`<rect x="45" y="50" width="760" height="340" rx="20" fill="#fff" stroke="#e6ddfa"/>${Array.from({length:8},(_,i)=>`<path d="M${80+i*100} 65V375" stroke="#f2ebfb"/>`).join('')}${Array.from({length:4},(_,i)=>`<path d="M60 ${120+i*75}H790" stroke="#f2ebfb"/>`).join('')}<path d="${pts}" stroke="#e64b80" stroke-width="4" fill="none" stroke-linejoin="round"/>${pill(420,35,'Mô phỏng nhịp tim (minh họa)', '#5e32d3')}${pill(420,415,`${hr} nhịp/phút  •  ${co.toFixed(2)} L/phút`,'#53308c')}`);
 explain=`Cung lượng tim = nhịp tim × thể tích nhát bóp = ${hr} × ${sv} / 1000 = ${co.toFixed(2)} L/phút. Đường sóng chỉ minh họa chu kỳ, không phải điện tâm đồ lâm sàng.`;
 }else if(e.type==='dna'){
 const seq=(params.seq||'ATGCCGTA').toUpperCase().replace(/[^ATGC]/g,'').slice(0,12)||'ATGCCGTA';const comp={A:'T',T:'A',G:'C',C:'G'};const other=seq.split('').map(x=>comp[x]).join('');
 const colors={A:'#7449d7',T:'#e59c40',G:'#25a888',C:'#df628b'};
 const rungs=seq.split('').map((x,i)=>{const y=90+i*29,dx=70*Math.sin(i*.65);return `<line x1="${420+dx}" y1="${y}" x2="${420-dx}" y2="${y}" stroke="#c6b4ec" stroke-width="5"/><circle cx="${420+dx}" cy="${y}" r="14" fill="${colors[x]}"/><circle cx="${420-dx}" cy="${y}" r="14" fill="${colors[comp[x]]}"/><text x="${420+dx}" y="${y+5}" text-anchor="middle" font-size="13" font-weight="700" fill="white">${x}</text><text x="${420-dx}" y="${y+5}" text-anchor="middle" font-size="13" font-weight="700" fill="white">${comp[x]}</text>`}).join('');
 html=svg(`${pill(420,40,'Hai mạch DNA bổ sung')}${rungs}${pill(190,380,'5′–'+seq+'–3′')}${pill(650,380,'3′–'+other+'–5′')}`);
 explain=`Mạch bổ sung của 5′–${seq}–3′ là 3′–${other}–5′. A bắt cặp với T; G bắt cặp với C. Hình là sơ đồ minh họa, không thể hiện chính xác cấu trúc 3D.`;
 }else if(e.type==='population'){
 const r=+params.rate/100,k=+params.cap,p0=+params.initial,years=+params.years;
 let p=p0,points=[p0];for(let i=0;i<years;i++){p=Math.max(0,p+r*p*(1-p/k));points.push(p)}
 const max=Math.max(k,...points,1);const path=points.map((n,i)=>`${i?'L':'M'}${85+i*680/years},${365-n/max*260}`).join(' ');
 html=svg(`<rect x="65" y="65" width="720" height="315" rx="18" fill="white" stroke="#e5daf9"/><path d="M85 80V365H770" stroke="#9684bc" stroke-width="2" fill="none"/><path d="M85 ${365-k/max*260}H770" stroke="#ddad75" stroke-dasharray="7 6" stroke-width="2"/><path d="${path}" stroke="#7b43df" stroke-width="5" fill="none"/>${pill(420,45,'Tăng trưởng logistic (mô hình đơn giản)')}${pill(420,413,'Thời gian: '+years+' bước  ·  Quần thể cuối: '+Math.round(p))}${pill(650,90,'Sức chứa K = '+k,'#c1834e')}`);
 explain=`Mô hình rời rạc: N(t+1) = N(t) + r·N(t)·(1 − N(t)/K). Với r=${r.toFixed(2)}, K=${k}, N₀=${p0}, sau ${years} bước: N ≈ ${Math.round(p)}. Đây là mô hình toán học giản lược, không dự đoán quần thể thật.`;
 }
 $viewport.innerHTML=html;$explanation.textContent=explain;lastExplanation=explain;
}
function load(){
 const t=topics[topic],e=t.exps[exp];$('#bioTitle').textContent=t.title;$('#bioSubtitle').textContent=t.subtitle;$('#bioHint').textContent=t.hint;$('#bioExperimentName').textContent=e.name;renderMenu();$viewport.innerHTML='';$controls.innerHTML='';$credit.innerHTML='';
 if(e.type==='phet'){
  iframeUrl=`https://phet.colorado.edu/sims/html/${e.sim}/latest/${e.sim}_en.html`;
  const frame=document.createElement('iframe');frame.src=iframeUrl;frame.title=e.name;frame.allow='fullscreen';frame.allowFullscreen=true;frame.loading='lazy';$viewport.append(frame);
  $explanation.textContent='Mô phỏng PhET do University of Colorado Boulder phát triển. Dùng các điều khiển trong mô phỏng để quan sát hiện tượng. Nếu khung không tải, hãy mở tại nguồn bằng liên kết bên dưới.';
  const a=document.createElement('a');a.href=`https://phet.colorado.edu/en/simulations/${e.sim}`;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Mở mô phỏng trên PhET ↗';$credit.append('Nguồn: PhET Interactive Simulations · ',a);return;
 }
 iframeUrl='';params={left:8,right:18,hr:75,sv:70,seq:'ATGCCGTA',rate:35,cap:500,initial:45,years:24};
 if(e.type==='osmosis'||e.type==='diffusion')$controls.innerHTML=slider('left','Nồng độ / số hạt phía A',0,40,1,8)+slider('right','Nồng độ / số hạt phía B',0,40,1,18);
 if(e.type==='heart')$controls.innerHTML=slider('hr','Nhịp tim',40,180,1,75,' nhịp/phút')+slider('sv','Thể tích nhát bóp',30,120,1,70,' mL');
 if(e.type==='dna')$controls.innerHTML=`<div class="bio-control" style="flex-basis:100%"><label for="bio-seq">Nhập trình tự DNA (tối đa 12 bazơ A, T, G, C)</label><input id="bio-seq" maxlength="12" value="ATGCCGTA" style="width:100%;border:1px solid #ddd0f6;border-radius:9px;padding:10px;font:inherit;box-sizing:border-box" autocomplete="off"></div>`;
 if(e.type==='population')$controls.innerHTML=slider('initial','Quần thể ban đầu',10,300,5,45)+slider('rate','Tốc độ tăng trưởng r',5,70,5,35,'%')+slider('cap','Sức chứa K',200,1200,50,500)+slider('years','Số bước thời gian',5,50,1,24);
 $controls.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>{params[el.id.replace('bio-','')]=el.value;const o=$('#out-'+el.id.replace('bio-',''));if(o)o.textContent=el.value+(el.dataset.unit||'');draw()}));
 draw();
}
$('#bioReload').onclick=()=>load();
$('#bioFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $viewport.requestFullscreen()}catch{alert('Trình duyệt không cho phép mở toàn màn hình.')}};


const storageKey='qurio_lab_biology_notes_v1';
function noteKey(){return topics[topic].exps[exp].id}
function restoreNotes(){try{const v=JSON.parse(localStorage.getItem(storageKey)||'{}');$('#bioNotes').value=v[noteKey()]||''}catch{$('#bioNotes').value=''}}
$('#bioSave').onclick=()=>{try{const v=JSON.parse(localStorage.getItem(storageKey)||'{}');v[noteKey()]=$('#bioNotes').value;localStorage.setItem(storageKey,JSON.stringify(v));$('#bioSaveStatus').textContent='Đã lưu trên trình duyệt ✓';}catch{$('#bioSaveStatus').textContent='Không thể lưu vào trình duyệt.'}};
const oldLoad=load;load=function(){oldLoad();restoreNotes();$('#bioSaveStatus').textContent=''};
const q=new URLSearchParams(location.search).get('topic');if(q){const i=topics.findIndex(x=>x.id===q);if(i>=0)topic=i}
load();
})();
