import Head from 'next/head'
import Image from 'next/image'
import Sidebar from '../Components/Sidebar'
import Main from '../Components/Main'

export default function Home() {
  const styles = {
    container: `h-full w-full flex bg-[#fff]`,
  }
  return (
    <div className={styles.container}>
    <Sidebar />

           <Main/>
    </div>
  )
}
