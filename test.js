var Web3 = require("web3");
var provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
var web3 = new Web3(provider);

const {
  abi: ecaABI,
  bytecode: ecaBytecode,
} = require("./client/src/contracts/ECA.json");

const {
  abi: voterABI,
  bytecode: voterBytecode,
} = require("./client/src/contracts/Voter.json");

const {
  abi: electionABI,
  bytecode: electionBytecode,
} = require("./client/src/contracts/Election.json");

const deploy = async ({ account, abi, arguments, bytecode }) => {
  return new Promise((resolve, reject) => {
    try {
      (async () => {
        const result = await new web3.eth.Contract(abi)
          .deploy({
            data: bytecode,
            arguments,
          })
          .send({ from: account, gas: 6000000 });
        resolve(result);
      })();
    } catch (err) {
      reject(err);
    }
  });
};

const main = async () => {
  const accounts = await web3.eth.getAccounts();
  const eca = accounts[0];
  await Promise.all(
    accounts.map(async (acc) => {
      await web3.eth.personal.unlockAccount(acc);
    })
  );

  ///////////////////////////////////////// deployment
  const eca_instance = await deploy({
    arguments: [18],
    abi: ecaABI,
    bytecode: ecaBytecode,
    account: eca,
  });
  const voter_instance = await deploy({
    arguments: [18, eca_instance._address],
    abi: voterABI,
    bytecode: voterBytecode,
    account: eca,
  });

  // function
  const registerUser = ({ name, address, area_code, mbno, age }) => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const gas = await voter_instance.methods
            .applyApplication(name, address, area_code, mbno, age)
            .estimateGas();
          await voter_instance.methods
            .applyApplication(name, address, area_code, mbno, age)
            .send({
              from: eca,
              gas,
            });
          resolve();
        } catch (err) {
          reject(err.message);
        }
      })();
    });
  };

  const addCandidate = ({ address, party_name }) => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const gas = await election_instance.methods
            .addCandidate(address, party_name)
            .estimateGas();
          await election_instance.methods
            .addCandidate(address, party_name)
            .send({ from: eca, gas });
          resolve();
        } catch (err) {
          reject(err.message);
        }
      })();
    });
  };

  const min_age = 18,
    is_res_to = true,
    area_code = 404;
  /////////////////////////////////////////

  console.log("ECA is deployed at address ", eca_instance._address);
  console.log("Voter is deployed at address ", voter_instance._address);
  let city = "Chittoor",
    state = "AP",
    country = "India";
  console.log(`Adding area Code ${area_code}...`);

  let gas = await voter_instance.methods
    .add_area_code(area_code, city, state, country)
    .estimateGas();
  await voter_instance.methods
    .add_area_code(area_code, city, state, country)
    .send({ from: eca, gas });
  console.log({
    message: `area successfully added!!`,
    area_code,
    city,
    state,
    country,
  });
  console.log(`Registering ${accounts.length} Voter via ECA`);
  const users = [];
  accounts.map((address, idx) => {
    users.push({
      name: "voter" + idx,
      address,
      area_code,
      mbno: "+916678987656",
      age: 20,
    });
  });
  await Promise.all(
    users.map(async (user) => {
      await registerUser(user);
      console.log({
        ...user,
        message: `${user.address} is added successfully`,
      });
    })
  );

  console.log("---------------------------------------------------");
  console.log(
    "ECA and Voter is set up, along with user registration. Let's start election!!"
  );

  gas = await eca_instance.methods
    .createElection(min_age, is_res_to, area_code)
    .estimateGas();
  await eca_instance.methods
    .createElection(min_age, is_res_to, area_code)
    .send({ from: eca, gas });

  const election_address = await eca_instance.methods.Elections(0).call();
  console.log(`Election is been deployed at ${election_address} by eca ${eca}`);

  const election_instance = await new web3.eth.Contract(
    electionABI,
    election_address
  );
  let status = await election_instance.methods.stage().call();
  console.log(status);
  console.log("Current status is Candidate registration!!");
  console.log("Let's add two candidate in deployed election.");

  const candidates = [];

  await Promise.all(
    ["Party1", "Party2"].map(async (party_name) => {
      const acc = await web3.eth.accounts.create();
      candidates.push({
        address: acc.address,
        party_name,
      });
    })
  );

  await Promise.all(
    candidates.map(async (candidate, idx) => {
      await addCandidate({ ...candidate });
      console.log({
        ...candidate,
        message: `candidate with address ${candidate.address} is added successfully!!`,
      });
    })
  );
  gas = await election_instance.methods.updateState().estimateGas();
  await election_instance.methods.updateState().send({ from: eca, gas });
  console.log(
    "Now, election status is updated by ECA from Candidate Registration -> Voting (Voters can vote now!!)"
  );

  console.log(
    "User is voting (without revealing identity using Commit-Reveal)"
  );
  const votemp = {};
  await Promise.all(
    users.map(async (user, idx) => {
      // const vote = Math.floor(Math.random() * candidates.length);
      const commit = await web3.eth.abi.encodeParameters(
        ["uint256", "address"],
        [0, user.address]
      );
      votemp[user.address] = 0; // random
      const hashedCommitment = await web3.utils.keccak256(commit);
      const gas = await election_instance.methods
        .vote(hashedCommitment)
        .estimateGas();
      await election_instance.methods
        .vote(hashedCommitment)
        .send({ from: user.address, gas });

      console.log(`User ${idx + 1} voted successfully!!`);
    })
  );

  console.log("All user voted or time ups!!");
  gas = await election_instance.methods.updateState().estimateGas();
  await election_instance.methods.updateState().send({ from: eca, gas });
  console.log(
    "Now, election status is updated by ECA from Voting Phase -> Revealing (Voting phase is over!!)"
  );

  await Promise.all(
    users.map(async (user, idx) => {
      //   console.log(votemp[user.address]);

      const gas = await election_instance.methods
        .revealVote(votemp[user.address])
        .estimateGas();
      await election_instance.methods
        .revealVote(votemp[user.address])
        .send({ from: user.address, gas });

      console.log(`Vote Reveal for user ${idx} success!!`);
    })
  );

  gas = await election_instance.methods.updateState().estimateGas();
  await election_instance.methods.updateState().send({ from: eca, gas });
  console.log(
    "Now, election status is updated by ECA from Revealing Phase -> Tallying (Revealing phase is over!!)"
  );
  gas = await election_instance.methods.tallyVote().estimateGas();
  await election_instance.methods.tallyVote().send({ from: eca, gas });

  gas = await election_instance.methods.updateState().estimateGas();
  await election_instance.methods.updateState().send({ from: eca, gas });
  console.log(
    "Tallying is completed successfully and status is changed from Tallying -> Declare Winner State by ECA!!"
  );

  const winner = await election_instance.methods
    .declareWinner()
    .call({ from: eca });

  console.log(
    "Winner for the current election is candidate with address ",
    winner.user_address,
    winner.voteCount
  );
};

main();
