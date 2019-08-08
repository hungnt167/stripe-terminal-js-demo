import React, {Component} from "react";

import Client from "./client";
import Logger from "./logger";

import BackendURLForm from "./Forms/BackendURLForm.jsx";
import CommonWorkflows from "./Forms/CommonWorkflows.jsx";
import CartForm from "./Forms/CartForm.jsx";
import SaleForm from "./Forms/SaleForm.jsx";
import ConnectionInfo from "./ConnectionInfo/ConnectionInfo.jsx";
import Readers from "./Forms/Readers.jsx";
import Group from "./components/Group/Group.jsx";
import Logs from "./Logs/Logs.jsx";
import {DataStorage} from "./services/DataStorage";

import {css} from "emotion";

const EMPTY_CUSTOMER={id:0,email:''};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "requires_initializing", // requires_connecting || reader_registration || workflows
      backendURL: null,
      discoveredReaders: [],
      connectionStatus: "not_connected",
      reader: null,
      readerLabel: "",
      registrationCode: "",
      cancelablePayment: false,
      chargeAmount: 50,
      itemDescription: "Red t-shirt",
      taxAmount: 0,
      currency: "usd",
      customerId: 0,
      newCustomer: '',
      customers: [EMPTY_CUSTOMER],
      workFlowInProgress: null
    };
  }

  async componentDidMount() {
    let backendURL = DataStorage.getBackendURL();
    if (backendURL) {
      this.onSetBackendURL(backendURL);
    }
    let reader = DataStorage.getReader();

    if (reader && reader.id === 'SIMULATOR') {
      await this.connectToSimulator();
    }

    await this.refreshCustomerList();
  }

  refreshCustomerList() {
    return this.getCustomerList(customers => {
      const {customerId} = this.state;
      let newState = {customers:[EMPTY_CUSTOMER,...customers]};
      if (String(customerId) === "0" || !customers.length) {
        return this.setState(newState)
      }

      const currentCustomer = customers.find(customer => customer.id === customerId);

      if (!currentCustomer) {
        return this.setState(newState)
      }

      if (!currentCustomer.payment_methods || !currentCustomer.payment_methods.length) {
        return this.setState(newState)
      }

      newState.paymentMethod = currentCustomer.payment_methods[0].id;
      return this.setState(newState)

    });
  }

  isWorkflowDisabled = () =>
    this.state.cancelablePayment || this.state.workFlowInProgress;

  runWorkflow = async (workflowName, workflowFn) => {
    console.log(workflowName, workflowFn);
    this.setState({
      workFlowInProgress: workflowName
    });
    try {
      await workflowFn();
    } finally {
      this.setState({
        workFlowInProgress: null
      });
    }
  };

  // 1. Stripe Terminal Initialization
  initializeBackendClientAndTerminal(url) {
    // 1a. Initialize Client class, which communicates with the example terminal backend
    this.client = new Client(url);

    // 1b. Initialize the StripeTerminal object
    this.terminal = window.StripeTerminal.create({
      // 1c. Create a callback that retrieves a new ConnectionToken from the example backend
      onFetchConnectionToken: async () => {
        let connectionTokenResult = await this.client.createConnectionToken();
        return connectionTokenResult.secret;
      },
      // 1c. (Optional) Create a callback that will be called if the reader unexpectedly disconnects.
      // You can use this callback to alert your user that the reader is no longer connected and will need to be reconnected.
      onUnexpectedReaderDisconnect: Logger.tracedFn(
        "onUnexpectedReaderDisconnect",
        "https://stripe.com/docs/terminal/js-api-reference#stripeterminal-create",
        () => {
          alert("Unexpected disconnect from the reader");
          this.setState({
            connectionStatus: "not_connected",
            reader: null
          });
        }
      ),
      // 1c. (Optional) Create a callback that will be called when the reader's connection status changes.
      // You can use this callback to update your UI with the reader's connection status.
      onConnectionStatusChange: Logger.tracedFn(
        "onConnectionStatusChange",
        "https://stripe.com/docs/terminal/js-api-reference#stripeterminal-create",
        ev => {
          this.setState({connectionStatus: ev.status, reader: null});
        }
      )
    });
    Logger.watchObject(this.client, "backend", {
      createConnectionToken: {
        docsUrl: "https://stripe.com/docs/terminal/sdk/js#connection-token"
      },
      registerDevice: {
        docsUrl:
          "https://stripe.com/docs/terminal/readers/connecting/verifone-p400#register-reader"
      },
      createPaymentIntent: {
        docsUrl: "https://stripe.com/docs/terminal/payments#create"
      },
      capturePaymentIntent: {
        docsUrl: "https://stripe.com/docs/terminal/payments#capture"
      },
      savePaymentMethodToCustomer: {
        docsUrl: "https://stripe.com/docs/terminal/payments/saving-cards"
      }
    });
    Logger.watchObject(this.terminal, "terminal", {
      discoverReaders: {
        docsUrl:
          "https://stripe.com/docs/terminal/js-api-reference#discover-readers"
      },
      connectReader: {
        docsUrl: "docs/terminal/js-api-reference#connect-reader"
      },
      disconnectReader: {
        docsUrl: "docs/terminal/js-api-reference#disconnect"
      },
      setReaderDisplay: {
        docsUrl:
          "https://stripe.com/docs/terminal/js-api-reference#set-reader-display"
      },
      collectPaymentMethod: {
        docsUrl:
          "https://stripe.com/docs/terminal/js-api-reference#collect-payment-method"
      },
      cancelCollectPaymentMethod: {
        docsUrl:
          "https://stripe.com/docs/terminal/js-api-reference#cancel-collect-payment-method"
      },
      processPayment: {
        docsUrl:
          "https://stripe.com/docs/terminal/js-api-reference#process-payment"
      },
      readReusableCard: {
        docsUrl:
          "https://stripe.com/docs/terminal/js-api-reference#read-reusable-card"
      },
      cancelReadReusableCard: {
        docsUrl:
          "https://stripe.com/docs/terminal/js-api-reference#cancel-read-reusable-card"
      }
    });
  }

  // 2. Discover and connect to a reader.
  discoverReaders = async () => {
    // 2a. Discover registered readers to connect to.
    const discoverResult = await this.terminal.discoverReaders();

    if (discoverResult.error) {
      console.log("Failed to discover: ", discoverResult.error);
      return discoverResult.error;
    } else {
      this.setState({
        discoveredReaders: discoverResult.discoveredReaders
      });
      return discoverResult.discoveredReaders;
    }
  };

  connectToSimulator = async () => {
    const simulatedResult = await this.terminal.discoverReaders({
      simulated: true
    });
    await this.connectToReader(simulatedResult.discoveredReaders[0]);
  };

  connectToReader = async selectedReader => {
    // 2b. Connect to a discovered reader.
    const connectResult = await this.terminal.connectReader(selectedReader);
    if (connectResult.error) {
      console.log("Failed to connect:", connectResult.error);
    } else {
      DataStorage.setReader(connectResult.reader);
      this.setState({
        status: "workflows",
        discoveredReaders: [],
        reader: connectResult.reader
      });
      return connectResult;
    }
  };

  disconnectReader = async () => {
    // 2c. Disconnect from the reader, in case the user wants to switch readers.
    await this.terminal.disconnectReader();
    this.setState({
      reader: null
    });
  };

  registerAndConnectNewReader = async (label, registrationCode) => {
    try {
      let reader = await this.client.registerDevice({
        label,
        registrationCode
      });
      // After registering a new reader, we can connect immediately using the reader object returned from the server.
      await this.connectToReader(reader);
      console.log("Registered and Connected Successfully!");
    } catch (e) {
      // Suppress backend errors since they will be shown in logs
    }
  };

  // 3. Terminal Workflows (Once connected to a reader)
  updateLineItems = async () => {
    // 3a. Update the reader display to show cart contents to the customer
    await this.terminal.setReaderDisplay({
      type: "cart",
      cart: {
        line_items: [
          {
            description: this.state.itemDescription,
            amount: this.state.chargeAmount,
            quantity: 1
          }
        ],
        tax: this.state.taxAmount,
        total: this.state.chargeAmount + this.state.taxAmount,
        currency: this.state.currency
      }
    });
    console.log("Reader Display Updated!");
    return;
  };

  // 3b. create payment intent
  createPaymentIntent = async () => {
    try {
      let payload = {
        amount: this.state.chargeAmount + this.state.taxAmount,
        customerId: this.state.customerId,
        currency: this.state.currency,
        description: "Test Charge",
      };

      let createIntentResponse = await this.client.createPaymentIntent(payload);
      if (createIntentResponse.error) {
        console.log("Collect payment method failed:", createIntentResponse.error.message);
      } else {
        DataStorage.addSale(createIntentResponse.paymentIntent);
      }
    } catch (e) {
      // Suppress backend errors since they will be shown in logs
      return;
    }
  };

  // 3b. update payment intent
  updatePaymentIntent = async (paymentIntentId, amount, callback) => {
    try {
      let updateResult = await this.client.updatePaymentIntent({
        amount: amount,
        paymentIntentId: paymentIntentId,
      });

      if (updateResult.error) {
        alert(`Update failed: ${updateResult.error.message}`);
      }
      if (updateResult.paymentIntent) {
        console.log("Update Payment Successful!", updateResult);
        callback && callback(paymentIntentId, updateResult.paymentIntent)
      }
    } catch (e) {
      alert(`Update failed: ${e.message}`);
    }
  };


  // 3b. cancel payment intent
  cancelPaymentIntent = async (paymentIntentId, callback) => {
    try {
      let cancelResult = await this.client.cancelPaymentIntent({
        paymentIntentId: paymentIntentId,
      });

      if (cancelResult.error) {
        alert(`Cancel failed: ${cancelResult.error.message}`);
      }
      if (cancelResult.paymentIntent) {
        console.log("Cancel Payment Successful!", cancelResult);
        callback && callback(paymentIntentId, cancelResult.paymentIntent)
      }
    } catch (e) {
      alert(`Cancel failed: ${e.message}`)
    }
  };

  // 3b. confirm payment intent
  confirmPaymentIntent = async (paymentIntentId, paymentMethod, callback) => {
    try {
      let confirmResult = await this.client.confirmPaymentIntent({
        paymentIntentId: paymentIntentId,
        paymentMethod: paymentMethod,
      });

      if (confirmResult.error) {
        alert(`Confirm failed: ${confirmResult.error.message}`);
      }
      if (confirmResult.paymentIntent) {
        console.log("Confirm Payment Successful!", confirmResult);
        callback && callback(paymentIntentId, confirmResult.paymentIntent)
      }
    } catch (e) {
      alert(`Confirm failed: ${e.message}`);
    }
  };

  // 3b. capture payment intent
  capturePaymentIntent = async (paymentIntentId, callback) => {
    let captureResult = await this.client.capturePaymentIntent({
      paymentIntentId: paymentIntentId,
    });

    if (captureResult.error) {
      alert(`Capture failed: ${captureResult.error.message}`);
    }
    if (captureResult.paymentIntent) {
      console.log("Capture Payment Successful!", captureResult);
      callback && callback(paymentIntentId, captureResult.paymentIntent)
    }
  };

  // 3b. capture payment intent
  getPendingPaymentIntentList = async (callback) => {
    let result = await this.client.getPendingPaymentIntentList();

    if (result.error) {
      alert(`get PendingPaymentIntent List failed: ${result.error.message}`);
    }
    if (result.items) {
      console.log("PendingPaymentIntent List Successful!", result);
      callback && callback(result.items)
    }
  };

  // get Customer List
  getCustomerList = async (callback) => {
    let result = await this.client.getCustomerList();

    if (result.error) {
      alert(`get Customer List failed: ${result.error.message}`);
    }
    if (result.items) {
      console.log("Customer List Successful!", result);
      callback && callback(result.items)
    }
  };
  // create New Customer
  createNewCustomer = async (callback) => {
    let result = await this.client.createNewCustomer({ email: this.state.newCustomer });

    if (result.error) {
      alert(`create New Customer failed: ${result.error.message}`);
    }
    if (result.id) {
      console.log("create New Customer Successful!", result);
      callback && callback(result)
    }
  };

  // 3b. Collect a card present payment
  collectCardPayment = async () => {
    // We want to reuse the same PaymentIntent object in the case of declined charges, so we
    // store the pending PaymentIntent's secret until the payment is complete.
    if (!this.pendingPaymentIntentSecret) {
      try {
        let createIntentResponse = await this.client.createPaymentIntent({
          amount: this.state.chargeAmount + this.state.taxAmount,
          currency: this.state.currency,
          description: "Test Charge"
        });
        this.pendingPaymentIntentSecret = createIntentResponse.secret;
      } catch (e) {
        // Suppress backend errors since they will be shown in logs
        return;
      }
    }
    // Read a card from the customer
    const paymentMethodPromise = this.terminal.collectPaymentMethod(
      this.pendingPaymentIntentSecret
    );
    this.setState({cancelablePayment: true});
    const result = await paymentMethodPromise;
    if (result.error) {
      console.log("Collect payment method failed:", result.error.message);
    } else {
      const confirmResult = await this.terminal.processPayment(
        result.paymentIntent
      );
      // At this stage, the payment can no longer be canceled because we've sent the request to the network.
      this.setState({cancelablePayment: false});
      if (confirmResult.error) {
        alert(`Confirm failed: ${confirmResult.error.message}`);
      } else if (confirmResult.paymentIntent) {
        try {
          // Capture the PaymentIntent from your backend client and mark the payment as complete
          let captureResult = await this.client.capturePaymentIntent({
            paymentIntentId: confirmResult.paymentIntent.id
          });
          this.pendingPaymentIntentSecret = null;
          console.log("Payment Successful!");
          return captureResult;
        } catch (e) {
          // Suppress backend errors since they will be shown in logs
          return;
        }
      }
    }
  };

  // 3c. Cancel a pending payment.
  // Note this can only be done before calling `processPayment`.
  cancelPendingPayment = async () => {
    await this.terminal.cancelCollectPaymentMethod();
    this.pendingPaymentIntentSecret = null;
    this.setState({cancelablePayment: false});
  };

  // 3d. Save a card for re-use online.
  saveCardForFutureUse = async (callback) => {
    // First, read a card without charging it using `readReusableCard`
    const readResult = await this.terminal.readReusableCard();
    if (readResult.error) {
      alert(`readReusableCard failed: ${readResult.error.message}`);
    } else {
      try {
        // Then, pass the source to your backend client to save it to a customer
        DataStorage.setSavedCard(readResult);
        let customer = await this.client.savePaymentMethodToCustomer({
          paymentMethodId: readResult.payment_method.id,
          customerId: this.state.customerId
        });
        console.log("Payment method saved to customer!", customer);
        callback && callback(customer);
        return customer;
      } catch (e) {
        // Suppress backend errors since they will be shown in logs
        return;
      }
    }
  };

  // 4. UI Methods
  onSetBackendURL = url => {
    this.initializeBackendClientAndTerminal(url);
    localStorage.setItem('backendURL', url);
    this.setState({backendURL: url});
  };
  updateChargeAmount = amount =>
    this.setState({chargeAmount: parseInt(amount, 10)});
  updateItemDescription = description =>
    this.setState({itemDescription: description});
  updateTaxAmount = amount =>
    this.setState({taxAmount: parseInt(amount, 10)});
  updateCurrency = currency => this.setState({currency: currency});
  updateCustomer = (customerId, paymentMethod) => this.setState({customerId,paymentMethod});
  updateNewCustomer = (newCustomer) => this.setState({newCustomer});

  renderForm() {
    const {
      backendURL,
      cancelablePayment,
      reader,
      discoveredReaders,
      customerId,
      newCustomer,
    } = this.state;
    if (backendURL === null && reader === null) {
      return <BackendURLForm onSetBackendURL={this.onSetBackendURL}/>;
    } else if (reader === null) {
      return (
        <Readers
          onClickDiscover={() => this.discoverReaders(false)}
          onClickRegister={this.registerAndConnectNewReader}
          readers={discoveredReaders}
          onConnectToReader={this.connectToReader}
          handleUseSimulator={this.connectToSimulator}
        />
      );
    } else {
      return (
        <>
          <CommonWorkflows
            workFlowDisabled={this.isWorkflowDisabled()}
            newCustomer={newCustomer}
            hasCustomer={String(customerId) !== "0"}
            onChangeNewCustomer={(newCustomer) => this.updateNewCustomer(newCustomer)}
            onClickCreateNewCustomer={() => this.runWorkflow('createCustomer', () => {
              return this.createNewCustomer(async () => {
                await this.setState({ newCustomer: '' });
                this.refreshCustomerList();
              })
            })}
            onClickCreatePaymentIntent={() =>
              this.runWorkflow("createPaymentIntent", this.createPaymentIntent)
            }
            onClickCollectCardPayments={() =>
              this.runWorkflow("collectPayment", this.collectCardPayment)
            }
            onClickSaveCardForFutureUse={() =>
              this.runWorkflow("saveCard", () => this.saveCardForFutureUse(this.refreshCustomerList))
            }
            onClickCancelPayment={this.cancelPendingPayment}
            cancelablePayment={cancelablePayment}
            />
            {this.renderCartForm()}
        </>
      );
    }
  }

  renderSaleForm() {
    const {
      backendURL,
      reader,
      workFlowInProgress,
      paymentMethod
    } = this.state;
    if (backendURL === null || reader === null) {
      return null;
    }
    return (
      <>

        <SaleForm
          paymentMethod={paymentMethod}
          workFlowInProgress={workFlowInProgress}
          workFlowDisabled={this.isWorkflowDisabled()}
          updatePaymentIntent={(paymentIntentId, amount, callback) =>
            this.runWorkflow("updatePaymentIntent", () => this.updatePaymentIntent(paymentIntentId, amount, callback))
          }
          confirmPaymentIntent={(paymentIntentId, paymentMethod, callback) =>
            this.runWorkflow("confirmPaymentIntent", () => this.confirmPaymentIntent(paymentIntentId, paymentMethod, callback))
          }
          capturePaymentIntent={(paymentIntentId, callback) =>
            this.runWorkflow("capturePaymentIntent", () => this.capturePaymentIntent(paymentIntentId, callback))
          }
          getPendingPaymentIntentList={(callback) =>
            this.runWorkflow("getPendingPaymentIntentList", () => this.getPendingPaymentIntentList(callback))
          }
          onClickCancelPaymentIntent={(paymentIntentId, callback) =>
            this.runWorkflow("cancelPaymentIntent", () => this.cancelPaymentIntent(paymentIntentId, callback))
          }
        />
      </>
    );

  }


  renderCartForm() {
    const {
      backendURL,
      reader,
    } = this.state;
    if (backendURL === null || reader === null) {
      return null;
    }
    return (
      <>
        <CartForm
          customers={this.state.customers}
          getCustomerList={(callback)=> this.getCustomerList(callback)}
          workFlowDisabled={this.isWorkflowDisabled()}
          onClickUpdateLineItems={() =>
            this.runWorkflow("updateLineItems", this.updateLineItems)
          }
          itemDescription={this.state.itemDescription}
          chargeAmount={this.state.chargeAmount}
          taxAmount={this.state.taxAmount}
          currency={this.state.currency}
          onChangeCustomer={(customerId, paymentMethod) => this.updateCustomer(customerId, paymentMethod)}
          onChangeCurrency={currency => this.updateCurrency(currency)}
          onChangeChargeAmount={amount => this.updateChargeAmount(amount)}
          onChangeTaxAmount={amount => this.updateTaxAmount(amount)}
          onChangeItemDescription={description =>
            this.updateItemDescription(description)
          }
        />
      </>
    );
  }

  render() {
    const {backendURL, reader} = this.state;
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 24px;
          @media (max-width: 800px) {
            height: auto;
            padding: 24px;
          }
        `}
      >
        <Group direction="column" spacing={30}>
          <Group direction="row" spacing={30} responsive>
            <Group direction="column" spacing={16} responsive>


              {this.renderForm()}
            </Group>
            <Logs/>
            <Group direction="column" spacing={16} responsive>
              {backendURL && (
                <ConnectionInfo
                  backendURL={backendURL}
                  reader={reader}
                  onSetBackendURL={this.onSetBackendURL}
                  onClickDisconnect={this.disconnectReader}
                />
              )}
              {this.renderSaleForm()}
            </Group>
          </Group>
        </Group>
      </div>
    );
  }
}

export default App;
