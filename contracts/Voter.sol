// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voter {
    // aadhar number -> fingerPrint
    struct voterDetails {
        uint32 age;
        address accountAddress;
        bool isExist;
    }
    mapping(uint256 => voterDetails) private voter;
    uint32 public minimumAge;

    constructor(uint32 _minimumAge) {
        minimumAge = _minimumAge;
    }

    modifier verifyBiometrics() {
        // to be implement in future work
        _;
    }

    function addVoter(uint256 uuid, uint32 age) public {
        require(!voter[uuid].isExist, "voter already exist");
        require(age >= minimumAge, "you are underage");
        // verify from government server and then add voter
        voter[uuid].age = age;
        voter[uuid].accountAddress = msg.sender;
        voter[uuid].isExist = true;
    }

    modifier onlyVoter(uint256 _aadharNumber) {
        require(isVoter(_aadharNumber), "action allowed to voter only");
        _;
    }

    function isVoter(uint256 _aadharNumber) public view returns (bool) {
        if (!voter[_aadharNumber].isExist) return false;
        return true;
    }

    function getUser(uint256 uuid) public view returns (voterDetails memory) {
        return voter[uuid];
    }
}
