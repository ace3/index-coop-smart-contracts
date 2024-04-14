/*
    Copyright 2020 Set Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

    SPDX-License-Identifier: Apache License, Version 2.0
*/

pragma solidity 0.6.10;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";



/**
 * @title ChainlinkOracleAdapter
 * @author Set Protocol
 *
 * Coerces outputs from Chainlink oracles to uint256 and adapts value to 18 decimals.
 */
contract ChainlinkWstethOracleAdapter {
    using SafeMath for uint256;

    /* ============ Constants ============ */
    uint256 public constant PRICE_MULTIPLIER = 1e10;

    /* ============ State Variables ============ */
    address private ethPriceFeedArbitrum =
        0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612;
    // This one is 18 digit precision
    address private wstEthToEthPriceFeedArbitrum =
        0xb523AE262D20A936BC152e6023996e46FDC2A95D;

    /* ============ Constructor ============ */
    /*
     * Set address of aggregator being adapted for use
     *
     * @param  _oracle    The address of medianizer being adapted from bytes to uint256
     */
    constructor(
        
    )
        public
    {

    }

    /* ============ External ============ */

    /*
     * Reads value of oracle and coerces return to uint256 then applies price multiplier
     *
     * @returns         Chainlink oracle price in uint256
     */
    function read()
        external
        view
        returns (uint256)
    {


        AggregatorV3Interface wstEthToEth = AggregatorV3Interface(
            wstEthToEthPriceFeedArbitrum
        );
        // 18 digit
        int256 priceWst = wstEthToEth.latestAnswer();

        AggregatorV3Interface ethToUsd = AggregatorV3Interface(
            ethPriceFeedArbitrum
        );

        int256 priceEth = ethToUsd.latestAnswer();

        int256 price = (priceWst * priceEth) / 1e18;
        uint256 oracleOutput = uint256(price);

        // Apply multiplier to create 18 decimal price (since Chainlink returns 8 decimals)
        return oracleOutput.mul(PRICE_MULTIPLIER);
    }
}

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestAnswer() external view returns (int256);
}
