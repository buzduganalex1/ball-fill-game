import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 720 } });

test('growth score climbs on the ball, then banks into the total with checkpoint feedback', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

  await expect(page.locator('#levelGoal')).toContainText('/ 100');
  await expect(page.locator('#levelProgressValue')).toHaveText('0');
  const transitionDuration = await page.locator('#progressFill1').evaluate(element => (
    getComputedStyle(element).transitionDuration
  ));
  expect(transitionDuration).not.toBe('0s');

  // Freeze the normal enemies so this test measures sustained growth rather
  // than collision randomness.
  await page.locator('#adminBoosters').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#adminApex').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#panicClear').evaluate((button: HTMLButtonElement) => button.click());
  await page.waitForTimeout(900);
  await page.locator('#freeze').evaluate((button: HTMLButtonElement) => button.click());

  const canvas = page.locator('#game');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .58);
  await page.mouse.down();

  const samples: number[] = [];
  const tokenDiameters: number[] = [];
  const ballDiameters: number[] = [];
  for (let attempt = 0; attempt < 55; attempt += 1) {
    const growthSnapshot = await page.locator('#gameScreen').evaluate((element: HTMLElement) => ({
      points: Number(element.dataset.activeGrowthPoints),
      tokenDiameter: Number(element.dataset.growthTokenDiameter),
      ballDiameter: Number(element.dataset.activeBallDiameter),
    }));
    samples.push(growthSnapshot.points);
    tokenDiameters.push(growthSnapshot.tokenDiameter);
    ballDiameters.push(growthSnapshot.ballDiameter);
    if (Number(await page.locator('.starMarker1').getAttribute('data-celebrations')) >= 1) break;
    await page.waitForTimeout(80);
  }

  expect(Math.max(...samples)).toBeGreaterThanOrEqual(30);
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-growth-renderer', 'number-only');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-growth-token-shape', 'number-only');
  const growthFrameHealth = await page.evaluate(() => new Promise<{
    sampleCount: number;
    p95FrameMs: number;
    effectsDpr: number;
  }>(resolve => {
    const intervals: number[] = [];
    const started = performance.now();
    let previous = started;
    const sample = (now: number) => {
      intervals.push(now - previous);
      previous = now;
      if (now - started < 700) {
        requestAnimationFrame(sample);
        return;
      }
      const sorted = intervals.slice(1).sort((a, b) => a - b);
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] || 0;
      const effects = document.querySelector<HTMLCanvasElement>('#hudFxCanvas')!;
      const rect = effects.getBoundingClientRect();
      resolve({
        sampleCount: sorted.length,
        p95FrameMs: p95,
        effectsDpr: effects.width / Math.max(1, rect.width),
      });
    };
    requestAnimationFrame(sample);
  }));
  expect(growthFrameHealth.sampleCount).toBeGreaterThan(20);
  expect(growthFrameHealth.p95FrameMs).toBeLessThan(50);
  expect(growthFrameHealth.effectsDpr).toBeLessThanOrEqual(1.51);
  await expect(page.locator('#levelProgressValue')).toHaveText('0');
  await expect(page.locator('.starMarker1')).toHaveClass(/earned/);
  await expect(page.locator('.starMarker1')).toHaveAttribute('data-celebrations', '1');
  await expect(page.locator('#progressMilestoneValue')).toHaveText('33 / 100');
  await page.mouse.up();
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-progress-bank-state', 'flying');
  await expect(page.locator('.growthBankFlight')).toBeVisible();
  await expect(page.locator('.growthBankFlight small')).toHaveCount(0);
  const flyingTokenShape = await page.locator('.growthBankFlight').evaluate(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      width: rect.width,
      height: rect.height,
      cssDiameter: parseFloat(style.width),
      radius: style.borderRadius,
    };
  });
  expect(Math.abs(flyingTokenShape.width - flyingTokenShape.height)).toBeLessThan(1);
  expect(flyingTokenShape.radius).toBe('50%');
  const positiveTokenDiameters = tokenDiameters.filter(value => value > 0);
  const positiveBallDiameters = ballDiameters.filter(value => value > 0);
  expect(Math.max(...positiveTokenDiameters)).toBeGreaterThan(Math.min(...positiveTokenDiameters) * 2);
  positiveTokenDiameters.forEach((diameter, index) => {
    expect(Math.abs(diameter - positiveBallDiameters[index])).toBeLessThan(1);
  });
  const releasedTokenDiameter = Number(await page.locator('#gameScreen').getAttribute('data-last-bank-token-diameter'));
  expect(Math.abs(flyingTokenShape.cssDiameter - releasedTokenDiameter)).toBeLessThan(1);
  await expect.poll(async () => Number(await page.locator('#levelProgressValue').textContent())).toBeGreaterThanOrEqual(30);
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-progress-bank-state', /landed|idle/);
  await expect(page.locator('#levelGoal')).toHaveAttribute('data-last-banked-points', /[1-9]\d*/);

  const increasingSamples = samples.filter((value, index) => index === 0 || value >= samples[index - 1]);
  expect(increasingSamples).toHaveLength(samples.length);
  expect(new Set(samples).size).toBeGreaterThan(6);
});

