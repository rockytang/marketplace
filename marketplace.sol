pragma solidity ^0.4.23;

contract Marketplace {
    address owner;
    /// TODO: make admins private
    uint globalStoreId = 0;
    /// TODO: make storeId private 
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
        OwnerState state;
        uint[] storeIdsOwned;
    }
    
    /// TODO: set OwnerState to Pending initially
    enum OwnerState {Pending, Approved}
    enum StoreState {Active, Inactive}

    struct Store {
        uint storeId;
        string name;
        address storeOwner;
        StoreState state;
        uint balance;
        mapping (uint => Product) products;
        /// TODO: think through if you want products as map or array
        uint nextProductSku;
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
    modifier onlyOwnerOfStore(uint selectedStoreId) {
        require (msg.sender == stores[selectedStoreId].storeOwner, "You do not own the store.");
        _;
    }
    
    function addStoreOwner(address _address, string _name) onlyAdmin() returns (address newStoreOwner) {
        storeOwners[_address] = StoreOwner({name: _name, balance: 0, state: OwnerState.Approved, storeIdsOwned: new uint[](0)});
        emit AddedNewStoreOwner(_address);
        return (_address);
    }
    
    function addStore(string storeName) onlyStoreOwners() returns (string newStoreName, address storeOwner) {
        Store memory newStore = Store({
                                storeId: globalStoreId,
                                name: storeName, 
                                storeOwner: msg.sender, 
                                state: StoreState.Active,
                                nextProductSku: 0,
                                balance: 0
                                });
        // record the new Store in stores mapping and storeOwners struct 
        stores[globalStoreId] = newStore;
        // TODO: check globalStoreId array
        storeOwners[msg.sender].storeIdsOwned.push(globalStoreId);
        require(globalStoreId + 1 > globalStoreId, "globalStoreId has reached its limit");
        globalStoreId++;
        // check for storeId over integer 
        return (stores[globalStoreId - 1].name, msg.sender);
    }
    
    function addProduct(uint storeId, string name, uint price, string description, uint inventory) 
    onlyOwnerOfStore(storeId) returns (string newProductName) {
        uint nextSku = stores[storeId].nextProductSku;
        Product memory newProduct = Product({
            sku: nextSku,
            name: name,
            price: price,
            description: description,
            inventory: inventory
        });
        
        stores[storeId].products[nextSku] = newProduct;
        // Prevent integer overflow.
        // TODO: implement admin function or delegate call to expand product offering if over limit 
        require(stores[storeId].nextProductSku + 1 > stores[storeId].nextProductSku, "You have reached the product limit.");
        stores[storeId].nextProductSku++;
        // TODO: check name
        return (stores[storeId].products[nextSku - 1].name);
    }
    
    /// Fetches for testing purposes
    function fetchProductInfo(uint storeId, uint sku) returns (string productName) {
        return stores[storeId].products[sku].name;
    }
    
    function fetchStoreOwnerInfo() returns (uint storeIdOwned, uint secondStore) {
        return (storeOwners[msg.sender].storeIdsOwned[0], storeOwners[msg.sender].storeIdsOwned[1]);
    }
}
