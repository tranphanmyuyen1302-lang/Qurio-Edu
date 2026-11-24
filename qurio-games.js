/* Qurio Game Zone — các mini game chạy trên trình duyệt, không yêu cầu AI / video call. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = values => {const arr=[...values];for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;};
  const modes = [
    {id:'match',emoji:'🧩',label:'Ghép cặp thần tốc',description:'Nối kiến thức với đáp án tương ứng.',tone:'violet'},
    {id:'memory',emoji:'🃏',label:'Lật thẻ trí nhớ',description:'Lật tìm cặp kiến thức bị ẩn.',tone:'cyan'},
    {id:'meteor',emoji:'🌠',label:'Săn sao kiến thức',description:'Chọn ngôi sao đúng trước khi hết giờ.',tone:'amber'},
    {id:'sort',emoji:'⚖️',label:'Phân loại đúng – sai',description:'Đưa các thẻ thông tin về đúng khu vực.',tone:'mint'},
    {id:'decode',emoji:'🔐',label:'Giải mã bí mật',description:'Xếp các mảnh ký tự để mở khóa.',tone:'rose'},
    {id:'sentence',emoji:'🔤',label:'Xếp câu kỳ diệu',description:'Sắp xếp từ thành câu tiếng Anh hoàn chỉnh.',tone:'blue'}
  ];
  const mapping = {
    daily:'match',adaptive:'sort',review:'match',sprint:'meteor',marathon:'memory',surprise:'decode',
    'english-grammar':'sentence','english-vocab':'decode','english-collocations':'match','english-reading':'sort',
    'chinese-hsk':'memory','japanese-basic':'meteor',
    'math-algebra':'match','math-trigonometry':'memory','math-geometry':'meteor',
    'computing-js':'decode','computing-python':'match','computing-logic':'sort',
    physics:'meteor',chemistry:'match',biology:'memory',
    history:'sort',geography:'meteor','study-skills':'memory'
  };
  const modeFor = challenge => modes.find(x=>x.id===(mapping[challenge.id]||'match')) || modes[0];

  function create({questions,catalog,state,save,award}) {
    const library = Array.isArray(questions) ? questions : [];
    const bank = window.QurioBankEngine;
    let game=null;
    let clockId=null;
    const panel=$('quizPanel'), body=$('quizBody');
    function clearClock(){if(clockId!==null){clearInterval(clockId);clockId=null;}}
    function stampWrong(id,wrong){
      if(!id || !game)return;
      const question=game.pool.find(q=>q.id===id)||bank?.all().find(q=>q.id===id);
      // Each wrong attempt is useful evidence; a subsequent correct try is also recorded.
      if(question)bank?.record(question,!wrong,{mode:game.mode});
      if(wrong)game.errors.add(id);else game.learned.add(id);
    }
    function storeLearning(){
      for(const id of game.learned) if(!game.errors.has(id)) state.wrong=state.wrong.filter(x=>x!==id);
      for(const id of game.errors) if(!state.wrong.includes(id))state.wrong.push(id);
      save();
    }
    function progress(note='') {
      const mode=modes.find(x=>x.id===game.mode);
      const value=Math.round((game.step/Math.max(1,game.total))*100);
      const header=$('gameHud');
      if(!header)return;
      header.innerHTML=`<div class="game-hud-top"><span class="game-hud-mode">${mode.emoji} ${escapeHTML(mode.label)}</span><span>⭐ ${game.points} XP dự kiến</span><span>🎯 ${game.step}/${game.total} màn</span>${game.mode==='meteor'?`<span id="gameClock">⏱ ${game.seconds}s</span>`:''}</div><div class="game-progress-track"><div class="game-progress-fill" style="width:${value}%"></div></div>${note?`<p class="game-instruction">${escapeHTML(note)}</p>`:''}`;
    }
    function feedback(html,done){
      const zone=$('gameFeedback');
      if(!zone)return;
      zone.innerHTML=`<div class="game-feedback">${html}<button type="button" class="primary" id="nextGameRound">${game.step+1>=game.total?'🏆 Xem thành tích':'Tiếp tục →'}</button></div>`;
      $('nextGameRound').onclick=()=>{if(!game)return;if(done)game.step++;if(game.step>=game.total){finish(false);return;}renderRound();};
    }
    function advance(message,explanation=''){
      if(!game)return;
      window.QurioArcadeFX?.celebrate?.();
      game.lock=true;
      progress();
      feedback(`<strong>🎉 ${escapeHTML(message)}</strong>${explanation?`<p>${escapeHTML(explanation)}</p>`:''}`,true);
    }
    function failOnce(question){game.mistakes++;if(question)stampWrong(question.id,true);}
    function finish(timedOut){
      if(!game||game.finished)return;
      clearClock();
      game.finished=true;
      storeLearning();
      bank?.finishSession({mode:game.mode,challengeId:game.challenge.id,points:game.points,correct:game.achievements,mistakes:game.mistakes});
      const completed=game.step>=game.total;
      // Điểm chỉ phản ánh thành tích trong minigame, không phải điểm năng lực chuẩn hóa.
      const xp=game.points;
      if(game.achievements>0)award(xp,`${game.challenge.name} · ${modes.find(x=>x.id===game.mode).label}`);
      $('quizTitle').textContent='Thành tích của bạn';
      const text=timedOut?'⏳ Đã hết giờ!':completed?'🎉 Chinh phục thành công!':'🌟 Tạm kết thúc!';
      body.innerHTML=`<div class="game-finish"><div class="game-finish-emoji">${completed?'🏆':'🌟'}</div><h3>${text}</h3><p>Bạn đã hoàn thành <strong>${game.step}/${game.total}</strong> màn, thu thập <strong>${xp} XP</strong>.</p><p class="game-finish-sub">${game.mistakes?`Bạn đã có ${game.mistakes} lượt thử chưa đúng. Hãy xem lại phần giải thích và thử tiếp nhé!`:'Rất tốt! Hãy thử một loại trò chơi khác để luyện thêm kỹ năng.'}</p><div class="game-finish-actions"><button class="primary" id="gameReplay" type="button">🔄 Chơi lại</button><button class="secondary" id="gameBack" type="button">🎮 Chọn trò khác</button></div></div>`;
      const old=game;
      $('gameReplay').onclick=()=>start(old.challenge,old.mode);
      $('gameBack').onclick=()=>stop(true);
    }
    function stop(scroll=false){if(window.QURIO_GAME_STANDALONE){window.location.href='thu-thach.html#gameModesSection';return;}clearClock();game=null;panel.classList.add('hidden');body.replaceChildren();if(scroll)$('gameModesSection').scrollIntoView({behavior:'smooth'});}
    function prepare(challenge,mode){
      const max=mode==='match'?8:mode==='memory'?8:mode==='meteor'?6:mode==='sort'?8:mode==='decode'?5:5;
      const selection=bank?.choose({challenge,mode,limit:max,wrongIds:state.wrong||[]});
      const limited=selection?.items||shuffle(library).slice(0,max);
      const roundSize=mode==='match'||mode==='memory'?4:1;
      return {challenge,mode,pool:limited,roundSize,total:Math.ceil(limited.length/roundSize),step:0,points:0,mistakes:0,achievements:0,errors:new Set(),learned:new Set(),seconds:75,lock:false,finished:false,selection};
    }
    function start(challenge,chosenMode){
      if(!window.QURIO_GAME_STANDALONE){const params=new URLSearchParams({challenge:challenge?.id||'daily',mode:chosenMode||modeFor(challenge).id});window.location.href='tro-choi.html?'+params.toString();return;}
      clearClock();
      if(!challenge)return;
      const mode=modes.some(x=>x.id===chosenMode)?chosenMode:modeFor(challenge).id;
      const g=prepare(challenge,mode);game=g;
      panel.classList.remove('hidden');
      $('quizTitle').textContent=challenge.name;
      body.innerHTML='<div id="gameHud"></div><div class="game-field" id="gameField"></div><div id="gameFeedback" aria-live="polite"></div><div class="game-controls"><button type="button" class="secondary small" id="gameRestart">↻ Chơi lại từ đầu</button></div>';
      $('gameRestart').onclick=()=>start(challenge,mode);
      if(!window.QURIO_GAME_STANDALONE)panel.scrollIntoView({behavior:'smooth',block:'start'});
      if(g.selection){
        const info=document.createElement('div');info.className='qurio-bank-hint';
        info.innerHTML='<span>📚 <strong>'+g.selection.bankSize+'</strong> nội dung phù hợp</span><span>🌱 <strong>'+g.selection.unseen+'</strong> kiến thức mới trong lượt này</span><span>🧠 Chọn theo tiến độ của bạn</span>';
        body.insertBefore(info,$('gameHud'));
      }
      if(!g.pool.length){$('gameHud').innerHTML='';$('gameField').innerHTML='<div class="game-empty">🌱 Chưa có nội dung phù hợp cho trò chơi này. Hãy chọn một trò khác hoặc làm sai một câu ở trò Săn sao để mở nhiệm vụ khắc phục điểm yếu.</div>';return;}
      renderRound();
      if(mode==='meteor')clockId=setInterval(()=>{
        if(game!==g||g.finished){clearClock();return;}
        g.seconds=Math.max(0,g.seconds-1);
        const c=$('gameClock');if(c)c.textContent=`⏱ ${g.seconds}s`;
        if(g.seconds<=0)finish(true);
      },1000);
    }
    function renderRound(){
      if(!game||game.finished)return;
      game.lock=false;
      const feedbackNode=$('gameFeedback');if(feedbackNode)feedbackNode.innerHTML='';
      const note={match:'Chọn một thẻ kiến thức bên trái, rồi ghép với đáp án bên phải.',memory:'Lật hai thẻ mỗi lượt để tìm cặp câu hỏi – đáp án.',meteor:'Tìm ngôi sao chứa đáp án phù hợp trước khi hết giờ.',sort:'Đọc cặp câu hỏi – đáp án và phân loại chính xác hay chưa chính xác.',decode:'Chạm vào các mảnh chữ theo đúng thứ tự để giải mã đáp án.',sentence:'Chạm vào từng từ theo đúng thứ tự để tạo thành câu tiếng Anh.'}[game.mode];
      progress(note);
      switch(game.mode){
        case 'match':return drawMatch();
        case 'memory':return drawMemory();
        case 'meteor':return drawMeteor();
        case 'sort':return drawSort();
        case 'decode':return drawBuilder(false);
        case 'sentence':return drawBuilder(true);
      }
    }
    function pairBatch(){return game.pool.slice(game.step*game.roundSize,(game.step+1)*game.roundSize);}
    function drawMatch(){
      const batch=pairBatch();let selected=null;let found=0;
      const field=$('gameField');
      field.innerHTML=`<div class="game-match-heading"><span>📘 KIẾN THỨC</span><span>🔑 ĐÁP ÁN</span></div><div class="game-match-grid"><div id="matchLeft" class="game-match-column"></div><div id="matchRight" class="game-match-column"></div></div><p class="game-match-caption" id="matchCaption">Đã ghép: 0/${batch.length} cặp</p>`;
      const left=$('matchLeft'),right=$('matchRight');
      const leftSet=shuffle(batch.map(q=>({id:q.id,text:q.q,q}))),rightSet=shuffle(batch.map(q=>({id:q.id,text:q.a[q.correct],q})));
      leftSet.forEach(entry=>{
        const b=document.createElement('button');b.type='button';b.className='match-tile match-question';b.textContent=entry.text;
        b.onclick=()=>{if(game.lock||b.disabled)return;left.querySelectorAll('.match-tile').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');selected={id:entry.id,button:b,q:entry.q};};left.append(b);
      });
      rightSet.forEach(entry=>{
        const b=document.createElement('button');b.type='button';b.className='match-tile match-answer';b.textContent=entry.text;
        b.onclick=()=>{
          if(game.lock||b.disabled)return;
          if(!selected){$('matchCaption').textContent='👈 Hãy chọn một thẻ kiến thức bên trái trước nhé.';return;}
          if(selected.id===entry.id){
            selected.button.classList.remove('selected');selected.button.classList.add('matched');selected.button.disabled=true;
            b.classList.add('matched');b.disabled=true;found++;game.points+=10;game.achievements++;
            stampWrong(entry.id,false);selected=null;
            $('matchCaption').textContent=`✅ Đã ghép: ${found}/${batch.length} cặp`;
            if(found===batch.length)advance('Đã ghép xong tất cả cặp!','Mỗi cặp giúp bạn ghi nhớ mối liên hệ giữa kiến thức và đáp án.');
          }else{
            failOnce(selected.q);b.classList.add('tile-wrong');selected.button.classList.add('tile-wrong');
            $('matchCaption').textContent='Chưa khớp, thử một đáp án khác nhé!';
            const l=selected.button,r=b;setTimeout(()=>{l.classList.remove('tile-wrong');r.classList.remove('tile-wrong');},450);
          }
        };
        right.append(b);
      });
    }
    function drawMemory(){
      const batch=pairBatch();const field=$('gameField');let open=[],matched=0;let freeze=false;
      const cards=shuffle(batch.flatMap(q=>[{id:q.id,type:'q',text:q.q},{id:q.id,type:'a',text:q.a[q.correct]}]));
      field.innerHTML='<p class="memory-intro">🧠 Hãy ghi nhớ vị trí các thẻ và tìm đủ cặp!</p><div class="memory-grid" id="memoryGrid"></div><p id="memoryStatus" class="game-match-caption">Đã tìm được 0 cặp.</p>';
      const grid=$('memoryGrid');
      cards.forEach((card,i)=>{
        const b=document.createElement('button');b.type='button';b.className='memory-card';b.setAttribute('aria-label',`Lật thẻ số ${i+1}`);
        b.innerHTML=`<span class="memory-back">✦</span><span class="memory-face">${card.type==='q'?'❔':'🔑'} ${escapeHTML(card.text)}</span>`;
        b.onclick=()=>{
          if(game.lock||freeze||b.classList.contains('revealed')||b.classList.contains('matched'))return;
          b.classList.add('revealed');open.push({button:b,...card});
          if(open.length!==2)return;
          if(open[0].id===open[1].id&&open[0].type!==open[1].type){
            open.forEach(x=>x.button.classList.add('matched'));stampWrong(card.id,false);
            matched++;game.points+=10;game.achievements++;open=[];
            $('memoryStatus').textContent=`Đã tìm được ${matched}/${batch.length} cặp`;
            if(matched===batch.length)advance('Trí nhớ tuyệt vời!','Bạn đã tìm ra toàn bộ các cặp thẻ.');
          }else{
            freeze=true;game.mistakes++;
            // Record confusion for each distinct card's underlying concept.
            const ids=new Set(open.map(x=>x.id));for(const id of ids)stampWrong(id,true);
            const two=[...open];open=[];
            setTimeout(()=>{
              if(game?.mode!=='memory'||!grid.isConnected)return;
              two.forEach(x=>x.button.classList.remove('revealed'));freeze=false;
            },850);
          }
        };grid.append(b);
      });
    }
    function drawMeteor(){
      const q=game.pool[game.step];if(!q){finish(false);return;}
      const field=$('gameField');
      const options=shuffle(q.a.map((text,index)=>({text,index})));
      field.innerHTML=`<div class="meteor-sky"><div class="meteor-dots" aria-hidden="true">✧ ✦ ⋆ ✧ · ✦</div><span class="meteor-topic">NHIỆM VỤ ${game.step+1}</span><h3 class="meteor-question">${escapeHTML(q.q)}</h3><div class="meteor-options" id="meteorOptions"></div><p class="meteor-hint" id="meteorHint">🌠 Chạm vào ngôi sao chứa đáp án đúng!</p></div>`;
      const opts=$('meteorOptions');
      options.forEach((opt,i)=>{
        const b=document.createElement('button');b.type='button';b.className='meteor-star';b.innerHTML=`<span class="star-symbol" aria-hidden="true">⭐</span><span>${escapeHTML(opt.text)}</span>`;
        b.style.setProperty('--delay',`${i*0.12}s`);
        b.onclick=()=>{
          if(game.lock)return;
          if(opt.index===q.correct){
            b.classList.add('star-correct');game.points+=10;game.achievements++;
            if(!game.errors.has(q.id))stampWrong(q.id,false);
            Array.from(opts.children).forEach(x=>x.disabled=true);
            advance('Bắt được ngôi sao đúng!',q.why);
          }else{
            b.classList.add('star-wrong');b.disabled=true;
            if(!game.errors.has(q.id))failOnce(q);
            $('meteorHint').textContent='Sao này chưa đúng, hãy thử ngôi sao khác nhé.';
          }
        };opts.append(b);
      });
    }
    function drawSort(){
      const q=game.pool[game.step];if(!q){finish(false);return;}
      const useRight=game.step%2===0;
      const wrongAnswers=q.a.map((a,i)=>({a,i})).filter(x=>x.i!==q.correct);
      const displayAnswer=useRight?q.a[q.correct]:wrongAnswers[game.step%wrongAnswers.length].a;
      const field=$('gameField');
      field.innerHTML=`<div class="sort-stage"><div class="sort-statement"><span class="game-topline">📜 THẺ KIẾN THỨC ${game.step+1}</span><p>${escapeHTML(q.q)}</p><strong>→ ${escapeHTML(displayAnswer)}</strong></div><p>Đây có phải là cặp câu hỏi – đáp án chính xác không?</p><div class="sort-zones"><button type="button" id="sortTrue" class="sort-zone yes">✅ Chính xác</button><button type="button" id="sortFalse" class="sort-zone no">❌ Chưa chính xác</button></div></div>`;
      function classify(value){
        if(game.lock)return;game.lock=true;
        $('sortTrue').disabled=true;$('sortFalse').disabled=true;
        const correct=value===useRight;
        if(correct){game.points+=10;game.achievements++;stampWrong(q.id,false);}else failOnce(q);
        $('sortTrue').classList.toggle('picked',value);$('sortFalse').classList.toggle('picked',!value);
        advance(correct?'Bạn phân loại chính xác!':'Cùng học từ lỗi sai nhé',`${q.why} Đáp án phù hợp: ${q.a[q.correct]}.`);
      }
      $('sortTrue').onclick=()=>classify(true);$('sortFalse').onclick=()=>classify(false);
    }
    function drawBuilder(isSentence){
      const q=game.pool[game.step];if(!q){finish(false);return;}
      const answer=String(q.a[q.correct]||'').trim();
      const final=isSentence?q.q.replace('___',answer):answer;
      let fragments,isWord;
      if(isSentence){fragments=final.split(/\s+/);isWord=true;}
      else if(/\s/.test(final) && final.split(/\s+/).length<=5){fragments=final.split(/\s+/);isWord=true;}
      else{fragments=Array.from(final).filter(x=>x!==' ');isWord=false;}
      const original=fragments.map((value,id)=>({id,value}));
      let tiles=shuffle(original);
      if(tiles.length>1&&tiles.every((x,i)=>x.id===i))tiles=[...tiles.slice(1),tiles[0]];
      const chosen=[];const field=$('gameField');
      field.innerHTML=`<div class="builder-stage"><span class="game-topline">${isSentence?'🔤 XẾP CÂU TIẾNG ANH':'🔐 MỞ KHÓA ĐÁP ÁN'}</span><h3>${isSentence?'Hãy khôi phục câu sau từ các từ bị đảo:':'Đọc gợi ý và giải mã đáp án:'}</h3><p class="builder-prompt">${escapeHTML(isSentence?q.q:q.q)}</p><div class="builder-answer" id="builderAnswer">Chạm vào các mảnh bên dưới…</div><div class="builder-tiles" id="builderTiles"></div><div class="builder-actions"><button type="button" class="secondary" id="builderUndo">↶ Hoàn tác</button><button type="button" class="secondary" id="builderReset">↻ Xếp lại</button><button type="button" class="primary" id="builderCheck">✓ Kiểm tra</button></div><p class="builder-message" id="builderMessage">${isSentence?'Gợi ý: đọc toàn bộ câu và đặt các từ theo ngữ pháp đúng.':'Gợi ý: đáp án liên quan đến câu hỏi bên trên.'}</p></div>`;
      const answerEl=$('builderAnswer'), tileEl=$('builderTiles');
      const join = x => x.map(p=>p.value).join(isWord?' ':'');
      function update(){
        answerEl.textContent=chosen.length?join(chosen):'Chạm vào các mảnh bên dưới…';
        tileEl.replaceChildren(...tiles.map(t=>{
          const b=document.createElement('button');b.type='button';b.className='builder-tile';b.textContent=t.value;b.disabled=chosen.some(x=>x.id===t.id);
          b.onclick=()=>{if(game.lock)return;chosen.push(t);update();};return b;
        }));
        $('builderUndo').disabled=chosen.length===0;
      }
      $('builderUndo').onclick=()=>{if(chosen.length){chosen.pop();update();}};
      $('builderReset').onclick=()=>{chosen.length=0;update();$('builderMessage').textContent='Hãy thử ghép theo thứ tự mới.';};
      $('builderCheck').onclick=()=>{
        if(game.lock)return;
        if(chosen.length!==fragments.length){$('builderMessage').textContent='Hãy dùng đủ tất cả mảnh trước khi kiểm tra.';return;}
        const correct=chosen.every((x,i)=>x.id===i);
        if(correct){game.points+=10;game.achievements++;stampWrong(q.id,false);game.lock=true;advance('Mở khóa thành công!',q.why);}
        else{failOnce(q);$('builderMessage').textContent='Thứ tự chưa chính xác. Hãy hoàn tác hoặc xếp lại để thử tiếp.';}
      };
      update();
    }
    const host=$('gameModes');
    if(host){
      host.replaceChildren(...modes.map(mode=>{
        const card=document.createElement('button');card.type='button';card.className=`game-mode-card mode-${mode.tone}`;
        card.innerHTML=`<span class="game-mode-icon" aria-hidden="true">${mode.emoji}</span><span class="game-card-glow"></span><strong>${escapeHTML(mode.label)}</strong><span>${escapeHTML(mode.description)}</span><span class="mode-play">Chơi thử →</span>`;
        const defaultIds={match:'daily',memory:'marathon',meteor:'sprint',sort:'adaptive',decode:'english-vocab',sentence:'english-grammar'};
        card.onclick=()=>start(catalog.find(c=>c.id===defaultIds[mode.id]),mode.id);
        return card;
      }));
    }
    return {start,stop};
  }
  window.QurioGames={modes,modeFor,create};
})();
