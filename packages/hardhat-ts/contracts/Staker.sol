pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import './ExampleExternalContract.sol';

contract Staker {
  ExampleExternalContract public exampleExternalContract;

  mapping(address => uint256) public balances;

  uint256 public constant threshold = 1 ether;

  uint256 public deadline = block.timestamp + 60 seconds;

  bool public openForWithdraw = false;

  event Stake(address who, uint256 amount);

  constructor(address exampleExternalContractAddress) {
    exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
  }

  // Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
  //  ( make sure to add a `Stake(address,uint256)` event and emit it for the frontend <List/> display )
  function stake() public payable {
    balances[msg.sender] += msg.value;
    emit Stake(msg.sender, msg.value);
  }

  // After some `deadline` allow anyone to call an `execute()` function
  //  It should either call `exampleExternalContract.complete{value: address(this).balance}()` to send all the value
  function execute() public {
    require(block.timestamp >= deadline, 'Need wait dealine expire to execute');

    uint256 stakerBalance = address(this).balance;

    if (stakerBalance > threshold) {
      exampleExternalContract.complete{value: stakerBalance}();
    } else {
      openForWithdraw = true;
    }
  }

  // if the `threshold` was not met, allow everyone to call a `withdraw()` function
  function withdraw(address payable _to) public {
    require(block.timestamp >= deadline, 'Need wait reach deadline to withdraw');
    require(openForWithdraw, 'We cannot withdraw,need execute first.');

    uint256 stakerBalance = address(this).balance;

    (bool success, ) = _to.call{value: stakerBalance}('');

    require(success, 'Failed to withdraw ETH to address');

    balances[msg.sender] = 0;
  }

  // Add a `timeLeft()` view function that returns the time left before the deadline for the frontend
  function timeLeft() public view returns (uint256 remainTimeLeft) {
    if (block.timestamp > deadline) {
      return 0;
    }
    remainTimeLeft = deadline - block.timestamp;
  }

  // Add the `receive()` special function that receives eth and calls stake()
  receive() external payable {
    stake();
  }
}
