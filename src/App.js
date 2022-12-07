import React, { Component } from "react";
import "./css/bootstrap.min.css"

import './App.css';
import contractJson from "./Epiddha.json";
import Web3 from "web3";
import {
  Button,
  Container,
  Row,
  Col,
} from "react-bootstrap";

let _currentPrice = 0;
let _isActiveOn = "none";
let _isActiveOff = "none";
let _mintReadOnly = true;
let _GetmaxMintAmount = 0
let _ContractAddress = "0x065246CC438388645E4dF5e65A94C27ceE2aa7c5"

const dateTime = Date.now();
const _now = Math.floor(dateTime / 1000);

const rx_live = /^[+-]?\d*(?:\d*)?$/;
const _networkid = 1;
const Switch_networks = {
  Mainnet: {
    chainId: `0x${Number(1).toString(16)}`,
    chainName: "mainnet",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    rpcUrls: ["https://mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://etherscan.io"]
  }

};

const changeNetwork = async ({ networkName }) => {
  try {
    if (!window.ethereum) throw new Error("No crypto wallet found");
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          ...Switch_networks[networkName]
        }
      ]
    });
  } catch (err) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: `0x${Number(_networkid).toString(16)}`,
        }
      ]
    });


  }
};

class App extends Component {
  state = {
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    MintAmount: "0"
  };
  handleNetworkSwitch = async (networkName) => {
    await changeNetwork({ networkName });
  };


  connetcWallet = async () => {
    const web3 = new Web3(window.ethereum);

    if (!window.web3) {
      window.alert("請先安裝錢包");
      return;
    }
    try {
      await window.ethereum.enable();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      if (networkId !== _networkid) {
        this.handleNetworkSwitch("mainnet")
      }

      const instance = new web3.eth.Contract(
        contractJson.abi,
        _ContractAddress
      );

      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      alert(
        `無法載入錢包`
      );
      console.error(error);
    }
    const _GetNetworkId = await web3.eth.net.getId();
    this.setState({ GetNetworkId: _GetNetworkId });
  }


  mint = async (event) => {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(
      contractJson.abi,
      _ContractAddress
    );
    const accounts = await web3.eth.getAccounts();
console.log(this.state.MintAmount);
    if(this.state.isAllow>0 && this.state.isAllow>=this.state.MintAmount){
      await contract.methods.mint(this.state.MintAmount).send({
        value: 0,
        from: accounts[0],
        _mintAmount: this.state.MintAmount,
      });
      this.setState({ MintAmount: 0 });
    } else if (this.state.MintAmount * _currentPrice > 0)
    {
      await contract.methods.mint(this.state.MintAmount).send({
        value: this.state.MintAmount * _currentPrice,
        from: accounts[0],
        _mintAmount: this.state.MintAmount,
      });
      this.setState({ MintAmount: 0 });
    }

    const _isAllow = await contract.methods.allowedMintCount(accounts[0]).call();
    const _totalSupply = await contract.methods.totalSupply().call();
    this.setState({ totalSupply: _totalSupply });
    this.setState({ isAllow: _isAllow });
  
    console.log(this.state.isAllow);
  };




  buttonstate = async () => {


    if (window.web3) {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const networkId_window = await web3.eth.net.getId();

      if (typeof accounts[0] === "undefined") {
        this.connetcWallet();

      }
      else if (networkId_window !== _networkid) {
        this.handleNetworkSwitch("mainnet")
      }
      else {
        if (this.state.MintAmount === "0") {
          alert("Amount can't be 0")
        } else {
          console.log("trymint");
          this.mint();
        }
      }
    } else {
      window.open("https://metamask.io/", '_blank').focus();
    }
  }


  componentDidMount = async () => {


    //如果錢包切換，就重新整理頁面
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }


    //如果錢包有連線，使用錢包連線，沒有就使用系統連線

    const provider = new Web3.providers.HttpProvider(
      "https://mainnet.infura.io/v3/9fe4b651dd214a29a158db8192e0332b"
    );
    let web3 = new Web3(provider);
    let _isAllow = 0;


