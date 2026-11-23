/* Qurio Forum — local-first prototype.
   Posts are stored only in this browser. Replace storage layer with authenticated
   Apps Script backend before deploying as a shared multi-user forum. */
(()=>{'use strict';
const KEY='qurio_forum_posts_v1',MAX_POSTS=200;
const $=(s,root=document)=>root.querySelector(s),$$=(s,root=document)=>[...root.querySelectorAll(s)];
let posts=[],filter='all',topic='',imageData='',imagePending=false;
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'p'+Date.now()+'_'+Math.random().toString(36).slice(2);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=message=>{const el=$('#toast');el.textContent=message;el.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.display='none',3000)};
function load(){try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');posts=Array.isArray(raw)?raw.filter(p=>p&&typeof p.id==='string'&&typeof p.title==='string').slice(0,MAX_POSTS):[]}catch{posts=[]}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(posts));return true}catch{toast('Không thể lưu bài viết. Hãy thử hình nhỏ hơn hoặc kiểm tra dung lượng trình duyệt.');return false}}
function openDialog(){$('#postForm').reset();imageData='';imagePending=false;$('#imagePreview').replaceChildren();$('#formError').textContent='';$('#postDialog').showModal();$('#postTitle').focus()}
function closeDialog(){$('#postDialog').close()}
function currentQuery(){return ($('#searchInput')?.value||'').trim().toLocaleLowerCase('vi')}
function render(){
 let list=posts.slice(),q=currentQuery();
 if(filter==='mine')list=list.filter(p=>p.mine);
 if(filter==='saved')list=list.filter(p=>p.saved);
 if(topic)list=list.filter(p=>p.category===topic);
 if(q)list=list.filter(p=>[p.title,p.body,p.category].some(v=>String(v).toLocaleLowerCase('vi').includes(q)));
 const sort=$('#sortPosts').value;
 list.sort((a,b)=>sort==='popular'?(Number(b.likes||0)+Number(b.comments?.length||0))-(Number(a.likes||0)+Number(a.comments?.length||0)):sort==='old'?a.created-b.created:b.created-a.created);
 const filters=$('#activeFilters');filters.hidden=!topic;
 filters.innerHTML=topic?`<button type="button" id="clearTopic"># ${safe(topic)} ×</button>`:'';
 $('#clearTopic')?.addEventListener('click',()=>{topic='';$$('.topic-tab').forEach(b=>b.classList.remove('selected'));render()});
 $$('.feed-tab').forEach(b=>b.classList.toggle('active',b.dataset.filter===filter));
 const trending=$('#trendingTopics');if(trending){trending.replaceChildren();['Toán học','Tin học','Ngoại ngữ','Kinh nghiệm học tập','Hỏi đáp'].forEach(name=>{const n=posts.filter(p=>p.category===name).length;const btn=document.createElement('button');btn.type='button';btn.className='trending-item';const label=document.createElement('span');label.textContent='# '+name.replaceAll(' ','_');const count=document.createElement('small');count.textContent=n+' bài viết';btn.append(label,count);btn.addEventListener('click',()=>{topic=name;filter='all';render()});trending.append(btn)})}
 const target=$('#postList');target.replaceChildren();
 if(!list.length){
 const empty=document.createElement('div');empty.className='empty-feed';
 empty.innerHTML=`<div class="empty-symbol">✧</div><h3>${posts.length?'Không tìm thấy bài viết phù hợp':'Cùng bắt đầu cuộc trò chuyện đầu tiên!'}</h3><p>${posts.length?'Hãy thử một từ khóa hoặc chủ đề khác.':'Chia sẻ câu hỏi, kiến thức hay trải nghiệm học tập của bạn với cộng đồng.'}</p><button type="button" class="primary-btn">+ Tạo bài viết</button>`;
 empty.querySelector('button').addEventListener('click',openDialog);target.append(empty);return;
 }
 list.forEach(p=>{
 const card=document.createElement('article');card.className='post-card';card.dataset.id=p.id;
 const date=new Date(p.created);const formatted=Number.isFinite(date.getTime())?date.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
 card.innerHTML=`<div class="post-top"><span class="user-avatar">Q</span><div class="post-author"><strong>${safe(p.author||'Thành viên Qurio')}</strong><small>${formatted} · Bài viết cộng đồng</small></div><span class="post-category">${safe(p.category)}</span></div><h3>${safe(p.title)}</h3><p class="post-text">${safe(p.body)}</p>${p.image&&/^data:image\/(?:png|jpeg|webp);base64,/.test(p.image)?`<img class="post-photo" src="${p.image}" alt="Ảnh đính kèm bài viết">`:''}<div class="post-actions"><button type="button" data-action="like" class="${p.liked?'active':''}">♥ ${Number(p.likes)||0} Thích</button><button type="button" data-action="comment">♧ ${p.comments?.length||0} Bình luận</button><button type="button" data-action="save" class="${p.saved?'active':''}">${p.saved?'★ Đã lưu':'☆ Lưu bài'}</button>${p.mine?'<button type="button" data-action="delete">⋯ Xóa</button>':''}</div><div class="comments" hidden></div>`;
 card.addEventListener('click',e=>{const btn=e.target.closest('button[data-action]');if(!btn)return;const action=btn.dataset.action;
 if(action==='like'){p.liked=!p.liked;p.likes=Math.max(0,(Number(p.likes)||0)+(p.liked?1:-1));save();render()}
 if(action==='save'){p.saved=!p.saved;save();render();toast(p.saved?'Đã lưu bài viết':'Đã bỏ lưu')}
 if(action==='delete'){if(confirm('Bạn muốn xóa bài viết này?')){posts=posts.filter(x=>x.id!==p.id);save();render();toast('Đã xóa bài viết')}}
 if(action==='comment'){const panel=$('.comments',card);panel.hidden=!panel.hidden;if(!panel.hidden)drawComments(panel,p)}
 });
 target.append(card);
 });
}
function drawComments(panel,p){
 panel.replaceChildren();
 (p.comments||[]).forEach(c=>{const div=document.createElement('div');div.className='comment';const strong=document.createElement('strong');strong.textContent=c.author||'Thành viên Qurio';const body=document.createElement('span');body.textContent=c.text;div.append(strong,body);panel.append(div)});
 const form=document.createElement('form');form.className='comment-form';form.innerHTML='<input maxlength="800" required aria-label="Viết bình luận" placeholder="Viết bình luận của bạn..."><button type="submit">Gửi</button>';
 form.addEventListener('submit',e=>{e.preventDefault();const input=$('input',form),text=input.value.trim();if(!text)return;p.comments=Array.isArray(p.comments)?p.comments:[];p.comments.push({author:'Bạn',text});if(save())render()});
 panel.append(form);$('input',form).focus();
}
function setupHeader(){
 const sidebar=$('#qurio-sidebar-mount .sidebar'),toggle=$('#sidebarToggle'),backdrop=$('#sidebarBackdrop');
 $$('#qurio-sidebar-mount .nav-item').forEach(a=>{const active=a.dataset.nav==='forum';a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 function setOpen(open){sidebar?.classList.toggle('is-open',open);backdrop.hidden=!open;toggle?.setAttribute('aria-expanded',String(open));document.body.style.overflow=open?'hidden':''}
 toggle?.addEventListener('click',()=>setOpen(!sidebar?.classList.contains('is-open')));
 backdrop.addEventListener('click',()=>setOpen(false));
 const profile=$('#profileToggle'),menu=$('#profileMenu');profile?.addEventListener('click',e=>{e.stopPropagation();menu.hidden=!menu.hidden;profile.setAttribute('aria-expanded',String(!menu.hidden))});
 document.addEventListener('click',e=>{if(menu&&!e.target.closest('.profile-wrap'))menu.hidden=true});
 $('#profileLoginLink')?.setAttribute('href',window.QurioRoute?.url('login')||'../../Đăng Nhập/dang-nhap.html');
 $('#logoutButton')?.addEventListener('click',()=>location.assign(window.QurioRoute?.url('login')||'../../Đăng Nhập/dang-nhap.html'));
 const search=$('#searchInput');search.placeholder='Tìm bài viết, chủ đề...';search.addEventListener('input',render);
 $('#searchForm')?.addEventListener('submit',e=>{e.preventDefault();render();$('#feed').scrollIntoView({behavior:'smooth'})});
 const bell=$('#notificationToggle'),popover=$('#notificationPopover');bell?.addEventListener('click',()=>{popover.hidden=!popover.hidden});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
}
function init(){
 if(!window.QurioLayout){document.body.insertAdjacentHTML('afterbegin','<p style="padding:20px">Không tải được giao diện chung Qurio. Kiểm tra thư mục Chung.</p>');return}
 window.QurioLayout.mountHome();
 setupHeader();load();render();
 ['#heroPost','#composerOpen','#composerButton','#rightPost'].forEach(s=>$(s)?.addEventListener('click',openDialog));
 ['#closeDialog','#cancelDialog'].forEach(s=>$(s).addEventListener('click',closeDialog));
 $('#postDialog').addEventListener('click',e=>{if(e.target===$('#postDialog'))closeDialog()});
 $$('.feed-tab').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;render()}));
 $$('.topic-tab').forEach(b=>b.addEventListener('click',()=>{topic=topic===b.dataset.topic?'':b.dataset.topic;$$('.topic-tab').forEach(x=>x.classList.toggle('selected',x.dataset.topic===topic));filter='all';render()}));
 $('#sortPosts').addEventListener('change',render);
 $$('.story-card[data-story],.suggested-topic[data-topic]').forEach(b=>b.addEventListener('click',()=>{topic=b.dataset.story||b.dataset.topic;filter='all';render();$('#postList').scrollIntoView({behavior:'smooth',block:'start'})}));
 $('#seeTopics')?.addEventListener('click',()=>{topic='';filter='all';render();$('#postList').scrollIntoView({behavior:'smooth'})});
 $('#composerImage')?.addEventListener('click',()=>{openDialog();$('#postImage').click()});
 $('#composerDocument')?.addEventListener('click',()=>{openDialog();toast('Bạn có thể thêm liên kết tài liệu trong nội dung bài viết.')});
 $('#composerPoll')?.addEventListener('click',()=>{openDialog();$('#postCategory').value='Hỏi đáp';$('#postTitle').placeholder='Bạn muốn cộng đồng bình chọn điều gì?'});
 $('#composerQuestion')?.addEventListener('click',()=>{openDialog();$('#postCategory').value='Hỏi đáp'});
 
 $('#postImage').addEventListener('change',async e=>{
 const file=e.target.files[0];imageData='';$('#imagePreview').replaceChildren();$('#formError').textContent='';
 if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>1024*1024){$('#formError').textContent='Vui lòng chọn ảnh JPG, PNG hoặc WEBP dưới 1 MB.';e.target.value='';return}
 imagePending=true;
 try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});imageData=data;const img=document.createElement('img');img.src=data;img.alt='Ảnh xem trước';$('#imagePreview').append(img)}catch{$('#formError').textContent='Không đọc được ảnh.'}finally{imagePending=false}
 });
 $('#postForm').addEventListener('submit',e=>{
 e.preventDefault();const title=$('#postTitle').value.trim(),body=$('#postBody').value.trim();
 if(title.length<3||body.length<5){$('#formError').textContent='Vui lòng nhập tiêu đề ít nhất 3 ký tự và nội dung ít nhất 5 ký tự.';return}
 if(imagePending){$('#formError').textContent='Đang xử lý ảnh, vui lòng thử lại.';return}
 const post={id:uid(),author:'Bạn',title,body,category:$('#postCategory').value,image:imageData,created:Date.now(),mine:true,liked:false,likes:0,saved:false,comments:[]};
 posts.unshift(post);posts=posts.slice(0,MAX_POSTS);
 if(!save()){posts.shift();return}
 filter='all';topic='';$('#searchInput').value='';closeDialog();render();toast('Đã đăng bài viết!');$('#feed').scrollIntoView({behavior:'smooth'});
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
