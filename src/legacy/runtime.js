import { BALL_ASSET_PATHS, BALL_TYPES } from '../data/balls';
import { BOOSTERS } from '../data/boosters';
import { PACK_PRICE, IMPOSSIBLE_BALL_PRICE, formatCoinAmount, roundCoinAmount } from '../data/economy';
import { BOSS_LEVELS, BOSS_PROFILES, MAX_LEVEL, bossProfileForLevel, encounterProfileForLevel, worldProfileForLevel } from '../data/encounters';
import { levelConfig } from '../data/levels';
import { loadSaveData, saveSaveData } from '../state/SaveRepository';
import { gameBridge } from '../game/GameBridge';
import { measureCoverage as sampleCoverage } from '../game/systems/CoverageSystem';
import { initializeNativeShell } from '../native/lifecycle';
import { beginNativeGrowthFeedback, endNativeGrowthFeedback, nativeHapticsAvailable, pulseNativeGrowthFeedback, triggerNativeFeedback } from '../native/haptics';
import { evaluateStarPerformance } from '../domains/campaign/StarRules';
import {
  isLevelUnlocked,
  recordLevelResult,
  starsNeededForNextWorld
} from '../domains/campaign/WorldProgression';
import { calculateRunReward } from '../domains/economy/RewardPolicy';
import { createResultScreen } from '../presentation/results/ResultScreen';
import { createCollectionScreen } from '../presentation/collection/CollectionScreen';
import { setBallAssetBackground } from '../presentation/assets/ballAssets';
import { buildHomeViewModel } from '../application/home/HomeViewModel';
import { createHomeScreen } from '../presentation/home/HomeScreen';
import { resolveEquippedBall } from '../domains/inventory/InventoryRules';
import { evaluatePurchase, rollPackBall } from '../domains/economy/PackPolicy';
import { isGuidedOnboardingLevel } from '../domains/onboarding/OnboardingRules';
import { createOnboardingCoach } from '../presentation/onboarding/OnboardingCoach';
import { createProceduralAudio } from '../infrastructure/audio/ProceduralAudio';
import { playerProfileToSaveData } from '../domains/profile/PlayerProfile';
import { createSaveCoordinator } from '../application/profile/SaveCoordinator';
import { TARGET_COVERAGE } from '../domains/gameplay/ProgressRules';
import { buildGameplayHudViewModel } from '../application/gameplay/GameplayHudViewModel';
import { clearFinishedRunScene, createActiveRun } from '../domains/gameplay/RunState';
import { createPackOpeningScreen } from '../presentation/pack/PackOpeningScreen';
import { buildStoreViewModel } from '../application/store/StoreViewModel';
import { createStoreScreen } from '../presentation/store/StoreScreen';
import { createEncounterWarningScreen } from '../presentation/encounters/EncounterWarningScreen';
import { createLegacyCanvasRenderer } from '../infrastructure/rendering/LegacyCanvasRenderer';
import { createLegacyGameplaySession } from '../application/gameplay/LegacyGameplaySession';
import { createProgressHudEffects } from '../presentation/gameplay/ProgressHudEffects';
import { installHudMoneyFitter } from '../presentation/gameplay/HudMoneyFitter';
import { createBoosterController } from '../application/boosters/BoosterController';

