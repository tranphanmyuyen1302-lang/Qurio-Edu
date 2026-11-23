/* Qurio Speaking Studio – camera WebRTC P2P, subtitles opt-in, optional backend AI. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const escape = text => String(text ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const qs = new URLSearchParams(location.search);
const get = (key,fallback='',max=220) => (qs.get(key)||fallback).slice(0,max);
const lang = get('language','en-US',12);
const topic = get('topic','School life',110);
const prompt = get('prompt','What do you enjoy most about school? Ask your partner two questions.',420);
const mode = get('mode','conversation',30);
const languages={'en-US':'🇬🇧 Tiếng Anh','zh-CN':'🇨🇳 Tiếng Trung','ja-JP':'🇯🇵 Tiếng Nhật','ko-KR':'🇰🇷 Tiếng Hàn','fr-FR':'🇫🇷 Tiếng Pháp','es-ES':'🇪🇸 Tiếng Tây Ban Nha','de-DE':'🇩🇪 Tiếng Đức'};
const modeNames={conversation:'💬 Trò chuyện',debate:'⚖️ Tranh biện',roleplay:'🎭 Đóng vai',interview:'🎤 Phỏng vấn',story:'📖 Kể chuyện',problem:'🤝 Giải quyết vấn đề'};
$('topicChip').textContent=topic;$('roomTopic').textContent=topic;$('roomPrompt').textContent=prompt;
$('roomLanguage').textContent=languages[lang]||languages['en-US'];$('roomMode').textContent=modeNames[mode]||modeNames.conversation;
let localStream=null, pc=null, channel=null, remoteConsentCaption=false, remoteConsentAi=false;
let recognition=null, captionsWanted=false, timer=null, callStart=0, aiAuthorizedForSession=false;
const lines=[];
function label(){return $('myRole').value;}
function other(){return label()==='A'?'B':'A';}
function notice(text,good=false){$('signalStatus').textContent=text;$('signalStatus').className=good?'muted success-note':'muted';}
function cameraStatus(text){$('mediaMessage').textContent=text;}
function updateNames(){ $('localLetter').textContent=label();$('remoteLetter').textContent=other();$('remoteFallback').querySelector('.avatar').textContent=other();$('localFallback').querySelector('.avatar').textContent=label(); }
$('myRole').onchange=()=>{if(pc){notice('Hãy kết thúc cuộc gọi trước khi đổi vai.');$('myRole').value=pc.__qurioRole;return;}updateNames();};updateNames();
function timeTick(){if(!callStart)return;const s=Math.floor((Date.now()-callStart)/1000);$('callTime').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function startClock(){if(timer)return;callStart=Date.now();timer=setInterval(timeTick,1000);}
function stopClock(){clearInterval(timer);timer=null;callStart=0;$('callTime').textContent='00:00';}
function isConnected(){return channel?.readyState==='open';}
function send(payload){if(isConnected())channel.send(JSON.stringify(payload));}
function updateStatus(){
 const connected=isConnected();
 if(connected) aiAuthorizedForSession=remoteConsentAi && $('consentAi').checked;
 else if(!$('consentAi').checked) aiAuthorizedForSession=false;$('callStatus').classList.toggle('connected',connected);
 $('callStatus').innerHTML=connected?'<span class="pulse"></span> Đã kết nối':'<span class="pulse"></span> Chưa kết nối';
 $('peerMediaStatus').textContent=connected?'Đang kết nối hình ảnh':'Chưa kết nối';
 $('peerConsentStatus').textContent=connected?(remoteConsentCaption?'Bạn học đồng ý phiên âm.':'Bạn học chưa đồng ý phiên âm.'): 'Cần kết nối để biết sự đồng ý của bạn học.';
 $('peerAiStatus').textContent=connected?(remoteConsentAi?'Bạn học đồng ý gửi bản phiên âm cho AI.':'Bạn học chưa đồng ý gửi dữ liệu cho AI.'): 'Cần kết nối để xác nhận với bạn học.';
 $('startCaption').disabled=!canTranscribe() || captionsWanted;
 $('stopCaption').disabled=!captionsWanted;
 $('transcriptionStatus').textContent=captionsWanted?'● Đang tạo phụ đề':canTranscribe()?'Sẵn sàng':'Chờ đồng ý';
}
function canTranscribe(){return isConnected() && $('consentCaption').checked && remoteConsentCaption;}
async function openMedia(){
 if(localStream){return localStream;}
 if(!navigator.mediaDevices?.getUserMedia){cameraStatus('Trình duyệt cần HTTPS hoặc localhost để bật camera/mic.');throw new Error('Yêu cầu HTTPS hoặc localhost.');}
 try{
  localStream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:1280},height:{ideal:720}},audio:{echoCancellation:true,noiseSuppression:true}});
  $('localVideo').srcObject=localStream;$('localVideo').parentElement.classList.add('on');$('myMediaStatus').textContent='Mic & camera đã bật';
  $('startCamera').textContent='✅ Camera đã sẵn sàng';$('startCamera').disabled=true;
  $('toggleMic').disabled=false;$('toggleCam').disabled=false;
  cameraStatus('Camera và mic đang bật trên thiết bị của bạn. Hình ảnh chỉ được truyền cho bạn học sau khi kết nối WebRTC.');
  if(pc){for(const track of localStream.getTracks())if(!pc.getSenders().some(s=>s.track?.kind===track.kind))pc.addTrack(track,localStream);}
  return localStream;
 }catch(err){
  cameraStatus('Không mở được camera/mic: '+(err.name==='NotAllowedError'?'Bạn chưa cấp quyền truy cập.':err.message));throw err;
 }
}
$('startCamera').onclick=()=>openMedia().catch(()=>{});
$('toggleMic').onclick=()=>{if(!localStream)return;const t=localStream.getAudioTracks()[0];if(!t)return;t.enabled=!t.enabled;$('toggleMic').textContent=t.enabled?'🎤 Tắt mic':'🔇 Bật mic';if(!t.enabled)stopCaptions();};
$('toggleCam').onclick=()=>{if(!localStream)return;const t=localStream.getVideoTracks()[0];if(!t)return;t.enabled=!t.enabled;$('toggleCam').textContent=t.enabled?'🎥 Tắt camera':'📷 Bật camera';$('localVideo').parentElement.classList.toggle('on',t.enabled);};
function closePeer(){stopCaptions();if(channel){try{channel.close();}catch{}}channel=null;if(pc){try{pc.close();}catch{}}pc=null;remoteConsentCaption=false;remoteConsentAi=false;$('remoteVideo').srcObject=null;$('remoteVideo').parentElement.classList.remove('on');stopClock();updateStatus();}
$('hangUp').onclick=()=>{send({type:'leave'});closePeer();if(localStream){localStream.getTracks().forEach(x=>x.stop());localStream=null;$('localVideo').srcObject=null;$('localVideo').parentElement.classList.remove('on');}$('startCamera').disabled=false;$('startCamera').textContent='📷 Bật camera & mic';$('toggleMic').disabled=true;$('toggleCam').disabled=true;$('toggleMic').textContent='🎤 Tắt mic';$('toggleCam').textContent='🎥 Tắt camera';notice('Đã kết thúc cuộc gọi. Phụ đề còn hiển thị trên thiết bị này cho đến khi bạn xóa hoặc rời trang.');};
function setupChannel(ch){
 channel=ch;
 ch.onopen=()=>{notice('Kết nối WebRTC đã thiết lập. Hãy xác nhận quyền phiên âm ở cả hai thiết bị.',true);startClock();send({type:'consent',caption:$('consentCaption').checked,ai:$('consentAi').checked});updateStatus();};
 ch.onclose=()=>{remoteConsentCaption=false;remoteConsentAi=false;stopCaptions();updateStatus();notice('Kênh dữ liệu đã đóng. Có thể cần kết nối lại.');};
 ch.onmessage=event=>{
  let p;try{p=JSON.parse(event.data);}catch{return;}if(!p||typeof p!=='object')return;
  if(p.type==='consent'){
   remoteConsentCaption=p.caption===true;remoteConsentAi=p.ai===true;
   if(!canTranscribe())stopCaptions();updateStatus();
  }
  if(p.type==='line'&&typeof p.text==='string'&&p.text.trim()&&p.text.length<=350&&p.who===other()&&canTranscribe())addLine(p.who,p.text,false);
  if(p.type==='delete'){lines.length=0;aiAuthorizedForSession=false;renderLines();}
  if(p.type==='leave'){notice('Bạn học đã rời phòng.');closePeer();}
 };
}
function createPeer(){
 if(pc)return pc;
 pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});pc.__qurioRole=label();
 pc.ontrack=e=>{const stream=e.streams[0] || new MediaStream([e.track]);$('remoteVideo').srcObject=stream;$('remoteVideo').parentElement.classList.add('on');$('peerMediaStatus').textContent='Đang trong cuộc gọi';};
 pc.onconnectionstatechange=()=>{if(['failed','disconnected'].includes(pc?.connectionState)){notice('Kết nối gặp sự cố. Kiểm tra mạng và thử lại. Một số mạng cần máy chủ TURN.');}};
 pc.ondatachannel=e=>setupChannel(e.channel);
 if(localStream)for(const track of localStream.getTracks())pc.addTrack(track,localStream);
 return pc;
}
function iceComplete(peer){
 if(peer.iceGatheringState==='complete')return Promise.resolve();
 return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{peer.removeEventListener('icegatheringstatechange',check);reject(new Error('Hết thời gian tạo mã kết nối; hãy thử lại.'));},18000);
 function check(){if(peer.iceGatheringState==='complete'){clearTimeout(timeout);peer.removeEventListener('icegatheringstatechange',check);resolve();}}
 peer.addEventListener('icegatheringstatechange',check);check();});
}
function signalText(){const src=$('signalIn').value.trim();if(src.length>50000)throw new Error('Mã mời quá dài.');const obj=JSON.parse(src);if(obj?.type!=='offer'&&obj?.type!=='answer')throw new Error('Mã kết nối không hợp lệ.');if(typeof obj.sdp!=='string'||obj.sdp.length>45000)throw new Error('Nội dung mã không hợp lệ.');return obj;}
async function codeAction(fn){try{await fn();}catch(e){notice('Chưa thực hiện được: '+e.message);}}
$('createOffer').onclick=()=>codeAction(async()=>{
 if(label()!=='A'){$('myRole').value='A';updateNames();}
 if(!localStream)throw new Error('Bật camera & mic trước khi tạo lời mời.');
 aiAuthorizedForSession=false;lines.length=0;renderLines();closePeer();const p=createPeer();setupChannel(p.createDataChannel('qurio-captions'));
 const offer=await p.createOffer();await p.setLocalDescription(offer);notice('Đang tạo mã mời...');await iceComplete(p);
 $('signalOut').value=JSON.stringify(p.localDescription);notice('Mã mời đã sẵn sàng. Gửi riêng mã này cho bạn học B.',true);
});
$('makeAnswer').onclick=()=>codeAction(async()=>{
 if(label()!=='B'){$('myRole').value='B';updateNames();}
 if(!localStream)throw new Error('Bật camera & mic trước khi tham gia.');
 const offer=signalText();if(offer.type!=='offer')throw new Error('Đây không phải mã mời của A.');
 aiAuthorizedForSession=false;lines.length=0;renderLines();closePeer();const p=createPeer();await p.setRemoteDescription(offer);const answer=await p.createAnswer();await p.setLocalDescription(answer);notice('Đang tạo mã phản hồi...');await iceComplete(p);
 $('signalOut').value=JSON.stringify(p.localDescription);notice('Mã trả lời đã sẵn sàng. Gửi riêng mã này lại cho A.',true);
});
$('finishConnect').onclick=()=>codeAction(async()=>{
 if(label()!=='A'||!pc||pc.signalingState!=='have-local-offer')throw new Error('A phải tạo mã lời mời trước.');
 const answer=signalText();if(answer.type!=='answer')throw new Error('Đây không phải mã phản hồi của B.');
 await pc.setRemoteDescription(answer);notice('Đã nhận phản hồi, đang kết nối hai thiết bị...',true);
});
$('copySignal').onclick=async()=>{const s=$('signalOut').value;if(!s){notice('Hãy tạo mã của bạn trước.');return;}try{await navigator.clipboard.writeText(s);notice('Đã sao chép mã. Gửi riêng cho bạn học, không đăng công khai.',true);}catch{ $('signalOut').focus();$('signalOut').select();notice('Không sao chép tự động được. Hãy nhấn Ctrl + C để sao chép mã.'); }};
function notifyConsent(){if(!$('consentAi').checked)aiAuthorizedForSession=false;send({type:'consent',caption:$('consentCaption').checked,ai:$('consentAi').checked});if(!canTranscribe())stopCaptions();updateStatus();}
$('consentCaption').onchange=notifyConsent;$('consentAi').onchange=notifyConsent;
function renderLines(){
 const feed=$('transcriptFeed');if(!lines.length){feed.innerHTML='<div class="blank-message"><span>💬</span><strong>Chưa có phụ đề</strong><p>Bật nhận dạng giọng nói hoặc nhập câu thoại sau khi cả hai đồng ý.</p></div>';return;}
 feed.innerHTML=lines.slice(-90).map(l=>`<div class="chat-line ${l.who===label()?'mine':'peer'}"><div class="chat-avatar">${l.who}</div><div class="chat-bubble"><strong>Học sinh ${l.who}</strong><small>${escape(l.time)}</small><p>${escape(l.text)}</p></div></div>`).join('');feed.scrollTop=feed.scrollHeight;
}
function addLine(who,text,transmit=true){const clean=String(text).trim().slice(0,350);if(!clean)return;if(!canTranscribe())return;lines.push({who,text:clean,time:new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})});if(lines.length>300)lines.shift();renderLines();if(transmit)send({type:'line',who,text:clean});}
function stopCaptions(){captionsWanted=false;if(recognition){const r=recognition;recognition=null;try{r.stop();}catch{}}updateStatus();}
$('startCaption').onclick=()=>{
 if(!canTranscribe()){cameraStatus('Cần cả hai học sinh xác nhận đồng ý tạo phụ đề và kết nối trước.');return;}
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){cameraStatus('Trình duyệt này không hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome có hỗ trợ hoặc nhập câu thủ công.');return;}
 if(!localStream?.getAudioTracks()[0]?.enabled){cameraStatus('Vui lòng bật mic của bạn.');return;}
 captionsWanted=true;
 function startNew(){
  if(!captionsWanted||!canTranscribe())return;
  const r=new SR();recognition=r;r.lang=lang;r.continuous=true;r.interimResults=false;r.maxAlternatives=1;
  r.onresult=event=>{for(let i=event.resultIndex;i<event.results.length;i++)if(event.results[i].isFinal)addLine(label(),event.results[i][0].transcript,true);};
  r.onerror=e=>{cameraStatus('Phiên âm tạm dừng: '+e.error);if(['not-allowed','audio-capture','service-not-allowed'].includes(e.error))stopCaptions();};
  r.onend=()=>{if(recognition!==r)return;recognition=null;if(captionsWanted&&canTranscribe())setTimeout(startNew,350);};
  try{r.start();cameraStatus('Đang tạo phụ đề từ mic của bạn. Bạn học sẽ nhận phụ đề qua kết nối đã đồng ý.');}catch(e){stopCaptions();cameraStatus('Không thể bật phiên âm: '+e.message);}
 }
 startNew();updateStatus();
};
$('stopCaption').onclick=stopCaptions;
$('sendManual').onclick=()=>{if(!canTranscribe()){cameraStatus('Cần hai bạn cùng đồng ý phiên âm trước khi gửi câu thoại.');return;}const input=$('manualText');if(input.value.trim()){addLine(label(),input.value,true);input.value='';}};
$('manualText').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('sendManual').click();}});
$('clearCaptions').onclick=()=>{if(!confirm('Xóa phụ đề ở cả hai thiết bị trong phiên này?'))return;lines.length=0;aiAuthorizedForSession=false;renderLines();send({type:'delete'});$('analysisOutput').innerHTML='<div class="empty-review">Bản hội thoại đã được xóa.</div>';};
function reportDemo(){
 const data={A:[],B:[]};
 const patterns=[
  {pattern:/\b(he|she|it)\s+(go|do|have|like|want|play|study)\b/i,fix:s=>s.replace(/\b(he|she|it)\s+(go|do|have|like|want|play|study)\b/gi,(_,p,v)=>p+' '+({go:'goes',do:'does',have:'has',like:'likes',want:'wants',play:'plays',study:'studies'}[v.toLowerCase()]||v)),why:'Kiểm tra chia động từ cho chủ ngữ ngôi thứ ba số ít.'},
  {pattern:/\bI very like\b/i,fix:s=>s.replace(/\bI very like\b/ig,'I really like'),why:'Để nhấn mạnh mức độ thích, có thể dùng “really like”.'},
  {pattern:/\bI am agree\b/i,fix:s=>s.replace(/\bI am agree\b/ig,'I agree'),why:'Agree thường dùng làm động từ, không cần am.'},
  {pattern:/\bI have (\d+) years old\b/i,fix:s=>s.replace(/\bI have (\d+) years old\b/ig,'I am $1 years old'),why:'Khi nói tuổi dùng “I am ... years old”.'}
 ];
 if(lang==='en-US')for(const l of lines){for(const r of patterns){if(r.pattern.test(l.text))data[l.who].push({original:l.text,suggested:r.fix(l.text),reason:r.why});}}
 return {summary:'Gợi ý minh họa dựa trên một số quy tắc ngữ pháp tiếng Anh. Không phải AI và không đánh giá phát âm.',speakers:data,mode:'demo'};
}
function renderReport(result){
 const root=$('analysisOutput');const ai=result.mode==='ai';
 root.innerHTML=`<span class="analysis-label ${ai?'':'demo'}">${ai?'✦ AI Woku · Phân tích văn bản':'⚠ Bộ quy tắc minh họa · Chưa kết nối AI'}</span><p class="aside-help">${escape(result.summary||'')}</p>`;
 for(const who of ['A','B']){
  const part=document.createElement('section');part.className='report-speaker';
  const item=result.speakers?.[who];const errors=Array.isArray(item)?item:Array.isArray(item?.errors)?item.errors:[];
  const strengths=Array.isArray(item?.strengths)?item.strengths:[];
  part.innerHTML=`<h3>👤 Học sinh ${who}</h3>${strengths.length?`<p>Điểm tích cực: ${escape(strengths.join(' · '))}</p>`:''}${errors.length?errors.slice(0,8).map(e=>`<div class="mistake"><strong>${escape(e.category||'Gợi ý sửa lỗi')}</strong><p>Đã nói: ${escape(e.original||'')}</p><p class="improved">Gợi ý: ${escape(e.suggested||e.improved||'')}</p><p>${escape(e.reason||e.explanation||'')}</p></div>`).join(''):'<p>Chưa phát hiện mẫu lỗi có thể kết luận từ phụ đề hiện có. Điều này không đồng nghĩa với nói hoàn toàn đúng.</p>'}`;
  if(Array.isArray(item?.practice)&&item.practice.length)part.innerHTML+=`<p>🎯 Luyện tập: ${escape(item.practice.join(' · '))}</p>`;
  root.append(part);
 }
 const note=document.createElement('p');note.className='muted';note.textContent='Chỉ phân tích bản phiên âm, không xác định được phát âm chuẩn/sai từ chữ viết. Nhận dạng giọng nói và AI đều có thể nhầm; học sinh và giáo viên nên kiểm tra lại.';root.append(note);
}
$('runReview').onclick=async()=>{
 if(!lines.length){$('analysisOutput').innerHTML='<p class="error-note">Chưa có lời thoại. Hãy bật phiên âm hoặc nhập câu nói trước khi phân tích.</p>';return;}
 const endpoint=String(window.QURIO_SPEAKING_CONFIG?.analysisEndpoint||'').trim();
 if(!endpoint){renderReport(reportDemo());return;}
 if(!aiAuthorizedForSession||!$('consentAi').checked){$('analysisOutput').innerHTML='<p class="error-note">Muốn gửi hội thoại cho AI, hai bạn cần đồng ý gửi bản phiên âm cho AI trong phiên gọi. Bạn có thể dùng bản kiểm tra minh họa bằng cách chưa cấu hình API.</p>';return;}
 $('runReview').disabled=true;$('runReview').textContent='⏳ Đang phân tích…';
 try{
  const url=new URL(endpoint);if(url.protocol!=='https:')throw Error('Backend phải dùng HTTPS.');
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:lang,topic,lines:lines.map(({who,text})=>({who,text}))})});
  const parsed=await response.json();if(!response.ok)throw Error(parsed.error||`Máy chủ trả lỗi ${response.status}`);
  if(!parsed.speakers||!parsed.summary)throw Error('Định dạng báo cáo từ AI không hợp lệ.');
  renderReport({...parsed,mode:'ai'});
 }catch(e){$('analysisOutput').innerHTML='<p class="error-note">Chưa phân tích bằng AI được: '+escape(e.message)+'. Bạn có thể thử lại khi backend sẵn sàng.</p>';}
 finally{$('runReview').disabled=false;$('runReview').textContent='✨ Phân tích hội thoại';}
};
window.addEventListener('pagehide',()=>{stopCaptions();if(pc)pc.close();if(localStream)localStream.getTracks().forEach(t=>t.stop());clearInterval(timer);});
updateStatus();
})();
