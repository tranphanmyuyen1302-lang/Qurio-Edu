/* QURIO — SINGLE SHARED LAYOUT. Original Trang chủ is the design authority. */
(function(){'use strict';
const SOURCE={"header": "<header class=\"topbar\">\n<button aria-controls=\"sidebar\" aria-expanded=\"false\" aria-label=\"Mở menu\" class=\"icon-button mobile-menu\" id=\"sidebarToggle\" type=\"button\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-menu\"></use></svg>\n</button>\n<div class=\"search-wrap\">\n<form class=\"search-form\" id=\"searchForm\" role=\"search\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-search\"></use></svg>\n<input aria-autocomplete=\"list\" aria-controls=\"searchResults\" aria-expanded=\"false\" aria-label=\"Tìm kiếm\" autocomplete=\"off\" id=\"searchInput\" placeholder=\"Tìm môn học, bài học, mục tiêu…\" role=\"combobox\" type=\"search\"/>\n<kbd>/</kbd>\n</form>\n<div aria-label=\"Kết quả tìm kiếm\" class=\"search-results\" hidden=\"\" id=\"searchResults\" role=\"listbox\"></div>\n</div>\n<div class=\"topbar-actions\">\n<div class=\"notification-wrap\">\n<button aria-controls=\"notificationPopover\" aria-expanded=\"false\" aria-label=\"Xem thông báo\" class=\"icon-button bell-button\" id=\"notificationToggle\" type=\"button\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-bell\"></use></svg>\n<span class=\"notification-badge\" hidden=\"\" id=\"notificationBadge\"></span>\n</button>\n<div class=\"notification-popover\" hidden=\"\" id=\"notificationPopover\">\n<strong>Thông báo của bạn</strong>\n<p class=\"muted\">Chưa có thông báo.</p>\n</div>\n</div>\n<span class=\"topbar-separator\"></span>\n<div class=\"profile-wrap\">\n<button aria-controls=\"profileMenu\" aria-expanded=\"false\" class=\"profile-button\" id=\"profileToggle\" type=\"button\">\n<span class=\"profile-avatar\" id=\"profileAvatar\">Q</span>\n<span class=\"profile-copy\">\n<strong id=\"profileName\">Khách</strong>\n<small id=\"profileRole\">Chưa đăng nhập</small>\n</span>\n<svg aria-hidden=\"true\" class=\"icon profile-chevron\">\n<use href=\"#i-chevron\"></use>\n</svg>\n</button>\n<div class=\"profile-menu\" hidden=\"\" id=\"profileMenu\">\n<span class=\"eyebrow\">TÀI KHOẢN CỦA BẠN</span>\n<strong id=\"profileEmail\">Bạn chưa đăng nhập</strong>\n<p id=\"profileDescription\">\n              Đăng nhập để lưu tiến độ và mục tiêu của bạn.\n            </p>\n<a class=\"text-button\" href=\"../Đăng Nhập/dang-nhap.html\" id=\"profileLoginLink\">\n              Đăng nhập →\n            </a>\n</div>\n</div>\n</div>\n</header>", "sidebar": "<aside aria-label=\"Điều hướng chính\" class=\"sidebar\" id=\"sidebar\">\n<a aria-label=\"Qurio — Trang chủ\" class=\"brand\" href=\"trang-chu.html\">\n<img alt=\"\" height=\"46\" src=\"../img/Qurio-transparent.png\" width=\"46\"/>\n<span>Qurio<span class=\"brand-dot\">.</span></span>\n</a>\n<p class=\"brand-note\">Không gian học tập của bạn</p>\n<nav class=\"main-nav\">\n<a aria-current=\"page\" class=\"nav-item active\" data-nav=\"home\" href=\"#welcomeSection\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-home\"></use></svg>\n<span>Trang chủ</span>\n<span class=\"active-dot\"></span>\n</a>\n<p class=\"nav-heading\">HỌC TẬP</p>\n<a class=\"nav-item\" data-nav=\"learning\" href=\"page/hoc-tap.html\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-book\"></use></svg>\n<span>Khám phá môn học</span>\n</a>\n<a class=\"nav-item\" data-nav=\"roadmap\" href=\"page/lo-trinh-hoc.html\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-route\"></use></svg>\n<span>Lộ trình học</span>\n</a>\n<a class=\"nav-item\" data-nav=\"progress\" href=\"page/tien-do.html\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-chart\"></use></svg>\n<span>Tiến độ của tôi</span>\n</a>\n<p class=\"nav-heading\">KẾT NỐI</p>\n<a class=\"nav-item\" data-nav=\"teacher\" href=\"../page copy/Giáo Viên/giao-vien.html\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-teacher\"></use></svg>\n<span>Giáo viên</span>\n</a>\n<a class=\"nav-item\" data-nav=\"forum\" href=\"../page copy/Diễn Đàn/dien-dan.html\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-chat\"></use></svg>\n<span>Diễn đàn</span>\n</a>\n<p class=\"nav-heading\">CÔNG CỤ CỦA BẠN</p>\n\n<a class=\"nav-item\" data-nav=\"planner\" href=\"page/ke-hoach.html\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-calendar\"></use></svg>\n<span>Kế hoạch</span>\n</a>\n<a class=\"nav-item\" data-nav=\"challenge\" href=\"page/thu-thach.html\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-trophy\"></use></svg>\n<span>Thử thách</span>\n</a>\n<a class=\"nav-item\" data-nav=\"lab\" href=\"page/phong-lab.html\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-lab\"></use></svg>\n<span>Phòng Lab</span>\n</a>\n</nav>\n<div class=\"sidebar-bottom\">\n<div class=\"daily-note\">\n<span class=\"note-spark\">✦</span>\n<strong>Một chút mỗi ngày,<br/>một bước tiến mới.</strong>\n<p>Qurio luôn ở đây, cùng bạn.</p>\n</div>\n<button class=\"logout-button\" id=\"logoutButton\" type=\"button\">\n<svg aria-hidden=\"true\" class=\"icon\"><use href=\"#i-exit\"></use></svg>\n        Đăng nhập\n      </button>\n<p class=\"sidebar-footer\">QURIO · STAY CURIOUS</p>\n</div>\n</aside>", "footer": "<footer aria-label=\"Chân trang Qurio\" class=\"qurio-footer\">\n<div class=\"qurio-footer-top\">\n<!-- Giới thiệu -->\n<div class=\"qurio-footer-intro\">\n<a class=\"qurio-footer-brand\" href=\"trang-chu.html\">\n<img alt=\"\" height=\"54\" loading=\"lazy\" src=\"../img/Qurio-transparent.png\" width=\"50\"/>\n<span>\n          Qurio<span class=\"qurio-footer-dot\">.</span>\n</span>\n</a>\n<p class=\"qurio-footer-tagline\">\n        MỖI NGÀY MỘT BƯỚC TIẾN\n      </p>\n<p class=\"qurio-footer-description\">\n        Một góc học tập để bạn hiểu bài rõ hơn, giữ nhịp học đều\n        và nhìn thấy tiến bộ của mình.\n      </p>\n</div>\n<!-- Nội dung hữu ích -->\n<section aria-labelledby=\"footerStudyTitle\">\n<h2 id=\"footerStudyTitle\">Học hiệu quả hơn</h2>\n<ul class=\"qurio-footer-tips\">\n<li>Đặt một mục tiêu nhỏ trước khi học.</li>\n<li>Tự kiểm tra lại sau mỗi bài.</li>\n<li>Ôn lại kiến thức vào ngày hôm sau.</li>\n</ul>\n</section>\n<!-- Liên hệ -->\n<section aria-labelledby=\"footerContactTitle\" class=\"qurio-footer-contact\">\n<h2 id=\"footerContactTitle\">Kết nối với Qurio</h2>\n<p>\n        Theo dõi cập nhật và chia sẻ góp ý qua các kênh của Qurio.\n      </p>\n<div aria-label=\"Mạng xã hội của Qurio\" class=\"qurio-footer-socials\" role=\"group\">\n<!-- Facebook -->\n<a aria-label=\"Qurio trên Facebook\" data-social=\"facebook\" href=\"https://www.facebook.com/profile.php?id=61596880343783\" rel=\"noopener noreferrer\" target=\"_blank\" title=\"Facebook Qurio\">\n<svg aria-hidden=\"true\" focusable=\"false\" viewbox=\"0 0 24 24\">\n<path d=\"M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z\"></path>\n</svg>\n</a>\n<!-- TikTok -->\n<a aria-label=\"Qurio trên TikTok\" data-social=\"tiktok\" href=\"https://www.tiktok.com/@qurioedu\" rel=\"noopener noreferrer\" target=\"_blank\" title=\"TikTok Qurio\">\n<svg aria-hidden=\"true\" focusable=\"false\" viewbox=\"0 0 24 24\">\n<path d=\"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z\"></path>\n</svg>\n</a>\n<!-- Zalo -->\n<a aria-label=\"Liên hệ Qurio qua Zalo\" data-social=\"zalo\" href=\"https://zalo.me/0847713025\" rel=\"noopener noreferrer\" target=\"_blank\" title=\"Zalo Qurio\">\n<svg aria-hidden=\"true\" height=\"26\" viewbox=\"0 0 24 24\" width=\"26\">\n<text fill=\"#e2e8f0\" font-family=\"Arial, sans-serif\" font-size=\"10.5\" font-weight=\"900\" letter-spacing=\"-0.7\" style=\"fill:#e2e8f0 !important;\" text-anchor=\"middle\" x=\"12\" y=\"15.5\">\n      Zalo\n    </text>\n</svg>\n</a>\n<!-- YouTube -->\n<a aria-label=\"Qurio trên YouTube\" data-social=\"youtube\" href=\"https://www.youtube.com/@QurioEdu\" rel=\"noopener noreferrer\" target=\"_blank\" title=\"YouTube Qurio\">\n<svg aria-hidden=\"true\" focusable=\"false\" viewbox=\"0 0 24 24\">\n<path d=\"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z\"></path>\n</svg>\n</a>\n<!-- Email -->\n<a aria-disabled=\"true\" aria-label=\"Liên hệ Qurio qua Email\" data-social=\"email\" role=\"link\" title=\"Email Qurio: chưa thiết lập địa chỉ\">\n<svg aria-hidden=\"true\" height=\"22\" style=\"fill:none !important;\n           stroke:currentColor !important;\n           stroke-width:1.8;\n           stroke-linecap:round;\n           stroke-linejoin:round;\" viewbox=\"0 0 24 24\" width=\"22\">\n<rect height=\"16\" rx=\"3\" width=\"20\" x=\"2\" y=\"4\"></rect>\n<path d=\"M3 6l9 7 9-7\"></path>\n</svg>\n</a>\n</div>\n</section>\n</div>\n<div class=\"qurio-footer-bottom\">\n<p>\n      © <span data-footer-year=\"\">2026</span> Qurio.\n      Học hôm nay · Kiến tạo ngày mai.\n    </p>\n<nav aria-label=\"Điều khoản và quyền riêng tư\" class=\"qurio-footer-legal\">\n<a href=\"../PhapLy/dieu-khoan-su-dung.html\">Điều khoản sử dụng</a>\n<a href=\"../PhapLy/chinh-sach-bao-mat.html\">Chính sách bảo mật</a>\n</nav>\n</div>\n</footer>"};
const base=new URL('../',document.currentScript.src);
const homeBase=new URL('Trang Chủ/',base);
const paths={home:'Trang Chủ/trang-chu.html',teacher:'page/Giáo Viên/giao-vien.html',login:'Đăng Nhập/dang-nhap.html'};
const navPaths={home:paths.home,learning:'page/Khám Phá/kham-pha.html',roadmap:'page/Lộ Trình Học Tập/lo-trinh-hoc-tap.html',progress:'page/Tiến Độ/tien-do.html',teacher:paths.teacher,forum:'page/Diễn Đàn/dien-dan.html',ai:'page/Gia Sư AI/gia-su.html',planner:'page/Kế Hoạch/ke-hoach.html',challenge:'page/Thử Thách/thu-thach.html',lab:'page/Phòng Lab/phong-lab.html'};
const pageTitles={'giao-vien':'Không gian giáo viên','quan-ly-lop-hoc':'Quản lý lớp học','tao-de-kiem-tra':'Tạo đề kiểm tra','giao-bai':'Giao bài','ngan-hang-cau-hoi':'Ngân hàng câu hỏi','ket-qua-hoc-sinh':'Kết quả học sinh','phan-tich-loi-sai':'Phân tích lỗi sai','lo-trinh-hoc-tap':'Lộ trình học tập','ke-hoach-giang-day':'Kế hoạch giảng dạy','bao-cao-thong-minh':'Báo cáo thông minh'};
const searchIds={'giao-vien':'search','quan-ly-lop-hoc':'globalClassSearch','tao-de-kiem-tra':'teacherTopSearch'};
const profileLegacy=['giao-vien','quan-ly-lop-hoc','tao-de-kiem-tra','giao-bai'];
const node=html=>{const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild;};
function resolveLinks(el){
 el.querySelectorAll('[href],[src]').forEach(n=>{
  for(const a of ['href','src']){
   const val=n.getAttribute(a);if(!val||val.startsWith('#')||/^(data:|https?:|mailto:|tel:|javascript:)/i.test(val))continue;
   n.setAttribute(a,new URL(val,homeBase).href);
  }
 });
}
function template(type){const n=node(SOURCE[type]);resolveLinks(n);if(type==='sidebar')n.querySelectorAll('[data-nav]').forEach(a=>{if(navPaths[a.dataset.nav])a.href=new URL(navPaths[a.dataset.nav],base).href});return n;}
function replaceMount(id,element){const m=document.getElementById(id);if(m)m.replaceWith(element);}
function mountHome(){
 replaceMount('qurio-header-mount',template('header'));
 replaceMount('qurio-sidebar-mount',template('sidebar'));
 replaceMount('qurio-footer-mount',template('footer'));
}
function mountTeacher(){
 const app=document.querySelector('.app'),main=app?.querySelector(':scope > .main');if(!app||!main)return;
 const page=location.pathname.split('/').pop().replace(/\.html$/,'');
 const aside=template('sidebar');aside.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav==='teacher');if(a.dataset.nav==='teacher')a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 const teacherLink=aside.querySelector('[data-nav="teacher"]');if(teacherLink)teacherLink.href=new URL(paths.teacher,base).href;
 const loginButton=aside.querySelector('#logoutButton');loginButton?.addEventListener('click',()=>location.assign(new URL(paths.login,base).href));
 app.insertBefore(aside,main);
 const head=template('header');head.classList.add('qurio-original-header');
 const search=head.querySelector('#searchInput');if(search){search.id=searchIds[page]||'topSearch';search.placeholder='Tìm kiếm trong Qurio...';}
 const searchForm=head.querySelector('#searchForm');if(searchForm)searchForm.addEventListener('submit',e=>e.preventDefault());
 const profileId=profileLegacy.includes(page)?'teacherProfileTrigger':'profileTrigger';
 const menuId=profileLegacy.includes(page)?'teacherProfileMenu':'profileMenu';
 const profile=head.querySelector('#profileToggle');if(profile){profile.id=profileId;profile.setAttribute('aria-controls',menuId);}
 const menu=head.querySelector('#profileMenu');if(menu){menu.id=menuId;menu.classList.add('hidden');menu.innerHTML='<div class="qurio-menu-head"><strong id="teacherMenuName">Giáo viên Qurio</strong><small id="teacherMenuEmail">Không gian giáo viên</small></div><button type="button" id="teacherViewProfile">Thông tin cá nhân</button><button type="button" id="teacherEditProfile">Chỉnh sửa hồ sơ</button><button type="button" id="teacherSubscription">Gói dịch vụ</button><button type="button" id="teacherProfileLogout">Đăng xuất</button>';}
 const avatar=head.querySelector('#profileAvatar');if(avatar){avatar.id='teacherAvatar';avatar.textContent='Q';}
 const name=head.querySelector('#profileName');if(name){name.id=page==='quan-ly-lop-hoc'?'teacherName':'teacherHeaderName';name.textContent='Khách';}
 const role=head.querySelector('#profileRole');if(role){role.id='teacherHeaderSubtitle';role.textContent='Chưa đăng nhập';}
 const bell=head.querySelector('#notificationToggle');if(bell)bell.id=page==='giao-vien'?'teacherNotification':'notificationBtn';
 head.querySelector('#notificationPopover')?.remove();
 const notif=head.querySelector('.notification-wrap');if(notif){notif.querySelector('button')?.addEventListener('click',()=>{const old=document.getElementById('qurioTeacherNotification');if(old){old.remove();return}const msg=document.createElement('div');msg.id='qurioTeacherNotification';msg.className='notification-popover';msg.textContent='Chưa có thông báo mới.';notif.append(msg);setTimeout(()=>msg.remove(),3000)});}
 const toggle=head.querySelector('#sidebarToggle'),backdrop=document.getElementById('sidebarBackdrop')||document.createElement('button');
 if(!backdrop.id){backdrop.id='sidebarBackdrop';backdrop.type='button';backdrop.hidden=true;backdrop.className='teacher-sidebar-backdrop';backdrop.setAttribute('aria-label','Đóng menu');app.insertBefore(backdrop,aside)}
 const setOpen=open=>{aside.classList.toggle('is-open',open);backdrop.hidden=!open;document.body.classList.toggle('teacher-menu-open',open);toggle?.setAttribute('aria-expanded',String(open))};
 toggle?.addEventListener('click',e=>{e.stopImmediatePropagation();setOpen(!aside.classList.contains('is-open'))},true);
 backdrop.addEventListener('click',e=>{e.stopImmediatePropagation();setOpen(false)},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
 // Dashboard retains its own profile actions; subpages receive matching IDs and a working menu.
 const openMenu=open=>{if(!menu||!profile)return;menu.hidden=!open;menu.classList.toggle('hidden',!open);profile.setAttribute('aria-expanded',String(open))};
 profile?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openMenu(menu.hidden)},true);
 document.addEventListener('click',e=>{if(!e.target.closest('.profile-wrap'))openMenu(false)});
 if(page!=='giao-vien'){
  for(const id of ['teacherViewProfile','teacherEditProfile','teacherSubscription'])menu.querySelector('#'+id)?.addEventListener('click',()=>location.assign(new URL(paths.teacher,base).href));
  menu.querySelector('#teacherProfileLogout')?.addEventListener('click',()=>location.assign(new URL(paths.login,base).href));
 }
 // Keep IDs for legacy page scripts and do not remove their own functional content.
 main.insertBefore(head,main.firstChild);
 if(page!=='giao-vien'){
  const content=main.querySelector(':scope > main')||main;
  // Remove all legacy breadcrumbs, including differently named ones on individual pages.
  content.querySelectorAll('.crumb,.breadcrumbs,.breadcrumb,.as-crumb,.road-crumb,.qb-crumb,.smart-crumb,.teaching-crumb,.cm-crumb,.error-crumb,.qurio-shared-breadcrumb,[aria-label="Breadcrumb"],[aria-label="Đường dẫn"]').forEach(n=>n.remove());
  // Keep only one breadcrumb even when a page previously used a custom class.
  [...content.querySelectorAll('div,nav')].filter(n=>{
    if(n.closest('.qurio-shared-breadcrumb'))return false;
    if(n.children.length>5 || n.querySelector('section,article,form,table'))return false;
    const t=n.textContent.replace(/\s+/g,' ').trim();
    return /^Giáo viên\s*[\/›>]\s*[^\n]{2,65}$/.test(t);
  }).forEach(n=>n.remove());
  const crumb=document.createElement('nav');crumb.className='qurio-shared-breadcrumb';crumb.setAttribute('aria-label','Đường dẫn');
  const a=document.createElement('a');a.href=new URL(paths.teacher,base).href;a.textContent='Giáo viên';a.id=page==='quan-ly-lop-hoc'?'teacherBackDashboard':'backTeacher';const s=document.createElement('span');s.textContent='/';const b=document.createElement('strong');b.textContent=pageTitles[page]||'Chức năng';crumb.append(a,s,b);content.insertBefore(crumb,content.firstChild);
 }
 app.insertAdjacentElement('afterend',template('footer'));
 // The layout is mounted before deferred chung.js loads: verify AFTER DOMContentLoaded.
 async function syncHeaderFromVerifiedAccount(){
  if(typeof window.QurioAuth?.me !== 'function') return;
  try{
   const u=await window.QurioAuth.me();
   if(!u || !u.id) return;
   const n=String(u.fullName || u.username || u.name || 'Người dùng');
   const r=(u.role==='teacher' || u.role==='GV')?'Giáo viên':'Học sinh';
   const initials=n.trim().split(/\s+/).slice(-2).map(x=>x[0]||'').join('').toUpperCase() || 'Q';
   if(name) name.textContent=n;
   if(role) role.textContent=r;
   if(avatar) avatar.textContent=initials;
   const menuName=document.getElementById('teacherMenuName');
   if(menuName) menuName.textContent=n;
   const menuEmail=document.getElementById('teacherMenuEmail');
   if(menuEmail) menuEmail.textContent=String(u.email||'');
  }catch(err){
   // Keep guest state if the server rejects the session; never forge a username.
   console.info('Qurio: chưa xác thực được phiên trên trang này:',err?.message||err);
  }
 }
 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',syncHeaderFromVerifiedAccount,{once:true});
 }else{syncHeaderFromVerifiedAccount();}
 window.addEventListener('pageshow',e=>{if(e.persisted)syncHeaderFromVerifiedAccount();});
}
window.QurioLayout={mountHome,mountTeacher};
})();