//@flow

import * as React from "react";

import Button from "../components/Button/Button.jsx";
import Group from "../components/Group/Group.jsx";
import Icon from "../components/Icon/Icon.jsx";
import Section from "../components/Section/Section.jsx";
import Text from "../components/Text/Text.jsx";
import TextInput from "../components/TextInput/TextInput";
import "./CommonWorkflows.css";

class CommonWorkflows extends React.Component {
  render() {
    const {
      onClickCancelPayment,
      cancelablePayment,
      workFlowDisabled,
      newCustomer,
      onChangeNewCustomer,
      onClickCreateNewCustomer,
      hasCustomer
    } = this.props;
    return (
      <Section>
        <Group direction="column" spacing={16}>
          <Text size={16} color="dark">
            Common workflows
          </Text>
          <Group direction="column" spacing={8}>
            <Button
              color="white"
              onClick={this.props.onClickCreatePaymentIntent}
              disabled={workFlowDisabled || !hasCustomer}
              justifyContent="left"
            >
              <Group direction="row">
                <Icon icon="payments"/>
                <Text color="blue" size={14}>
                  Create Payment Intent
                </Text>
              </Group>
            </Button>
            {/*<Button*/}
              {/*color="white"*/}
              {/*onClick={this.props.onClickCollectCardPayments}*/}
              {/*disabled={workFlowDisabled}*/}
              {/*justifyContent="left"*/}
            {/*>*/}
              {/*<Group direction="row">*/}
                {/*<Icon icon="payments"/>*/}
                {/*<Text color="blue" size={14}>*/}
                  {/*Collect card payment*/}
                {/*</Text>*/}
              {/*</Group>*/}
            {/*</Button>*/}
            <Button
              color="white"
              onClick={this.props.onClickSaveCardForFutureUse}
              disabled={workFlowDisabled || !hasCustomer}
              justifyContent="left"
            >
              <Group direction="row">
                <Icon icon="card"/>
                <Text color="blue" size={14}>
                  Save card for future use
                </Text>
              </Group>
            </Button>
            <Button
              color="white"
              onClick={onClickCancelPayment}
              disabled={!cancelablePayment}
              justifyContent="left"
            >
              <Group direction="row">
                <Icon icon="cancel"/>
                <Text color="blue" size={14}>
                  Cancel payment
                </Text>
              </Group>
            </Button>
          </Group>
          <Group
            direction="row"
            alignment={{
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <form className="common-workflow-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onClickCreateNewCustomer();
                  }}
            >
              <TextInput
                required
                type={"email"}
                placeholder="Enter customer email..."
                value={newCustomer}
                onChange={onChangeNewCustomer}
              />
              <Button
                disabled={workFlowDisabled}
                color="white"
                justifyContent="left"
              >
                <Group direction="row">
                  <Icon icon="refresh"/>
                  <Text color="blue" size={14}>
                    Create
                  </Text>
                </Group>
              </Button>
            </form>
          </Group>
        </Group>
      </Section>
    );
  }
}

export default CommonWorkflows;
