import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { friendlyCircuitError, friendlyWalletError, getErrorMessage } from '../src/utils/errors';

describe('wallet and proof recovery messages', () => {
  it('understands structured Lace rejection errors across the extension boundary', () => {
    const error = { type: 'DAppConnectorAPIError', code: 'Rejected', reason: 'Request declined' };
    assert.match(friendlyWalletError(error, 'preprod'), /Approve the request in Lace/);
    assert.match(friendlyCircuitError(error, 'preprod'), /cancelled in Lace/);
    assert.match(getErrorMessage(error), /Request declined/);
  });

  it('recognizes a connector error after a proving stage wraps it', () => {
    const wrapped = new Error(`Lace transaction balancing failed: ${getErrorMessage({ code: 'Disconnected', reason: 'Session expired' })}`);
    assert.match(friendlyCircuitError(wrapped, 'preprod'), /Reconnect your wallet/);
  });

  it('gives page reload guidance for a failed dynamic import', () => {
    const message = friendlyCircuitError(new TypeError('Failed to fetch dynamically imported module: /assets/counter.js'), 'preprod');
    assert.match(message, /proving tools could not be downloaded/);
    assert.match(message, /reload the page/);
  });

  it('keeps specific DUST registration guidance even inside a proof-server error', () => {
    const message = 'Proof server: Lace reports no DUST generation registration. Open Lace → Generate tDUST.';
    assert.equal(friendlyCircuitError(new Error(message), 'preprod'), message);
  });

  it('uses the configured network in wallet and circuit recovery guidance', () => {
    const error = new Error('Network mismatch');
    assert.match(friendlyWalletError(error, 'preview'), /Switch Lace to preview/);
    assert.match(friendlyCircuitError(error, 'preview'), /Switch Lace to preview/);
  });

  it('warns users to check transaction status before retrying a timeout', () => {
    assert.match(friendlyCircuitError(new Error('Proof server timed out'), 'preprod'), /submitted or pending transaction/);
  });

  it('provides actionable fallbacks for missing or malformed error payloads', () => {
    for (const error of [null, undefined, {}, 42]) {
      assert.match(friendlyWalletError(error, 'preprod'), /Unlock the extension/);
      assert.match(friendlyCircuitError(error, 'preprod'), /Check Lace/);
      assert.doesNotMatch(friendlyCircuitError(error, 'preprod'), /\[object Object\]|undefined|null/);
    }
  });
});
