App = {
  web3Provider: null,
  contracts: {},
  globalPriceUnit: 1000000000000000000, // number of weis in 1 ether

  init: function() {
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
    $.getJSON('Marketplace.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var MarketplaceArtifact = data;
      // Set the provider for our contract
      App.contracts.Marketplace = TruffleContract(MarketplaceArtifact);
      App.contracts.Marketplace.setProvider(App.web3Provider);
      return App.identifyUser();
    })

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-addStoreOwner', App.addStoreOwner);
    $(document).on('click', '.btn-fetchStoreOwnerInfo', App.fetchStoreOwnerInfo);
    $(document).on('click', '.btn-addStore', App.addStore);
    $(document).on('click', '.btn-showStores', App.showStores);
    $(document).on('click', '.btn-addProduct', App.addProduct);
    $(document).on('click', '.btn-free', App.giveFreeMoney);
    $(document).on('click', '.btn-shop', App.showStoreProducts);
    $(document).on('click', '.btn-buy', App.buyProduct);
    $(document).on('click', '.btn-withdraw', App.withdrawFunds);
  },
  
  identifyUser: function() {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      $('.visitor-address').text(account);

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.identifyUserRole.call({ from: account });
      }).then(function(data) {
        if (data[0]) {
          $('.userAdmin').removeClass('hidden');
        }
        if (data[1]) {
          $('.userStoreOwner').removeClass('hidden');
        }
        if (!data[0] && !data[1]) {
          $('.userShopper').removeClass('hidden');
        }
        return App.showStores();
      }).catch(function(error) {
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
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      var address = $('.get-store-owner-address').val();
    
      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.fetchStoreOwnerInfo.call(address, { from: account });
      }).then(function (data) {
        var name = data;
        $('.resp-store-owner-name').text(name);
        $('.resp-store-owner-name').css("background", "yellow");
      }).catch(function (error) {
        console.log('error: ', error);
      });
    });
  },

  addStore: function() {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      var name = $('.new-store-name').val();

      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.addStore(name, { from: account });
      }).then(function (data) {
        return App.showStores();
      }).catch(function (error) {
        console.log('error: ', error);
      });
    });
  },

  showStores: function() {
    var marketplaceInstance;

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.fetchAllStoreInfo();
      }).then(function (data) {
        var storesSection = $('#stores-section');
        var storeTemplate = $('#storeTemplate');
        storesSection.html('');
        for (i = 0; i < data.logs.length; i ++) {
          var storeState = data.logs[i].args.state.toNumber() == 1 ? "Activated" : "Deactivated"; // 0 is deactivated and 1 is activated state
          var storeId = data.logs[i].args.storeId.toNumber();
          storeTemplate.find('.store-name').text(data.logs[i].args.name);
          storeTemplate.find('.store-id').text(storeId);
          storeTemplate.find('.store-owner').text(data.logs[i].args.storeOwner);
          storeTemplate.find('.store-state').text(storeState); 
          storeTemplate.find('.store-balance').text(data.logs[i].args.balance.toNumber() / App.globalPriceUnit);
          storeTemplate.find('.store-next-sku').text(data.logs[i].args.nextProductSku.toNumber());
          storeTemplate.find('.btn-shop').attr('data-id', data.logs[i].args.storeId.toNumber());
          if (account == data.logs[i].args.storeOwner) {
            storeTemplate.find('.btn-withdraw').removeClass('hidden');
            storeTemplate.find('.btn-withdraw').attr('store-id', storeId);
          }
          storesSection.append(storeTemplate.html());
        }
      });
    }).catch(function (error) {
      console.log(error);
    });
  },

  addProduct: function() {
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      var storeId = $('.new-product-storeId').val();
      var name = $('.new-product-name').val();
      var price = $('.new-product-price').val();
      var description = $('.new-product-description').val();
      var inventory = $('.new-product-inventory').val();
      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.addProduct(storeId, name, price, description, inventory, { from: account });
      }).then(function (data) {
        console.log('after added product: ', data);
        App.showStoreProducts(null, storeId);
      }).catch(function (error) {
        console.log('error: ', error);
      });
    });
  },

  showStoreProducts: function(event, storeId) {
    storeId = storeId || $(this).attr('data-id') || 0;
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.fetchAllProductInfo(storeId, { from: account });
      }).then(function (data) {
        console.log('after show all products: ', data);
        var productsSection = $('#products-section');
        var productsTemplate = $('#productTemplate');
        productsSection.html('');
        for (i = 0; i < data.logs.length; i++) {
          productsTemplate.find('.product-name').text(data.logs[i].args.name);
          productsTemplate.find('.product-sku').text(data.logs[i].args.sku.toNumber());
          productsTemplate.find('.product-store-id').text(storeId);
          productsTemplate.find('.product-price').text(data.logs[i].args.price.toNumber() / App.globalPriceUnit);
          productsTemplate.find('.product-description').text(data.logs[i].args.description);
          productsTemplate.find('.product-inventory').text(data.logs[i].args.inventory.toNumber());
          productsSection.append(productsTemplate.html());
        }
      }).catch(function (error) {
        console.log('error: ', error);
      });
    });
  },

  buyProduct: function() {
    var storeId = Number($(this).closest(".panel").find('.product-store-id').text());
    var sku = Number($(this).closest(".panel").find('.product-sku').text());
    var quantity = Number($(this).closest(".panel").find('.buy-product-quantity').val());
    var price = Number($(this).closest(".panel").find('.product-price').text());
    var _value = (quantity * price).toString();
    _value = web3.toWei(_value, 'ether');
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.buyProduct(storeId, sku, quantity, { from: account, value: _value });
      }).then(function (data) {
        console.log('after buy product: ', data);
      }).catch(function (error) {
        console.log('error: ', error);
      });
    });
  },

  withdrawFunds: function() {
    var storeId = Number($(this).attr('store-id'));
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.Marketplace.deployed().then(function (instance) {
        marketplaceInstance = instance;
        return marketplaceInstance.withdrawFunds(storeId, { from: account, gas: 3000000 });
      }).then(function (data) {
        console.log('after withdraw funds: ', data);
      }).catch(function (error) {
        console.log('error: ', error);
      });
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
