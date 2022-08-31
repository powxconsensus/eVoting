// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ECA.sol";

contract Voter {
    struct area_details {
        string state;
        string city;
        string country;
        uint256 idx;
        bool is_exist;
    }
    mapping(uint256 => area_details) area_code_mp;
    uint256[] area_code_list;
    uint256 public total_area_code = 0;

    address eca_address;

    // application data
    uint256 public min_verfication_needed = 2;
    struct user_details {
        string name;
        string mbno;
        uint256 age;
        address user_address;
        uint256 verify_cnt;
        address[] verifies_by;
        uint256 idx;
        bool is_exist;
        uint256 area_code;
        bool is_verfied;
    }
    mapping(address => user_details) user_app;
    address[] app_list;
    uint256 public total_user_app = 0;

    // user data
    mapping(address => user_details) private voter;
    uint32 public minimum_age;

    constructor(uint32 _minimum_age, address _eca_address) {
        minimum_age = _minimum_age;
        eca_address = _eca_address;
    }

    modifier onlyECA() {
        require(ECA(eca_address).isECA(msg.sender), "not an eca!");
        _;
    }

    function add_area_code(
        uint256 area_code,
        string memory city,
        string memory state,
        string memory country
    ) public onlyECA {
        require(!area_code_mp[area_code].is_exist, "area code already exist!");
        area_details storage area_detail = area_code_mp[area_code];
        area_detail.state = state;
        area_detail.city = city;
        area_detail.is_exist = true;
        area_detail.country = country;
        area_detail.idx = total_area_code;
        area_code_list.push(area_code);
        total_area_code++;
    }

    function get_area_details(uint256 area_code)
        public
        view
        returns (area_details memory)
    {
        require(area_code_mp[area_code].is_exist, "invalid area code!");
        return area_code_mp[area_code];
    }

    function get_area_list() public view returns (area_details[] memory) {
        area_details[] memory area_list = new area_details[](total_user_app);
        for (uint256 i = 0; i < total_user_app; i++)
            area_list[i] = area_code_mp[area_code_list[i]];
        return area_list;
    }

    modifier verifyBiometrics() {
        // to be implement in future work
        _;
    }

    function applyApplication(
        string memory name,
        address user_address,
        uint256 area_code,
        string memory mbno,
        uint256 age
    ) public onlyECA {
        require(
            !user_app[user_address].is_exist,
            "user application already exist!"
        );
        require(!voter[user_address].is_exist, "user already exist!");
        require(age >= minimum_age, "not a valid age");
        require(area_code_mp[area_code].is_exist, "invalid area code!");
        user_details storage new_user_app = user_app[user_address];
        new_user_app.name = name;
        new_user_app.area_code = area_code;
        new_user_app.user_address = user_address;
        new_user_app.mbno = mbno;
        new_user_app.age = age;
        new_user_app.is_exist = true;
        new_user_app.idx = total_user_app;
        app_list.push(user_address);
        total_user_app++;
    }

    function reviewApplicationAndFinaliza(uint256 application_id)
        public
        onlyECA
    {
        require(application_id < total_user_app, "invalid application number!");
        user_details storage app = user_app[app_list[application_id]];
        require(!app.is_verfied, "already verified");
        app.verifies_by.push(msg.sender);
        app.verify_cnt++;
        if (app.verify_cnt >= min_verfication_needed) {
            app.is_verfied = true;
            voter[app.user_address] = app;
            user_app[app_list[total_user_app - 1]].idx = app.idx;
            app_list[app.idx] = app_list[total_user_app - 1];
            delete app_list[total_user_app - 1];
            total_user_app--;
            delete user_app[app.user_address];
        }
    }

    function getUser(address user_address)
        public
        view
        returns (user_details memory)
    {
        return voter[user_address];
    }

    function get_app_list() public view returns (user_details[] memory) {
        user_details[] memory app_list_data = new user_details[](
            total_user_app
        );
        for (uint256 i = 0; i < total_user_app; i++)
            app_list_data[i] = user_app[app_list[i]];
        return app_list_data;
    }
}
