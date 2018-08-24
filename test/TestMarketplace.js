const Marketplace = artifacts.require('Marketplace');
const { assertRevert } = require('./helpers/assertRevert');

contract('Marketplace', function(accounts) {
  beforeEach(async function(){
    this.marketplace = await Marketplace.deployed();
    this.isAdmin = accounts[0];
    this.isStoreOwner = accounts[1];
    this.isShopper = accounts[2];
  });

  it('should allow admin to add store owner', function() {
    var marketplace;

    return Marketplace.deployed().then(function(instance) {
      marketplace = instance;
      return marketplace.addStoreOwner(accounts[1], "josh");
    }).then(function(address){
      return marketplace.identifyUserRole.call({from: accounts[1]});
    }).then(function(result){
      assert.equal(result[1], true, 'admin should be able to add store owner');
    })
  });

  it('should not let non-admin add store owners', async function () {
    await assertRevert(
      this.marketplace.addStoreOwner(this.isShopper, "jimmy", { from: this.isShopper })
    );
  });

  it('should know if user is admin', function () {
    var marketplace;

    return Marketplace.deployed().then(function (instance) {
      marketplace = instance;
      return marketplace.identifyUserRole.call({from: accounts[0]});
    }).then(function (results) {
      assert.equal(results[0], true, 'admins should be identifed correctly')
    })
  });

  it('should let store owners add stores', function () {
    var marketplace;

    return Marketplace.deployed().then(function (instance) {
      marketplace = instance;
      return marketplace.addStore("nike", { from: accounts[1] });
    }).then(function (resultsOne) {
      return marketplace.fetchAllStoreInfo()
    }).then(function(resultsTwo) {
      assert.equal(resultsTwo.logs[0].args.name, "nike", "store owners should add stores")
    });
  });

  it('should not let non-store-owners add stores', async function () {
    await assertRevert(
      this.marketplace.addStore("adidas", { from: this.isShopper })
    );
  });

  it('should let store owners add products', function () {
    var marketplace;

    return Marketplace.deployed().then(function (instance) {
      marketplace = instance;
      return marketplace.addProduct(0, "Jordan One", 3, "Best shoes in the world.", 20, { from: accounts[1] });
    }).then(function (resultsOne) {
      return marketplace.fetchAllProductInfo(0)
    }).then(function (resultsTwo) {
      assert.equal(resultsTwo.logs[0].args.name, "Jordan One", "store owners should be able to add products")
    });
  });

  it('should not let people who do not own the store add products to that store', async function () {
    await assertRevert(
      this.marketplace.addProduct(0, "Jordan One", 3, "Best shoes in the world.", 20, { from: this.isShopper })
    );
  });

  it('should let shoppers buy products', function () {
    var marketplace;
    let buyer = accounts[2];

    return Marketplace.deployed().then(function (instance) {
      marketplace = instance;
      return marketplace.buyProduct(0, 0, 1, { from: buyer, value: "3000000000000000000" });
    }).then(function (results) {
      return marketplace.fetchAllProductInfo(0);
    }).then(function (resultsTwo) {
      assert.equal(resultsTwo.logs[0].args.inventory, 19, "buyer was not able to buy products");
      return marketplace.fetchAllStoreInfo();
    }).then(function (resultsThree) {
      assert.equal(resultsThree.logs[0].args.balance, "3000000000000000000", "Store balance did not increment correctly.");
    })
  });

  it('should not let shoppers withdraw funds from stores they dont own', async function () {
    await assertRevert(
      this.marketplace.withdrawFunds(0, { from: this.isShopper })
    );
  });

  it('should let store owners withdraw funds', function() {
    var marketplace;

    return Marketplace.deployed().then(function (instance) {
      marketplace = instance;
      return marketplace.withdrawFunds(0, { from: accounts[1] });
    }).then(function (resultsOne) {
      return marketplace.fetchAllStoreInfo();
    }).then(function (resultsTwo) {
      assert.equal(resultsTwo.logs[0].args.balance, "0", "Store balance did not decrement correctly.");
    })
  });
});
