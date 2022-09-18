import Head from 'next/head'
import Image from 'next/image'
import Sidebar from '../Components/Sidebar'
import { Paper,Box } from '@mui/material'
import { Avatar } from 'web3uikit'

export default function Home() {
  return (
    <div >
      <Box
      sx={{
        display: 'flex',
        '& > :not(style)': {
          m: 1,
          width: 260,
          height: 328,
          // bgcolor: 'primary.main' ,
         borderRadius:12,
         boxShadow: 21
        },
      }}
    >

      <Paper sx={{justifyContent: 'space-between'}} variant="outlined" square >
      <Avatar
        sx={{ bgcolor: deepOrange[500] }}
        alt="Remy Sharp"
        src="/broken-image.jpg"
      />
      </Paper>
    </Box>
      <Sidebar/>

           {/* <Main/> */}
    </div>
  )
}
