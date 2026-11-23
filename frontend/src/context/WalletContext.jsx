import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const SEPOLIA_CHAIN_ID_DEC = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

// Multi-provider helper (supports MetaMask when multiple extensions like Phantom/Coinbase exist)
function getEthereumProvider() {
  if (typeof window === 'undefined') return null;
  if (window.ethereum?.providers?.length) {
    const metaMask = window.ethereum.providers.find((p) => p.isMetaMask);
    if (metaMask) return metaMask;
  }
  if (window.ethereum?.isMetaMask) return window.ethereum;
  return window.ethereum || null;
}

const WalletContext = createContext({
  account: null,
  chainId: null,
  balance: '0.000',
  isConnecting: false,
  isSepolia: false,
  error: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchNetwork: async () => {},
  getProviderOrSigner: async () => null,
});

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0.000');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isSepolia = chainId === SEPOLIA_CHAIN_ID_DEC || chainId === SEPOLIA_CHAIN_ID_HEX || chainId === 11155111 || chainId === '11155111';

  // Refresh balance of current account
  const refreshBalance = useCallback(async (userAccount) => {
    const eth = getEthereumProvider();
    if (!eth || !userAccount) return;
    try {
      const provider = new ethers.BrowserProvider(eth);
      const rawBal = await provider.getBalance(userAccount);
      const formatted = parseFloat(ethers.formatEther(rawBal)).toFixed(4);
      setBalance(formatted);
    } catch (err) {
      console.warn("Could not fetch balance:", err);
    }
  }, []);

  // Switch network to Sepolia
  const switchNetwork = useCallback(async (targetChainId = SEPOLIA_CHAIN_ID_DEC) => {
    const eth = getEthereumProvider();
    if (!eth) {
      setError("MetaMask is not installed");
      return false;
    }
    const targetHex = targetChainId === SEPOLIA_CHAIN_ID_DEC ? SEPOLIA_CHAIN_ID_HEX : `0x${targetChainId.toString(16)}`;

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
      setError(null);
      return true;
    } catch (switchError) {
      // Error code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://1rpc.io/sepolia'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
          setError(null);
          return true;
        } catch (addError) {
          setError(addError.message || "Failed to add Sepolia network");
          return false;
        }
      }
      setError(switchError.message || "Failed to switch network");
      return false;
    }
  }, []);

  // Connect MetaMask
  const connectWallet = useCallback(async () => {
    const eth = getEthereumProvider();
    if (!eth) {
      alert("MetaMask extension not detected! Please ensure the MetaMask extension is installed and active in your browser.");
      setError("MetaMask extension not detected.");
      return null;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await eth.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from MetaMask.");
      }

      const activeAccount = accounts[0];
      setAccount(activeAccount);

      let currentChain = null;
      try {
        currentChain = await eth.request({
          method: 'eth_chainId',
        });
        setChainId(currentChain);
      } catch (chainErr) {
        console.warn("Could not read chainId directly:", chainErr);
      }

      // Auto-switch to Sepolia if on another network
      if (currentChain && currentChain !== SEPOLIA_CHAIN_ID_HEX && parseInt(currentChain, 16) !== SEPOLIA_CHAIN_ID_DEC) {
        try {
          await switchNetwork(SEPOLIA_CHAIN_ID_DEC);
        } catch (e) {
          console.warn("Network switch skipped:", e);
        }
      }

      await refreshBalance(activeAccount);
      setIsConnecting(false);
      return activeAccount;
    } catch (err) {
      setIsConnecting(false);
      console.warn("MetaMask connectWallet exception:", err);

      if (err.code === -32002) {
        alert("A MetaMask popup is already waiting for your approval! Click the MetaMask icon in your browser toolbar to approve.");
      } else if (err.code === 4001) {
        // User closed or cancelled the popup
        console.info("User closed MetaMask approval window.");
      } else {
        alert(`MetaMask connection error: ${err.message || err}`);
      }

      setError(err.message || "Failed to connect to MetaMask.");
      return null;
    }
  }, [switchNetwork, refreshBalance]);

  // Disconnect
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance('0.000');
    setError(null);
  }, []);

  // Provider or Signer helper
  const getProviderOrSigner = useCallback(async (needSigner = false) => {
    const eth = getEthereumProvider();
    if (!eth) return null;
    const provider = new ethers.BrowserProvider(eth);
    if (needSigner) {
      return await provider.getSigner();
    }
    return provider;
  }, []);

  // Listen to accountsChanged and chainChanged events
  useEffect(() => {
    const eth = getEthereumProvider();
    if (!eth) return;

    // Check if already authorized
    eth.request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          eth.request({ method: 'eth_chainId' }).then((c) => {
            setChainId(c);
          }).catch(() => {});
          refreshBalance(accounts[0]);
        }
      })
      .catch(() => {});

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        refreshBalance(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      if (account) refreshBalance(account);
    };

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);

    return () => {
      if (eth.removeListener) {
        eth.removeListener('accountsChanged', handleAccountsChanged);
        eth.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, refreshBalance, disconnectWallet]);

  const value = {
    account,
    chainId,
    balance,
    isConnecting,
    isSepolia,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getProviderOrSigner,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
