import { createContext, useState, useEffect } from 'react'
import { useMoralis, useMoralisQuery } from 'react-moralis'
import { amazonAbi, amazonCoinAddress } from '../lib/constants'
import { ethers } from 'ethers'

export const AmazonContext = createContext()

export const AmazonProvider = ({ children }) => {
    const [nickname, setNickname] = useState('')
    const [username, setUsername] = useState('')
    const [assets, setAssets] = useState([])
    const [currentAccount, setCurrentAccount]  =  useState('')
    const [amountDue, setAmountDue] = useState('')
    const [etherScanLink, setEtherScanLink ] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [balance, setBalance] = useState('')
    const [tokenAmount, setTokenAmount] = useState('')




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
          await getBalance()
          const currentUsername = await user?.get('nickname')
          setUsername(currentUsername)
          const account = await user?.get('ethAddress')
          setCurrentAccount(account) 
        } else {
          setBalance(' ')
        }
      }, [isWeb3Enabled,
        isAuthenticated,
        balance,
        setBalance,
        authenticate,
        currentAccount,
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

        const getBalance = async () => {
    try {
      if (!isAuthenticated || !currentAccount) return
      const options = {
        contractAddress: amazonCoinAddress,
        functionName: 'balanceOf',
        abi: amazonAbi,
        params: {
          account: currentAccount,
        },
      }

      if (isWeb3Enabled) {
        const response = await Moralis.executeFunction(options)
        console.log(response.toString())
        setBalance(response.toString())
      }
    } catch (error) {
      console.log(error)
    }
  }

      const buyTokens = async()=>{
        if(!isAuthenticated){
          await authenticate()
        }

        const amount = ether.BigNumber.from(tokenAmount)
        const price = ether.BigNumber.from('100000000000000')
        const calcPrice = amount.mul(price)


          let options = {
            contractAddress: amazonCoinAddress,
            functionName : 'mint',
            abi : amazonAbi,
            msgValue: calcPrice,
            params:{
              amount,
            }
          }

          const transaction = await Moralis.executeFunction(options)
          const receipt = await transaction.wait(4)
          setIsLoading(false)
          console.log(receipt)
          setEtherScanLink(
            `https://rinkeby.etherscan.io/tx${receipt.transactionHash}`,
          )


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
            assets,
            balance,
            amountDue,
             setAmountDue,
            setTokenAmount,
            tokenAmount,   
            isLoading,
            setIsLoading,
            setEtherScanLink,
            etherScanLink,
            currentAccount,
          buyTokens,
    }   }
    >
        {children}
    </AmazonContext.Provider>);
}
