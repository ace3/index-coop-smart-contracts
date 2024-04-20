require('dotenv').config();
const { ethers, upgrades } = require("hardhat");
const jsonfile = require('jsonfile');
const file = 'address.json';
let data = {};

async function save(key, value) {
  console.log(key + ': ' + value)
  data[key] = value;
  await jsonfile.writeFile(file, data);
}

async function main() {
  // arbitrum data
  const weth = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
  const usdc = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
  const wsteth = '0x5979D7b546E38E414F7E9822514be443A4800529';
  const usdc_usdc_oracle = '0x3Cb237015231AC57d2Ca1b5208dfAb34ced4Ff84';
  const weth_usdc_oracle = '0xD7788a5C3AaE14d7E84568D4Ea21fd4593ab3a15';
  const wsteth_usdc_oracle = '0x1750e0Ffd47a38C120B6c640Fb6BC14fdb02F9E8';
  const router = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';

  data['weth'] = weth;
  data['usdc'] = usdc;
  data['wsteth'] = wsteth;
  data['usdc_usdc_oracle'] = usdc_usdc_oracle;
  data['weth_usdc_oracle'] = weth_usdc_oracle;
  data['wsteth_usdc_oracle'] = wsteth_usdc_oracle;
  data['router'] = router;

  const accounts = await ethers.getSigners();
  const deployerAddress = accounts[0].address;
  await save('deployer', deployerAddress);

  let SC = await ethers.getContractFactory("Controller");
  const controller = await SC.deploy(deployerAddress);
  await save('controller', controller.address);

  SC = await ethers.getContractFactory("IntegrationRegistry");
  const integrationRegistry = await SC.deploy(controller.address);
  await save('integrationRegistry', integrationRegistry.address);

  SC = await ethers.getContractFactory("SetTokenCreator");
  const setTokenCreator = await SC.deploy(controller.address);
  await save('setTokenCreator', setTokenCreator.address);

  SC = await ethers.getContractFactory("SetValuer");
  const setValuer = await SC.deploy(controller.address);
  await save('setValuer', setValuer.address);

  // set PriceOracle
  SC = await ethers.getContractFactory("PriceOracle");
  const priceOracle = await SC.deploy(controller.address, usdc, [], [], [], []);
  await save('priceOracle', priceOracle.address);

  // core has been deployed

  // deploy modules:
  // Basic Issuance Module constructor(controller)
  SC = await ethers.getContractFactory("BasicIssuanceModule");
  const basicIssuanceModule = await SC.deploy(controller.address);
  await save('basicIssuanceModule', basicIssuanceModule.address);

  // Trade Module constructor(controller)
  SC = await ethers.getContractFactory("TradeModuleV2");
  const tradeModule = await SC.deploy(controller.address);
  await save('tradeModule', tradeModule.address);

  // Streaming Fee Module constructor(controller)
  SC = await ethers.getContractFactory("StreamingFeeModule");
  const streamingFeeModule = await SC.deploy(controller.address);
  await save('streamingFeeModule', streamingFeeModule.address);

  // CustomOracleNAVIssuance Module constructor(controller,weth)
  SC = await ethers.getContractFactory("CustomOracleNavIssuanceModule");
  const customOracleNavIssuanceModule = await SC.deploy(controller.address, weth);
  await save('customOracleNavIssuanceModule', customOracleNavIssuanceModule.address);

  // deploy adapter:
  // UniswapV3ExchangeAdapterV3 constructor(routerAddress)
  SC = await ethers.getContractFactory("UniswapV3ExchangeAdapterV3");
  const uniswapV3ExchangeAdapterV3 = await SC.deploy(router);
  await save('uniswapV3ExchangeAdapterV3', uniswapV3ExchangeAdapterV3.address);

}

// npx hardhat compile
// npx hardhat run --network tenderlyfork scripts/01_deploy.js
// npx hardhat run --network tenderlyfork scripts/02_init.js
// npx hardhat run --network tenderlyfork scripts/03_create.js
// npx hardhat run --network tenderlyfork scripts/04_test.js

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
