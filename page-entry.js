(() => {
  'use strict';
  const page=document.body.dataset.page;
  const titles={teacher:'Giáo viên',explore:'Khám phá môn học',lab:'Phòng Lab',roadmap:'Lộ trình học',progress:'Tiến độ của tôi',planner:'Kế hoạch',challenge:'Thử thách',ai:'Gia sư AI'};
  const root=window.QurioUI.mount({active:page,title:titles[page]});
  Promise.resolve().then(()=>page==='teacher'?window.QurioTeacher.render(root):window.QurioLearning.render(page,root)).catch(error=>{root.replaceChildren();const p=document.createElement('p');p.className='q-alert';p.textContent='Chưa mở được trang: '+error.message;root.append(p);});
})();
