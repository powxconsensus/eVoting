const ethers = require("ethers");
const Election = artifacts.require("./Election.sol");
const Voter = artifacts.require("./Voter.sol");
const ECA = artifacts.require("./ECA.sol");
const chai = require("./setupchai");
const assert = require("assert");
const { equal } = require("assert");
const { resolve } = require("path");
const exp = require("constants");
const BN = web3.utils.BN;

const expect = chai.expect;

contract("Election", (accounts) => {
  const min_age = 18;
  const is_res_to = true;
  const area_code = 404;
  let voter_instance, eca_instance;

  beforeEach(async () => {
    eca_instance = await ECA.new(min_age);
    voter_instance = await Voter.new(min_age, eca_instance.address);
    this.myECA = await Election.new(
      min_age,
      voter_instance.address,
      is_res_to,
      area_code,
      eca_instance.address
    );
  });

  const registerUser = ({ name, address, area_code, mbno, age }) => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          await voter_instance.applyApplication(
            name,
            address,
            area_code,
            mbno,
            age
          );
          resolve();
        } catch (err) {
          reject(err.message);
        }
      })();
    });
  };
  const addCandidate = ({ address, party_name, election_instance }) => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          await election_instance.addCandidate(address, party_name);
          resolve();
        } catch (err) {
          reject(err.message);
        }
      })();
    });
  };
  it("election", async () => {
    console.log("ECA is deployed at address ", eca_instance.address);
    console.log("Voter is deployed at address ", voter_instance.address);
    let city = "Chittoor",
      state = "AP",
      country = "India";
    console.log(`Adding area Code ${area_code}...`);
    await expect(voter_instance.add_area_code(area_code, city, state, country))
      .to.eventually.be.fulfilled;
    console.log({
      message: `area successfully added!!`,
      area_code,
      city,
      state,
      country,
    });
    console.log("Registering 2 Voter via ECA");
    const users = [
      {
        name: "Chinmay",
        address: accounts[1],
        area_code: 404,
        mbno: "+919452123433",
        age: 20,
      },
      {
        name: "Priyanshu",
        address: accounts[2],
        area_code: 404,
        mbno: "+919452183284",
        age: 20,
      },
    ];
    await registerUser(users[0]);
    console.log({
      ...users[0],
      message: `${users[0].address} is added successfully`,
    });
    await registerUser(users[1]);
    console.log({
      ...users[1],
      message: `${users[1].address} is added successfully`,
    });
    await expect(registerUser({ ...users[0], area_code: 405 })).to.eventually.be
      .rejected; // area code not exists
    console.log("---------------------------------------------------");
    console.log(
      "ECA and Voter is set up, along with user registration. Let's start election!!"
    );

    await expect(eca_instance.createElection(min_age, is_res_to, area_code)).to
      .eventually.be.fulfilled;

    const election_address = await eca_instance.Elections(0);
    console.log(
      `Election is been deployed at ${election_address} by eca ${accounts[0]}`
    );
    const election_instance = await Election.at(election_address);
    let status = (await election_instance.stage()).toNumber();
    console.log("Status is ", status, " (Candidate registration)!!");
    console.log("Let's add two candidate in deployed election.");
    const candidates = [
      {
        address: accounts[accounts.length - 1],
        party_name: "XYZ",
      },
      {
        address: accounts[accounts.length - 1],
        party_name: "ABC",
      },
    ];
    await Promise.all(
      candidates.map(async (candidate, idx) => {
        await expect(addCandidate({ ...candidate, election_instance })).to
          .eventually.be.fulfilled;
        console.log({
          ...candidate,
          message: `candidate with address ${candidate.address} is added successfully!!`,
        });
      })
    );
    await expect(election_instance.updateState()).to.eventually.be.fulfilled;
    await expect(election_instance.stage()).to.eventually.be.a.bignumber.equal(
      new BN(1)
    );
    console.log(
      "Now, election status is updated by ECA from Candidate Registration -> Voting (Voters can vote now!!)"
    );
    console.log("User is voting (without reveling identity using zksnarks)");
    // let param1 = 0 + users[0].address;
    let param1 = ethers.utils.solidityPack(
      ["uint256", "address"],
      [0, users[0].address]
    );
    await expect(
      election_instance.vote(web3.utils.keccak256(param1), {
        from: users[0].address,
      })
    ).to.eventually.be.fulfilled;
    console.log("User 1 voted successfully!!");
    // let param2 = 0 + users[1].address;
    let param2 = ethers.utils.solidityPack(
      ["uint256", "address"],
      [0, users[1].address]
    );
    await expect(
      election_instance.vote(web3.utils.keccak256(param2), {
        from: users[1].address,
      })
    ).to.eventually.be.fulfilled;
    console.log("User 2 voted successfully!!");
    console.log("All user voted or time ups!!");
    await expect(election_instance.updateState()).to.eventually.be.fulfilled;

    await expect(election_instance.stage()).to.eventually.be.a.bignumber.equal(
      new BN(2)
    );
    console.log(
      "Now, election status is updated by ECA from Voting Phase -> Revealing (Voting phase is over!!)"
    );
    await expect(
      election_instance.revealVote(0, {
        from: users[0].address,
      })
    ).to.eventually.be.fulfilled;

    console.log("Vote Reveal for user 1 success!!");

    await expect(
      election_instance.revealVote(0, {
        from: users[1].address,
      })
    ).to.eventually.be.fulfilled;

    console.log("Vote Reveal for user 2 success!!");

    await expect(election_instance.updateState()).to.eventually.be.fulfilled;

    await expect(election_instance.stage()).to.eventually.be.a.bignumber.equal(
      new BN(3)
    );
    console.log(
      "Now, election status is updated by ECA from Revealing Phase -> Tallying (Revealing phase is over!!)"
    );
    await expect(election_instance.tallyVote()).to.eventually.be.fulfilled;
    await expect(election_instance.updateState()).to.eventually.be.fulfilled;
    await expect(election_instance.stage()).to.eventually.be.a.bignumber.equal(
      new BN(4)
    );
    console.log(
      "Tallying is completed successfully and status is changed from Tallying -> Declare Winner State by ECA!!"
    );
    await expect(election_instance.declareWinner()).to.eventually.be.fulfilled;
    const winner = await election_instance.declareWinner();
    assert.equal(winner.user_address, candidates[0].address);
    console.log(
      "Winner for the current election is candidate with address ",
      winner.user_address,
      winner.voteCount
    );
  });
});
