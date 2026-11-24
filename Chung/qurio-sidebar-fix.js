/* Qurio routing and active page - works on GitHub Pages custom domain and localhost. */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script) return;
  const root = new URL('../', script.src);
  const routes = {
    home:'Trang Chủ/trang-chu.html',
    learning:'page/Khám Phá/kham-pha.html', explore:'page/Khám Phá/kham-pha.html',
    roadmap:'page/Lộ Trình Học Tập/lo-trinh-hoc-tap.html',
    progress:'page/Tiến Độ/tien-do.html',
    teacher:'page/Giáo Viên/giao-vien.html', teachers:'page/Giáo Viên/giao-vien.html',
    forum:'page/Diễn Đàn/dien-dan.html',
    planner:'page/Kế Hoạch/ke-hoach.html',
    challenge:'page/Thử Thách/thu-thach.html',
    lab:'page/Phòng Lab/phong-lab.html',
    ai:'page/Gia Sư AI/gia-su.html'
  };
  const norm = p => { try { return decodeURIComponent(p).toLocaleLowerCase('vi'); } catch { return p.toLowerCase(); } };
  const current = norm(location.pathname);
  const target = k => norm(new URL(routes[k], root).pathname);
  const matching = {
    'giáo viên':'teacher', 'phòng lab':'lab', 'thử thách':'challenge',
    'lộ trình học tập':'roadmap', 'tiến độ':'progress',
    'khám phá':'learning', 'kế hoạch':'planner', 'diễn đàn':'forum', 'gia sư ai':'ai'
  };
  const activeKey = (() => {
    if (current === norm(root.pathname) || current === norm(new URL('index.html',root).pathname)) return 'home';
    for (const k of Object.keys(routes)) if (current === target(k)) return k;
    for (const [folder,key] of Object.entries(matching)) if(current.includes('/page/'+folder+'/')) return key;
    return null;
  })();
  const canonical = key => key === 'teachers' ? 'teacher' : key === 'explore' ? 'learning' : key;
  const select = '#sidebar a[data-nav], .sidebar a[data-nav], .q-sidebar a[data-qnav], #sidebar a[data-qnav]';
  function sync() {
    document.querySelectorAll(select).forEach(a => {
      const raw = a.getAttribute('data-nav') || a.getAttribute('data-qnav');
      const key = canonical(raw);
      if (!routes[key]) return;
      const expected = new URL(routes[key], root).href;
      if(a.href !== expected) a.href = expected;
      const active = key === canonical(activeKey);
      a.classList.toggle('active',active);
      a.classList.toggle('qurio-current-page',active);
      if(active) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('#sidebar a.brand[href], .sidebar a.brand[href], .q-sidebar a.q-brand[href]').forEach(a=>{
      a.href = new URL(routes.home, root).href;
    });
  }
  const style = document.createElement('style');
  style.textContent = `
  #sidebar a.qurio-current-page[data-nav],.sidebar a.qurio-current-page[data-nav],
  #sidebar a.qurio-current-page[data-qnav],.q-sidebar a.qurio-current-page[data-qnav]{
    background:#eee8ff!important;color:#6745e8!important;border-radius:14px!important;
    font-weight:700!important;box-shadow:none!important;
  }
  #sidebar a.qurio-current-page svg,.sidebar a.qurio-current-page svg,
  .q-sidebar a.qurio-current-page svg,.qurio-current-page i{color:#6745e8!important;stroke:#6745e8!important}
  #sidebar a.active:not(.qurio-current-page),.sidebar a.active:not(.qurio-current-page),
  .q-sidebar a.active:not(.qurio-current-page){background:transparent!important;box-shadow:none!important;color:inherit}
  `;
  (document.head || document.documentElement).appendChild(style);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
  // Shared layouts insert their nav dynamically. Debounce child additions only.
  let scheduled = false;
  const observer = new MutationObserver(records => {
    if (!records.some(r => r.addedNodes.length)) return;
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(()=>{scheduled=false;sync();});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',sync);
})();
