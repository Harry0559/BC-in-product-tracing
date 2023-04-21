import React from "react";

import { ethers } from "ethers";

import TracingArtifact from "../contracts/Tracing.json";
import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { ErrorMessage } from "./ErrorMessage";
import { Authorize } from "./Authorize";
import { AddProduct } from "./AddProduct";
import { TraceProduct } from "./TraceProduct";
import { ProductData } from "./ProductData";
import { SuccessMessage } from "./SuccessMessage";
import { SignMessage } from "./SignMessage";

// This is the Hardhat Network id that we set in our hardhat.config.js.
const HARDHAT_NETWORK_ID = '1337';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = "ACTION_REJECTED";

export class Dapp extends React.Component {
    constructor(props) {
        super(props);
        this.initialState = {
            //The creator of the contract
            creatorAddress: undefined,
            // The user's address and authority
            selectedAddress: undefined,
            authority: undefined,
            //The product tracing information and the index of history
            productData: undefined,
            index: undefined,
            //signature
            signature: undefined,
            // The ID about transactions being sent, and any possible error with them
            txBeingSent: undefined,
            networkError: undefined,
            authorizeError: undefined,
            addProductError: undefined,
            traceProductError: undefined,
            //some events to be listened
            eventAuthorized: undefined,
            eventProductAdded: undefined
        };
      
        this.state = this.initialState;
    }

    render() {
        if (window.ethereum === undefined) {
            return <NoWalletDetected />;
        }

        if (!this.state.selectedAddress) {
            return (
              <ConnectWallet 
                connectWallet={() => this._connectWallet()} 
                networkError={this.state.networkError}
                dismiss={() => this._dismissNetworkError()}
              />
            );
        }

        // If the creator address or the user's authority hasn't loaded yet, we show
        // a loading component.
        if (this.state.creatorAddress === undefined || this.state.authority === undefined) {
            return <Loading />;
        }

        // If everything is loaded, we render the application.
        return (
            <div className="container p-4">
            <div className="row">
                <div className="col-12">
                <h1>
                    Product Traceability DApp
                </h1>
                <p>
                    The regulator address is <b>{this.state.creatorAddress}</b>.
                </p>
                <p>
                    Welcome! Your address is <b>{this.state.selectedAddress}</b>. You{" "}
                    <b>
                    {this.state.authority ? 'have authority ' : 'do not have authority '}
                    </b>
                    to add product
                    .
                </p>
                </div>
            </div>
    
            <div className="row">
                <div className="col-12">
                {/* 
                Sending a transaction isn't an immediate action. You have to wait
                for it to be mined.
                If we are waiting for one, we show a message here.
                */}
                {this.state.txBeingSent && (
                    <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
                )}
                </div>
            </div>

            <hr />

            <div className="row">
                <div className="col-12">
                <h4>Authorize</h4>

                {this.state.authorizeError && (
                    <ErrorMessage
                    message={this.state.authorizeError}
                    dismiss={() => this._dismissAuthorizeError()}
                    />
                )}
                </div>
            </div>
    
            <div className="row">
                <div className="col-12">
                {/*
                    If the user is not the creator, we don't show the Authorize function
                */}
                {this.state.selectedAddress !== this.state.creatorAddress && (
                    <p>You are not the regulator. Only the regulator can authorize.</p>
                )}
    
                {/*
                    If the user is the creator, then show the Authorize function
                */}
                {this.state.selectedAddress === this.state.creatorAddress && (
                    <Authorize
                    authorizeAddress={(add) => 
                        this._authorizeAddress(add)
                    }
                    />
                )}
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                {this.state.eventAuthorized && (
                    <SuccessMessage
                    message={this.state.eventAuthorized}
                    dismiss={() => this._dismissEventAuthorized()}
                    />
                )}
                </div>
            </div>

            <hr />

            <div className="row">
                <div className="col-12">
                <h4>Add Product</h4>

                {this.state.addProductError && (
                    <ErrorMessage
                    message={this.state.addProductError}
                    dismiss={() => this._dismissAddProductError()}
                    />
                )}
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                {!this.state.authority && (
                    <p>You are not authorized. Please request authorization from the regulator first.</p>
                )}
    
                {this.state.authority && (
                    <AddProduct
                    addProduct={(id,name,time,location,providers,ids,signatures) =>
                        this._addProduct(id,name,time,location,providers,ids,signatures)
                    }
                    />
                )}
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                {this.state.eventProductAdded && (
                    <SuccessMessage
                    message={this.state.eventProductAdded}
                    dismiss={() => this._dismissEventProductAdded()}
                    />
                )}
                </div>
            </div>

            <hr />

            <div className="row">
                <div className="col-12">
                <h4>Trace Product</h4>

                {this.state.traceProductError && (
                    <ErrorMessage
                    message={this.state.traceProductError}
                    dismiss={() => this._dismissTraceProductError()}
                    />
                )}
                </div>
            </div> 

            <div className="row">
                <div className="col-12">    
                <TraceProduct
                    traceProduct={(provider,id) =>
                        this._traceProduct(provider,id)
                    }
                />
                </div>
            </div>     
            
            <div className="row">
                <div className="col-12">    
                {(this.state.productData !== undefined && this.state.index !== undefined) && (
                    <ProductData
                    history={this.state.productData}
                    index={this.state.index}
                    dismiss={() => this._dismissProductInformation()}
                    jump={(provider,id) => this._jumpTo(provider,id)}
                    back={() => this._indexBack()}
                    forward={() => this._indexForward()}
                    />
                )}
                </div>
            </div>

            <hr />

            <div className="row">
                <div className="col-12">    
                <h4>Sign Message</h4>
                <SignMessage
                    sign={(id,receiver) =>
                        this._signMessage(id,receiver)
                    }
                />
                </div>
            </div>   

            <div className="row">
                <div className="col-12">
                {this.state.signature && (
                    <SuccessMessage
                    message={this.state.signature}
                    dismiss={() => this._dismissSignature()}
                    />
                )}
                </div>
            </div> 
            </div>
        );
    }

