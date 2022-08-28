# ICVCMGovernor

## General Requirements

* Node.js -- JavaScript Runtime.
  * Install [here](http://nodejs.org)
  * Recommend LTS version
* Yarn -- NPM Package Manager.
  * Install: `npm install --global yarn`
  * Required because Yarn Workspaces are being using in this project
* Metamask plugin installed on any chromium-based browser of choice:
  * Note the web app currently only supports Metamask wallet and provider
  * Install [here](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)

## Setup

Once all the general requirements are satisfied and the repo has been cloned locally, the following command will install all the necessary dependencies to use the repository.

```bash
yarn install
```

The following environment variables on `./packages/contracts/.env` can be setup to unlock extra features:

* `ETHERSCAN_API_KEY` – Etherscan is used to verify source code deployed to public networks. Sign up [here](https://etherscan.io/apis) and paste the api key.
* `COINMARKETCAP_API_KEY` – Coinmarketcap is used to measure the gas consumption of the smart contracts. Sign up [here](https://coinmarketcap.com/) and paste the api key.
* `GOERLI_URL` - A Node Provider like Infura is necessary to deploy contracts to Goerli. Sign up [here](https://infura.io/) and paste the api key.

## Testing Smart Contracts

### Automated Tests

Runs all the unit and integration tests and includes a gas report at the end

```bash
yarn contracts:test
```

### Test Coverage

Tests can be run to also show its coverage information at the end. Run the command below and the view the coverage by opening the following generated [file](./packages/contracts/coverage/index.html) on the browser 

```bash
yarn contracts:test
```

## Usage

It is recommended to run the application locally to have a seamless experience trying out all the features of the application in swift manner without having to wait for block confirmations. However, for a more realistic usage experience run with the Goerli Testnet.
### Local

#### Prerequisites

* Add relevant test accounts to the metamask wallet using the credentials in [Test Wallets](#test-wallets) 
* Add Hardhat Network on Metamask. Refer [here](#custom-network-credentials)
* Switch active network on Metamask to Hardhat Network.

#### Steps

1. Spin up a local testnet. This exposes an JSON-RPC connection at http://127.0.0.1:8545/ to interact with the testnet. Additionally default wallet accounts are funded

    ```bash
    yarn chain
    ```

2. Open another terminal window and run the deployment script to deploy the ICVCM smart contracts on the local testnet

    ```bash
    yarn deploy_contracts
    ```

3. Open another terminal window and run the frontend web app client. The website will available on http://127.0.0.1:3000/

    ```bash
    yarn web:start
    ```

4. Open the browser on http://127.0.0.1:3000/ and start using the client.

### Goerli Testnet

The ICVCM smart contracts have already been deployed to the Goerli testnet and they can be used for testing purposes

#### Prerequisites

* Add relevant test accounts to metamask wallets on [Goerli Test Accounts](#goerli-test-accounts)
* Switch active network on Metamask to Goerli

#### Steps

1. Run the frontend web app client. The website will be available on http://127.0.0.1:3000/

    ```bash
    yarn web:start
    ```

2. Open the browser on http://127.0.0.1:3000/ and start using the client.

## Deployment

TBA.

## Disclaimer

Disclaimer, the prototype built is by no means ready to be used in a production environment. If anyone chooses to use the code for real governance use cases it should go through thorough security audits and ensure it is regulator proof. The author will not be responsible for the legal and ethical issues arising from the software. - Blockchain protocol prone to cyberattack



## Extras

### Custom Network Credentials

Additional help for adding custom networks on Metamask can be found [here](https://metamask.zendesk.com/hc/en-us/articles/360043227612-How-to-add-a-custom-network-RPC)

#### Hardhat Network Credentials

* Network Name: Hardhat Network
* New RPC URL: http://127.0.0.1:8545/
* Chain ID: 31337
* Currency Symbol: GO
* Block Explorer URL: N/A


### Test Wallets

The following test accounts are setup during deployment for testing. Please import them to Metamask to use. Help to setup can be found [here](https://metamask.zendesk.com/hc/en-us/articles/360015489331-How-to-import-an-account)

#### Hardhat Network Test Accounts

| Name   | Role        | Address                                    | Private Key                                                        |
|--------|-------------|--------------------------------------------|--------------------------------------------------------------------|
| David  | Director    | 0xc79B83721c54B1Ef79f90B48E14A7f95E085B189 | 0xb5c3c315dea37949f1ad28f34730cbc9b4e74ca8c99ee14c5ef61267b0100dfc |
| Daniel | Director    | 0x811636F729cC16FdE68C3d3b09498f759639f969 | 0x736d0790155167e515a96a2d2b56f941021b0e3fa58d2802db4ed5ae2d1ea155 |
| Daisy  | Director    | 0x66cF13AEb1D00F64241b6883311f7c50ddbE9c06 | 0x362f2921e69102d773e28b8ee902b29e49eee1e7e326270c3599e4e124f8565b |
| Eva    | Expert      | 0x778E30a72DaF780e1a967E902FDf6640A9b7DFF2 | 0x50e819baf4fc1ef7906196c7af9a1d215a06b440513644e5737cfc7b891f271b |
| Sophia | Secretariat | 0x5F58f4cFaC7380caC809B432066A7B85880C51A5 | 0x2ba8ea5ca87b749728a7a106cc14fd7890b600d4e7378470b4b3d8bf1d5a648b |
| Riley  | Regulator   | 0xB764EE0DB28962ba0D626c0601428C77FDA53de0 | 0x4d0d120d803960777dbfa29ba812c514ad30852c138fc5c49f104d1779a563a4 |
| Extra  | -           | 0x962a928A9CbA305F2C8eF7e6f4c3E8B90e2bC488 | 0x6358e297e10e421aa658c2e80b2d329ff5099314fd1b734e6cc4f437ed8a3012 |

#### Goerli Test Accounts 

| Name   | Role        | Address                                    | Private Key                                                        |
|--------|-------------|--------------------------------------------|--------------------------------------------------------------------|
| David  | Director    | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| Daniel | Director    | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| Daisy  | Director    | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a |
| Eva    | Expert      | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 |
| Sophia | Secretariat | 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 | 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a |
| Riley  | Regulator   | 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc | 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba |
| Extra  | -           | 0x976EA74026E726554dB657fA54763abd0C3a0aa9 | 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e |