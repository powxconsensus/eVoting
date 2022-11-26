const ethers = require("ethers");
const Election = artifacts.require("./Election.sol");
const Voter = artifacts.require("./Voter.sol");
const ECA = artifacts.require("./ECA.sol");
const chai = require("./setupchai");
const assert = require("assert");
const { equal } = require("assert");
const { resolve } = require("path");
const exp = require("constants");
const { type } = require("os");
const BN = web3.utils.BN;

const expect = chai.expect;

contract("Election", (accounts) => {
  const min_age = 18;
  const is_res_to = true;
  const area_code = 404;
  let voter_instance, eca_instance;
  console.log(accounts.length);

  let Users = [
    {
      name: "afje",
      address: accounts[0],
      area_code: 404,
      mbno: "+916678987656",
      age: 20,
    },
    {
      name: "Chinmay",
      address: accounts[1],
      area_code: 404,
      mbno: "+919452123433",
      age: 20,
    },
    {
      name: "Srijanee",
      address: accounts[2],
      area_code: 404,
      mbno: "+919860349223",
      age: 28,
    },
    {
      name: "Priyanshu",
      address: accounts[3],
      area_code: 404,
      mbno: "+919452183284",
      age: 20,
    },
    {
      name: "Muzakir",
      address: accounts[4],
      area_code: 404,
      mbno: "+917652183284",
      age: 20,
    },
    {
      name: "Laukik",
      address: accounts[5],
      area_code: 404,
      mbno: "+916652183284",
      age: 20,
    },
    {
      name: "lmgk",
      address: accounts[6],
      area_code: 404,
      mbno: "+912353455433",
      age: 20,
    },
    {
      name: "oppor",
      address: accounts[7],
      area_code: 404,
      mbno: "+919234234223",
      age: 28,
    },
    {
      name: "zxcdsk",
      address: accounts[8],
      area_code: 404,
      mbno: "+919436378484",
      age: 20,
    },
    {
      name: "bfghnu",
      address: accounts[9],
      area_code: 404,
      mbno: "+901675897684",
      age: 20,
    },
    {
      name: "afje",
      address: accounts[10],
      area_code: 404,
      mbno: "+916678987656",
      age: 20,
    },
    {
      name: "Chinmay",
      address: accounts[11],
      area_code: 404,
      mbno: "+919452123433",
      age: 20,
    },
    {
      name: "Srijanee",
      address: accounts[12],
      area_code: 404,
      mbno: "+919860349223",
      age: 28,
    },
    {
      name: "Priyanshu",
      address: accounts[13],
      area_code: 404,
      mbno: "+919452183284",
      age: 20,
    },
    {
      name: "Muzakir",
      address: accounts[14],
      area_code: 404,
      mbno: "+917652183284",
      age: 20,
    },
  ];

  // for (let i = 1; i <= Users.length; i += 1) {
  //   Users[i - 1].accounts = accounts[i];
  // }
  // console.log(Users);

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
    console.log(`Registering ${Users.length} Voter via ECA`);

    const users = Users;

    for (let i = 0; i < users.length; i += 1) {
      await registerUser(users[i]);
      console.log({
        ...users[i],
        message: `${users[i].address} is added successfully`,
      });
    }

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
    console.log(
      "User is voting (without revealing identity using Commit-Reveal)"
    );
    // let param1 = 0 + users[0].address;

    let param = [
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[0].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[1].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[2].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[3].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[4].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[5].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[6].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[7].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[8].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[9].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[10].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[11].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[12].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[13].address]
        ),
      },
      {
        ballot: ethers.utils.solidityPack(
          ["uint256", "address"],
          [0, users[14].address]
        ),
      },
    ];

    // let param1 = ethers.utils.solidityPack(
    //   ["uint256", "address"],
    //   [0, users[0].address]
    // );

    // console.log(param);

    for (let i = 0; i < users.length; i += 1) {
      await expect(
        election_instance.vote(web3.utils.keccak256(param[i].ballot), {
          from: users[i].address,
        })
      ).to.eventually.be.fulfilled;
      console.log(`User ${i + 1} voted successfully!!`);
    }

    // await expect(
    //   election_instance.vote(web3.utils.keccak256(param1), {
    //     from: users[0].address,
    //   })
    // ).to.eventually.be.fulfilled;
    // console.log("User 1 voted successfully!!");
    // let param2 = 0 + users[1].address;
    // let param2 = ethers.utils.solidityPack(
    //   ["uint256", "address"],
    //   [0, users[1].address]
    // );
    // await expect(
    //   election_instance.vote(web3.utils.keccak256(param2), {
    //     from: users[1].address,
    //   })
    // ).to.eventually.be.fulfilled;
    // console.log("User 2 voted successfully!!");
    // let param3 = ethers.utils.solidityPack(
    //   ["uint256", "address"],
    //   [0, users[2].address]
    // );
    // await expect(
    //   election_instance.vote(web3.utils.keccak256(param3), {
    //     from: users[2].address,
    //   })
    // ).to.eventually.be.fulfilled;
    // console.log("User 3 voted successfully!!");

    console.log("All user voted or time ups!!");

    await expect(election_instance.updateState()).to.eventually.be.fulfilled;

    await expect(election_instance.stage()).to.eventually.be.a.bignumber.equal(
      new BN(2)
    );
    console.log(
      "Now, election status is updated by ECA from Voting Phase -> Revealing (Voting phase is over!!)"
    );

    for (let i = 0; i < users.length; i += 1) {
      await expect(
        election_instance.revealVote(0, {
          from: users[i].address,
        })
      ).to.eventually.be.fulfilled;

      console.log(`Vote Reveal for user ${i} success!!`);
    }

    // await expect(
    //   election_instance.revealVote(0, {
    //     from: users[0].address,
    //   })
    // ).to.eventually.be.fulfilled;

    // console.log("Vote Reveal for user 1 success!!");

    // await expect(
    //   election_instance.revealVote(0, {
    //     from: users[1].address,
    //   })
    // ).to.eventually.be.fulfilled;

    // console.log("Vote Reveal for user 2 success!!");

    // await expect(
    //   election_instance.revealVote(0, {
    //     from: users[2].address,
    //   })
    // ).to.eventually.be.fulfilled;

    // console.log("Vote Reveal for user 3 success!!");
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
