import React from 'react'
import {ConnectButton} from "web3uikit";
import { Stack } from '@mui/system';

const styles = {
  container : `h-full w-full flex`,
  profiele:  `h-full w-full flex `
}
const isAuthenticated = true;
const Sidebar = () => {
  return (
    <>
  
        <div className={styles.container}>
      <div className={styles.profile}>
        {
          isAuthenticated &&  (
            <Stack>
                  Hellow
            </Stack>
       
            
          ) ? <Stack> Word</Stack> : <Stack> jwergf</Stack>
  
        }
      </div>
    </div>
    </>
  )
}

export default Sidebar