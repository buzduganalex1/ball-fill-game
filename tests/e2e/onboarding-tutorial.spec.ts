import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 720 } });

async function openStarterOnboarding(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#bigPack').click();
  await expect(page.locator('#packContinue')).toHaveClass(/show/, { timeout: 3_000 });
  await page.locator('#packContinue').click();
  await expect(page.locator('#tutorialCoach')).toHaveAttribute('data-level', '1');
}

test('Level 1 is a calm real level and its single lesson disappears on the first grow', async ({ page }) => {
  await openStarterOnboarding(page);

  const coach = page.locator('#tutorialCoach');
  const canvas = page.locator('#game');
  await expect(coach).toHaveClass(/show/);
  await expect(page.locator('#tutorialPromptText')).toHaveText(
    'Tap, hold, move, grow, and release to fill the screen. Collect as many coins as possible before the progress bar is full.',
  );
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-onboarding-level', '1');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-enemy-count', '0');
  await expect(page.locator('#difficulty')).toContainText('No enemies');
  await expect(page.locator('#time')).toHaveText('—');
  await expect(page.locator('#replayTutorial')).toHaveCount(0);

  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .6);
  await page.mouse.down();
  await expect(coach).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#balls')).toHaveText('9');
  await page.mouse.move(box.x + box.width * .65, box.y + box.height * .52, { steps: 5 });
  await page.waitForTimeout(500);
  await page.mouse.up();
  await expect(page.locator('#levelProgressValue')).not.toHaveText('0');
  await expect(page.locator('#time')).toHaveText('—');
});

test('Level 2 teaches the enemy once, then Level 3 starts after the retained HUD tour', async ({ page }) => {
  await openStarterOnboarding(page);

  await page.locator('#adminLevel').evaluate((input: HTMLInputElement) => {
    input.value = '2';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#adminGoLevel').evaluate((button: HTMLButtonElement) => button.click());

  const coach = page.locator('#tutorialCoach');
  await expect(coach).toHaveAttribute('data-level', '2');
  await expect(coach).toHaveClass(/show/);
  await expect(page.locator('#tutorialPromptText')).toHaveText(
    'If enemies hit you while growing, they will pop your ball and your progress will be lost. You have a limited number of balls—grow them as big as possible.',
  );
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-enemy-count', '1');
  await expect(page.locator('#time')).not.toHaveText('—');

  await page.locator('#adminBoosters').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#adminApex').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#freeze').evaluate((button: HTMLButtonElement) => button.click());

  const canvas = page.locator('#game');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * .62, box.y + box.height * .68);
  await page.mouse.down();
  await expect(coach).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#overlay')).toHaveCSS('display', 'grid', { timeout: 15_000 });
  await page.mouse.up();
  await expect(page.locator('#resultTitle')).toContainText('LEVEL 2 COMPLETE');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-enemy-count', '0');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-placed-ball-count', '0');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-coin-count', '0');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-scene-fx-count', '0');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-active-ball-diameter', '0');

  await page.locator('#again').click();
  await expect(page.locator('#level')).toHaveText('3');
  await expect(page.locator('#hudTutorialOverlay')).toHaveClass(/show/);

  const expected = [
    'This shows how many balls you have.',
    'Complete the level before time runs out.',
    'Collect money to unlock new items.',
    'Tap here to view and change your ball.',
    'Tap here to visit the store.',
  ];
  for (const text of expected) {
    await expect(page.locator('#hudTutorialText')).toHaveText(text);
    await page.locator('#hudTutorialNext').click();
  }

  await expect(page.locator('#hudTutorialOverlay')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#gameScreen')).toHaveAttribute('data-onboarding-level', '0');
  await expect(page.locator('#level')).toHaveText('3');
  await expect.poll(async () => page.evaluate(() => {
    const key = Object.keys(localStorage).find(candidate => candidate.endsWith('.ballFillSave'));
    return key ? Boolean(JSON.parse(localStorage.getItem(key) || '{}').tutorialSeen) : false;
  })).toBe(true);

  await page.reload();
  await page.locator('#homePlayButton').click();
  await expect(page.locator('#tutorialCoach')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#hudTutorialOverlay')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#replayTutorial')).toHaveCount(0);
});
