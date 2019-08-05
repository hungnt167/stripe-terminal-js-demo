import React, {Fragment} from "react";

import Button from "../components/Button/Button.jsx";
import Icon from "../components/Icon/Icon.jsx";
import Group from "../components/Group/Group.jsx";
import Section from "../components/Section/Section.jsx";
import Text from "../components/Text/Text.jsx";
import {DataStorage} from "../services/DataStorage";
import TextInput from "../components/TextInput/TextInput";
import Link from "../components/Link/Link";


const CAPTURE_ABLE_STATUSES = [
  'requires_confirmation',
  'requires_capture',
  'requires_payment_method'
];

class SaleForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sale: null,
      sales: DataStorage.getSales()
    }
  }

  componentDidMount() {
    const {getPendingPaymentIntentList} = this.props;
    getPendingPaymentIntentList((sales) => {
      sales.forEach(sale => {
        DataStorage.addSale(sale);
      });
      this.refreshList();
    })
  }

  /**
   *
   * @param nextProps
   * @param nextContext
   */
  componentWillReceiveProps(nextProps, nextContext) {
    this.refreshList();
  }

  /** function */

  refreshList() {
    this.setState({sales: DataStorage.getSales()});
  }

  /**
   *
   * @param sale
   * @return {boolean}
   */
  saleCanCapture(sale) {
    if (!DataStorage.getSavedCard() && !this.props.paymentMethod) {
      return false;
    }

    if (!sale) {
      return false;
    }

    return CAPTURE_ABLE_STATUSES.includes(sale.status)
  }

  /**
   *
   * @param status
   * @return {string}
   */
  iconForSale({status}) {
    if (status === 'canceled') {
      return 'cancel';
    }

    if (status === 'succeeded') {
      return 'lock';
    }

    return 'list';
  }


  /** actions */
  onClickSale(sale) {
    this.setState({sale})
  }

  onChangeChargeAmount(amount) {
    this.setState({sale: {...this.state.sale, amount}})
  }

  onClickCancel() {
    const {sale} = this.state;
    const {onClickCancelPaymentIntent} = this.props;
    onClickCancelPaymentIntent(sale.id, (paymentIntentId, result) => {
      // DataStorage.removeSavedCard();
      // DataStorage.removeSale(result);
      DataStorage.addSale(result);
      this.refreshList();
    });
  }

  onClickCapture() {
    const {sale} = this.state;

    const {updatePaymentIntent, confirmPaymentIntent, capturePaymentIntent} = this.props;
    updatePaymentIntent(
      sale.id,
      sale.amount,
      () => confirmPaymentIntent(
        sale.id,
        this.props.paymentMethod || DataStorage.getSavedCard(),
        () => capturePaymentIntent(sale.id, (paymentIntentId, result) => {
          // DataStorage.removeSavedCard();
          DataStorage.addSale(result);
        })
      )
    );
  }

  actionContent(sale) {
    return (
      <Fragment>
        <Group
          direction="row"
          alignment={{
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text size={12} color="dark">
            Charge amount
          </Text>
          <TextInput
            value={sale.amount}
            onChange={(amount) => this.onChangeChargeAmount(amount)}
          />

        </Group>
        <Group
          direction="row"
          alignment={{
            justifyContent: "center",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Button
            color="white"
            onClick={() => this.onClickCancel()}
            justifyContent="left"
          >
            <Group direction="row">
              <Icon icon="cancel"/>
              <Text color="blue" size={14}>
                Cancel
              </Text>
            </Group>
          </Button>
          <Button
            color="white"
            onClick={() => this.onClickCapture()}
            justifyContent="left"
          >
            <Group direction="row">
              <Icon icon="card"/>
              <Text color="blue" size={14}>
                Capture
              </Text>
            </Group>
          </Button>
        </Group>
      </Fragment>
    );
  }


  render() {
    const {sales, sale} = this.state;

    if (!sales.length) {
      return null;
    }

    return (
      <Fragment>
        <Group direction="column" spacing={0}>
          <Section position="first">
            <Text size={16} color="dark">
              Sales
            </Text>
          </Section>
          <Section position="middle" style={{
            height: '55vh',
            overflowY: 'auto',
          }}>
            {
              sales.map(saleItem => (
                <Fragment key={saleItem.id}>
                  <Group direction="column">
                    <Button
                      color="white"
                      onClick={() => this.onClickSale(saleItem)}
                      justifyContent="left"
                    >
                      <Group direction="row">

                        <Icon icon={this.iconForSale(saleItem)}/>
                        <Text color="blue" size={14}>
                          {saleItem.id}
                        </Text>
                      </Group>
                    </Button>
                  </Group>
                  {
                    this.saleCanCapture(saleItem) && sale && sale.id === saleItem.id && this.actionContent(saleItem)
                  }
                </Fragment>
              ))
            }
          </Section>
          <Section position="last">
            <Text size={12} color="lightGrey">
              Test payment responses{" "}
              <Link
                href="https://stripe.com/docs/terminal/testing"
                text="using amounts"
                newWindow
              />
              .
            </Text>
          </Section>
        </Group>
      </Fragment>
    );
  }
}

export default SaleForm;
