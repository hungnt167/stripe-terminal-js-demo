const BACKEND_URL_KEY = 'backendURL';
const SALE_KEY = 'sales';
const READER_KEY = 'reader';
const SAVED_CARD_KEY = 'saved_card';

export class DataStorage {
  static instance;

  constructor() {
    DataStorage.instance = this;
  }

  /**
   *
   * @param key
   * @return {string}
   */
  static getItem(key) {
    return localStorage.getItem(key);
  }

  /**
   *
   * @param key
   * @param value
   */
  static setItem(key, value) {
    localStorage.setItem(key, value);
  }

  /**
   *
   * @param key
   */
  static removeItem(key) {
    localStorage.removeItem(key);
  }

  /**
   *
   * @return {string}
   */
  static getBackendURL() {
    return this.getItem(BACKEND_URL_KEY);
  }

  /**
   *
   * @return {Array}
   */
  static getSales() {
    let sales = this.getItem(SALE_KEY);

    if (typeof sales === "string") {
      sales = JSON.parse(sales);
    }

    return Array.isArray(sales) ? sales : [];
  }

  /**
   *
   * @param id
   * @param sales
   * @return {number | *}
   */
  static findSaleIndex(id, sales = false) {
    if (!sales) {
      sales = this.getSales();
    }
    return sales.findIndex(item => item.id === id);
  }

  /**
   *
   * @param {Object} sale
   */
  static addSale(sale) {
    if (!sale) {
      return;
    }
    let sales = this.getSales();
    let index = this.findSaleIndex(sale.id, sales);
    if (index !== -1) {
      sales[index] = sale;
    } else {
      sales.push(sale);
    }
    this.setItem(SALE_KEY, JSON.stringify(sales));
  }

  /**
   *
   * @param {Object} sale
   */
  static removeSale(sale) {

    if (!sale) {
      return;
    }
    let sales = this.getSales();
    let index = this.findSaleIndex(sale.id, sales);
    if (index === -1) {
      return;
    }
    sales.splice(index, 1);
    this.setItem(SALE_KEY, JSON.stringify(sales));
  }

  /**
   *
   * @return {Object| boolean}
   */
  static getReader() {
    let object = localStorage.getItem(READER_KEY);

    if (typeof object === "string") {
      object = JSON.parse(object);
    }

    return object || false;
  }

  /**
   *
   * @param {Object} reader
   */
  static setReader(reader) {
    this.setItem(READER_KEY, JSON.stringify(reader));
  }

  /**
   *
   * @return {Object| boolean}
   */
  static getSavedCard() {
    return this.getItem(SAVED_CARD_KEY) || false;
  }

  /**
   *
   */
  static removeSavedCard() {
    return this.removeItem(SAVED_CARD_KEY);
  }

  /**
   *
   * @param {Object} card
   */
  static setSavedCard(card) {
    if (!card) {
      return;
    }
    if (typeof card !== "object") {
      return;
    }
    let sourceId = false;

    if (card.hasOwnProperty('source')) {
      sourceId = card.source.id;
    }

    if (card.hasOwnProperty('payment_method')) {
      sourceId = card.payment_method.id;
    }

    if (!sourceId) {
      return;
    }

    this.setItem(SAVED_CARD_KEY, sourceId);
  }
}
