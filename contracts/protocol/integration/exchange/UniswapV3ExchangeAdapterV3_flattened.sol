// SPDX-License-Identifier: Apache License, Version 2.0
// File: contracts/interfaces/external/ISwapRouter02.sol


pragma solidity 0.6.10;
pragma experimental ABIEncoderV2;

interface ISwapRouter02 {
    struct IncreaseLiquidityParams {
        address token0;
        address token1;
        uint256 tokenId;
        uint256 amount0Min;
        uint256 amount1Min;
    }

    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
    }

    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactOutputParams {
        bytes path;
        address recipient;
        uint256 amountOut;
        uint256 amountInMaximum;
    }

    struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }

    function WETH9() external view returns (address);
    function approveMax(address token) external payable;
    function approveMaxMinusOne(address token) external payable;
    function approveZeroThenMax(address token) external payable;
    function approveZeroThenMaxMinusOne(address token) external payable;
    function callPositionManager(bytes memory data) external payable returns (bytes memory result);
    function checkOracleSlippage(
        bytes[] memory paths,
        uint128[] memory amounts,
        uint24 maximumTickDivergence,
        uint32 secondsAgo
    ) external view;
    function checkOracleSlippage(bytes memory path, uint24 maximumTickDivergence, uint32 secondsAgo) external view;
    function exactInput(ExactInputParams memory params) external payable returns (uint256 amountOut);
    function exactInputSingle(ExactInputSingleParams memory params) external payable returns (uint256 amountOut);
    function exactOutput(ExactOutputParams memory params) external payable returns (uint256 amountIn);
    function exactOutputSingle(ExactOutputSingleParams memory params) external payable returns (uint256 amountIn);
    function factory() external view returns (address);
    function factoryV2() external view returns (address);
    function getApprovalType(address token, uint256 amount) external returns (uint8);
    function increaseLiquidity(IncreaseLiquidityParams memory params) external payable returns (bytes memory result);
    function mint(MintParams memory params) external payable returns (bytes memory result);
    function multicall(bytes32 previousBlockhash, bytes[] memory data) external payable returns (bytes[] memory);
    function multicall(uint256 deadline, bytes[] memory data) external payable returns (bytes[] memory);
    function multicall(bytes[] memory data) external payable returns (bytes[] memory results);
    function positionManager() external view returns (address);
    function pull(address token, uint256 value) external payable;
    function refundETH() external payable;
    function selfPermit(address token, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        external
        payable;
    function selfPermitAllowed(address token, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)
        external
        payable;
    function selfPermitAllowedIfNecessary(address token, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)
        external
        payable;
    function selfPermitIfNecessary(address token, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
        external
        payable;
    function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] memory path, address to)
        external
        payable
        returns (uint256 amountOut);
    function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] memory path, address to)
        external
        payable
        returns (uint256 amountIn);
    function sweepToken(address token, uint256 amountMinimum, address recipient) external payable;
    function sweepToken(address token, uint256 amountMinimum) external payable;
    function sweepTokenWithFee(address token, uint256 amountMinimum, uint256 feeBips, address feeRecipient)
        external
        payable;
    function sweepTokenWithFee(
        address token,
        uint256 amountMinimum,
        address recipient,
        uint256 feeBips,
        address feeRecipient
    ) external payable;
    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes memory _data) external;
    function unwrapWETH9(uint256 amountMinimum, address recipient) external payable;
    function unwrapWETH9(uint256 amountMinimum) external payable;
    function unwrapWETH9WithFee(uint256 amountMinimum, address recipient, uint256 feeBips, address feeRecipient)
        external
        payable;
    function unwrapWETH9WithFee(uint256 amountMinimum, uint256 feeBips, address feeRecipient) external payable;
    function wrapETH(uint256 value) external payable;
}


// File: external/contracts/uniswap/v3/lib/BytesLib.sol


/*
 * @title Solidity Bytes Arrays Utils
 * @author Gonçalo Sá <goncalo.sa@consensys.net>
 *
 * @dev Bytes tightly packed arrays utility library for ethereum contracts written in Solidity.
 *      The library lets you concatenate, slice and type cast bytes arrays both in memory and storage.
 */
pragma solidity 0.6.10;

