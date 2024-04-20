require('dotenv').config();
const { ethers, upgrades, network } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const jsonfile = require('jsonfile');
const file = 'address.json';
let data = jsonfile.readFileSync(file);
if (!data) throw new Error('address.json not found !!');
console.dir(data);

const MAX_UINT = ethers.constants.MaxUint256;
const zeroAddress = '0x0000000000000000000000000000000000000000';
const zero18 = '000000000000000000';
const zero6 = '000000';

function wei2eth(wei) {
  return ethers.utils.formatUnits(wei, "ether");
}

function wei2usdc(wei) {
  return ethers.utils.formatUnits(wei, "mwei");
}

function eth2wei(eth) {
  return ethers.utils.parseEther(eth);
}


async function save(key, value) {
  console.log(key + ': ' + value)
  data[key] = value;
  await jsonfile.writeFile(file, data);
}

async function getSC(scName, scAddr, signer) {
  const SC = await ethers.getContractFactory(scName, signer);
  const sc = await SC.attach(scAddr);
  return sc;
}

async function main() {

  const accounts = await ethers.getSigners();
  const signer = accounts[0];
  const signer2 = accounts[1];
  const otherAddress = signer2.address;

  const { weth, usdc, wsteth, usdc_usdc_oracle, weth_usdc_oracle, wsteth_usdc_oracle, router, deployer } = data;
  const { controller, integrationRegistry, setTokenCreator, setValuer, priceOracle } = data;
  const { basicIssuanceModule, tradeModule, streamingFeeModule, customOracleNavIssuanceModule } = data;
  const { uniswapV3ExchangeAdapterV3 } = data;
  const { settoken } = data;

  const controllerSC = await getSC('Controller', controller, signer);
  const integrationRegistrySC = await getSC('IntegrationRegistry', integrationRegistry, signer);
  const setTokenCreatorSC = await getSC('SetTokenCreator', setTokenCreator, signer);
  const setValuerSC = await getSC('SetValuer', setValuer, signer);
  const priceOracleSC = await getSC('PriceOracle', priceOracle, signer);
  const basicIssuanceModuleSC = await getSC('BasicIssuanceModule', basicIssuanceModule, signer);
  const tradeModuleSC = await getSC('TradeModuleV2', tradeModule, signer);
  const streamingFeeModuleSC = await getSC('StreamingFeeModule', streamingFeeModule, signer);
  const customOracleNavIssuanceModuleSC = await getSC('CustomOracleNavIssuanceModule', customOracleNavIssuanceModule, signer);
  const uniswapV3ExchangeAdapterV3SC = await getSC('UniswapV3ExchangeAdapterV3', uniswapV3ExchangeAdapterV3, signer);


  const ts1SC = await getSC('SetToken', settoken, signer);
  const numUsdc = await ts1SC.getDefaultPositionRealUnit(usdc);
  const toSwap = numUsdc.div(2);

  const check = await tradeModuleSC.isWhitelisted(settoken, otherAddress);
  if (!check) {
    tx = await tradeModuleSC.addToWhitelist(settoken, [otherAddress]);
    console.log(tx.hash);
    await tx.wait();
  }

  const tradeModuleSC2 = await getSC('TradeModuleV2', tradeModule, signer2);
  const uniswapV3ExchangeAdapterV3SC2 = await getSC('UniswapV3ExchangeAdapterV3', uniswapV3ExchangeAdapterV3, signer2);
  let paths = [usdc, wsteth];
  let fees = ['100'];
  let calldata = await uniswapV3ExchangeAdapterV3SC2.generateDataParam(paths, fees, true);
  console.log('trade..');
  tx = await tradeModuleSC2.trade(
    settoken,
    'UniswapV3ExchangeAdapterV3',
    paths[0],
    toSwap.toString(),
    paths[1],
    '1',
    calldata
  );
  console.log(tx.hash);
  await tx.wait();
  console.log('done!');

}

// npx hardhat run --network tenderlyfork scripts/07_test_whitelist.js

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
