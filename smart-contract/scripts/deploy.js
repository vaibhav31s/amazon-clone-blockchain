import { network } from 'hardhat'

async function main() {
  const { ethers } = await network.getOrCreate()
  const amazonCoin = await ethers.deployContract('AmazonCoin')

  await amazonCoin.waitForDeployment()

  console.log('Amazon Coin deployed to:', await amazonCoin.getAddress())
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
