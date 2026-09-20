import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { friendlyCircuitError, friendlyWalletError, getErrorMessage, getProofServerOrigin } from '../src/utils/errors';

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

  it('identifies an opaque Lace balancing failure without blaming the completed circuit proof', () => {
    const error = new Error("Proving or submitting the transaction failed: Unexpected error submitting scoped transaction '<unnamed>': Error: Lace transaction balancing failed (wallet proof server: http://localhost:6300): The service returned an unknown error");
    const message = friendlyCircuitError(error, 'preprod');
    assert.match(message, /circuit proof succeeded/);
    assert.match(message, /has not submitted/);
    assert.match(message, /Lace proof server: http:\/\/localhost:6300/);
    assert.match(message, /hosted prover does not change Lace/);
    assert.doesNotMatch(message, /scoped transaction|<unnamed>/);
    const withoutUrl = friendlyCircuitError(new Error('Lace transaction balancing failed: The service returned an unknown error'), 'preprod');
    assert.match(withoutUrl, /Lace's own proof-server setting/);
    assert.doesNotMatch(withoutUrl, /undefined/);
  });

  it('does not expose credentials, paths, or tokens in wallet prover diagnostics', () => {
    assert.equal(getProofServerOrigin('https://user:password@prover.example/private?token=secret#fragment'), 'https://prover.example');
    assert.equal(getProofServerOrigin('http://localhost:6300/'), 'http://localhost:6300');
    for (const value of [undefined, '', 'not a URL', 'file:///tmp/prover', 'javascript:alert(1)']) {
      assert.equal(getProofServerOrigin(value), undefined);
    }
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

  it('identifies an unreachable prover without blaming wallet sync', () => {
    const error = new Error('Proving or submitting the transaction failed: Proof service request failed: Failed to fetch');
    const message = friendlyCircuitError(error, 'preprod');
    assert.match(message, /proof service could not be reached/);
    assert.doesNotMatch(message, /wallet sync/);
  });

  it('identifies an indexer network failure separately from proving', () => {
    const error = new Error('Loading the Preprod contract failed: NetworkError: Failed to fetch');
    assert.match(friendlyCircuitError(error, 'preprod'), /preprod contract data.*indexer/);
  });

  it('warns against blindly retrying a failed submission request', () => {
    const error = new Error('Proving or submitting the transaction failed: Lace transaction submission failed: Failed to fetch');
    assert.match(friendlyCircuitError(error, 'preprod'), /submitted or pending transaction before trying again/);
  });

  it('provides actionable fallbacks for missing or malformed error payloads', () => {
    for (const error of [null, undefined, {}, 42]) {
      assert.match(friendlyWalletError(error, 'preprod'), /Unlock the extension/);
      assert.match(friendlyCircuitError(error, 'preprod'), /Check Lace/);
      assert.doesNotMatch(friendlyCircuitError(error, 'preprod'), /\[object Object\]|undefined|null/);
    }
  });
});
