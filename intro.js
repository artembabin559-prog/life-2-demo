/* Numeric portraits: v1 choreography, live pointer light, visitor-controlled exit. */
(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const root=$('#experience'),canvas=$('#scene'),ctx=canvas.getContext('2d',{alpha:false});
  const next=$('#continue'),prompt=$('#scene-prompt'),closing=$('#closing'),status=$('#scene-status');
  const embedded=window.parent!==window&&new URLSearchParams(location.search).get('embedded')==='1';
  function notifyParent(type){if(embedded)window.parent.postMessage({type},location.origin);}
  function openSite(){
    if(siteOpened)return;
    siteOpened=true;clearTimeout(exitTimer);cancelAnimationFrame(raf);raf=0;
    if(embedded)notifyParent('life-intro-exit');
    else location.assign('index.html?skip-intro=1');
  }
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const noise=v=>{const n=Math.sin(v*127.1+311.7)*43758.5453123;return n-Math.floor(n);};
  let width=0,height=0,mobile=false,loaded=false,quiet=media.matches,phase='loading';
  let points=[],columns=[],portraits=[],flow=0,formation=0,exitTime=0;
  let raf=0,lastPaint=0,resizeTimer=0,touchTimer=0,gesture=null;
  let exitTimer=0,exitStarted=0,exitDuration=0,siteOpened=false;
  const pointer={x:-1000,y:-1000,target:0,strength:0};
  const follow={x:0,y:0};
  const photo=new Image(),map=document.createElement('canvas');
  const mapCtx=map.getContext('2d',{willReadFrequently:true});
  const atlas=document.createElement('canvas'),atlasCtx=atlas.getContext('2d');
  const tileW=26,tileH=32,levels=24;
  atlas.width=tileW*10;atlas.height=tileH*levels;

  function makeAtlas(){
    const colors=[[10,32,23],[40,107,71],[116,191,141],[195,239,207],[240,255,244]];
    atlasCtx.font='700 28px Consolas, "Courier New", monospace';
    atlasCtx.textAlign='center';atlasCtx.textBaseline='middle';
    for(let l=0;l<levels;l++){
      const s=l/(levels-1)*4,a=Math.min(3,Math.floor(s)),v=s-a;
      atlasCtx.fillStyle=`rgb(${colors[a].map((c,i)=>Math.round(c+(colors[a+1][i]-c)*v)).join(',')})`;
      for(let n=0;n<10;n++)atlasCtx.fillText(String(n),(n+.5)*tileW,(l+.5)*tileH);
    }
  }
  function glyph(x,y,size,shade,digit,alpha=1){
    if(alpha<.012||y<-size||y>height+size||x<-size||x>width+size)return;
    const dx=x-pointer.x,dy=y-pointer.y,radius=mobile?92:135,dist=dx*dx+dy*dy;
    const hot=pointer.strength&&dist<radius*radius?Math.pow(1-dist/(radius*radius),2)*pointer.strength:0;
    const level=Math.round(clamp(shade+hot*.36)*(levels-1));
    ctx.globalAlpha=clamp(alpha+hot*.40*alpha);
    ctx.drawImage(atlas,digit*tileW,level*tileH,tileW,tileH,x-size*.46,y-size*.58,size*.92,size*1.16);
  }
  function resize(){
    if(!loaded)return;
    width=root.clientWidth;height=root.clientHeight;mobile=width<=700;
    const dpr=Math.min(devicePixelRatio||1,1.75);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;
    if(mobile){
      const size=Math.min(width*1.08,height*.69,590);
      portraits=[{face:1,x:width*.5,y:height*.45,size}];
    }else{
      const size=Math.min(width*.45,height*(height<560?.65:.78),660);
      portraits=[{face:0,x:width/2-size*.51,y:height*.455,size},{face:1,x:width/2+size*.51,y:height*.455,size}];
    }
    const count=mobile?88:104;
    map.width=count;map.height=count;points=[];
    for(const portrait of portraits){
      const face=portrait.face,sourceWidth=photo.naturalWidth/2;
      mapCtx.clearRect(0,0,count,count);
      mapCtx.drawImage(photo,face*sourceWidth,0,sourceWidth,photo.naturalHeight,0,0,count,count);
      const pixels=mapCtx.getImageData(0,0,count,count).data;
      for(let y=0;y<count;y++)for(let x=0;x<count;x++){
        const i=(y*count+x)*4;
        const l=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;
        // Lift real dark fabric detail, retaining the photographed neck and shoulders.
        // No synthetic silhouette or visible image layer is used.
        const fabric=face===0?smooth((y/count-.68)/.16):0;
        const cutoff=.018-fabric*.014;
        if(l<=cutoff)continue;
        const id=y*count+x+face*count*count;
        points.push({portrait,u:(x+.5)/count-.5,v:(y+.5)/count-.5,
          light:Math.pow(l,.55-fabric*.22),opacity:smooth((l-cutoff)/(.015-fabric*.009)),
          seed:noise(id),seed2:noise(id+5.93),phase:noise(x+face*123)*.95+y/count*.45,
          cell:1/count,digit:Math.floor(noise(id+44)*10)});
      }
    }
    const spacing=mobile?13:14;
    columns=Array.from({length:Math.ceil(width/spacing)+2},(_,i)=>({
      x:i*spacing+noise(i)*4,speed:65+noise(i+81)*145,
      offset:noise(i+42)*(height+500),length:16+Math.floor(noise(i+93)*30),
      size:(mobile?9:10)+noise(i+23)*5,alpha:.48+noise(i+18)*.52,seed:i
    }));
    root.dataset.faces=String(portraits.length);
    canvas.setAttribute('aria-label',mobile?'В потоке цифр появляется портрет человека в капюшоне. Цифры подсвечиваются при касании.':'В потоке цифр появляются два портрета в очках. У женщины видны воротник водолазки и плечи. Цифры подсвечиваются рядом с курсором.');
    draw();
  }
  function rain(){
    const assembled=smooth((formation-2.4)/3.5);
    const leaving=phase==='leaving';
    const intensity=(1-assembled*.65+(leaving?smooth(exitTime/1.8)*.18:0))*(1-smooth((exitTime-2.5)/.9));
    const opening=quiet?1:smooth(flow/.85);
    for(const col of columns){
      const cycle=height+col.length*14+200;
      const head=(flow*col.speed+col.offset)%cycle-col.length*14;
      for(let row=0;row<col.length;row++){
        const y=head-row*14,tail=1-row/col.length;
        const shade=row===0?.98:.38+tail*.30;
        const digit=Math.floor(noise(col.seed*997+row*17+Math.floor(flow*(row===0?12:2)))*10);
        glyph(col.x,y,col.size,shade,digit,Math.pow(tail,1.65)*col.alpha*intensity*opening);
      }
    }
  }
  function faces(){
    if(formation<2.2)return;
    const breath=quiet?0:Math.sin(flow*.85)*.004;
    for(const p of points){
      const arrive=quiet?1:smooth((formation-2.2-p.phase)/2.7);
      if(arrive<.002)continue;
      const release=phase==='leaving'?(quiet?1:smooth((exitTime-p.phase*.5)/1.85)):0;
      if(release>.998)continue;
      const fall=Math.pow(1-arrive,2.7),size=p.portrait.size*(1+breath);
      let x=p.portrait.x+p.u*size+Math.sin(p.u*32+p.portrait.face*4)*28*fall;
      let y=p.portrait.y+p.v*size-(height+size*.2)*fall;
      x+=(p.seed-.5)*release*release*65;
      y+=release*release*(height*.95+size*.3)*(1+p.seed2*.2);
      const stable=arrive*(1-release);
      if(!quiet){
        x+=follow.x*(2+p.light*5)*stable+Math.sin(p.v*12+flow*.7)*.45*stable;
        y+=follow.y*(1+p.light*3)*stable;
      }
      const tick=Math.floor(flow*(p.seed>.9?2.3:.48)+p.seed2*10);
      const shimmer=quiet?1:1+Math.sin(flow*1.8+p.seed*30)*.045;
      const alpha=smooth(arrive*2)*(1-release)*clamp(.9+p.light*.2)*p.opacity;
      glyph(x,y,size*p.cell*1.12,p.light*shimmer*1.15+release*.15,(p.digit+tick)%10,alpha);
    }
  }
  function setPhase(value){
    phase=value;root.dataset.phase=value;
    prompt.hidden=value!=='explore';
    next.hidden=value!=='explore'||(!quiet&&formation<7.4);
    if(value==='explore')status.textContent='Портреты появились. Можно исследовать цифры курсором. Нажмите «Продолжить», чтобы открыть сайт.';
  }
  function draw(){
    if(!loaded)return;
    ctx.globalAlpha=1;ctx.fillStyle='#050a08';ctx.fillRect(0,0,width,height);
    rain();faces();ctx.globalAlpha=1;
    if(phase==='leaving'){
      const logo=quiet?1:smooth((exitTime-2.45)/.95);
      closing.style.opacity=String(logo);
      closing.style.transform=quiet?'none':`translateY(${(1-logo)*14}px)`;
    }
  }
  function frame(now){
    raf=0;
    if(!loaded||document.hidden||siteOpened)return;
    if(quiet&&phase!=='leaving'){draw();return;}
    if(now-lastPaint<1000/(mobile?30:45)){raf=requestAnimationFrame(frame);return;}
    const dt=Math.min((now-lastPaint)/1000,1);lastPaint=now;
    if(!quiet){flow+=dt;formation=Math.min(8,formation+dt);}
    if(phase==='forming'&&formation>=6.6)setPhase('explore');
    if(phase==='explore'&&next.hidden&&formation>=7.4)next.hidden=false;
    if(phase==='leaving'){
      exitTime=(now-exitStarted)/1000;
      if(exitTime>=exitDuration){openSite();return;}
    }
    pointer.strength+=(pointer.target-pointer.strength)*Math.min(dt*8,1);
    const tx=pointer.target?(pointer.x/width-.5)*2:0,ty=pointer.target?(pointer.y/height-.5)*2:0;
    follow.x+=(tx-follow.x)*Math.min(dt*3,1);follow.y+=(ty-follow.y)*Math.min(dt*3,1);
    draw();raf=requestAnimationFrame(frame);
  }
  function start(){
    if(raf||!loaded||document.hidden||siteOpened)return;
    lastPaint=performance.now();raf=requestAnimationFrame(frame);
  }
  function enter(){
    if(phase!=='explore')return;
    setPhase('leaving');exitTime=0;closing.hidden=false;
    exitStarted=performance.now();exitDuration=quiet?1.1:4.15;
    // Navigation must complete even when the browser pauses canvas frames.
    exitTimer=setTimeout(openSite,exitDuration*1000);
    status.textContent='жИИзнь 2.0. Открываем сайт.';
    draw();start();
  }
  function updateMotion(){
    root.classList.toggle('quiet',quiet);
    if(quiet&&loaded&&phase==='forming'){formation=7;flow=Math.max(flow,7);setPhase('explore');}
    if(quiet){if(phase==='explore')next.hidden=false;pointer.strength=pointer.target;draw();}
    start();
  }
  function move(event){
    const rect=canvas.getBoundingClientRect();
    pointer.x=event.clientX-rect.left;pointer.y=event.clientY-rect.top;pointer.target=1;
    if(gesture&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>8)gesture.moved=true;
    if(quiet){pointer.strength=1;draw();}
  }
  canvas.addEventListener('pointermove',move,{passive:true});
  canvas.addEventListener('pointerdown',event=>{
    gesture={x:event.clientX,y:event.clientY,moved:false};clearTimeout(touchTimer);move(event);
  },{passive:true});
  canvas.addEventListener('pointerup',event=>{
    if(gesture&&!gesture.moved&&event.isPrimary&&event.button===0)enter();
    gesture=null;
    if(event.pointerType==='touch')touchTimer=setTimeout(()=>{pointer.target=0;if(quiet){pointer.strength=0;draw();}},650);
  });
  canvas.addEventListener('pointercancel',()=>{gesture=null;pointer.target=0;});
  canvas.addEventListener('pointerleave',()=>{gesture=null;pointer.target=0;if(quiet){pointer.strength=0;draw();}});
  next.addEventListener('click',enter);
  document.querySelectorAll('.header a').forEach(link=>link.addEventListener('click',event=>{
    if(embedded){event.preventDefault();openSite();}
  }));
  media.addEventListener('change',event=>{quiet=event.matches;updateMotion();});
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,120);});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();
  });
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;clearTimeout(exitTimer);clearTimeout(touchTimer);clearTimeout(resizeTimer);});
  window.addEventListener('pageshow',event=>{
    if(event.persisted&&loaded){siteOpened=false;exitTime=0;formation=7;closing.hidden=true;setPhase('explore');draw();start();}
  });
  function fail(){
    cancelAnimationFrame(raf);raf=0;loaded=false;setPhase('error');
    status.classList.remove('loaded');status.textContent='Не удалось загрузить вступление. Откройте страницу по ссылке «Сразу на сайт».';
    notifyParent('life-intro-error');
  }
  photo.onload=()=>{
    try{
      makeAtlas();loaded=true;setPhase('forming');
      status.classList.add('loaded');status.textContent='Вступление загружено.';
      if(quiet){formation=7;flow=7;setPhase('explore');}
      resize();updateMotion();start();notifyParent('life-intro-ready');
    }catch{fail();}
  };
  photo.onerror=fail;
  if(ctx&&mapCtx&&atlasCtx)photo.src='portraits.png';else fail();
})();
