/* Decorative-only effects, respects reduced-motion */
window.QurioArcadeFX=(()=>{let last=0;function celebrate(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(Date.now()-last<650)return;last=Date.now();
 const wrap=document.createElement('div');wrap.className='fx-confetti';wrap.setAttribute('aria-hidden','true');
 const colors=['#8d6cf3','#37d6da','#fac55e','#ff79b0','#7aefba'];
 for(let i=0;i<33;i++){const bit=document.createElement('i');bit.style.setProperty('--x',`${Math.random()*100}%`);bit.style.setProperty('--dx',`${(Math.random()-.5)*280}px`);bit.style.setProperty('--size',`${5+Math.random()*7}px`);bit.style.setProperty('--delay',`${Math.random()*.35}s`);bit.style.setProperty('--duration',`${1.2+Math.random()*.9}s`);bit.style.setProperty('--color',colors[i%colors.length]);wrap.append(bit);}
 document.body.append(wrap);setTimeout(()=>wrap.remove(),2600);
 }return{celebrate};})();
