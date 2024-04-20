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

  const { weth, usdc, wsteth, usdc_usdc_oracle, weth_usdc_oracle, wsteth_usdc_oracle, router, deployer } = data;
  const { controller, integrationRegistry, setTokenCreator, setValuer, priceOracle } = data;
  const { basicIssuanceModule, tradeModule, streamingFeeModule, customOracleNavIssuanceModule } = data;
  const { uniswapV3ExchangeAdapterV3 } = data;
  const { TS1 } = data;

  const usdcSC = await getSC('ERC20', usdc, signer);
  const wethSC = await getSC('ERC20', weth, signer);
  const ts1SC = await getSC('SetToken', TS1, signer);

  const numUsdc = await ts1SC.getDefaultPositionRealUnit(usdc);
  const numWeth = await ts1SC.getDefaultPositionRealUnit(weth);
  const numUsdc2 = await ts1SC.getTotalComponentRealUnits(usdc);
  const numWeth2 = await ts1SC.getTotalComponentRealUnits(weth);
  const usdcTs1 = await usdcSC.balanceOf(TS1);
  const wethTs1 = await wethSC.balanceOf(TS1);

  const toSwap = numUsdc; // .div(2);
  console.log('num: ');
  console.log({ 
    numUsdc: wei2usdc(numUsdc), 
    numWeth: wei2eth(numWeth),
    numUsdc2: wei2usdc(numUsdc2), 
    numWeth2: wei2eth(numWeth2),
    usdcTs1: wei2usdc(usdcTs1),
    wethTs1: wei2eth(wethTs1)
  });
  return;
  // arbitrum data
  // load address..
  // load contracts..

  const controllerSC = await getSC('Controller', controller, signer);
  const integrationRegistrySC = await getSC('IntegrationRegistry', integrationRegistry, signer);
  const setTokenCreatorSC = await getSC('SetTokenCreator', setTokenCreator, signer);
  const setValuerSC = await getSC('SetValuer', setValuer, signer);
  const priceOracleSC = await getSC('PriceOracle', priceOracle, signer);
  const basicIssuanceModuleSC = await getSC('BasicIssuanceModule', basicIssuanceModule, signer);
  const tradeModuleSC = await getSC('TradeModule', tradeModule, signer);
  const streamingFeeModuleSC = await getSC('StreamingFeeModule', streamingFeeModule, signer);
  const customOracleNavIssuanceModuleSC = await getSC('CustomOracleNavIssuanceModule', customOracleNavIssuanceModule, signer);
  const uniswapV3ExchangeAdapterV3SC = await getSC('UniswapV3ExchangeAdapterV3', uniswapV3ExchangeAdapterV3, signer);

  // trade test - must be done by manager
  console.log('generateDataParam..');
  let paths = [usdc, weth];
  let fees = ['100'];
  console.log({ paths, fees });
  let calldata = await uniswapV3ExchangeAdapterV3SC.generateDataParam(paths, fees, true);

  console.log(calldata);
  /**
     * Executes a trade on a supported DEX. Only callable by the SetToken's manager.
     * @dev Although the SetToken units are passed in for the send and receive quantities, the total quantity
     * sent and received is the quantity of SetToken units multiplied by the SetToken totalSupply.
     *
     * @param _setToken             Instance of the SetToken to trade
     * @param _exchangeName         Human readable name of the exchange in the integrations registry
     * @param _sendToken            Address of the token to be sent to the exchange
     * @param _sendQuantity         Units of token in SetToken sent to the exchange
     * @param _receiveToken         Address of the token that will be received from the exchange
     * @param _minReceiveQuantity   Min units of token in SetToken to be received from the exchange
     * @param _data                 Arbitrary bytes to be used to construct trade call data
     */
  tx = await tradeModuleSC.trade(
    TS1,
    'UniswapV3ExchangeAdapterV3',
    usdc,
    toSwap.toString(),
    weth,
    '1',
    calldata
  );
}

// npx hardhat run --network tenderlyfork scripts/06_test_trade.js

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
