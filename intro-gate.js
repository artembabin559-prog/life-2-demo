/* The landing page stays in place behind a same-origin, disposable intro frame. */
(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const storageKey='life-intro-seen:'+new URL('.',location.href).pathname;
  let seen=false;
  try{seen=sessionStorage.getItem(storageKey)==='1';}catch{}
  if(params.has('skip-intro')||location.hash||(seen&&params.get('intro')!=='1'))return;
  document.documentElement.classList.add('intro-pending');
  let overlay,frame,shell,fallback,ended=false,timeout=0;
  function finish(){
    if(ended)return;ended=true;clearTimeout(timeout);
    window.removeEventListener('message',onMessage);
    document.documentElement.classList.remove('intro-pending');
    if(shell)shell.inert=false;
    try{sessionStorage.setItem(storageKey,'1');}catch{}
    document.dispatchEvent(new Event('life:intro-complete'));
    if(!overlay)return;
    overlay.inert=true;overlay.classList.add('is-leaving');
    const title=document.getElementById('hero-title');
    if(title){title.tabIndex=-1;title.focus({preventScroll:true});}
    const remove=()=>overlay.remove();
    overlay.addEventListener('transitionend',remove,{once:true});
    setTimeout(remove,550);
  }
  function onMessage(event){
    if(event.source!==frame?.contentWindow||event.origin!==location.origin)return;
    if(event.data?.type==='life-intro-ready'){clearTimeout(timeout);fallback.hidden=true;}
    if(event.data?.type==='life-intro-exit'||event.data?.type==='life-intro-error')finish();
  }
  timeout=setTimeout(finish,15000);
  document.addEventListener('DOMContentLoaded',()=>{
    if(ended)return;
    try{
      shell=document.getElementById('site-shell');
      overlay=document.createElement('div');overlay.className='intro-overlay';
      overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
      overlay.setAttribute('aria-label','Вступление жИИзнь 2.0');
      frame=document.createElement('iframe');frame.className='intro-frame';
      frame.title='Интерактивное вступление жИИзнь 2.0';
      frame.src='./intro.html?embedded=1';
      fallback=document.createElement('button');fallback.className='intro-fallback';
      fallback.type='button';fallback.textContent='Сразу на сайт →';fallback.addEventListener('click',finish);
      window.addEventListener('message',onMessage);
      frame.addEventListener('error',finish,{once:true});
      overlay.append(frame,fallback);document.body.append(overlay);
      shell.inert=true;frame.focus();
    }catch{finish();}
  },{once:true});
})();
