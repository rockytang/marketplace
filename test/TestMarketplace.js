const Marketplace = artifacts.require('Marketplace');
const { assertRevert } = require('./helpers/assertRevert');

contract('Marketplace', function(accounts) {
  beforeEach(async function(){
    this.marketplace = await Marketplace.deployed();
    this.isAdmin = accounts[0];
    this.isStoreOwner = accounts[0];
    this.isNotStoreOwner = accounts[1];
    this.isNotAdmin = accounts[2];
    this.testAccount = accounts[3];
  });

  it('should allow admin to add store owner', function() {
    var marketplace;

    return Marketplace.deployed().then(function(instance) {
      marketplace = instance;
      return marketplace.addStoreOwner(accounts[0], "josh");
    }).then(function(address){
      return marketplace.identifyUserRole.call({from: accounts[0]});
    }).then(function(result){
      assert.equal(result[1], true, 'admin should be able to add store owner')
    })
  });

  it('should not let non-admin add store owners', async function () {
    await assertRevert(
      this.marketplace.addStoreOwner(this.testAccount, "jimmy", { from: this.isNotAdmin })
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
      return marketplace.addStore("nike", { from: accounts[0] });
    }).then(function (resultsOne) {
      return marketplace.fetchAllStoreInfo()
    }).then(function(resultsTwo) {
      assert.equal(resultsTwo.logs[0].args.name, "nike", "store owners should add stores")
    });
  });

  it('should not let non-store-owners add stores', async function () {
    await assertRevert(
      this.marketplace.addStore("adidas", { from: this.isNotStoreOwner })
    );
  });
});
