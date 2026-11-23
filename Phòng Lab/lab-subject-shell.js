/* Shared Qurio shell for individual Lab subject pages. */
(function(){
  'use strict';
  function initialize(){
    if(!window.QurioLayout || typeof window.QurioLayout.mountHome!=='function')return;
    window.QurioLayout.mountHome();
    const sidebar=document.getElementById('sidebar');
    const toggle=document.getElementById('sidebarToggle');
    const backdrop=document.getElementById('sidebarBackdrop');
    document.querySelectorAll('.sidebar .nav-item').forEach(a=>{
      const active=a.dataset.nav==='lab';
      a.classList.toggle('active',active);
      if(active)a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    function openMenu(open){
      sidebar?.classList.toggle('is-open',open);
      if(backdrop)backdrop.hidden=!open;
      toggle?.setAttribute('aria-expanded',String(open));
    }
    toggle?.addEventListener('click',()=>openMenu(!sidebar?.classList.contains('is-open')));
    backdrop?.addEventListener('click',()=>openMenu(false));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')openMenu(false)});
    const profile=document.getElementById('profileToggle');
    const menu=document.getElementById('profileMenu');
    profile?.addEventListener('click',e=>{e.stopPropagation();if(menu)menu.hidden=!menu.hidden});
    document.addEventListener('click',e=>{if(menu&&!e.target.closest('.profile-wrap'))menu.hidden=true});
    document.getElementById('profileLoginLink')?.setAttribute('href',window.QurioRoute?.url('login')||'../../Đăng Nhập/dang-nhap.html');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
  else initialize();
})();