    const contract = new web3.eth.Contract(
      contractJson.abi,
      _ContractAddress
    );
    const web3_windows = new Web3(window.ethereum);

    if (window.web3) {
      const networkId_window = await web3_windows.eth.net.getId();
      const accounts = await web3_windows.eth.getAccounts();
      if (typeof accounts[0] === "undefined") {
        this.setState({ NetWorkState: "connecting Wallet" });
        _isActiveOn = "none";
        _isActiveOff = "none";
        _mintReadOnly = false;
      }
      else if (networkId_window !== _networkid) {
        this.setState({ NetWorkState: "switch to mainnet" });
      }
      else {
        this.setState({ NetWorkState: "Mint" });
        const _isAllow = await contract.methods.allowedMintCount(accounts[0]).call();
        this.setState({ isAllow: _isAllow });
      }
    } else {
      this.setState({ NetWorkState: "Please install wallet" });
    }

    const _publicSale = await contract.methods.publicSale().call();

    _isAllow=this.state.isAllow;


    if (_isAllow > 0) {
      _currentPrice = 0;
    }
    else {
      _currentPrice = await contract.methods.PRICE().call();
    }


    if (_now < _publicSale && _isAllow <= 0) {
      _isActiveOn = "none";
      _isActiveOff = "";
      _mintReadOnly = true;
    } else {
      _isActiveOn = "";
      _isActiveOff = "none";
      _mintReadOnly = false;
    }
    const accounts = await web3_windows.eth.getAccounts();

    if (typeof accounts[0] === "undefined") {
      _isActiveOn = "none";
      _isActiveOff = "none";
      _mintReadOnly = true;
    }

    const _totalSupply = await contract.methods.totalSupply().call();
    const _maxSupply = await contract.methods.MAX_SUPPLY().call();
    const _maxMintAmount = await contract.methods.MAX_MULTIMINT().call();
    this.setState({ totalSupply: _totalSupply });
    this.setState({ maxSupply: _maxSupply });
    _GetmaxMintAmount = _maxMintAmount

  };


  test = async (event) => {
    alert("test");
  };
  handleMintAmountChange = (evt) => {
    if (rx_live.test(evt.target.value)) {
      this.setState({ MintAmount: evt.target.value });
    }


    if (Number(evt.target.value) > _GetmaxMintAmount) {
      this.setState({ MintAmount: _GetmaxMintAmount });
    }
  };
  render() {

    return (
      <div
        style={{
          //  backgroundColor: "#80aba9",
        }}
      >


          <Container>
            <Row xs={1} md={1}>
              <Col>
                <div className="section">
                  <div className="content_Text">
                    <div className="mintform">
                      <h3>Mint Epiddha NFT</h3>
                      <div style={{
                        display: _isActiveOn
                      }}>
                        <strong>Price：</strong>{_currentPrice / 1e18} {" Eth"}<br />

                      </div>
                      <div style={{
                        display: _isActiveOff
                      }}>
                        <span style={{ color: "#00b4ff" }}>Waiting for open sale</span><br />

                      </div>

                      <strong>Count: </strong>
                      {this.state.totalSupply} / {this.state.maxSupply}
                    </div>

                    <div>
                    </div>
                    <div>
                      <div>
                      </div>
                    </div>
                    <br></br>
                    <label>
                      <input
                        type="textarea"
                        id="MintAmount"
                        maxLength={3}
                        max={20}
                        style={{ width: "100px" }}
                        pattern="[+-]?\d+(?:[.,]\d+)?"
                        onChange={this.handleMintAmountChange}
                        value={this.state.MintAmount}
                        placeholder="Enter amount"
                        className="form-control"
                        readOnly={_mintReadOnly}
                      />
                    </label>

                    <Button
                      type="button"
                      onClick={this.buttonstate}
                      //variant="warning"
                      className="button is-rounded"
                      id="mintbutton"
                    >
                      {this.state.NetWorkState}
                    </Button>


                  </div>
                </div></Col>
            </Row>
          </Container>

        </div>
    );
  }



}
export default App;
