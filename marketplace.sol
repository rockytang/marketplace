pragma solidity ^0.4.23;

contract Marketplace {
    address owner;
    /// TODO: make admins private
    uint storeId = 0;
    /// TODO: make storeId private 
    mapping (address => bool) public admins;
    mapping (address => StoreOwner) public storeOwners;
    mapping (uint => YoYoStore) public stores;
    
    constructor() {
        owner = msg.sender;
        admins[owner] = true;
    }
    
    // TODO: do you need store ownder address in StoreOwner struct? Already in mapping 
    struct StoreOwner {
        string name;
        // TODO: bit restriction on balance?
        uint balance;
        mapping (uint => YoYoStore) storesOwned;
        OwnerState state;
    }
    
    /// TODO: set OwnerState to Pending initially
    enum OwnerState {Pending, Approved}
    enum StoreState {Active, Inactive}

    struct YoYoStore {
        uint storeId;
        string name;
        address storeOwner;
        StoreState state;
        mapping (uint => Product) products;
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
    
    function addStore(string storeName, uint firstProductSku, string firstProductName, uint firstProductPrice, string firstProductDescription, uint firstProductInventory) 
    onlyStoreOwners() returns (string newStoreName, address storeOwner) {
        Product memory firstProduct = Product({
            sku: firstProductSku,
            name: firstProductName,
            price: firstProductPrice,
            description: firstProductDescription,
            inventory: firstProductInventory
        });
        YoYoStore memory newStore = YoYoStore({
                                storeId: storeId,
                                name: storeName, 
                                storeOwner: msg.sender, 
                                state: StoreState.Active
                                });
        stores[storeId] = newStore;
        require(storeId + 1 > storeId, "storeId has reached its limit");
        storeId++;
        // check for storeId over integer 
        return (stores[storeId - 1].name, msg.sender);
    }
}
