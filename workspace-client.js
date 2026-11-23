(() => {
  'use strict';
  const empty={user:null,classes:[],students:[],questions:[],exams:[],assignments:[],results:[],plans:[],completedLessons:[],goals:[],labNotes:[],challengeAttempts:[]};
  let data={...empty},error='',queue=Promise.resolve();
  function apply(result){if(!result?.ok||!result.user?.id||Object.keys(empty).filter(k=>k!=='user').some(k=>!Array.isArray(result[k])))throw Error('Dữ liệu chưa đầy đủ. Hãy kiểm tra Workspace.gs và bản triển khai.');if(data.user?.id&&data.user.id!==result.user.id)throw Error('Tài khoản đã thay đổi. Bạn hãy tải lại trang.');data=result;error='';window.QurioUI?.setUser(result.user);window.dispatchEvent(new CustomEvent('qurio:workspace',{detail:result}));return result;}
  async function refresh(){try{const user=await window.QurioUI.auth;data.user=user;return apply(await window.QurioAuth.request('workspace',{op:'bootstrap'}));}catch(e){error=e.message||'Không tải được dữ liệu.';return null;}}
  function request(op,payload={}){const task=async()=>{if(!window.QurioAuth?.request)throw Error('Chưa tải được Chung/chung.js.');const result=await window.QurioAuth.request('workspace',{...payload,op});return op==='assignmentGet'?result:apply(result);};const next=queue.then(task,task);queue=next.catch(()=>{});return next;}
  window.QurioWorkspace={get data(){return data;},get error(){return error;},request,refresh,ready:refresh()};
})();
