pragma solidity >=0.8.0 <0.9.0;
// SPDX-License-Identifier: MIT
import 'hardhat/console.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './YourToken.sol';

contract Vendor is Ownable {
  YourToken yourToken;

  uint256 public constant tokensPerEth = 100;

  event BuyTokens(address buyer, uint256 amountOfEth, uint256 amountOfTokens);

  constructor(address tokenAddress) {
    yourToken = YourToken(tokenAddress);
  }

  function buyTokens() public payable {
    require(msg.value > 0, 'You need put some value on that.');
    require(tokensPerEth > 0, 'Tokens per Eth need be higher than zero.');

    uint256 amountOfEth = msg.value;
    uint256 amountOfTokens = amountOfEth * tokensPerEth;
    bool transfered = yourToken.transfer(msg.sender, amountOfTokens);
    if (transfered) {
      emit BuyTokens(msg.sender, amountOfEth, amountOfTokens);
    }
  }

  // ToDo: create a withdraw() function that lets the owner withdraw ETH
  function withdraw() public onlyOwner {
    uint256 balance = address(this).balance;
    console.log('Vendor balance is %s tokens', balance);
    require(balance > 0, 'Withdraw not have enough balance');

    (bool sent, ) = owner().call{value: balance}('');
    require(sent, 'Withdraw failed');
  }

  function sellTokens(uint256 amount) public {
    yourToken.transferFrom(msg.sender, address(this), amount);
    (bool sent, ) = msg.sender.call{value: amount / tokensPerEth}('');
    require(sent, 'sellTokens failed');
  }
}
