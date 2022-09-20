import { createContext, useState, useEffect } from 'react'
import { useMoralis, useMoralisQuery } from 'react-moralis'

export const AmazonContext = createContext()

export const AmazonProvider = ({ children }) => {
    const [nickname, setNickname] = useState('')
    const [username, setUsername] = useState('')
    const [assets, setAssets] = useState([])


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

      const {
        data: assetsData,
        error: assetsDataError,
        isLoading: assetsDataIsLoading,
      } = useMoralisQuery('assets')
      useEffect(async () => {
        console.log(assetsData)
        await enableWeb3()
        await getAssets()
        await getOwnedAssets()
      }, [userData, assetsData, assetsDataIsLoading, userDataIsLoading])

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
      const getOwnedAssets = async () => {
        try {
          // let query = new Moralis.Query('_User')
          // let results = await query.find()
    
          if (userData[0]) {
            setOwnedItems(prevItems => [
              ...prevItems,
              userData[0].attributes.ownedAsset,
            ])
          }
        } catch (error) {
          console.log(error)
        }
      }

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
      const getAssets = async () => {
        try {
          await enableWeb3()
          // const query = new Moralis.Query('Assets')
          // const results = await query.find()
    
          setAssets(assetsData)
        } catch (error) {
          console.log(error)
        }
      }
    return (<AmazonContext.Provider 
    value= {{
            isAuthenticated,
            nickname,
            setNickname,
            username,
            handleSetUsername,
            assets

    }   }
    >
        {children}
    </AmazonContext.Provider>);
}
