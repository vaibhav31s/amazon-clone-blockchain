import { createContext, useState, useEffect } from 'react'
import { useMoralis, useMoralisQuery } from 'react-moralis'

export const AmazonContext = createContext()

export const AmazonProvider = ({ children }) => {
    const [nickname, setNickname] = useState('')
    const [username, setUsername] = useState('')

    const {
        authenticate,
        isAuthenticated,
        enableWeb3,
        Moralis,
        user,
        isWeb3Enabled,
      } = useMoralis()
      
    const {
        data: userData,
        error: userDataError,
        isLoading: userDataIsLoading,
      } = useMoralisQuery('_User')


      useEffect(async () => {
        if (!isWeb3Enabled) {
          await enableWeb3()
        }
   
    
        if (isAuthenticated) {

          const currentUsername = await user?.get('nickname')
          setUsername(currentUsername)
        } else {
        
        }
      }, [
        isWeb3Enabled,
        isAuthenticated,
        authenticate,
        setUsername,
        user,
        username,
      ])

    const handleSetUsername = () => {
        if (user) {
          if (nickname) {
            user.set('nickname', nickname)
            user.save()
            setNickname('')
          } else {
            console.log("Can't set empty nickname")
          }
        } else {
          console.log('No user')
        }
      }
    
    return (<AmazonContext.Provider 
    value= {{
            isAuthenticated,
            nickname,
            setNickname,
            username,
            handleSetUsername

    }   }
    >
        {children}
    </AmazonContext.Provider>);
}
