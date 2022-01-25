import { ethers, waffle } from 'hardhat';

import { expect } from 'chai';

const { deployContract } = waffle;

// xdescribe('Greeter', function () {
//   it("Should return the new greeting once it's changed", async function () {
//     const Greeter = await ethers.getContractFactory('Greeter');
//     const greeter = await Greeter.deploy('Hello, world!');

//     await greeter.deployed();
//     expect(await greeter.greet()).to.equal('Hello, world!');

//     await greeter.setGreeting('Hola, mundo!');
//     expect(await greeter.greet()).to.equal('Hola, mundo!');
//   });
// });

describe('YourCollectible', function () {
  it("Should return the new greeting once it's changed", async function () {
    // deployContract(ethers.getSigners());
  });

  xit("Should return the new greeting once it's changed", async function () {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);

    console.log('Account balance:', (await deployer.getBalance()).toString());

    const YourCollectible = await ethers.getContractFactory('YourCollectible');
    const ycb = await YourCollectible.deploy();

    await ycb.deployed();
    // console.log(ycb);
    expect.anything();
  });
});

export {};
