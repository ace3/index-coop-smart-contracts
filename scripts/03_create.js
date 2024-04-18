require('dotenv').config();
const { ethers, upgrades } = require("hardhat");
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

  // SetTokenCreator
  // params:
  // components [usdc,weth]
  // units [1000000,0]
  // modules [m1,m2,m3,m4]
  // manager deployer
  // name
  // symbol
  let tx = await setTokenCreatorSC.create(
    [usdc],
    ['1000000'],
    [basicIssuanceModule, tradeModule, streamingFeeModule, customOracleNavIssuanceModule],
    deployer,
    "Strategy ETH 1",
    "TS1"
  );

  console.log('setTokenCreator.create: ', tx.hash);
  await tx.wait();

  const tokenSets = await controllerSC.getSets();
  const TS1 = tokenSets[tokenSets.length - 1];
  await save('TS1', TS1);

  // BasicIssuanceModule
  // init
  tx = await basicIssuanceModuleSC.initialize(TS1, zeroAddress);
  console.log('basicIssuanceModuleSC.initialize' + tx.hash);
  await tx.wait();

  // Streaming Fee Module
  // init
  // struct FeeState {
  //   address feeRecipient;                   // Address to accrue fees to
  //   uint256 maxStreamingFeePercentage;      // Max streaming fee maanager commits to using (1% = 1e16, 100% = 1e18)
  //   uint256 streamingFeePercentage;         // Percent of Set accruing to manager annually (1% = 1e16, 100% = 1e18)
  //   uint256 lastStreamingFeeTimestamp;      // Timestamp last streaming fee was accrued
  // }
  const feeState = [
    deployer,
    '25000000000000000', 
    '25000000000000000', 
    '0'];
  tx = await streamingFeeModuleSC.initialize(TS1, feeState);
  console.log('streamingFeeModuleSC.initialize' + tx.hash);
  await tx.wait();

  // NAV Issuance Module
  // init
  // struct NavIssuanceSettings {
  //   INavIssuanceHook managerIssuanceHook;          // Issuance hook configurations
  //   INavIssuanceHook managerRedemptionHook;        // Redemption hook configurations
  //   ISetValuer setValuer;                          // Optional custom set valuer. If address(0) is provided, fetch the default one from the controller
  //   address[] reserveAssets;                       // Allowed reserve assets - Must have a price enabled with the price oracle
  //   address feeRecipient;                          // Manager fee recipient
  //   uint256[2] managerFees;                        // Manager fees. 0 index is issue and 1 index is redeem fee (0.01% = 1e14, 1% = 1e16)
  //   uint256 maxManagerFee;                         // Maximum fee manager is allowed to set for issue and redeem
  //   uint256 premiumPercentage;                     // Premium percentage (0.01% = 1e14, 1% = 1e16). This premium is a buffer around oracle
  //                                                  // prices paid by user to the SetToken, which prevents arbitrage and oracle front running
  //   uint256 maxPremiumPercentage;                  // Maximum premium percentage manager is allowed to set (configured by manager)
  //   uint256 minSetTokenSupply;                     // Minimum SetToken supply required for issuance and redemption
  //                                                  // to prevent dramatic inflationary changes to the SetToken's position multiplier
  // }
  const navISettings = [
    zeroAddress,
    zeroAddress, 
    zeroAddress, 
    [usdc],
    deployer,
    ["10000000000000000","20000000000000000"],
    "100000000000000000",
    "10000000000000000",
    "100000000000000000",
    "10000000000000000000"
  ];
  tx = await customOracleNavIssuanceModuleSC.initialize(
    TS1,
    navISettings
  )
  console.log('customOracleNavIssuanceModuleSC.initialize' + tx.hash);
  await tx.wait();

  let public = await customOracleNavIssuanceModuleSC.isPublic(TS1);
  console.log('public: ' + public);
  if (!public) {
    tx = await customOracleNavIssuanceModuleSC.togglePublicAccess(TS1);
    await tx.wait()
    console.log(tx.hash);
  }


  // Trade Module
  // init
  tx = await tradeModuleSC.initialize(TS1);
  console.log('tradeModuleSC.initialize' + tx.hash);
  await tx.wait();

  // BasicIssuanceModule
  // issue

  // NAV Issuance Module
  // getExpectedSetTokenIssueQuantity
  // approve and issue


  // Trade module trade preparation:
  // adapter.generateDataParam
  // trade module.trade

}

// npx hardhat compile
// npx hardhat run --network fork scripts/deploy.js

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
