require('dotenv').config();
const { ethers, upgrades } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const jsonfile = require('jsonfile');
const file = 'address.json';
let data = jsonfile.readFileSync(file);
if (!data) throw new Error('address.json not found !!');
console.dir(data);

const zeroAddress = '0x0000000000000000000000000000000000000000';

async function save(key, value) {
  console.log(key + ': ' + value)
  data[key] = value;
  await jsonfile.writeFile(file, data);
}

async function getSC(scName, scAddr) {
  const SC = await ethers.getContractFactory(scName);
  const sc = await SC.attach(scAddr);
  return sc;
}

async function main() {
  // arbitrum data
  // load address..
  const { weth, usdc, wsteth, usdc_usdc_oracle, weth_usdc_oracle, wsteth_usdc_oracle, router, deployer } = data;
  const { controller, integrationRegistry, setTokenCreator, setValuer, priceOracle } = data;
  const { basicIssuanceModule, tradeModule, streamingFeeModule, customOracleNavIssuanceModule } = data;
  const { uniswapV3ExchangeAdapterV3 } = data;

  // load contracts..
  const controllerSC = await getSC('Controller', controller);
  const integrationRegistrySC = await getSC('IntegrationRegistry', integrationRegistry);
  const setTokenCreatorSC = await getSC('SetTokenCreator', setTokenCreator);
  const setValuerSC = await getSC('SetValuer', setValuer);
  const priceOracleSC = await getSC('PriceOracle', priceOracle);
  const basicIssuanceModuleSC = await getSC('BasicIssuanceModule', basicIssuanceModule);
  const tradeModuleSC = await getSC('TradeModule', tradeModule);
  const streamingFeeModuleSC = await getSC('StreamingFeeModule', streamingFeeModule);
  const customOracleNavIssuanceModuleSC = await getSC('CustomOracleNavIssuanceModule', customOracleNavIssuanceModule);
  const uniswapV3ExchangeAdapterV3SC = await getSC('UniswapV3ExchangeAdapterV3', uniswapV3ExchangeAdapterV3);

  // impersonate account that have 40k usdc & enough eth
  const userAddress = '0x52A258ED593C793251a89bfd36caE158EE9fC4F8';
  await helpers.impersonateAccount(userAddress);

  const usdcSC = await getSC('ERC20', usdc);
  const userUsdc = await usdcSC.balanceOf(userAddress);
  console.log(userUsdc.toString());
}

// npx hardhat run --network fork scripts/04_test.js

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
