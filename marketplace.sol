pragma solidity ^0.4.23;

contract Marketplace {
    address owner;
    /// TODO: make admins private
    mapping (address => bool) public admins;
    mapping (address => StoreOwner) public storeOwners;
    mapping (uint => Store) public stores;
    
    constructor() {
        owner = msg.sender;
        admins[owner] = true;
    }
    
    // TODO: do you need store ownder address in StoreOwner struct? Already in mapping 
    struct StoreOwner {
        string name;
        // TODO: bit restriction on balance?
        uint balance;
        mapping (uint => Store) storesOwned;
        OwnerState state;
    }
    
    /// TODO: set OwnerState to Pending initially
    enum OwnerState {Pending, Approved}
    enum StoreState {Active, Inactive}

    struct Store {
        uint storeId;
        string name;
        address storeOwner;
        mapping (uint => Product) products;
        StoreState state;
    }
    struct Product {
        uint sku;
        string name;
        uint price;
        string description;
        uint inventory;
        // TODO: add image via string and IPFS?
    }
    
    /// Events
    event AddedNewStoreOwner (address _address);
    
    /// modifiers for authorized access control
    modifier onlyAdmin () {
        require (admins[msg.sender] == true, "You are not an admin.");
        _;
    }
    modifier onlyStoreOwners() {
        require (storeOwners[msg.sender].state == OwnerState.Approved, "You are not a registered store owner.");
        _;
    }
    
    function addStoreOwner(address _address, string _name) onlyAdmin() returns (address newStoreOwner) {
        storeOwners[_address] = StoreOwner({name: _name, balance: 0, state: OwnerState.Approved});
        emit AddedNewStoreOwner(_address);
        return (_address);
    }
    
    /// TODO: add function to addStore only for onlyStoreOwners 
}
