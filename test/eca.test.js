const ECA = artifacts.require("./ECA.sol");
const Voting = artifacts.require("./Voting.sol");
const chai = require("./setupchai");
const assert = require("assert");
const { equal } = require("assert");
const BN = web3.utils.BN;

const expect = chai.expect;

contract("ECA", (accounts) => {
  const min_age = 18;
  beforeEach(async () => {
    this.myECA = await ECA.new(18);
  });

  it("ECA Deployment", async () => {
    const instance = this.myECA;
    await expect(instance.isECA(accounts[0])).to.eventually.be.equal(true);
    await expect(instance.totalECA()).to.eventually.be.a.bignumber.equal(
      new BN(1)
    );
  });
  it("ECA additon and finalization", async () => {
    const instance = this.myECA;
    await expect(
      instance.requestToECA(accounts[1], "referring him for eca role", 0)
    ).to.eventually.be.fulfilled;
    await expect(instance.total_requests()).to.eventually.be.a.bignumber.equal(
      new BN(1)
    );
    const voting_ins_add = (await instance.getRequestById(0)).voting_address;
    // vote on the motion, either in against or in favor
    const voting_instance = new Voting(voting_ins_add);
    await expect(instance.declareECARequestResult(0)).to.eventually.be.rejected;
    await expect(voting_instance.vote(true)).to.eventually.be.fulfilled;
    await expect(instance.declareECARequestResult(0)).to.eventually.be
      .fulfilled;
    await expect(instance.isECA(accounts[1])).to.eventually.be.equal(true);
    await expect(instance.totalECA()).to.eventually.be.a.bignumber.equal(
      new BN(2)
    );
  });
});

// await expect(instance.transfer(accounts[1], sendTokens)).to.eventually.be
//       .fulfilled;
//     await expect(
//       instance.balanceOf(accounts[0])
//     ).to.eventually.be.a.bignumber.equal(totalSupply.sub(new BN(sendTokens)));

// await expect(instance.transfer(accounts[1], new BN(balanceOfDeployer + 1)))
// .to.eventually.be.rejected;
