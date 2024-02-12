export default () => ({
  port: parseInt(process.env.PORT) || 3000,
  heartbit: {
    network: process.env.HEARTBIT_NETWORK,
    alchemyApiKey: process.env.HEARTBIT_ALCHEMY_API_KEY,
    privateKey: process.env.HEARTBIT_PRIVATE_KEY,
    contractAddress: process.env.HEARTBIT_CONTRACT_ADDRESS,
  },
  auth: {
    apiKey: process.env.AUTH_API_KEY,
  },
});
