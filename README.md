# Heartbit Backend

## Introduction
Relayer Backend for [HeartBit](https://github.com/fileverse/HeartBitSDK) by fileverse.

## Getting Started



### Prerequisites
- Nodejs

### Installation
After cloning the repo:
```javascript 
git clone https://github.com/fileverse/heartbit-backend.git
```
You can install the dependencies using `npm` or `yarn`

```javascript
npm install

// or

yarn
```
Run the app 
```javascript
npm run start:dev

// or

yarn start:dev
```

### Usage
The backend facilitates the Heartbit mint functionality by accepting post requests with either the signature or the user wallet address

#### Example request for minting using a signature

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


#### Example request for minting using the user wallet address

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