    componentWillUnmount() {
        // We poll the user's balance, so we have to stop doing that when Dapp
        // gets unmounted
        this._stopPollingData();
    }

    async _connectWallet() {
        // This method is run when the user clicks the Connect. It connects the
        // dapp to the user's wallet, and initializes it.
    
        // To connect to the user's wallet, we have to run this method.
        // It returns a promise that will resolve to the user's address.
        const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
        // Once we have the address, we can initialize the application.
    
        // First we check the network
        if (!this._checkNetwork()) {
            return;
        }
    
        this._initialize(selectedAddress);
    
        // We reinitialize it whenever the user changes their account.
        window.ethereum.on("accountsChanged", ([newAddress]) => {
            this._stopPollingData();
            // `accountsChanged` event can be triggered with an undefined newAddress.
            // This happens when the user removes the Dapp from the "Connected
            // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
            // To avoid errors, we reset the dapp state 
            if (newAddress === undefined) {
                return this._resetState();
            }
          
            this._initialize(newAddress);
        });
        
        // We reset the dapp state if the network is changed
        window.ethereum.on("chainChanged", ([networkId]) => {
            this._stopPollingData();
            this._resetState();
        });
    }

    _checkNetwork() {
        if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
          return true;
        }
    
        this.setState({ 
          networkError: 'Please connect Metamask to Localhost:8545'
        });
    
