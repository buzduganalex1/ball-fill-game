import { BALL_TYPES } from '../../data/balls';
import { BOSS_PROFILES, worldProfileForLevel } from '../../data/encounters';
import { buildEnemyTrailWedge } from '../../game/rendering/EnemyTrailGeometry';

export function createLegacyCanvasRenderer(dependencies){
  const {
    canvas,
    ctx,
    arenaGridCanvas,
    colors:COLORS,
    ballAssetImages:BALL_ASSET_IMAGES,
    gameBridge,
    rebuildArenaGrid,
    frenzyMagnetTarget,
    shieldLayerColor
  }=dependencies;
  let W=canvas.width;
  let H=canvas.height;
  let state=null;
  let currentLevel=1;
  let selectedBallType='normal';

  function draw(){
    const frame=dependencies.getFrame();
    W=frame.width;
    H=frame.height;
    state=frame.state;
    currentLevel=frame.currentLevel;
    selectedBallType=frame.selectedBallType;
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
    const leader=e.boss || e.miniBoss;
    const halfWidth=e.r*(leader ? 1.28 : (e.minion ? .92 : .82));

    ctx.save();
    ctx.lineJoin='round';

    function fillWedge(width,color,alpha,blur=0){
      const points=buildEnemyTrailWedge(e.trail,width);
      if(points.length<3) return;
      ctx.globalAlpha=alpha;
      ctx.fillStyle=color;
      ctx.shadowColor=color;
      ctx.shadowBlur=blur;
      ctx.beginPath();
      ctx.moveTo(points[0].x,points[0].y);
      for(let i=1;i<points.length;i++) ctx.lineTo(points[i].x,points[i].y);
      ctx.closePath();
      ctx.fill();
    }

    // Three nested tapered wedges create a broad triangular comet shape.
    fillWedge(halfWidth*1.48,profile.glow || profile.trail,leader ? .18 : .13,leader ? 24 : 15);
    fillWedge(halfWidth,profile.trail,leader ? .54 : (e.minion ? .43 : .38),0);
    fillWedge(halfWidth*.32,'#fff6d3',leader ? .58 : .38,0);

    if(leader){
      const n=e.trail.length;
      for(let i=2;i<n;i+=6){
        const t=e.trail[i];
        const progress=(i+1)/n;
        const alpha=(t.life??1)*progress*.52;
        if(alpha<=0) continue;
        const s=2+3.4*progress;

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


  return {draw};
}
