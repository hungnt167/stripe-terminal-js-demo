// Client for the example terminal backend: https://github.com/stripe/example-terminal-backend
class Client {
  constructor(url) {
    this.url = url;
  }

  createConnectionToken() {
    const formData = new URLSearchParams();
    return this.doPost(this.url + "/connection_token", formData);
  }

  registerDevice({ label, registrationCode }) {
    const formData = new URLSearchParams();
    formData.append("label", label);
    formData.append("registration_code", registrationCode);
    return this.doPost(this.url + "/register_reader", formData);
  }

  createPaymentIntent({ amount, currency, description, customerId }) {
    const formData = new URLSearchParams();
    formData.append("amount", amount);
    formData.append("currency", currency);
    formData.append("description", description);

    if (customerId) {
      formData.append("customer_id", customerId);
    }

    return this.doPost(this.url + "/create_payment_intent", formData);
  }

  updatePaymentIntent({ paymentIntentId, amount }) {
    const formData = new URLSearchParams();
    formData.append("payment_intent_id", paymentIntentId);
    formData.append("amount", amount);
    return this.doPost(this.url + "/update_payment_intent", formData);
  }

  cancelPaymentIntent({ paymentIntentId }) {
    const formData = new URLSearchParams();
    formData.append("payment_intent_id", paymentIntentId);
    return this.doPost(this.url + "/cancel_payment_intent", formData);
  }

  confirmPaymentIntent({ paymentIntentId, paymentMethod }) {
    const formData = new URLSearchParams();
    formData.append("payment_intent_id", paymentIntentId);
    formData.append("payment_method", paymentMethod);
    return this.doPost(this.url + "/confirm_payment_intent", formData);
  }

  capturePaymentIntent({ paymentIntentId }) {
    const formData = new URLSearchParams();
    formData.append("payment_intent_id", paymentIntentId);
    return this.doPost(this.url + "/capture_payment_intent", formData);
  }

  getPendingPaymentIntentList() {
    return this.doGet(this.url + "/get_pending_payment_intent_list", {});
  }

  getCustomerList() {
    return this.doGet(this.url + "/get_customer_list", {});
  }

  savePaymentMethodToCustomer({ paymentMethodId, customerId }) {
    const formData = new URLSearchParams();
    formData.append("payment_method_id", paymentMethodId);

    if (customerId) {
      formData.append("customer_id", customerId);
    }

    return this.doPost(
      this.url + "/attach_payment_method_to_customer",
      formData
    );
  }

  async doPost(url, body) {
    let response = await fetch(url, {
      method: "post",
      body: body
    });

    if (response.ok) {
      return response.json();
    } else {
      let text = await response.text();
      throw new Error("Request Failed: " + text);
    }
  }

  getQueryString(params) {
    let esc = encodeURIComponent;
    return Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&');
  }

  async doGet(url, params) {
    let response = await fetch(url + '?' + this.getQueryString(params), {
      method: "get",
    });

    if (response.ok) {
      return response.json();
    } else {
      let text = await response.text();
      throw new Error("Get request Failed: " + text);
    }
  }
}

export default Client;