        return false;
    }

    _initialize(userAddress) {
        // This method initializes the dapp
    
        // We first store the user's address in the component's state
        this.setState({
          selectedAddress: userAddress.toLowerCase(),
        });
    
        // Then, we initialize ethers, fetch the token's data, and start polling
        // for the user's balance.
    
        // Fetching the token data and the user's balance are specific to this
        // sample project, but you can reuse the same initialization pattern.
        this._initializeEthers();
        this._getCreatorAddress();
        this._startPollingData();
    }
    
    async _initializeEthers() {
        // We first initialize ethers by creating a provider using window.ethereum
        this._provider = new ethers.providers.Web3Provider(window.ethereum);
    
        // Then, we initialize the contract using that provider and the token's
        // artifact. You can do this same thing with your contracts.
        this._tracing = new ethers.Contract(
          contractAddress.Tracing,
          TracingArtifact.abi,
          this._provider.getSigner(0)
        );
    }

    async _getCreatorAddress() {
        const creator = await this._tracing.creator();
    
        this.setState({ creatorAddress: creator.toLowerCase() });
    }

    _startPollingData() {
        this._pollDataInterval = setInterval(() => this._updateAuthority(), 1000);
    
        // We run it once immediately so we don't have to wait for it
        this._updateAuthority();
    }
    
    _stopPollingData() {
        clearInterval(this._pollDataInterval);
        this._pollDataInterval = undefined;
    }

    async _updateAuthority() {
        const authority = await this._tracing.isAuthorized(this.state.selectedAddress);
        this.setState({ authority:authority });
    }

    async _authorizeAddress(add) {   
        try {
            this._dismissAuthorizeError();
            this._dismissEventAuthorized();

            const tx = await this._tracing.authorize(add);
            this.setState({ txBeingSent: tx.hash });
        
            const receipt = await tx.wait();
        
            // The receipt, contains a status flag, which is 0 to indicate an error and 1 to indicate a success.
            if (receipt.status === 0) {
                // We can't know the exact error that made the transaction fail when it
                // was mined, so we throw this generic one.
                throw new Error("Transaction failed");
            }

            if (receipt.status === 1) {
                //listening event "Authorized"
                this._tracing.once("Authorized", (addr) => {
                    this.setState({ eventAuthorized: addr + " has been authorized!" });
                });
            }

        } catch (error) {
            // We check the error code to see if this error was produced because the
            // user rejected a tx. If that's the case, we do nothing.
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }
        
            // Other errors are logged and stored in the Dapp's state. This is used to
            // show them to the user, and for debugging.
            console.error(error.reason);
            this.setState({ authorizeError: error });
        } finally {
            // If we leave the try/catch, we aren't sending a tx anymore, so we clear
            // this part of the state.
            this.setState({ txBeingSent: undefined });
        }
    }

    async _addProduct(id,name,time,location,providers,ids,signatures) {
        try {
            this._dismissAddProductError();
            this._dismissEventProductAdded();
        
            const tx = await this._tracing.addProduct(id,name,time,location,providers,ids,signatures);
            this.setState({ txBeingSent: tx.hash });
        
            const receipt = await tx.wait();

            if (receipt.status === 0) {
                throw new Error("Transaction failed");
            }

            if (receipt.status === 1) {
                //listening event "ProductAdded"
                this._tracing.once("ProductAdded", (addr,productID) => {
                    this.setState({ eventProductAdded: "Your product information has been added! Product ID: " + productID });
                });
            }

        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }

            console.error(error.reason);
            this.setState({ addProductError: error });
        } finally {
            this.setState({ txBeingSent: undefined });
        }
    }

    async _traceProduct(provider,id) {
        try {
            this._dismissTraceProductError();
            this._dismissProductInformation();
        
            const productData = await this._tracing.traceProduct(provider,id);
            this.setState({ productData:[productData] });
            this.setState({ index:0 });
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }

            console.error(error.reason);
            this.setState({ traceProductError: error });
        }
    }

    async _jumpTo(provider,id) {
        try {
            this._dismissTraceProductError();
        
            const newProduct = await this._tracing.traceProduct(provider,id);
            const productData = this.state.productData;
            const index = this.state.index;
            if (index === (productData.length-1)) {
                this.setState({ productData: productData.concat([newProduct])});
                this.setState({ index: index + 1 });
            }
            else if (index < (productData.length-1)){
                productData[index+1] = newProduct;
                this.setState({ productData: productData.slice(0, index+2)});
                this.setState({ index: index + 1 });
            }
        } catch (error) {
            if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
                return;
            }

            console.error(error.reason);
            this.setState({ traceProductError: error });
        }
    }

    _indexBack() {
        const index = this.state.index;
        if (index > 0) {
            this.setState({ index: index - 1 });
        }
    }

    _indexForward() {
        const index = this.state.index;
        if (index < this.state.productData.length - 1) {
            this.setState({ index: index + 1 });
        }
    }

    async _signMessage(id, receiver) {
        this._dismissSignature();

        const message = ethers.utils.solidityKeccak256(["uint256", "address"],[id,receiver]);
        const messageBytes = ethers.utils.arrayify(message);
        const signer = this._provider.getSigner();
        const signature = await signer.signMessage(messageBytes);

        this.setState({ signature: signature });
    }


    // This method resets the state
    _resetState() {
        this.setState(this.initialState);
    }

    _dismissNetworkError() {
        this.setState({ networkError: undefined });
    }

    _dismissAuthorizeError() {
        this.setState({ authorizeError: undefined });
    }

    _dismissAddProductError() {
        this.setState({ addProductError: undefined });
    }

    _dismissTraceProductError() {
        this.setState({ traceProductError: undefined });
    }

    _dismissProductInformation() {
        this.setState({ productData: undefined });
        this.setState({ index: undefined });
    }

    _dismissEventAuthorized() {
        this.setState({ eventAuthorized: undefined });
    }

    _dismissEventProductAdded() {
        this.setState({ eventProductAdded: undefined });
    }

    _dismissSignature() {
        this.setState({ signature: undefined });
    }
}