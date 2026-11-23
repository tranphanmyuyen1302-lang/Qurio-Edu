(()=>{'use strict';
const base='https://phet.colorado.edu/sims/html/';
const items=[
 {group:'Cấu tạo nguyên tử và liên kết',name:'Xây dựng nguyên tử',slug:'build-an-atom',desc:'Thêm proton, neutron và electron'},
 {group:'Cấu tạo nguyên tử và liên kết',name:'Hình dạng phân tử',slug:'molecule-shapes',desc:'Khám phá mô hình hình học phân tử'},
 {group:'Cấu tạo nguyên tử và liên kết',name:'Độ phân cực phân tử',slug:'molecule-polarity',desc:'Khảo sát độ phân cực và liên kết'},
 {group:'Pin điện, điện phân và kim loại',name:'Pin điện hóa Zn–Cu',local:'cell',desc:'Mô hình pin Daniell do Qurio xây dựng'},
 {group:'Pin điện, điện phân và kim loại',name:'Điện phân đồng',local:'faraday',desc:'Điều chỉnh dòng điện, thời gian và tính lượng Cu'},
 {group:'Cân bằng hóa học và pH',name:'Dung dịch axit – bazơ',slug:'acid-base-solutions',desc:'So sánh axit, bazơ mạnh và yếu'},
 {group:'Cân bằng hóa học và pH',name:'Thang pH',slug:'ph-scale',desc:'Thay đổi nồng độ và đo pH'},
 {group:'Cân bằng hóa học và pH',name:'Nồng độ dung dịch',slug:'concentration',desc:'Khảo sát sự thay đổi nồng độ'},
 {group:'Cân bằng hóa học và pH',name:'Chuyển dịch cân bằng',local:'shift',desc:'Mô hình Le Chatelier do Qurio xây dựng'}
];
const $=id=>document.getElementById(id);const localPanel=$('chemLocalWorkbench');const menu=$('chemEmbedMenu'),frame=$('chemEmbedFrame'),view=$('chemEmbedView'),offline=$('chemEmbedOffline');if(!menu||!frame)return;
let current=0;let lastGroup='';
items.forEach((item,i)=>{if(item.group!==lastGroup){const h=document.createElement('div');h.className='group-title';h.textContent=item.group;menu.append(h);lastGroup=item.group;}const b=document.createElement('button');b.type='button';b.textContent=item.name;b.dataset.index=i;b.addEventListener('click',()=>choose(i));menu.append(b)});
function choose(i){current=i;const item=items[i];menu.querySelectorAll('button').forEach(b=>b.classList.toggle('active',Number(b.dataset.index)===i));$('chemEmbedName').textContent=item.name;$('chemEmbedDesc').textContent=item.desc;const external=$('chemEmbedExternal');if(item.slug){const url=base+item.slug+'/latest/'+item.slug+'_en.html';frame.hidden=false;offline.hidden=true;if(localPanel)localPanel.hidden=true;if(frame.src!==url)frame.src=url;external.hidden=false;external.href=url;}else{frame.hidden=true;frame.removeAttribute('src');offline.hidden=true;if(localPanel)localPanel.hidden=false;external.hidden=true;const topic=item.local==='shift'?'equilibrium':'electro';document.querySelector('[data-topic="'+topic+'"]')?.click();document.querySelector('[data-exp="'+item.local+'"]')?.click();}}
$('chemEmbedReload').addEventListener('click',()=>{if(items[current].slug){const src=frame.src;frame.src='about:blank';requestAnimationFrame(()=>frame.src=src)}else{document.getElementById('chemReset')?.click()}});
$('chemEmbedFull').addEventListener('click',async()=>{try{if(document.fullscreenElement){await document.exitFullscreen()}else{await view.requestFullscreen()}}catch(err){alert('Trình duyệt không cho phép chế độ toàn màn hình. Hãy mở mô phỏng ở trang nguồn.')}});
document.addEventListener('fullscreenchange',()=>{$('chemEmbedFull').textContent=document.fullscreenElement?'⤢ Thoát toàn màn hình':'⛶ Toàn màn hình'});
const first={atom:0,electro:3,equilibrium:5};document.querySelectorAll('.chem-topic').forEach(b=>b.addEventListener('click',()=>{const idx=first[b.dataset.topic];if(idx!==undefined&&items[current].group!==items[idx].group)choose(idx)}));
const params=new URLSearchParams(location.search);const target=params.get('topic');choose(first[target]??0);
})();