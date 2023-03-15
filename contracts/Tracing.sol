//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Tracing {
    struct Source {
        address provider; 
        uint256 id; //the product index of the provider
    }

    struct Product {
        string name; //the product name
        string time; //the production time
        string location; //the production location
        Source[] sources; //the sources of this product
    }

    struct Trace {
        string name;
        string time;
        string location;
        uint start; //the start index of the sources in the struct array when tracing product
        uint num; //the number of sources
    }

    address public creator; //the creator of this contract
    mapping(address => bool) public authority; //record whether the providers have the authority to add the information of their products
    mapping(address => mapping(uint256 => Product)) public products; //record the products information and their sources information

    error IdAlreadyUsed(uint256 id);
    error InformationIsEmpty();
    error UnequalLength();
    error ProviderNotAuthorized(address provider);
    error IdNotExist(address provider, uint256 id);
    error ValidationFail(address provider, uint256 id);

    event Authorized(address provider);
    event ProductAdded(address provider, uint256 id);

    modifier onlyCreator() {
        require(msg.sender == creator, "Only the creator can call this function.");
        _;
    }

    modifier onlyAuthorized() {
        require(authority[msg.sender], "You are not authorized to call this function.");
        _;
    }

    constructor() {
        creator = msg.sender;
        console.log(block.chainid);
    }

    function authorize(address provider) external onlyCreator {
        authority[provider] = true;

        emit Authorized(provider);
    }

    function isAuthorized(address provider) public view returns(bool) {
        return authority[provider];
    }

    function addProduct(
        uint256 id,
        string calldata _name,
        string calldata _time,
        string calldata _location,
        address[] memory providers,
        uint256[] memory ids,
        bytes[] memory signatures
    ) external onlyAuthorized {
        if(bytes(products[msg.sender][id].name).length != 0) revert IdAlreadyUsed(id);

        if(bytes(_name).length == 0 || 
            bytes(_time).length == 0 || 
            bytes(_location).length == 0) revert InformationIsEmpty();

        uint length = signatures.length;
        if(providers.length != length || ids.length != length) revert UnequalLength();

        for(uint i = 0; i < length; i++) {
            if(!authority[providers[i]]) revert ProviderNotAuthorized(providers[i]);
            if(bytes(products[providers[i]][ids[i]].name).length == 0) revert IdNotExist(providers[i], ids[i]);

            if(!isValidSignature(ids[i], msg.sender, providers[i], signatures[i])) revert ValidationFail(providers[i], ids[i]);
            products[msg.sender][id].sources.push(Source({
                provider:providers[i],
                id:ids[i]
            }));
        }
        products[msg.sender][id].name = _name;
        products[msg.sender][id].time = _time;
        products[msg.sender][id].location = _location;

        emit ProductAdded(msg.sender, id);
    }

    function traceProduct(
        address provider,
        uint256 id
    ) public view returns(Trace[] memory) {
        if(!authority[provider]) revert ProviderNotAuthorized(provider);
        if(bytes(products[provider][id].name).length == 0) revert IdNotExist(provider, id);
        Trace[] memory trace = constructTracingArray(provider, id);

        return trace;
    }

    function isValidSignature(
        uint id,
        address receiver,
        address provider,
        bytes memory signature
    ) internal pure returns(bool) {
        bytes32 message = prefixed(keccak256(abi.encodePacked(id, receiver)));
        return recoverSigner(message, signature) == provider;
    }

    function prefixed(bytes32 Hash) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", Hash));
    }

    function recoverSigner(bytes32 message, bytes memory sig)
        internal
        pure
        returns (address)
    {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    function splitSignature(bytes memory sig)
        internal
        pure
        returns (uint8 v, bytes32 r, bytes32 s)
    {
        require(sig.length == 65);

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function productNum(address provider, uint256 id)
        internal
        view
        returns (uint num)
    {
        num = 1;
        Product storage product = products[provider][id];
        for (uint i = 0; i < product.sources.length; i++) {
            Source storage source = product.sources[i];
            num = num + productNum(source.provider,source.id);
        }
    }

    function constructTracingArray(address provider, uint256 id)
        internal
        view
        returns (Trace[] memory)
    {
        uint len = productNum(provider,id);
        Trace[] memory trace = new Trace[](len);
        Product[] memory record = new Product[](len);
        record[0] = products[provider][id];
        (trace[0].name,trace[0].time,trace[0].location) = (record[0].name,record[0].time,record[0].location);
        uint left = 0;
        uint right = 1;
        for (;left < len; left++) {
            if (right < len) trace[left].start = right;
            else trace[left].start = uint(0);
            Source[] memory sources = record[left].sources;
            trace[left].num = sources.length;
            for (uint i = 0; i < sources.length; i++) {
                record[right+i] = products[sources[i].provider][sources[i].id];
                (trace[right+i].name,trace[right+i].time,trace[right+i].location) 
                    = (record[right+i].name,record[right+i].time,record[right+i].location);
            }
            right = right + sources.length;
        }
        return trace;
    }
}