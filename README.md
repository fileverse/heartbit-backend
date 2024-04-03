# Heartbit Backend Documentation

## Introduction

Relayer Backend for [HeartBit](https://github.com/fileverse/HeartBitSDK) by fileverse. leveraging Smart Accounts with Safe Protocol enabled via Pimlico.


## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js

### Installation

To set up the Heartbit Backend on your local machine, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/fileverse/heartbit-backend.git
2. Navigate into the cloned directory:
    ```bash
    cd heartbit-backend

3. Install the necessary dependencies using NPM or Yarn:
   ```bash
   npm install
   or
   yarn

### Running the Application
To run the Heartbit Backend in development mode, use one of the following commands:
```javascript
  npm run start:dev
  or
  yarn start:dev
```

### Usage
The backend facilitates the Heartbit mint functionality by accepting POST requests. These requests can contain either the user's signature or the user wallet address to initiate the minting process.

#### Minting Using a Signature
To mint using a signature, send a POST request as shown below:
```javascript
curl --request POST \
  --url http://localhost:3000/signed-mint \
  --header 'Content-Type: application/json' \
  --data '{
  "message": "hello world!",
  "signature": "0x6a38315bd7e55a7f28867e101bd40c9d2085d7d3c48beeb5d7642e74c942b1886577683b80918fe6b5a7ae3edee6b812a6cb6b7da1b2162f28cec5c58f1ed7b81c",
  "startTime": 1711975039,
  "endTime": 1711975090,
  "hash": "hello world!" 
}
```

#### Minting Using the User Wallet Address
To mint using the user wallet address, send a POST request as follows:

```javascript
curl --request POST \
  --url http://localhost:3000/ \
  --header 'Content-Type: application/json' \
  --header 'x-api-key: <api-key>' \
  --data '{
  "account": "0x6516aE3dC7f16487207F442723eC5f15B3A57C75",
  "startTime": 1711975039,
  "endTime": 1711975090,
  "hash": "hello world!"
}
```
