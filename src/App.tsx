import React, { useMemo } from 'react';
import './App.css';
import logo from './logo.svg';
import { ConnectionProvider, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from "@solana/web3.js";
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

const Content = () => {
    const wallet = useWallet()
    return <header className="App-header">
        <WalletMultiButton/>
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hi {wallet?.publicKey?.toBase58()}!</p>
        <a
            className="App-link"
            href="https://docs.solana.com/"
            target="_blank"
            rel="noopener noreferrer"
        >
            Learn Solana
        </a>
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
