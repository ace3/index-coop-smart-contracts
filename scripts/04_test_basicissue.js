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
  // impersonate account that have 40k usdc & enough eth
  // const userAddress = '0x52A258ED593C793251a89bfd36caE158EE9fC4F8'; // whale
  // await network.provider.request({
  //   method: "hardhat_impersonateAccount",
  //   params: [userAddress],
  // });

  // signer = await ethers.getSigner(userAddress);

  // use tenderly to have much eth & usdc
  const accounts = await ethers.getSigners();
  const signer = accounts[0];
  const userAddress = signer.address;

  const { weth, usdc, wsteth, usdc_usdc_oracle, weth_usdc_oracle, wsteth_usdc_oracle, router, deployer } = data;
  const { controller, integrationRegistry, setTokenCreator, setValuer, priceOracle } = data;
  const { basicIssuanceModule, tradeModule, streamingFeeModule, customOracleNavIssuanceModule } = data;
  const { uniswapV3ExchangeAdapterV3 } = data;
  const { TS1 } = data;

  const usdcSC = await getSC('ERC20', usdc, signer);

  // arbitrum data
  // load address..

  // load contracts..
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

  const userUsdc = await usdcSC.balanceOf(await signer.getAddress());
  console.log('user usdc: ' + userUsdc.toString());
  let result;

  // basicIssuanceModuleSC.test
  result = await basicIssuanceModuleSC.getRequiredComponentUnitsForIssue(TS1, '100' + zero18);
  console.log(result);
  console.log(result[1][0].toString());

  // tx = await usdcSC.approve(basicIssuanceModule, MAX_UINT);
  // console.log(tx.hash);
  // await tx.wait();

  // pay 100 usdc to issue 100 ts1
  tx = await basicIssuanceModuleSC.issue(TS1, '100' + zero18, userAddress);
  console.log(tx.hash);
  await tx.wait();


}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
