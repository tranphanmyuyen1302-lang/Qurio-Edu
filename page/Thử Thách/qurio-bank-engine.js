/* Qurio Adaptive Question Bank V6 | local-first, privacy-conscious.
   This is a learning-practice heuristic, not a validated psychometric assessment. */
(() => {
  'use strict';
  const VERSION='v6.1', DAY=86400000;
  const base=[...(window.QURIO_CHALLENGE_BANK||[]),...(window.QURIO_EXTRA_BANK||[])];
  const remote=new Map();
  const memory={};
  const listeners=[];
  function currentIdentity(){
    // Use only a verified account returned by QurioAccountUI; never trust a localStorage username.
    const user=window.QurioAccountUI?.user;
    return user&&user.id?'user:'+String(user.id).slice(0,120):'guest';
  }
  function storageKey(){return 'qurio_learning_bank_v6_'+currentIdentity();}
  function load(){
    const key=storageKey();if(memory[key])return memory[key];
    let value;try{value=JSON.parse(localStorage.getItem(key)||'null');}catch{}
    if(!value||typeof value!=='object')value={};
    if(!value.records||typeof value.records!=='object'||Array.isArray(value.records))value.records={};
    if(!Array.isArray(value.sessions))value.sessions=[];
    if(!Array.isArray(value.recent))value.recent=[];
    value.version=VERSION;
    return memory[key]=value;
  }
  function save(){const key=storageKey();const data=load();try{localStorage.setItem(key,JSON.stringify(data));}catch(e){console.warn('Qurio: không lưu được tiến độ tại trình duyệt này',e);}}
  function valid(q){
    if(!q||typeof q!=='object'||typeof q.id!=='string'||!/^[-\w]{3,100}$/.test(q.id))return false;
    if(typeof q.group!=='string'||!/^[-\w]{2,48}$/.test(q.group)||typeof q.q!=='string'||q.q.trim().length<4||q.q.length>320)return false;
    if(!Array.isArray(q.a)||q.a.length<3||q.a.length>4||!q.a.every(a=>typeof a==='string'&&a.trim()&&a.length<=160))return false;
    if(!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.a.length)return false;
    if(new Set(q.a.map(x=>x.trim().toLowerCase())).size!==q.a.length)return false;
    return true;
  }
  const baseMap=new Map(base.filter(valid).map(q=>[q.id,q]));
  function all(){return [...baseMap.values(),...remote.values()].filter(valid);}
  const shuffle = list=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function getStats(){
    const records=Object.values(load().records);
    return {questions:all().length,remote:remote.size,seen:records.filter(r=>r.attempts>0).length,
      due:records.filter(r=>r.attempts>0&&r.due<=Date.now()).length,
      needsReview:records.filter(r=>r.wrong>0&&r.mastery<0.70).length,
      accuracy:records.length?Math.round(records.reduce((s,r)=>s+r.correct,0)/Math.max(1,records.reduce((s,r)=>s+r.attempts,0))*100):null};
  }
  function record(question,correct,{mode='game'}={}){
    if(!question?.id)return;
    const data=load(),now=Date.now();
    const p=data.records[question.id]||(data.records[question.id]={attempts:0,correct:0,wrong:0,mastery:0,streak:0,lastSeen:0,due:0,group:question.group});
    p.attempts=Math.min(9999,p.attempts+1);p.correct+=correct?1:0;p.wrong+=correct?0:1;
    p.streak=correct?Math.min(20,p.streak+1):0;
    // Transparent, conservative spaced-practice heuristic.
    p.mastery=Math.min(1,Math.max(0,Number(p.mastery||0)+(correct?0.17:-0.26)));
    p.lastSeen=now;p.group=question.group;
    const interval=correct?([0,1,2,4,7,14,30][Math.min(p.streak,6)]||30)*DAY:10*60*1000;
    p.due=now+interval;
    data.recent.unshift({id:question.id,correct:!!correct,mode,time:now});data.recent=data.recent.slice(0,280);
    // Limit local footprint to 5,000 question records, dropping oldest unimportant data if ever necessary.
    const keys=Object.keys(data.records);if(keys.length>5000){keys.sort((a,b)=>data.records[a].lastSeen-data.records[b].lastSeen);keys.slice(0,keys.length-5000).forEach(k=>delete data.records[k]);}
    save();notify();
  }
  function numericDifficulty(q){return Math.max(1,Math.min(3,Number(q.level)||1));}
  function choose({challenge,mode,limit=8,wrongIds=[]}={}){
    const data=load(),records=data.records;
    let pool=all();
    if(challenge?.kind==='subject')pool=pool.filter(q=>q.group===challenge.id);
    if(challenge?.kind==='review'){
      const ids=new Set([...wrongIds,...Object.keys(records).filter(id=>records[id].wrong>0&&records[id].mastery<0.70)]);
      pool=pool.filter(q=>ids.has(q.id));
      // If not enough mistakes yet, offer appropriate fresh practice instead of empty gameplay.
      if(pool.length<Math.min(4,limit))pool=[...pool,...all().filter(q=>!ids.has(q.id))];
    }
    if(mode==='sentence')pool=pool.filter(q=>q.group==='english-grammar'&&q.q.includes('___')&&Boolean(q.a[q.correct]));
    if(mode==='decode')pool=pool.filter(q=>{const answer=String(q.a[q.correct]||'').trim();return answer.length>=2&&answer.length<=22&&Array.from(answer.replace(/\s+/g,'')).length>=2;});
    const today=Date.now();
    let target=2;
    if(challenge?.kind==='adaptive'){
      const progress=Object.values(records).filter(x=>x.attempts>=1);
      const avg=progress.length?progress.reduce((s,x)=>s+x.mastery,0)/progress.length:0;
      target=avg<0.4?1:avg<0.7?2:3;
    }
    // Prefer unseen, then previously missed and due for review, penalize too-recent repeats.
    const ranked=shuffle(pool).map(q=>{
      const p=records[q.id];const never=!p;
      let score=never?120:0;
      if(p){
        const age=today-(p.lastSeen||0);
        score+=p.due<=today?55:0;
        score+=p.wrong>0?(1-p.mastery)*35:0;
        if(challenge?.kind==='review'&&p.wrong>0&&p.mastery<0.7)score+=450;
        if(challenge?.kind!=='review'&&age<2*60*60*1000)score-=180;
        else if(challenge?.kind!=='review'&&age<DAY)score-=115;
        else if(challenge?.kind!=='review'&&age<7*DAY)score-=50;
        else if(challenge?.kind!=='review'&&age<21*DAY)score-=12;
      }
      if(challenge?.kind==='review'&&p?.wrong>0&&p.mastery<0.70)score+=220;
      if(challenge?.kind==='adaptive')score-=Math.abs(numericDifficulty(q)-target)*16;
      return {q,score};
    }).sort((a,b)=>b.score-a.score);
    // For matching games, correct answers within the same batch must be distinct.
    const unique=mode==='match'||mode==='memory';
    const chosen=[],batches=new Set();
    for(const {q} of ranked){
      if(unique){const ans=q.a[q.correct].trim().toLocaleLowerCase();if(batches.has(ans))continue;batches.add(ans);}
      chosen.push(q);if(chosen.length>=limit)break;
    }
    return {items:chosen,unseen:chosen.filter(x=>!records[x.id]).length,bankSize:pool.length,source:remote.size?'Cộng đồng + Google Sheets':'Ngân hàng Qurio offline'};
  }
  function finishSession({mode,challengeId,points,correct,mistakes}){
    const data=load();data.sessions.unshift({mode:String(mode),challengeId:String(challengeId),points:Number(points)||0,correct:Number(correct)||0,mistakes:Number(mistakes)||0,time:Date.now()});data.sessions=data.sessions.slice(0,90);save();notify();
  }
  function onChange(cb){if(typeof cb==='function')listeners.push(cb);}
  function notify(){for(const cb of listeners)try{cb(getStats());}catch{}}
  function receive(payload){
    if(!payload||payload.ok!==true||!Array.isArray(payload.questions))return;
    remote.clear();let n=0;
    for(const item of payload.questions.slice(0,4000)){
      if(!valid(item))continue;
      // An existing local question is authoritative until the next reviewed bundle version.
      if(!baseMap.has(item.id))remote.set(item.id,item);
      n++;
    }
    notify();return n;
  }
  // Only public, read-only, APPROVED questions are allowed from Sheets. No API secret in browser.
  // Apps Script ContentService can redirect; JSONP avoids CORS and is restricted to this known script URL.
  function loadPublished(timeout=4500){
    const url=String(window.QURIO_QUESTION_BANK_API_URL||'').trim();
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec(?:\?.*)?$/.test(url))return Promise.resolve({ok:false,reason:'Chưa cấu hình Google Sheets; dùng dữ liệu offline'});
    return new Promise(resolve=>{
      let finished=false;const callback='QurioPublishedBank_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script');const timer=setTimeout(()=>done(false,'Kết nối quá thời gian'),timeout);
      function done(ok,message){if(finished)return;finished=true;clearTimeout(timer);delete window[callback];script.remove();resolve({ok,message,added:remote.size});}
      window[callback]=data=>{if(!data?.ok)return done(false,'Endpoint chưa sẵn sàng');receive(data);done(true,'Đã cập nhật ngân hàng đã duyệt');};
      script.onerror=()=>done(false,'Không truy cập được Google Sheets');
      const target=new URL(url);target.searchParams.set('action','published');target.searchParams.set('callback',callback);target.searchParams.set('_',String(Date.now()));script.src=target.href;document.head.append(script);
    });
  }
  window.QurioBankEngine={VERSION,valid,all,getStats,record,choose,finishSession,onChange,loadPublished,receive,profile:currentIdentity};
})();
