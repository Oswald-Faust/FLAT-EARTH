export const WALLET_VISIBILITY_STORAGE_KEY = 'flatearth:wallet-balance-visible';

export function getStoredWalletVisibility() {
  if (typeof window === 'undefined') {
    return true;
  }

  const rawValue = window.localStorage.getItem(WALLET_VISIBILITY_STORAGE_KEY);
  return rawValue !== 'hidden';
}

export function setStoredWalletVisibility(isVisible: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(WALLET_VISIBILITY_STORAGE_KEY, isVisible ? 'visible' : 'hidden');
}

export function maskCurrency(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '••••';
  }

  return trimmed.replace(/[0-9]/g, '•');
}
