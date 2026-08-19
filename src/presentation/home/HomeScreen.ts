import type { HomeLevelMapItem, HomeViewModel, HomeWorldMapItem } from '../../application/home/HomeViewModel';
import { setBallAssetBackground } from '../assets/ballAssets';

export interface HomeScreenDependencies {
  onPlay(): void;
  onOpenStore(): void;
  onSelectLevel(level: number): void;
}

export interface HomeScreen {
  render(model: HomeViewModel): void;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Home screen requires ${selector}`);
  return element;
}

export function createHomeScreen(dependencies: HomeScreenDependencies): HomeScreen {
  const elements = {
    gold: requireElement<HTMLElement>('#homeGold'),
    ballPreview: requireElement<HTMLElement>('#homeBallPreview'),
    levelTitle: requireElement<HTMLElement>('#homeLevelTitle'),
    levelEvent: requireElement<HTMLElement>('#homeLevelEvent'),
    playButton: requireElement<HTMLButtonElement>('#homePlayButton'),
    worldMap: requireElement<HTMLElement>('#homeWorldMap'),
    worldPrev: requireElement<HTMLButtonElement>('#homeWorldPrev'),
    worldNext: requireElement<HTMLButtonElement>('#homeWorldNext'),
    worldNumber: requireElement<HTMLElement>('#homeWorldNumber'),
    worldName: requireElement<HTMLElement>('#homeWorldName'),
    worldBoss: requireElement<HTMLElement>('#homeWorldBoss'),
    worldStars: requireElement<HTMLElement>('#homeWorldStars'),
    worldUnlockRule: requireElement<HTMLElement>('#homeWorldUnlockRule'),
    worldStarFill: requireElement<HTMLElement>('#homeWorldStarFill'),
    worldStarGate: requireElement<HTMLElement>('#homeWorldStarGate'),
    worldGateCopy: requireElement<HTMLElement>('#homeWorldGateCopy'),
    levelGrid: requireElement<HTMLElement>('#homeLevelGrid'),
    levelDetail: requireElement<HTMLElement>('#homeLevelDetail'),
    levelDetailStars: requireElement<HTMLElement>('#homeLevelDetailStars'),
    levelDetailTitle: requireElement<HTMLElement>('#homeLevelDetailTitle'),
    levelDetailChallenge: requireElement<HTMLElement>('#homeLevelDetailChallenge'),
    levelAttempts: requireElement<HTMLElement>('#homeLevelAttempts'),
    levelBestTime: requireElement<HTMLElement>('#homeLevelBestTime'),
    levelBestBalls: requireElement<HTMLElement>('#homeLevelBestBalls'),
    levelBestCoins: requireElement<HTMLElement>('#homeLevelBestCoins'),
    levelPlay: requireElement<HTMLButtonElement>('#homeLevelPlay'),
    packCard: requireElement<HTMLElement>('#homePackCard'),
    packTitle: requireElement<HTMLElement>('#homePackTitle'),
    packCopy: requireElement<HTMLElement>('#homePackCopy'),
    packProgress: requireElement<HTMLElement>('#homePackProgress'),
    packCta: requireElement<HTMLElement>('#homePackCta'),
  };

  elements.playButton.addEventListener('click', dependencies.onPlay);
  elements.packCard.addEventListener('click', dependencies.onOpenStore);
  let currentModel: HomeViewModel | null = null;
  let visibleWorldIndex = 0;
  let selectedLevel = 1;
  let renderedCurrentLevel = 0;

  function selectedWorld(): HomeWorldMapItem | null {
    return currentModel?.worlds[visibleWorldIndex] ?? null;
  }

  function defaultLevelForWorld(world: HomeWorldMapItem): number {
    return world.levels.find(level => level.current)?.level
      ?? world.levels.find(level => level.unlocked && !level.completed)?.level
      ?? [...world.levels].reverse().find(level => level.unlocked)?.level
      ?? world.levels[0].level;
  }

  function renderLevelDetail(world: HomeWorldMapItem, level: HomeLevelMapItem): void {
    elements.levelDetail.dataset.state = !world.unlocked
      ? 'world-locked'
      : level.unlocked
        ? (level.completed ? 'completed' : 'available')
        : 'locked';
    elements.levelDetailStars.textContent = level.completed
      ? `${'★'.repeat(level.stars)}${'☆'.repeat(3 - level.stars)}`
      : '☆☆☆';
    elements.levelDetailTitle.textContent = `LEVEL ${level.level}`;
    elements.levelDetailChallenge.textContent = !world.unlocked
      ? `Earn 50 stars in World ${Math.max(1, world.number - 1)} to unlock`
      : level.unlocked
        ? level.challenge
        : `Complete Level ${level.level - 1} first`;
    elements.levelAttempts.textContent = !level.unlocked
      ? 'LOCKED'
      : level.completed
        ? `${level.attempts} ${level.attempts === 1 ? 'ATTEMPT' : 'ATTEMPTS'}`
        : 'READY TO PLAY';
    elements.levelBestTime.textContent = level.bestTime;
    elements.levelBestBalls.textContent = level.bestBalls;
    elements.levelBestCoins.textContent = level.bestCoins;
    elements.levelPlay.disabled = !level.unlocked;
    elements.levelPlay.textContent = level.unlocked
      ? `${level.completed ? 'REPLAY' : 'PLAY'} LEVEL ${level.level}`
      : 'LEVEL LOCKED';
  }

  function renderVisibleWorld(): void {
    const world = selectedWorld();
    if (!world || !currentModel) return;
    if (!world.levels.some(level => level.level === selectedLevel)) {
      selectedLevel = defaultLevelForWorld(world);
    }

    elements.worldMap.classList.toggle('lockedWorld', !world.unlocked);
    elements.worldMap.style.setProperty('--world-fill', world.fill);
    elements.worldMap.style.setProperty('--world-edge', world.edge);
    elements.worldMap.style.setProperty('--world-glow', world.glow);
    elements.worldNumber.textContent = `WORLD ${world.number}`;
    elements.worldName.textContent = world.name.toUpperCase();
    elements.worldBoss.textContent = `BOSS • ${world.bossName.toUpperCase()}`;
    elements.worldStars.textContent = `${world.stars} / ${world.starCap}`;
    elements.worldUnlockRule.textContent = world.index === currentModel.worlds.length - 1
      ? 'FINAL WORLD'
      : `${world.unlockStars} TO UNLOCK NEXT WORLD`;
    elements.worldStarFill.style.width = `${world.progressPercent}%`;
    elements.worldStarGate.style.left = `${world.unlockStars / world.starCap * 100}%`;
    elements.worldGateCopy.textContent = world.gateCopy;
    elements.worldPrev.disabled = world.index === 0;
    elements.worldNext.disabled = world.index === currentModel.worlds.length - 1;
    elements.levelGrid.replaceChildren();

    for (const level of world.levels) {
      const tile = document.createElement('button');
      const number = document.createElement('strong');
      const stars = document.createElement('span');
      const event = document.createElement('i');
      tile.type = 'button';
      tile.className = 'homeLevelTile';
      tile.dataset.level = String(level.level);
      tile.dataset.state = level.unlocked ? (level.completed ? 'completed' : 'available') : 'locked';
      tile.classList.toggle('selected', level.level === selectedLevel);
      tile.classList.toggle('current', level.current);
      tile.classList.toggle('bossLevel', level.boss);
      tile.classList.toggle('miniBossLevel', level.miniBoss);
      tile.classList.toggle('rushLevel', level.rushEvent);
      tile.setAttribute('role', 'listitem');
      tile.setAttribute('aria-label', level.unlocked
        ? `Level ${level.level}, ${level.stars} stars${level.current ? ', current level' : ''}`
        : `Level ${level.level}, locked`);
      number.textContent = String(level.stage);
      stars.className = 'homeLevelTileStars';
      if (level.unlocked) {
        for (let index = 0; index < 3; index += 1) {
          const star = document.createElement('i');
          const earned = index < level.stars;
          star.className = `homeLevelTileStar ${earned ? 'earned' : 'missing'}`;
          star.textContent = earned ? '★' : '☆';
          stars.appendChild(star);
        }
      } else {
        stars.textContent = '🔒';
      }
      event.className = 'homeLevelTileEvent';
      event.textContent = level.boss ? '♛' : (level.miniBoss ? '◆' : (level.rushEvent ? '⚡' : ''));
      tile.append(number, stars, event);
      tile.addEventListener('click', () => {
        selectedLevel = level.level;
        renderVisibleWorld();
      });
      elements.levelGrid.appendChild(tile);
    }

    const detail = world.levels.find(level => level.level === selectedLevel) ?? world.levels[0];
    renderLevelDetail(world, detail);
  }

  elements.worldPrev.addEventListener('click', () => {
    if (!currentModel || visibleWorldIndex <= 0) return;
    visibleWorldIndex -= 1;
    selectedLevel = defaultLevelForWorld(currentModel.worlds[visibleWorldIndex]);
    renderVisibleWorld();
  });
  elements.worldNext.addEventListener('click', () => {
    if (!currentModel || visibleWorldIndex >= currentModel.worlds.length - 1) return;
    visibleWorldIndex += 1;
    selectedLevel = defaultLevelForWorld(currentModel.worlds[visibleWorldIndex]);
    renderVisibleWorld();
  });
  elements.levelPlay.addEventListener('click', () => {
    const world = selectedWorld();
    const level = world?.levels.find(item => item.level === selectedLevel);
    if (level?.unlocked) dependencies.onSelectLevel(level.level);
  });

  function render(model: HomeViewModel): void {
    currentModel = model;
    if (renderedCurrentLevel !== model.currentLevel) {
      renderedCurrentLevel = model.currentLevel;
      visibleWorldIndex = model.activeWorldIndex;
      selectedLevel = model.currentLevel;
    }
    elements.gold.textContent = model.gold;
    elements.levelTitle.textContent = model.levelTitle;
    elements.levelEvent.textContent = model.levelEvent;
    elements.playButton.textContent = model.playLabel;
    setBallAssetBackground(elements.ballPreview, model.equippedBallId);
    elements.ballPreview.setAttribute('aria-label', `${model.equippedBallName}, equipped`);
    renderVisibleWorld();
    elements.packProgress.style.width = `${model.packProgressPercent}%`;
    elements.packCard.classList.toggle('purchaseReady', model.canBuyPack);
    elements.packCard.classList.toggle('nearReady', model.nearPack);
    elements.packTitle.textContent = model.packTitle;
    elements.packCopy.textContent = model.packCopy;
    elements.packCta.textContent = model.packCta;
  }

  return { render };
}
