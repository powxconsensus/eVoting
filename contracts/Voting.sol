// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct vote_detail {
        bool is_in_favor;
        bool is_exist;
        bool is_voted;
    }
    mapping(address => vote_detail) voter;
    bool status;
    uint256 public min_voting_percent;
    uint256 public min_vote_percent;
    address owner;
    uint256 favor = 0;
    uint256 total_vote = 0;
    uint256 total_voter = 0;
    string public memo;
    uint256 public voting_started_at;
    bool public end_result;

    constructor(
        address[] memory _voter,
        string memory _memo,
        uint256 _min_voting_percent,
        uint256 _min_vote_percent
    ) {
        require(
            _min_vote_percent > 0 &&
                _min_vote_percent <= 100 &&
                _min_voting_percent > 0 &&
                _min_voting_percent <= 100,
            "percent should be in range of (0,100]"
        );
        require(_voter.length > 0, "min one voter required");
        for (uint256 i = 0; i < _voter.length; i++) {
            vote_detail storage new_voter = voter[msg.sender];
            total_voter++;
            new_voter.is_exist = true;
        }
        min_voting_percent = _min_voting_percent;
        memo = _memo;
        owner = msg.sender;
        voting_started_at = block.timestamp;
        min_vote_percent = _min_vote_percent;
        status = true;
        end_result = false;
    }

    function vote(bool is_in_favor) public {
        require(!voter[msg.sender].is_voted && status, "already voted");
        voter[msg.sender].is_voted = true;
        voter[msg.sender].is_in_favor = is_in_favor;
        if (is_in_favor) favor++;
        total_vote++;
    }

    function end_voting() public {
        require(msg.sender == owner, "only owner");
        require(status, "already ended");
        require(
            total_vote * 100 >= total_voter * min_voting_percent,
            "minimum voter percentage not reached"
        );
        status = false;
        if (favor * 100 >= total_vote * min_vote_percent) end_result = true;
    }

    function result()
        public
        view
        returns (
            bool voting_result,
            uint256 in_favor,
            uint256 not_in_favour
        )
    {
        return (end_result, favor, total_vote - favor);
    }
}
