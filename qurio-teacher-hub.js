/* Qurio Teacher Hub frontend: local-first + authenticated Google Sheets sync */
(()=>{'use strict';
const kinds=new Set(['question','lessonPlan','learningPath']);
const waitAuth=()=>new Promise((resolve,reject)=>{
  let tries=0;
  const test=()=>{
    if(window.QurioAuth?.request)return resolve(window.QurioAuth);
    if(++tries>45)return reject(Error('Chưa tải được QurioAuth. Vui lòng đăng nhập lại.'));
    setTimeout(test,120);
  };test();
});
const call=async(operation,data={})=>{
  const auth=await waitAuth();
  return auth.request('teacherHub',{operation,...data});
};
let summaryPromise=null,summaryAt=0;
function loadSummary(force=false){
  if(!force && summaryPromise && Date.now()-summaryAt<60000)return summaryPromise;
  summaryAt=Date.now();
  summaryPromise=call('summary').catch(err=>{summaryPromise=null;throw err});
  return summaryPromise;
}
function info(message,failed=false){
  let el=document.getElementById('qth-sync-status');
  if(!el){el=document.createElement('div');el.id='qth-sync-status';el.setAttribute('role','status');el.style.cssText='position:fixed;right:18px;bottom:18px;z-index:2000;max-width:320px;padding:9px 14px;border:1px solid #ddd2f9;border-radius:12px;background:white;color:#6045a6;font:600 11px system-ui,sans-serif;box-shadow:0 6px 20px #22144418;pointer-events:none';document.body.appendChild(el);}
  el.textContent=message;el.style.color=failed?'#b32635':'#6045a6';
}
function bindCollection({kind,getLocal,setLocal,storageKey}){
  if(!kinds.has(kind))throw Error('Unsupported collection: '+kind);
  let base=new Map(),ready=false,dirty=false,busy=false,timer=null;
  const snapshot=()=>Array.isArray(getLocal())?getLocal():[];
  const asMap=arr=>new Map(arr.filter(x=>x && typeof x==='object'&&x.id).map(x=>[String(x.id),JSON.stringify(x)]));
  async function send(){
    if(!ready||busy)return;
    const now=snapshot(), current=asMap(now);
    const items=now.filter(x=>base.get(String(x.id))!==JSON.stringify(x));
    const deleteIds=[...base.keys()].filter(id=>!current.has(id));
    if(!items.length&&!deleteIds.length){dirty=false;return}
    if(items.length>120||deleteIds.length>120){info('Có quá nhiều thay đổi; hãy chia nhỏ thao tác đồng bộ.',true);return}
    busy=true;let succeeded=false;
    try {
      await call('collectionWrite',{kind,items,deleteIds});
      // Only the confirmed delta becomes the new server baseline.
      for(const id of deleteIds)base.delete(id);
      for(const item of items)base.set(String(item.id),JSON.stringify(item));
      dirty=false;succeeded=true;info('✓ Đã đồng bộ Google Sheets');
      try{localStorage.setItem('qurio_hub_migrated_'+kind,'1')}catch(_){}
    }catch(e){dirty=true;info('Chưa đồng bộ: '+(e.message||'Kiểm tra kết nối'),true)}
    finally{busy=false;const next=asMap(snapshot());if(succeeded && ([...next].some(([id,x])=>base.get(id)!==x)||[...base.keys()].some(id=>!next.has(id)))){schedule()}}
  }
  function schedule(){dirty=true;if(!ready)return;clearTimeout(timer);timer=setTimeout(send,850)}
  async function init(){
    try {
      const result=await call('collectionGet',{kind});
      const remote=Array.isArray(result.items)?result.items:[];
      base=asMap(remote);
      const wasDirty=dirty;
      const local=snapshot();
      const migrated=localStorage.getItem('qurio_hub_migrated_'+kind)==='1';
      if(!wasDirty && remote.length){setLocal(remote);try{localStorage.setItem(storageKey,JSON.stringify(remote))}catch(_){} }
      else if(!wasDirty && !remote.length && migrated){setLocal([]);try{localStorage.setItem(storageKey,'[]')}catch(_){} }
      ready=true;
      if(wasDirty||(!remote.length && local.length && !migrated))schedule();
      else info('✓ Dữ liệu giáo viên đã kết nối');
    }catch(e){info('Đang lưu trên máy: '+(e.message||'Không kết nối API'),true)}
  }
  // Scripts on these pages finish before chung.js initializes QurioAuth.
  if(document.readyState==='complete')setTimeout(init,0);
  else window.addEventListener('load',init,{once:true});
  return {changed:schedule,refresh:init};
}
window.QurioTeacherHub={loadSummary,bindCollection,info};
})();
