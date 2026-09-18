import {
  createContext,
  createElement,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

export const MIDNIGHT_NETWORK = import.meta.env.VITE_MIDNIGHT_NETWORK ?? 'preprod';
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ?? '19710614a44cd723c34f79a913e20f2b8776d0bf8825c5b653c6cc25942a7d89';

type WalletStatus = 'detecting' | 'not-installed' | 'ready' | 'connecting' | 'connected';
type DustBalance = {
  readonly balance: bigint;
  readonly cap: bigint;
};

type MidnightContextValue = {
  readonly status: WalletStatus;
  readonly address: string | null;
  readonly connectedAPI: ConnectedAPI | null;
  readonly dustBalance: DustBalance | null;
  readonly error: string | null;
  readonly networkId: string;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => void;
  readonly refreshDustBalance: () => Promise<void>;
};

const MidnightContext = createContext<MidnightContextValue | null>(null);

const getWallets = (): InitialAPI[] => {
  if (!window.midnight) return [];
  return Object.values(window.midnight).filter(
    (candidate): candidate is InitialAPI =>
      candidate !== null &&
      typeof candidate === 'object' &&
      'apiVersion' in candidate &&
      typeof candidate.apiVersion === 'string' &&
      candidate.apiVersion.startsWith('4.'),
  );
};

const findLace = (): InitialAPI | undefined => {
  const wallets = getWallets();
  return (
    wallets.find((wallet) => wallet.name.toLowerCase().includes('lace')) ??
    wallets.find((wallet) => wallet.rdns.toLowerCase().includes('lace')) ??
    wallets[0]
  );
};

const friendlyWalletError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('reject') || normalized.includes('denied') || normalized.includes('not authorized')) {
    return 'Wallet connection was rejected. Approve the request in Lace and try again.';
  }
  if (normalized.includes('network mismatch') || normalized.includes('network id')) {
    return `Network mismatch. Switch Lace to ${MIDNIGHT_NETWORK} and reconnect.`;
  }
  return message || 'Lace could not connect. Please try again.';
};

export function MidnightProvider({ children }: PropsWithChildren) {
  const [connector, setConnector] = useState<InitialAPI | null>(null);
  const [connectedAPI, setConnectedAPI] = useState<ConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [dustBalance, setDustBalance] = useState<DustBalance | null>(null);
  const [status, setStatus] = useState<WalletStatus>('detecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detect = (): boolean => {
      const wallet = findLace();
      if (!wallet) return false;
      setConnector(wallet);
      setStatus('ready');
      return true;
    };

    if (detect()) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (detect() || attempts >= 40) {
        window.clearInterval(timer);
        if (attempts >= 40) setStatus('not-installed');
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  const connect = useCallback(async () => {
    const wallet = connector ?? findLace();
    if (!wallet) {
      setStatus('not-installed');
      setError('Lace wallet was not found. Install Lace, enable Midnight, and reload this page.');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const connection = await wallet.connect(MIDNIGHT_NETWORK);
      const configuration = await connection.getConfiguration();
      if (configuration.networkId !== MIDNIGHT_NETWORK) {
        throw new Error(
          `Network mismatch: Lace is on ${configuration.networkId}; ${MIDNIGHT_NETWORK} is required.`,
        );
      }
      const { unshieldedAddress } = await connection.getUnshieldedAddress();
      setConnector(wallet);
      setConnectedAPI(connection);
      setAddress(unshieldedAddress);
      setStatus('connected');
      setDustBalance(await connection.getDustBalance());
    } catch (connectionError) {
      setConnectedAPI(null);
      setAddress(null);
      setDustBalance(null);
      setError(friendlyWalletError(connectionError));
      setStatus('ready');
    }
  }, [connector]);

  const disconnect = useCallback(() => {
    setConnectedAPI(null);
    setAddress(null);
    setDustBalance(null);
    setError(null);
    setStatus(connector ? 'ready' : 'not-installed');
  }, [connector]);

  const refreshDustBalance = useCallback(async () => {
    if (!connectedAPI) return;

    try {
      setDustBalance(await connectedAPI.getDustBalance());
    } catch (balanceError) {
      setError(friendlyWalletError(balanceError));
    }
  }, [connectedAPI]);

  const value = useMemo<MidnightContextValue>(
    () => ({
      status,
      address,
      connectedAPI,
      dustBalance,
      error,
      networkId: MIDNIGHT_NETWORK,
      connect,
      disconnect,
      refreshDustBalance,
    }),
    [status, address, connectedAPI, dustBalance, error, connect, disconnect, refreshDustBalance],
  );

  return createElement(MidnightContext.Provider, { value }, children);
}

export const useMidnight = (): MidnightContextValue => {
  const context = useContext(MidnightContext);
  if (!context) throw new Error('useMidnight must be used inside MidnightProvider.');
  return context;
};
