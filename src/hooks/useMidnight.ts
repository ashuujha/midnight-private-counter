import {
  createContext,
  createElement,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { friendlyWalletError } from '../utils/errors';

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
  readonly dustAddress: string | null;
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
      candidate.apiVersion.startsWith('4.') &&
      'name' in candidate && typeof candidate.name === 'string' &&
      'rdns' in candidate && typeof candidate.rdns === 'string' &&
      'connect' in candidate && typeof candidate.connect === 'function',
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

export function MidnightProvider({ children }: PropsWithChildren) {
  const [connector, setConnector] = useState<InitialAPI | null>(null);
  const [connectedAPI, setConnectedAPI] = useState<ConnectedAPI | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [dustAddress, setDustAddress] = useState<string | null>(null);
  const [dustBalance, setDustBalance] = useState<DustBalance | null>(null);
  const [status, setStatus] = useState<WalletStatus>('detecting');
  const [error, setError] = useState<string | null>(null);
  const connectionVersion = useRef(0);

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
      const found = detect();
      if (found || attempts >= 40) {
        window.clearInterval(timer);
        if (!found) setStatus('not-installed');
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  const connect = useCallback(async () => {
    const version = ++connectionVersion.current;
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
      if (connectionVersion.current !== version) return;
      const configuration = await connection.getConfiguration();
      if (connectionVersion.current !== version) return;
      if (configuration.networkId !== MIDNIGHT_NETWORK) {
        throw new Error(
          `Network mismatch: Lace is on ${configuration.networkId}; ${MIDNIGHT_NETWORK} is required.`,
        );
      }
      const [{ unshieldedAddress }, { dustAddress: connectedDustAddress }, balance] = await Promise.all([
        connection.getUnshieldedAddress(),
        connection.getDustAddress(),
        connection.getDustBalance(),
      ]);
      if (connectionVersion.current !== version) return;
      setConnector(wallet);
      setConnectedAPI(connection);
      setAddress(unshieldedAddress);
      setDustAddress(connectedDustAddress);
      setStatus('connected');
      setDustBalance(balance);
    } catch (connectionError) {
      if (connectionVersion.current !== version) return;
      setConnectedAPI(null);
      setAddress(null);
      setDustAddress(null);
      setDustBalance(null);
      setError(friendlyWalletError(connectionError, MIDNIGHT_NETWORK));
      setStatus('ready');
    }
  }, [connector]);

  const disconnect = useCallback(() => {
    connectionVersion.current += 1;
    setConnectedAPI(null);
    setAddress(null);
    setDustAddress(null);
    setDustBalance(null);
    setError(null);
    setStatus(connector ? 'ready' : 'not-installed');
  }, [connector]);

  const refreshDustBalance = useCallback(async () => {
    if (!connectedAPI) return;
    const version = connectionVersion.current;

    try {
      const balance = await connectedAPI.getDustBalance();
      if (connectionVersion.current !== version) return;
      setDustBalance(balance);
      setError(null);
    } catch (balanceError) {
      if (connectionVersion.current !== version) return;
      setError(`DUST balance could not be refreshed. ${friendlyWalletError(balanceError, MIDNIGHT_NETWORK)}`);
    }
  }, [connectedAPI]);

  const value = useMemo<MidnightContextValue>(
    () => ({
      status,
      address,
      dustAddress,
      connectedAPI,
      dustBalance,
      error,
      networkId: MIDNIGHT_NETWORK,
      connect,
      disconnect,
      refreshDustBalance,
    }),
    [status, address, dustAddress, connectedAPI, dustBalance, error, connect, disconnect, refreshDustBalance],
  );

  return createElement(MidnightContext.Provider, { value }, children);
}

export const useMidnight = (): MidnightContextValue => {
  const context = useContext(MidnightContext);
  if (!context) throw new Error('useMidnight must be used inside MidnightProvider.');
  return context;
};
