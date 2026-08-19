import { BALL_ASSET_PATHS, BALL_BENEFITS, BALL_TYPES } from '../data/balls';
import { BOOSTERS } from '../data/boosters';
import { PACK_POOL, PACK_PRICE, IMPOSSIBLE_BALL_PRICE, STAR_MULTIPLIERS, formatCoinAmount, roundCoinAmount } from '../data/economy';
import { BOSS_LEVELS, BOSS_PROFILES, EARLY_LEVEL_CHALLENGES, MAX_LEVEL, bossProfileForLevel, encounterProfileForLevel, isMiniBossLevel, isRushEventLevel, worldProfileForLevel } from '../data/encounters';
import { SAVE_VERSION } from '../state/SaveData';
import { loadSaveData, saveSaveData } from '../state/SaveRepository';
import { gameBridge } from '../game/GameBridge';
import { liveStarCount as calculateLiveStars, measureCoverage as sampleCoverage } from '../game/systems/CoverageSystem';
import { distance as dist, followPointerTarget as followPointerWithinArena, growBallIntoAvailableSpace as growBallWithFit, maxGrowthRadius as calculateMaxGrowthRadius } from '../game/systems/GrowthSystem';
import { initializeNativeShell } from '../native/lifecycle';
import { beginNativeGrowthFeedback, endNativeGrowthFeedback, nativeHapticsAvailable, pulseNativeGrowthFeedback, triggerNativeFeedback } from '../native/haptics';

