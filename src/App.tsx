import React, {FC, useCallback, useEffect, useMemo, useState} from 'react';
import './App.css';
import logo from './logo.svg';
import { ConnectionProvider, useConnection, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import {clusterApiUrl, LAMPORTS_PER_SOL} from "@solana/web3.js";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
    WalletModalProvider,
    WalletMultiButton
} from "@solana/wallet-adapter-react-ui";

require('@solana/wallet-adapter-react-ui/styles.css');

const useBalance = () => {
    const wallet = useWallet()
    const { connection } = useConnection();
    const [balance, setBalance] = useState<number>();

    useEffect(() => {
        if (!connection || !wallet.connected || !wallet.publicKey) {
            setBalance(undefined);
            return;
        }

        connection.getBalance(wallet.publicKey).then(setBalance)
        const subscription = connection.onAccountChange(wallet.publicKey, (a) => setBalance(a.lamports));
        return () => { connection.removeAccountChangeListener(subscription) };
    }, [wallet, connection])

    return balance;
};

const Airdrop:FC = () => {
    const { connection } = useConnection();
    const wallet = useWallet()
    const airdrop = useCallback(async () => {
        if (!wallet.publicKey) return;
        await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL)
    }, [connection, wallet.publicKey]);
    if (!wallet.connected || !wallet.publicKey) return <></>
    return <button className="wallet-adapter-button wallet-adapter-button-trigger" onClick={airdrop}>Praise the sun!</button>
}

const Content:FC = () => {
    const wallet = useWallet()
    const balance = useBalance()
    return <header className="App-header">
        <WalletMultiButton/>
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hi {wallet?.publicKey?.toBase58()}!</p>
        <Airdrop/>
        {balance && <p>Your balance is {(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL</p>}
    </header>
}

function App() {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
        ],
        [network]
    );

    return (
        <div className="App">
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <Content />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </div>
    );
}

export default App;
