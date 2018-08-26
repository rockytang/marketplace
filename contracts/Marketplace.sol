pragma solidity ^0.4.23;
import "node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/** @title Marketplace */
contract Marketplace {
    using SafeMath for uint;

    address public owner;
    uint private globalStoreId = 0;
    uint public globalUnit = 1 ether;
    bool private globalLockBalances = false;
    bool public globalCircuitBreaker = false;
    mapping (address => bool) private admins;
    mapping (address => StoreOwner) public storeOwners;
    mapping (uint => Store) public stores;

    constructor() public {
        owner = msg.sender;
        admins[owner] = true;
    }
  
    // Structs
    struct StoreOwner {
        string name;
        uint256 balance;
        OwnerState state;
        uint256[] storeIdsOwned;
    }
    struct Store {
        uint storeId;
        string name;
        address storeOwner;
        StoreState state;
        uint balance;
        mapping (uint => Product) products;
        uint nextProductSku;
    }
    struct Product {
        uint sku;
        string name;
        uint price;
        string description;
        uint inventory;
        bool active;
    }
  
    /// Modifiers
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
    modifier circuitBreakerIsOff() {
        require(globalCircuitBreaker == false, "Circuit Breaker is on, no funds are allowed to be transacted at this time.");
        _;
    }

    // Enums  
    enum OwnerState {Deactivated, Approved}
    enum StoreState {Inactive, Active}

    /// Events
    event AddedNewStoreOwner (address _address);
    event AddProduct (uint skuAdded);
    event RemoveProduct (uint skuRemoved);
    event StoreIdOwned (uint storeIdOwned);
    event StoreOwnerName (string storeOwnerName);
    event StoreInfo (uint storeId, string name, address storeOwner, StoreState state, uint balance, uint nextProductSku);
    event ProductInfo (uint sku, string name, uint price, string description, uint inventory, bool active);
    event AmountRequired (uint amountRequired);
    event WithdrewFunds (uint fundsWithdrawn);
    event EventIsAdmin (bool isAdmin);
    event EventIsStoreOwner (OwnerState _ownerState);
  
    /// @dev Identify User Role
    /// @return Booleans for if user is admin and or store owner
    function identifyUserRole() 
        public 
        view 
        returns (bool _isAdmin, bool _isStoreOwner) 
    {
        bool isAdmin = admins[msg.sender];
        bool isStoreOwner = storeOwners[msg.sender].state == OwnerState.Approved ? true : false;
        return(isAdmin, isStoreOwner);
    }

    /// @dev Add Store Owner 
    /// @param _address Address of new store owner
    /// @param _name Name of new store owner
    function addStoreOwner(
        address _address, 
        string _name) 
        public
        onlyAdmin
    {
        storeOwners[_address] = StoreOwner({name: _name, balance: 0, state: OwnerState.Approved, storeIdsOwned: new uint[](0)});
        emit AddedNewStoreOwner(_address);
    }

    /// @dev Add Store
    /// @param storeName Name of the new store
    function addStore(
        string storeName) 
        public 
        onlyStoreOwners 
    {
        Store memory newStore = Store({
            storeId: globalStoreId,
            name: storeName,
            storeOwner: msg.sender,
            state: StoreState.Active,
            nextProductSku: 0,
            balance: 0
        });
        stores[globalStoreId] = newStore;
        storeOwners[msg.sender].storeIdsOwned.push(globalStoreId);
        require(globalStoreId + 1 > globalStoreId, "globalStoreId has reached its limit");
        globalStoreId++;
    }
  
    /// @dev Add product
    /// @param storeId The id of the store to add the product
    /// @param name Name of the product
    /// @param price Price of the product
    /// @param description Description of the product
    /// @param inventory Inventory of the product
    /// @return Product has successfully added
    function addProduct(
        uint storeId, 
        string name, 
        uint price, 
        string description, 
        uint inventory) 
        public
        onlyOwnerOfStore(storeId) 
        returns (bool success) 
    {
        uint nextSku = stores[storeId].nextProductSku;
        uint productPrice = price.mul(globalUnit);
        Product memory newProduct = Product({
            sku: nextSku,
            name: name,
            price: productPrice,
            description: description,
            inventory: inventory,
            active: true
        });
        stores[storeId].products[nextSku] = newProduct;
        require(stores[storeId].nextProductSku + 1 > stores[storeId].nextProductSku, "You have reached the product limit.");
        stores[storeId].nextProductSku++;
        return true;
    }

    /// @dev Remove product
    /// @param storeId Id of the store to remove the product
    /// @param sku Product SKU
    /// @return Product has successfully been removed
    function removeProduct(
        uint storeId, 
        uint sku)
        public
        onlyOwnerOfStore(storeId)
        returns (bool success) 
    {
        require(stores[storeId].products[sku].active == true, "You do not have a product with that SKU.");
        delete stores[storeId].products[sku];
        emit RemoveProduct(sku);
        return true;
    }

    /// @dev Buy product
    /// @param storeId Id of the store that has the item
    /// @param sku Product SKU
    /// @param quantity Quantity you wish to purchase
    /// @return Product(s) have successfully been purchased
    function buyProduct(
        uint storeId, 
        uint sku, 
        uint quantity) 
        public
        payable 
        circuitBreakerIsOff
        returns (bool success) 
    {
        uint price = stores[storeId].products[sku].price;
        uint requiredAmount = price.mul(quantity);
        emit AmountRequired(requiredAmount);
        require(msg.value == requiredAmount, "You need to send exact amount required.");
        require(stores[storeId].products[sku].inventory > 0, "The request product has no more inventory.");
        stores[storeId].products[sku].inventory = stores[storeId].products[sku].inventory - quantity;
        require(stores[storeId].balance + msg.value > stores[storeId].balance, "You have reached the max balance limit.");
        stores[storeId].balance += msg.value;
        return true;
    }

    /// @dev Withdraw Funds
    /// @param storeId Id of the store you wish to withdraw funds from
    /// @return Funds have successfully been withdrawn
    function withdrawFunds(
        uint storeId) 
        public
        payable 
        circuitBreakerIsOff
        onlyOwnerOfStore(storeId) 
        returns (bool success) 
    {
        require(!globalLockBalances, "Another transfer is in process, please try again later.");
        globalLockBalances = true;
        (msg.sender).transfer(stores[storeId].balance);
        emit WithdrewFunds(stores[storeId].balance);
        stores[storeId].balance = 0;
        globalLockBalances = false;
        return true;
    }

    /// @dev Fetch All Store Info
    /// @return Success
    function fetchAllStoreInfo() 
        public 
        returns (bool success) 
    {
        // only transactions can emit events, call functions cannot
        // you also cannot return dynamic arrays
        // so if you want to return an indefinite number of stores, it must be a transaction call emitting events
        for(uint i = 0; i < globalStoreId; i++) {
            emit StoreInfo(
                stores[i].storeId,
                stores[i].name,
                stores[i].storeOwner,
                stores[i].state,
                stores[i].balance,
                stores[i].nextProductSku
            );
        }
        return true;
    }

    /// @dev Fetch All Product Info
    /// @param storeId Id of the store you wish to see products from
    function fetchAllProductInfo(
        uint storeId) 
        public
    {
        for (uint i = 0; i < stores[storeId].nextProductSku; i++) {
            emit ProductInfo(
                stores[storeId].products[i].sku,
                stores[storeId].products[i].name,
                stores[storeId].products[i].price,
                stores[storeId].products[i].description,
                stores[storeId].products[i].inventory,
                stores[storeId].products[i].active
            );
        }
    }

    /// @dev Fetch store owner name
    /// @param _address Address of the store owner
    /// @return Store Owner's name
    function fetchStoreOwnerInfo(
        address _address) 
        public 
        view
        returns (string storeOwnerName)
    {
        return storeOwners[_address].name;
    }

    /// @dev Toggle Circuit Breaker
    /// @param toggle Switch the toggle to true or false
    /// @return The final state of the circuit breaker
    function toggleCircuitBreaker(bool toggle)
        public
        onlyAdmin
        returns (bool isCircuitBreakerOn)
    {
        globalCircuitBreaker = toggle;
        return globalCircuitBreaker;
    }

    /// @dev Get Circuit Breaker State
    /// @return The state of the circuit breaker
    function fetchCircuitBreakerToggle()
        public
        view
        returns (bool isCircuitBreakerOn)
    {
        return globalCircuitBreaker;
    }
    
    /// @dev Fetch Contract Balance
    /// @return Balance of the contract
    function fetchContractBalance() 
        public 
        view
        returns (uint balance) 
    {
        return address(this).balance;
    }
}
