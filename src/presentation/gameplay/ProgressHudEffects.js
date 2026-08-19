import { BALL_TYPES } from '../../data/balls';
import { progressPointsFromCoverage } from '../../domains/gameplay/ProgressRules';

/**
 * Owns the animated progress counter, growth token, bank/loss flights, and
 * coin-to-wallet HUD canvas. Gameplay supplies a read-only context callback;
 * this presenter never mutates campaign or economy state outside the explicit
 * progress-bank completion handled by the existing animation contract.
 */
export function createProgressHudEffects(dependencies){
  const {
    canvas,
    hudFxCanvas,
    hudFxCtx,
    ui,
    nativeHapticsAvailable,
    sfx,
    triggerNativeFeedback,
    getContext
  }=dependencies;

  let hudFxHasVisuals=false;
  let progressDisplayValue=0;
  let progressDisplayTarget=0;
  let progressDisplayFrame=0;
  let progressDisplayLast=0;
  let progressMilestoneToastToken=0;
  let lastGrowthIndicatorPoints=-1;
  let growthIndicatorPunchAt=0;
  let progressLossFxToken=0;
  let lastGrowthClearBounds=null;
  ui.gameScreen.dataset.growthRenderer='number-only';

  function writeGameDataset(key,value){
    if(ui.gameScreen.dataset[key]!==value) ui.gameScreen.dataset[key]=value;
  }

  function writeProgressNumber(value){
    const rounded=Math.max(0,Math.min(100,Math.round(value)));
    if(ui.levelProgressValue.textContent!==String(rounded)){
      ui.levelProgressValue.textContent=String(rounded);
    }
    ui.levelGoal.setAttribute('aria-label',`Progress ${rounded} out of 100`);
  }

  function animateProgressNumber(now){
    progressDisplayFrame=0;
    const elapsed=progressDisplayLast ? Math.min(80,now-progressDisplayLast) : 16;
    progressDisplayLast=now;
    const distance=progressDisplayTarget-progressDisplayValue;
    const blend=1-Math.exp(-elapsed/72);
    progressDisplayValue+=distance*blend;

    if(Math.abs(progressDisplayTarget-progressDisplayValue)<.035){
      progressDisplayValue=progressDisplayTarget;
    }
    writeProgressNumber(progressDisplayValue);

    if(progressDisplayValue!==progressDisplayTarget){
      progressDisplayFrame=requestAnimationFrame(animateProgressNumber);
    }else{
      progressDisplayLast=0;
    }
  }

  function setProgressNumber(target,snap=false){
    progressDisplayTarget=Math.max(0,Math.min(100,target));
    if(snap){
      if(progressDisplayFrame) cancelAnimationFrame(progressDisplayFrame);
      progressDisplayFrame=0;
      progressDisplayLast=0;
      progressDisplayValue=progressDisplayTarget;
      writeProgressNumber(progressDisplayValue);
      return;
    }
    if(!progressDisplayFrame){
      progressDisplayFrame=requestAnimationFrame(animateProgressNumber);
    }
  }

  function celebrateProgressStar(index){
    const marker=[ui.progressStar1,ui.progressStar2,ui.progressStar3][index-1];
    if(!marker) return;
    const checkpoint=[33,67,100][index-1];
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors=['#ffd447','#fff7b0','#ffae2c','#ffffff','#71dbff'];

    marker.classList.remove('starHit');
    marker.querySelectorAll('.progressStarBurst').forEach(burst=>burst.remove());
    void marker.offsetWidth;
    marker.classList.add('starHit');
    marker.dataset.celebrations=String(Number(marker.dataset.celebrations||0)+1);

    const burst=document.createElement('span');
    burst.className='progressStarBurst';
    const particleCount=reduceMotion ? 6 : 14;
    for(let particleIndex=0;particleIndex<particleCount;particleIndex++){
      const spark=document.createElement('i');
      spark.style.setProperty('--spark-angle',`${particleIndex*(360/particleCount)}deg`);
      spark.style.setProperty('--spark-distance',`${2.2+(particleIndex%4)*.25}rem`);
      spark.style.setProperty('--spark-color',colors[particleIndex%colors.length]);
      burst.appendChild(spark);
    }
    marker.appendChild(burst);

    ui.progressTrack.classList.remove('milestoneHit');
    void ui.progressTrack.offsetWidth;
    ui.progressTrack.classList.add('milestoneHit');

    const toastToken=++progressMilestoneToastToken;
    ui.progressMilestoneValue.textContent=`${checkpoint} / 100`;
    ui.progressMilestoneToast.classList.remove('show');
    void ui.progressMilestoneToast.offsetWidth;
    ui.progressMilestoneToast.classList.add('show');

    sfx('progressStar');
    void triggerNativeFeedback(index===3 ? 'success' : 'medium');
    if(!nativeHapticsAvailable && navigator.vibrate){
      navigator.vibrate(index===3 ? [24,28,48] : [18,20,28]);
    }

    setTimeout(()=>{
      marker.classList.remove('starHit');
      burst.remove();
    },820);
    setTimeout(()=>ui.progressTrack.classList.remove('milestoneHit'),760);
    setTimeout(()=>{
      if(toastToken===progressMilestoneToastToken){
        ui.progressMilestoneToast.classList.remove('show');
      }
    },1080);
  }

  function syncHudFxCanvas(){
    const rect=ui.gameScreen.getBoundingClientRect();
    // This canvas is an effects layer, not the primary game renderer. Limiting
    // its DPR avoids millions of extra blended pixels on high-density phones.
    const dpr=Math.min(1.5,window.devicePixelRatio||1);
    const nextW=Math.max(1,Math.round(rect.width*dpr));
    const nextH=Math.max(1,Math.round(rect.height*dpr));

    if(hudFxCanvas.width!==nextW || hudFxCanvas.height!==nextH){
      hudFxCanvas.width=nextW;
      hudFxCanvas.height=nextH;
      hudFxCtx.setTransform(dpr,0,0,dpr,0,0);
      lastGrowthClearBounds=null;
    }
    return rect;
  }

  function boardPointToHudFx(x,y,geometry){
    const {width,height}=getContext();
    const canvasRect=geometry?.canvasRect || canvas.getBoundingClientRect();
    const fxRect=geometry?.fxRect || hudFxCanvas.getBoundingClientRect();
    return {
      x:(canvasRect.left - fxRect.left) + (x/width)*canvasRect.width,
      y:(canvasRect.top - fxRect.top) + (y/height)*canvasRect.height
    };
  }

  function progressPercent(coverage){
    return progressPointsFromCoverage(coverage);
  }

  function activeGrowthPoints(){
    const {state}=getContext();
    if(!state?.active) return 0;
    const committed=Math.round(progressPercent(state.coverage));
    const projected=Math.round(progressPercent(Math.max(state.coverage,state.liveCoverage)));
    const measured=Math.max(0,projected-committed);
    state.active.growthDisplayPoints=Math.max(state.active.growthDisplayPoints||0,measured);
    return state.active.growthDisplayPoints;
  }

  function drawGrowthProgressIndicator(){
    const {state,width}=getContext();
    const ball=state?.active;
    if(!ball || !state.running) return;
    const points=activeGrowthPoints();
    const canvasRect=canvas.getBoundingClientRect();
    const fxRect=hudFxCanvas.getBoundingClientRect();
    const center=boardPointToHudFx(ball.x,ball.y,{canvasRect,fxRect});
    const radiusPx=ball.r/width*canvasRect.width;
    const now=performance.now();
    if(points!==lastGrowthIndicatorPoints){
      if(points>lastGrowthIndicatorPoints) growthIndicatorPunchAt=now;
      lastGrowthIndicatorPoints=points;
    }
    writeGameDataset('activeGrowthPoints',String(points));

    const punch=Math.max(0,1-(now-growthIndicatorPunchAt)/150);
    const scale=1+punch*.055;
    const tokenRadius=Math.max(1,radiusPx);
    const fontSize=Math.max(4,Math.min(96,tokenRadius*.58));
    const label=String(points);
    writeGameDataset('growthTokenShape','number-only');
    writeGameDataset('growthTokenDiameter',(tokenRadius*2).toFixed(1));
    writeGameDataset('activeBallDiameter',(radiusPx*2).toFixed(1));

    hudFxCtx.save();
    hudFxCtx.translate(center.x,center.y);
    hudFxCtx.scale(scale,scale);
    hudFxCtx.textAlign='center';
    hudFxCtx.textBaseline='middle';
    hudFxCtx.lineJoin='round';
    hudFxCtx.font=`1000 ${fontSize}px system-ui, sans-serif`;
    hudFxCtx.strokeStyle='rgba(10,39,52,.58)';
    hudFxCtx.lineWidth=Math.max(1.6,fontSize*.16);
    hudFxCtx.shadowColor='rgba(255,255,255,.42)';
    hudFxCtx.shadowBlur=2;
    hudFxCtx.strokeText(label,0,0);
    hudFxCtx.fillStyle='rgba(255,255,255,.78)';
    hudFxCtx.fillText(label,0,0);
    hudFxCtx.restore();
    const visualWidth=Math.max(fontSize*1.8,label.length*fontSize*.72)*scale+12;
    const visualHeight=fontSize*1.45*scale+12;
    return {
      x:center.x-visualWidth/2,
      y:center.y-visualHeight/2,
      width:visualWidth,
      height:visualHeight
    };
  }

  function pulseProgressTotal(points){
    ui.levelGoal.dataset.lastBankedPoints=String(points);
    ui.levelGoal.classList.remove('bankCatch');
    ui.progressTrack.classList.remove('bankDeposit');
    void ui.levelGoal.offsetWidth;
    ui.levelGoal.classList.add('bankCatch');
    ui.progressTrack.classList.add('bankDeposit');
    sfx('coinLand');
    void triggerNativeFeedback('medium');
    setTimeout(()=>{
      ui.levelGoal.classList.remove('bankCatch');
      ui.progressTrack.classList.remove('bankDeposit');
    },620);
  }

  function spawnProgressLossFx(ball,points){
    const lost=Math.max(0,Math.round(points||0));
    const token=++progressLossFxToken;
    const start=boardPointToHudFx(ball.x,ball.y);
    const element=document.createElement('div');
    const strong=document.createElement('strong');
    const small=document.createElement('small');
    element.className='growthLossBurst';
    strong.textContent=lost>0 ? `−${lost}` : 'POPPED';
    small.textContent=lost>0 ? 'PROGRESS LOST' : 'BALL LOST';
    element.append(strong,small);
    element.style.left=`${start.x}px`;
    element.style.top=`${start.y}px`;
    ui.growthBankFxLayer.appendChild(element);

    ui.gameScreen.dataset.lastLostProgress=String(lost);
    ui.gameScreen.dataset.progressLossState='showing';
    ui.progressTrack.classList.remove('progressLost');
    void ui.progressTrack.offsetWidth;
    ui.progressTrack.classList.add('progressLost');

    const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 260 : 900;
    const animation=element.animate([
      {offset:0,opacity:0,transform:'translate(-50%,-50%) scale(.35) rotate(-4deg)'},
      {offset:.18,opacity:1,transform:'translate(-50%,-50%) scale(1.28) rotate(2deg)'},
      {offset:.55,opacity:1,transform:'translate(-50%,-65%) scale(1) rotate(0deg)'},
      {offset:1,opacity:0,transform:'translate(-50%,-135%) scale(.82) rotate(-2deg)'}
    ],{duration,easing:'cubic-bezier(.16,.88,.25,1)',fill:'forwards'});

    animation.finished.catch(()=>{}).then(()=>{
      element.remove();
      if(token!==progressLossFxToken) return;
      ui.progressTrack.classList.remove('progressLost');
      ui.gameScreen.dataset.progressLossState='idle';
    });
  }

  function spawnProgressBankFlight(ball,fromCoverage,toCoverage){
    const fromPct=progressPercent(fromCoverage);
    const toPct=progressPercent(toCoverage);
    const points=Math.max(0,Math.round(toPct)-Math.round(fromPct));
    const {state}=getContext();
    if(points<=0){
      state.bankedProgressPct=toPct;
      setProgressNumber(toPct);
      return;
    }

    const runState=state;
    const start=boardPointToHudFx(ball.x,ball.y);
    const layerRect=ui.growthBankFxLayer.getBoundingClientRect();
    const targetRect=ui.levelGoal.getBoundingClientRect();
    const target={
      x:targetRect.left-layerRect.left+targetRect.width*.5,
      y:targetRect.top-layerRect.top+targetRect.height*.5
    };
    const element=document.createElement('div');
    const strong=document.createElement('strong');
    element.className='growthBankFlight';
    strong.textContent=`+${points}`;
    element.append(strong);
    element.style.left=`${start.x}px`;
    element.style.top=`${start.y}px`;
    const ballStyle=BALL_TYPES[ball.type || 'normal'] || BALL_TYPES.normal;
    element.style.setProperty('--bank-color',ballStyle.highlight || '#73ddff');
    const {width}=getContext();
    const canvasRect=canvas.getBoundingClientRect();
    const ballDiameterPx=Math.max(12,(ball.r/width)*canvasRect.width*2);
    element.style.setProperty('--bank-token-diameter',`${ballDiameterPx}px`);
    ui.gameScreen.dataset.lastBankTokenDiameter=ballDiameterPx.toFixed(1);
    ui.growthBankFxLayer.appendChild(element);

    runState.pendingProgressBanks++;
    ui.gameScreen.dataset.lastBankedPoints=String(points);
    ui.gameScreen.dataset.progressBankState='flying';
    const dx=target.x-start.x;
    const dy=target.y-start.y;
    const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 220 : 680;
    const animation=element.animate([
      {offset:0,opacity:1,transform:'translate(-50%,-50%) scale(1)'},
      {offset:.28,opacity:1,transform:`translate(-50%,-50%) translate(${dx*.18}px,${dy*.12-55}px) scale(1.08) rotate(-4deg)`},
      {offset:.68,opacity:1,transform:`translate(-50%,-50%) translate(${dx*.68}px,${dy*.57-42}px) scale(.82) rotate(2deg)`},
      {offset:1,opacity:.2,transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) scale(.42) rotate(0deg)`}
    ],{duration,easing:'cubic-bezier(.18,.78,.22,1)',fill:'forwards'});

    animation.finished.catch(()=>{}).then(()=>{
      element.remove();
      const {state:currentState}=getContext();
      if(currentState!==runState) return;
      runState.pendingProgressBanks=Math.max(0,runState.pendingProgressBanks-1);
      runState.bankedProgressPct=Math.max(runState.bankedProgressPct,toPct);
      setProgressNumber(runState.bankedProgressPct);
      ui.gameScreen.dataset.progressBankState='landed';
      pulseProgressTotal(points);
      setTimeout(()=>{
        if(getContext().state===runState && runState.pendingProgressBanks===0){
          ui.gameScreen.dataset.progressBankState='idle';
        }
      },520);
    });
  }

  function coinHudFxTarget(){
    const fxRect=hudFxCanvas.getBoundingClientRect();
    const coinRect=ui.gameCoinTarget.getBoundingClientRect();
    return {
      x:(coinRect.left - fxRect.left) + coinRect.width/2,
      y:(coinRect.top - fxRect.top) + coinRect.height/2
    };
  }

  function spawnCoinHudFlight(x,y,duration=.5){
    syncHudFxCanvas();
    const start=boardPointToHudFx(x,y);
    const target=coinHudFxTarget();
    const dx=target.x-start.x;
    const dy=target.y-start.y;
    const len=Math.max(1,Math.hypot(dx,dy));
    const px=-dy/len;
    const py=dx/len;
    const curveModes=[
      {side:-1,spread:.34,lift:.28},
      {side: 1,spread:.38,lift:.22},
      {side:-1,spread:.18,lift:.42},
      {side: 1,spread:.22,lift:.36}
    ];
    const mode=curveModes[Math.floor(Math.random()*curveModes.length)];
    const bend=(70+Math.random()*72)*mode.side;
    const lift=65+Math.random()*70;

    const c1x=start.x + dx*mode.spread + px*bend;
    const c1y=start.y + dy*.18 + py*bend*.42 - lift*mode.lift;
    const c2x=start.x + dx*.72 - px*bend*.38;
    const c2y=start.y + dy*.64 - lift;

    getContext().state.coinFx.push({
      type:'coin',
      x:start.x,
      y:start.y,
      t:0,
      d:duration,
      tx:target.x,
      ty:target.y,
      c1x,c1y,c2x,c2y
    });
  }

  function drawHudFxCoin(x,y,r=13){
    hudFxCtx.save();
    hudFxCtx.translate(x,y);
    hudFxCtx.fillStyle='#f6b327';
    hudFxCtx.strokeStyle='#d99918';
    hudFxCtx.lineWidth=Math.max(1.4,r*.16);
    hudFxCtx.beginPath();
    hudFxCtx.arc(0,0,r,0,Math.PI*2);
    hudFxCtx.fill();
    hudFxCtx.stroke();
    hudFxCtx.fillStyle='#ffd45b';
    hudFxCtx.beginPath();
    hudFxCtx.arc(0,0,r*.72,0,Math.PI*2);
    hudFxCtx.fill();
    hudFxCtx.strokeStyle='rgba(255,255,255,.9)';
    hudFxCtx.lineWidth=Math.max(1,r*.12);
    hudFxCtx.beginPath();
    hudFxCtx.arc(-r*.2,-r*.22,r*.22,0,Math.PI*2);
    hudFxCtx.stroke();
    hudFxCtx.fillStyle='rgba(255,245,185,.95)';
    hudFxCtx.beginPath();
    hudFxCtx.arc(0,0,r*.28,0,Math.PI*2);
    hudFxCtx.fill();
    hudFxCtx.restore();
  }

  function coinFlightPoint(f,t){
    const u=Math.max(0,Math.min(1,t));
    const om=1-u;
    return {
      x:
        om*om*om*f.x +
        3*om*om*u*f.c1x +
        3*om*u*u*f.c2x +
        u*u*u*f.tx,
      y:
        om*om*om*f.y +
        3*om*om*u*f.c1y +
        3*om*u*u*f.c2y +
        u*u*u*f.ty
    };
  }

  function renderHudCoinFx(){
    const {state}=getContext();
    const hasCoinFlights=!!state?.coinFx?.some(effect=>effect.type==='coin');
    const hasGrowthIndicator=!!(state?.active && state.running);
    if(!hasCoinFlights && !hasGrowthIndicator){
      lastGrowthIndicatorPoints=-1;
      writeGameDataset('activeGrowthPoints','0');
      writeGameDataset('growthTokenDiameter','0');
      writeGameDataset('activeBallDiameter','0');
      if(!hudFxHasVisuals) return;
      hudFxCtx.save();
      hudFxCtx.setTransform(1,0,0,1,0,0);
      hudFxCtx.clearRect(0,0,hudFxCanvas.width,hudFxCanvas.height);
      hudFxCtx.restore();
      hudFxHasVisuals=false;
      lastGrowthClearBounds=null;
      return;
    }

    hudFxHasVisuals=true;
    const rect=syncHudFxCanvas();
    if(hasCoinFlights){
      hudFxCtx.clearRect(0,0,rect.width,rect.height);
      lastGrowthClearBounds=null;
    }else if(lastGrowthClearBounds){
      hudFxCtx.clearRect(
        lastGrowthClearBounds.x,
        lastGrowthClearBounds.y,
        lastGrowthClearBounds.width,
        lastGrowthClearBounds.height
      );
    }

    for(const f of state.coinFx){
      if(f.type!=='coin') continue;
      const u=Math.min(1,f.t/f.d);
      const e=1-Math.pow(1-u,2.6);
      const pos=coinFlightPoint(f,e);
      const tail1=coinFlightPoint(f,Math.max(0,e-.075));
      const tail2=coinFlightPoint(f,Math.max(0,e-.15));

      hudFxCtx.save();
      hudFxCtx.lineCap='round';
      hudFxCtx.globalAlpha=.18*(1-u);
      hudFxCtx.strokeStyle='#fff0a6';
      hudFxCtx.lineWidth=11;
      hudFxCtx.beginPath();
      hudFxCtx.moveTo(tail2.x,tail2.y);
      hudFxCtx.quadraticCurveTo(tail1.x,tail1.y,pos.x,pos.y);
      hudFxCtx.stroke();
      hudFxCtx.globalAlpha=.34*(1-u);
      hudFxCtx.strokeStyle='#ffc65e';
      hudFxCtx.lineWidth=5.5;
      hudFxCtx.beginPath();
      hudFxCtx.moveTo(tail2.x,tail2.y);
      hudFxCtx.quadraticCurveTo(tail1.x,tail1.y,pos.x,pos.y);
      hudFxCtx.stroke();
      hudFxCtx.globalAlpha=.42*(1-u);
      hudFxCtx.fillStyle='#fff5b8';
      hudFxCtx.beginPath();
      hudFxCtx.arc(tail2.x,tail2.y,3.2*(1-u)+1,0,Math.PI*2);
      hudFxCtx.fill();
      hudFxCtx.restore();

      drawHudFxCoin(pos.x,pos.y,14*(1-.34*e));
    }

    lastGrowthClearBounds=hasGrowthIndicator ? drawGrowthProgressIndicator() : null;
  }

  function pulseCoinHud(){
    sfx('coinLand');
    ui.gameWalletPill.classList.remove('coinCatch');
    void ui.gameWalletPill.offsetWidth;
    ui.gameWalletPill.classList.add('coinCatch');
    setTimeout(()=>ui.gameWalletPill.classList.remove('coinCatch'),330);
  }

  return {
    celebrateProgressStar,
    clearVisuals(){
      hudFxHasVisuals=false;
      lastGrowthClearBounds=null;
    },
    progressPercent,
    pulseCoinHud,
    renderHudCoinFx,
    resetGrowthIndicator(){ lastGrowthIndicatorPoints=-1; },
    resetVisuals(){
      hudFxHasVisuals=false;
      lastGrowthIndicatorPoints=-1;
      lastGrowthClearBounds=null;
      progressLossFxToken++;
    },
    setProgressNumber,
    spawnCoinHudFlight,
    spawnProgressBankFlight,
    spawnProgressLossFx,
    syncHudFxCanvas
  };
}
