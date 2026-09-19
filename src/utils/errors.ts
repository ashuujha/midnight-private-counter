// Connector errors can cross the extension boundary as plain objects.
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error.trim();
  if (error === null || typeof error !== 'object') return '';

  const details = ['code', 'message', 'reason'].flatMap((key) => {
    const value = (error as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim() ? [value.trim()] : [];
  });
  return [...new Set(details)].join(': ');
};

export const friendlyWalletError = (error: unknown, networkId: string): string => {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (/reject|denied|not authorized|cancel/.test(normalized)) {
    return 'Wallet connection was rejected. Approve the request in Lace and try again.';
  }
  if (/network mismatch|network id/.test(normalized)) {
    return `Network mismatch. Switch Lace to ${networkId} and reconnect.`;
  }
  if (/disconnect|connection lost/.test(normalized)) {
    return 'The connection to Lace was lost. Unlock Lace and reconnect your wallet.';
  }
  if (/timeout|timed out/.test(normalized)) {
    return 'Lace took too long to respond. Open the extension, check for a pending request, and try again.';
  }
  return message
    ? `Lace could not complete the request: ${message}. Check the extension and try again.`
    : 'Lace could not complete the request. Unlock the extension and try again.';
};

export const friendlyCircuitError = (error: unknown, networkId: string): string => {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (/dynamically imported module|module script|loading chunk|importing a module/.test(normalized)) {
    return 'The proving tools could not be downloaded. Check your internet connection and reload the page before trying again.';
  }
  if (/reject|denied|cancel/.test(normalized)) {
    return 'The transaction was cancelled in Lace. You can try again when you are ready.';
  }
  if (/disconnect|connection lost/.test(normalized)) {
    return 'The connection to Lace was lost. Reconnect your wallet before trying again.';
  }
  if (/network mismatch|network id/.test(normalized)) {
    return `Network mismatch. Switch Lace to ${networkId}, reconnect, and try again.`;
  }
  if (/no dust generation registration|zero dust balance/.test(normalized)) {
    return message;
  }
  if (/insufficient|dust/.test(normalized)) {
    return 'Lace could not pay the transaction fee with the available DUST. Confirm Generate tDUST in Lace, wait for a positive DUST balance and full wallet sync, then reconnect.';
  }
  if (/timeout|timed out/.test(normalized)) {
    return 'The request timed out. Check Lace for a submitted or pending transaction before trying again.';
  }
  if (/proof server|proving failed/.test(normalized)) {
    return 'The proof service could not complete the request. Check the configured proof server or Lace proving settings, then try again.';
  }
  if (/failed to fetch|networkerror|network request|load failed/.test(normalized)) {
    return 'A network request failed. Check your internet connection, wallet sync, and proof service, then try again.';
  }
  if (/webassembly|wasm/.test(normalized)) {
    return 'The proving runtime could not start. Reload the page in an up-to-date browser and try again.';
  }
  return message
    ? `The circuit call failed: ${message}. Check Lace and try again.`
    : 'The circuit call failed. Check Lace and your proof service, then try again.';
};
