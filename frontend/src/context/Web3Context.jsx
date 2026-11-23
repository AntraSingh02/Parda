import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { DEPLOYED_ADDRESSES, CONTRACT_ABIS, SEPOLIA_CONFIG } from '../contracts';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isLiveMode, setIsLiveMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parda_live_mode');
      return saved !== null ? saved === 'true' : false; // Default to demo mode for smooth first run
    }
    return false;
  });

  const [txStatus, setTxStatus] = useState(null); // { hash, status: 'pending'|'success'|'error', message, explorerUrl }

  const hasMetaMask = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  const isSepolia = chainId === 11155111 || chainId === '0xaa36a7' || chainId === 11155111n;

  // Toggle Live Mode
  const toggleLiveMode = () => {
    setIsLiveMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('parda_live_mode', String(next));
      }
      return next;
    });
  };

  // Update ETH balance
  const refreshBalance = useCallback(async (userAddress, provider) => {
    try {
      if (!userAddress || !provider) return;
      const bal = await provider.getBalance(userAddress);
      setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
    } catch (err) {
      console.warn('Failed to fetch balance:', err);
    }
  }, []);

  // Switch network to Sepolia
  const switchToSepolia = async () => {
    if (!hasMetaMask) {
      setError('MetaMask is not installed.');
      return false;
    }
    try {
      setError(null);
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CONFIG.chainIdHex }],
      });
      return true;
    } catch (switchError) {
      // Error code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CONFIG.chainIdHex,
                chainName: SEPOLIA_CONFIG.chainName,
                nativeCurrency: SEPOLIA_CONFIG.nativeCurrency,
                rpcUrls: SEPOLIA_CONFIG.rpcUrls,
                blockExplorerUrls: SEPOLIA_CONFIG.blockExplorerUrls,
              },
            ],
          });
          return true;
        } catch (addError) {
          setError(addError.message || 'Failed to add Sepolia network to MetaMask.');
          return false;
        }
      }
      setError(switchError.message || 'Failed to switch network to Sepolia.');
      return false;
    }
  };

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (!hasMetaMask) {
      setError('MetaMask is not detected. Please install the MetaMask extension.');
      return null;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (accounts.length === 0) {
        throw new Error('No accounts authorized in MetaMask.');
      }

      const activeAccount = accounts[0];
      setAccount(activeAccount);

      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      // Prompt switch to Sepolia if not currently on Sepolia
      if (currentChainId !== SEPOLIA_CONFIG.chainId) {
        await switchToSepolia();
      }

      await refreshBalance(activeAccount, provider);
      setIsConnecting(false);
      return activeAccount;
    } catch (err) {
      console.error('MetaMask connection error:', err);
      setError(err.message || 'Failed to connect MetaMask.');
      setIsConnecting(false);
      return null;
    }
  };

  // Disconnect
  const disconnectWallet = () => {
    setAccount(null);
    setBalance('0.00');
    setError(null);
  };

  // Listen for MetaMask events (accountsChanged, chainChanged)
  useEffect(() => {
    if (!hasMetaMask) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAccount(accounts[0]);
        const provider = new ethers.BrowserProvider(window.ethereum);
        refreshBalance(accounts[0], provider);
      }
    };

    const handleChainChanged = (newChainId) => {
      const parsedChainId = parseInt(newChainId, 16);
      setChainId(parsedChainId);
      if (account) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        refreshBalance(account, provider);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Initial check if already connected
    const checkInitialConnection = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const acc = accounts[0].address;
          setAccount(acc);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
          await refreshBalance(acc, provider);
        }
      } catch (e) {
        console.debug('No initial MetaMask authorization:', e);
      }
    };

    checkInitialConnection();

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [hasMetaMask, refreshBalance]);

  // Execute a transaction with live MetaMask confirmation & Sepolia Etherscan tracker
  const executeContractTx = async ({
    contractName,
    contractAddress,
    methodName,
    args = [],
    overrides = {},
    actionTitle = 'Executing Transaction',
  }) => {
    if (!hasMetaMask || !account) {
      throw new Error('Please connect your MetaMask wallet first.');
    }

    if (!isSepolia) {
      const switched = await switchToSepolia();
      if (!switched) {
        throw new Error('Please switch MetaMask network to Sepolia to execute on-chain.');
      }
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const abi = CONTRACT_ABIS[contractName];
    if (!abi) throw new Error(`ABI for ${contractName} not found.`);

    const targetAddress = contractAddress || DEPLOYED_ADDRESSES[
      contractName === 'ClaimManager' ? 'claimManager' :
      contractName === 'AccessRegistry' ? 'accessRegistry' :
      contractName === 'HospitalRegistry' ? 'hospitalRegistry' :
      contractName === 'AuditAnchor' ? 'auditAnchor' : 'claimManager'
    ];

    const contract = new ethers.Contract(targetAddress, abi, signer);

    setTxStatus({
      status: 'pending',
      message: `Prompting MetaMask: ${actionTitle}...`,
      hash: null,
      explorerUrl: null,
    });

    try {
      const tx = await contract[methodName](...args, overrides);

      const explorerUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
      setTxStatus({
        status: 'pending',
        message: `${actionTitle} broadcast to Sepolia! Waiting for block confirmation...`,
        hash: tx.hash,
        explorerUrl,
      });

      const receipt = await tx.wait();

      setTxStatus({
        status: 'success',
        message: `${actionTitle} confirmed in Block #${receipt.blockNumber}!`,
        hash: tx.hash,
        explorerUrl,
      });

      // Refresh balance
      await refreshBalance(account, provider);

      return { tx, receipt, hash: tx.hash, explorerUrl };
    } catch (err) {
      console.error('Contract execution error:', err);
      const errorMsg = err.reason || err.shortMessage || err.message || 'Transaction rejected or failed.';
      setTxStatus({
        status: 'error',
        message: errorMsg,
        hash: null,
        explorerUrl: null,
      });
      throw err;
    }
  };

  const dismissTxStatus = () => {
    setTxStatus(null);
  };

  return (
    <Web3Context.Provider
      value={{
        hasMetaMask,
        account,
        chainId,
        balance,
        isSepolia,
        isConnecting,
        error,
        isLiveMode,
        toggleLiveMode,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
        executeContractTx,
        txStatus,
        dismissTxStatus,
        deployedAddresses: DEPLOYED_ADDRESSES,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return ctx;
}
