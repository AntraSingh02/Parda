// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ForceSender {
    constructor() payable {}

    function forceSend(address payable recipient) external {
        selfdestruct(recipient);
    }
}
