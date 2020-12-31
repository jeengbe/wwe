import React from "react";

export interface StatsProps {
  ident: string;
}

export interface StatsState {

}

class Stats extends React.Component<StatsProps, StatsState> {
  constructor(props: StatsProps) {
    super(props);
  }

  render(): JSX.Element {
    return <h1>Hi!</h1>;
  }
}

export default Stats;