library BytesLib {
    function slice(
        bytes memory _bytes,
        uint256 _start,
        uint256 _length
    ) internal pure returns (bytes memory) {
        require(_length + 31 >= _length, "slice_overflow");
        require(_start + _length >= _start, "slice_overflow");
        require(_bytes.length >= _start + _length, "slice_outOfBounds");

        bytes memory tempBytes;

        assembly {
            switch iszero(_length)
                case 0 {
                    // Get a location of some free memory and store it in tempBytes as
                    // Solidity does for memory variables.
                    tempBytes := mload(0x40)

                    // The first word of the slice result is potentially a partial
                    // word read from the original array. To read it, we calculate
                    // the length of that partial word and start copying that many
                    // bytes into the array. The first word we copy will start with
                    // data we don't care about, but the last `lengthmod` bytes will
                    // land at the beginning of the contents of the new array. When
                    // we're done copying, we overwrite the full first word with
                    // the actual length of the slice.
                    let lengthmod := and(_length, 31)

                    // The multiplication in the next line is necessary
                    // because when slicing multiples of 32 bytes (lengthmod == 0)
                    // the following copy loop was copying the origin's length
                    // and then ending prematurely not copying everything it should.
                    let mc := add(add(tempBytes, lengthmod), mul(0x20, iszero(lengthmod)))
                    let end := add(mc, _length)

                    for {
                        // The multiplication in the next line has the same exact purpose
                        // as the one above.
                        let cc := add(add(add(_bytes, lengthmod), mul(0x20, iszero(lengthmod))), _start)
                    } lt(mc, end) {
                        mc := add(mc, 0x20)
                        cc := add(cc, 0x20)
                    } {
                        mstore(mc, mload(cc))
                    }

                    mstore(tempBytes, _length)

                    //update free-memory pointer
                    //allocating the array padded to 32 bytes like the compiler does now
                    mstore(0x40, and(add(mc, 31), not(31)))
                }
                //if we want a zero-length slice let's just return a zero-length array
                default {
                    tempBytes := mload(0x40)
                    //zero out the 32 bytes slice we are about to return
                    //we need to do it because Solidity does not garbage collect
                    mstore(tempBytes, 0)

                    mstore(0x40, add(tempBytes, 0x20))
                }
        }

        return tempBytes;
    }

    function toAddress(bytes memory _bytes, uint256 _start) internal pure returns (address) {
        require(_start + 20 >= _start, "toAddress_overflow");
        require(_bytes.length >= _start + 20, "toAddress_outOfBounds");
        address tempAddress;

        assembly {
            tempAddress := div(mload(add(add(_bytes, 0x20), _start)), 0x1000000000000000000000000)
        }

        return tempAddress;
    }

    function toUint24(bytes memory _bytes, uint256 _start) internal pure returns (uint24) {
        require(_start + 3 >= _start, "toUint24_overflow");
        require(_bytes.length >= _start + 3, "toUint24_outOfBounds");
        uint24 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x3), _start))
        }

        return tempUint;
    }
}
// File: contracts/lib/BytesArrayUtils.sol

/*
    Copyright 2022 Set Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

    
*/

pragma solidity 0.6.10;

/**
 * @title BytesArrayUtils
 * @author Set Protocol
 *
 * Utility library to type cast bytes arrays. Extends BytesLib (external/contracts/uniswap/v3/lib/BytesLib.sol)
 * library functionality.
 */
library BytesArrayUtils {

    /**
     * Type cast byte to boolean.
     * @param _bytes        Bytes array
     * @param _start        Starting index
     * @return bool        Boolean value
     */
    function toBool(bytes memory _bytes, uint256 _start) internal pure returns (bool) {
        require(_start + 1 >= _start, "toBool_overflow");
        require(_bytes.length >= _start + 1, "toBool_outOfBounds");
        uint8 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x1), _start))
        }

        require(tempUint <= 1, "Invalid bool data");     // Should be either 0 or 1

        return (tempUint == 0) ? false : true;
    }
}
// File: contracts/protocol/integration/exchange/UniswapV3ExchangeAdapterV3.sol

/*
    Copyright 2023 Index Coop

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

    
*/

pragma solidity 0.6.10;



/**
 * @title UniswapV3ExchangeAdapterV3
 * @author Index Coop
 *
 * Exchange adapter for Uniswap V3 SwapRouter02 that encodes trade data. Supports multi-hop trades.
 *
 * CHANGE LOG:
 * - Generalized ability to choose whether to swap an exact amount of source token for a min amount of
 * receive token or swap a max amount of source token for an exact amount of receive token.
 */
