// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./Election.sol";

contract ECA {
    mapping(address => bool) private eca;
    address[] public Elections;

    constructor(address[] memory _ecaAccounts) {
        for (uint256 i = 0; i < _ecaAccounts.length; i++) {
            eca[_ecaAccounts[i]] = true;
        }
        eca[msg.sender] = true;
    }

    // modifier to check same as isECA() function
    modifier onlyECA() {
        require(isECA(msg.sender), "only accessible to eca");
        _;
    }

    // this function is check if transaction sender is eca or not
    function isECA(address _eca) public view returns (bool) {
        return eca[_eca];
    }

    /*
        this function is use to remove eca from system,
        remover of eca will only be valid if 85% voted against it otherwise not.
    */
    function removeECA(address _ecaAddress) public onlyECA {
        delete eca[_ecaAddress];
    }

    /*
        this function is use to add eca from system,
        addition of eca will only be valid if 90% voted for the eca otherwise not.
    */
    function addECA(address _eca) public onlyECA {
        eca[_eca] = true;
    }

    /*
        this function is use to transfer eca ownership to other.
        ownership transfer only be valid if 90% voted for the migration otherwise not.
    */
    function ecaTransferTO(address _to) public onlyECA {
        eca[_to] = true;
        delete eca[msg.sender];
    }

    /*
        this function is use to create new election and
        new deployed election contract address will be stored in Election array
    */
    function createElection(uint32 minimumAge, address voterInstance)
        public
        onlyECA
    {
        Election newElection = new Election(minimumAge, voterInstance);
        Elections.push(address(newElection));
    }
}
