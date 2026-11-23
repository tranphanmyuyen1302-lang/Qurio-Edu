(()=>{'use strict';const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];const urls={geometry:'https://www.geogebra.org/geometry','3d':'https://www.geogebra.org/3d',graphing:'https://www.geogebra.org/graphing',probability:'https://www.geogebra.org/classic'},titles={geometry:'Hình học phẳng','3d':'Hình học không gian',graphing:'Đại số & Giải tích',probability:'Thống kê & Xác suất'};let current='geometry',gg=null,goals=[];let resizePending=0;const key='qurio_math_goals';function persist(){localStorage.setItem(key,JSON.stringify(goals))}function render(){const host=$('#mathGoals');host.replaceChildren();goals.forEach((g,i)=>{const row=document.createElement('div');row.className='math-goal'+(g.done?' done':'');const cb=document.createElement('input');cb.type='checkbox';cb.checked=g.done;cb.id='math-goal-'+i;cb.onchange=()=>{g.done=cb.checked;persist();render()};const label=document.createElement('label');label.htmlFor=cb.id;label.textContent=g.text;const del=document.createElement('button');del.textContent='×';del.title='Xóa';del.onclick=()=>{goals.splice(i,1);persist();render()};row.append(cb,label,del);host.append(row)});$('#mathProgress').textContent=goals.filter(x=>x.done).length+'/'+goals.length}function tool(name){if(!urls[name])name='geometry';current=name;$('#mathTitle').textContent=titles[name];$('#mathExternal').href=urls[name];$$('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===name));const host=$('#mathApplet');host.replaceChildren();const msg=document.createElement('p');msg.textContent='Đang tải GeoGebra…';host.append(msg);gg=null;if(typeof GGBApplet!=='function'){const frame=document.createElement('iframe');frame.title='GeoGebra - '+titles[name];frame.src=urls[name];frame.loading='eager';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='fullscreen';host.replaceChildren(frame);$('#mathStatus').textContent='';return}try{const app=new GGBApplet({appName:name==='probability'?'classic':name,width:Math.max(650,host.clientWidth),height:host.clientHeight,showToolBar:true,showMenuBar:false,showAlgebraInput:true,showResetIcon:true,enableRightClick:true,showZoomButtons:true,language:'vi',useBrowserForJS:true,appletOnLoad(api){gg=api;$('#mathStatus').textContent='GeoGebra đã sẵn sàng.';scheduleAppletResize()}},true);app.inject('mathApplet');scheduleAppletResize()}catch(e){msg.textContent='Không thể khởi tạo GeoGebra.';console.error(e)}}function resizeApplet(){
 const host=$('#mathApplet');if(!host)return;
 const w=Math.max(1,Math.round(host.clientWidth)),h=Math.max(1,Math.round(host.clientHeight));
 // GeoGebra's injected applet has fixed dimensions; enlarging the HTML parent alone is insufficient.
 if(gg&&typeof gg.setSize==='function'){
  try{gg.setSize(w,h)}catch(error){console.warn('Không thể đổi kích thước GeoGebra:',error)}
 }
 const wrapper=host.querySelector('#ggbApplet, .applet_container');
 if(wrapper){wrapper.style.width='100%';wrapper.style.height='100%'}
 const frame=host.querySelector('iframe');
 if(frame){frame.style.width='100%';frame.style.height='100%';frame.style.maxWidth='none'}
}
function scheduleAppletResize(){
 cancelAnimationFrame(resizePending);
 resizePending=requestAnimationFrame(()=>{resizeApplet();setTimeout(resizeApplet,100);setTimeout(resizeApplet,380)})
}
function init(){window.QurioLayout?.mountHome();$$('.sidebar .nav-item').forEach(a=>a.classList.toggle('active',a.dataset.nav==='lab'));const side=$('#sidebar'),toggle=$('#sidebarToggle'),backdrop=$('#sidebarBackdrop');toggle?.addEventListener('click',()=>{side?.classList.toggle('is-open');if(backdrop)backdrop.hidden=!side?.classList.contains('is-open')});backdrop?.addEventListener('click',()=>{side?.classList.remove('is-open');backdrop.hidden=true});$('#profileToggle')?.addEventListener('click',()=>{const m=$('#profileMenu');if(m)m.hidden=!m.hidden});try{const stored=JSON.parse(localStorage.getItem(key)||'[]');goals=Array.isArray(stored)?stored:[]}catch{goals=[]}render();$('#mathAdd').onclick=()=>{$('#mathGoalForm').hidden=false;$('#mathAdd').hidden=true;$('#mathGoalText').focus()};$('#mathCancel').onclick=()=>{$('#mathGoalForm').hidden=true;$('#mathAdd').hidden=false};$('#mathGoalForm').onsubmit=e=>{e.preventDefault();const text=$('#mathGoalText').value.trim();if(!text)return;goals.push({text,done:false});persist();render();$('#mathGoalText').value='';$('#mathGoalForm').hidden=true;$('#mathAdd').hidden=false};$$('[data-tool]').forEach(b=>b.onclick=()=>tool(b.dataset.tool));tool(new URLSearchParams(location.search).get('tool')||'geometry');const editor=$('.math-editor'),fullButton=$('#mathFullscreen');
 fullButton.setAttribute('aria-label','Bật toàn màn hình GeoGebra');
 fullButton.onclick=async()=>{
  try{
   if(document.fullscreenElement===editor)await document.exitFullscreen();
   else if(!document.fullscreenElement)await editor.requestFullscreen();
   else {await document.exitFullscreen();await editor.requestFullscreen()}
  }catch(error){console.error('Lỗi bật toàn màn hình:',error);$('#mathStatus').textContent='Không thể bật toàn màn hình.'}
 };
 document.addEventListener('fullscreenchange',()=>{
  const active=document.fullscreenElement===editor;
  fullButton.textContent=active?'⤢ Thoát toàn màn hình':'⛶ Toàn màn hình';
  fullButton.setAttribute('aria-label',active?'Thoát toàn màn hình GeoGebra':'Bật toàn màn hình GeoGebra');
  scheduleAppletResize();
 });
 const ro=new ResizeObserver(scheduleAppletResize);
 ro.observe($('#mathApplet'));
 window.addEventListener('resize',scheduleAppletResize,{passive:true});$('#mathSave').onclick=()=>{try{if(!gg||!gg.getPNGBase64)throw Error('GeoGebra chưa sẵn sàng');const png=gg.getPNGBase64(1,false,72);if(!png)throw Error('Không xuất được hình');const a=document.createElement('a');a.href='data:image/png;base64,'+png;a.download='Qurio_'+current+'.png';a.click()}catch(e){$('#mathStatus').textContent=e.message}};const d=$('#mathCalcDialog'),frame=$('#mathdaFrame');$('#mathCalc').addEventListener('click',()=>{if(!frame.getAttribute('src'))frame.src='https://mathda.com/calculator/vi';if(!d.open)d.showModal()});$('#mathCalcClose').addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d)d.close()});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})();