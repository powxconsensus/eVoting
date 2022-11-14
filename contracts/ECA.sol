// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Election.sol";
import "./Voting.sol";

contract ECA {
    address voter_instance_address;
    // ECA related storage
    struct eca_details {
        uint256 idx;
        bool is_exist;
    }

    address[] eca_members;
    mapping(address => eca_details) eca;
    uint256 public totalECA = 0;

    enum REQUEST_TYPE {
        ADD,
        REMOVE,
        TRANSFER
    }
    struct eca_request {
        address by;
        address who;
        string memo;
        REQUEST_TYPE of_type;
        address voting_address;
    }
    mapping(uint256 => eca_request) requests_mp;
    mapping(address => uint256) request_mp_idx;
    uint256 public total_requests = 0;

    // election related storage
    address[] public Elections;

    constructor(uint32 min_age) {
        eca_members.push(msg.sender);
        eca_details storage eca_detail = eca[msg.sender];
        eca_detail.idx = totalECA;
        eca_detail.is_exist = true;
        totalECA++;
        Voter new_v_i = new Voter(min_age, address(this));
        voter_instance_address = address(new_v_i);
    }

    // modifier to check same as isECA() function
    modifier onlyECA() {
        require(isECA(msg.sender), "only accessible to eca");
        _;
    }

    // this function is check if transaction sender is eca or not
    function isECA(address _eca) public view returns (bool) {
        return eca[_eca].is_exist;
    }

    // any eca
    function requestToECA(
        address who_or_to,
        string memory memo,
        REQUEST_TYPE request_type
    ) public onlyECA {
        if (request_type == REQUEST_TYPE.ADD) {
            require(!eca[who_or_to].is_exist, "eca already exist");
            require(
                requests_mp[request_mp_idx[who_or_to]].who != who_or_to,
                "already in request queue"
            );
        }
        if (request_type == REQUEST_TYPE.REMOVE) {
            require(eca[who_or_to].is_exist, "eca not exist");
            require(
                requests_mp[request_mp_idx[who_or_to]].who != who_or_to,
                "already in request queue"
            );
        }
        if (request_type == REQUEST_TYPE.TRANSFER)
            require(eca[who_or_to].is_exist, "who_or_to is already eca");

        eca_request storage new_request = requests_mp[total_requests++];
        new_request.who = who_or_to;
        new_request.by = msg.sender;
        new_request.of_type = request_type;
        new_request.memo = memo;
        Voting new_voting = new Voting(eca_members, memo, 100, 95);
        new_request.voting_address = address(new_voting);
        request_mp_idx[who_or_to] = total_requests - 1;

        // TODO:: emit event
    }

    /*
        this function is use to add eca from system,
        addition of eca will only be valid if 90% voted for the eca otherwise not.
    */
    function declareECARequestResult(uint256 request_id) public onlyECA {
        require(request_id < total_requests, "invalid request_id");
        eca_request memory request = requests_mp[request_id];
        require(
            request.of_type == REQUEST_TYPE.ADD ||
                request.of_type == REQUEST_TYPE.REMOVE ||
                request.of_type == REQUEST_TYPE.TRANSFER,
            "request is not valid"
        );
        Voting voting_instance = Voting(request.voting_address);
        voting_instance.end_voting();
        require(voting_instance.end_result(), "didn't get min vote");
        if (request.of_type == REQUEST_TYPE.ADD) {
            eca_details storage new_eca = eca[request.who];
            new_eca.idx = totalECA++;
            new_eca.is_exist = true;
            // TODO:: emit event, eca added
        } else if (request.of_type == REQUEST_TYPE.REMOVE) {
            eca_members[eca[request.who].idx] = eca_members[totalECA - 1];
            delete eca_members[totalECA - 1];
            delete eca[request.who];
            totalECA--;
            // TODO:: emit event, eca removed
        } else if (request.of_type == REQUEST_TYPE.TRANSFER) {
            // TODO:: emit event, eca ownership transfer
        }

        // removed request
        total_requests--;
        requests_mp[request_mp_idx[request.who]] = requests_mp[total_requests];
        request_mp_idx[request.who] = 0;
        delete requests_mp[total_requests];
    }

    function getRequestById(uint256 request_id)
        public
        view
        returns (eca_request memory)
    {
        require(request_id < total_requests, "invalid request id!");
        return requests_mp[request_id];
    }

    // give all requests as array
    function getAllRequests() public view returns (eca_request[] memory) {
        eca_request[] memory all_request = new eca_request[](total_requests);
        for (uint256 i = 0; i < total_requests; i++)
            all_request[i] = requests_mp[i];
        return all_request;
    }

    /*
        this function is use to create new election and
        new deployed election contract address will be stored in Election array
    */
    function createElection(
        uint32 minimumAge,
        bool is_restricted_to_area,
        uint256 area_code
    ) public onlyECA {
        Election newElection = new Election(
            minimumAge,
            voter_instance_address,
            is_restricted_to_area,
            area_code,
            address(this)
        );
        Elections.push(address(newElection));
    }
}
