import type { ContractAddress, SigningKey } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import type {
  ExportPrivateStatesOptions,
  ExportSigningKeysOptions,
  ImportPrivateStatesOptions,
  ImportPrivateStatesResult,
  ImportSigningKeysOptions,
  ImportSigningKeysResult,
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from '@midnight-ntwrk/midnight-js-types';

const encode = <T,>(value: T): string =>
  JSON.stringify(value, (_key, item) =>
    typeof item === 'bigint' ? { __midnightBigInt: item.toString() } : item,
  );

const decode = <T,>(value: string): T =>
  JSON.parse(value, (_key, item) => {
    if (
      item !== null &&
      typeof item === 'object' &&
      '__midnightBigInt' in item &&
      typeof item.__midnightBigInt === 'string'
    ) {
      return BigInt(item.__midnightBigInt);
    }
    return item;
  }) as T;

export const inMemoryPrivateStateProvider = <PSI extends PrivateStateId, PS = unknown>(): PrivateStateProvider<PSI, PS> => {
  const privateStates = new Map<ContractAddress, Map<PSI, PS>>();
  const signingKeys = new Map<ContractAddress, SigningKey>();
  let contractAddress: ContractAddress | null = null;

  const requireContractAddress = (): ContractAddress => {
    if (contractAddress === null) throw new Error('Contract address is not set.');
    return contractAddress;
  };

  const statesFor = (address: ContractAddress): Map<PSI, PS> => {
    let states = privateStates.get(address);
    if (!states) {
      states = new Map<PSI, PS>();
      privateStates.set(address, states);
    }
    return states;
  };

  return {
    setContractAddress(address): void {
      contractAddress = address;
    },
    async set(key, state): Promise<void> {
      statesFor(requireContractAddress()).set(key, state);
    },
    async get(key): Promise<PS | null> {
      return statesFor(requireContractAddress()).get(key) ?? null;
    },
    async remove(key): Promise<void> {
      statesFor(requireContractAddress()).delete(key);
    },
    async clear(): Promise<void> {
      privateStates.delete(requireContractAddress());
    },
    async setSigningKey(address, key): Promise<void> {
      signingKeys.set(address, key);
    },
    async getSigningKey(address): Promise<SigningKey | null> {
      return signingKeys.get(address) ?? null;
    },
    async removeSigningKey(address): Promise<void> {
      signingKeys.delete(address);
    },
    async clearSigningKeys(): Promise<void> {
      signingKeys.clear();
    },
    async exportPrivateStates(_options?: ExportPrivateStatesOptions): Promise<PrivateStateExport> {
      const address = requireContractAddress();
      const states = Object.fromEntries(
        Array.from(statesFor(address), ([key, value]) => [key, encode(value)]),
      );
      return {
        format: 'midnight-private-state-export',
        encryptedPayload: encode({ address, states }),
        salt: 'in-memory-only',
      };
    },
    async importPrivateStates(
      data: PrivateStateExport,
      options?: ImportPrivateStatesOptions,
    ): Promise<ImportPrivateStatesResult> {
      const strategy = options?.conflictStrategy ?? 'error';
      const states = statesFor(requireContractAddress());
      const payload = decode<{ states?: Record<string, string> }>(data.encryptedPayload);
      let imported = 0;
      let skipped = 0;
      let overwritten = 0;

      for (const [rawKey, serialized] of Object.entries(payload.states ?? {})) {
        const key = rawKey as PSI;
        if (states.has(key)) {
          if (strategy === 'skip') {
            skipped += 1;
            continue;
          }
          if (strategy === 'error') throw new Error(`Private-state conflict: ${rawKey}`);
          overwritten += 1;
        } else {
          imported += 1;
        }
        states.set(key, decode<PS>(serialized));
      }

      return { imported, skipped, overwritten };
    },
    async exportSigningKeys(_options?: ExportSigningKeysOptions): Promise<SigningKeyExport> {
      return {
        format: 'midnight-signing-key-export',
        encryptedPayload: encode({ keys: Object.fromEntries(signingKeys) }),
        salt: 'in-memory-only',
      };
    },
    async importSigningKeys(
      data: SigningKeyExport,
      options?: ImportSigningKeysOptions,
    ): Promise<ImportSigningKeysResult> {
      const strategy = options?.conflictStrategy ?? 'error';
      const payload = decode<{ keys?: Record<string, SigningKey> }>(data.encryptedPayload);
      let imported = 0;
      let skipped = 0;
      let overwritten = 0;

      for (const [address, key] of Object.entries(payload.keys ?? {})) {
        if (signingKeys.has(address)) {
          if (strategy === 'skip') {
            skipped += 1;
            continue;
          }
          if (strategy === 'error') throw new Error(`Signing-key conflict: ${address}`);
          overwritten += 1;
        } else {
          imported += 1;
        }
        signingKeys.set(address, key);
      }

      return { imported, skipped, overwritten };
    },
  };
};
