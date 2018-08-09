App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load pets.

    // $.getJSON('../pets.json', function(data) {
    //   var petsRow = $('#petsRow');
    //   var petTemplate = $('#petTemplate');

    //   for (i = 0; i < data.length; i ++) {
    //     petTemplate.find('.panel-title').text(data[i].name);
    //     petTemplate.find('img').attr('src', data[i].picture);
    //     petTemplate.find('.pet-breed').text(data[i].breed);
    //     petTemplate.find('.pet-age').text(data[i].age);
    //     petTemplate.find('.pet-location').text(data[i].location);
    //     petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

    //     petsRow.append(petTemplate.html());
    //   }
    // });

    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    $.getJSON('Marketplace.json', function (data) {
      var MarketplaceArtifact = data;
      // how to adjust who the owner is of the contract
      App.contracts.Marketplace = TruffleContract(MarketplaceArtifact);
      App.contracts.Marketplace.setProvider(App.web3Provider);
      return App.identifyUser();
    })

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-isAdmin', App.isAdmin);
    $(document).on('click', '.btn-isStoreOwner', App.isStoreOwner);
    $(document).on('click', '.btn-addStoreOwner', App.addStoreOwner);
    $(document).on('click', '.btn-fetchStoreOwnerInfo', App.fetchStoreOwnerInfo);
  },
  
  identifyUser: function() {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.isAdmin({ from: account });
      }).then(function(data) {
        console.log('rocky: ', data);
      }).catch(function(error) {
        console.log('error: ', error);
      })
    });
  },

  // Test
  getContractOwner: function() {
    var marketplaceInstance;

    App.contracts.Marketplace.deployed().then(function (instance) {
      marketplaceInstance = instance;
      return marketplaceInstance.fetchContractOwner.call();
    }).then(function(data) {
      console.log('contract owner: ', data);
    }).catch(function(error) {
      console.log('error: ', error);
    });
  },

  isAdmin: function () {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.isAdmin({ from: account });
      }).then(function (data) {
        console.log('rocky: ', data);
      }).catch(function (error) {
        console.log('error: ', error);
      })
    });
  },

  isStoreOwner: function () {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.isStoreOwner({ from: account });
      }).then(function (data) {
        console.log('store owner: ', data);
      }).catch(function (error) {
        console.log('error: ', error);
      })
    });
  },

  addStoreOwner: function () {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      var address = $('.new-store-owner-address').val();
      var name = $('.new-store-owner-name').val();

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.addStoreOwner(address, name, { from: account });
      }).then(function (data) {
        console.log('add store owner: ', data);
      }).catch(function (error) {
        console.log('error: ', error);
      })
    });
  },
  
  fetchStoreOwnerInfo: function() {
    var address = $('.get-store-owner-address').val();
  
    App.contracts.Marketplace.deployed().then(function (instance) {
      marketplaceInstance = instance;
      return marketplaceInstance.fetchStoreOwnerInfo(address);
    }).then(function (data, second, third) {
      console.log('fetch store owner name: ', data);
      console.log('fetch store owner second: ', second);
      console.log('fetch store owner third: ', third);
    }).catch(function (error) {
      console.log('error: ', error);
    });
  },

  markAdopted: function(adopters, account) {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function (instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function (adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function (instance) {
        adoptionInstance = instance;

        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, { from: account });
      }).then(function (result) {
        return App.markAdopted();
      }).catch(function (err) {
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});