void loadSaveData().then(initialSaveData=>{
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hudFxCanvas = document.getElementById('hudFxCanvas');
  const hudFxCtx = hudFxCanvas.getContext('2d');
  const arenaGridCanvas=document.createElement('canvas');
  const arenaGridCtx=arenaGridCanvas.getContext('2d');
  let gameFrameDirty=true;
  const ui = {
    homeScreen: document.getElementById('homeScreen'),
    gameScreen: document.getElementById('gameScreen'),
    storeScreen: document.getElementById('storeScreen'),
    collectionScreen: document.getElementById('collectionScreen'),

    level: document.getElementById('level'),
    difficulty: document.getElementById('difficulty'),
    time: document.getElementById('time'),
    hudTimerCard: document.getElementById('hudTimerCard'),
    balls: document.getElementById('balls'),
    hudCollectionButton: document.getElementById('hudCollectionButton'),
    hudBallVisual: document.getElementById('hudBallVisual'),
    coins: document.getElementById('coins'),
    walletCoins: document.getElementById('walletCoins'),
    gameWalletPill: document.getElementById('gameWalletPill'),
    gameCoinTarget: document.getElementById('gameCoinTarget'),
    hudFxCanvas: document.getElementById('hudFxCanvas'),
    growthBankFxLayer: document.getElementById('growthBankFxLayer'),
    soundToggle: document.getElementById('soundToggle'),
    storeWalletCoins: document.getElementById('storeWalletCoins'),
    collectionWalletCoins: document.getElementById('collectionWalletCoins'),
    boardWrap: document.getElementById('boardWrap'),
    defeatPrelude: document.getElementById('defeatPrelude'),
    coverage: document.getElementById('coverage'),
    progressFill1: document.getElementById('progressFill1'),
    progressFill2: document.getElementById('progressFill2'),
    progressFill3: document.getElementById('progressFill3'),
    progressTrack: document.getElementById('segmentedProgressTrack'),
    progressStar1: document.querySelector('.starMarker1'),
    progressStar2: document.querySelector('.starMarker2'),
    progressStar3: document.querySelector('.starMarker3'),
    progressStars: document.getElementById('progressStars'),
    levelChallenge: document.getElementById('levelChallenge'),
    levelGoal: document.getElementById('levelGoal'),
    levelProgressValue: document.getElementById('levelProgressValue'),
    progressMilestoneToast: document.getElementById('progressMilestoneToast'),
    progressMilestoneValue: document.getElementById('progressMilestoneValue'),
    overlay: document.getElementById('overlay'),
    restart: document.getElementById('restart'),
    replayLevel: document.getElementById('replayLevel'),
    again: document.getElementById('again'),
    freeze: document.getElementById('freeze'),
    moreBalls: document.getElementById('moreBalls'),
    moreTime: document.getElementById('moreTime'),
    destroyBall: document.getElementById('destroyBall'),
    coinFrenzy: document.getElementById('coinFrenzy'),
    slowEnemies: document.getElementById('slowEnemies'),
    coinBurst: document.getElementById('coinBurst'),
    instantGrow: document.getElementById('instantGrow'),
    panicClear: document.getElementById('panicClear'),
    boosterStatus: document.getElementById('boosterStatus'),
    boosterInventoryCount: document.getElementById('boosterInventoryCount'),
    adminLevel: document.getElementById('adminLevel'),
    adminGoLevel: document.getElementById('adminGoLevel'),
    adminPreview: document.getElementById('adminPreview'),
    adminCoins: document.getElementById('adminCoins'),
    adminApex: document.getElementById('adminApex'),
    adminBalls: document.getElementById('adminBalls'),
    adminBoosters: document.getElementById('adminBoosters'),

    gameToHome: document.getElementById('gameToHome'),
    gameToStore: document.getElementById('gameToStore'),
    gameToCollection: document.getElementById('gameToCollection'),
    gameAdminButton: document.getElementById('gameAdminButton'),
    gameUtilityOverlay: document.getElementById('gameUtilityOverlay'),
    gameUtilityBackdrop: document.getElementById('gameUtilityBackdrop'),
    gameUtilityClose: document.getElementById('gameUtilityClose'),
    gameUtilityMenuButton: document.getElementById('gameUtilityMenuButton'),
    adminPanel: document.getElementById('adminPanel'),
    adminCloseButton: document.getElementById('adminCloseButton'),
    quickNav: document.getElementById('quickNav'),
    quickHome: document.getElementById('quickHome'),
    quickStore: document.getElementById('quickStore'),
    quickPlay: document.getElementById('quickPlay'),
    quickCollection: document.getElementById('quickCollection'),

    gameEquippedDot: document.getElementById('gameEquippedDot'),
    gameEquippedName: document.getElementById('gameEquippedName'),

    firstPackMilestoneOverlay: document.getElementById('firstPackMilestoneOverlay'),
    firstPackMilestoneBackdrop: document.getElementById('firstPackMilestoneBackdrop'),
    firstPackMilestoneFx: document.getElementById('firstPackMilestoneFx'),
    firstPackMilestoneStore: document.getElementById('firstPackMilestoneStore'),
    firstPackMilestoneLater: document.getElementById('firstPackMilestoneLater')
  };

  installHudMoneyFitter(ui.gameWalletPill,ui.walletCoins,ui.coins);

  const resultScreen=createResultScreen({
    writeAnimatedWallet(value){
      ui.walletCoins.textContent=formatCoinAmount(value);
    },
    writeSettledWallet(value){
      const formatted=formatCoinAmount(value);
      ui.walletCoins.textContent=formatted;
      ui.storeWalletCoins.textContent=formatted;
      ui.collectionWalletCoins.textContent=formatted;
    }
  });
  const collectionScreenController=createCollectionScreen({
    onEquip:type=>selectBallType(type),
    onEquipCelebration(){
      if(!nativeHapticsAvailable && navigator.vibrate) navigator.vibrate([18,24,32]);
      void triggerNativeFeedback('success');
    }
  });
  const homeScreenController=createHomeScreen({
    onPlay:()=>showScreen('game'),
    onOpenStore:()=>showScreen('store'),
    onSelectLevel:level=>playLevelFromHome(level)
  });
  const onboardingCoach=createOnboardingCoach({
    getContext:()=>({starterPackOpened,tutorialSeen,currentLevel,currentScreen}),
    onHudTourStart(){
      state.running=false;
      state.tutorialActive=true;
      state.active=null;
      state.enemies=[];
      state.coins=[];
      syncUI();
    },
    onHudTourFinish(skipped){
      stopGrowSound(true);
      void endNativeGrowthFeedback(skipped?'cancelled':'complete');
      if(state) state.tutorialActive=false;
      if(!skipped){
        sfx('win');
        void triggerNativeFeedback('success');
      }
      markTutorialSeen();
      reset();
    },
    onHudStepAdvance(){
      sfx('lock');
      void triggerNativeFeedback('light');
    }
  });
  const packOpeningScreen=createPackOpeningScreen({
    nativeHapticsAvailable,
    onOpen:()=>openCurrentPack(),
    onBuyAnother:()=>buyAnotherPackFromReveal(),
    onContinue:()=>playFromPackReveal(),
    playRevealSound:()=>sfx('packReveal'),
    triggerFeedback:style=>{ void triggerNativeFeedback(style); },
    vibrate:pattern=>{ if(!nativeHapticsAvailable && navigator.vibrate) navigator.vibrate(pattern); }
  });
  const storeScreenController=createStoreScreen({
    onBuyPack:()=>buyPack(),
    onBuyApex:()=>buyApexBall(),
    onBuyCataclysm:()=>buyImpossibleBall('cataclysm'),
    onBuyGaia:()=>buyImpossibleBall('gaia'),
    onPackPortalReady:()=>showPackOverlay('paid'),
    onPackTransition:active=>packOpeningScreen.setTransitionIn(active),
    onPurchaseFeedback:()=>sfx('purchase'),
    vibrate:pattern=>{ if(!nativeHapticsAvailable && navigator.vibrate) navigator.vibrate(pattern); }
  });
  const encounterWarningScreen=createEncounterWarningScreen(()=>startEncounter());

  let W = canvas.width, H = canvas.height;
  const phaserArena=document.getElementById('phaserArena');
  if(phaserArena && gameBridge.requested){
    void import('../game/createGame')
      .then(({createPhaserArena})=>createPhaserArena(phaserArena,W,H))
      .catch(error=>gameBridge.disableRenderer(error));
  }
  const proceduralAudio=createProceduralAudio(initialSaveData.settings.soundEnabled);
  let soundEnabled=initialSaveData.settings.soundEnabled;

  function ensureAudio(){
    return proceduralAudio.unlock();
  }

  function stopGrowSound(fast=false){
    proceduralAudio.stopGrowth(fast);
  }

  function startGrowSound(){
    proceduralAudio.startGrowth();
  }

  function updateGrowSound(ball,limit,isGrowing=true){
    if(!ball) return;
    const typeData=BALL_TYPES[ball.type || 'normal'] || BALL_TYPES.normal;
    const minR=ball.startR || BALL_MIN*(typeData.startSizeMult || 1);
    proceduralAudio.updateGrowth({radius:ball.r,minimumRadius:minR,limit,growing:isGrowing});
  }

  function sfx(name){
    proceduralAudio.play(name);
  }

  function setSoundEnabled(enabled){
    soundEnabled=!!enabled;
    proceduralAudio.setEnabled(soundEnabled);
    ui.soundToggle.textContent=soundEnabled?'🔊 SOUND':'🔇 MUTED';
    ui.soundToggle.title=soundEnabled?'Sound on':'Sound off';
    ui.soundToggle.classList.toggle('muted',!soundEnabled);

    if(soundEnabled){
      if(state?.running && state?.active){
        startGrowSound();
      }
    }
    queueProgressSave();
  }

  const TARGET = TARGET_COVERAGE;

  function rebuildArenaGrid(){
    if(arenaGridCanvas.width!==W || arenaGridCanvas.height!==H){
      arenaGridCanvas.width=W;
      arenaGridCanvas.height=H;
    }else{
      arenaGridCtx.clearRect(0,0,W,H);
    }

    arenaGridCtx.save();
    arenaGridCtx.globalAlpha=.2;
    arenaGridCtx.strokeStyle='#cbd5df';
    arenaGridCtx.lineWidth=1;
    arenaGridCtx.beginPath();
    for(let x=50;x<W;x+=50){
      arenaGridCtx.moveTo(x,0);
      arenaGridCtx.lineTo(x,H);
    }
    for(let y=50;y<H;y+=50){
      arenaGridCtx.moveTo(0,y);
      arenaGridCtx.lineTo(W,y);
    }
    arenaGridCtx.stroke();
    arenaGridCtx.restore();
  }

  function configureArenaForViewport(){
    const board=canvas.parentElement;
    const cssW=Math.max(1,canvas.clientWidth || board?.clientWidth || 600);
    const cssH=Math.max(1,canvas.clientHeight || board?.clientHeight || 600);
    let nextW=600;
    let nextH=600;

    // Match the rendered arena on every viewport. Keeping the shorter logical
    // axis at 600 makes CSS pixels-per-game-unit identical on X and Y without
    // changing the established ball and enemy scale.
    if(cssW>10 && cssH>10){
      if(cssW>=cssH){
        nextW=Math.round(nextH*(cssW/cssH));
      }else{
        nextH=Math.round(nextW*(cssH/cssW));
      }
    }

    const changed=canvas.width!==nextW || canvas.height!==nextH;
    if(changed){
      canvas.width=nextW;
      canvas.height=nextH;
    }

    W=canvas.width;
    H=canvas.height;
    if(changed || arenaGridCanvas.width!==W || arenaGridCanvas.height!==H){
      rebuildArenaGrid();
      gameFrameDirty=true;
    }
    return changed;
  }
  const START_TIME = 45;
  const START_BALLS = 10;
  const MAX_COINS = 2;
  const COIN_RADIUS = 21;
  const FRENZY_MAX_COINS = 14;
  const FRENZY_DURATION = 3.0;
  const BALL_MIN = 13;
  const BALL_COVERAGE_GROWTH = Math.PI*6380/(600*600); // canvas fraction/s at normal speed
  const BALL_ASSET_IMAGES = Object.fromEntries(
    Object.entries(BALL_ASSET_PATHS).map(([type,path])=>{
      const image=new Image();
      image.decoding='async';
      image.src=path;
      return [type,image];
    })
  );

  function installSharedBallAssets(){
    setBallAssetBackground(document.querySelector('.mythicCore'),'apex');
    setBallAssetBackground(document.querySelector('.elementOrb'),'cataclysm');
    setBallAssetBackground(document.querySelector('.gaiaCore'),'gaia');
    setBallAssetBackground(ui.hudBallVisual,'normal');
  }
  installSharedBallAssets();
  let selectedBallType=initialSaveData.equippedBallId;
  let collectionPreviewType='normal';

  const unlockedBoosters = new Set(initialSaveData.unlockedBoosterIds);
  const boosterCooldowns = {
    moreBalls:0,
    moreTime:0,
    destroyBall:0,
    freeze:0,
    coinFrenzy:0,
    slowEnemies:0,
    coinBurst:0,
    instantGrow:0,
    panicClear:0
  };

  let walletCoins = initialSaveData.walletCoins;
  let firstPackMilestoneSeen=initialSaveData.firstPackMilestoneSeen;
  let firstPackMilestoneQueued=false;
  let resumeGameAfterFirstPackMilestone=false;
  let starterPackOpened = initialSaveData.starterPackOpened;
  const ownedBalls = new Set(initialSaveData.ownedBallIds);
  let activePackMode = null;
  let activePackReward = null;
  let resumeGameAfterPack = false;
  let currentScreen = 'home';
  let resumeGameAfterMenus = false;
  let utilityMenuPausedGame=false;
  const COLORS = {
    bg:'#e8eef3', line:'#cfd8e2', ball:'#67afd0', ballEdge:'#3990ba',
    coin:'#ffc83d', coinEdge:'#dc9711', enemy:'#ef6a6a', enemyDark:'#c84c4c',
    text:'#3f4854', freeze:'#87c9ec'
  };

  let state;
  let currentLevel = initialSaveData.currentLevel;
  let highestCompletedLevel = initialSaveData.highestCompletedLevel;
  let levelProgress = [...initialSaveData.levelProgress];
  const grandfatheredWorldCount = initialSaveData.grandfatheredWorldCount;
  const encounterWarningsSeen = new Set();
  const progressHudEffects=createProgressHudEffects({
    canvas,
    hudFxCanvas,
    hudFxCtx,
    ui,
    nativeHapticsAvailable,
    sfx,
    triggerNativeFeedback,
    getContext:()=>({state,width:W,height:H})
  });
  const {
    celebrateProgressStar,
    progressPercent,
    pulseCoinHud,
    renderHudCoinFx,
    setProgressNumber,
    spawnCoinHudFlight,
    spawnProgressBankFlight,
    spawnProgressLossFx,
    syncHudFxCanvas
  }=progressHudEffects;
  let boosterController;
  const legacyGameplaySession=createLegacyGameplaySession({
    canvas,
    hudFxCanvas,
    hudFxCtx,
    boardWrap:ui.boardWrap,
    coinsElement:ui.coins,
    defeatPrelude:ui.defeatPrelude,
    gameScreen:ui.gameScreen,
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
    applyGrowthBurst:(...args)=>boosterController.applyGrowthBurst(...args),
    computeCoverage,
    finalizeFinish,
    measureCoverage,
    progressPercent,
    pulseCoinHud,
    spawnCoinHudFlight,
    spawnProgressBankFlight,
    spawnProgressLossFx,
    showBoosterFeedback:(...args)=>boosterController.showFeedback(...args),
    syncUI,
    sfx,
    startGrowSound,
    stopGrowSound,
    updateGrowSound,
    beginNativeGrowthFeedback,
    endNativeGrowthFeedback,
    pulseNativeGrowthFeedback,
    triggerNativeFeedback,
    clearHudFxVisuals:()=>progressHudEffects.clearVisuals(),
    dismissLevelGuide:()=>onboardingCoach.dismissLevelGuide(),
    resetGrowthIndicator:()=>progressHudEffects.resetGrowthIndicator(),
    finish,
    getContext:()=>({
      width:W,
      height:H,
      state,
      currentLevel,
      selectedBallType,
      starterPackOpened
    })
  });
  const {
    spawnEnemy,
    randomPoint,
    spawnCoin,
    startBall,
    moveBall,
    lockBall,
    growBallIntoAvailableSpace,
    frenzyMagnetTarget,
    addScreenShake,
    flashScreen,
    addImpactRing,
    shieldLayerColor,
    clearFinishedLevelCoins,
    beginDefeatSequence,
    beginVictorySequence,
    update
  }=legacyGameplaySession;
  boosterController=createBoosterController({
    ui,
    cooldowns:boosterCooldowns,
    unlockedBoosters,
    frenzyDuration:FRENZY_DURATION,
    getRunState:()=>state,
    getArenaSize:()=>({width:W,height:H}),
    queueProgressSave:()=>queueProgressSave(),
    growBallIntoAvailableSpace:(...args)=>growBallIntoAvailableSpace(...args),
    spawnCoin:(...args)=>spawnCoin(...args),
    flashScreen:(...args)=>flashScreen(...args),
    addImpactRing:(...args)=>addImpactRing(...args),
    sfx,
    syncUI:()=>syncUI()
  });
  const {
    button:boosterButton,
    unlockForBoss:unlockBoosterForBoss,
    update:updateBoosterUI
  }=boosterController;
  const legacyCanvasRenderer=createLegacyCanvasRenderer({
    canvas,
    ctx,
    arenaGridCanvas,
    colors:COLORS,
    ballAssetImages:BALL_ASSET_IMAGES,
    gameBridge,
    rebuildArenaGrid,
    frenzyMagnetTarget,
    shieldLayerColor,
    getFrame:()=>({width:W,height:H,state,currentLevel,selectedBallType})
  });

  let tutorialSeen=initialSaveData.tutorialSeen;
  function progressSnapshot(){
    return playerProfileToSaveData({
      currentLevel,
      highestCompletedLevel,
      levelProgress,
      grandfatheredWorldCount,
      walletCoins:roundCoinAmount(walletCoins),
      ownedBallIds:[...ownedBalls],
      equippedBallId:selectedBallType,
      unlockedBoosterIds:[...unlockedBoosters],
      starterPackOpened,
      tutorialSeen,
      firstPackMilestoneSeen,
      soundEnabled,
      reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }
  const saveCoordinator=createSaveCoordinator(progressSnapshot,saveSaveData);

  function persistProgressNow(){
    return saveCoordinator.flush();
  }

  function queueProgressSave(){
    saveCoordinator.queue();
  }

  function markTutorialSeen(){
    tutorialSeen=true;
    queueProgressSave();
  }

  function onboardingLevelActive(level=currentLevel){
    return isGuidedOnboardingLevel({starterPackOpened,tutorialSeen,currentLevel},level);
  }

  function maybeShowEncounterWarning(){
    if(!state || !starterPackOpened || encounterWarningsSeen.has(currentLevel)) return false;

    const profile=encounterProfileForLevel(currentLevel);
    if(!profile) return false;

    encounterWarningsSeen.add(currentLevel);
    state.running=false;
    stopGrowSound(true);

    encounterWarningScreen.show(profile);
    sfx('bossWarning');
    return true;
  }

  function startEncounter(){
    encounterWarningScreen.hide();
    if(state){
      state.running=true;
      state.last=performance.now();
    }
    sfx('boss');
    syncUI();
  }

  function enemyConfig(level){
    return levelConfig(level);
  }

  function setupEnemiesForLevel(){
    const cfg=enemyConfig(currentLevel);

    if(cfg.boss || cfg.miniBoss){
      // Mini bosses share the crowned silhouette but stay smaller than world bosses.
      const isMiniBoss=cfg.miniBoss;
      const bossAngle=Math.random()*Math.PI*2;
      const bossSpeed=((isMiniBoss ? 78 : 82) + cfg.world*5)*cfg.speedMult;

      spawnEnemy(
        W*0.5,
        H*0.28,
        Math.cos(bossAngle)*bossSpeed,
        Math.sin(bossAngle)*bossSpeed,
        {
          boss:true,
          miniBoss:isMiniBoss,
          bossIndex:cfg.world+1,
          worldIndex:cfg.world+1,
          r:(isMiniBoss ? 29 : 35) + cfg.world*(isMiniBoss ? 1.5 : 2.5),
          maxSpeed:bossSpeed*(isMiniBoss ? 1.14 : 1.10),
          seekStrength:Math.min(.86,cfg.seekStrength+(isMiniBoss ? .1 : .12))
        }
      );

      // Minions use the same permanent level speed progression.
      for(let i=0;i<cfg.minions;i++){
        const angle=(Math.PI*2/cfg.minions)*i + Math.random()*.45;
        const radius=95 + Math.random()*38;
        const x=W*.5 + Math.cos(angle)*radius;
        const y=H*.42 + Math.sin(angle)*radius;
        const moveAngle=Math.random()*Math.PI*2;
        const speed=(68 + Math.random()*16)*cfg.speedMult;

        spawnEnemy(
          Math.max(20,Math.min(W-20,x)),
          Math.max(20,Math.min(H-20,y)),
          Math.cos(moveAngle)*speed,
          Math.sin(moveAngle)*speed,
          {
            boss:false,
            minion:true,
            bossIndex:cfg.world+1,
            worldIndex:cfg.world+1,
            r:16,
            maxSpeed:speed*1.18,
            seekStrength:Math.min(.78,cfg.seekStrength+.05)
          }
        );
      }

      return;
    }

    const earlyPaceBlend=Math.max(0,Math.min(1,(20-currentLevel)/10));
    for(let i=0;i<cfg.count;i++){
      const p=randomPoint(55);
      const angle=Math.random()*Math.PI*2;
      const baseSpeed=(68+8*earlyPaceBlend) + Math.random()*(20+2*earlyPaceBlend);
      const speed=baseSpeed*cfg.speedMult;

      spawnEnemy(
        p.x,p.y,
        Math.cos(angle)*speed,
        Math.sin(angle)*speed,
        {
          boss:false,
          worldIndex:cfg.world+1,
          r:17,
          maxSpeed:speed*1.18,
          seekStrength:cfg.seekStrength
        }
      );
    }
  }

  function reset() {
    const guidedLevel=onboardingLevelActive();
    onboardingCoach.resetVisuals();
    ui.quickNav?.classList.toggle('gameHidden',currentScreen==='game');
    configureArenaForViewport();
    syncHudFxCanvas();
    stopGrowSound(true);
    void endNativeGrowthFeedback('cancelled');
    gameFrameDirty=true;
    progressHudEffects.resetVisuals();
    ui.growthBankFxLayer.replaceChildren();
    ui.gameScreen.dataset.activeGrowthPoints='0';
    ui.gameScreen.dataset.growthTokenDiameter='0';
    ui.gameScreen.dataset.activeBallDiameter='0';
    ui.gameScreen.dataset.lastBankTokenDiameter='0';
    ui.gameScreen.dataset.progressBankState='idle';
    ui.gameScreen.dataset.progressLossState='idle';
    ui.gameScreen.dataset.lastLostProgress='0';
    ui.progressTrack?.classList.remove('progressLost');
    resultScreen.reset();
    ui.boardWrap?.classList.remove('defeatSlowdown','victorySlowdown');
    ui.defeatPrelude?.classList.remove('show');
    ui.defeatPrelude?.setAttribute('aria-hidden','true');

    state=createActiveRun({
      running:starterPackOpened,
      startTime:START_TIME,
      startBalls:START_BALLS,
      bossEncounter:!!bossProfileForLevel(currentLevel),
      onboardingLevel:guidedLevel ? currentLevel : 0
    });
    if(guidedLevel && currentLevel===2){
      spawnEnemy(W*.17,H*.20,30,22,{r:16,maxSpeed:40,seekStrength:.045,worldIndex:1});
    }else if(!guidedLevel){
      setupEnemiesForLevel();
    }
    spawnCoin(); spawnCoin();
    setProgressNumber(0,true);
    for(const marker of [ui.progressStar1,ui.progressStar2,ui.progressStar3]){
      marker?.classList.remove('earned','starHit');
      marker?.querySelectorAll('.progressStarBurst').forEach(burst=>burst.remove());
      if(marker) marker.dataset.celebrations='0';
    }
    ui.progressTrack?.classList.remove('milestoneHit');
    ui.progressMilestoneToast?.classList.remove('show');
    boosterController.resetForLevel();
    ui.adminLevel.value=currentLevel;
    updateAdminPreview(currentLevel);
    updateCollectionUI();
    onboardingCoach.syncClasses();
    syncUI();

    encounterWarningScreen.hide();

    if(!starterPackOpened){
      showPackOverlay('starter');
    }else{
      packOpeningScreen.hide();
      document.body.classList.remove('packOpen');
      if(currentScreen==='game' && !guidedLevel){
        maybeShowEncounterWarning();
      }else if(currentScreen==='game'){
        onboardingCoach.showLevelGuide();
      }else if(currentScreen!=='game'){
        state.running=false;
      }
    }
  }

  function updateAdminPreview(level){
    const value=Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(level)||1)));
    const cfg=enemyConfig(value);

    if(cfg.boss){
      const profile=bossProfileForLevel(value);
      ui.adminPreview.textContent=
        `Level ${value} • ${profile?.name || 'BOSS'} + ${cfg.minions} minions • ${profile?.mechanic || ''} • speed ×${cfg.speedMult.toFixed(2)}`;
    }else if(cfg.miniBoss){
      const profile=encounterProfileForLevel(value);
      ui.adminPreview.textContent=
        `Level ${value} • MINI BOSS ${profile?.name || ''} + ${cfg.minions} guards • 35% gold bonus • speed ×${cfg.speedMult.toFixed(2)}`;
    }else if(cfg.rushEvent){
      ui.adminPreview.textContent=
        `Level ${value} • ENEMY RUSH • ${cfg.count} enemies • 24% faster • 15% gold bonus`;
    }else{
      ui.adminPreview.textContent=
        `Level ${value} • ${cfg.count} enemies • speed ×${cfg.speedMult.toFixed(2)} • reaction ${cfg.seekStrength.toFixed(2)}`;
    }
  }

  function syncHomeUI(){
    homeScreenController.render(buildHomeViewModel({
      currentLevel,
      highestCompletedLevel,
      levelProgress,
      grandfatheredWorldCount,
      walletCoins,
      ownedBallCount:ownedBalls.size,
      equippedBallId:selectedBallType,
      resultOpen:ui.overlay.style.display==='grid',
      resumeAvailable:resumeGameAfterMenus,
      starterPackOpened
    }));
  }

  function levelCanBePlayed(level){
    return isLevelUnlocked(
      level,
      levelProgress,
      highestCompletedLevel,
      grandfatheredWorldCount
    );
  }

  function playLevelFromHome(level){
    const requestedLevel=Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(level)||1)));
    if(!levelCanBePlayed(requestedLevel)) return;

    resumeGameAfterMenus=false;
    currentLevel=requestedLevel;
    reset();
    showScreen('game');
  }

  function updateCollectionUI(){
    selectedBallType=resolveEquippedBall(ownedBalls,selectedBallType);

    const data=BALL_TYPES[selectedBallType] || BALL_TYPES.normal;
    ui.gameEquippedName.textContent=data.name;

    if(!BALL_TYPES[collectionPreviewType]) collectionPreviewType=selectedBallType;
    collectionScreenController.render({
      ownedBallIds:ownedBalls,
      equippedBallId:selectedBallType,
      previewBallId:collectionPreviewType
    });

    const dotClass={
      normal:'normalDot',
      swift:'swiftDot',
      shield:'shieldDot',
      magnet:'magnetDot',
      coin:'coinDot',
      giant:'giantDot',
      ghost:'ghostDot',
      legendary:'legendaryDot',
      apex:'apexDot',
      cataclysm:'cataclysmDot',
      gaia:'gaiaDot'
    }[selectedBallType] || 'normalDot';

    ui.gameEquippedDot.className='equippedDot '+dotClass;

    syncEconomyUI();
  }

  function syncEconomyUI(){
    const pendingCoins=state && !state.settled ? state.scoreCoins : 0;
    ui.walletCoins.textContent=formatCoinAmount(walletCoins+pendingCoins);
    ui.collectionWalletCoins.textContent=formatCoinAmount(walletCoins);
    storeScreenController.render(buildStoreViewModel({
      walletCoins,
      starterPackOpened,
      ownedBallIds:ownedBalls,
      currentScreen
    }));
    const canChainPack=activePackMode==='paid' && walletCoins>=PACK_PRICE;
    packOpeningScreen.renderBuyAnother(canChainPack);
    syncHomeUI();
  }


  function showScreen(name){
    const leavingGame=currentScreen==='game' && name!=='game';
    if(leavingGame){
      resumeGameAfterMenus=!!(state && (state.running || utilityMenuPausedGame));
      closeGameUtilityMenu(false);
      stopGrowSound(true);
      if(state) state.running=false;
    }

    currentScreen=name;
    gameBridge.setActive(name==='game');
    ui.homeScreen.classList.toggle('active',name==='home');
    ui.gameScreen.classList.toggle('active',name==='game');
    ui.storeScreen.classList.toggle('active',name==='store');
    ui.collectionScreen.classList.toggle('active',name==='collection');

    ui.quickNav.classList.toggle('gameHidden',name==='game');
    ui.quickHome.classList.toggle('active',name==='home');
    ui.quickStore.classList.toggle('active',name==='store');
    ui.quickPlay.classList.toggle('active',name==='game');
    ui.quickCollection.classList.toggle('active',name==='collection');

    if(name==='collection'){
      collectionPreviewType=selectedBallType;
      updateCollectionUI();
    }

    if(name==='game'){
      gameFrameDirty=true;
      // Home keeps the game screen at display:none. Measure only after making
      // it visible so the canvas buffer matches the tall mobile arena instead
      // of stretching the hidden-screen 600 × 600 fallback.
      const arenaChanged=configureArenaForViewport();
      syncHudFxCanvas();
      const untouchedRun=!!(
        state &&
        !state.settled &&
        !state.active &&
        state.placed.length===0 &&
        state.scoreCoins===0 &&
        state.ballsLeft===START_BALLS &&
        Math.abs(state.timeLeft-START_TIME)<.01
      );
      if(arenaChanged && untouchedRun){
        reset();
        return;
      }
    }

    if(
      name==='game' &&
      state &&
      !state.settled &&
      starterPackOpened &&
      ui.overlay.style.display!=='grid'
    ){
      const hudTutorialOpened=onboardingCoach.isHudTourActive();
      const guidedLevel=onboardingLevelActive();
      const encounterOpened=!hudTutorialOpened && !guidedLevel && maybeShowEncounterWarning();
      if(!encounterOpened && !hudTutorialOpened){
        state.running=true;
        state.last=performance.now();
        if(state.active && soundEnabled) startGrowSound();
        if(guidedLevel) onboardingCoach.showLevelGuide();
      }
      resumeGameAfterMenus=false;
    }

    updateCollectionUI();
    syncUI();
  }

  function pauseForPack(){
    stopGrowSound(true);
    if(state){
      state.running=false;
    }
  }

  function resumeAfterPack(){
    if(state && resumeGameAfterPack){
      state.running=true;
      state.last=performance.now();
    }
  }

  function shopConfetti(container,count=46,bright=false,quick=false){
    const palette=bright
      ? ['#fff7b0','#ffd445','#ffffff','#ff8ecb','#7de7ff','#cba1ff']
      : ['#ffd445','#ff8a66','#73d5ff','#91df76','#b991ff','#ffffff'];

    const pieces=[];
    const fragment=document.createDocumentFragment();
    for(let i=0;i<count;i++){
      const piece=document.createElement('i');
      piece.className='shopConfetti';
      piece.style.left=(Math.random()*100)+'%';
      piece.style.background=palette[i%palette.length];
      piece.style.setProperty('--dur',quick
        ? `${.82+Math.random()*.48}s`
        : `${1.15+Math.random()*1.15}s`);
      piece.style.setProperty('--delay',quick
        ? `${Math.random()*.08}s`
        : `${Math.random()*.22}s`);
      piece.style.setProperty('--drift',((-110+Math.random()*220))+'px');
      piece.style.setProperty('--spin',((360+Math.random()*950)*(Math.random()<.5?-1:1))+'deg');
      piece.style.width=(5+Math.random()*7)+'px';
      piece.style.height=(8+Math.random()*11)+'px';
      fragment.appendChild(piece);
      pieces.push(piece);
    }
    // Commit the full wave once so mobile WebViews only perform one DOM
    // insertion and one style pass at the start of the celebration.
    container.appendChild(fragment);

    setTimeout(()=>{
      pieces.forEach(el=>el.remove());
    },quick?1500:2700);
  }

  function showFirstPackMilestone(){
    firstPackMilestoneQueued=false;
    if(firstPackMilestoneSeen || walletCoins<PACK_PRICE) return;

    firstPackMilestoneSeen=true;
    queueProgressSave();

    resumeGameAfterFirstPackMilestone=!!(state && state.running && currentScreen==='game');
    if(resumeGameAfterFirstPackMilestone){
      state.running=false;
      stopGrowSound(true);
    }

    ui.firstPackMilestoneFx.innerHTML='';
    ui.firstPackMilestoneOverlay.setAttribute('aria-hidden','false');
    document.body.classList.add('firstPackMilestoneOpen');
    shopConfetti(ui.firstPackMilestoneFx,125,true,true);
    sfx('purchase');
    if(navigator.vibrate) navigator.vibrate([30,35,55,40,85]);
    requestAnimationFrame(()=>ui.firstPackMilestoneStore.focus({preventScroll:true}));
  }

  function scheduleFirstPackMilestone(previousBalance,nextBalance){
    if(
      firstPackMilestoneSeen ||
      firstPackMilestoneQueued ||
      previousBalance>=PACK_PRICE ||
      nextBalance<PACK_PRICE
    ) return;

    firstPackMilestoneQueued=true;
    // The level reward crossed 25 gold: put the store prompt over the result immediately.
    showFirstPackMilestone();
  }

  function closeFirstPackMilestone(shouldResume=true){
    const resumeInterruptedGame=resumeGameAfterFirstPackMilestone;
    ui.firstPackMilestoneOverlay.setAttribute('aria-hidden','true');
    ui.firstPackMilestoneFx.innerHTML='';
    document.body.classList.remove('firstPackMilestoneOpen');
    resumeGameAfterFirstPackMilestone=false;

    if(
      shouldResume &&
      resumeInterruptedGame &&
      state &&
      currentScreen==='game' &&
      ui.overlay.style.display!=='grid' &&
      !encounterWarningScreen.isOpen() &&
      !state.tutorialActive
    ){
      state.running=true;
      state.last=performance.now();
      if(state.active && soundEnabled) startGrowSound();
    }
  }

  function openStoreFromFirstPackMilestone(){
    const resumeInterruptedGame=resumeGameAfterFirstPackMilestone;
    closeFirstPackMilestone(false);
    // Let showScreen remember an interrupted live game so PLAY can resume it.
    if(resumeInterruptedGame && state) state.running=true;
    showScreen('store');
  }


  function updatePackLoadoutStatus(){
    packOpeningScreen.renderLoadout(activePackReward,selectedBallType);
  }


  function showPackOverlay(mode){
    activePackMode=mode;
    activePackReward=null;
    resumeGameAfterPack=mode==='starter';
    pauseForPack();
    packOpeningScreen.show(mode,currentLevel);
  }


  function openCurrentPack(){
    if(!packOpeningScreen.beginOpening()) return;
    sfx('packTap');
    activePackReward=activePackMode==='starter' ? 'normal' : rollPackBall();

    setTimeout(()=>{
      const rewardToReveal=activePackReward;
      const mode=activePackMode;
      if(!rewardToReveal || !mode) return;
      const wasOwned=ownedBalls.has(rewardToReveal);
      ownedBalls.add(rewardToReveal);
      if(mode==='starter'){
        starterPackOpened=true;
        selectedBallType='normal';
      }
      queueProgressSave();
      packOpeningScreen.reveal({mode,reward:rewardToReveal,duplicate:wasOwned});
      updateCollectionUI();
      syncUI();
      updatePackLoadoutStatus();
    },860);
  }


  function buyAnotherPackFromReveal(){
    if(activePackMode!=='paid') return;
    const purchase=evaluatePurchase(walletCoins,PACK_PRICE);
    if(!purchase.allowed){
      packOpeningScreen.showInsufficientCoins(purchase.missingCoins);
      sfx('fail');
      return;
    }
    walletCoins=purchase.balanceAfter;
    queueProgressSave();
    sfx('purchase');
    syncEconomyUI();
    packOpeningScreen.beginRepurchase();
    setTimeout(()=>{
      showPackOverlay('paid');
      setTimeout(()=>openCurrentPack(),180);
    },280);
  }


  function closePackOverlay(){
    const finishedMode=activePackMode;
    packOpeningScreen.hide();
    activePackMode=null;
    activePackReward=null;

    if(finishedMode==='starter'){
      resumeGameAfterPack=false;
      currentScreen='home';
      reset();
      showScreen('home');
      return;
    }

    resumeAfterPack();
    resumeGameAfterPack=false;
    updateCollectionUI();
    syncUI();
  }


  function playFromPackReveal(){
    if(activePackMode==='starter'){
      closePackOverlay();
      showScreen('game');
      return;
    }

    if(activePackMode!=='paid'){
      closePackOverlay();
      return;
    }

    const rewardToEquip=activePackReward;
    const finishedLevel=!!state?.settled;
    const wonFinishedLevel=finishedLevel && state.lastWin;
    const nextLevelUnlocked=wonFinishedLevel && currentLevel<MAX_LEVEL
      ? levelCanBePlayed(currentLevel+1)
      : false;

    if(rewardToEquip && ownedBalls.has(rewardToEquip)){
      selectedBallType=rewardToEquip;
      collectionPreviewType=rewardToEquip;
      updateCollectionUI();
      queueProgressSave();
    }

    closePackOverlay();

    if(wonFinishedLevel && currentLevel<MAX_LEVEL && !nextLevelUnlocked){
      showScreen('home');
      reset();
      return;
    }

    showScreen('game');

    // Packs are often opened from the post-level 25-gold prompt. In that case,
    // start the next level instead of returning to the completed result card.
    if(finishedLevel){
      if(nextLevelUnlocked) currentLevel++;
      queueProgressSave();
      reset();
    }
  }


  function buyPack(){
    if(!starterPackOpened || !state || storeScreenController.isTransitioning()) return;

    const purchase=evaluatePurchase(walletCoins,PACK_PRICE);
    if(!purchase.allowed){
      storeScreenController.setMessage(`Need ${purchase.missingCoins} more coins`);
      setTimeout(()=>storeScreenController.setMessage(''),1800);
      return;
    }

    walletCoins=purchase.balanceAfter;
    void triggerNativeFeedback('heavy');
    queueProgressSave();
    syncEconomyUI();
    syncUI();

    storeScreenController.setMessage('');
    storeScreenController.celebratePurchase('pack','PACK PURCHASED!');

    // Give the purchase its own payoff before transitioning into the
    // separate pack-opening moment.
    setTimeout(()=>{
      storeScreenController.setMessage('');
      storeScreenController.transitionToPack();
    },520);
  }



  function measureCoverage(balls,n=110){
    return sampleCoverage(balls,W,H,n);
  }

  function computeCoverage(){
    state.coverage=measureCoverage(state.placed);
    state.liveCoverage=state.coverage;
  }

  function finish(win){
    if(!state || state.settled || state.defeatSequence || state.victorySequence) return;
    if(!win){
      beginDefeatSequence();
      return;
    }
    if(!state.running) return;
    beginVictorySequence();
  }

  function finalizeFinish(win){
    void endNativeGrowthFeedback('complete');
    void triggerNativeFeedback(win ? 'success' : 'error');
    if(!state || state.settled) return;
    const runCoins=roundCoinAmount(state.scoreCoins);
    const bankedWalletBefore=roundCoinAmount(walletCoins);
    const walletBefore=roundCoinAmount(walletCoins+(win ? runCoins : 0));
    clearFinishedLevelCoins();
    state.running=false;
    state.lastWin=win;
    state.settled=true;
    stopGrowSound();
    sfx(win?'win':'fail');
    if(win){
      flashScreen('#fff0a8',.08);
    }
    const finishingBall=state.active ? {...state.active} : null;
    const coverageBeforeFinish=state.coverage;
    if(finishingBall){
      if(win) state.placed.push(finishingBall);
      state.active=null;
    }
    computeCoverage();
    if(win && finishingBall){
      spawnProgressBankFlight(finishingBall,coverageBeforeFinish,state.coverage);
    }
    const cfg=enemyConfig(currentLevel);
    const starReport=evaluateStarPerformance({
      win,
      timeLeft:state.timeLeft,
      ballsUsed:state.ballsUsed,
      progressPoints:Math.round(progressPercent(state.coverage))
    });
    const stars=starReport.stars;
    const reward=calculateRunReward({win,runCoins,stars,encounterMultiplier:cfg.rewardMult});
    const mult=reward.multiplier;
    const payout=reward.payout;
    levelProgress=recordLevelResult(levelProgress,{
      level:currentLevel,
      win,
      stars,
      timeLeft:state.timeLeft,
      ballsUsed:state.ballsUsed,
      coinsEarned:payout
    });
    if(win){
      walletCoins=roundCoinAmount(walletCoins+payout);
      highestCompletedLevel=Math.max(highestCompletedLevel,currentLevel);
    }
    queueProgressSave();
    const walletAfter=roundCoinAmount(walletCoins);
    state.scoreCoins=0;

    const bossReward=(win && cfg.boss) ? unlockBoosterForBoss(currentLevel) : null;
    const campaignComplete=win && currentLevel===MAX_LEVEL;
    const nextLevelUnlocked=win && currentLevel<MAX_LEVEL
      ? levelCanBePlayed(currentLevel+1)
      : false;
    const nextWorldStarsNeeded=win && !nextLevelUnlocked
      ? starsNeededForNextWorld(currentLevel,levelProgress)
      : 0;

    const title=campaignComplete
      ? '200 LEVELS COMPLETE'
      : (win?`LEVEL ${currentLevel} COMPLETE`:`LEVEL ${currentLevel} — DEFEAT`);

    const rewardLine=bossReward
      ? `<strong>${bossReward.icon} BOOSTER UNLOCKED</strong><br>${bossReward.name}`
      : '';

    const encounterRewardLine=win && cfg.miniBoss
      ? '<strong>♛ MINI BOSS DEFEATED!</strong><br>35% GOLD BONUS CLAIMED'
      : (win && cfg.rushEvent
          ? '<strong>⚡ RUSH SURVIVED!</strong><br>15% GOLD BONUS CLAIMED'
          : '');

    // The result card is about performance. Pack prompts remain in the store
    // milestone flow instead of competing with the star explanation here.
    const resultHtml=win
      ? (campaignComplete
          ? '<strong>ALL BOSSES DEFEATED!</strong>'
          : (rewardLine || encounterRewardLine))
      : '';

    // The result card sits over the arena. Publish one empty scene now so no
    // balls, enemies, coins, trails, or combat effects remain frozen behind it.
    clearFinishedRunScene(state);
    canvas.classList.remove('growthPressed');
    ui.gameScreen.dataset.activeGrowthPoints='0';
    ui.gameScreen.dataset.growthTokenDiameter='0';
    ui.gameScreen.dataset.activeBallDiameter='0';
    legacyCanvasRenderer.draw();
    renderHudCoinFx();
    gameFrameDirty=false;
    syncUI();
    resultScreen.show({
      win,
      title,
      stars,
      starReport,
      runCoins,
      payout,
      multiplier:mult,
      walletBefore,
      walletAfter,
      resultHtml,
      showReplay:win && !campaignComplete,
      buttonLabel:campaignComplete
        ? 'Replay final boss'
        : win
          ? (nextLevelUnlocked ? 'NEXT LEVEL' : `WORLD MAP • NEED ${nextWorldStarsNeeded}★`)
          : 'RETRY'
    });
    if(win) scheduleFirstPackMilestone(bankedWalletBefore,walletAfter);
  }

  function syncUI(){
    const guidedLevel=state.onboardingLevel||0;
    const displayedCoverage=state.active ? state.liveCoverage : state.coverage;
    const hud=buildGameplayHudViewModel({
      currentLevel,
      onboardingLevel:guidedLevel,
      enemyCount:state.enemies.length,
      timeLeft:state.timeLeft,
      ballsLeft:state.ballsLeft,
      equippedBallId:selectedBallType,
      displayedCoverage,
      previousProgressStars:state.progressStarLevel||0,
      boosterFeedbackTime:state.boosterFeedbackT,
      boosterFeedbackText:state.boosterFeedbackText,
      boosterFeedbackColor:state.boosterFeedbackColor,
      frenzyTime:state.frenzyLeft
    });
    ui.level.textContent=currentLevel;
    ui.levelChallenge.textContent=hud.levelChallenge;
    ui.boardWrap.classList.toggle('speedRushLevel',hud.rushEvent);
    ui.boardWrap.classList.toggle('miniBossLevel',hud.miniBoss);
    ui.levelChallenge.classList.toggle('speedRushLevel',hud.rushEvent);
    ui.levelChallenge.classList.toggle('miniBossLevel',hud.miniBoss);
    ui.difficulty.textContent=hud.difficulty;
    ui.difficulty.style.color=hud.difficultyColor;
    ui.gameScreen.dataset.enemyCount=String(hud.enemyCount);
    ui.gameScreen.dataset.placedBallCount=String(state.placed.length);
    ui.gameScreen.dataset.coinCount=String(state.coins.length);
    ui.gameScreen.dataset.sceneFxCount=String(state.coinFx.length+state.impactRings.length);
    ui.time.textContent=hud.time;
    ui.balls.textContent=hud.ballsLeft;
    setBallAssetBackground(ui.hudBallVisual,selectedBallType);
    ui.hudCollectionButton.setAttribute('aria-label',hud.ballLabel);
    ui.hudCollectionButton.title=hud.ballTitle;
    ui.coins.textContent=formatCoinAmount(state.scoreCoins);
    if(currentScreen==='game'){
      const pendingCoins=!state.settled ? state.scoreCoins : 0;
      ui.walletCoins.textContent=formatCoinAmount(walletCoins+pendingCoins);
    }else{
      syncEconomyUI();
    }
    ui.coverage.textContent=hud.displayedCoverage;
    const progressPct=hud.progressPoints;
    // The bar previews live growth; the number is the satisfying banked total.
    // It updates only when the released ball's score flight lands in the HUD.
    setProgressNumber(state.bankedProgressPct||0);
    ui.progressFill1.style.width=hud.segments[0]+'%';
    ui.progressFill2.style.width=hud.segments[1]+'%';
    ui.progressFill3.style.width=hud.segments[2]+'%';

    // These stars are clear progression checkpoints. Performance stars remain
    // separate and are calculated on the result screen.
    const previousProgressStars=state.progressStarLevel||0;
    const liveStars=hud.progressStars;
    ui.progressStars.textContent='★'.repeat(liveStars)+'☆'.repeat(3-liveStars);

    [ui.progressStar1,ui.progressStar2,ui.progressStar3].forEach((marker,index)=>{
      const earned=liveStars>=index+1;
      marker?.classList.toggle('earned',earned);
      marker?.setAttribute('aria-label',`${[33,67,100][index]} point checkpoint${earned?', reached':''}`);
    });
    if(liveStars>previousProgressStars && currentScreen==='game' && (state.running || state.lastWin)){
      for(let star=previousProgressStars+1;star<=liveStars;star++) celebrateProgressStar(star);
    }
    state.progressStarLevel=liveStars;

    if(hud.boosterMode==='active'){
      ui.boosterStatus.textContent=hud.boosterText;
      ui.boosterStatus.style.setProperty('--booster-accent',hud.boosterColor);
      ui.boosterStatus.classList.add('boosterActivated');
      ui.boosterStatus.classList.remove('boosterCountdown');
      ui.boosterStatus.setAttribute('aria-live','polite');
    }else if(hud.boosterMode==='countdown'){
      ui.boosterStatus.textContent=hud.boosterText;
      ui.boosterStatus.classList.remove('boosterActivated');
      ui.boosterStatus.classList.add('boosterCountdown');
      ui.boosterStatus.setAttribute('aria-live','off');
    }else{
      ui.boosterStatus.textContent='';
      ui.boosterStatus.classList.remove('boosterActivated','boosterCountdown');
      ui.boosterStatus.setAttribute('aria-live','polite');
    }

    updateBoosterUI();
  }

  const GAME_FRAME_INTERVAL=1000/60;
  let lastRenderedGameFrame=0;

  function loop(ts){
    requestAnimationFrame(loop);
    if(!state) return;

    // Keep menus and backgrounded Capacitor WebViews cool. A dirty frame is
    // still drawn once when entering gameplay or resetting a paused board.
    if(document.hidden || currentScreen!=='game'){
      state.last=ts;
      lastRenderedGameFrame=ts;
      return;
    }

    const needsAnimation=!!(
      state.running ||
      state.defeatSequence ||
      state.victorySequence ||
      gameFrameDirty ||
      state.screenFlashT>0 ||
      state.shakeT>0 ||
      state.impactRings.length
    );
    if(!needsAnimation){
      state.last=ts;
      lastRenderedGameFrame=ts;
      return;
    }

    const elapsed=ts-lastRenderedGameFrame;
    if(lastRenderedGameFrame && elapsed<GAME_FRAME_INTERVAL-.75) return;
    if(!lastRenderedGameFrame || elapsed>GAME_FRAME_INTERVAL*4){
      lastRenderedGameFrame=ts;
    }else{
      lastRenderedGameFrame+=GAME_FRAME_INTERVAL;
    }

    const dt=Math.min(.035,Math.max(0,(ts-state.last)/1000));
    state.last=ts;
    update(dt);
    legacyCanvasRenderer.draw();
    renderHudCoinFx();
    gameFrameDirty=false;
  }

  canvas.addEventListener('pointerdown',startBall);
  canvas.addEventListener('pointermove',moveBall);
  canvas.addEventListener('pointerup',lockBall);
  canvas.addEventListener('pointercancel',lockBall);

  // Touch fallback for older browsers
  canvas.addEventListener('touchstart',startBall,{passive:false});
  canvas.addEventListener('touchmove',moveBall,{passive:false});
  canvas.addEventListener('touchend',lockBall,{passive:false});

  function buyImpossibleBall(type){
    const data=BALL_TYPES[type];
    if(!data) return;

    if(ownedBalls.has(type)){
      storeScreenController.setMessage(`${data.name} already owned`);
      setTimeout(()=>storeScreenController.setMessage(''),900);
      return;
    }

    const purchase=evaluatePurchase(walletCoins,IMPOSSIBLE_BALL_PRICE);
    if(!purchase.allowed){
      storeScreenController.setMessage(`Need ${purchase.missingCoins} more coins`);
      setTimeout(()=>storeScreenController.setMessage(''),1800);
      return;
    }

    walletCoins=purchase.balanceAfter;
    ownedBalls.add(type);
    selectedBallType=type;
    queueProgressSave();
    storeScreenController.setMessage('');
    storeScreenController.celebratePurchase(type,`${data.name.toUpperCase()} UNLOCKED!`);
    updateCollectionUI();
    syncUI();
    setTimeout(()=>storeScreenController.setMessage(''),1300);
  }

  function buyApexBall(){
    if(ownedBalls.has('apex')){
      storeScreenController.setMessage('Apex Ball already owned');
      setTimeout(()=>storeScreenController.setMessage(''),900);
      return;
    }

    const purchase=evaluatePurchase(walletCoins,5000);
    if(!purchase.allowed){
      storeScreenController.setMessage(`Need ${purchase.missingCoins} more coins`);
      setTimeout(()=>storeScreenController.setMessage(''),1800);
      return;
    }

    walletCoins=purchase.balanceAfter;
    ownedBalls.add('apex');
    selectedBallType='apex';
    queueProgressSave();
    storeScreenController.setMessage('');
    storeScreenController.celebratePurchase('apex','APEX BALL UNLOCKED!');
    updateCollectionUI();
    syncUI();
    setTimeout(()=>storeScreenController.setMessage(''),1200);
  }

  function selectBallType(type){
    if(!ownedBalls.has(type)) return;

    // Match the disabled EQUIPPED button: tapping the already-selected ball
    // should not restart its celebration or launch another long auto-scroll.
    if(selectedBallType===type){
      collectionPreviewType=type;
      return;
    }

    selectedBallType=type;
    collectionPreviewType=type;
    queueProgressSave();
    updateCollectionUI();
    collectionScreenController.focus(type,true);

    const data=BALL_TYPES[type];
    storeScreenController.setMessage(`${data.name} equipped`);
    setTimeout(()=>storeScreenController.setMessage(''),700);

    sfx('purchase');
    requestAnimationFrame(()=>collectionScreenController.celebrateEquip(type));
  }

  ui.gameToHome.addEventListener('click',()=>showScreen('home'));
  ui.gameToStore.addEventListener('click',()=>showScreen('store'));
  ui.gameToCollection.addEventListener('click',()=>showScreen('collection'));
  ui.hudCollectionButton.addEventListener('click',()=>{
    collectionPreviewType=selectedBallType;
    showScreen('collection');
  });

  ui.quickHome.addEventListener('click',()=>showScreen('home'));
  ui.quickStore.addEventListener('click',()=>showScreen('store'));
  ui.quickPlay.addEventListener('click',()=>showScreen('game'));
  ui.quickCollection.addEventListener('click',()=>showScreen('collection'));

  ui.firstPackMilestoneStore.addEventListener('click',openStoreFromFirstPackMilestone);
  ui.firstPackMilestoneLater.addEventListener('click',()=>closeFirstPackMilestone(true));
  ui.firstPackMilestoneBackdrop.addEventListener('click',()=>closeFirstPackMilestone(true));
  document.addEventListener('keydown',(ev)=>{
    if(ev.key==='Escape' && ui.firstPackMilestoneOverlay.getAttribute('aria-hidden')==='false'){
      ev.preventDefault();
      closeFirstPackMilestone(true);
    }
  });

  ui.restart.addEventListener('click',reset);
  ui.replayLevel.addEventListener('click',()=>{
    queueProgressSave();
    reset();
  });
  ui.again.addEventListener('click',()=>{
    const completedOnboardingLevels=!tutorialSeen && state.lastWin && currentLevel===2;
    if(state.lastWin && currentLevel<MAX_LEVEL && !levelCanBePlayed(currentLevel+1)){
      queueProgressSave();
      showScreen('home');
      reset();
      return;
    }
    if(state.lastWin && currentLevel<MAX_LEVEL) currentLevel++;
    queueProgressSave();
    reset();
    if(completedOnboardingLevels) onboardingCoach.startHudTour();
  });

  let adminPausedGame=false;

  function openGameUtilityMenu(){
    if(ui.gameUtilityOverlay.classList.contains('open')) return;

    utilityMenuPausedGame=!!(state && state.running);
    if(state){
      state.running=false;
      stopGrowSound(true);
    }

    ui.gameUtilityOverlay.classList.add('open');
    ui.gameUtilityOverlay.setAttribute('aria-hidden','false');
    ui.gameUtilityMenuButton.classList.add('menuOpen');
    ui.gameUtilityClose.focus({preventScroll:true});
  }

  function closeGameUtilityMenu(resume=true){
    if(!ui.gameUtilityOverlay.classList.contains('open')){
      if(!resume) utilityMenuPausedGame=false;
      return;
    }

    ui.gameUtilityOverlay.classList.remove('open');
    ui.gameUtilityOverlay.setAttribute('aria-hidden','true');
    ui.gameUtilityMenuButton.classList.remove('menuOpen');
    requestAnimationFrame(()=>{
      if(currentScreen==='game') ui.gameUtilityMenuButton.focus({preventScroll:true});
    });

    const shouldResume=resume && utilityMenuPausedGame;
    utilityMenuPausedGame=false;

    if(shouldResume && state && currentScreen==='game'){
      const resultOpen=ui.overlay.style.display==='grid';
      const bossOpen=encounterWarningScreen.isOpen();
      const tutorialOpen=!!state.tutorialActive;

      if(!resultOpen && !bossOpen && !tutorialOpen && !ui.adminPanel.open){
        state.running=true;
        state.last=performance.now();
        if(state.active && soundEnabled) startGrowSound();
      }
    }
  }

  ui.gameUtilityMenuButton.addEventListener('click',()=>{
    if(ui.gameUtilityOverlay.classList.contains('open')) closeGameUtilityMenu(true);
    else openGameUtilityMenu();
  });

  ui.gameUtilityBackdrop.addEventListener('click',()=>closeGameUtilityMenu(true));
  ui.gameUtilityClose.addEventListener('click',()=>closeGameUtilityMenu(true));

  function closeGameAdmin(){
    if(!ui.adminPanel.open) return;
    ui.adminPanel.open=false;
  }

  ui.gameAdminButton.addEventListener('click',(ev)=>{
    ev.preventDefault();

    adminPausedGame=utilityMenuPausedGame || !!(state && state.running);
    closeGameUtilityMenu(false);

    if(state){
      state.running=false;
      stopGrowSound(true);
    }
    ui.adminPanel.open=true;
  });

  ui.adminCloseButton.addEventListener('click',(ev)=>{
    ev.preventDefault();
    closeGameAdmin();
  });

  ui.adminPanel.addEventListener('toggle',()=>{
    if(!ui.adminPanel.open && adminPausedGame){
      const resultOpen=ui.overlay.style.display==='grid';
      const bossOpen=encounterWarningScreen.isOpen();
      const tutorialOpen=!!state?.tutorialActive;

      if(state && currentScreen==='game' && !resultOpen && !bossOpen && !tutorialOpen){
        state.running=true;
        state.last=performance.now();
        if(state.active && soundEnabled) startGrowSound();
      }
      adminPausedGame=false;
    }
  });

  ui.soundToggle.addEventListener('click',()=>{
    setSoundEnabled(!soundEnabled);
  });

  // Unlock audio on the first real user gesture for mobile browsers.
  document.addEventListener('pointerdown',()=>{
    if(soundEnabled) ensureAudio();
  },{once:true});

  document.addEventListener('visibilitychange',()=>{
    lastRenderedGameFrame=0;
    gameFrameDirty=true;
    if(state) state.last=performance.now();

    if(document.hidden){
      void persistProgressNow();
      stopGrowSound(true);
    }else if(currentScreen==='game' && state?.running && state.active && soundEnabled){
      startGrowSound();
    }
  });
  window.addEventListener('pagehide',()=>{ void persistProgressNow(); });
  window.addEventListener('ballfill:nativepause',()=>{
    void persistProgressNow();
    stopGrowSound(true);
  });
  window.addEventListener('ballfill:nativeresume',()=>{
    lastRenderedGameFrame=0;
    gameFrameDirty=true;
    if(state) state.last=performance.now();
  });
  window.addEventListener('ballfill:nativeback',event=>{
    if(packOpeningScreen.isOpen()){
      closePackOverlay();
      event.preventDefault();
      return;
    }
    if(ui.gameUtilityOverlay.classList.contains('show')){
      closeGameUtilityMenu(true);
      event.preventDefault();
      return;
    }
    if(currentScreen!=='home'){
      showScreen('home');
      event.preventDefault();
    }
  });

  // ADMIN / TESTING CONTROLS
  function goToAdminLevel(){
    const requested=Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(ui.adminLevel.value)||1)));
    currentLevel=requested;
    queueProgressSave();
    ui.adminLevel.value=requested;
    // Admin jumps are testing actions, so always preview milestone warnings again.
    if(encounterProfileForLevel(requested)) encounterWarningsSeen.delete(requested);
    reset();
  }

  ui.adminGoLevel.addEventListener('click',goToAdminLevel);

  ui.adminLevel.addEventListener('input',()=>{
    updateAdminPreview(ui.adminLevel.value);
  });

  ui.adminLevel.addEventListener('keydown',(ev)=>{
    if(ev.key==='Enter'){
      ev.preventDefault();
      goToAdminLevel();
    }
  });

  ui.adminCoins.addEventListener('click',()=>{
    walletCoins+=5000;
    queueProgressSave();
    syncUI();
  });

  ui.adminApex.addEventListener('click',()=>{
    ownedBalls.add('apex');
    selectedBallType='apex';
    queueProgressSave();
    updateCollectionUI();
    syncUI();
  });

  ui.adminBalls.addEventListener('click',()=>{
    for(const type of Object.keys(BALL_TYPES)) ownedBalls.add(type);
    if(!ownedBalls.has(selectedBallType)) selectedBallType='normal';
    queueProgressSave();
    updateCollectionUI();
    syncUI();
  });

  ui.adminBoosters.addEventListener('click',()=>{
    boosterController.unlockAll();
  });

  // Collection cards outside the scroll viewport keep their layout but pause
  // decorative glow/float work until they are close to being visible.
  const collectionScroller=ui.collectionScreen.querySelector('.menuApp');
  if('IntersectionObserver' in window && collectionScroller){
    const collectionAnimationObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        entry.target.classList.toggle('collectionPerformancePaused',!entry.isIntersecting);
      }
    },{root:collectionScroller,rootMargin:'140px 0px',threshold:.01});

    document.querySelectorAll('#collectionScreen .ballCard').forEach(card=>{
      collectionAnimationObserver.observe(card);
    });
  }

  // Prevent right-click menu from interrupting the toy.
  canvas.addEventListener('contextmenu',e=>e.preventDefault());

  ui.soundToggle.textContent=soundEnabled?'🔊 SOUND':'🔇 MUTED';
  ui.soundToggle.title=soundEnabled?'Sound on':'Sound off';
  ui.soundToggle.classList.toggle('muted',!soundEnabled);
  void initializeNativeShell();
  reset();
  requestAnimationFrame(loop);
})();
});