contract UniswapV3ExchangeAdapterV3 {

    using BytesLib for bytes;
    using BytesArrayUtils for bytes;

    /* ============ State Variables ============ */

    // Address of Uniswap V3 SwapRouter contract
    address public immutable swapRouter;

    /* ============ Constructor ============ */

    /**
     * Set state variables
     *
     * @param _swapRouter    Address of Uniswap V3 SwapRouter
     */
    constructor(address _swapRouter) public {
        swapRouter = _swapRouter;
    }

    /* ============ External Getter Functions ============ */

    /**
     * Return calldata for Uniswap V3 SwapRouter
     *
     * @param  _sourceToken              Address of source token to be sold
     * @param  _destinationToken         Address of destination token to buy
     * @param  _destinationAddress       Address that assets should be transferred to
     * @param  _sourceQuantity           Fixed/Max amount of source token to sell
     * @param  _destinationQuantity      Min/Fixed amount of destination token to buy
     * @param  _data                     Bytes containing trade path and bool to determine function string.
     *                                   Equals the output of the generateDataParam function
     *                                   NOTE: Path for `exactOutput` swaps are reversed
     *
     * @return address                   Target contract address
     * @return uint256                   Call value
     * @return bytes                     Trade calldata
     */
    function getTradeCalldata(
        address _sourceToken,
        address _destinationToken,
        address _destinationAddress,
        uint256 _sourceQuantity,
        uint256 _destinationQuantity,
        bytes calldata _data
    )
        external
        view
        returns (address, uint256, bytes memory)
    {
        // For a single hop trade, `_data.length` is 44. 20 source/destination token address + 3 fees +
        // 20 source/destination token address + 1 fixInput bool.
        // For multi-hop trades, `_data.length` is greater than 44.
        require(_data.length >= 44, "Invalid data");

        bool fixInput = _data.toBool(_data.length - 1);        // `fixInput` bool is stored at last byte

        address sourceFromPath;
        address destinationFromPath;

        if (fixInput) {
            sourceFromPath = _data.toAddress(0);
            destinationFromPath = _data.toAddress(_data.length - 21);
        } else {
            // Path for exactOutput swaps are reversed
            sourceFromPath = _data.toAddress(_data.length - 21);
            destinationFromPath = _data.toAddress(0);
        }

        require(_sourceToken == sourceFromPath, "Source token path mismatch");
        require(_destinationToken == destinationFromPath, "Destination token path mismatch");

        bytes memory pathData = _data.slice(0, _data.length - 1);       // Extract path data from `_data`

        bytes memory callData = fixInput
            ? abi.encodeWithSelector(
                ISwapRouter02.exactInput.selector,
                ISwapRouter02.ExactInputParams(
                    pathData,
                    _destinationAddress,
                    _sourceQuantity,
                    _destinationQuantity
                )
            )
            : abi.encodeWithSelector(
                ISwapRouter02.exactOutput.selector,
                ISwapRouter02.ExactOutputParams(
                    pathData,
                    _destinationAddress,
                    _destinationQuantity,       // swapped vs exactInputParams
                    _sourceQuantity
                )
            );

        return (swapRouter, 0, callData);
    }

    /**
     * Returns the address to approve source tokens to for trading. This is the Uniswap SwapRouter address
     *
     * @return address             Address of the contract to approve tokens to
     */
    function getSpender() external view returns (address) {
        return swapRouter;
    }

    /**
     * Returns the appropriate _data argument for getTradeCalldata. Equal to the encodePacked path with the
     * fee of each hop between it and fixInput bool at the very end., e.g [token1, fee1, token2, fee2, token3, fixIn].
     * Note: _fees.length == _path.length - 1
     *
     * @param _path array of addresses to use as the path for the trade
     * @param _fees array of uint24 representing the pool fee to use for each hop
     * @param _fixIn Boolean indicating if input amount is fixed
     *
     * @return bytes  Bytes containing trade path and bool to determine function string.
     */
    function generateDataParam(
        address[] calldata _path,
        uint24[] calldata _fees,
        bool _fixIn
    ) external pure returns (bytes memory) {
        bytes memory data = "";
        for (uint256 i = 0; i < _path.length - 1; i++) {
            data = abi.encodePacked(data, _path[i], _fees[i]);
        }

        // Last encode has no fee associated with it since _fees.length == _path.length - 1
        data = abi.encodePacked(data, _path[_path.length - 1]);

        // Encode fixIn
        return abi.encodePacked(data, _fixIn);
    }
}
