// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Voter.sol";

contract Election {
    enum STAGE {
        CANDIDATE_REGISTRATION,
        VOTING,
        REVEAL,
        TALLYING,
        WINNER_DECLARATION
    }

    address voters_instance;
    address eca_address;
    struct Candidate {
        string partyName;
        uint256 voteCount;
        address user_address;
    }

    struct Commit {
        bytes32 vote_commit;
    }

    struct votes {
        uint32 candidateId;
    }

    STAGE public stage;
    uint256 candidatesCount;
    mapping(uint256 => Candidate) public Candidates;
    mapping(address => Commit) private voters;
    mapping(uint256 => votes) private valid_votes;
    mapping(address => bool) is_voted;
    uint256 total_vote = 0;
    address hostedBy;
    uint32 minimum_age;
    bool is_restricted_to_area = false;
    uint256 area_code;

    constructor(
        uint32 _minimum_age,
        address voter_instance_address,
        bool _is_restricted_to_area,
        uint256 _area_code,
        address _eca_address
    ) {
        minimum_age = _minimum_age;
        voters_instance = voter_instance_address;
        is_restricted_to_area = _is_restricted_to_area;
        hostedBy = msg.sender;
        area_code = _area_code;
        stage = STAGE.CANDIDATE_REGISTRATION;
        eca_address = _eca_address;
    }

    modifier onlyECA() {
        require(ECA(eca_address).isECA(msg.sender), "not an eca!");
        _;
    }

    modifier only_valid_voter() {
        if (is_restricted_to_area) _;
    }

    function addCandidate(address user_address, string memory partyName)
        public
        onlyECA
    {
        require(
            stage == STAGE.CANDIDATE_REGISTRATION,
            "candidate registration is over"
        );
        Candidates[candidatesCount].partyName = partyName;
        Candidates[candidatesCount].user_address = user_address;
        Candidates[candidatesCount].voteCount = 0;
        candidatesCount++;
    }

    /*
        return all candidates list
    */
    function getCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory candidatesList = new Candidate[](candidatesCount);
        for (uint256 i = 0; i < candidatesCount; i++)
            candidatesList[i] = Candidates[i];
        return candidatesList;
    }

    function updateState() public {
        require(stage < STAGE.WINNER_DECLARATION, "voting is at last stage");
        if (stage == STAGE.CANDIDATE_REGISTRATION) stage = STAGE.VOTING;
        else if (stage == STAGE.VOTING) stage = STAGE.REVEAL;
        else if (stage == STAGE.REVEAL) stage = STAGE.TALLYING;
        else stage = STAGE.WINNER_DECLARATION;
    }

    function vote(bytes32 _vote) public only_valid_voter {
        if (stage == STAGE.CANDIDATE_REGISTRATION)
            revert("voting is not yet started");
        if (stage != STAGE.VOTING) revert("voting is over");
        require(!is_voted[msg.sender], "Voter has already Voted!");
        Commit storage new_commit = voters[msg.sender];
        new_commit.vote_commit = _vote;
        is_voted[msg.sender] = true;
    }

    /*
        This function takes in candidate id that voter voted for and 
        compares its keccak to the vote submited during voting stage by the voter
    */

    function revealVote(uint32 _candidateId) public only_valid_voter {
        if (stage == STAGE.CANDIDATE_REGISTRATION || stage == STAGE.VOTING)
            revert("reveal stage has not yet started");
        if (stage != STAGE.REVEAL) revert("Reveal stage is over");
        require(is_voted[msg.sender], "Voter has not voted during Voting!");
        if (
            keccak256(
                abi.encodePacked(uint256(_candidateId), address(msg.sender))
            ) == voters[msg.sender].vote_commit
        ) {
            votes storage current_vote = valid_votes[total_vote++];
            current_vote.candidateId = _candidateId;
        } else {
            revert("failed");
        }

        // else say not correct input; try again.
    }

    /*
        this function will be use if we use concept of secret key for voters, 
        vote can only be decrypt if user reveals secret key
    */
    function tallyVote() public {
        require(stage == STAGE.TALLYING, "tallying is not yet startd");
        for (uint256 i = 0; i < total_vote; i++) {
            Candidates[valid_votes[i].candidateId].voteCount++;
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

    /*
        since count-reveal automatically verifies the vote there is no need to generate a new proof!!
    */

    // proof to generate, if user voted the correct candidate or not
    // function myVote()
    //     public
    //     view
    //     only_valid_voter
    //     returns (uint256)
    // {
    //     require(
    //         stage == STAGE.WINNER_DECLARATION,
    //         "verifying can only be done voting phase is over"
    //     );
    //     require(
    //         voters[vote_order_id].is_voted,
    //         "you have not voted to any candidate"
    //     );
    //     return voters[vote_order_id].candidateId;
    // }
}