void loadSaveData().then(initialSaveData=>{
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const hudFxCanvas = document.getElementById('hudFxCanvas');
  const hudFxCtx = hudFxCanvas.getContext('2d');
  const arenaGridCanvas=document.createElement('canvas');
  const arenaGridCtx=arenaGridCanvas.getContext('2d');
  let hudFxHasVisuals=false;
  let gameFrameDirty=true;
  const ui = {
    homeScreen: document.getElementById('homeScreen'),
    gameScreen: document.getElementById('gameScreen'),
    storeScreen: document.getElementById('storeScreen'),
    collectionScreen: document.getElementById('collectionScreen'),

    level: document.getElementById('level'),
    difficulty: document.getElementById('difficulty'),
    time: document.getElementById('time'),
    balls: document.getElementById('balls'),
    hudCollectionButton: document.getElementById('hudCollectionButton'),
    hudBallVisual: document.getElementById('hudBallVisual'),
    coins: document.getElementById('coins'),
    walletCoins: document.getElementById('walletCoins'),
    gameWalletPill: document.getElementById('gameWalletPill'),
    gameCoinTarget: document.getElementById('gameCoinTarget'),
    hudFxCanvas: document.getElementById('hudFxCanvas'),
    soundToggle: document.getElementById('soundToggle'),
    storeWalletCoins: document.getElementById('storeWalletCoins'),
    collectionWalletCoins: document.getElementById('collectionWalletCoins'),
    tutorialCoach: document.getElementById('tutorialCoach'),
    boardWrap: document.getElementById('boardWrap'),
    defeatPrelude: document.getElementById('defeatPrelude'),
    coverage: document.getElementById('coverage'),
    progressFill1: document.getElementById('progressFill1'),
    progressFill2: document.getElementById('progressFill2'),
    progressFill3: document.getElementById('progressFill3'),
    progressStars: document.getElementById('progressStars'),
    levelChallenge: document.getElementById('levelChallenge'),
    levelGoal: document.getElementById('levelGoal'),
    overlay: document.getElementById('overlay'),
    resultTitle: document.getElementById('resultTitle'),
    resultCard: document.getElementById('resultCard'),
    completionBadge: document.getElementById('completionBadge'),
    confettiField: document.getElementById('confettiField'),
    coinTransfer: document.getElementById('coinTransfer'),
    resultRunCoins: document.getElementById('resultRunCoins'),
    resultWalletCoins: document.getElementById('resultWalletCoins'),
    resultWalletBucket: document.getElementById('resultWalletBucket'),
    rewardFormula: document.getElementById('rewardFormula'),
    resultText: document.getElementById('resultText'),
    stars: document.getElementById('stars'),
    restart: document.getElementById('restart'),
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
    boosterDock: document.getElementById('boosterDock'),
    boosterViewport: document.getElementById('boosterViewport'),
    boosterTrack: document.getElementById('boosterTrack'),
    storeHero: document.getElementById('storeHero'),
    storeFxLayer: document.getElementById('storeFxLayer'),
    packFxLayer: document.getElementById('packFxLayer'),
    packModal: document.getElementById('packModal'),
    quickNav: document.getElementById('quickNav'),
    quickHome: document.getElementById('quickHome'),
    quickStore: document.getElementById('quickStore'),
    quickPlay: document.getElementById('quickPlay'),
    quickCollection: document.getElementById('quickCollection'),

    homeGold: document.getElementById('homeGold'),
    homeGoldStat: document.getElementById('homeGoldStat'),
    homeCurrentLevel: document.getElementById('homeCurrentLevel'),
    homeBallCount: document.getElementById('homeBallCount'),
    homeBallPreview: document.getElementById('homeBallPreview'),
    homeLoadoutBall: document.getElementById('homeLoadoutBall'),
    homeEquippedName: document.getElementById('homeEquippedName'),
    homeOwnedCopy: document.getElementById('homeOwnedCopy'),
    homeLevelTitle: document.getElementById('homeLevelTitle'),
    homeLevelEvent: document.getElementById('homeLevelEvent'),
    homePlayButton: document.getElementById('homePlayButton'),
    homeWorldLabel: document.getElementById('homeWorldLabel'),
    homeWorldProgress: document.getElementById('homeWorldProgress'),
    homeJourneyFill: document.getElementById('homeJourneyFill'),
    homeNextMilestone: document.getElementById('homeNextMilestone'),
    homePackCard: document.getElementById('homePackCard'),
    homePackTitle: document.getElementById('homePackTitle'),
    homePackCopy: document.getElementById('homePackCopy'),
    homePackProgress: document.getElementById('homePackProgress'),
    homePackCta: document.getElementById('homePackCta'),
    homeCollectionCard: document.getElementById('homeCollectionCard'),

    gameEquippedDot: document.getElementById('gameEquippedDot'),
    gameEquippedName: document.getElementById('gameEquippedName'),
    collectionEquippedName: document.getElementById('collectionEquippedName'),
    collectionEquippedDesc: document.getElementById('collectionEquippedDesc'),
    collectionDetailRarity: document.getElementById('collectionDetailRarity'),
    collectionDetailPanel: document.getElementById('collectionDetailPanel'),
    normalCard: document.getElementById('normalCard'),
    swiftCard: document.getElementById('swiftCard'),
    shieldCard: document.getElementById('shieldCard'),
    magnetCard: document.getElementById('magnetCard'),
    coinCard: document.getElementById('coinCard'),
    giantCard: document.getElementById('giantCard'),
    ghostCard: document.getElementById('ghostCard'),
    legendaryCard: document.getElementById('legendaryCard'),
    apexCard: document.getElementById('apexCard'),
    cataclysmCard: document.getElementById('cataclysmCard'),
    gaiaCard: document.getElementById('gaiaCard'),
    swiftLock: document.getElementById('swiftLock'),
    shieldLock: document.getElementById('shieldLock'),
    magnetLock: document.getElementById('magnetLock'),
    coinLock: document.getElementById('coinLock'),
    giantLock: document.getElementById('giantLock'),
    ghostLock: document.getElementById('ghostLock'),
    legendaryLock: document.getElementById('legendaryLock'),
    apexLock: document.getElementById('apexLock'),
    cataclysmLock: document.getElementById('cataclysmLock'),
    gaiaLock: document.getElementById('gaiaLock'),
    equipNormal: document.getElementById('equipNormal'),
    equipSwift: document.getElementById('equipSwift'),
    equipShield: document.getElementById('equipShield'),
    equipMagnet: document.getElementById('equipMagnet'),
    equipCoin: document.getElementById('equipCoin'),
    equipGiant: document.getElementById('equipGiant'),
    equipGhost: document.getElementById('equipGhost'),
    equipLegendary: document.getElementById('equipLegendary'),
    equipApex: document.getElementById('equipApex'),
    equipCataclysm: document.getElementById('equipCataclysm'),
    equipGaia: document.getElementById('equipGaia'),

    buyPack: document.getElementById('buyPack'),
    buyApexBall: document.getElementById('buyApexBall'),
    buyCataclysmBall: document.getElementById('buyCataclysmBall'),
    buyGaiaBall: document.getElementById('buyGaiaBall'),
    apexPriceLabel: document.getElementById('apexPriceLabel'),
    cataclysmPriceLabel: document.getElementById('cataclysmPriceLabel'),
    gaiaPriceLabel: document.getElementById('gaiaPriceLabel'),
    storePackPrice: document.getElementById('storePackPrice'),
    storeMessage: document.getElementById('storeMessage'),

    packOverlay: document.getElementById('packOverlay'),
    packTitle: document.getElementById('packTitle'),
    packSub: document.getElementById('packSub'),
    bigPack: document.getElementById('bigPack'),
    rewardReveal: document.getElementById('rewardReveal'),
    rewardBall: document.getElementById('rewardBall'),
    rewardName: document.getElementById('rewardName'),
    rewardRarity: document.getElementById('rewardRarity'),
    rewardDesc: document.getElementById('rewardDesc'),
    rewardBenefit: document.getElementById('rewardBenefit'),
    packLoadoutStatus: document.getElementById('packLoadoutStatus'),
    packLoadoutStatusIcon: document.getElementById('packLoadoutStatusIcon'),
    packLoadoutStatusTitle: document.getElementById('packLoadoutStatusTitle'),
    packLoadoutStatusDetail: document.getElementById('packLoadoutStatusDetail'),
    buyAnotherPack: document.getElementById('buyAnotherPack'),
    packContinue: document.getElementById('packContinue'),

    bossWarningOverlay: document.getElementById('bossWarningOverlay'),
    bossWarningCard: document.getElementById('bossWarningCard'),
    bossWarningBurst: document.getElementById('bossWarningBurst'),
    bossWarningEyebrow: document.getElementById('bossWarningEyebrow'),
    bossWarningName: document.getElementById('bossWarningName'),
    bossWarningMechanic: document.getElementById('bossWarningMechanic'),
    bossWarningDesc: document.getElementById('bossWarningDesc'),
    bossWarningTip: document.getElementById('bossWarningTip'),
    bossFightButton: document.getElementById('bossFightButton'),

    firstPackMilestoneOverlay: document.getElementById('firstPackMilestoneOverlay'),
    firstPackMilestoneBackdrop: document.getElementById('firstPackMilestoneBackdrop'),
    firstPackMilestoneFx: document.getElementById('firstPackMilestoneFx'),
    firstPackMilestoneStore: document.getElementById('firstPackMilestoneStore'),
    firstPackMilestoneLater: document.getElementById('firstPackMilestoneLater')
  };

  let W = canvas.width, H = canvas.height;
  const phaserArena=document.getElementById('phaserArena');
  if(phaserArena && gameBridge.requested){
    void import('../game/createGame')
      .then(({createPhaserArena})=>createPhaserArena(phaserArena,W,H))
      .catch(error=>gameBridge.disableRenderer(error));
  }
  // ------------------------------------------------------------
  // Lightweight procedural sound engine.
  // No external audio files: everything is generated with Web Audio.
  // ------------------------------------------------------------
  let audioCtx=null;
  let masterGain=null;
  let soundEnabled=initialSaveData.settings.soundEnabled;

  // Continuous ball-growth voice.
  let growOsc=null;
  let growOsc2=null;
  let growGain=null;
  let growFilter=null;

  function ensureAudio(){
    if(!soundEnabled) return null;
    const AudioContextClass=window.AudioContext || window.webkitAudioContext;
    if(!AudioContextClass) return null;

    if(!audioCtx){
      audioCtx=new AudioContextClass();
      masterGain=audioCtx.createGain();
      masterGain.gain.value=.24;
      masterGain.connect(audioCtx.destination);
    }

    if(audioCtx.state==='suspended'){
      audioCtx.resume().catch(()=>{});
    }

    return audioCtx;
  }

  function tone(freq,duration,opts={}){
    const ctx=ensureAudio();
    if(!ctx || !masterGain) return;

    const delay=opts.delay || 0;
    const start=ctx.currentTime+delay;
    const end=start+duration;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();

    osc.type=opts.type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20,freq),start);

    if(opts.toFreq){
      const to=Math.max(20,opts.toFreq);
      osc.frequency.exponentialRampToValueAtTime(to,end);
    }

    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,opts.vol ?? .13),start+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,end);

    osc.connect(gain).connect(masterGain);
    osc.start(start);
    osc.stop(end+.03);
  }

  function noiseBurst(duration=.12,opts={}){
    const ctx=ensureAudio();
    if(!ctx || !masterGain) return;

    const delay=opts.delay || 0;
    const start=ctx.currentTime+delay;
    const length=Math.max(1,Math.floor(ctx.sampleRate*duration));
    const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
    const data=buffer.getChannelData(0);

    for(let i=0;i<length;i++){
      const fade=1-i/length;
      data[i]=(Math.random()*2-1)*fade;
    }

    const source=ctx.createBufferSource();
    const filter=ctx.createBiquadFilter();
    const gain=ctx.createGain();

    source.buffer=buffer;
    filter.type=opts.filterType || 'bandpass';
    filter.frequency.value=opts.filterFreq || 1200;
    filter.Q.value=opts.q || .8;

    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,opts.vol ?? .08),start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);

    source.connect(filter).connect(gain).connect(masterGain);
    source.start(start);
    source.stop(start+duration+.02);
  }

  function stopGrowSound(fast=false){
    if(!audioCtx) {
      growOsc=growOsc2=growGain=growFilter=null;
      return;
    }

    const now=audioCtx.currentTime;
    if(growGain){
      try{
        growGain.gain.cancelScheduledValues(now);
        growGain.gain.setTargetAtTime(.0001,now,fast?.015:.045);
      }catch(e){}
    }

    const oscA=growOsc;
    const oscB=growOsc2;

    setTimeout(()=>{
      try{oscA?.stop();}catch(e){}
      try{oscB?.stop();}catch(e){}
    },fast?55:130);

    growOsc=null;
    growOsc2=null;
    growGain=null;
    growFilter=null;
  }

  function startGrowSound(){
    if(!soundEnabled) return;

    const ctx=ensureAudio();
    if(!ctx || !masterGain) return;

    stopGrowSound(true);

    growOsc=ctx.createOscillator();
    growOsc2=ctx.createOscillator();
    growFilter=ctx.createBiquadFilter();
    growGain=ctx.createGain();

    // Smooth, rounded "vuuuum" rather than a buzzy synth.
    growOsc.type='sine';
    growOsc2.type='triangle';

    growOsc.frequency.value=76;
    growOsc2.frequency.value=113;
    growOsc.detune.value=-7;
    growOsc2.detune.value=5;

    growFilter.type='lowpass';
    growFilter.frequency.value=330;
    growFilter.Q.value=.72;

    growGain.gain.value=.0001;

    growOsc.connect(growFilter);
    growOsc2.connect(growFilter);
    growFilter.connect(growGain);
    growGain.connect(masterGain);

    const now=ctx.currentTime;
    growGain.gain.setValueAtTime(.0001,now);
    growGain.gain.exponentialRampToValueAtTime(.050,now+.14);

    growOsc.start(now);
    growOsc2.start(now);
  }

  function updateGrowSound(ball,limit,isGrowing=true){
    if(!soundEnabled || !ball || !growOsc || !growOsc2 || !growGain || !growFilter || !audioCtx) return;

    const typeData=BALL_TYPES[ball.type || 'normal'] || BALL_TYPES.normal;
    const minR=ball.startR || BALL_MIN*(typeData.startSizeMult || 1);
    const span=Math.max(1,limit-minR);
    const progress=Math.max(0,Math.min(1,(ball.r-minR)/span));

    // Keep the rise low and rounded: "vuuuuuum" instead of a laser/siren.
    // Size increases pitch, warmth and pressure, but the tone stays bassy.
    const baseFreq=76 + progress*142;
    const secondFreq=baseFreq*(1.47 + progress*.035);
    const filterFreq=330 + progress*980;
    const targetGain=isGrowing ? (.050 + progress*.050) : .0045;

    const now=audioCtx.currentTime;

    try{
      growOsc.frequency.setTargetAtTime(baseFreq,now,.075);
      growOsc2.frequency.setTargetAtTime(secondFreq,now,.085);
      growFilter.frequency.setTargetAtTime(filterFreq,now,.09);
      growGain.gain.setTargetAtTime(targetGain,now,isGrowing?.07:.025);
    }catch(e){}
  }

  function sfx(name){
    if(!soundEnabled) return;
    ensureAudio();

    switch(name){
      case 'ballStart':
        tone(145,.13,{type:'sine',vol:.14,toFreq:235});
        tone(290,.10,{type:'triangle',vol:.055,delay:.025,toFreq:380});
        noiseBurst(.055,{vol:.035,filterFreq:420,filterType:'lowpass'});
        break;

      case 'lock':
        tone(460,.095,{type:'triangle',vol:.06,toFreq:330});
        tone(680,.07,{type:'sine',vol:.035,delay:.025});
        break;

      case 'growthFinish':
        // Soft pressure release: "woomp...pop".
        tone(205,.16,{type:'sine',vol:.12,toFreq:92});
        tone(315,.13,{type:'triangle',vol:.065,toFreq:145});
        noiseBurst(.065,{vol:.055,delay:.035,filterFreq:1050,filterType:'bandpass',q:.7});
        tone(610,.07,{type:'sine',vol:.045,delay:.055,toFreq:470});
        break;

      case 'hitBam':
        // Heavy enemy collision: low body + sharp transient.
        tone(108,.20,{type:'sine',vol:.16,toFreq:52});
        tone(215,.12,{type:'square',vol:.055,toFreq:82});
        noiseBurst(.16,{vol:.15,filterFreq:720,filterType:'lowpass',q:.55});
        noiseBurst(.055,{vol:.07,filterFreq:2100,filterType:'bandpass',q:1.1});
        break;

      case 'coinPickup':
        tone(760,.10,{type:'sine',vol:.09,toFreq:1120});
        tone(1210,.07,{type:'triangle',vol:.045,delay:.035});
        break;

      case 'coinLand':
        tone(1080,.08,{type:'sine',vol:.08,toFreq:1580});
        tone(1580,.10,{type:'sine',vol:.055,delay:.045,toFreq:1900});
        break;

      case 'pop':
        tone(240,.12,{type:'sine',vol:.08,toFreq:120});
        noiseBurst(.09,{vol:.065,filterFreq:1200,filterType:'bandpass'});
        break;

      case 'shield':
        tone(520,.15,{type:'sine',vol:.09,toFreq:760});
        tone(780,.20,{type:'sine',vol:.075,delay:.03,toFreq:980});
        tone(1180,.14,{type:'triangle',vol:.045,delay:.07});
        break;

      case 'boss':
        tone(95,.34,{type:'sawtooth',vol:.10,toFreq:54});
        tone(190,.22,{type:'square',vol:.035,delay:.02,toFreq:125});
        noiseBurst(.14,{vol:.05,filterFreq:280,filterType:'lowpass'});
        break;

      case 'bossWarning':
        tone(86,.48,{type:'sawtooth',vol:.11,toFreq:54});
        tone(172,.18,{type:'square',vol:.045,delay:.16,toFreq:120});
        tone(105,.46,{type:'sine',vol:.10,delay:.36,toFreq:62});
        noiseBurst(.18,{vol:.045,delay:.06,filterFreq:420,filterType:'lowpass'});
        break;

      case 'booster':
        tone(390,.10,{type:'triangle',vol:.075,toFreq:620});
        tone(700,.13,{type:'sine',vol:.055,delay:.055,toFreq:880});
        break;

      case 'purchase':
        tone(520,.10,{type:'triangle',vol:.09});
        tone(660,.12,{type:'triangle',vol:.075,delay:.06});
        tone(880,.20,{type:'sine',vol:.09,delay:.12,toFreq:1040});
        noiseBurst(.08,{vol:.035,delay:.02,filterFreq:1800});
        break;

      case 'packTap':
        tone(105,.19,{type:'sine',vol:.13,toFreq:155});
        noiseBurst(.07,{vol:.06,filterFreq:430,filterType:'lowpass'});
        tone(190,.09,{type:'square',vol:.045,delay:.12});
        tone(225,.09,{type:'square',vol:.045,delay:.25});
        tone(265,.09,{type:'square',vol:.045,delay:.38});
        tone(315,.09,{type:'square',vol:.05,delay:.51});
        tone(145,.72,{type:'triangle',vol:.055,delay:.04,toFreq:780});
        break;

      case 'packReveal':
        noiseBurst(.42,{vol:.11,filterFreq:1500,filterType:'bandpass'});
        tone(130,.28,{type:'sine',vol:.13,toFreq:260});
        tone(523,.38,{type:'sine',vol:.075,delay:.03});
        tone(659,.38,{type:'sine',vol:.075,delay:.03});
        tone(784,.42,{type:'sine',vol:.075,delay:.03});
        tone(1047,.13,{type:'triangle',vol:.07,delay:.22});
        tone(1319,.13,{type:'triangle',vol:.065,delay:.34});
        tone(1568,.17,{type:'sine',vol:.055,delay:.46});
        break;

      case 'win':
        // Warm success fanfare with a sparkle finish.
        tone(262,.46,{type:'sine',vol:.075,delay:.07});
        tone(523,.18,{type:'triangle',vol:.085,delay:.10});
        tone(659,.18,{type:'triangle',vol:.085,delay:.20});
        tone(784,.20,{type:'triangle',vol:.09,delay:.30});
        tone(1047,.34,{type:'sine',vol:.11,delay:.41});
        tone(1319,.20,{type:'sine',vol:.065,delay:.53});
        tone(1568,.24,{type:'sine',vol:.05,delay:.64});
        noiseBurst(.18,{vol:.032,delay:.42,filterFreq:4200,filterType:'highpass',q:.4});
        break;

      case 'defeatImpact':
        // Abrupt bassy "BRRRT" impact that kicks off the slow-motion collapse.
        noiseBurst(.42,{vol:.10,filterFreq:310,filterType:'lowpass',q:1.8});
        noiseBurst(.16,{vol:.055,delay:.06,filterFreq:1250,filterType:'bandpass',q:5});
        tone(155,.34,{type:'sawtooth',vol:.075,toFreq:58});
        tone(82,.62,{type:'square',vol:.085,delay:.05,toFreq:43});
        break;

      case 'fail':
        // Big descending "OHHH NOOOO" style fail sting.
        noiseBurst(.16,{vol:.065,filterFreq:520,filterType:'lowpass'});
        tone(330,.48,{type:'triangle',vol:.115,toFreq:205});
        tone(220,.54,{type:'sine',vol:.13,delay:.03,toFreq:138});
        tone(196,.92,{type:'sine',vol:.145,delay:.42,toFreq:72});
        tone(294,.86,{type:'triangle',vol:.07,delay:.45,toFreq:108});
        tone(98,1.05,{type:'sine',vol:.10,delay:.48,toFreq:48});
        noiseBurst(.28,{vol:.04,delay:.46,filterFreq:260,filterType:'lowpass'});
        break;
    }
  }

  function setSoundEnabled(enabled){
    soundEnabled=!!enabled;
    ui.soundToggle.textContent=soundEnabled?'🔊 SOUND':'🔇 MUTED';
    ui.soundToggle.title=soundEnabled?'Sound on':'Sound off';
    ui.soundToggle.classList.toggle('muted',!soundEnabled);

    if(soundEnabled){
      ensureAudio();
      tone(660,.07,{vol:.04});
      if(state?.running && state?.active){
        startGrowSound();
      }
    }else{
      stopGrowSound(true);
    }
    queueProgressSave();
  }

  const TARGET = 30;

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

  function setBallAssetBackground(element,type){
    const path=BALL_ASSET_PATHS[type] || BALL_ASSET_PATHS.normal;
    if(!element) return;
    if(element.dataset.ballAsset===path) return;
    element.style.backgroundImage=`url("${path}")`;
    element.style.backgroundPosition='center';
    element.style.backgroundRepeat='no-repeat';
    element.style.backgroundSize='contain';
    element.dataset.ballAsset=path;
  }

  function installSharedBallAssets(){
    const collectionTargets={
      normal:ui.normalCard,
      swift:ui.swiftCard,
      shield:ui.shieldCard,
      magnet:ui.magnetCard,
      coin:ui.coinCard,
      giant:ui.giantCard,
      ghost:ui.ghostCard,
      legendary:ui.legendaryCard,
      apex:ui.apexCard,
      cataclysm:ui.cataclysmCard,
      gaia:ui.gaiaCard
    };
    for(const [type,card] of Object.entries(collectionTargets)){
      setBallAssetBackground(card?.querySelector('.collectionBall'),type);
    }
    setBallAssetBackground(document.querySelector('.mythicCore'),'apex');
    setBallAssetBackground(document.querySelector('.elementOrb'),'cataclysm');
    setBallAssetBackground(document.querySelector('.gaiaCore'),'gaia');
    setBallAssetBackground(ui.rewardBall,'normal');
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
  let packCelebrationToken = 0;
  let storePackTransitioning = false;
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
  const encounterWarningsSeen = new Set();

  let tutorialSeen=initialSaveData.tutorialSeen;
  let saveQueued=false;

  function progressSnapshot(){
    return {
      version:SAVE_VERSION,
      currentLevel,
      highestCompletedLevel,
      walletCoins:roundCoinAmount(walletCoins),
      ownedBallIds:[...ownedBalls],
      equippedBallId:selectedBallType,
      unlockedBoosterIds:[...unlockedBoosters],
      starterPackOpened,
      tutorialSeen,
      firstPackMilestoneSeen,
      settings:{
        soundEnabled,
        reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches
      }
    };
  }

  function persistProgressNow(){
    return saveSaveData(progressSnapshot());
  }

  function queueProgressSave(){
    if(saveQueued) return;
    saveQueued=true;
    queueMicrotask(()=>{
      saveQueued=false;
      void persistProgressNow();
    });
  }

  function markTutorialSeen(){
    tutorialSeen=true;
    queueProgressSave();
  }

  function maybeShowLevelOneTutorial(){
    if(!state || !starterPackOpened || currentLevel!==1 || tutorialSeen) return false;
    state.tutorialActive=true;
    state.running=false;
    stopGrowSound(true);
    ui.tutorialCoach.classList.add('show');
    ui.tutorialCoach.setAttribute('aria-hidden','false');
    return true;
  }

  function dismissLevelOneTutorial(){
    if(!state?.tutorialActive) return;
    state.tutorialActive=false;
    ui.tutorialCoach.classList.remove('show');
    ui.tutorialCoach.setAttribute('aria-hidden','true');
    markTutorialSeen();
    state.running=true;
    state.last=performance.now();
  }

  function maybeShowEncounterWarning(){
    if(!state || !starterPackOpened || encounterWarningsSeen.has(currentLevel)) return false;

    const profile=encounterProfileForLevel(currentLevel);
    if(!profile) return false;

    encounterWarningsSeen.add(currentLevel);
    state.running=false;
    stopGrowSound(true);

    ui.bossWarningBurst.textContent=profile.icon;
    ui.bossWarningEyebrow.textContent=profile.eyebrow;
    ui.bossWarningName.textContent=profile.name.toUpperCase();
    ui.bossWarningMechanic.textContent=profile.mechanic;
    ui.bossWarningDesc.textContent=profile.description;
    ui.bossWarningTip.textContent=profile.tip;
    ui.bossFightButton.textContent=profile.button;
    ui.bossWarningCard.style.setProperty('--boss-fill',profile.fill);
    ui.bossWarningCard.style.setProperty('--boss-edge',profile.edge);
    ui.bossWarningCard.style.setProperty('--boss-glow',profile.glow || profile.edge);
    ui.bossWarningOverlay.style.display='grid';
    ui.bossWarningOverlay.setAttribute('aria-hidden','false');
    sfx('bossWarning');
    return true;
  }

  function startEncounter(){
    ui.bossWarningOverlay.style.display='none';
    ui.bossWarningOverlay.setAttribute('aria-hidden','true');
    if(state){
      state.running=true;
      state.last=performance.now();
    }
    sfx('boss');
    syncUI();
  }

  function enemyConfig(level){
    level=Math.max(1,Math.min(MAX_LEVEL,Math.floor(level)));

    const world=Math.floor((level-1)/20);       // 0..9
    const stage=((level-1)%20)+1;              // 1..20
    const boss=stage===20;
    const miniBoss=isMiniBossLevel(level);
    const rushEvent=isRushEventLevel(level);

    // Give the opening ten levels an immediate pace boost, then taper that
    // bonus away by level 20 so bosses and later worlds keep their balance.
    const legacySpeedMult=1 + (level-1)*0.018;
    const earlySpeedBonus=level<=10
      ? 0.08
      : (level<20 ? 0.08*((20-level)/10) : 0);
    const baseSpeedMult=Math.min(2.40,legacySpeedMult+earlySpeedBonus);
    const speedMult=baseSpeedMult*(rushEvent ? 1.24 : (miniBoss ? 1.08 : 1));

    // Early enemies react during a normal two-second hold instead of drifting
    // past it. This bonus also converges with the original curve at level 20.
    const legacySeekStrength=0.14 + (level-1)*0.006;
    const earlySeekBonus=level<=10
      ? 0.06
      : (level<20 ? 0.06*((20-level)/10) : 0);
    const seekStrength=Math.min(
      0.82,
      legacySeekStrength+earlySeekBonus+(rushEvent ? .08 : (miniBoss ? .05 : 0))
    );
    const challenge=boss
      ? 'BOSS BATTLE'
      : (miniBoss
          ? 'MINI BOSS'
          : (rushEvent
              ? '⚡ ENEMY RUSH'
              : (EARLY_LEVEL_CHALLENGES[level-1] || `WORLD ${world+1} PUSH`)));

    if(boss){
      // Boss fights: one boss plus a few minions.
      // Boss 20: 2 minions, Boss 40: 3, every later boss: 4.
      // Total boss fight stays at 5 enemies max (boss + 4 minions).
      const minions=Math.min(4,2+world);

      return {
        level,
        world,
        stage,
        boss:true,
        miniBoss:false,
        rushEvent:false,
        count:1+minions,
        minions,
        speedMult,
        seekStrength,
        challenge,
        rewardMult:1
      };
    }

    if(miniBoss){
      // Mid-world trials use the boss silhouette and hunting behavior, but
      // save the world's unique ability and booster reward for level 20.
      const minions=Math.min(4,3+Math.floor(world/5));
      return {
        level,
        world,
        stage,
        boss:false,
        miniBoss:true,
        rushEvent:false,
        count:1+minions,
        minions,
        speedMult,
        seekStrength,
        challenge,
        rewardMult:1.35
      };
    }

    // Three moving threats make the first screen feel alive. Add one enemy
    // every two levels so the opening ten levels have a clear rising rhythm:
    // 3,3,4,4,5,5,6,6,7,7. Later worlds retain their established curve.
    const baseCount=world===0
      ? Math.min(7,3 + Math.floor((stage-1)/2))
      : Math.min(7,2 + Math.floor((stage-1)/3));
    const count=Math.min(8,baseCount+(rushEvent ? 1 : 0));

    return {
      level,
      world,
      stage,
      boss:false,
      miniBoss:false,
      rushEvent,
      count,
      minions:0,
      speedMult,
      seekStrength,
      challenge,
      rewardMult:rushEvent ? 1.15 : 1
    };
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
    ui.quickNav?.classList.toggle('gameHidden',currentScreen==='game');
    configureArenaForViewport();
    syncHudFxCanvas();
    stopGrowSound(true);
    void endNativeGrowthFeedback('cancelled');
    gameFrameDirty=true;
    hudFxHasVisuals=false;
    if(state) state.rewardAnimToken=(state.rewardAnimToken||0)+1;
    clearConfetti();
    ui.coinTransfer?.classList.remove('transferring');
    ui.resultCard?.classList.remove('celebrate','defeat');
    ui.completionBadge?.classList.remove('show');
    ui.overlay?.classList.remove('defeatResult');
    ui.boardWrap?.classList.remove('defeatSlowdown');
    ui.defeatPrelude?.classList.remove('show');
    ui.defeatPrelude?.setAttribute('aria-hidden','true');

    state = {
      running:starterPackOpened,
      timeLeft:START_TIME,
      ballsLeft:START_BALLS,
      scoreCoins:0,
      placed:[],
      active:null,
      coins:[],
      coinFx:[],
      enemies:[],
      coverage:0,
      liveCoverage:0,
      liveCoverageTimer:0,
      uiSyncTimer:0,
      last:performance.now(),
      freezeLeft:0,
      destroyMode:false,
      frenzyLeft:0,
      frenzySpawnTimer:0,
      bossAbilityTimer:bossProfileForLevel(currentLevel) ? 4.0 : 999,
      bossEffectT:0,
      bossEffectText:'',
      frostDebuffLeft:0,
      minionSurgeLeft:0,
      boosterLockLeft:0,
      predatorBurstLeft:0,
      bossFlashT:0,
      enemyGrowLeft:0,
      solarRushLeft:0,
      toxicLeft:0,
      gravityLeft:0,
      chaosLeft:0,
      slowEnemiesLeft:0,
      instantGrowReady:false,
      shakeT:0,
      shakePower:0,
      screenFlashT:0,
      screenFlashColor:'#ffffff',
      impactRings:[],
      rewardAnimToken:0,
      message:'',
      messageT:0,
      boosterFeedbackT:0,
      boosterFeedbackText:'',
      boosterFeedbackColor:'#63d8ff',
      tutorialActive:false,
      defeatSequence:null,
      lastWin:false,
      settled:false
    };
    setupEnemiesForLevel();
    spawnCoin(); spawnCoin();
    ui.overlay.style.display='none';
    for(const key of Object.keys(boosterCooldowns)) boosterCooldowns[key]=0;
    ui.boosterStatus.textContent='';
    ui.boosterStatus.classList.remove('boosterActivated','boosterCountdown');
    ui.boosterStatus.style.removeProperty('--booster-accent');
    ui.boosterStatus.setAttribute('aria-live','polite');
    for(const key of Object.keys(BOOSTERS)) boosterButton(key)?.classList.remove('boosterUsed');
    ui.adminLevel.value=currentLevel;
    updateAdminPreview(currentLevel);
    updateBoosterUI();
    updateCollectionUI();
    syncUI();

    ui.tutorialCoach.classList.remove('show');
    ui.tutorialCoach.setAttribute('aria-hidden','true');
    ui.bossWarningOverlay.style.display='none';
    ui.bossWarningOverlay.setAttribute('aria-hidden','true');

    if(!starterPackOpened){
      showPackOverlay('starter');
    }else{
      ui.packOverlay.style.display='none';
      ui.packOverlay.style.pointerEvents='none';
      ui.packOverlay.setAttribute('aria-hidden','true');
      document.body.classList.remove('packOpen');
      if(currentScreen==='game' && !maybeShowEncounterWarning()){
        maybeShowLevelOneTutorial();
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

  function boosterButton(key){
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

  function updateBoosterUI(){
    for(const [key,cfg] of Object.entries(BOOSTERS)){
      const btn=boosterButton(key);
      const unlocked=unlockedBoosters.has(key);
      const cd=Math.max(0,boosterCooldowns[key] || 0);

      btn.classList.toggle('boosterLocked',!unlocked);
      btn.classList.toggle('onCooldown',unlocked && cd>0);
      btn.disabled=!unlocked || cd>0 || !state?.running || (state?.boosterLockLeft||0)>0;

      if(!unlocked){
        btn.textContent='🔒';
        btn.title=`Defeat boss level ${cfg.unlockLevel} to unlock ${cfg.name}`;
      }else if(cd>0){
        btn.textContent=`${Math.ceil(cd)}s`;
        btn.title=`${cfg.name} cooldown`;
      }else{
        btn.textContent=cfg.icon;
        btn.title=`${cfg.name} • ${cfg.cooldown}s cooldown`;
      }
    }

    ui.boosterInventoryCount.textContent=`${unlockedBoosters.size}/${Object.keys(BOOSTERS).length}`;
  }

  function unlockBoosterForBoss(level){
    const entry=Object.entries(BOOSTERS).find(([,cfg])=>cfg.unlockLevel===level);
    if(!entry) return null;

    const [key,cfg]=entry;
    if(unlockedBoosters.has(key)) return null;

    unlockedBoosters.add(key);
    boosterCooldowns[key]=0;
    queueProgressSave();

    const btn=boosterButton(key);
    btn.classList.add('newUnlock');
    setTimeout(()=>btn.classList.remove('newUnlock'),1800);

    updateBoosterUI();
    return {key,...cfg};
  }

  function showBoosterFeedback(key,detail='ACTIVATED'){
    const cfg=BOOSTERS[key];
    if(!cfg || !state) return;

    state.boosterFeedbackT=1.35;
    state.boosterFeedbackText=`${cfg.icon} ${cfg.name.toUpperCase()} • ${detail}`;
    state.boosterFeedbackColor=cfg.color;

    ui.boosterStatus.style.setProperty('--booster-accent',cfg.color);
    ui.boosterStatus.classList.remove('boosterActivated','boosterCountdown');
    void ui.boosterStatus.offsetWidth;
    ui.boosterStatus.classList.add('boosterActivated');

    const btn=boosterButton(key);
    if(btn){
      btn.style.setProperty('--booster-accent',cfg.color);
      btn.classList.remove('boosterUsed');
      void btn.offsetWidth;
      btn.classList.add('boosterUsed');
      setTimeout(()=>btn.classList.remove('boosterUsed'),700);
    }

    addImpactRing(W/2,H/2,cfg.color,Math.min(W,H)*.36);
  }

  function startBoosterCooldown(key,detail){
    boosterCooldowns[key]=BOOSTERS[key].cooldown;
    showBoosterFeedback(key,detail);
    updateBoosterUI();
  }

  function applyGrowthBurst(ball){
    if(!ball) return false;
    const result=growBallIntoAvailableSpace(ball,ball.r+55,72);
    if(!result.grew) return false;

    flashScreen(BOOSTERS.instantGrow.color,.1);
    addImpactRing(ball.x,ball.y,BOOSTERS.instantGrow.color,ball.r+42);
    state.message='GROWTH BURST!';
    state.messageT=.75;
    return true;
  }

  function syncHomeUI(){
    if(!ui.homeScreen) return;

    const cfg=enemyConfig(currentLevel);
    const equipped=BALL_TYPES[selectedBallType] || BALL_TYPES.normal;
    const ownedCount=ownedBalls.size;
    const stage=((currentLevel-1)%20)+1;
    const canBuyPack=starterPackOpened && walletCoins>=PACK_PRICE;
    const packProgress=Math.max(0,Math.min(100,walletCoins/PACK_PRICE*100));
    const resultOpen=ui.overlay.style.display==='grid';

    ui.homeGold.textContent=formatCoinAmount(walletCoins);
    ui.homeGoldStat.textContent=formatCoinAmount(walletCoins);
    ui.homeCurrentLevel.textContent=currentLevel;
    ui.homeBallCount.textContent=ownedCount;
    ui.homeEquippedName.textContent=equipped.name;
    ui.homeOwnedCopy.textContent=`${ownedCount} of ${Object.keys(BALL_TYPES).length} balls collected`;
    ui.homeLevelTitle.textContent=`LEVEL ${currentLevel}`;
    ui.homeLevelEvent.textContent=`${cfg.challenge} • WORLD ${cfg.world+1}`;
    ui.homePlayButton.textContent=resultOpen
      ? `▶ VIEW LEVEL ${currentLevel} RESULT`
      : `${resumeGameAfterMenus ? '▶ RESUME' : '▶ PLAY'} LEVEL ${currentLevel}`;

    setBallAssetBackground(ui.homeBallPreview,selectedBallType);
    setBallAssetBackground(ui.homeLoadoutBall,selectedBallType);
    ui.homeBallPreview.setAttribute('aria-label',`${equipped.name}, equipped`);

    ui.homeWorldLabel.textContent=`WORLD ${cfg.world+1}`;
    ui.homeWorldProgress.textContent=`${stage} / 20`;
    ui.homeJourneyFill.style.width=`${stage/20*100}%`;

    const currentEncounter=encounterProfileForLevel(currentLevel);
    let nextMilestoneLevel=0;
    let nextMilestoneProfile=null;
    for(let level=currentLevel+1;level<=MAX_LEVEL;level++){
      const profile=encounterProfileForLevel(level);
      if(profile){
        nextMilestoneLevel=level;
        nextMilestoneProfile=profile;
        break;
      }
    }
    ui.homeNextMilestone.textContent=currentEncounter
      ? `CURRENT EVENT • ${currentEncounter.eyebrow} • ${currentEncounter.mechanic}`
      : (nextMilestoneProfile
          ? `NEXT EVENT • LEVEL ${nextMilestoneLevel} ${nextMilestoneProfile.name.toUpperCase()}`
          : 'FINAL WORLD • THE LAST BOSS AWAITS');

    ui.homePackProgress.style.width=`${packProgress}%`;
    ui.homePackCard.classList.toggle('purchaseReady',canBuyPack);
    ui.homePackCard.classList.toggle('nearReady',!canBuyPack && walletCoins>=PACK_PRICE*.72);
    if(canBuyPack){
      ui.homePackTitle.textContent='YOUR NEXT PACK IS READY!';
      ui.homePackCopy.textContent='You have enough gold. Reveal a new ball now.';
      ui.homePackCta.textContent='OPEN NOW';
    }else{
      const needed=Math.max(0,roundCoinAmount(PACK_PRICE-walletCoins));
      ui.homePackTitle.textContent=`${formatCoinAmount(needed)} GOLD TO NEXT PACK`;
      ui.homePackCopy.textContent='Keep playing or visit the store to see every reward.';
      ui.homePackCta.textContent='VIEW STORE';
    }
  }

  function updateCollectionUI(){
    const types=['normal','swift','shield','magnet','coin','giant','ghost','legendary','apex','cataclysm','gaia'];

    if(!ownedBalls.has(selectedBallType)){
      selectedBallType = types.find(t=>ownedBalls.has(t)) || 'normal';
    }

    const cardMap = {
      normal:ui.normalCard,
      swift:ui.swiftCard,
      shield:ui.shieldCard,
      magnet:ui.magnetCard,
      coin:ui.coinCard,
      giant:ui.giantCard,
      ghost:ui.ghostCard,
      legendary:ui.legendaryCard,
      apex:ui.apexCard,
      cataclysm:ui.cataclysmCard,
      gaia:ui.gaiaCard
    };

    const buttonMap = {
      normal:ui.equipNormal,
      swift:ui.equipSwift,
      shield:ui.equipShield,
      magnet:ui.equipMagnet,
      coin:ui.equipCoin,
      giant:ui.equipGiant,
      ghost:ui.equipGhost,
      legendary:ui.equipLegendary,
      apex:ui.equipApex,
      cataclysm:ui.equipCataclysm,
      gaia:ui.equipGaia
    };

    const lockMap = {
      swift:ui.swiftLock,
      shield:ui.shieldLock,
      magnet:ui.magnetLock,
      coin:ui.coinLock,
      giant:ui.giantLock,
      ghost:ui.ghostLock,
      legendary:ui.legendaryLock,
      apex:ui.apexLock,
      cataclysm:ui.cataclysmLock,
      gaia:ui.gaiaLock
    };

    for(const type of types){
      const owned=ownedBalls.has(type);
      const equipped=selectedBallType===type && owned;
      const card=cardMap[type];
      const button=buttonMap[type];

      card.classList.toggle('lockedCard',!owned);
      card.classList.toggle('equipped',equipped);
      card.classList.toggle('previewed',collectionPreviewType===type);
      card.classList.remove('collectionEquipTarget');
      card.removeAttribute('role');
      card.removeAttribute('tabindex');
      card.removeAttribute('aria-pressed');
      card.removeAttribute('aria-label');

      const description=card.querySelector('p');
      const stat=card.querySelector('.statRow');
      if(description) description.textContent=BALL_TYPES[type].desc;
      if(stat){
        stat.querySelector('span').textContent='WHAT IT GIVES';
        stat.querySelector('strong').textContent=BALL_BENEFITS[type];
      }

      button.disabled=!owned || equipped;
      button.classList.toggle('equippedButton',equipped);
      button.setAttribute('aria-pressed',equipped?'true':'false');
      button.textContent=equipped?'✓ EQUIPPED':(owned?'EQUIP':'LOCKED');

      if(lockMap[type]) lockMap[type].style.display=owned?'none':'block';
    }

    // Keep every usable ball at the front while preserving the designed
    // progression order inside the owned and locked groups.
    const collectionGrid=ui.normalCard?.parentElement;
    if(collectionGrid){
      const sortedTypes=[
        ...types.filter(type=>ownedBalls.has(type)),
        ...types.filter(type=>!ownedBalls.has(type))
      ];
      for(const type of sortedTypes) collectionGrid.appendChild(cardMap[type]);
    }

    const data=BALL_TYPES[selectedBallType] || BALL_TYPES.normal;
    ui.gameEquippedName.textContent=data.name;
    setBallAssetBackground(ui.homeBallPreview,selectedBallType);
    setBallAssetBackground(ui.homeLoadoutBall,selectedBallType);

    if(!BALL_TYPES[collectionPreviewType]) collectionPreviewType=selectedBallType;
    const previewData=BALL_TYPES[collectionPreviewType] || data;
    ui.collectionEquippedName.textContent=previewData.name;
    ui.collectionEquippedDesc.textContent=previewData.desc;
    ui.collectionDetailRarity.textContent=previewData.rarity.toUpperCase();
    ui.collectionDetailRarity.className='collectionDetailRarity '+({
      Common:'commonRarity',
      Rare:'rareRarity',
      Epic:'epicRarity',
      Legendary:'legendaryRarity',
      Mythic:'mythicRarityTag',
      Impossible:'impossibleRarityTag'
    }[previewData.rarity] || 'commonRarity');

    ui.collectionDetailPanel.classList.toggle('previewLocked',!ownedBalls.has(collectionPreviewType));

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
    ui.storeWalletCoins.textContent=formatCoinAmount(walletCoins);
    ui.collectionWalletCoins.textContent=formatCoinAmount(walletCoins);
    ui.storePackPrice.textContent=PACK_PRICE;
    ui.apexPriceLabel.textContent='5000';
    ui.cataclysmPriceLabel.textContent=IMPOSSIBLE_BALL_PRICE;
    ui.gaiaPriceLabel.textContent=IMPOSSIBLE_BALL_PRICE;

    const canBuyPack=starterPackOpened && walletCoins>=PACK_PRICE;
    ui.buyPack.disabled=!starterPackOpened;
    ui.gameToStore.classList.toggle('canBuy',canBuyPack);
    ui.gameToStore.classList.toggle('purchaseReady',canBuyPack);
    ui.quickStore.classList.toggle('purchaseReady',canBuyPack && currentScreen!=='store');
    ui.storeHero.classList.toggle('canBuyPack',canBuyPack);
    ui.buyPack.classList.toggle('purchaseReady',canBuyPack);

    const apexOwned=ownedBalls.has('apex');
    const cataclysmOwned=ownedBalls.has('cataclysm');
    const gaiaOwned=ownedBalls.has('gaia');

    ui.buyApexBall.textContent=apexOwned ? 'OWNED' : 'BUY APEX BALL';
    ui.buyCataclysmBall.textContent=cataclysmOwned ? 'OWNED' : 'BUY CATACLYSM';
    ui.buyGaiaBall.textContent=gaiaOwned ? 'OWNED' : 'BUY GAIA';

    ui.buyApexBall.disabled=false;
    ui.buyCataclysmBall.disabled=false;
    ui.buyGaiaBall.disabled=false;
    ui.buyApexBall.classList.toggle('shopBuyOwned',apexOwned);
    ui.buyCataclysmBall.classList.toggle('shopBuyOwned',cataclysmOwned);
    ui.buyGaiaBall.classList.toggle('shopBuyOwned',gaiaOwned);
    ui.buyApexBall.classList.toggle('purchaseReady',!apexOwned && walletCoins>=5000);
    ui.buyCataclysmBall.classList.toggle('purchaseReady',!cataclysmOwned && walletCoins>=IMPOSSIBLE_BALL_PRICE);
    ui.buyGaiaBall.classList.toggle('purchaseReady',!gaiaOwned && walletCoins>=IMPOSSIBLE_BALL_PRICE);

    const canChainPack=activePackMode==='paid' && walletCoins>=PACK_PRICE;
    ui.buyAnotherPack.disabled=!canChainPack;
    ui.buyAnotherPack.classList.toggle('purchaseReady',canChainPack);
    ui.buyAnotherPack.textContent='BUY ANOTHER';
    ui.buyAnotherPack.setAttribute('aria-label',`Buy another pack for ${PACK_PRICE} coins`);
    syncHomeUI();
  }

  let collectionScrollAnimation=0;
  function stopCollectionScrollAnimation(){
    cancelAnimationFrame(collectionScrollAnimation);
    collectionScrollAnimation=0;
  }

  function centerCollectionCard(type=selectedBallType,smooth=true){
    const card=document.getElementById(`${type}Card`);
    const scroller=ui.collectionScreen.querySelector('.menuApp');
    if(!card || !scroller) return;

    stopCollectionScrollAnimation();
    if(!ui.collectionScreen.classList.contains('active')) return;

    const scrollerRect=scroller.getBoundingClientRect();
    const cardRect=card.getBoundingClientRect();
    const browseHint=ui.collectionScreen.querySelector('.collectionBrowseHint');
    const hintRect=browseHint?.getBoundingClientRect();
    const hintTop=Number.parseFloat(browseHint ? getComputedStyle(browseHint).top : '');
    const hintBottom=hintRect && Number.isFinite(hintTop)
      ? scrollerRect.top+hintTop+hintRect.height
      : hintRect?.bottom || scrollerRect.top;
    const visibleTop=Math.max(scrollerRect.top,hintBottom);
    const visibleCenter=visibleTop+(scrollerRect.bottom-visibleTop)/2;
    const isFirstCard=card.parentElement?.firstElementChild===card;
    const centeredTop=scroller.scrollTop+(cardRect.top+cardRect.height/2-visibleCenter);
    const targetTop=isFirstCard?0:centeredTop;
    const maxTop=Math.max(0,scroller.scrollHeight-scroller.clientHeight);
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const destination=Math.max(0,Math.min(maxTop,targetTop));
    const startTop=scroller.scrollTop;
    const distance=destination-startTop;

    if(!smooth || reduceMotion || Math.abs(distance)<1){
      scroller.scrollTop=destination;
      return;
    }

    const startedAt=performance.now();
    const duration=Math.min(560,Math.max(300,260+Math.abs(distance)*.085));
    const animateScroll=now=>{
      const progress=Math.min(1,(now-startedAt)/duration);
      const eased=progress<.5
        ? 2*progress*progress
        : 1-Math.pow(-2*progress+2,2)/2;
      scroller.scrollTop=startTop+distance*eased;

      if(progress<1) collectionScrollAnimation=requestAnimationFrame(animateScroll);
      else collectionScrollAnimation=0;
    };
    collectionScrollAnimation=requestAnimationFrame(animateScroll);
  }

  ui.collectionScreen.querySelector('.menuApp')?.addEventListener('pointerdown',stopCollectionScrollAnimation,{passive:true});

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
      const encounterOpened=maybeShowEncounterWarning();
      const tutorialOpened=!encounterOpened && maybeShowLevelOneTutorial();
      if(!encounterOpened && !tutorialOpened){
        state.running=true;
        state.last=performance.now();
        if(state.active && soundEnabled) startGrowSound();
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
      container.appendChild(piece);
      pieces.push(piece);
    }

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
      ui.bossWarningOverlay.style.display!=='grid' &&
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

  function radialJuiceBurst(container,className,count,x,y,colors,minDistance,maxDistance){
    for(let i=0;i<count;i++){
      const particle=document.createElement('i');
      particle.className=className;
      particle.style.setProperty('--burst-x',`${x}px`);
      particle.style.setProperty('--burst-y',`${y}px`);
      particle.style.setProperty('--particle-angle',`${i*(360/count)+(Math.random()*8-4)}deg`);
      particle.style.setProperty('--particle-distance',`${minDistance+Math.random()*(maxDistance-minDistance)}px`);
      particle.style.setProperty('--particle-delay',`${(i%5)*22}ms`);
      particle.style.setProperty('--particle-duration',`${.9+Math.random()*.45}s`);
      particle.style.setProperty('--particle-color',colors[i%colors.length]);
      container.appendChild(particle);
    }
  }

  function celebratePackPurchase(targetCard=ui.storeHero,label='PURCHASE COMPLETE!'){
    sfx('purchase');
    const target=targetCard || ui.storeHero;
    const rect=target.getBoundingClientRect();
    const centerX=rect.left+rect.width/2;
    const centerY=rect.top+Math.min(rect.height*.7,rect.height-28);

    ui.storeFxLayer.querySelectorAll('.purchaseSuccessBanner,.purchaseBurstParticle').forEach(el=>el.remove());
    ui.storeFxLayer.classList.remove('purchaseFlash');
    ui.storeScreen.classList.remove('purchaseScreenShake');
    document.querySelectorAll('#storeScreen .purchaseBoom').forEach(el=>el.classList.remove('purchaseBoom'));
    ui.storeFxLayer.style.setProperty('--purchase-x',`${centerX}px`);
    ui.storeFxLayer.style.setProperty('--purchase-y',`${centerY}px`);
    void ui.storeFxLayer.offsetWidth;

    ui.storeFxLayer.classList.add('purchaseFlash');
    ui.storeScreen.classList.add('purchaseScreenShake');
    target.classList.add('purchaseBoom');

    const banner=document.createElement('div');
    banner.className='purchaseSuccessBanner';
    banner.setAttribute('role','status');
    banner.textContent=`★ ${label} ★`;
    ui.storeFxLayer.appendChild(banner);

    radialJuiceBurst(
      ui.storeFxLayer,
      'purchaseBurstParticle',
      34,
      centerX,
      centerY,
      ['#f4bd37','#4fcf79','#ff7f70','#79cbe0','#ffffff'],
      72,
      190
    );
    [...ui.storeFxLayer.querySelectorAll('.purchaseBurstParticle')]
      .filter((_,index)=>index%4===0)
      .forEach(el=>el.classList.add('coinParticle'));

    shopConfetti(ui.storeFxLayer,92,false);
    setTimeout(()=>shopConfetti(ui.storeFxLayer,54,true),190);
    if(!nativeHapticsAvailable && navigator.vibrate) navigator.vibrate([24,28,42]);

    setTimeout(()=>{
      ui.storeFxLayer.classList.remove('purchaseFlash');
      ui.storeScreen.classList.remove('purchaseScreenShake');
      target.classList.remove('purchaseBoom');
    },1250);
    setTimeout(()=>{
      banner.remove();
      ui.storeFxLayer.querySelectorAll('.purchaseBurstParticle').forEach(el=>el.remove());
    },1550);
  }

  function celebratePackReveal(type,isNew){
    void triggerNativeFeedback(isNew ? 'success' : 'medium');
    sfx('packReveal');
    const celebrationToken=++packCelebrationToken;
    const data=BALL_TYPES[type] || BALL_TYPES.normal;
    const revealColor={
      Common:'#85a9ba',
      Rare:'#28a9df',
      Epic:'#ad59de',
      Legendary:'#ffad22',
      Mythic:'#ed56d8',
      Impossible:'#ff624d'
    }[data.rarity] || '#f4bd37';
    const ballRect=ui.rewardBall.getBoundingClientRect();
    const centerX=ballRect.left+ballRect.width/2;
    const centerY=ballRect.top+ballRect.height/2;

    ui.packFxLayer.querySelectorAll('.packDropBanner,.packMegaSpark').forEach(el=>el.remove());
    ui.packFxLayer.classList.remove('openingBurst','preRevealCharge');
    ui.packModal.classList.remove('revealBoom','packAnticipation');
    ui.rewardReveal.classList.remove('megaReveal');
    ui.packFxLayer.style.setProperty('--reveal-color',revealColor);
    ui.packFxLayer.style.setProperty('--burst-x',`${centerX}px`);
    ui.packFxLayer.style.setProperty('--burst-y',`${centerY}px`);
    ui.packModal.style.setProperty('--reveal-color',revealColor);
    ui.rewardReveal.style.setProperty('--reward-accent',revealColor);
    void ui.packFxLayer.offsetWidth;

    ui.packFxLayer.classList.add('openingBurst');
    ui.packModal.classList.add('revealBoom');
    ui.rewardReveal.classList.add('megaReveal');

    const banner=document.createElement('div');
    banner.className='packDropBanner';
    banner.setAttribute('role','status');
    banner.textContent=isNew
      ? `★ NEW ${data.rarity.toUpperCase()} BALL! ★`
      : `★ ${data.rarity.toUpperCase()} REWARD! ★`;
    ui.packFxLayer.appendChild(banner);

    radialJuiceBurst(
      ui.packFxLayer,
      'packMegaSpark',
      46,
      centerX,
      centerY,
      [revealColor,'#fff6a7','#ffffff','#65d7ee','#f0a1ff'],
      88,
      250
    );
    // One dense synchronized wave prevents the reveal from feeling as if it
    // restarts while still delivering the same amount of visual energy.
    shopConfetti(ui.packFxLayer,230,true,true);
    if(!nativeHapticsAvailable && navigator.vibrate) navigator.vibrate([35,35,55,45,90]);

    setTimeout(()=>{
      if(celebrationToken!==packCelebrationToken) return;
      ui.packFxLayer.classList.remove('openingBurst');
      ui.packModal.classList.remove('revealBoom');
    },1850);
    setTimeout(()=>{
      if(celebrationToken!==packCelebrationToken) return;
      banner.remove();
      ui.packFxLayer.querySelectorAll('.packMegaSpark,.shopConfetti').forEach(el=>el.remove());
    },1650);
  }

  function updatePackLoadoutStatus(){
    const canEquip=!!activePackReward && ownedBalls.has(activePackReward);
    const equipped=canEquip && selectedBallType===activePackReward;
    const rewardName=(BALL_TYPES[activePackReward] || BALL_TYPES.normal).name;

    ui.packLoadoutStatus.classList.toggle('isEquipped',equipped);
    ui.packLoadoutStatus.classList.toggle('willEquip',canEquip && !equipped);
    ui.packLoadoutStatusIcon.textContent=equipped ? '✓' : '→';
    ui.packLoadoutStatusTitle.textContent=equipped ? 'EQUIPPED & READY' : 'READY TO TRY';
    ui.packLoadoutStatusDetail.textContent=equipped
      ? `${rewardName} is selected for your next level`
      : `Starting the level equips ${rewardName}`;
  }

  function showPackOverlay(mode){
    packCelebrationToken++;
    activePackMode=mode;
    activePackReward=null;

    // Starter pack starts the first game. Store packs stay in the store after opening.
    resumeGameAfterPack = mode==='starter';

    pauseForPack();

    ui.packOverlay.style.display='grid';
    ui.packOverlay.style.pointerEvents='auto';
    ui.packOverlay.setAttribute('aria-hidden','false');
    ui.packOverlay.classList.remove('packTransitionIn');
    document.body.classList.add('packOpen');
    ui.bigPack.classList.remove('opening','opened');
    ui.rewardReveal.classList.remove('show','megaReveal');
    ui.packContinue.classList.remove('show');
    ui.buyAnotherPack.classList.remove('show');
    ui.buyAnotherPack.disabled=false;
    ui.packLoadoutStatus.classList.remove('isEquipped','willEquip');
    ui.packLoadoutStatusIcon.textContent='→';
    ui.packLoadoutStatusTitle.textContent='REWARD READY';
    ui.packLoadoutStatusDetail.textContent='Open the pack to reveal your ball';
    ui.rewardBenefit.textContent='BALANCED GROWTH';
    ui.packFxLayer.classList.remove('openingBurst','preRevealCharge');
    ui.packModal.classList.remove('revealBoom','packAnticipation');
    ui.packFxLayer.querySelectorAll('.shopConfetti,.packDropBanner,.packMegaSpark,.packEquipSpark').forEach(el=>el.remove());
    ui.rewardReveal.querySelectorAll('.packEquipConfirmation').forEach(el=>el.remove());

    if(mode==='starter'){
      ui.packTitle.textContent='FREE STARTER PACK';
      ui.packSub.textContent='Tap the pack';
      ui.packContinue.textContent=`START LEVEL ${currentLevel}`;
    }else{
      ui.packTitle.textContent='PACK OPENING';
      ui.packSub.textContent='Tap the pack';
      ui.packContinue.textContent='PLAY WITH NEW BALL';
    }
  }

  function rollPackBall(){
    const total=PACK_POOL.reduce((s,x)=>s+x.weight,0);
    let r=Math.random()*total;
    for(const entry of PACK_POOL){
      r-=entry.weight;
      if(r<=0) return entry.type;
    }
    return 'normal';
  }

  function openCurrentPack(){
    if(ui.bigPack.classList.contains('opening') || ui.bigPack.classList.contains('opened')) return;

    sfx('packTap');
    ui.bigPack.classList.add('opening');
    ui.packSub.textContent='HOLD ON…';
    ui.packModal.classList.add('packAnticipation');

    // The reveal blast happens at the end of the escalating shake,
    // instead of firing immediately when the pack is tapped.
    setTimeout(()=>{
      if(ui.bigPack.classList.contains('opening')){
        ui.packFxLayer.classList.remove('preRevealCharge');
        void ui.packFxLayer.offsetWidth;
        ui.packFxLayer.classList.add('preRevealCharge');
      }
    },620);

    if(activePackMode==='starter'){
      activePackReward='normal';
    }else{
      activePackReward=rollPackBall();
    }

    setTimeout(()=>{
      ui.bigPack.classList.add('opened');
      ui.packContinue.classList.add('show');
      ui.buyAnotherPack.classList.toggle('show',activePackMode==='paid');
      ui.packSub.textContent=activePackMode==='starter' ? 'STARTER BALL UNLOCKED' : 'NEW BALL UNLOCKED';
      ui.packModal.classList.remove('packAnticipation');

      const rewardData=BALL_TYPES[activePackReward];

      const rewardClass={
        normal:'normalReward',
        swift:'swiftReward',
        shield:'shieldReward',
        magnet:'magnetReward',
        coin:'coinReward',
        giant:'giantReward',
        ghost:'ghostReward',
        legendary:'legendaryReward'
      }[activePackReward] || 'normalReward';

      ui.rewardBall.className='rewardBall '+rewardClass;
      setBallAssetBackground(ui.rewardBall,activePackReward);
      ui.rewardName.textContent=rewardData.name.toUpperCase();
      ui.rewardRarity.textContent=`${rewardData.rarity.toUpperCase()} BALL`;
      ui.rewardDesc.textContent=rewardData.desc;
      ui.rewardBenefit.textContent=BALL_BENEFITS[activePackReward] || 'SPECIAL POWER';
      if(activePackMode==='paid'){
        ui.packContinue.textContent=`PLAY WITH ${rewardData.name.toUpperCase()}`;
      }

      const wasOwned=ownedBalls.has(activePackReward);
      ownedBalls.add(activePackReward);

      if(wasOwned && activePackMode!=='starter'){
        ui.rewardDesc.textContent += ' • DUPLICATE';
      }

      if(activePackMode==='starter'){
        starterPackOpened=true;
        selectedBallType='normal';
      }
      queueProgressSave();

      // Start the reveal only after the shared asset, copy and rarity are ready.
      ui.rewardReveal.classList.add('show');
      celebratePackReveal(activePackReward,!wasOwned);

      updateCollectionUI();
      syncUI();
      updatePackLoadoutStatus();
    },860);
  }

  function buyAnotherPackFromReveal(){
    if(activePackMode!=='paid') return;

    if(walletCoins<PACK_PRICE){
      ui.packSub.textContent=`NEED ${PACK_PRICE-walletCoins} MORE COINS`;
      sfx('fail');
      return;
    }

    walletCoins-=PACK_PRICE;
    queueProgressSave();
    sfx('purchase');
    syncEconomyUI();

    ui.packSub.textContent='BUYING + OPENING…';
    ui.buyAnotherPack.disabled=true;
    shopConfetti(ui.packFxLayer,90,true);
    if(navigator.vibrate) navigator.vibrate([22,26,38]);
    ui.packModal.classList.remove('revealBoom');
    void ui.packModal.offsetWidth;
    ui.packModal.classList.add('revealBoom');

    // One tap now does the complete loop: buy -> reset -> automatically open.
    setTimeout(()=>{
      showPackOverlay('paid');
      setTimeout(()=>{
        openCurrentPack();
      },180);
    },280);
  }

  function closePackOverlay(){
    packCelebrationToken++;
    const finishedMode=activePackMode;

    // Fully remove the pack layer from both rendering and hit testing.
    ui.packOverlay.style.display='none';
    ui.packOverlay.style.pointerEvents='none';
    ui.packOverlay.setAttribute('aria-hidden','true');
    ui.packOverlay.classList.remove('packTransitionIn');
    document.body.classList.remove('packOpen');

    ui.packFxLayer.classList.remove('openingBurst','preRevealCharge');
    ui.packModal.classList.remove('revealBoom','packAnticipation');
    ui.bigPack.classList.remove('opening','opened');
    ui.rewardReveal.classList.remove('show','megaReveal');
    ui.packContinue.classList.remove('show');
    ui.buyAnotherPack.classList.remove('show');
    ui.packFxLayer.querySelectorAll('.shopConfetti,.packDropBanner,.packMegaSpark,.packEquipSpark').forEach(el=>el.remove());
    ui.rewardReveal.querySelectorAll('.packEquipConfirmation').forEach(el=>el.remove());

    activePackMode=null;
    activePackReward=null;

    if(finishedMode==='starter'){
      // The starter reward lands on Home so the player sees their new loadout,
      // progression, and the primary Level 1 action before entering gameplay.
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

    if(rewardToEquip && ownedBalls.has(rewardToEquip)){
      selectedBallType=rewardToEquip;
      collectionPreviewType=rewardToEquip;
      updateCollectionUI();
      queueProgressSave();
    }

    closePackOverlay();
    showScreen('game');

    // Packs are often opened from the post-level 25-gold prompt. In that case,
    // start the next level instead of returning to the completed result card.
    if(finishedLevel){
      if(wonFinishedLevel && currentLevel<MAX_LEVEL) currentLevel++;
      queueProgressSave();
      reset();
    }
  }

  function transitionStoreToPack(){
    if(storePackTransitioning) return;
    storePackTransitioning=true;
    ui.storeScreen.classList.add('packTransitionOut');
    ui.storeFxLayer.classList.add('packPortalTransition');

    setTimeout(()=>{
      showPackOverlay('paid');
      ui.packOverlay.classList.add('packTransitionIn');

      setTimeout(()=>{
        ui.storeScreen.classList.remove('packTransitionOut');
        ui.storeFxLayer.classList.remove('packPortalTransition');
        ui.packOverlay.classList.remove('packTransitionIn');
        storePackTransitioning=false;
      },720);
    },430);
  }

  function buyPack(){
    if(!starterPackOpened || !state || storePackTransitioning) return;

    if(walletCoins < PACK_PRICE){
      ui.storeMessage.textContent=`Need ${PACK_PRICE-walletCoins} more coins`;
      setTimeout(()=>{ui.storeMessage.textContent='';},1800);
      return;
    }

    walletCoins -= PACK_PRICE;
    void triggerNativeFeedback('heavy');
    queueProgressSave();
    syncEconomyUI();
    syncUI();

    ui.storeMessage.textContent='';
    celebratePackPurchase(ui.storeHero,'PACK PURCHASED!');

    // Give the purchase its own payoff before transitioning into the
    // separate pack-opening moment.
    setTimeout(()=>{
      ui.storeMessage.textContent='';
      transitionStoreToPack();
    },520);
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

  function startBall(ev){
    if(state?.tutorialActive){
      dismissLevelOneTutorial();
    }
    if(!state.running) return;
    ev.preventDefault();
    const p=pointerPos(ev);

    if(state.active || state.ballsLeft<=0) return;
    {
      const typeData=BALL_TYPES[selectedBallType] || BALL_TYPES.normal;
      const startR=BALL_MIN*(typeData.startSizeMult || 1);
      const isTouch=ev.pointerType==='touch' || !!ev.touches;
      const startX=Math.max(startR,Math.min(W-startR,p.x));
      const startY=Math.max(startR,Math.min(H-startR,p.y));
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
      addImpactRing(state.active.x,state.active.y,impactColor,105);
      addImpactRing(state.active.x,state.active.y,typeData.edge || '#3990ba',68);
      flashScreen(impactColor,.045);
      sfx('ballStart');
      startGrowSound();
      void beginNativeGrowthFeedback();

      if(BOSS_LEVELS.includes(currentLevel)){
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
    }
    state.ballsLeft--;
    state.message='Growing… collect coins!';
    state.messageT=.7;
    if(ev.pointerId !== undefined) canvas.setPointerCapture?.(ev.pointerId);
    syncUI();
  }

  function moveBall(ev){
    if(!state.active || !state.running) return;
    ev.preventDefault();
    const p=pointerPos(ev);
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
    if(!state.active || !state.running) return;
    ev?.preventDefault?.();

    // Releasing commits the ball. Only now is its area added to progress.
    state.placed.push({...state.active});
    stopGrowSound();
    void endNativeGrowthFeedback('locked');
    sfx('growthFinish');
    state.active=null;
    computeCoverage();

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
    stopGrowSound(true);
    void endNativeGrowthFeedback('hit');
    state.active=null;
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
    if(state.ballsLeft<=0) finish(false);
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
    hudFxHasVisuals=false;
  }

  function beginDefeatSequence(){
    if(!state || !state.running || state.settled || state.defeatSequence) return;

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

  function updateDefeatSequence(dt){
    const sequence=state.defeatSequence;
    if(!sequence) return;

    sequence.elapsed=Math.min(sequence.duration,sequence.elapsed+dt);
    const progress=sequence.elapsed/sequence.duration;
    const slowMotion=.018+.28*Math.pow(1-progress,2.2);

    // Preserve the final board state but let enemy momentum decay visibly.
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

  function update(dt){
    if(state.defeatSequence){
      updateDefeatSequence(dt);
      return;
    }
    if(!state.running) return;

    state.timeLeft-=dt;
    if(state.timeLeft<=0){
      state.timeLeft=0;
      finish(false);
      return;
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

    updateBossMechanics(dt);

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
      const growthResult=growBallIntoAvailableSpace(b,Math.sqrt(nextArea/Math.PI));
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
          e.trailTimer=e.boss ? .012 : (e.minion ? .018 : .022);
          e.trail.push({x:e.x,y:e.y,life:1});

          const trailCap=e.boss ? 38 : (e.minion ? 28 : 24);
          while(e.trail.length>trailCap) e.trail.shift();
        }
      }

      // Version 36 trails fade smoothly even while an enemy is frozen.
      for(const t of e.trail){
        t.life=Math.max(0,(t.life??1)-dt*(e.boss?1.05:(e.minion?1.35:1.48)));
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
        if(activeBall.ghostLeft>0){
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

  function measureCoverage(balls,n=110){
    return sampleCoverage(balls,W,H,n);
  }

  function computeCoverage(){
    state.coverage=measureCoverage(state.placed);
    state.liveCoverage=state.coverage;
  }

  function liveStarCount(coverage=state.coverage){
    return calculateLiveStars({
      coverage,
      targetCoverage:TARGET,
      timeLeft:state.timeLeft,
      startTime:START_TIME,
      ballsLeft:state.ballsLeft,
      startBalls:START_BALLS
    });
  }

  function starsForWin(){
    // On completion, guarantee at least 1★.
    return Math.max(1,liveStarCount());
  }

  function clearConfetti(){
    ui.confettiField.innerHTML='';
  }

  function launchConfetti(){
    clearConfetti();
    const palette=['#ffcf4d','#ff6f91','#68c7ff','#8de07a','#a77cff','#ff914d','#ffffff'];
    for(let i=0;i<72;i++){
      const piece=document.createElement('i');
      piece.className='confettiPiece';
      piece.style.left=(Math.random()*100)+'%';
      piece.style.background=palette[i%palette.length];
      piece.style.setProperty('--dur',(1.65+Math.random()*1.25)+'s');
      piece.style.setProperty('--delay',(Math.random()*.34)+'s');
      piece.style.setProperty('--drift',((-90+Math.random()*180))+'px');
      piece.style.setProperty('--spin',((300+Math.random()*900)*(Math.random()<.5?-1:1))+'deg');
      piece.style.width=(6+Math.random()*7)+'px';
      piece.style.height=(9+Math.random()*10)+'px';
      ui.confettiField.appendChild(piece);
    }
    setTimeout(clearConfetti,3300);
  }

  function animateRewardTransfer(runCoins,walletBefore,walletAfter,win){
    const token=++state.rewardAnimToken;
    const walletDelta=roundCoinAmount(walletAfter-walletBefore);
    const duration=Math.min(1600,700+Math.abs(walletDelta)*28);
    const start=performance.now();

    ui.coinTransfer.classList.add('transferring');
    ui.resultRunCoins.textContent=(win?'+':'-')+formatCoinAmount(runCoins);
    ui.resultWalletCoins.textContent=formatCoinAmount(walletBefore);

    // Start from the total the player saw during play, then bank or roll it back.
    ui.walletCoins.textContent=formatCoinAmount(walletBefore);
    ui.storeWalletCoins.textContent=formatCoinAmount(walletCoins);
    ui.collectionWalletCoins.textContent=formatCoinAmount(walletCoins);

    function frame(now){
      if(token!==state.rewardAnimToken) return;

      const t=Math.min(1,(now-start)/duration);
      const eased=1-Math.pow(1-t,3);
      const shownWallet=roundCoinAmount(walletBefore+walletDelta*eased);

      ui.resultWalletCoins.textContent=formatCoinAmount(shownWallet);
      ui.walletCoins.textContent=formatCoinAmount(shownWallet);

      if(Math.abs(walletDelta)>0 && Math.floor(t*10)%3===0){
        ui.resultWalletBucket.classList.remove('walletPunch');
        void ui.resultWalletBucket.offsetWidth;
        ui.resultWalletBucket.classList.add('walletPunch');
      }

      if(t<1){
        requestAnimationFrame(frame);
      }else{
        ui.coinTransfer.classList.remove('transferring');
        ui.resultWalletCoins.textContent=formatCoinAmount(walletAfter);
        ui.walletCoins.textContent=formatCoinAmount(walletAfter);
        ui.storeWalletCoins.textContent=formatCoinAmount(walletAfter);
        ui.collectionWalletCoins.textContent=formatCoinAmount(walletAfter);
        ui.resultWalletBucket.classList.add('walletPunch');
      }
    }

    requestAnimationFrame(frame);
  }

  function showLevelCelebration(win,runCoins,payout,walletBefore,walletAfter,stars){
    ui.resultCard.classList.remove('celebrate');
    ui.completionBadge.classList.remove('show');
    void ui.resultCard.offsetWidth;

    ui.resultCard.classList.add('celebrate');

    if(win){
      ui.completionBadge.textContent='CONGRATULATIONS!';
      ui.completionBadge.classList.add('show');
      launchConfetti();
    }else{
      ui.completionBadge.textContent='RUN ENDED';
      ui.completionBadge.classList.add('show');
      clearConfetti();
    }

    ui.rewardFormula.textContent=win
      ? `+${formatCoinAmount(payout)} GOLD BANKED`
      : `-${formatCoinAmount(runCoins)} GOLD`;

    animateRewardTransfer(runCoins,walletBefore,walletAfter,win);
  }

  function finish(win){
    if(!state || state.settled || state.defeatSequence) return;
    if(!win){
      beginDefeatSequence();
      return;
    }
    if(!state.running) return;
    finalizeFinish(true);
  }

  function finalizeFinish(win){
    void endNativeGrowthFeedback('complete');
    void triggerNativeFeedback(win ? 'success' : 'error');
    if(!state || state.settled) return;
    const runCoins=roundCoinAmount(state.scoreCoins);
    const bankedWalletBefore=roundCoinAmount(walletCoins);
    const walletBefore=roundCoinAmount(walletCoins+runCoins);
    clearFinishedLevelCoins();
    state.running=false;
    state.lastWin=win;
    state.settled=true;
    stopGrowSound();
    sfx(win?'win':'fail');
    if(win){
      flashScreen('#fff0a8',.08);
    }
    if(state.active){
      if(win) state.placed.push({...state.active});
      state.active=null;
    }
    computeCoverage();
    const cfg=enemyConfig(currentLevel);
    const stars=win?starsForWin():0;
    const mult=win ? STAR_MULTIPLIERS[stars]*cfg.rewardMult : 1.00;
    const payout=win ? roundCoinAmount(runCoins*mult) : 0;
    if(win){
      walletCoins=roundCoinAmount(walletCoins+payout);
      highestCompletedLevel=Math.max(highestCompletedLevel,currentLevel);
      queueProgressSave();
    }
    const walletAfter=roundCoinAmount(walletCoins);
    state.scoreCoins=0;

    const nextCfg=enemyConfig(Math.min(MAX_LEVEL,currentLevel+1));
    const bossReward=(win && cfg.boss) ? unlockBoosterForBoss(currentLevel) : null;
    const campaignComplete=win && currentLevel===MAX_LEVEL;

    ui.resultTitle.textContent=campaignComplete
      ? '200 LEVELS COMPLETE'
      : (win?`LEVEL ${currentLevel} COMPLETE`:`LEVEL ${currentLevel} — DEFEAT`);

    ui.stars.textContent=win?('★'.repeat(stars)+'☆'.repeat(3-stars)):'☆☆☆';

    const rewardLine=bossReward
      ? `<strong>${bossReward.icon} BOOSTER UNLOCKED</strong><br>${bossReward.name}`
      : '';

    const encounterRewardLine=win && cfg.miniBoss
      ? '<strong>♛ MINI BOSS DEFEATED!</strong><br>35% GOLD BONUS CLAIMED'
      : (win && cfg.rushEvent
          ? '<strong>⚡ RUSH SURVIVED!</strong><br>15% GOLD BONUS CLAIMED'
          : '');

    const earlyPackProgress=win && currentLevel<=10
      ? (walletAfter>=PACK_PRICE
          ? '<strong>PACK READY!</strong><br>Open the store to reveal a new ball.'
          : `<strong>${formatCoinAmount(PACK_PRICE-walletAfter)} GOLD TO NEXT PACK</strong><br>Keep filling to grow your collection.`)
      : '';

    // Keep the normal result card intentionally minimal for small phones.
    // Only surface special rewards / campaign milestones here.
    ui.resultText.innerHTML=win
      ? (campaignComplete
          ? '<strong>ALL BOSSES DEFEATED!</strong>'
          : (rewardLine || encounterRewardLine || earlyPackProgress))
      : '<strong>TRY AGAIN!</strong>';

    ui.again.textContent=campaignComplete?'Replay final boss':(win?'NEXT LEVEL':'RETRY');
    ui.overlay.classList.toggle('defeatResult',!win);
    ui.resultCard.classList.toggle('defeat',!win);
    ui.overlay.style.display='grid';
    syncUI();
    showLevelCelebration(win,runCoins,payout,walletBefore,walletAfter,stars);
    if(win) scheduleFirstPackMilestone(bankedWalletBefore,walletAfter);
  }

  function syncUI(){
    const cfg=enemyConfig(currentLevel);
    ui.level.textContent=currentLevel;
    ui.levelChallenge.textContent=`LEVEL ${currentLevel} • ${cfg.challenge}`;
    ui.levelGoal.textContent=`GOAL ${TARGET}%`;
    ui.boardWrap.classList.toggle('speedRushLevel',cfg.rushEvent);
    ui.boardWrap.classList.toggle('miniBossLevel',cfg.miniBoss);
    ui.levelChallenge.classList.toggle('speedRushLevel',cfg.rushEvent);
    ui.levelChallenge.classList.toggle('miniBossLevel',cfg.miniBoss);
    const worldProfile=worldProfileForLevel(currentLevel);
    ui.difficulty.textContent=cfg.boss
      ? `${worldProfile.name} • ${cfg.minions} minions • Speed ×${cfg.speedMult.toFixed(2)}`
      : (cfg.miniBoss
          ? `${encounterProfileForLevel(currentLevel).name} • ${cfg.minions} guards • Gold ×${cfg.rewardMult.toFixed(2)}`
          : (cfg.rushEvent
              ? `Enemy Rush • ${cfg.count} enemies • Speed ×${cfg.speedMult.toFixed(2)} • Gold ×${cfg.rewardMult.toFixed(2)}`
              : `World ${cfg.world+1} • ${cfg.count} enemies • Speed ×${cfg.speedMult.toFixed(2)} • Reaction ${cfg.seekStrength.toFixed(2)}`));
    ui.difficulty.style.color=worldProfile.fill;
    ui.time.textContent=state.timeLeft.toFixed(1);
    ui.balls.textContent=state.ballsLeft;
    const equippedBall=BALL_TYPES[selectedBallType] || BALL_TYPES.normal;
    setBallAssetBackground(ui.hudBallVisual,selectedBallType);
    const hudCollectionLabel=`Open collection. ${equippedBall.name} equipped. ${state.ballsLeft} balls left.`;
    ui.hudCollectionButton.setAttribute('aria-label',hudCollectionLabel);
    ui.hudCollectionButton.title=`${equippedBall.name} equipped • Open collection`;
    ui.coins.textContent=formatCoinAmount(state.scoreCoins);
    if(currentScreen==='game'){
      const pendingCoins=!state.settled ? state.scoreCoins : 0;
      ui.walletCoins.textContent=formatCoinAmount(walletCoins+pendingCoins);
    }else{
      syncEconomyUI();
    }
    const displayedCoverage=state.active ? state.liveCoverage : state.coverage;
    ui.coverage.textContent=displayedCoverage.toFixed(1);
    const progressPct=Math.max(0,Math.min(100,displayedCoverage/TARGET*100));
    const seg1=Math.max(0,Math.min(100,(progressPct/33.333)*100));
    const seg2=Math.max(0,Math.min(100,((progressPct-33.333)/33.333)*100));
    const seg3=Math.max(0,Math.min(100,((progressPct-66.666)/33.334)*100));
    ui.progressFill1.style.width=seg1+'%';
    ui.progressFill2.style.width=seg2+'%';
    ui.progressFill3.style.width=seg3+'%';

    // Resource efficiency contributes to the live rating, but a star cannot
    // light up before its matching fill milestone has actually been reached.
    const coverageStarGate=Math.min(3,Math.floor((displayedCoverage/(TARGET/3))+1e-6));
    const liveStars=Math.min(liveStarCount(displayedCoverage),coverageStarGate);
    ui.progressStars.textContent='★'.repeat(liveStars)+'☆'.repeat(3-liveStars);

    document.querySelector('.starMarker1')?.classList.toggle('earned',liveStars>=1);
    document.querySelector('.starMarker2')?.classList.toggle('earned',liveStars>=2);
    document.querySelector('.starMarker3')?.classList.toggle('earned',liveStars>=3);

    if(state.boosterFeedbackT>0){
      ui.boosterStatus.textContent=state.boosterFeedbackText;
      ui.boosterStatus.style.setProperty('--booster-accent',state.boosterFeedbackColor);
      ui.boosterStatus.classList.add('boosterActivated');
      ui.boosterStatus.classList.remove('boosterCountdown');
      ui.boosterStatus.setAttribute('aria-live','polite');
    }else if(state.frenzyLeft>0){
      ui.boosterStatus.textContent=`🧲 ${state.frenzyLeft.toFixed(1)}s`;
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

  function syncHudFxCanvas(){
    const rect=ui.gameScreen.getBoundingClientRect();
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const nextW=Math.max(1,Math.round(rect.width*dpr));
    const nextH=Math.max(1,Math.round(rect.height*dpr));

    if(hudFxCanvas.width!==nextW || hudFxCanvas.height!==nextH){
      hudFxCanvas.width=nextW;
      hudFxCanvas.height=nextH;
      hudFxCtx.setTransform(dpr,0,0,dpr,0,0);
    }
  }

  function boardPointToHudFx(x,y){
    const canvasRect=canvas.getBoundingClientRect();
    const fxRect=hudFxCanvas.getBoundingClientRect();
    return {
      x:(canvasRect.left - fxRect.left) + (x/W)*canvasRect.width,
      y:(canvasRect.top - fxRect.top) + (y/H)*canvasRect.height
    };
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

    state.coinFx.push({
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

  function renderHudCoinFx(){
    const hasCoinFlights=!!state?.coinFx?.some(effect=>effect.type==='coin');
    if(!hasCoinFlights){
      if(!hudFxHasVisuals) return;
      hudFxCtx.save();
      hudFxCtx.setTransform(1,0,0,1,0,0);
      hudFxCtx.clearRect(0,0,hudFxCanvas.width,hudFxCanvas.height);
      hudFxCtx.restore();
      hudFxHasVisuals=false;
      return;
    }

    hudFxHasVisuals=true;
    syncHudFxCanvas();
    const rect=ui.gameScreen.getBoundingClientRect();
    hudFxCtx.clearRect(0,0,rect.width,rect.height);

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
  }

  function pulseCoinHud(){
    sfx('coinLand');
    ui.gameWalletPill.classList.remove('coinCatch');
    void ui.gameWalletPill.offsetWidth;
    ui.gameWalletPill.classList.add('coinCatch');
    setTimeout(()=>ui.gameWalletPill.classList.remove('coinCatch'),330);
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

  function draw(){
    gameBridge.publish({
      width:W,
      height:H,
      now:performance.now()/1000,
      currentLevel,
      selectedBallType,
      state
    });
    if(gameBridge.shouldRenderWithPhaser()) return;

    ctx.clearRect(0,0,W,H);

    ctx.save();
    if(state.shakeT>0 && state.shakePower>0){
      const fade=Math.min(1,state.shakeT/.22);
      const sx=(Math.random()*2-1)*state.shakePower*fade;
      const sy=(Math.random()*2-1)*state.shakePower*fade;
      ctx.translate(sx,sy);
    }

    ctx.fillStyle=COLORS.bg;ctx.fillRect(-20,-20,W+40,H+40);

    // The arena grid is static, so render its cached layer in one draw call.
    if(arenaGridCanvas.width!==W || arenaGridCanvas.height!==H) rebuildArenaGrid();
    ctx.drawImage(arenaGridCanvas,0,0);

    // Locked balls
    for(const b of state.placed) drawBall(b,false);

    // Coin Frenzy magnet aura
    if(state.frenzyLeft>0){
      const magnet=frenzyMagnetTarget();
      ctx.save();
      const pulse=1+.08*Math.sin(performance.now()/90);
      ctx.globalAlpha=.28;
      ctx.strokeStyle='#8b6edb';
      ctx.lineWidth=7;
      ctx.setLineDash([13,10]);
      ctx.beginPath();
      ctx.arc(magnet.x,magnet.y,(magnet.r+58)*pulse,0,Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha=.12;
      ctx.fillStyle='#8b6edb';
      ctx.beginPath();
      ctx.arc(magnet.x,magnet.y,magnet.r+48,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // Coins
    const now=performance.now()/1000;
    for(const c of state.coins){
      const bob=Math.sin(now*3+c.pulse)*2.5;
      drawCoin(
        c.x,
        c.y+bob,
        c.r*(1+.06*Math.sin(now*5+c.pulse)),
        now*.8+c.pulse
      );
    }

    // Enemy motion trails
    for(const e of state.enemies) drawEnemyTrail(e);

    // Enemies
    for(const e of state.enemies) drawEnemy(e);

    // Active ball
    if(state.active) drawBall(state.active,true);

    // Pop and pickup particles stay in arena space. Collected coins render only on the
    // HUD FX canvas so there is one flight into the top gold icon.
    for(const f of state.coinFx){
      if(f.type==='coin') continue;
      if(f.type==='coinSpark'){
        const alpha=Math.max(0,f.life/f.maxLife);
        ctx.save();
        ctx.translate(f.x,f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha=alpha;
        ctx.strokeStyle=f.color;
        ctx.shadowColor=f.color;
        ctx.shadowBlur=10;
        ctx.lineWidth=Math.max(1.2,f.r*.42);
        ctx.beginPath();
        ctx.moveTo(-f.r*1.7,0);
        ctx.lineTo(f.r*1.7,0);
        ctx.moveTo(0,-f.r*1.7);
        ctx.lineTo(0,f.r*1.7);
        ctx.stroke();
        ctx.fillStyle='#fff7bd';
        ctx.beginPath();
        ctx.arc(0,0,Math.max(1,f.r*.45),0,Math.PI*2);
        ctx.fill();
        ctx.restore();
        continue;
      }
      if(f.type==='shieldShard'){
        const alpha=Math.max(0,f.life/f.maxLife);
        ctx.save();
        ctx.translate(f.x,f.y);
        ctx.rotate(f.rotation);
        ctx.globalAlpha=alpha;
        ctx.fillStyle=f.color;
        ctx.strokeStyle='#ffffff';
        ctx.shadowColor=f.color;
        ctx.shadowBlur=12;
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(f.r*1.8,0);
        ctx.lineTo(-f.r*.75,f.r*.7);
        ctx.lineTo(-f.r*.35,-f.r*.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        continue;
      }
      ctx.save();ctx.globalAlpha=Math.max(0,f.life/.45);ctx.fillStyle=COLORS.ball;
      ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();ctx.restore();
    }

    if(state.freezeLeft>0){
      ctx.save();ctx.strokeStyle=COLORS.freeze;ctx.lineWidth=6;ctx.globalAlpha=.7;
      ctx.strokeRect(4,4,W-8,H-8);ctx.restore();
    }

    // Boss debuff visual telegraphs.
    if(state.frostDebuffLeft>0){
      ctx.save();
      ctx.strokeStyle='#83e5ff';
      ctx.lineWidth=10;
      ctx.globalAlpha=.7+.2*Math.sin(performance.now()/90);
      ctx.strokeRect(5,5,W-10,H-10);
      ctx.fillStyle='rgba(115,220,255,.07)';
      ctx.fillRect(0,0,W,H);
      ctx.restore();
    }

    if(state.minionSurgeLeft>0){
      ctx.save();
      ctx.strokeStyle='#ffe156';
      ctx.lineWidth=8;
      ctx.globalAlpha=.55+.25*Math.sin(performance.now()/70);
      ctx.setLineDash([18,10]);
      ctx.strokeRect(6,6,W-12,H-12);
      ctx.restore();
    }

    if(state.boosterLockLeft>0){
      ctx.save();
      ctx.fillStyle='rgba(70,18,100,.09)';
      ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='#c66bff';
      ctx.lineWidth=9;
      ctx.globalAlpha=.72;
      ctx.strokeRect(5,5,W-10,H-10);
      ctx.restore();
    }

    for(const ring of state.impactRings){
      ctx.save();
      ctx.globalAlpha=Math.max(0,ring.life)*.65;
      ctx.strokeStyle=ring.color;
      ctx.lineWidth=5*ring.life+1;
      ctx.beginPath();
      ctx.arc(ring.x,ring.y,ring.r,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    if(state.bossFlashT>0){
      ctx.save();
      const profile=worldProfileForLevel(currentLevel);
      ctx.globalAlpha=Math.min(.23,state.bossFlashT*.42);
      ctx.fillStyle=profile.edge;
      ctx.fillRect(0,0,W,H);
      ctx.restore();
    }

    ctx.restore();

    if(state.screenFlashT>0){
      ctx.save();
      ctx.globalAlpha=Math.min(.22,state.screenFlashT*1.5);
      ctx.fillStyle=state.screenFlashColor;
      ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
  }

  function drawBall(b,active){
    const type=b.type || 'normal';
    const style=BALL_TYPES[type] || BALL_TYPES.normal;
    const now=performance.now()/1000;

    ctx.save();

    // Type-specific visual effects
    if(type==='swift'){
      ctx.save();
      ctx.globalAlpha=.22;
      ctx.strokeStyle='#8ee0bd';
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+9+3*Math.sin(now*7),0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    if(active && (b.shieldHits||0) > 0){
      const shieldCount=Math.max(0,Math.floor(b.shieldHits||0));
      const shieldFlash=Math.min(1,(b.shieldFlash||0)/.34);
      ctx.save();

      ctx.globalAlpha=.07+.05*Math.sin(now*5);
      ctx.fillStyle=shieldLayerColor(type,0);
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+7,0,Math.PI*2);
      ctx.fill();

      for(let layer=0;layer<shieldCount;layer++){
        const color=shieldLayerColor(type,layer);
        const radius=b.r+10+layer*8+shieldFlash*4;
        ctx.globalAlpha=.72+.16*Math.sin(now*4.8+layer*1.4);
        ctx.strokeStyle=color;
        ctx.shadowColor=color;
        ctx.shadowBlur=12+layer*3;
        ctx.lineWidth=4.5-layer*.35+shieldFlash*2;
        ctx.setLineDash(layer===0 ? [5,4] : [11,6]);
        ctx.lineDashOffset=(layer===0 ? -1 : 1)*now*28;
        ctx.beginPath();
        ctx.arc(b.x,b.y,radius,0,Math.PI*2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
      const pipGap=14;
      const pipY=b.y-b.r-20-(shieldCount-1)*4;
      for(let layer=0;layer<shieldCount;layer++){
        const pipX=b.x+(layer-(shieldCount-1)/2)*pipGap;
        const color=shieldLayerColor(type,layer);
        ctx.globalAlpha=.95;
        ctx.fillStyle=color;
        ctx.strokeStyle='#ffffff';
        ctx.shadowColor=color;
        ctx.shadowBlur=10;
        ctx.lineWidth=1.5;
        ctx.beginPath();
        ctx.moveTo(pipX,pipY-5);
        ctx.lineTo(pipX+5,pipY);
        ctx.lineTo(pipX,pipY+5);
        ctx.lineTo(pipX-5,pipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    if(type==='ghost'){
      ctx.save();
      ctx.globalAlpha=(b.ghostLeft>0?.45:.18);
      ctx.strokeStyle='#d9f5ff';
      ctx.lineWidth=7;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+12+3*Math.sin(now*5),0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    if(type==='coin'){
      ctx.save();
      ctx.globalAlpha=.24;
      ctx.strokeStyle='#ffd85f';
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+10+2*Math.sin(now*6),0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    if(type==='giant'){
      ctx.save();
      ctx.globalAlpha=.15;
      ctx.strokeStyle='#d8845c';
      ctx.lineWidth=7;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+8,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    if(type==='magnet'){
      ctx.save();
      ctx.globalAlpha=.22;
      ctx.strokeStyle='#d99be9';
      ctx.lineWidth=5;
      ctx.setLineDash([7,8]);
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+18+4*Math.sin(now*5),0,Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    if(type==='cataclysm'){
      ctx.save();

      // Fire halo
      ctx.globalAlpha=.20+.06*Math.sin(now*7);
      ctx.strokeStyle='#ff5538';
      ctx.lineWidth=9;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+11+3*Math.sin(now*5),0,Math.PI*2);
      ctx.stroke();

      // Electric rotating dashed ring
      ctx.globalAlpha=.62;
      ctx.strokeStyle='#ffe36e';
      ctx.lineWidth=3;
      ctx.setLineDash([4,8]);
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+17,now*2.5,now*2.5+Math.PI*1.7);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ice orbit
      ctx.globalAlpha=.42;
      ctx.strokeStyle='#8eeaff';
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.ellipse(b.x,b.y,b.r+23,b.r*.48,now*.55,0,Math.PI*2);
      ctx.stroke();

      // Sparks
      for(let i=0;i<5;i++){
        const a=now*(1.6+i*.03)+i*Math.PI*2/5;
        const rr=b.r+18+4*Math.sin(now*5+i);
        ctx.globalAlpha=.72;
        ctx.fillStyle=i%3===0?'#8eeaff':(i%2?'#ffe56c':'#ff6543');
        ctx.beginPath();
        ctx.arc(b.x+Math.cos(a)*rr,b.y+Math.sin(a)*rr,2.3,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    if(type==='gaia'){
      ctx.save();

      ctx.globalAlpha=.20+.07*Math.sin(now*4);
      ctx.strokeStyle='#70e17f';
      ctx.lineWidth=9;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+12+3*Math.sin(now*4),0,Math.PI*2);
      ctx.stroke();

      // Orbiting leaf particles
      for(let i=0;i<7;i++){
        const a=now*.75+i*Math.PI*2/7;
        const rr=b.r+20+5*Math.sin(now*2+i);
        const lx=b.x+Math.cos(a)*rr;
        const ly=b.y+Math.sin(a)*rr;

        ctx.save();
        ctx.translate(lx,ly);
        ctx.rotate(a+.8);
        ctx.globalAlpha=.62;
        ctx.fillStyle=i%2?'#a8ed7d':'#62cb63';
        ctx.beginPath();
        ctx.ellipse(0,0,4.5,2.3,0,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      ctx.globalAlpha=.24;
      ctx.strokeStyle='#d7f7a9';
      ctx.lineWidth=2.5;
      ctx.setLineDash([6,9]);
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+20,0,Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    if(type==='apex'){
      ctx.save();
      ctx.globalAlpha=.22;
      ctx.strokeStyle='#ff64e8';
      ctx.lineWidth=8;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+14+4*Math.sin(now*6),0,Math.PI*2);
      ctx.stroke();
      ctx.globalAlpha=.18;
      ctx.strokeStyle='#7ed6ff';
      ctx.beginPath();
      ctx.ellipse(b.x,b.y,b.r+26,b.r*0.42,0.32,0,Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(b.x,b.y,b.r*0.42,b.r+26,0.32,0,Math.PI*2);
      ctx.stroke();
      for(let i=0;i<5;i++){
        const a=now*1.4 + i*Math.PI*2/5;
        const rr=b.r+20+4*Math.sin(now*4+i);
        const sx=b.x+Math.cos(a)*rr;
        const sy=b.y+Math.sin(a)*rr;
        ctx.fillStyle=i%2?'#ffefae':'#ff73df';
        ctx.globalAlpha=.74;
        ctx.beginPath();
        ctx.arc(sx,sy,2.5+1.2*Math.sin(now*7+i),0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Legendary aura / rare effect
    if(type==='legendary'){
      const pulse=1 + 0.045*Math.sin(now*5.5 + b.x*.01);
      ctx.save();
      ctx.globalAlpha=.22;
      ctx.strokeStyle='#ffb238';
      ctx.lineWidth=8;
      ctx.beginPath();
      ctx.arc(b.x,b.y,(b.r+11)*pulse,0,Math.PI*2);
      ctx.stroke();

      ctx.globalAlpha=.12;
      ctx.strokeStyle='#ffd36b';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(b.x,b.y,(b.r+19)*(1+0.03*Math.sin(now*7)),0,Math.PI*2);
      ctx.stroke();

      // Orbiting sparkles
      for(let i=0;i<6;i++){
        const a=now*(1.2+i*.06)+i*Math.PI*2/6;
        const rr=b.r+18+5*Math.sin(now*3+i);
        const sx=b.x+Math.cos(a)*rr;
        const sy=b.y+Math.sin(a)*rr;
        const sr=2.4 + 1.5*(.5+.5*Math.sin(now*8+i));
        ctx.globalAlpha=.65;
        ctx.fillStyle=i%2===0?'#ffd66b':'#fff1ad';
        ctx.beginPath();
        ctx.arc(sx,sy,sr,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    if(active){
      const punch=b.spawnPunch||0;
      const chargePulse=.5+.5*Math.sin(now*9);
      const energyR=b.r + 10 + chargePulse*7;

      // Continuous charging aura.
      ctx.save();
      ctx.globalAlpha=.12 + .10*chargePulse;
      ctx.strokeStyle=style.highlight || '#ffffff';
      ctx.lineWidth=9;
      ctx.beginPath();
      ctx.arc(b.x,b.y,energyR,0,Math.PI*2);
      ctx.stroke();

      ctx.globalAlpha=.45;
      ctx.strokeStyle=style.edge || '#3990ba';
      ctx.lineWidth=2.5;
      ctx.setLineDash([4,9]);
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+16+chargePulse*4,now*2,now*2+Math.PI*1.65);
      ctx.stroke();
      ctx.setLineDash([]);

      // Initial press "BOOM": contracting bright rings + radial sparks.
      if(punch>0){
        const burst=1-punch;
        ctx.globalAlpha=punch*.78;
        ctx.strokeStyle='#ffffff';
        ctx.lineWidth=3+5*punch;
        ctx.beginPath();
        ctx.arc(b.x,b.y,b.r+10+burst*35,0,Math.PI*2);
        ctx.stroke();

        ctx.globalAlpha=punch*.62;
        ctx.strokeStyle=style.highlight || '#ffffff';
        ctx.lineWidth=3;
        for(let i=0;i<12;i++){
          const a=i*Math.PI*2/12 + now*.3;
          const r1=b.r+13+burst*8;
          const r2=r1+10+18*punch;
          ctx.beginPath();
          ctx.moveTo(b.x+Math.cos(a)*r1,b.y+Math.sin(a)*r1);
          ctx.lineTo(b.x+Math.cos(a)*r2,b.y+Math.sin(a)*r2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Main ball
    ctx.shadowColor=type==='legendary'
      ? 'rgba(243,145,33,.28)'
      : 'rgba(50,70,90,.15)';
    ctx.shadowBlur=type==='legendary' ? 14 : 0;
    ctx.shadowOffsetX=7;
    ctx.shadowOffsetY=9;

    const sharedAsset=BALL_ASSET_IMAGES[type] || BALL_ASSET_IMAGES.normal;
    const sharedAssetReady=sharedAsset?.complete && sharedAsset.naturalWidth>0;

    if(sharedAssetReady){
      // The same canonical SVG is used by gameplay, Collection, Store, and pack reveals.
      ctx.drawImage(sharedAsset,b.x-b.r,b.y-b.r,b.r*2,b.r*2);
      ctx.shadowColor='transparent';
    }else{
      // First-frame fallback while the tiny SVG asset finishes decoding.
      ctx.fillStyle=style.fill;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
      ctx.fill();

      ctx.shadowColor='transparent';
      ctx.strokeStyle=active
        ? (type==='legendary' ? '#a74605' : '#227ea8')
        : style.edge;
      ctx.lineWidth=active?6:4;
      ctx.stroke();

      ctx.globalAlpha=.78;
      ctx.fillStyle=style.highlight;
      ctx.beginPath();
      ctx.arc(
        b.x-b.r*.28,
        b.y-b.r*.32,
        Math.max(5,b.r*.17),
        0,Math.PI*2
      );
      ctx.fill();
    }

    // Legendary inner shimmer
    if(type==='legendary'){
      ctx.globalAlpha=.23 + .08*Math.sin(now*6);
      ctx.strokeStyle='#fff0a6';
      ctx.lineWidth=Math.max(2,b.r*.035);
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r*.78,Math.PI*.15,Math.PI*1.2);
      ctx.stroke();
    }

    if(active){
      ctx.globalAlpha=.82;
      ctx.strokeStyle='#ffffff';
      ctx.setLineDash([9,9]);
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(b.x,b.y,b.r+5,0,Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawCoin(x,y,r,rotation=0){
    ctx.save();
    ctx.translate(x,y);

    const glow=ctx.createRadialGradient(0,0,r*.35,0,0,r*1.5);
    glow.addColorStop(0,'rgba(255,210,55,.3)');
    glow.addColorStop(.58,'rgba(255,190,28,.14)');
    glow.addColorStop(1,'rgba(255,184,20,0)');
    ctx.fillStyle=glow;
    ctx.beginPath();
    ctx.arc(0,0,r*1.5,0,Math.PI*2);
    ctx.fill();

    const face=ctx.createRadialGradient(-r*.34,-r*.38,r*.08,0,0,r);
    face.addColorStop(0,'#fff9b0');
    face.addColorStop(.28,'#ffe25a');
    face.addColorStop(.67,'#ffc42c');
    face.addColorStop(1,'#e69a0b');
    ctx.shadowColor='rgba(171,107,5,.28)';
    ctx.shadowBlur=r*.38;
    ctx.shadowOffsetY=r*.16;
    ctx.fillStyle=face;
    ctx.strokeStyle='#d78c08';
    ctx.lineWidth=Math.max(3,r*.16);
    ctx.beginPath();
    ctx.arc(0,0,r,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor='transparent';
    ctx.strokeStyle='rgba(255,247,164,.9)';
    ctx.lineWidth=Math.max(2,r*.1);
    ctx.beginPath();
    ctx.arc(0,0,r*.76,0,Math.PI*2);
    ctx.stroke();

    ctx.save();
    ctx.rotate(Math.sin(rotation)*.1);
    ctx.fillStyle='#fff383';
    ctx.strokeStyle='#dc980d';
    ctx.lineWidth=Math.max(1.3,r*.07);
    ctx.beginPath();
    for(let point=0;point<10;point++){
      const angle=-Math.PI/2+point*Math.PI/5;
      const pointRadius=point%2===0?r*.43:r*.2;
      const starX=Math.cos(angle)*pointRadius;
      const starY=Math.sin(angle)*pointRadius;
      if(point===0) ctx.moveTo(starX,starY);
      else ctx.lineTo(starX,starY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle='rgba(255,255,222,.88)';
    ctx.beginPath();
    ctx.ellipse(-r*.32,-r*.38,r*.17,r*.1,-.45,0,Math.PI*2);
    ctx.fill();

    if(r>=18){
      ctx.strokeStyle='rgba(255,255,225,.92)';
      ctx.lineWidth=1.8;
      ctx.beginPath();
      ctx.moveTo(r*.62,-r*.77);
      ctx.lineTo(r*.62,-r*.45);
      ctx.moveTo(r*.46,-r*.61);
      ctx.lineTo(r*.78,-r*.61);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemyTrail(e){
    if(!e.trail || e.trail.length<2) return;

    const profile=BOSS_PROFILES[e.worldIndex] || BOSS_PROFILES[1];
    const n=e.trail.length;

    ctx.save();
    ctx.lineCap='round';
    ctx.lineJoin='round';

    // Soft glow ribbon.
    for(let i=1;i<n;i++){
      const a=e.trail[i-1];
      const b=e.trail[i];
      const progress=i/(n-1);
      const life=Math.min(a.life??1,b.life??1);
      if(life<=0) continue;
      const widthBase=e.boss ? e.r*1.22 : (e.minion ? e.r*.88 : e.r*.72);

      ctx.globalAlpha=life*progress*(e.boss?.19:(e.minion?.13:.10));
      ctx.strokeStyle=profile.glow || profile.trail;
      ctx.shadowColor=profile.glow || profile.trail;
      ctx.shadowBlur=e.boss ? 26 : (e.minion ? 18 : 14);
      ctx.lineWidth=Math.max(4,widthBase*progress*1.55);
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }

    // Main colored ribbon.
    for(let i=1;i<n;i++){
      const a=e.trail[i-1];
      const b=e.trail[i];
      const progress=i/(n-1);
      const life=Math.min(a.life??1,b.life??1);
      if(life<=0) continue;
      const widthBase=e.boss ? e.r*.96 : (e.minion ? e.r*.68 : e.r*.56);

      ctx.globalAlpha=life*progress*(e.boss?.44:(e.minion?.31:.25));
      ctx.shadowBlur=0;
      ctx.strokeStyle=profile.trail;
      ctx.lineWidth=Math.max(2.5,widthBase*progress*1.18);
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }

    // Bright energy core.
    for(let i=1;i<n;i++){
      const a=e.trail[i-1];
      const b=e.trail[i];
      const progress=i/(n-1);
      const life=Math.min(a.life??1,b.life??1);
      if(life<=0) continue;
      const widthBase=e.boss ? e.r*.42 : (e.minion ? e.r*.30 : e.r*.24);

      ctx.globalAlpha=life*progress*(e.boss?.58:(e.minion?.42:.34));
      ctx.strokeStyle='#fff7d2';
      ctx.lineWidth=Math.max(1.2,widthBase*progress);
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();
    }

    // Round sparks preserve the version 36 enemy language.
    for(let i=0;i<n;i+=2){
      const t=e.trail[i];
      const progress=(i+1)/n;
      const alpha=(t.life??1)*progress*(e.boss?.62:(e.minion?.34:.26));
      if(alpha<=0) continue;
      const rr=Math.max(1.8,e.r*(e.boss?.23:(e.minion?.16:.13))*progress);

      ctx.globalAlpha=alpha;
      ctx.shadowColor=profile.glow || profile.edge;
      ctx.shadowBlur=e.boss ? 18 : 10;
      ctx.fillStyle=(i%4===0 && e.boss) ? '#fff0a8' : profile.edge;
      ctx.beginPath();
      ctx.arc(t.x,t.y,rr,0,Math.PI*2);
      ctx.fill();
    }

    if(e.boss){
      for(let i=1;i<n;i+=4){
        const t=e.trail[i];
        const progress=(i+1)/n;
        const alpha=(t.life??1)*progress*.62;
        if(alpha<=0) continue;
        const s=2.2+3.8*progress;

        ctx.globalAlpha=alpha;
        ctx.shadowColor=profile.edge;
        ctx.shadowBlur=12;
        ctx.strokeStyle='#fff7cb';
        ctx.lineWidth=1.5;
        ctx.beginPath();
        ctx.moveTo(t.x-s,t.y);
        ctx.lineTo(t.x+s,t.y);
        ctx.moveTo(t.x,t.y-s);
        ctx.lineTo(t.x,t.y+s);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawEnemy(e){
    ctx.save();
    ctx.translate(e.x,e.y);

    const drawR=e.r*(state.enemyGrowLeft>0?1.30:1);
    if(e.boss){
      const profile=BOSS_PROFILES[e.bossIndex] || BOSS_PROFILES[1];
      const pulse=1+.04*Math.sin(performance.now()/105);

      // Animated halo and neon outline from version 36.
      ctx.globalAlpha=.34;
      ctx.strokeStyle=profile.edge;
      ctx.lineWidth=7;
      ctx.shadowColor=profile.glow;
      ctx.shadowBlur=16;
      ctx.beginPath();
      ctx.arc(0,0,(drawR+10)*pulse,0,Math.PI*2);
      ctx.stroke();

      ctx.globalAlpha=1;
      ctx.shadowColor=profile.glow;
      ctx.shadowBlur=18;
      ctx.fillStyle=state.freezeLeft>0?'#8bcbed':profile.fill;
      ctx.strokeStyle=state.freezeLeft>0?'#5daed8':profile.edge;
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.arc(0,0,drawR,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur=0;

      // Crown.
      ctx.fillStyle='#ffbd4a';
      ctx.strokeStyle='#9c5b08';
      ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(-14,-drawR+1);
      ctx.lineTo(-8,-drawR-14);
      ctx.lineTo(0,-drawR-4);
      ctx.lineTo(8,-drawR-14);
      ctx.lineTo(14,-drawR+1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Eyes.
      ctx.fillStyle='white';
      ctx.beginPath();
      ctx.arc(-9,-4,4.8,0,Math.PI*2);
      ctx.arc(9,-4,4.8,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle=COLORS.text;
      ctx.beginPath();
      ctx.arc(-9,-4,2.1,0,Math.PI*2);
      ctx.arc(9,-4,2.1,0,Math.PI*2);
      ctx.fill();

      ctx.restore();
      return;
    }

    const profile=BOSS_PROFILES[e.worldIndex] || BOSS_PROFILES[1];
    ctx.fillStyle=state.freezeLeft>0
      ? '#8bcbed'
      : (e.minion ? profile.minionFill : profile.fill);
    ctx.strokeStyle=state.freezeLeft>0
      ? '#5daed8'
      : (e.minion ? profile.minionEdge : profile.edge);
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(0,0,drawR,0,Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle='white';
    ctx.beginPath();
    ctx.arc(-5,-3,3.2,0,Math.PI*2);
    ctx.arc(5,-3,3.2,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle=COLORS.text;
    ctx.beginPath();
    ctx.arc(-5,-3,1.4,0,Math.PI*2);
    ctx.arc(5,-3,1.4,0,Math.PI*2);
    ctx.fill();

    ctx.restore();
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
    draw();
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
      ui.storeMessage.textContent=`${data.name} already owned`;
      setTimeout(()=>{ui.storeMessage.textContent='';},900);
      return;
    }

    if(walletCoins<IMPOSSIBLE_BALL_PRICE){
      ui.storeMessage.textContent=`Need ${IMPOSSIBLE_BALL_PRICE-walletCoins} more coins`;
      setTimeout(()=>{ui.storeMessage.textContent='';},1800);
      return;
    }

    walletCoins-=IMPOSSIBLE_BALL_PRICE;
    ownedBalls.add(type);
    selectedBallType=type;
    queueProgressSave();
    ui.storeMessage.textContent='';
    const purchasedCard=document.querySelector(type==='gaia'?'.gaiaStoreCard':'.cataclysmStoreCard');
    celebratePackPurchase(purchasedCard,`${data.name.toUpperCase()} UNLOCKED!`);
    updateCollectionUI();
    syncUI();
    setTimeout(()=>{ui.storeMessage.textContent='';},1300);
  }

  function buyApexBall(){
    if(ownedBalls.has('apex')){
      ui.storeMessage.textContent='Apex Ball already owned';
      setTimeout(()=>{ui.storeMessage.textContent='';},900);
      return;
    }

    if(walletCoins < 5000){
      ui.storeMessage.textContent=`Need ${5000-walletCoins} more coins`;
      setTimeout(()=>{ui.storeMessage.textContent='';},1800);
      return;
    }

    walletCoins -= 5000;
    ownedBalls.add('apex');
    selectedBallType='apex';
    queueProgressSave();
    ui.storeMessage.textContent='';
    celebratePackPurchase(document.querySelector('.mythicStoreCard'),'APEX BALL UNLOCKED!');
    updateCollectionUI();
    syncUI();
    setTimeout(()=>{ui.storeMessage.textContent='';},1200);
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
    centerCollectionCard(type,true);

    const data=BALL_TYPES[type];
    ui.storeMessage.textContent=`${data.name} equipped`;
    setTimeout(()=>{ui.storeMessage.textContent='';},700);

    sfx('purchase');
    requestAnimationFrame(()=>celebrateEquippedBall(type));
  }

  const collectionCardsByType={
    normal:ui.normalCard,
    swift:ui.swiftCard,
    shield:ui.shieldCard,
    magnet:ui.magnetCard,
    coin:ui.coinCard,
    giant:ui.giantCard,
    ghost:ui.ghostCard,
    legendary:ui.legendaryCard,
    apex:ui.apexCard,
    cataclysm:ui.cataclysmCard,
    gaia:ui.gaiaCard
  };

  function celebrateEquippedBall(type){
    const card=collectionCardsByType[type];
    const ball=card?.querySelector('.collectionBall');
    if(!card || !ball) return;

    document.querySelectorAll('.equipCelebrationBadge,.equipSparkBurst').forEach(el=>el.remove());
    document.querySelectorAll('.ballCard.equipCelebrating').forEach(el=>el.classList.remove('equipCelebrating'));

    const cardRect=card.getBoundingClientRect();
    const ballRect=ball.getBoundingClientRect();
    const burst=document.createElement('div');
    burst.className='equipSparkBurst';
    burst.style.left=`${ballRect.left-cardRect.left+ballRect.width/2}px`;
    burst.style.top=`${ballRect.top-cardRect.top+ballRect.height/2}px`;

    for(let i=0;i<14;i++){
      const spark=document.createElement('i');
      spark.className='equipSpark';
      spark.style.setProperty('--spark-angle',`${i*(360/14)}deg`);
      spark.style.setProperty('--spark-distance',`${3.7+(i%4)*.42}rem`);
      spark.style.setProperty('--spark-delay',`${(i%3)*28}ms`);
      burst.appendChild(spark);
    }

    const badge=document.createElement('div');
    badge.className='equipCelebrationBadge';
    badge.setAttribute('role','status');
    badge.textContent=`✓ ${BALL_TYPES[type].name.toUpperCase()} EQUIPPED!`;

    card.append(burst,badge);
    void card.offsetWidth;
    card.classList.add('equipCelebrating');

    if(!nativeHapticsAvailable && navigator.vibrate) navigator.vibrate([18,24,32]);
    void triggerNativeFeedback('success');

    setTimeout(()=>{
      card.classList.remove('equipCelebrating');
      burst.remove();
      badge.remove();
    },1050);
  }

  ui.equipNormal.addEventListener('click',()=>selectBallType('normal'));
  ui.equipSwift.addEventListener('click',()=>selectBallType('swift'));
  ui.equipShield.addEventListener('click',()=>selectBallType('shield'));
  ui.equipMagnet.addEventListener('click',()=>selectBallType('magnet'));
  ui.equipCoin.addEventListener('click',()=>selectBallType('coin'));
  ui.equipGiant.addEventListener('click',()=>selectBallType('giant'));
  ui.equipGhost.addEventListener('click',()=>selectBallType('ghost'));
  ui.equipLegendary.addEventListener('click',()=>selectBallType('legendary'));
  ui.equipApex.addEventListener('click',()=>selectBallType('apex'));
  ui.equipCataclysm.addEventListener('click',()=>selectBallType('cataclysm'));
  ui.equipGaia.addEventListener('click',()=>selectBallType('gaia'));

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

  ui.homePlayButton.addEventListener('click',()=>showScreen('game'));
  ui.homePackCard.addEventListener('click',()=>showScreen('store'));
  ui.homeCollectionCard.addEventListener('click',()=>showScreen('collection'));

  ui.buyPack.addEventListener('click',buyPack);
  ui.buyApexBall.addEventListener('click',buyApexBall);
  ui.buyCataclysmBall.addEventListener('click',()=>buyImpossibleBall('cataclysm'));
  ui.buyGaiaBall.addEventListener('click',()=>buyImpossibleBall('gaia'));

  ui.bigPack.addEventListener('click',openCurrentPack);
  ui.buyAnotherPack.addEventListener('click',buyAnotherPackFromReveal);
  ui.packContinue.addEventListener('click',playFromPackReveal);

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
  ui.again.addEventListener('click',()=>{
    if(state.lastWin && currentLevel<MAX_LEVEL) currentLevel++;
    queueProgressSave();
    reset();
  });

  ui.moreBalls.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('moreBalls') || boosterCooldowns.moreBalls>0) return;
    sfx('booster');
    state.ballsLeft+=3;
    state.message='+3 BALLS!';
    state.messageT=.7;
    startBoosterCooldown('moreBalls','ADDED TO TOTAL');
    syncUI();
  });

  ui.moreTime.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('moreTime') || boosterCooldowns.moreTime>0) return;
    sfx('booster');
    state.timeLeft+=10;
    state.message='+10 SECONDS!';
    state.messageT=.7;
    startBoosterCooldown('moreTime','ADDED TO TIMER');
    syncUI();
  });

  ui.destroyBall.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('destroyBall') || boosterCooldowns.destroyBall>0) return;

    if(state.enemies.length===0){
      state.message='NO ENEMY TO DESTROY';
      state.messageT=.7;
      return;
    }

    sfx('booster');

    // Destroy a random enemy — NEVER one of the player's placed balls.
    const index=Math.floor(Math.random()*state.enemies.length);
    const removed=state.enemies.splice(index,1)[0];

    for(let i=0;i<24;i++){
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

    startBoosterCooldown('destroyBall',removed.boss ? 'BOSS BLASTED' : 'ENEMY DESTROYED');
    syncUI();
  });

  ui.coinFrenzy.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('coinFrenzy') || boosterCooldowns.coinFrenzy>0 || state.frenzyLeft>0) return;
    sfx('booster');

    state.frenzyLeft=FRENZY_DURATION;
    state.frenzySpawnTimer=0;
    state.message='COIN FRENZY!';
    state.messageT=.8;

    for(let i=0;i<6;i++) spawnCoin(true);

    startBoosterCooldown('coinFrenzy','COINS PULLED IN');
    syncUI();
  });

  ui.freeze.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('freeze') || boosterCooldowns.freeze>0) return;
    sfx('booster');

    state.freezeLeft=4;
    flashScreen('#9fe8ff',.10);
    state.message='ENEMIES FROZEN!';
    state.messageT=.7;

    startBoosterCooldown('freeze','4s FREEZE');
    syncUI();
  });

  ui.slowEnemies.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('slowEnemies') || boosterCooldowns.slowEnemies>0) return;
    sfx('booster');
    state.slowEnemiesLeft=4;
    flashScreen('#b6f0ff',.08);
    startBoosterCooldown('slowEnemies','4s SLOW');
    syncUI();
  });

  ui.coinBurst.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('coinBurst') || boosterCooldowns.coinBurst>0) return;
    sfx('booster');
    for(let i=0;i<5;i++) spawnCoin(true);
    flashScreen('#ffe47a',.08);
    startBoosterCooldown('coinBurst','+5 COINS');
    syncUI();
  });

  ui.instantGrow.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('instantGrow') || boosterCooldowns.instantGrow>0) return;
    sfx('booster');
    const appliedNow=applyGrowthBurst(state.active);
    state.instantGrowReady=!appliedNow;
    startBoosterCooldown('instantGrow',appliedNow ? 'BALL GREW' : 'NEXT BALL CHARGED');
    syncUI();
  });

  ui.panicClear.addEventListener('click',()=>{
    if(!state.running || !unlockedBoosters.has('panicClear') || boosterCooldowns.panicClear>0) return;
    sfx('booster');
    for(const e of state.enemies){
      const dx=e.x-W/2,dy=e.y-H/2,d=Math.max(1,Math.hypot(dx,dy));
      const sp=Math.max(120,Math.hypot(e.vx,e.vy));
      e.vx=dx/d*sp;
      e.vy=dy/d*sp;
    }
    flashScreen('#ffffff',.16);
    startBoosterCooldown('panicClear','ENEMIES PUSHED');
    syncUI();
  });

  ui.bossFightButton.addEventListener('click',startEncounter);

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
  }

  function closeGameUtilityMenu(resume=true){
    if(!ui.gameUtilityOverlay.classList.contains('open')){
      if(!resume) utilityMenuPausedGame=false;
      return;
    }

    ui.gameUtilityOverlay.classList.remove('open');
    ui.gameUtilityOverlay.setAttribute('aria-hidden','true');
    ui.gameUtilityMenuButton.classList.remove('menuOpen');

    const shouldResume=resume && utilityMenuPausedGame;
    utilityMenuPausedGame=false;

    if(shouldResume && state && currentScreen==='game'){
      const resultOpen=ui.overlay.style.display==='grid';
      const bossOpen=ui.bossWarningOverlay.style.display==='grid';
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
      const bossOpen=ui.bossWarningOverlay.style.display==='grid';
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
    if(ui.packOverlay.getAttribute('aria-hidden')==='false'){
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
    for(const key of Object.keys(BOOSTERS)){
      unlockedBoosters.add(key);
      boosterCooldowns[key]=0;
    }
    queueProgressSave();
    updateBoosterUI();
    syncUI();
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
