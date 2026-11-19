(() => {
  'use strict';
  const menuButton=document.querySelector('.menu-toggle');
  const mobileNav=document.getElementById('mobile-nav');
  function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Открыть меню');mobileNav.hidden=true;}
  menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!open));menuButton.setAttribute('aria-label',open?'Открыть меню':'Закрыть меню');mobileNav.hidden=open;});
  mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!mobileNav.hidden){closeMenu();menuButton.focus();}});
  const desktopMedia=matchMedia('(min-width:801px)');
  desktopMedia.addEventListener('change',event=>{if(event.matches)closeMenu();});

  function revealWeekFromHash(){
    const week=document.getElementById(location.hash.slice(1));
    if(week?.matches('details.week'))week.open=true;
  }
  document.querySelectorAll('[data-open-week]').forEach(link=>link.addEventListener('click',()=>{
    const week=document.getElementById(link.dataset.openWeek);
    week.open=true;
  }));
  window.addEventListener('hashchange',revealWeekFromHash);
  revealWeekFromHash();

  const areas=Array.from(document.querySelectorAll('input[name="area"]'));
  const sectors=Array.from(document.querySelectorAll('[data-sector]'));
  const status=document.getElementById('selection-status');
  const wheelCount=document.getElementById('wheel-count');
  const wheel=document.querySelector('.balance-wheel');
  function sizeWheelLabels(){
    const width=wheel.getBoundingClientRect().width;
    if(width>0){
      wheel.style.setProperty('--wheel-label-size',`${16*500/width}px`);
      wheel.style.setProperty('--wheel-note-size',`${16*500/width}px`);
      wheel.style.setProperty('--wheel-center-size',`${18*500/width}px`);
    }
  }
  sizeWheelLabels();
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(sizeWheelLabels).observe(wheel);
  else window.addEventListener('resize',sizeWheelLabels);
  const examples=document.getElementById('task-examples');
  const taskExamples=[
    'Собрать договорённости и следующие шаги из записей встречи.',
    'Превратить голосовые заметки в план недели с учётом расписания.',
    'Найти регулярные платежи в выписке и посчитать стоимость подписок.',
    'Подготовить план обустройства комнаты с учётом размеров и бюджета.',
    'Собрать комплекты из своих вещей и список того, чего не хватает.',
    'Собрать семейную историю или придумать игру для ребёнка.',
    'Настроить помощника для регулярной практики языка.',
    'Собрать маршрут поездки с учётом бюджета и предпочтений.',
    'Разложить обследования по датам и подготовиться к приёму врача.'
  ];
  let selected=[];
  try{const saved=JSON.parse(localStorage.getItem('life-demo-areas')||'[]');if(Array.isArray(saved))selected=[...new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<9))].slice(0,3);}catch{}
  function renderSelection(persist){
    areas.forEach((input,i)=>{input.checked=selected.includes(i);input.disabled=selected.length===3&&!input.checked;input.closest('label').classList.toggle('is-unavailable',input.disabled);sectors[i].classList.toggle('active',input.checked);});
    wheelCount.textContent=`${selected.length} из 3 сфер`;
    status.textContent=selected.length===3?'Выбрано 3 из 3. Снимите один выбор, чтобы отметить другую сферу.':`Выбрано ${selected.length} из 3 направлений`;
    examples.replaceChildren();
    (selected.length?selected.map(i=>taskExamples[i]):['Отметьте близкие вам сферы — здесь появятся примеры задач.']).forEach(text=>{const li=document.createElement('li');li.textContent=text;examples.append(li);});
    if(persist){try{localStorage.setItem('life-demo-areas',JSON.stringify(selected));}catch{}}
  }
  function toggleArea(index){
    if(selected.includes(index))selected=selected.filter(n=>n!==index);
    else if(selected.length<3)selected.push(index);
    else{status.textContent='Можно выбрать до трёх сфер. Снимите один из выбранных пунктов.';return;}
    renderSelection(true);
  }
  areas.forEach((input,i)=>input.addEventListener('change',()=>toggleArea(i)));
  sectors.forEach((sector,i)=>sector.addEventListener('click',()=>toggleArea(i)));
  renderSelection(false);

  const enrollment=document.getElementById('enroll-notice');
  function showEnrollment(){const isPro=document.querySelector('input[name="tariff"]:checked').value==='pro';enrollment.hidden=false;enrollment.textContent=`Вы выбрали ${isPro?'тариф для участников PRO — 15 000 ₽':'общий тариф — 20 000 ₽'}. Это демо-версия: запись и оплата пока не подключены. Заявка не отправлена.`;}
  document.getElementById('enroll-button').addEventListener('click',showEnrollment);
  document.querySelectorAll('input[name="tariff"]').forEach(input=>input.addEventListener('change',()=>{if(!enrollment.hidden)showEnrollment();}));

  document.querySelectorAll('[data-image-slot]').forEach(slot=>{
    const record=window.LIFE_IMAGES?.[slot.dataset.imageSlot];
    if(!record?.src)return;
    const img=new Image();img.alt=record.alt||'';img.loading='lazy';img.decoding='async';img.style.objectPosition=record.position||'center';
    img.addEventListener('load',()=>{slot.classList.add('has-image');slot.removeAttribute('aria-label');});
    img.addEventListener('error',()=>{img.remove();slot.classList.add('image-error');});
    img.src=record.src;slot.append(img);
  });

  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let entrance;
  function playEntrance(){
    if(!window.gsap||reducedMotion.matches)return;
    entrance=gsap.timeline({defaults:{ease:'expo.out'}});
    entrance.fromTo('.hero-wordmark>span',{rotationX:-35,y:15},{rotationX:0,y:0,duration:1.15,stagger:.07,clearProps:'transform'},0)
      .fromTo('.start-stamp',{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)',duration:.9,clearProps:'clipPath'},.22);
  }
  if(document.documentElement.classList.contains('intro-pending'))document.addEventListener('life:intro-complete',playEntrance,{once:true});
  else playEntrance();
  reducedMotion.addEventListener('change',event=>{if(event.matches&&entrance)entrance.progress(1).kill();});
})();
