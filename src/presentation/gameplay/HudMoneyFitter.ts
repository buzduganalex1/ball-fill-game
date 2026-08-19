type HudMoneyFit = 'regular' | 'compact' | 'tight';

function displayedLength(element: HTMLElement): number {
  return (element.textContent ?? '').trim().length;
}

export function chooseHudMoneyFit(walletLength: number, gainLength: number): HudMoneyFit {
  const combinedLength = walletLength + gainLength;

  if (combinedLength >= 12 || walletLength >= 7 || gainLength >= 8) return 'tight';
  if (combinedLength >= 9 || walletLength >= 6 || gainLength >= 6) return 'compact';
  return 'regular';
}

export function installHudMoneyFitter(
  container: HTMLElement,
  wallet: HTMLElement,
  gainValue: HTMLElement,
): () => void {
  const applyFit = () => {
    const walletLength = displayedLength(wallet);
    // Include the permanently visible leading plus sign.
    const gainLength = displayedLength(gainValue) + 1;
    container.dataset.moneyFit = chooseHudMoneyFit(walletLength, gainLength);
  };

  const observer = new MutationObserver(applyFit);
  observer.observe(wallet, { childList: true, characterData: true, subtree: true });
  observer.observe(gainValue, { childList: true, characterData: true, subtree: true });
  applyFit();

  return () => observer.disconnect();
}
