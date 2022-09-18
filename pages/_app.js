import '../styles/globals.css'
import { MoralisProvider } from "react-moralis";
function MyApp({ Component, pageProps }) {
  return <MoralisProvider serverUrl={process.env.NEXT_PUBLIC_MORALIS_SERVER} appId={process.env.NEXT_PUBLIC_MORALIS_API}>
    <Component {...pageProps} />
    </MoralisProvider>
}

export default MyApp
