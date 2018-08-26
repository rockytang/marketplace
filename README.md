# Decentralized Marketplace
A decentralized online marketplace featuring admin, store owner, and shopper roles. <br/>
As an admin: you can add store owners.  
As a store owner: you can add stores, add products, track inventory, sell your products, and withdraw your store revenues.  
As a shopper, you can purchase products available in the marketplace.  
  
Steps taken to avoid common attacks are documented in avoiding_common_attacks.md  
Design pattern choices are documented in design_pattern_desicions.md  
  
## Getting started
```bash
// Start up Ganache
$ truffle compile
$ truffle migrate // this project is using port 7545
$ npm run dev
```

Next, set up the Ganache account on Metamask.     
Then open your browser on http://localhost:3000/

## Debugging
If you encounter ethjs-rpc errors with mismatched nonces, your Metamask may be out of sync with your private blockchain. In these instances, please reset both your Metamask and Ganache.  Then run `$ truffle migrate --reset`

## Testing
```
$ truffle test 
```
