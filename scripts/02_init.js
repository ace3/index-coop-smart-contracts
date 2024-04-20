require('dotenv').config();
const { ethers, upgrades } = require("hardhat");
const jsonfile = require('jsonfile');
const file = 'address.json';
let data = jsonfile.readFileSync(file);
if (!data) throw new Error('address.json not found !!');
console.dir(data);

async function getSC(scName, scAddr) {
  const SC = await ethers.getContractFactory(scName);
  const sc = await SC.attach(scAddr);
  return sc;
}

async function main() {
  // arbitrum data
  const { weth, usdc, wsteth, usdc_usdc_oracle, weth_usdc_oracle, wsteth_usdc_oracle, router, deployer } = data;
  const { controller, integrationRegistry, setTokenCreator, setValuer, priceOracle } = data;
  const { basicIssuanceModule, tradeModule, streamingFeeModule, customOracleNavIssuanceModule } = data;
  const { uniswapV3ExchangeAdapterV3 } = data;

  const controllerSC = await getSC('Controller', controller);
  const integrationRegistrySC = await getSC('IntegrationRegistry', integrationRegistry);
  const setTokenCreatorSC = await getSC('SetTokenCreator', setTokenCreator);
  const setValuerSC = await getSC('SetValuer', setValuer);
  const priceOracleSC = await getSC('PriceOracle', priceOracle);

  const basicIssuanceModuleSC = await getSC('BasicIssuanceModule', basicIssuanceModule);
  const tradeModuleSC = await getSC('TradeModuleV2', tradeModule);
  const streamingFeeModuleSC = await getSC('StreamingFeeModule', streamingFeeModule);
  const customOracleNavIssuanceModuleSC = await getSC('CustomOracleNavIssuanceModule', customOracleNavIssuanceModule);

  const uniswapV3ExchangeAdapterV3SC = await getSC('UniswapV3ExchangeAdapterV3', uniswapV3ExchangeAdapterV3);

  // initialization
  let tx = await controllerSC.initialize(
    [setTokenCreator],
    [],
    [integrationRegistry, priceOracle, setValuer],
    [0, 1, 2]
  );
  console.log('controllerSC.initialize: ' + tx.hash);
  await tx.wait();

  // register modules to controller
  // controller.addModule
  let modules = [basicIssuanceModule, tradeModule, streamingFeeModule, customOracleNavIssuanceModule];
  for (let i = 0; i < modules.length; i++) {
    tx = await controllerSC.addModule(modules[i]);
    console.log(tx.hash);
    await tx.wait();
  }

  // add adapter integration
  // IntegrationRegistry.addIntegration
  // params:
  // module: Trade Module 
  // name: UniswapV3ExchangeAdapter
  // adapter: adapter.address
  tx = await integrationRegistrySC.addIntegration(
    tradeModule,
    'UniswapV3ExchangeAdapterV3',
    uniswapV3ExchangeAdapterV3
  );
  console.log('integrationRegistrySC.addIntegration: ' + tx.hash);
  await tx.wait();

  // PriceOracle setup
  // PriceOracle.addPair
  // usdc oracle
  // weth oracle
  // wsteth oracle
  let pairs = [
    { p1: usdc, p2: usdc, oracle: usdc_usdc_oracle },
    { p1: weth, p2: usdc, oracle: weth_usdc_oracle },
    { p1: wsteth, p2: usdc, oracle: wsteth_usdc_oracle }
  ];
  for (let i = 0; i < pairs.length; i++) {
    const { p1, p2, oracle } = pairs[i];
    tx = await priceOracleSC.addPair(p1, p2, oracle);
    console.log(tx.hash);
    await tx.wait();
  }

  // SetTokenCreator
  // params:
  // components [usdc,weth]
  // units [1000000,0]
  // modules [m1,m2,m3,m4]
  // manager deployer
  // name TONE
  // symbol TONE

  // BasicIssuanceModule
  // init by settoken
  // issue

  // Streaming Fee Module
  // init

  // NAV Issuance Module
  // init
  // getExpectedSetTokenIssueQuantity
  // approve and issue

  // Trade Module
  // init

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
