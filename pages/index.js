import Head from 'next/head'
import Image from 'next/image'
import Sidebar from '../Components/Sidebar'
import {ConnectButton} from "web3uikit";
const styles = {
  container : `h-full w-full flex bg-[#fff]`
}

export default function Home() {
  return (
    <div className={styles.container}>
      <Sidebar/>

      <ConnectButton />      {/* <Main/> */}
    </div>
  )
}
