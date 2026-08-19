import { BOOSTERS } from '../../data/boosters';

/**
 * Coordinates booster input, cooldown presentation, unlocks, and active-run
 * mutations. The controller depends on gameplay ports instead of importing a
 * renderer or the legacy runtime.
 */
export function createBoosterController(dependencies){
  const {
    ui,
    cooldowns,
    unlockedBoosters,
    frenzyDuration,
    getRunState,
    getArenaSize,
    queueProgressSave,
    growBallIntoAvailableSpace,
    spawnCoin,
    flashScreen,
    addImpactRing,
    sfx,
    syncUI
  }=dependencies;

  function button(key){
    return {
      moreBalls:ui.moreBalls,
      moreTime:ui.moreTime,
      destroyBall:ui.destroyBall,
      freeze:ui.freeze,
      coinFrenzy:ui.coinFrenzy,
      slowEnemies:ui.slowEnemies,
      coinBurst:ui.coinBurst,
      instantGrow:ui.instantGrow,
      panicClear:ui.panicClear
    }[key];
  }

  function update(){
    const state=getRunState();
    for(const [key,cfg] of Object.entries(BOOSTERS)){
      const control=button(key);
      const unlocked=unlockedBoosters.has(key);
      const cooldown=Math.max(0,cooldowns[key] || 0);

      control.classList.toggle('boosterLocked',!unlocked);
      control.classList.toggle('onCooldown',unlocked && cooldown>0);
      control.disabled=!unlocked || cooldown>0 || !state?.running || (state?.boosterLockLeft||0)>0;

      if(!unlocked){
        control.textContent='🔒';
        control.title=`Defeat boss level ${cfg.unlockLevel} to unlock ${cfg.name}`;
      }else if(cooldown>0){
        control.textContent=`${Math.ceil(cooldown)}s`;
        control.title=`${cfg.name} cooldown`;
      }else{
        control.textContent=cfg.icon;
        control.title=`${cfg.name} • ${cfg.cooldown}s cooldown`;
      }
    }

    ui.boosterInventoryCount.textContent=`${unlockedBoosters.size}/${Object.keys(BOOSTERS).length}`;
  }

  function unlockForBoss(level){
    const entry=Object.entries(BOOSTERS).find(([,cfg])=>cfg.unlockLevel===level);
    if(!entry) return null;

    const [key,cfg]=entry;
    if(unlockedBoosters.has(key)) return null;

    unlockedBoosters.add(key);
    cooldowns[key]=0;
    queueProgressSave();

    const control=button(key);
    control.classList.add('newUnlock');
    setTimeout(()=>control.classList.remove('newUnlock'),1800);

    update();
    return {key,...cfg};
  }

  function showFeedback(key,detail='ACTIVATED'){
    const cfg=BOOSTERS[key];
    const state=getRunState();
    if(!cfg || !state) return;

    state.boosterFeedbackT=1.35;
    state.boosterFeedbackText=`${cfg.icon} ${cfg.name.toUpperCase()} • ${detail}`;
    state.boosterFeedbackColor=cfg.color;

    ui.boosterStatus.style.setProperty('--booster-accent',cfg.color);
    ui.boosterStatus.classList.remove('boosterActivated','boosterCountdown');
    void ui.boosterStatus.offsetWidth;
    ui.boosterStatus.classList.add('boosterActivated');

    const control=button(key);
    if(control){
      control.style.setProperty('--booster-accent',cfg.color);
      control.classList.remove('boosterUsed');
      void control.offsetWidth;
      control.classList.add('boosterUsed');
      setTimeout(()=>control.classList.remove('boosterUsed'),700);
    }

    const {width,height}=getArenaSize();
    addImpactRing(width/2,height/2,cfg.color,Math.min(width,height)*.36);
  }

  function startCooldown(key,detail){
    cooldowns[key]=BOOSTERS[key].cooldown;
    showFeedback(key,detail);
    update();
  }

  function applyGrowthBurst(ball){
    if(!ball) return false;
    const result=growBallIntoAvailableSpace(ball,ball.r+55,72);
    if(!result.grew) return false;

    flashScreen(BOOSTERS.instantGrow.color,.1);
    addImpactRing(ball.x,ball.y,BOOSTERS.instantGrow.color,ball.r+42);
    const state=getRunState();
    state.message='GROWTH BURST!';
    state.messageT=.75;
    return true;
  }

  function resetForLevel(){
    for(const key of Object.keys(cooldowns)) cooldowns[key]=0;
    ui.boosterStatus.textContent='';
    ui.boosterStatus.classList.remove('boosterActivated','boosterCountdown');
    ui.boosterStatus.style.removeProperty('--booster-accent');
    ui.boosterStatus.setAttribute('aria-live','polite');
    for(const key of Object.keys(BOOSTERS)) button(key)?.classList.remove('boosterUsed');
    update();
  }

  function unlockAll(){
    for(const key of Object.keys(BOOSTERS)){
      unlockedBoosters.add(key);
      cooldowns[key]=0;
    }
    queueProgressSave();
    update();
    syncUI();
  }

  function canUse(key){
    const state=getRunState();
    return !!state?.running && unlockedBoosters.has(key) && cooldowns[key]<=0;
  }

  ui.moreBalls.addEventListener('click',()=>{
    if(!canUse('moreBalls')) return;
    const state=getRunState();
    sfx('booster');
    state.ballsLeft+=3;
    state.message='+3 BALLS!';
    state.messageT=.7;
    startCooldown('moreBalls','ADDED TO TOTAL');
    syncUI();
  });

  ui.moreTime.addEventListener('click',()=>{
    if(!canUse('moreTime')) return;
    const state=getRunState();
    sfx('booster');
    state.timeLeft+=10;
    state.message='+10 SECONDS!';
    state.messageT=.7;
    startCooldown('moreTime','ADDED TO TIMER');
    syncUI();
  });

  ui.destroyBall.addEventListener('click',()=>{
    if(!canUse('destroyBall')) return;
    const state=getRunState();
    if(state.enemies.length===0){
      state.message='NO ENEMY TO DESTROY';
      state.messageT=.7;
      return;
    }

    sfx('booster');
    const index=Math.floor(Math.random()*state.enemies.length);
    const removed=state.enemies.splice(index,1)[0];

    for(let particleIndex=0;particleIndex<24;particleIndex++){
      state.coinFx.push({
        type:'pop',
        x:removed.x,
        y:removed.y,
        vx:(Math.random()-.5)*330,
        vy:(Math.random()-.5)*330,
        life:.62,
        r:3+Math.random()*6
      });
    }

    state.message=removed.boss ? 'BOSS BLASTED!' : 'ENEMY DESTROYED!';
    state.messageT=.85;
    sfx('hitBam');
    flashScreen(removed.boss ? '#ff79da' : '#ffcf6b',.09);
    addImpactRing(
      removed.x,
      removed.y,
      removed.boss ? '#ff79da' : '#ffcf6b',
      removed.boss ? 135 : 95
    );

    startCooldown('destroyBall',removed.boss ? 'BOSS BLASTED' : 'ENEMY DESTROYED');
    syncUI();
  });

  ui.coinFrenzy.addEventListener('click',()=>{
    const state=getRunState();
    if(!canUse('coinFrenzy') || state.frenzyLeft>0) return;
    sfx('booster');
    state.frenzyLeft=frenzyDuration;
    state.frenzySpawnTimer=0;
    state.message='COIN FRENZY!';
    state.messageT=.8;
    for(let index=0;index<6;index++) spawnCoin(true);
    startCooldown('coinFrenzy','COINS PULLED IN');
    syncUI();
  });

  ui.freeze.addEventListener('click',()=>{
    if(!canUse('freeze')) return;
    const state=getRunState();
    sfx('booster');
    state.freezeLeft=4;
    flashScreen('#9fe8ff',.10);
    state.message='ENEMIES FROZEN!';
    state.messageT=.7;
    startCooldown('freeze','4s FREEZE');
    syncUI();
  });

  ui.slowEnemies.addEventListener('click',()=>{
    if(!canUse('slowEnemies')) return;
    const state=getRunState();
    sfx('booster');
    state.slowEnemiesLeft=4;
    flashScreen('#b6f0ff',.08);
    startCooldown('slowEnemies','4s SLOW');
    syncUI();
  });

  ui.coinBurst.addEventListener('click',()=>{
    if(!canUse('coinBurst')) return;
    sfx('booster');
    for(let index=0;index<5;index++) spawnCoin(true);
    flashScreen('#ffe47a',.08);
    startCooldown('coinBurst','+5 COINS');
    syncUI();
  });

  ui.instantGrow.addEventListener('click',()=>{
    if(!canUse('instantGrow')) return;
    const state=getRunState();
    sfx('booster');
    const appliedNow=applyGrowthBurst(state.active);
    state.instantGrowReady=!appliedNow;
    startCooldown('instantGrow',appliedNow ? 'BALL GREW' : 'NEXT BALL CHARGED');
    syncUI();
  });

  ui.panicClear.addEventListener('click',()=>{
    if(!canUse('panicClear')) return;
    const state=getRunState();
    const {width,height}=getArenaSize();
    sfx('booster');
    for(const enemy of state.enemies){
      const dx=enemy.x-width/2;
      const dy=enemy.y-height/2;
      const distance=Math.max(1,Math.hypot(dx,dy));
      const speed=Math.max(120,Math.hypot(enemy.vx,enemy.vy));
      enemy.vx=dx/distance*speed;
      enemy.vy=dy/distance*speed;
    }
    flashScreen('#ffffff',.16);
    startCooldown('panicClear','ENEMIES PUSHED');
    syncUI();
  });

  return {
    applyGrowthBurst,
    button,
    resetForLevel,
    showFeedback,
    unlockAll,
    unlockForBoss,
    update
  };
}
