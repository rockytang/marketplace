// This has been taken from OpenZeppelin, using their solution for testing reverts.
// https://github.com/OpenZeppelin/openzeppelin-solidity/blob/4544df47da94c4735f1787f1d4d0926d1c6f665e/test/introspection/SupportsInterfaceWithLookup.test.js

const should = require('chai')
  .should();

async function assertRevert(promise) {
  try {
    await promise;
  } catch (error) {
    error.message.should.include('revert', `Expected "revert", got ${error} instead`);
    return;
  }
  should.fail('Expected revert not received');
}

module.exports = {
  assertRevert
};
