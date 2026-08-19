import { BALL_TYPES } from '../../data/balls';
import { BOOSTERS } from '../../data/boosters';
import { BOSS_LEVELS, bossProfileForLevel, worldProfileForLevel } from '../../data/encounters';
import { formatCoinAmount, roundCoinAmount } from '../../data/economy';
import {
  ballFitsAt as canPlaceBallAt,
  distance as dist,
  followPointerTarget as followPointerWithinArena,
  growBallIntoAvailableSpace as growBallWithFit,
  maxGrowthRadius as calculateMaxGrowthRadius
} from '../../game/systems/GrowthSystem';

export function createLegacyGameplaySession(dependencies){
  const {
    canvas,
    hudFxCanvas,
    hudFxCtx,
    boosterCooldowns,
    START_TIME,
    START_BALLS,
    MAX_COINS,
    COIN_RADIUS,
    FRENZY_MAX_COINS,
    BALL_MIN,
    BALL_COVERAGE_GROWTH,
    TARGET,
    nativeHapticsAvailable,
    applyGrowthBurst,
    computeCoverage,
    finalizeFinish,
    measureCoverage,
    progressPercent,
    pulseCoinHud,
    spawnCoinHudFlight,
    spawnProgressBankFlight,
    spawnProgressLossFx,
    showBoosterFeedback,
    syncUI,
    sfx,
    startGrowSound,
    stopGrowSound,
    updateGrowSound,
    beginNativeGrowthFeedback,
    endNativeGrowthFeedback,
    pulseNativeGrowthFeedback,
    triggerNativeFeedback,
    clearHudFxVisuals,
    dismissLevelGuide,
    resetGrowthIndicator,
    finish
  }=dependencies;
  const ui={
    boardWrap:dependencies.boardWrap,
    coins:dependencies.coinsElement,
    defeatPrelude:dependencies.defeatPrelude,
    gameScreen:dependencies.gameScreen
  };
  let W=600;
  let H=600;
  let state=null;
  let currentLevel=1;
  let selectedBallType='normal';
  let starterPackOpened=false;
  const heldPointer={
    active:false,
    x:0,
    y:0,
    isTouch:false,
    pointerId:null,
    restartPending:false
  };

  function clearHeldPointer(){
    heldPointer.active=false;
    heldPointer.pointerId=null;
    heldPointer.restartPending=false;
  }

  function syncContext(){
    const context=dependencies.getContext();
    if(state && state!==context.state) clearHeldPointer();
    W=context.width;
    H=context.height;
    state=context.state;
    currentLevel=context.currentLevel;
    selectedBallType=context.selectedBallType;
    starterPackOpened=context.starterPackOpened;
  }

  function spawnEnemy(x,y,vx,vy,opts={}){
    state.enemies.push({
      x,y,vx,vy,
      r:opts.r ?? 17,
      boss:!!opts.boss,
      miniBoss:!!opts.miniBoss,
      minion:!!opts.minion,
      bossIndex:opts.bossIndex || 0,
      worldIndex:opts.worldIndex || opts.bossIndex || 1,
      maxSpeed:opts.maxSpeed ?? Math.hypot(vx,vy),
      seekStrength:opts.seekStrength ?? 0.2,
      trail:[],
      trailTimer:0
    });
  }

  function randomPoint(m=34){
    return {x:m+Math.random()*(W-2*m), y:m+Math.random()*(H-2*m)};
  }

  function spawnCoin(forceFrenzy=false){
    if(!state) return;
    if(!state.running && starterPackOpened) return;

    // Normal rule: never more than 2 active coins.
    // Frenzy temporarily allows a much larger pool.
    const maxNow = (forceFrenzy || state.frenzyLeft > 0) ? FRENZY_MAX_COINS : MAX_COINS;
    if(state.coins.length >= maxNow) return;

    const coinR=COIN_RADIUS;

    // A coin may ONLY spawn in genuinely empty space:
    // not over locked balls, not over the active ball, not on enemies,
    // and not on top of another coin.
    for(let tries=0;tries<90;tries++){
      const p=randomPoint(COIN_RADIUS+18);

      const overlapsPlaced = state.placed.some(
        b => dist(p.x,p.y,b.x,b.y) < b.r + coinR + 10
      );

      const overlapsActive = state.active
        ? dist(p.x,p.y,state.active.x,state.active.y) < state.active.r + coinR + 10
        : false;

      const tooCloseEnemy = state.enemies.some(
        e => dist(p.x,p.y,e.x,e.y) < e.r + coinR + 22
      );

      const overlapsCoin = state.coins.some(
        c => dist(p.x,p.y,c.x,c.y) < c.r + coinR + 12
      );

      if(!overlapsPlaced && !overlapsActive && !tooCloseEnemy && !overlapsCoin){
        state.coins.push({
          x:p.x,
          y:p.y,
          r:coinR,
          pulse:Math.random()*6,
          frenzy:(forceFrenzy || state.frenzyLeft > 0)
        });
        return;
      }
    }

    // If the board is extremely full, simply wait for space to become available.
    // Never force a coin to overlap an existing ball.
  }

  function pointerPos(ev){
    const r=canvas.getBoundingClientRect();
    const touch = ev.touches?.[0] || ev.changedTouches?.[0];
    const clientX = touch ? touch.clientX : ev.clientX;
    const clientY = touch ? touch.clientY : ev.clientY;
    return {
      x:(clientX-r.left)*W/r.width,
      y:(clientY-r.top)*H/r.height
    };
  }

  function beginBallAt(p,{isTouch=false,pointerId=null,continued=false}={}){
    if(!state.running || state.active || state.ballsLeft<=0) return false;

    const typeData=BALL_TYPES[selectedBallType] || BALL_TYPES.normal;
    const startR=BALL_MIN*(typeData.startSizeMult || 1);
    const startX=Math.max(startR,Math.min(W-startR,p.x));
    const startY=Math.max(startR,Math.min(H-startR,p.y));

    // A press on an existing ball must not spend a ball or create an
    // overlapping active circle. Keep the hold alive so moving into open
    // space can begin growth without requiring another tap.
    if(!canPlaceBallAt(startX,startY,startR,state.placed,W,H)){
      ui.gameScreen.dataset.spawnBlocked='true';
      state.message='Move to open space';
      state.messageT=.35;
      syncUI();
      return false;
    }

    dismissLevelGuide();
    ui.gameScreen.dataset.spawnBlocked='false';
    const shieldCharges=Math.max(0,Math.floor(typeData.shieldHits || (selectedBallType==='shield' ? 1 : 0)));
    state.active={
      x:startX,
      y:startY,
      pointerTargetX:startX,
      pointerTargetY:startY,
      pointerStartX:startX,
      pointerStartY:startY,
      pointerMoveThreshold:6*H/canvas.getBoundingClientRect().height,
      pointerFollowActive:false,
      followRate:isTouch ? 20 : 24,
      r:startR,
      startR,
      alive:true,
      type:selectedBallType,
      shieldHits:shieldCharges,
      maxShieldHits:shieldCharges,
      shieldCooldown:0,
      shieldFlash:0,
      enemyGraceLeft:continued ? .22 : 0,
      ghostLeft:typeData.ghostTime || 0,
      growthAge:0,
      spawnPunch:1,
      hapticTravel:0,
      hapticGrowthStepR:startR+Math.max(9,startR*.16)
    };

    if(state.instantGrowReady && applyGrowthBurst(state.active)){
      state.instantGrowReady=false;
      showBoosterFeedback('instantGrow','BALL GREW');
    }

    canvas.classList.add('growthPressed');
    setTimeout(()=>canvas.classList.remove('growthPressed'),170);

    // Heavy press feedback without moving the camera.
    const impactColor=typeData.highlight || '#ffffff';
    addImpactRing(state.active.x,state.active.y,impactColor,continued ? 72 : 105);
    addImpactRing(state.active.x,state.active.y,typeData.edge || '#3990ba',continued ? 48 : 68);
    flashScreen(impactColor,continued ? .025 : .045);
    sfx('ballStart');
    startGrowSound();
    void beginNativeGrowthFeedback();

    if(!state.tutorialActive && BOSS_LEVELS.includes(currentLevel)){
      const boss=state.enemies.find(e=>e.boss);
      if(boss){
        const dx=state.active.x-boss.x;
        const dy=state.active.y-boss.y;
        const d=Math.max(1,Math.hypot(dx,dy));
        const chargeSpeed=(boss.maxSpeed || 180)*1.34;
        boss.vx=dx/d*chargeSpeed;
        boss.vy=dy/d*chargeSpeed;
        state.predatorBurstLeft=2.4;
        state.bossFlashT=.38;
        state.bossEffectText='🎯 BOSS CHARGE • INCOMING!';
        state.bossEffectT=2.4;
      }
    }

    state.ballsLeft--;
    state.ballsUsed++;
    state.message=continued ? 'Keep growing!' : 'Growing… collect coins!';
    state.messageT=.7;
    if(pointerId!==null) canvas.setPointerCapture?.(pointerId);
    syncUI();
    return true;
  }

  function startBall(ev){
    if(!state.running) return;
    ev.preventDefault();
    const p=pointerPos(ev);
    heldPointer.active=true;
    heldPointer.x=p.x;
    heldPointer.y=p.y;
    heldPointer.isTouch=ev.pointerType==='touch' || !!ev.touches;
    heldPointer.pointerId=ev.pointerId ?? null;
    heldPointer.restartPending=false;
    beginBallAt(p,{
      isTouch:heldPointer.isTouch,
      pointerId:heldPointer.pointerId
    });
  }

  function moveBall(ev){
    if(!state.running) return;
    ev.preventDefault();
    const p=pointerPos(ev);
    if(heldPointer.active){
      heldPointer.x=p.x;
      heldPointer.y=p.y;
    }
    if(!state.active){
      if(heldPointer.active && state.ballsLeft>0){
        beginBallAt(p,{
          isTouch:heldPointer.isTouch,
          pointerId:heldPointer.pointerId,
          continued:true
        });
      }
      return;
    }
    const b=state.active;
    if(!b.pointerFollowActive){
      b.pointerFollowActive=dist(p.x,p.y,b.pointerStartX,b.pointerStartY)>=b.pointerMoveThreshold;
    }
    b.pointerTargetX=p.x;
    b.pointerTargetY=p.y;

  }

  function followPointerTarget(ball,dt){
    const previousX=ball.x;
    const previousY=ball.y;
    followPointerWithinArena(ball,dt,W,H,state.placed);
    const movement=dist(previousX,previousY,ball.x,ball.y);
    if(movement>.05){
      ball.hapticTravel=(ball.hapticTravel||0)+movement;
      if(ball.hapticTravel>=11){
        ball.hapticTravel%=11;
        void pulseNativeGrowthFeedback('move');
      }
    }
  }

  function lockBall(ev){
    clearHeldPointer();
    if(!state.active || !state.running) return;
    ev?.preventDefault?.();

    // Releasing commits the ball. Only now is its area added to progress.
    const lockedBall={...state.active};
    const coverageBeforeLock=state.coverage;
    state.placed.push(lockedBall);
    stopGrowSound();
    void endNativeGrowthFeedback('locked');
    sfx('growthFinish');
    state.active=null;
    computeCoverage();
    spawnProgressBankFlight(lockedBall,coverageBeforeLock,state.coverage);

    state.message='Locked!';
    state.messageT=.45;
    sfx('lock');
    const locked=state.placed[state.placed.length-1];
    if(locked){
      const lockedStyle=BALL_TYPES[locked.type || 'normal'] || BALL_TYPES.normal;
      addImpactRing(locked.x,locked.y,lockedStyle.edge || '#3990ba',48);
    }
    if(state.coverage>=TARGET) finish(true);
    else if(state.ballsLeft<=0) finish(false);
    syncUI();
  }

  function popActive(){
    if(!state.active) return;
    const b=state.active;
    const shouldContinueHold=heldPointer.active && state.ballsLeft>0;
    const liveLostPoints=Math.max(
      0,
      Math.round(progressPercent(state.liveCoverage))-Math.round(progressPercent(state.coverage))
    );
    const lostPoints=Math.max(liveLostPoints,b.growthDisplayPoints||0);
    stopGrowSound(true);
    void endNativeGrowthFeedback('hit');
    state.active=null;
    // Live coverage is only a preview. A popped ball contributes nothing, so
    // return every progress surface to the last banked coverage immediately.
    state.liveCoverage=state.coverage;
    state.liveCoverageTimer=0;
    state.uiSyncTimer=0;
    ui.gameScreen.dataset.activeGrowthPoints='0';
    resetGrowthIndicator();
    for(let i=0;i<13;i++){
      state.coinFx.push({
        type:'pop',x:b.x,y:b.y,
        vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*220,
        life:.45,r:3+Math.random()*4
      });
    }
    state.message='BAM!';
    state.messageT=.7;
    sfx('hitBam');
    addScreenShake(7,.20);
    flashScreen('#ff8b8b',.08);
    addImpactRing(b.x,b.y,'#ff8b8b',70);
    spawnProgressLossFx(b,lostPoints);
    syncUI();
    if(state.ballsLeft<=0) finish(false);
    else if(shouldContinueHold) heldPointer.restartPending=true;
  }

  function activeShieldBoundary(ball,shieldHits=ball?.shieldHits||0){
    const layers=Math.max(0,Math.floor(shieldHits||0));
    return (ball?.r||0)+(layers>0 ? 10+(layers-1)*8 : 0);
  }

  function bounceEnemyFromActive(enemy,ball,padding=7,boundaryRadius=activeShieldBoundary(ball)){
    const dx=enemy.x-ball.x, dy=enemy.y-ball.y;
    const rawDistance=Math.hypot(dx,dy);
    let nx,ny;
    if(rawDistance>.001){
      nx=dx/rawDistance;
      ny=dy/rawDistance;
    }else{
      const velocity=Math.hypot(enemy.vx,enemy.vy);
      nx=velocity>.001 ? enemy.vx/velocity : 1;
      ny=velocity>.001 ? enemy.vy/velocity : 0;
    }
    enemy.x=ball.x+nx*(boundaryRadius+enemy.r+padding);
    enemy.y=ball.y+ny*(boundaryRadius+enemy.r+padding);
    const speed=Math.max(105,Math.hypot(enemy.vx,enemy.vy));
    enemy.vx=nx*speed;
    enemy.vy=ny*speed;
  }

  function collectCoins(ball){
    // During frenzy the magnet system owns coin movement/collection.
    if(state.frenzyLeft>0) return;

    for(let i=state.coins.length-1;i>=0;i--){
      const c=state.coins[i];
      if(dist(ball.x,ball.y,c.x,c.y) <= ball.r+c.r){
        collectCoinAtIndex(i,c.x,c.y);

        // Strict normal rule: only a collected coin permits a replacement.
        setTimeout(()=>{
          if(state?.running && state.frenzyLeft<=0 && state.coins.length < MAX_COINS) spawnCoin();
        }, 250+Math.random()*300);
      }
    }
  }

  function maxGrowthRadius(ball){
    return calculateMaxGrowthRadius(ball,state.placed,W,H,BALL_MIN);
  }

  function growBallIntoAvailableSpace(ball,desiredR,shiftLimit){
    return growBallWithFit(ball,desiredR,state.placed,W,H,shiftLimit);
  }

  function frenzyMagnetTarget(){
    // Prefer the actively growing ball. If there isn't one, use the largest locked ball.
    if(state.active) return state.active;
    if(state.placed.length){
      return state.placed.reduce((best,b)=>!best || b.r>best.r ? b : best, null);
    }
    return {x:W/2,y:H/2,r:18};
  }

  function collectCoinAtIndex(i, x, y){
    state.coins.splice(i,1);
    const typeData=BALL_TYPES[selectedBallType] || BALL_TYPES.normal;
    const value=(typeData.coinMult || 1) * (state.toxicLeft>0 ? 0.5 : 1);
    state.scoreCoins=roundCoinAmount(state.scoreCoins+value);
    sfx('coinPickup');

    spawnCoinPickupSpark(x,y);
    spawnCoinHudFlight(x,y,.48+Math.random()*.16);
    const gain=ui.coins.closest('.runGain');
    gain?.classList.remove('gainPop');
    if(gain) void gain.offsetWidth;
    gain?.classList.add('gainPop');
    state.message=`+${formatCoinAmount(value)} coin`;
    state.messageT=.35;
  }

  function spawnCoinPickupSpark(x,y){
    const palette=['#fff6a8','#ffd84d','#ffb41f','#ffffff'];
    for(let index=0;index<18;index++){
      const angle=index*Math.PI*2/18+(Math.random()-.5)*.18;
      const speed=95+Math.random()*185;
      const life=.42+Math.random()*.25;
      state.coinFx.push({
        type:'coinSpark',
        x,y,
        vx:Math.cos(angle)*speed,
        vy:Math.sin(angle)*speed,
        life,
        maxLife:life,
        r:2.5+Math.random()*4,
        rotation:angle,
        spin:(Math.random()-.5)*11,
        color:palette[index%palette.length]
      });
    }
    addImpactRing(x,y,'#ffd447',58);
  }

  function addScreenShake(power=6,duration=.22){
    state.shakePower=Math.max(state.shakePower,power);
    state.shakeT=Math.max(state.shakeT,duration);
  }

  function flashScreen(color='#ffffff',duration=.15){
    state.screenFlashColor=color;
    state.screenFlashT=Math.max(state.screenFlashT,duration);
  }

  function addImpactRing(x,y,color='#ffffff',maxR=80){
    state.impactRings.push({x,y,r:8,maxR,life:1,color});
  }

  function shieldLayerColor(type,layerIndex){
    if(type==='apex') return layerIndex===0 ? '#78ebff' : '#f06de0';
    if(type==='cataclysm') return layerIndex===0 ? '#8fe9ff' : '#ffb657';
    if(type==='gaia') return layerIndex===0 ? '#b9f59f' : '#63dfa0';
    return layerIndex===0 ? '#d8f4ff' : '#a8aef7';
  }

  function spawnShieldBreakFx(ball,chargesBeforeHit){
    const brokenLayer=Math.max(0,chargesBeforeHit-1);
    const breakRadius=activeShieldBoundary(ball,chargesBeforeHit);
    const mainColor=shieldLayerColor(ball.type,brokenLayer);
    const palette=[mainColor,'#ffffff','#9cecff','#b9bfff'];
    const particleCount=26+brokenLayer*8;

    for(let index=0;index<particleCount;index++){
      const angle=index*Math.PI*2/particleCount+(Math.random()-.5)*.12;
      const speed=115+Math.random()*185+brokenLayer*25;
      const life=.42+Math.random()*.24;
      state.coinFx.push({
        type:'shieldShard',
        x:ball.x+Math.cos(angle)*breakRadius,
        y:ball.y+Math.sin(angle)*breakRadius,
        vx:Math.cos(angle)*speed,
        vy:Math.sin(angle)*speed,
        life,
        maxLife:life,
        r:2.8+Math.random()*4.2,
        rotation:angle,
        spin:(Math.random()-.5)*12,
        color:palette[index%palette.length]
      });
    }

    addImpactRing(ball.x,ball.y,mainColor,breakRadius+50);
    addImpactRing(ball.x,ball.y,'#ffffff',breakRadius+30);
  }

  function triggerBossAbility(){
    const profile=bossProfileForLevel(currentLevel);
    if(!profile) return;

    const bossIndex=Math.floor(currentLevel/20);
    state.bossFlashT=.55;
    sfx('boss');
    const castProfile=worldProfileForLevel(currentLevel);
    flashScreen(castProfile.edge,.12);
    const bossEntity=state.enemies.find(e=>e.boss);
    if(bossEntity) addImpactRing(bossEntity.x,bossEntity.y,castProfile.edge,110);

    if(bossIndex===1){
      state.predatorBurstLeft=3.0;
      state.bossEffectT=3.0;
      state.bossEffectText='🎯 HUNTER FRENZY • BOSS OVERDRIVE';
    }else if(bossIndex===2){
      state.frostDebuffLeft=4.0;
      state.bossEffectT=4.0;
      state.bossEffectText='❄ FROST CURSE • GROWTH -60%';
    }else if(bossIndex===3){
      state.timeLeft=Math.max(0,state.timeLeft-4);
      state.bossEffectT=2.5;
      state.bossEffectText='⏳ TIME RIP • -4.0 SECONDS';
    }else if(bossIndex===4){
      state.minionSurgeLeft=4.0;
      state.bossEffectT=4.0;
      state.bossEffectText='⚡ MINION SURGE • MINIONS ENRAGED';

      // Immediate kick so the effect is impossible to miss.
      for(const e of state.enemies){
        if(!e.minion) continue;
        e.vx*=1.22;
        e.vy*=1.22;
      }
    }else if(bossIndex===5){
      state.boosterLockLeft=5.0;
      state.bossEffectT=5.0;
      state.bossEffectText='◈ VOID SILENCE • BOOSTERS LOCKED';
    }else if(bossIndex===6){
      state.enemyGrowLeft=4.0;
      state.bossEffectT=4.0;
      state.bossEffectText='🌿 OVERGROWTH • ENEMIES EXPAND';
    }else if(bossIndex===7){
      state.solarRushLeft=3.5;
      state.bossEffectT=3.5;
      state.bossEffectText='☀ SOLAR FLARE • BOSS OVERDRIVE';
    }else if(bossIndex===8){
      state.toxicLeft=4.5;
      state.bossEffectT=4.5;
      state.bossEffectText='☣ TOXIC DRAIN • GROWTH + COINS WEAKENED';
    }else if(bossIndex===9){
      state.gravityLeft=4.0;
      state.bossEffectT=4.0;
      state.bossEffectText='🌀 GRAVITY WELL • ACTIVE BALL PULLED';
    }else if(bossIndex===10){
      state.chaosLeft=5.0;
      state.frostDebuffLeft=Math.max(state.frostDebuffLeft,2.5);
      state.boosterLockLeft=Math.max(state.boosterLockLeft,2.5);
      state.minionSurgeLeft=Math.max(state.minionSurgeLeft,2.5);
      state.bossEffectT=5.0;
      state.bossEffectText='🌈 CHAOS PULSE • MULTIPLE DEBUFFS';
    }

    state.bossAbilityTimer=profile.interval || 9;
  }

  function updateBossMechanics(dt){
    const profile=bossProfileForLevel(currentLevel);
    if(!profile) return;

    if(state.bossEffectT>0) state.bossEffectT=Math.max(0,state.bossEffectT-dt);
    if(state.frostDebuffLeft>0) state.frostDebuffLeft=Math.max(0,state.frostDebuffLeft-dt);
    if(state.minionSurgeLeft>0) state.minionSurgeLeft=Math.max(0,state.minionSurgeLeft-dt);
    if(state.boosterLockLeft>0) state.boosterLockLeft=Math.max(0,state.boosterLockLeft-dt);
    if(state.predatorBurstLeft>0) state.predatorBurstLeft=Math.max(0,state.predatorBurstLeft-dt);
    if(state.bossFlashT>0) state.bossFlashT=Math.max(0,state.bossFlashT-dt);
    if(state.enemyGrowLeft>0) state.enemyGrowLeft=Math.max(0,state.enemyGrowLeft-dt);
    if(state.solarRushLeft>0) state.solarRushLeft=Math.max(0,state.solarRushLeft-dt);
    if(state.toxicLeft>0) state.toxicLeft=Math.max(0,state.toxicLeft-dt);
    if(state.gravityLeft>0) state.gravityLeft=Math.max(0,state.gravityLeft-dt);
    if(state.chaosLeft>0) state.chaosLeft=Math.max(0,state.chaosLeft-dt);
    if(state.slowEnemiesLeft>0) state.slowEnemiesLeft=Math.max(0,state.slowEnemiesLeft-dt);

    const bossIndex=Math.floor(currentLevel/20);

    if(state.active && state.predatorBurstLeft>0){
      state.bossEffectText='🎯 BOSS CHARGE • BOSS IS HUNTING YOU';
      state.bossEffectT=Math.max(state.bossEffectT,.2);
    }

    state.bossAbilityTimer-=dt;
    if(state.bossAbilityTimer<=0){
      triggerBossAbility();
    }
  }

  function clearFinishedLevelCoins(){
    if(!state) return;
    state.coins.length=0;
    state.coinFx.length=0;

    // Coin flights use a separate fixed HUD canvas. Clear it immediately so
    // the last animation frame cannot remain frozen behind the result popup.
    hudFxCtx.save();
    hudFxCtx.setTransform(1,0,0,1,0,0);
    hudFxCtx.clearRect(0,0,hudFxCanvas.width,hudFxCanvas.height);
    hudFxCtx.restore();
    clearHudFxVisuals();
  }

  function beginDefeatSequence(){
    if(!state || !state.running || state.settled || state.defeatSequence || state.victorySequence) return;

    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    clearFinishedLevelCoins();
    state.running=false;
    state.defeatSequence={elapsed:0,duration:reducedMotion ? .18 : 1.15};
    stopGrowSound(true);
    addScreenShake(12,.42);
    flashScreen('#ef334b',.24);
    addImpactRing(
      state.active?.x ?? W*.5,
      state.active?.y ?? H*.5,
      '#ff4054',
      Math.max(W,H)*.34
    );

    ui.boardWrap.classList.add('defeatSlowdown');
    ui.defeatPrelude.classList.add('show');
    ui.defeatPrelude.setAttribute('aria-hidden','false');
    sfx('defeatImpact');
    if(navigator.vibrate) navigator.vibrate([55,28,85,35,120]);
  }

  function beginVictorySequence(){
    if(!state || !state.running || state.settled || state.defeatSequence || state.victorySequence) return;

    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const focusBall=state.active || state.placed[state.placed.length-1];
    state.running=false;
    state.victorySequence={elapsed:0,duration:reducedMotion ? .18 : .9};
    stopGrowSound(true);
    addScreenShake(5,.24);
    flashScreen('#57dc7b',.22);
    addImpactRing(
      focusBall?.x ?? W*.5,
      focusBall?.y ?? H*.5,
      '#63e989',
      Math.max(W,H)*.28
    );
    ui.boardWrap.classList.add('victorySlowdown');
  }

  function updateEndSequenceScene(dt,slowMotion){
    if(state.freezeLeft<=0){
      for(const enemy of state.enemies){
        enemy.x+=enemy.vx*dt*slowMotion;
        enemy.y+=enemy.vy*dt*slowMotion;
        if(enemy.x<enemy.r){enemy.x=enemy.r;enemy.vx=Math.abs(enemy.vx)}
        if(enemy.x>W-enemy.r){enemy.x=W-enemy.r;enemy.vx=-Math.abs(enemy.vx)}
        if(enemy.y<enemy.r){enemy.y=enemy.r;enemy.vy=Math.abs(enemy.vy)}
        if(enemy.y>H-enemy.r){enemy.y=H-enemy.r;enemy.vy=-Math.abs(enemy.vy)}
      }
    }

    if(state.shakeT>0){
      state.shakeT=Math.max(0,state.shakeT-dt);
      if(state.shakeT<=0) state.shakePower=0;
    }
    if(state.screenFlashT>0) state.screenFlashT=Math.max(0,state.screenFlashT-dt);
    for(let index=state.impactRings.length-1;index>=0;index--){
      const ring=state.impactRings[index];
      ring.life-=dt*.9;
      ring.r+=(ring.maxR-ring.r)*dt*2.4;
      if(ring.life<=0) state.impactRings.splice(index,1);
    }
  }

  function updateDefeatSequence(dt){
    const sequence=state.defeatSequence;
    if(!sequence) return;

    sequence.elapsed=Math.min(sequence.duration,sequence.elapsed+dt);
    const progress=sequence.elapsed/sequence.duration;
    const slowMotion=.018+.28*Math.pow(1-progress,2.2);

    // Preserve the final board state but let enemy momentum decay visibly.
    updateEndSequenceScene(dt,slowMotion);

    if(progress>=1){
      state.defeatSequence=null;
      finalizeFinish(false);
      setTimeout(()=>{
        ui.boardWrap.classList.remove('defeatSlowdown');
        ui.defeatPrelude.classList.remove('show');
        ui.defeatPrelude.setAttribute('aria-hidden','true');
      },120);
    }
  }

  function updateVictorySequence(dt){
    const sequence=state.victorySequence;
    if(!sequence) return;

    sequence.elapsed=Math.min(sequence.duration,sequence.elapsed+dt);
    const progress=sequence.elapsed/sequence.duration;
    const slowMotion=.028+.34*Math.pow(1-progress,2);
    updateEndSequenceScene(dt,slowMotion);

    if(progress>=1){
      state.victorySequence=null;
      finalizeFinish(true);
      setTimeout(()=>ui.boardWrap.classList.remove('victorySlowdown'),120);
    }
  }

  function update(dt){
    if(state.defeatSequence){
      updateDefeatSequence(dt);
      return;
    }
    if(state.victorySequence){
      updateVictorySequence(dt);
      return;
    }
    if(!state.running) return;

    if(state.onboardingLevel!==1){
      state.timeLeft-=dt;
      if(state.timeLeft<=0){
        state.timeLeft=0;
        finish(false);
        return;
      }
    }

    if(state.freezeLeft>0) state.freezeLeft=Math.max(0,state.freezeLeft-dt);

    if(state.shakeT>0){
      state.shakeT=Math.max(0,state.shakeT-dt);
      if(state.shakeT<=0) state.shakePower=0;
    }
    if(state.screenFlashT>0) state.screenFlashT=Math.max(0,state.screenFlashT-dt);
    if(state.boosterFeedbackT>0) state.boosterFeedbackT=Math.max(0,state.boosterFeedbackT-dt);

    for(let i=state.impactRings.length-1;i>=0;i--){
      const ring=state.impactRings[i];
      ring.life-=dt*2.4;
      ring.r += (ring.maxR-ring.r)*dt*5.5;
      if(ring.life<=0) state.impactRings.splice(i,1);
    }

    if(!state.tutorialActive) updateBossMechanics(dt);

    for(const key of Object.keys(boosterCooldowns)){
      if(boosterCooldowns[key]>0){
        boosterCooldowns[key]=Math.max(0,boosterCooldowns[key]-dt);
      }
    }

    // COIN FRENZY:
    // for 3 seconds, rapidly spawn coins and pull them into a ball like a magnet.
    if(state.frenzyLeft>0){
      state.frenzyLeft=Math.max(0,state.frenzyLeft-dt);
      state.frenzySpawnTimer-=dt;

      while(state.frenzySpawnTimer<=0 && state.coins.length<FRENZY_MAX_COINS){
        spawnCoin(true);
        state.frenzySpawnTimer+=0.11;
      }

      const magnet=frenzyMagnetTarget();
      for(let i=state.coins.length-1;i>=0;i--){
        const c=state.coins[i];
        const dx=magnet.x-c.x, dy=magnet.y-c.y;
        const d=Math.max(1,Math.hypot(dx,dy));

        // Strong attraction that gets even snappier near the ball.
        const speed=330 + Math.max(0,260-d)*1.2;
        c.x += (dx/d)*speed*dt;
        c.y += (dy/d)*speed*dt;

        if(d <= magnet.r + c.r + 8){
          collectCoinAtIndex(i,c.x,c.y);
        }
      }

      if(state.frenzyLeft<=0){
        // Frenzy is over. Keep only the normal cap so we return to the strict 2-coin rule.
        // Extras fly away into the HUD as bonus collections rather than lingering on screen.
        while(state.coins.length>MAX_COINS){
          const c=state.coins.pop();
          state.scoreCoins=roundCoinAmount(state.scoreCoins+1);
          spawnCoinPickupSpark(c.x,c.y);
          spawnCoinHudFlight(c.x,c.y,.38);
        }
        // Fill back to exactly the normal cap if needed.
        while(state.coins.length<MAX_COINS) spawnCoin(false);
      }
    }

    if(heldPointer.restartPending && heldPointer.active && !state.active && state.ballsLeft>0){
      heldPointer.restartPending=false;
      beginBallAt(
        {x:heldPointer.x,y:heldPointer.y},
        {
          isTouch:heldPointer.isTouch,
          pointerId:heldPointer.pointerId,
          continued:true
        }
      );
    }

    // Passive magnet effect for balls that attract nearby coins.
    if(state.active && state.frenzyLeft<=0){
      const b=state.active;
      const typeData=BALL_TYPES[b.type] || BALL_TYPES.normal;
      const magnetRange=typeData.magnetRange || (b.type==='magnet' ? 150 : 0);

      if(magnetRange>0){
        for(let i=state.coins.length-1;i>=0;i--){
          const c=state.coins[i];
          const dx=b.x-c.x, dy=b.y-c.y;
          const d=Math.max(1,Math.hypot(dx,dy));
          if(d<magnetRange){
            const strength=(1-d/magnetRange);
            const speed=80+260*strength;
            c.x+=(dx/d)*speed*dt;
            c.y+=(dy/d)*speed*dt;
          }
        }
      }
    }

    if(state.active){
      const b=state.active;
      b.growthAge=(b.growthAge||0)+dt;
      b.spawnPunch=Math.max(0,(b.spawnPunch||0)-dt*4.8);
      if(b.ghostLeft>0) b.ghostLeft=Math.max(0,b.ghostLeft-dt);
      if(b.shieldCooldown>0) b.shieldCooldown=Math.max(0,b.shieldCooldown-dt);
      if(b.shieldFlash>0) b.shieldFlash=Math.max(0,b.shieldFlash-dt);
      if(b.enemyGraceLeft>0) b.enemyGraceLeft=Math.max(0,b.enemyGraceLeft-dt);
      followPointerTarget(b,dt);

      if(state.gravityLeft>0){
        const boss=state.enemies.find(e=>e.boss);
        if(boss){
          const dx=boss.x-b.x, dy=boss.y-b.y;
          const d=Math.max(1,Math.hypot(dx,dy));
          const pull=42*dt;
          b.x=Math.max(b.r,Math.min(W-b.r,b.x+dx/d*pull));
          b.y=Math.max(b.r,Math.min(H-b.r,b.y+dy/d*pull));
        }
      }

      const bossGrowthMult=(state.frostDebuffLeft>0 ? 0.40 : 1) * (state.toxicLeft>0 ? 0.70 : 1);
      const typeGrowthMult=BALL_TYPES[b.type || 'normal']?.growthMult || 1;
      const nextArea=Math.PI*b.r*b.r + W*H*BALL_COVERAGE_GROWTH*typeGrowthMult*bossGrowthMult*dt;
      const desiredRadius=Math.sqrt(nextArea/Math.PI);
      const growthResult=growBallIntoAvailableSpace(b,desiredRadius);
      const limit=maxGrowthRadius(b);

      if(growthResult.grew && b.r>=(b.hapticGrowthStepR||Infinity)){
        b.hapticGrowthStepR=b.r+Math.max(9,b.r*.08);
        void pulseNativeGrowthFeedback('grow');
      }

      updateGrowSound(b,limit,growthResult.grew);
      collectCoins(b);
      state.liveCoverageTimer=Math.max(0,(state.liveCoverageTimer||0)-dt);
      if(state.liveCoverageTimer<=0){
        state.liveCoverageTimer=.075;
        const liveBalls=[...state.placed,b];
        state.liveCoverage=measureCoverage(liveBalls,64);

        // Keep the inexpensive preview most of the time, then confirm a
        // possible win with the established high-resolution measurement.
        if(state.liveCoverage>=TARGET-.8){
          state.liveCoverage=measureCoverage(liveBalls);
          if(state.liveCoverage>=TARGET){
            finish(true);
            return;
          }
        }
      }

      // Small status hint when growth is physically blocked.
      if(!growthResult.grew){
        state.message='Growth blocked — move or release';
        state.messageT=.12;
      }
    }

    for(const e of state.enemies){
      if(state.freezeLeft<=0){
        if(state.active){
          const dx=state.active.x-e.x, dy=state.active.y-e.y;
          const d=Math.max(1,Math.hypot(dx,dy));
          let steer=e.seekStrength * 52;
          let speedBoost=1;

          // Every boss hunts the growing ball.
          if(e.boss){
            steer*=state.predatorBurstLeft>0 ? 2.85 : 1.75;
            speedBoost=state.predatorBurstLeft>0 ? 1.40 : 1.16;
          }

          // Boss 4: minion surge.
          if(e.minion && state.minionSurgeLeft>0){
            steer*=1.9;
            speedBoost=1.42;
          }

          // Boss 5: Void Emperor becomes more aggressive while boosters are silenced.
          if(e.boss && e.bossIndex===5 && state.boosterLockLeft>0){
            steer*=1.75;
            speedBoost=1.18;
          }

          if(e.boss && e.bossIndex===7 && state.solarRushLeft>0){
            steer*=2.0;
            speedBoost=1.34;
          }

          e.vx += (dx/d) * steer * dt;
          e.vy += (dy/d) * steer * dt;

          const sp=Math.max(1,Math.hypot(e.vx,e.vy));
          const maxSp=(e.maxSpeed || sp)*speedBoost;
          if(sp>maxSp){
            e.vx = e.vx/sp*maxSp;
            e.vy = e.vy/sp*maxSp;
          }
        }

        let moveMult=(e.minion && state.minionSurgeLeft>0)
          ? 1.22
          : ((e.boss && state.predatorBurstLeft>0) ? 1.10 : 1);

        if(state.slowEnemiesLeft>0) moveMult*=0.58;
        e.x+=e.vx*dt*moveMult;
        e.y+=e.vy*dt*moveMult;
        if(e.x<e.r){e.x=e.r;e.vx=Math.abs(e.vx)}
        if(e.x>W-e.r){e.x=W-e.r;e.vx=-Math.abs(e.vx)}
        if(e.y<e.r){e.y=e.r;e.vy=Math.abs(e.vy)}
        if(e.y>H-e.r){e.y=H-e.r;e.vy=-Math.abs(e.vy)}

        e.trailTimer-=dt;
        if(e.trailTimer<=0){
          e.trailTimer=e.boss ? .012 : (e.minion ? .015 : .018);
          e.trail.push({x:e.x,y:e.y,life:1});

          const trailCap=e.boss ? 64 : (e.minion ? 50 : 44);
          while(e.trail.length>trailCap) e.trail.shift();
        }
      }

      // Version 36 trails fade smoothly even while an enemy is frozen.
      for(const t of e.trail){
        t.life=Math.max(0,(t.life??1)-dt*(e.boss?.72:(e.minion?.92:1.0)));
      }
      while(e.trail.length && e.trail[0].life<=0){
        e.trail.shift();
      }

      // Bounce off locked balls, making trapping possible.
      for(const p of state.placed){
        const dx=e.x-p.x, dy=e.y-p.y, d=Math.hypot(dx,dy);
        const effectiveEnemyR=e.r*(state.enemyGrowLeft>0?1.30:1);
        const min=effectiveEnemyR+p.r;
        if(d<min && d>0){
          const nx=dx/d, ny=dy/d;
          e.x=p.x+nx*(min+1); e.y=p.y+ny*(min+1);
          const dot=e.vx*nx+e.vy*ny;
          if(dot<0){e.vx-=2*dot*nx;e.vy-=2*dot*ny}
        }
      }

      const activeCollisionRadius=state.active ? activeShieldBoundary(state.active) : 0;
      if(state.active && dist(e.x,e.y,state.active.x,state.active.y)<e.r*(state.enemyGrowLeft>0?1.30:1)+activeCollisionRadius){
        const activeBall=state.active;
        if((activeBall.enemyGraceLeft||0)>0){
          // A continued hold respawns at the finger. Push the enemy clear for
          // a fraction of a second so one collision cannot consume several balls.
          bounceEnemyFromActive(e,activeBall,10,activeCollisionRadius);
        }else if(activeBall.ghostLeft>0){
          if(activeBall.type!=='ghost'){
            // Shield-bearing hybrids keep their protection without visually overlapping enemies.
            bounceEnemyFromActive(e,activeBall,8,activeCollisionRadius);
          }
        }else if((activeBall.shieldCooldown||0)>0){
          // A short grace window keeps a crowd from consuming multiple layers at once.
          bounceEnemyFromActive(e,activeBall,8);
        }else if((activeBall.shieldHits||0) > 0){
          const chargesBeforeHit=activeBall.shieldHits;
          const brokenShieldBoundary=activeShieldBoundary(activeBall,chargesBeforeHit);
          activeBall.shieldHits=Math.max(0,chargesBeforeHit-1);
          activeBall.shieldCooldown=.28;
          activeBall.shieldFlash=.34;
          state.message=activeBall.shieldHits>0
            ? `SHIELD BROKEN • ${activeBall.shieldHits} LEFT`
            : 'SHIELD BROKEN!';
          state.messageT=.72;
          sfx('shield');
          addScreenShake(5,.16);
          flashScreen(shieldLayerColor(activeBall.type,chargesBeforeHit-1),.07);
          spawnShieldBreakFx(activeBall,chargesBeforeHit);
          bounceEnemyFromActive(e,activeBall,10,brokenShieldBoundary);
          void triggerNativeFeedback('heavy');
          if(!nativeHapticsAvailable && navigator.vibrate) navigator.vibrate([18,22,34]);
        }else{
          popActive();
        }
      }
    }

    for(let i=state.coinFx.length-1;i>=0;i--){
      const f=state.coinFx[i];
      if(f.type==='coin'){
        f.t+=dt;
        if(f.t>=f.d){
          pulseCoinHud();
          state.coinFx.splice(i,1);
        }
      }else{
        f.life-=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;
        if(f.type==='coinSpark'){
          f.vx*=.94;
          f.vy=f.vy*.94+35*dt;
          f.rotation+=f.spin*dt;
        }else if(f.type==='shieldShard'){
          f.vx*=.95;
          f.vy*=.95;
          f.rotation+=f.spin*dt;
        }else{
          f.vx*=.96;f.vy*=.96;
        }
        if(f.life<=0)state.coinFx.splice(i,1);
      }
    }

    if(state.messageT>0) state.messageT-=dt;
    state.uiSyncTimer=(state.uiSyncTimer||0)+dt;
    if(state.uiSyncTimer>=.08){
      state.uiSyncTimer%=.08;
      syncUI();
    }
  }


  function invoke(fn,args){
    syncContext();
    return fn(...args);
  }

  return {
    spawnEnemy:(...args)=>invoke(spawnEnemy,args),
    randomPoint:(...args)=>invoke(randomPoint,args),
    spawnCoin:(...args)=>invoke(spawnCoin,args),
    startBall:(...args)=>invoke(startBall,args),
    moveBall:(...args)=>invoke(moveBall,args),
    lockBall:(...args)=>invoke(lockBall,args),
    popActive:(...args)=>invoke(popActive,args),
    growBallIntoAvailableSpace:(...args)=>invoke(growBallIntoAvailableSpace,args),
    frenzyMagnetTarget:(...args)=>invoke(frenzyMagnetTarget,args),
    addScreenShake:(...args)=>invoke(addScreenShake,args),
    flashScreen:(...args)=>invoke(flashScreen,args),
    addImpactRing:(...args)=>invoke(addImpactRing,args),
    shieldLayerColor:(...args)=>invoke(shieldLayerColor,args),
    clearFinishedLevelCoins:(...args)=>invoke(clearFinishedLevelCoins,args),
    beginDefeatSequence:(...args)=>invoke(beginDefeatSequence,args),
    beginVictorySequence:(...args)=>invoke(beginVictorySequence,args),
    update:(...args)=>invoke(update,args)
  };
}
