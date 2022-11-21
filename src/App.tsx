import React, {FormEvent, FC, useCallback, useEffect, useMemo, useState} from 'react';
import './App.css';
import logo from './logo.svg';
import { ConnectionProvider, useConnection, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import {clusterApiUrl, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction} from "@solana/web3.js";
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
import {CivicProfile, Profile} from "@civic/profile";

require('@solana/wallet-adapter-react-ui/styles.css');

const network = WalletAdapterNetwork.Mainnet;

interface FormElements extends HTMLFormControlsCollection {
    address: HTMLInputElement
}
interface TransferForm extends HTMLFormElement {
    readonly elements: FormElements
}

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

const useProfile = () => {
    const { connection } = useConnection();
    const wallet = useWallet()
    const [ profile, setProfile ] = useState<Profile>();


    useEffect(() => {
        if (!wallet.publicKey) return;
        CivicProfile.get(wallet.publicKey?.toBase58(), { solana: { connection } }).then(setProfile)
    }, [wallet, connection]);

    return profile;
}

const Transfer = () => {
    const wallet = useWallet()
    const { connection } = useConnection();
    const [tx, setTx] = useState<string>();
    const [error, setError] = useState<Error>();

    if (!connection || !wallet.connected || !wallet.publicKey) return <></>

    const transferFunds = async (e: FormEvent<TransferForm>) => {
        e.preventDefault();

        if (!wallet.publicKey) return;

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: new PublicKey(e.currentTarget.elements.address.value),
                lamports: 0.1 * LAMPORTS_PER_SOL
            })
        );

        wallet.sendTransaction(transaction, connection).then(setTx).catch(setError);
    }

    return <>
        <form onSubmit={transferFunds}>
            Send 0.1 SOL to <input name="address"/>
            <input type="submit" value="Send" />
        </form>
        { tx && <p>Done! <a href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}>View in explorer</a></p>}
        { error && <p>{error.message}</p>}
    </>
}

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
    const profile = useProfile();

    const name = useMemo(() => profile?.name?.value || wallet.publicKey?.toBase58() || "", [profile, wallet.publicKey])

    return <header className="App-header">
        <WalletMultiButton/>
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hi <a href={"https://civic.me/" + profile?.did}>{name}</a>!</p>
        {profile?.image && <img alt={name} src={profile?.image?.url} width={100}/>}
        { network !== WalletAdapterNetwork.Mainnet && <Airdrop/> }
        {balance && <p>Your balance is {(balance / LAMPORTS_PER_SOL).toFixed(2)} SOL</p>}
        <Transfer/>
    </header>
}

function App() {
    const endpoint = "https://rpc.ankr.com/solana" //clusterApiUrl(network);
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
        ],
        []
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
