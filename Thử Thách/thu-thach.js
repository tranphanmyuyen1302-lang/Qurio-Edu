(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const DATA_KEY = 'qurio_challenges_v1'; // Giữ tiến độ khi cập nhật từ phiên bản trước.
  const questions = window.QurioBankEngine?.all() || (Array.isArray(window.QURIO_CHALLENGE_BANK) ? window.QURIO_CHALLENGE_BANK : []);
  const groups = [
    {id:'all',label:'Tất cả'}, {id:'featured',label:'✨ Nổi bật'},
    {id:'languages',label:'🌏 Ngoại ngữ'}, {id:'math',label:'📐 Toán'},
    {id:'computing',label:'💻 Tin học'}, {id:'science',label:'🔬 Khoa học'},
    {id:'society',label:'📚 Xã hội & kỹ năng'}
  ];
  const catalog = [
    {id:'daily',group:'featured',emoji:'⚡',name:'Thử thách hằng ngày',desc:'Ghép cặp kiến thức đa môn để khởi động mỗi ngày.',count:5,kind:'daily'},
    {id:'adaptive',group:'featured',emoji:'🧠',name:'Thử thách thích ứng',desc:'Phân loại các thẻ kiến thức và luyện tập từ kết quả.',count:8,kind:'adaptive'},
    {id:'review',group:'featured',emoji:'🎯',name:'Khắc phục điểm yếu',desc:'Ghép lại những kiến thức từng làm sai.',count:8,kind:'review'},
    {id:'sprint',group:'featured',emoji:'⏱️',name:'Chạy đua 90 giây',desc:'Săn sao kiến thức trong 75 giây.',count:8,kind:'sprint'},
    {id:'marathon',group:'featured',emoji:'🏁',name:'Marathon kiến thức',desc:'Lật thẻ và ghi nhớ kiến thức tổng hợp.',count:15,kind:'marathon'},
    {id:'surprise',group:'featured',emoji:'🎲',name:'Hộp bí ẩn',desc:'Giải mã đáp án bí ẩn từ nhiều môn học.',count:7,kind:'surprise'},
    {id:'english-grammar',group:'languages',emoji:'📝',name:'Ngữ pháp tiếng Anh',desc:'Thì, câu điều kiện, bị động và cấu trúc câu.',count:5,kind:'subject'},
    {id:'english-vocab',group:'languages',emoji:'🔤',name:'Từ vựng tiếng Anh',desc:'Từ đồng nghĩa, trái nghĩa và ý nghĩa từ.',count:5,kind:'subject'},
    {id:'english-collocations',group:'languages',emoji:'💬',name:'Collocations & Phrasal Verbs',desc:'Kết hợp từ và cụm động từ thường gặp.',count:5,kind:'subject'},
    {id:'english-reading',group:'languages',emoji:'📖',name:'Reading Mini',desc:'Đọc đoạn ngắn và kiểm tra hiểu nội dung.',count:5,kind:'subject'},
    {id:'chinese-hsk',group:'languages',emoji:'🀄',name:'Tiếng Trung cơ bản',desc:'Từ vựng, pinyin và ngữ pháp HSK nhập môn.',count:5,kind:'subject'},
    {id:'japanese-basic',group:'languages',emoji:'🌸',name:'Tiếng Nhật cơ bản',desc:'Từ vựng và mẫu câu giao tiếp nhập môn.',count:5,kind:'subject'},
    {id:'math-algebra',group:'math',emoji:'🔢',name:'Đại số',desc:'Phương trình, đa thức, căn và hệ thức Viète.',count:5,kind:'subject'},
    {id:'math-trigonometry',group:'math',emoji:'📐',name:'Lượng giác',desc:'Sin, cos, tan và các công thức quen thuộc.',count:5,kind:'subject'},
    {id:'math-geometry',group:'math',emoji:'📏',name:'Hình học',desc:'Góc, diện tích, định lý và tính chất hình.',count:5,kind:'subject'},
    {id:'computing-js',group:'computing',emoji:'🟨',name:'JavaScript',desc:'DOM, mảng, biến, JSON và sự kiện web.',count:5,kind:'subject'},
    {id:'computing-python',group:'computing',emoji:'🐍',name:'Python',desc:'Cú pháp cơ bản, list, kiểu dữ liệu và vòng lặp.',count:5,kind:'subject'},
    {id:'computing-logic',group:'computing',emoji:'🧩',name:'Logic & Nhị phân',desc:'Cổng logic, hệ nhị phân và tư duy thuật toán.',count:5,kind:'subject'},
    {id:'physics',group:'science',emoji:'⚛️',name:'Vật lý',desc:'Đại lượng, công thức và hiện tượng vật lý.',count:5,kind:'subject'},
    {id:'chemistry',group:'science',emoji:'🧪',name:'Hóa học',desc:'Công thức, chất, dung dịch và phản ứng cơ bản.',count:5,kind:'subject'},
    {id:'biology',group:'science',emoji:'🌱',name:'Sinh học',desc:'Tế bào, sinh lý và kiến thức về sự sống.',count:5,kind:'subject'},
    {id:'history',group:'society',emoji:'🏛️',name:'Lịch sử',desc:'Sự kiện, nhân vật và dấu mốc lịch sử.',count:5,kind:'subject'},
    {id:'geography',group:'society',emoji:'🌍',name:'Địa lý',desc:'Trái Đất, bản đồ, khí hậu và các châu lục.',count:5,kind:'subject'},
    {id:'study-skills',group:'society',emoji:'💡',name:'Kỹ năng học tập',desc:'Ôn tập, tự đánh giá và tư duy học chủ động.',count:5,kind:'subject'}
  ];

  const topics = [
    ['Hằng ngày',[
      ['school','School life','Trường học','What is your favorite school activity? Ask your partner about their school day.'],
      ['family','Family','Gia đình','What is a tradition your family enjoys?'],
      ['friends','Friendship','Tình bạn','What makes a good friend? Give an example.'],
      ['routine','Daily routine','Sinh hoạt hằng ngày','Describe a typical weekday and ask your partner about theirs.'],
      ['hobbies','Hobbies','Sở thích','What hobby would you like to try and why?'],
      ['food','Food & cooking','Ẩm thực','Describe a favorite dish and explain how it is prepared.'],
      ['shopping','Shopping','Mua sắm','How do you decide whether something is worth buying?'],
      ['pets','Animals & pets','Động vật','Which animal would you like to learn more about?']
    ]],
    ['Giải trí & văn hóa',[
      ['music','Music','Âm nhạc','How does music affect your mood?'],
      ['movies','Movies & series','Phim ảnh','Recommend a movie without revealing its ending.'],
      ['books','Books & stories','Sách và truyện','Talk about a book or story that influenced you.'],
      ['gaming','Video games','Trò chơi điện tử','What can people learn from games?'],
      ['sports','Sports','Thể thao','What are the benefits of playing a team sport?'],
      ['culture','Culture & traditions','Văn hóa','Describe an interesting tradition from your region.'],
      ['festivals','Festivals','Lễ hội','Describe a celebration you enjoy.'],
      ['fashion','Clothes & personal style','Trang phục','What do people consider when choosing clothes?']
    ]],
    ['Học tập & tương lai',[
      ['exams','Exams & study habits','Thi cử và học tập','What study habit has helped you learn better?'],
      ['languages','Learning languages','Học ngoại ngữ','What is the hardest part of learning another language?'],
      ['careers','Future careers','Nghề nghiệp','What kind of work would you enjoy in the future?'],
      ['studyabroad','Studying abroad','Du học','What are the benefits and challenges of studying abroad?'],
      ['dreams','Dreams & goals','Ước mơ','Describe one goal and a small step toward it.'],
      ['teamwork','Teamwork','Làm việc nhóm','What makes teamwork effective at school?'],
      ['volunteer','Volunteering','Hoạt động cộng đồng','What is one way young people can help their community?'],
      ['confidence','Confidence in communication','Tự tin giao tiếp','How can students become more confident speaking a foreign language?']
    ]],
    ['Thế giới xung quanh',[
      ['environment','Environment','Môi trường','What can students do to reduce waste at school?'],
      ['travel','Travel','Du lịch','Describe a place you would like to visit and why.'],
      ['transport','Transport','Giao thông','What could make transport safer and more convenient?'],
      ['weather','Weather & seasons','Thời tiết','Which season do you like and what activities suit it?'],
      ['city','City vs countryside','Thành thị và nông thôn','Compare living in a city and a rural area.'],
      ['health','Healthy habits','Lối sống lành mạnh','What daily habits help people feel well and learn effectively?'],
      ['planet','Space & science','Vũ trụ','What question would you like scientists to answer about space?'],
      ['news','Current events','Sự kiện xã hội','Discuss an interesting public event and why it matters.']
    ]],
    ['Công nghệ & ý tưởng',[
      ['technology','Technology','Công nghệ','How does technology change the way students learn?'],
      ['ai','Artificial intelligence','Trí tuệ nhân tạo','What can AI help students do, and what are its limits?'],
      ['social','Social media','Mạng xã hội','What are two advantages and one risk of social media?'],
      ['internet','Online safety','An toàn Internet','How can students protect their privacy online?'],
      ['inventions','Inventions','Phát minh','What invention would make studying easier?'],
      ['business','Starting a project','Khởi nghiệp','If you built a useful project, what problem would it solve?'],
      ['climate','Sustainable living','Sống bền vững','What small changes could make a school more sustainable?'],
      ['robots','Robots','Robot','What useful tasks could robots perform in schools?']
    ]]
  ];
  const topicById = new Map(topics.flatMap(([section,items])=>items.map(x=>[x[0], {id:x[0],en:x[1],vi:x[2],prompt:x[3],section}])));
  const modeHints = {
    conversation:'Mỗi người hỏi ít nhất hai câu và lắng nghe câu trả lời.',
    debate:'Hai bạn chọn hai quan điểm khác nhau, trình bày lý do và phản hồi lịch sự.',
    roleplay:'Phân vai A/B, tạo một tình huống thực tế và đổi vai sau lượt đầu.',
    interview:'Người A hỏi, người B trả lời; sau đó đổi vai.',
    story:'Mỗi bạn kể một chuyện ngắn rồi đặt câu hỏi về chuyện của nhau.',
    problem:'Hai bạn cùng đề xuất giải pháp, cân nhắc ưu/nhược điểm và thống nhất một ý tưởng.'
  };
  const errorsEnglish = [
    {re:/\b(she|he|it) go to\b/gi, name:'Chia động từ',tip:'Ở thì hiện tại đơn, she/he/it + goes to...', fix:s=>s.replace(/\b(she|he|it) go to\b/gi,(_m,p)=>p+' goes to')},
    {re:/\bI very like\b/gi,name:'Cách diễn đạt',tip:'Dùng “I really like” hoặc “I really enjoy” sẽ tự nhiên hơn.',fix:s=>s.replace(/\bI very like\b/gi,'I really like')},
    {re:/\bI am agree\b/gi,name:'Cấu trúc agree',tip:'Agree là động từ: “I agree”, không dùng am.',fix:s=>s.replace(/\bI am agree\b/gi,'I agree')},
    {re:/\bdepend of\b/gi,name:'Giới từ',tip:'Dùng “depend on”.',fix:s=>s.replace(/\bdepend of\b/gi,'depend on')},
    {re:/\bdiscuss about\b/gi,name:'Cấu trúc discuss',tip:'Dùng “discuss something”, không cần about.',fix:s=>s.replace(/\bdiscuss about\b/gi,'discuss')},
    {re:/\bI have (\d+) years old\b/gi,name:'Cách nói tuổi',tip:'Dùng “I am … years old”.',fix:s=>s.replace(/\bI have (\d+) years old\b/gi,'I am $1 years old')},
    {re:/\bmore better\b/gi,name:'So sánh hơn',tip:'Better đã là dạng so sánh hơn, không cần more.',fix:s=>s.replace(/\bmore better\b/gi,'better')},
    {re:/\blook forward to see\b/gi,name:'Động từ theo sau giới từ',tip:'Dùng “look forward to seeing”.',fix:s=>s.replace(/\blook forward to see\b/gi,'look forward to seeing')}
  ];
  const safe = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const makeState = () => ({xp:0,completed:0,days:[],history:[],wrong:[]});
  let state;
  try { state = {...makeState(),...JSON.parse(localStorage.getItem(DATA_KEY)||'{}')}; } catch {state=makeState();}
  for (const key of ['days','history','wrong']) if (!Array.isArray(state[key])) state[key]=[];
  state.xp=Math.max(0,Number(state.xp)||0);
  state.completed=Math.max(0,Number(state.completed)||0);
  let speech=null, filter='all', currentAnalysisToken=null, gameHub=null;
  const dayKey=(d=new Date())=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  function save(){try{localStorage.setItem(DATA_KEY,JSON.stringify(state));}catch(_e){}}
  function award(xp,label){state.xp+=xp;state.completed++;if(!state.days.includes(dayKey()))state.days.push(dayKey());state.history.unshift({date:new Date().toLocaleString('vi-VN'),label,xp});state.history=state.history.slice(0,30);save();renderStats();}
  function streak(){let n=0,d=new Date();if(!state.days.includes(dayKey(d)))d.setDate(d.getDate()-1);while(n<365&&state.days.includes(dayKey(d))){n++;d.setDate(d.getDate()-1);}return n;}
  function renderStats(){
    $('xp').textContent=state.xp+' XP';$('completed').textContent=state.completed;$('streak').textContent=streak()+' ngày';
    const badges=[state.completed>=1,state.completed>=5,state.completed>=15,state.xp>=200,state.xp>=500];
    $('badges').textContent=badges.filter(Boolean).length;
    const labels=['🌱 Bước đầu tiên','🔥 Kiên trì 5 thử thách','🎯 Chinh phục 15 thử thách','🏆 200 XP','💎 500 XP'];
    $('achievements').replaceChildren(...labels.map((label,i)=>{const span=document.createElement('span');span.textContent=label;span.style.opacity=badges[i]?'1':'.46';return span;}));
    $('history').innerHTML=state.history.length?state.history.slice(0,8).map(x=>`<div class="history-row">${safe(x.date)} · ${safe(x.label)} · +${Number(x.xp)||0} XP</div>`).join(''):'<p class="subtle">Hãy hoàn thành thử thách đầu tiên nhé!</p>';
  }
  function renderFilters(){
    $('challengeFilters').replaceChildren(...groups.map(x=>{let b=document.createElement('button');b.type='button';b.className='filter-chip'+(filter===x.id?' selected':'');b.textContent=x.label;b.setAttribute('aria-pressed',filter===x.id?'true':'false');b.onclick=()=>{filter=x.id;renderFilters();renderCatalog();};return b;}));
  }
  function renderCatalog(){
    const keyword=$('challengeSearch').value.trim().toLocaleLowerCase('vi');
    const visible=catalog.filter(c=>(filter==='all'||c.group===filter)&&(`${c.name} ${c.desc} ${groups.find(g=>g.id===c.group)?.label||''}`.toLocaleLowerCase('vi').includes(keyword)));
    $('challengeGrid').replaceChildren(...visible.map(c=>{
      const card=document.createElement('article');card.className='feature-card game-feature-card';
      const mode=window.QurioGames.modeFor(c);
      const allQ=window.QurioBankEngine?.all()||questions;
      const qCount=c.kind==='subject'?allQ.filter(q=>q.group===c.id).length:allQ.length;
      card.innerHTML=`<div class="feature-top"><span class="feature-icon" aria-hidden="true">${c.emoji}</span><span class="feature-meta">${c.kind==='subject'?qCount+' nội dung luyện tập':'Nhiệm vụ đặc biệt'}</span></div><span class="game-tag">${safe(mode.emoji+' '+mode.label)}</span><h3>${safe(c.name)}</h3><p>${safe(c.desc)}</p><div class="feature-footer"><span class="feature-mini">${safe(groups.find(g=>g.id===c.group)?.label||'')}</span><button type="button" class="card-button">🎮 Chơi ngay</button></div>`;
      card.querySelector('button').addEventListener('click',()=>gameHub.start(c,mode.id));return card;
    }));
    $('challengeCount').textContent=`${visible.length} / ${catalog.length} trò chơi`;
    $('challengeEmpty').classList.toggle('hidden',visible.length!==0);
  }
  function configureTopics(){
    const select=$('topic');
    for(const [section,items] of topics){const optgroup=document.createElement('optgroup');optgroup.label=section;for(const [id,en,vi] of items){const option=document.createElement('option');option.value=id;option.textContent=`${en} – ${vi}`;optgroup.append(option);}select.append(optgroup);}
    const optgroup=document.createElement('optgroup');optgroup.label='Cá nhân hóa';const other=document.createElement('option');other.value='custom';other.textContent='✍️ Khác – Tự nhập chủ đề';optgroup.append(other);select.append(optgroup);
    select.value='school';
    select.onchange=updateTopic;
    $('customTopic').addEventListener('input',updateTopic);
    $('customPrompt').addEventListener('input',updateTopic);
    $('speakingMode').addEventListener('change',updateTopic);
    $('language').addEventListener('change',()=>{stopSpeech();updateTopic();});
    $('randomTopic').onclick=()=>{const arr=[...topicById.keys()];select.value=arr[Math.floor(Math.random()*arr.length)];updateTopic();};
    updateTopic();
  }
  function updateTopic(){
    const custom=$('topic').value==='custom';
    $('customTopicFields').classList.toggle('hidden',!custom);
    const topic=topicById.get($('topic').value);
    const title=custom?$('customTopic').value.trim():topic?.en;
    const translated=custom?title:`${topic?.en||'School life'} – ${topic?.vi||'Trường học'}`;
    const mode=$('speakingMode').value;
    const hint=modeHints[mode];
    const isEnglish=$('language').value==='en-US';
    let prompt;
    if(custom){prompt=$('customPrompt').value.trim()||(title?(isEnglish?`Discuss “${title}” with your partner and ask follow-up questions.`:`Hãy thảo luận chủ đề “${title}” bằng ngôn ngữ đã chọn và đặt câu hỏi cho nhau.`):'Nhập tên chủ đề bạn muốn trò chuyện.');}
    else{prompt=isEnglish?topic.prompt:`Hãy trao đổi về “${topic.vi}” bằng ngôn ngữ đã chọn. Mỗi bạn trình bày ý kiến và đặt câu hỏi cho người còn lại.`;}
    $('topicName').textContent=translated||'Chủ đề do bạn tự đặt';
    $('promptText').textContent=prompt;
    $('modeHint').textContent=hint;
  }
  function analyze(){
    if(!$('consent').checked){alert('Vui lòng xác nhận sự đồng ý của tất cả người tham gia trước khi xử lý hội thoại.');return;}
    const transcript=$('transcript').value.trim();if(!transcript){alert('Hãy nhập nội dung hội thoại trước.');return;}
    const locale=$('language').value;
    const results={A:[],B:[]};const lines=transcript.split(/\n+/).filter(Boolean);
    let entered={A:0,B:0};
    lines.forEach(line=>{
      const match=line.match(/^\s*(?:học sinh\s*)?([AB])\s*:\s*(.*)$/i);
      const who=match?match[1].toUpperCase():$('speaker').value;
      const content=match?match[2]:line;entered[who]++;
      if(locale!=='en-US')return;
      for(const rule of errorsEnglish){rule.re.lastIndex=0;if(rule.re.test(content)){results[who].push({source:content,corrected:rule.fix(content),name:rule.name,tip:rule.tip});}}
    });
    const wrapper=document.createElement('div');
    if(locale!=='en-US'){wrapper.innerHTML='<div class="notice-box"><strong>Đã nhận nội dung hội thoại.</strong><p>Bản thử nghiệm chưa có bộ quy tắc kiểm lỗi riêng cho ngôn ngữ bạn chọn. Bạn có thể luyện giao tiếp và nhờ giáo viên nhận xét; không tự suy đoán đúng/sai.</p></div>';}
    else{
      for(const who of ['A','B']){
        const title=document.createElement('h3');title.textContent=`👤 Học sinh ${who}`;wrapper.append(title);
        const arr=results[who];
        if(!arr.length){const p=document.createElement('p');p.className='subtle';p.textContent=entered[who]?'Chưa phát hiện mẫu lỗi có trong bộ quy tắc; điều này không có nghĩa là mọi câu đều đúng.':'Chưa có câu thoại được gắn nhãn cho học sinh này.';wrapper.append(p);}
        for(const result of arr){const block=document.createElement('div');block.className='report-item';block.innerHTML=`<strong>${safe(result.name)}</strong><p>Đã nói: ${safe(result.source)}</p><p class="corrected">Gợi ý: ${safe(result.corrected)}</p><p>${safe(result.tip)}</p>`;wrapper.append(block);}
      }
    }
    const note=document.createElement('p');note.className='subtle';note.textContent='Kết quả chỉ mang tính tham khảo; không đánh giá phát âm hoặc năng lực tổng thể. Hãy xem lại với giáo viên.';wrapper.append(note);
    $('analysisResult').className='';$('analysisResult').replaceChildren(...wrapper.children);
    // Không lưu nội dung hội thoại, chỉ lưu tên hoạt động; tránh thưởng XP lặp khi bấm phân tích nhiều lần.
    if(currentAnalysisToken!==transcript+'|'+locale){award(10,'Luyện nói và nhận phản hồi');currentAnalysisToken=transcript+'|'+locale;}
  }
  function stopSpeech(){
    if(speech){try{speech.stop();}catch(_e){}speech=null;}
    $('startSpeech').disabled=false;$('stopSpeech').disabled=true;
  }
  function startSpeech(){
    if(!$('consent').checked){alert('Cần sự đồng ý của tất cả người tham gia trước khi nhận dạng giọng nói.');return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){$('speechStatus').textContent='Trình duyệt không hỗ trợ nhận dạng giọng nói. Bạn có thể nhập hội thoại thủ công.';return;}
    speech=new SR();speech.lang=$('language').value;speech.continuous=true;speech.interimResults=false;
    const active=speech;
    active.onresult=event=>{for(let i=event.resultIndex;i<event.results.length;i++)if(event.results[i].isFinal){const value=$('transcript');value.value+=(value.value?'\n':'')+$('speaker').value+': '+event.results[i][0].transcript;}};
    active.onerror=event=>{$('speechStatus').textContent='Nhận dạng giọng nói: '+event.error;stopSpeech();};
    active.onend=()=>{if(speech===active)speech=null;$('startSpeech').disabled=false;$('stopSpeech').disabled=true;};
    try{active.start();$('startSpeech').disabled=true;$('stopSpeech').disabled=false;$('speechStatus').textContent='Đang nhận dạng giọng nói. Hãy chọn đúng người đang nói và dừng khi kết thúc.';}
    catch(e){$('speechStatus').textContent='Không thể khởi động: '+e.message;stopSpeech();}
  }
  // Chỉ đăng ký các điều khiển tồn tại trên trang này.
  $('jumpSpeaking').onclick=()=>$('speaking').scrollIntoView({behavior:'smooth'});
  $('openSpeakingRoom').onclick=()=>{
    const topicText=$('topicName').textContent.trim();
    const promptText=$('promptText').textContent.trim();
    const q=new URLSearchParams({language:$('language').value,mode:$('speakingMode').value,topic:topicText,prompt:promptText});
    location.href='speaking-room.html?'+q.toString();
  };
  $('jumpQuiz').onclick=()=>gameHub.start(catalog[0], 'match');
  $('closeQuiz').onclick=()=>gameHub.stop();
  $('challengeSearch').addEventListener('input',renderCatalog);
  $('analyze').onclick=analyze;
  $('startSpeech').onclick=startSpeech;
  $('stopSpeech').onclick=stopSpeech;
  $('clearTranscript').onclick=()=>{stopSpeech();$('transcript').value='';currentAnalysisToken=null;$('analysisResult').className='analysis-placeholder';$('analysisResult').innerHTML='<div class="placeholder-icon">📋</div><p>Đã xóa bản hội thoại khỏi trang.</p>';};
  $('clearHistory').onclick=()=>{if(confirm('Xóa lịch sử, XP và kết quả luyện tập trên trình duyệt này?')){localStorage.removeItem(DATA_KEY);location.reload();}};
  gameHub=window.QurioGames.create({questions,catalog,state,save,award});
  renderFilters();renderCatalog();configureTopics();renderStats();
  window.QurioBankEngine?.onChange(()=>renderCatalog());
  window.QurioBankEngine?.loadPublished().then(result=>{
    if(result.ok){renderCatalog();console.info('Qurio question bank: '+result.added+' câu đã duyệt bổ sung từ Sheets.');}
  });
})();
