import * as React from "react";

import Button from "../components/Button/Button.jsx";
import Icon from "../components/Icon/Icon.jsx";
import Group from "../components/Group/Group.jsx";
import Section from "../components/Section/Section.jsx";
import Text from "../components/Text/Text.jsx";
import TextInput from "../components/TextInput/TextInput.jsx";
import Select from "../components/Select/Select.jsx";

const EMPTY_CUSTOMER={id:0,email:''};

class CartForm extends React.Component {
  static CURRENCIES = [
    { value: "usd", label: "USD" },
    { value: "gbp", label: "GBP" }
  ];

  constructor(props) {
    super(props);
    this.state = {
      customer: {id:0},
      customers: [EMPTY_CUSTOMER],
    };
  }


  componentDidMount() {
    const {getCustomerList} = this.props;
    getCustomerList(customers => this.setState({customers:[EMPTY_CUSTOMER,...customers]}));
  }

  /**
   *
   * @param customerId
   * @return {*}
   */
  getPaymentMethod(customerId) {
    const customer = this.state.customers.find(item => item.id === customerId);
    if (!customer) {
      return null;
    }
    if (!customer.payment_methods.length) {
      return null;
    }

    return customer.payment_methods[0].id;
  }

  render() {
    return (
      <>
        <Group direction="column" spacing={0}>
          <Section position="first">
            <Text size={16} color="dark">
              Cart configuration
            </Text>
          </Section>
          <Section position="last">
            <Group direction="column">
              <Group
                direction="row"
                alignment={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Text size={12} color="dark">
                  Item description
                </Text>
                <TextInput
                  value={this.props.itemDescription}
                  onChange={this.props.onChangeItemDescription}
                />
              </Group>
              <Group
                direction="row"
                alignment={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Text size={12} color="dark">
                  Charge amount
                </Text>
                <TextInput
                  value={this.props.chargeAmount}
                  onChange={this.props.onChangeChargeAmount}
                />
              </Group>
              <Group
                direction="row"
                alignment={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Text size={12} color="dark">
                  Tax amount
                </Text>
                <TextInput
                  value={this.props.taxAmount}
                  onChange={this.props.onChangeTaxAmount}
                />
              </Group>
              <Group
                direction="row"
                alignment={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Text size={12} color="dark">
                  Currency
                </Text>
                <Select
                  items={CartForm.CURRENCIES}
                  value={CartForm.CURRENCIES[0]}
                  onChange={this.props.onChangeCurrency}
                />
              </Group>
              <Group
                direction="row"
                alignment={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Text size={12} color="dark">
                  Customer
                </Text>
                <Select
                  valueKey={'id'}
                  labelKey={'email'}
                  items={this.state.customers}
                  value={this.state.customer.id}
                  onChange={(customerId) => this.props.onChangeCustomer(customerId, this.getPaymentMethod(customerId))}
                />
              </Group>
              <Button
                color="white"
                onClick={this.props.onClickUpdateLineItems}
                disabled={this.props.workflowDisabled}
                justifyContent="left"
              >
                <Group direction="row">
                  <Icon icon="list" />
                  <Text color="blue" size={14}>
                    Update line items and totals
                  </Text>
                </Group>
              </Button>
            </Group>
          </Section>
        </Group>
      </>
    );
  }
}

export default CartForm;