test('a popped growing ball drops its preview progress and clearly shows the loss', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

  // Level 2 has one slow tutorial enemy, making this a real collision test
  // without the randomness of a crowded normal level.
  await page.locator('#adminLevel').evaluate((input: HTMLInputElement) => {
    input.value = '2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#adminGoLevel').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-enemy-count', '1');

  const canvas = page.locator('#game');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * .65, box.y + box.height * .65);
  await page.mouse.down();
  await expect.poll(async () => (
    Number(await page.locator('#gameScreen').getAttribute('data-active-growth-points'))
  )).toBeGreaterThan(5);

  // The enemy starts near the upper-left and seeks the active ball. Moving
  // toward it makes the collision deterministic after progress has built up.
  await page.mouse.move(box.x + box.width * .17, box.y + box.height * .20, { steps: 24 });
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-progress-loss-state', 'showing', { timeout: 5_000 });
  await expect(page.locator('.growthLossBurst')).toBeVisible();
  await expect(page.locator('.growthLossBurst')).toContainText('PROGRESS LOST');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-last-lost-progress', /[1-9]\d*/);
  await expect(page.locator('#balls')).toHaveText('8');
  await expect.poll(async () => (
    Number(await page.locator('#gameScreen').getAttribute('data-active-ball-diameter'))
  )).toBeGreaterThan(0);
  await expect(page.locator('#levelProgressValue')).toHaveText('0');
  await expect(page.locator('#segmentedProgressTrack')).toHaveClass(/progressLost/);
  await expect.poll(async () => (
    Number(await page.locator('#gameScreen').getAttribute('data-active-growth-points'))
  )).toBeGreaterThan(0);
  await page.mouse.up();
});

test('a press on a placed ball does not spend or grow another ball', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

  const canvas = page.locator('#game');
  const box = (await canvas.boundingBox())!;
  const center = {
    x: box.x + box.width * .5,
    y: box.y + box.height * .58,
  };

  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  await page.waitForTimeout(360);
  await page.mouse.up();
  await expect(page.locator('#balls')).toHaveText('9');
  await expect.poll(async () => (
    Number(await page.locator('#gameScreen').getAttribute('data-active-ball-diameter'))
  )).toBe(0);

  await page.mouse.down();
  await page.waitForTimeout(240);
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-spawn-blocked', 'true');
  await expect(page.locator('#balls')).toHaveText('9');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-active-ball-diameter', '0');
  await page.mouse.up();
});

