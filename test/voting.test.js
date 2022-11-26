// const Voting = artifacts.require("./Voting.sol");
// const Voter = artifacts.require("./Voter.sol");
// const ECA = artifacts.require("./ECA.sol");
// const chai = require("./setupchai");
// const assert = require("assert");
// const { equal } = require("assert");
// const BN = web3.utils.BN;

// const expect = chai.expect;

// contract("Voting", (accounts) => {
//   const min_age = 18;
//   const is_res_to = true;
//   const area_code = 404;
//   let voter_instance, eca_instance;

//   beforeEach(async () => {
//     eca_instance = await ECA.new(min_age);
//     voter_instance = await Voter.new(min_age, eca_instance.address);

//     this.myECA = await Voting.new(
//       min_age,
//       voter_instance.address,
//       is_res_to,
//       area_code,
//       eca_instance.address
//     );
//   });
//   it("voting deployment", () => {
//     console.log("dslmsdlml,");
//   });
// });

// // await expect(instance.transfer(accounts[1], sendTokens)).to.eventually.be
// //   .fulfilled;
// // await expect(
// //   instance.balanceOf(accounts[0])
// // ).to.eventually.be.a.bignumber.equal(totalSupply.sub(new BN(sendTokens)));

// // await expect(instance.transfer(accounts[1], new BN(balanceOfDeployer + 1))).to
// //   .eventually.be.rejected;
