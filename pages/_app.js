import '../styles/globals.css'
import { MoralisProvider } from "react-moralis";
import { AmazonProvider } from "../Context/AmazonContexts"
// import {ModalProvider } from 'react-simple-hook-modal'; 

function MyApp({ Component, pageProps }) {
  return (
  <MoralisProvider serverUrl={process.env.NEXT_PUBLIC_MORALIS_SERVER} appId={process.env.NEXT_PUBLIC_MORALIS_API}>
    <AmazonProvider>
        <Component {...pageProps} />
    </AmazonProvider>
  </MoralisProvider>);
}

export default MyApp