test('mobile defeat summary is readable and uses a card-matched transfer arrow', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();

  const canvas = page.locator('#game');
  const box = (await canvas.boundingBox())!;
  for (let ball = 0; ball < 10; ball += 1) {
    const column = ball % 5;
    const row = Math.floor(ball / 5);
    await page.mouse.click(
      box.x + box.width * (.1 + column * .19),
      box.y + box.height * (.1 + row * .14),
      { delay: 18 },
    );
  }

  await expect(page.locator('#overlay')).toHaveCSS('display', 'grid', { timeout: 6_000 });
  await expect(page.locator('#overlay')).toHaveClass(/defeatResult/);
  await expect(page.locator('#overlay')).not.toHaveClass(/victoryResult/);
  await expect(page.locator('#resultCard')).toHaveClass(/defeat/);
  await expect(page.locator('#replayLevel')).toBeHidden();
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-placed-ball-count', '0');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-coin-count', '0');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-scene-fx-count', '0');
  await expect(page.locator('#resultRunCoins')).toHaveText('0');
  await expect(page.locator('#resultRunCoins')).not.toContainText('-');

  const resultMetrics = await page.evaluate(() => {
    const px = (selector: string) => parseFloat(getComputedStyle(document.querySelector(selector)!).fontSize);
    const card = document.querySelector('#resultCard')!;
    const requirements = document.querySelector('#starRequirements')!;
    const arrow = document.querySelector('.transferArrow')!;
    const cardStyle = getComputedStyle(card);
    const arrowStyle = getComputedStyle(arrow);
    return {
      cardWidth: card.getBoundingClientRect().width,
      boardWidth: document.querySelector('#boardWrap')!.getBoundingClientRect().width,
      requirementsHeight: requirements.getBoundingClientRect().height,
      headerFont: px('.starRequirementsHead'),
      requirementFont: px('.starRequirement > div strong'),
      rewardLabelFont: px('.rewardBucket > span:first-child'),
      rewardValueFont: px('.rewardBucket strong'),
      buttonFont: px('.resultContinue'),
      arrowColor: arrowStyle.color,
      cardColor: cardStyle.borderTopColor,
      detailCount: document.querySelectorAll('.starRequirement small').length,
      tipCount: document.querySelectorAll('#starRequirementsTip').length,
      formulaCount: document.querySelectorAll('#rewardFormula').length,
    };
  });

  expect(resultMetrics.cardWidth / resultMetrics.boardWidth).toBeGreaterThan(.96);
  expect(resultMetrics.requirementsHeight).toBeGreaterThan(145);
  expect(resultMetrics.headerFont).toBeGreaterThanOrEqual(11);
  expect(resultMetrics.requirementFont).toBeGreaterThanOrEqual(12);
  expect(resultMetrics.rewardLabelFont).toBeGreaterThanOrEqual(11);
  expect(resultMetrics.rewardValueFont).toBeGreaterThanOrEqual(28);
  expect(resultMetrics.buttonFont).toBeGreaterThanOrEqual(17);
  expect(resultMetrics.arrowColor).toBe(resultMetrics.cardColor);
  expect(resultMetrics.detailCount).toBe(0);
  expect(resultMetrics.tipCount).toBe(0);
  expect(resultMetrics.formulaCount).toBe(0);
  await expect(page.locator('#resultMultiplierBadge')).not.toHaveClass(/show/);
});

