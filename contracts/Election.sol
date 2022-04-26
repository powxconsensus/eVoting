// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Voter.sol";

// import "./ECA.sol" as ECA;
contract Election {
    enum STAGE {
        CANDITATE_REGISTRATION,
        VOTING,
        TALLYING,
        WINNER_DECLARATION
    }
    Voter voterInstance;
    struct Candidate {
        string candidateName;
        string partyName;
        uint256 voteCount;
        uint256 id;
    }
    struct votes {
        uint256 candidateId;
        bool isVoted;
        bool isExist;
    }
    STAGE public stage;
    uint256 candidatesCount;
    mapping(uint256 => Candidate) public Candidates;
    mapping(uint256 => votes) private voters;
    uint256[] votersUUID;
    address hostedBy;
    uint32 minimumAge;

    constructor(uint32 _minimumAge, address voterInstanceAddress) {
        minimumAge = _minimumAge;
        voterInstance = Voter(voterInstanceAddress);
        hostedBy = msg.sender;
        stage = STAGE.CANDITATE_REGISTRATION;
    }

    modifier onlyVoter(uint256 uuid) {
        require(voterInstance.isVoter(uuid), "register first to vote");
        _;
    }
    modifier verfiyAge(uint256 uuid) {
        require(
            voterInstance.getUser(uuid).age >= minimumAge,
            "you are under age to vote in this election"
        );
        _;
    }

    // only by eca here
    function addCandidate(string memory candidateName, string memory partyName)
        public
    {
        require(
            stage == STAGE.CANDITATE_REGISTRATION,
            "candidate registration is over"
        );
        Candidates[candidatesCount].candidateName = candidateName;
        Candidates[candidatesCount].partyName = partyName;
        Candidates[candidatesCount].id = candidatesCount;
        Candidates[candidatesCount].voteCount = 0;
        candidatesCount++;
    }

    /*
        return all candidates list
    */
    function getCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory candidatesList = new Candidate[](candidatesCount);
        for (uint256 i = 0; i < candidatesCount; i++) {
            candidatesList[i] = Candidates[i];
        }
        return candidatesList;
    }

    function updateStage() public {
        require(stage < STAGE.WINNER_DECLARATION, "voting is at last stage");
        if (stage == STAGE.CANDITATE_REGISTRATION) stage = STAGE.VOTING;
        else if (stage == STAGE.VOTING) stage = STAGE.TALLYING;
        else stage = STAGE.WINNER_DECLARATION;
    }

    function vote(uint256 _candidate, uint256 uuid)
        public
        onlyVoter(uuid)
        verfiyAge(uuid)
    {
        if (stage == STAGE.CANDITATE_REGISTRATION)
            revert("voting is not yet startd");
        if (stage != STAGE.VOTING) revert("voting is over");
        require(!voters[uuid].isVoted, "Voter has already Voted!");
        require(
            _candidate < candidatesCount && _candidate >= 0,
            "Invalid candidate to Vote!"
        );
        voters[uuid].candidateId = _candidate;
        voters[uuid].isVoted = true;
        votersUUID.push(uuid);
    }

    /*
        this function will be use if we use concept of secret key for voters, 
        vote can only be decrypt if user reveals secret key
    */
    function tallyVote() public {
        require(stage == STAGE.TALLYING, "tallying is not yet startd");
        for (uint256 i = 0; i < votersUUID.length; i++) {
            Candidates[voters[votersUUID[i]].candidateId].voteCount++;
        }
    }

    function declareWinner() public view returns (Candidate memory) {
        require(stage == STAGE.WINNER_DECLARATION, "tallying is not done yet");
        uint256 winnerId = 0;
        uint256 maxVoteCount = 0;
        for (uint256 i = 0; i < candidatesCount; i++) {
            if (Candidates[i].voteCount > maxVoteCount) {
                maxVoteCount = Candidates[i].voteCount;
                winnerId = i;
            }
        }
        return Candidates[winnerId];
    }

    function myVote(uint256 uuid)
        public
        view
        onlyVoter(uuid)
        returns (uint256)
    {
        require(
            stage == STAGE.WINNER_DECLARATION,
            "verifying can only be done voting phase is over"
        );
        require(voters[uuid].isVoted, "you have not voted to any candidate");
        return voters[uuid].candidateId;
    }
}
