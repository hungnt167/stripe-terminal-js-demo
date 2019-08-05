import * as React from "react";

class Select extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.value };
  }

  onChange = e => {
    this.setState({ value: e.target.value });
    this.props.onChange(e.target.value);
  };

  render() {
    let {valueKey, labelKey} = this.props;

    if (!valueKey) {
      valueKey = 'value';
    }
    if (!labelKey) {
      labelKey = 'label';
    }
    const items = this.props.items.map((item, index) => (
      <option key={index} value={item[valueKey]}>
        {item[labelKey]}
      </option>
    ));

    return (
      <select value={this.state.value} onChange={this.onChange}>
        {items}
      </select>
    );
  }
}

export default Select;