test('completion explains a two-star run and shows consistent reward visuals', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();
  await page.locator('#adminApex').evaluate((button: HTMLButtonElement) => button.click());

  const canvas = page.locator('#game');
  const box = (await canvas.boundingBox())!;
  // Spend six tiny balls in one corner so efficiency is missed without
  // surrounding or blocking the final scoring ball.
  const taps = Array.from({ length: 6 }, (_, index) => [
    .1 + (index % 3) * .18,
    .1 + Math.floor(index / 3) * .11,
  ]);
  for (const [x, y] of taps) {
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y, { delay: 25 });
  }
  await expect(page.locator('#balls')).toHaveText('4');

  await page.mouse.move(box.x + box.width * .62, box.y + box.height * .62);
  await page.mouse.down();
  await expect(page.locator('#boardWrap')).toHaveClass(/victorySlowdown/, { timeout: 15_000 });
  await expect(page.locator('#overlay')).toHaveCSS('display', 'grid', { timeout: 3_000 });
  await page.mouse.up();

  await expect(page.locator('#overlay')).toHaveClass(/victoryResult/);
  await expect(page.locator('#overlay')).not.toHaveClass(/defeatResult/);
  await expect(page.locator('#replayLevel')).toBeVisible();
  await expect(page.locator('#replayLevel')).toHaveText('↻ REPLAY');
  await expect(page.locator('#stars')).toHaveText('★★☆');
  await expect(page.locator('#starRequirementsScore')).toHaveText('2 / 3 EARNED');
  await expect(page.locator('[data-requirement="complete"]')).toHaveAttribute('data-status', 'earned');
  await expect(page.locator('[data-requirement="time"]')).toHaveAttribute('data-status', 'earned');
  await expect(page.locator('[data-requirement="balls"]')).toHaveAttribute('data-status', 'missed');
  await expect(page.locator('[data-requirement="complete"] .starRequirementStatus')).toHaveText('✓');
  await expect(page.locator('[data-requirement="balls"] .starRequirementStatus')).toHaveText('✕');
  await expect(page.locator('.starRequirement small')).toHaveCount(0);
  await expect(page.locator('#starRequirementsTip')).toHaveCount(0);
  await expect(page.locator('#resultText')).not.toContainText(/PACK READY|GOLD TO NEXT PACK/);
  await expect(page.locator('#rewardFormula')).toHaveCount(0);
  await expect(page.locator('#resultMultiplierBadge')).toHaveClass(/show/);
  await expect(page.locator('#resultMultiplierBadge')).toHaveText('×1.5');
  await expect.poll(async () => {
    const levelCoins = Number((await page.locator('#resultRunCoins').textContent())?.replace(/[^0-9.-]/g, ''));
    const walletCoins = Number((await page.locator('#resultWalletCoins').textContent())?.replace(/[^0-9.-]/g, ''));
    return Math.abs(levelCoins - walletCoins);
  }).toBeLessThan(.01);
  await expect(page.locator('.transferArrow')).toHaveText('➜');
  await expect(page.locator('.resultCard .coinIcon')).toHaveText(['★', '★']);

  const resultSpacing = await page.evaluate(() => {
    const requirements = document.querySelector('#starRequirements')!.getBoundingClientRect();
    const rewards = document.querySelector('#coinTransfer')!.getBoundingClientRect();
    const action = document.querySelector('.resultButtons')!.getBoundingClientRect();
    const missed = document.querySelector('[data-requirement="balls"] .starRequirementStatus')!;
    const earned = document.querySelector('[data-requirement="complete"] .starRequirementStatus')!;
    const missedRect = missed.getBoundingClientRect();
    return {
      requirementsToRewards: rewards.top - requirements.bottom,
      rewardsToAction: action.top - rewards.bottom,
      markerRatio: missedRect.width / missedRect.height,
      missedColor: getComputedStyle(missed).backgroundImage,
      earnedColor: getComputedStyle(earned).backgroundImage,
    };
  });
  expect(resultSpacing.requirementsToRewards).toBeGreaterThan(12);
  expect(resultSpacing.rewardsToAction).toBeGreaterThan(8);
  expect(resultSpacing.markerRatio).toBeCloseTo(1, 1);
  expect(resultSpacing.missedColor).not.toBe(resultSpacing.earnedColor);

  const bonusMessageGap = await page.evaluate(async () => {
    const message = document.querySelector<HTMLElement>('#resultText')!;
    message.innerHTML = '<strong>⚡ RUSH SURVIVED!</strong><br>15% GOLD BONUS CLAIMED';
    await new Promise(requestAnimationFrame);
    const messageRect = message.getBoundingClientRect();
    const actionRect = document.querySelector('.resultButtons')!.getBoundingClientRect();
    const gap = actionRect.top - messageRect.bottom;
    message.replaceChildren();
    return gap;
  });
  expect(bonusMessageGap).toBeGreaterThan(8);

  // Match the compact in-app browser viewport where reward labels have the
  // least horizontal room and must remain on one line.
  await page.setViewportSize({ width: 355, height: 547 });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const compactCoinTitle = await page.locator('.rewardBucketTitle').evaluate(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      height: rect.height,
      lineHeight: parseFloat(style.lineHeight),
      overflow: element.scrollWidth - element.clientWidth,
      whiteSpace: style.whiteSpace,
    };
  });
  expect(compactCoinTitle.height).toBeLessThan(compactCoinTitle.lineHeight * 1.5);
  expect(compactCoinTitle.overflow).toBeLessThanOrEqual(1);
  expect(compactCoinTitle.whiteSpace).toBe('nowrap');

  const totalShape = await page.locator('#levelGoal').evaluate(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { width: rect.width, height: rect.height, radius: style.borderRadius };
  });
  expect(totalShape.width).toBeGreaterThan(totalShape.height * 1.5);
  expect(parseFloat(totalShape.radius)).toBeGreaterThan(totalShape.height / 2);

  const completedLevel = await page.locator('#level').textContent();
  await page.locator('#replayLevel').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('#level')).toHaveText(completedLevel ?? '');
  await expect(page.locator('#balls')).toHaveText('10');
});
