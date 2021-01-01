import React from "react";
import "./scrollToTop.scss";

interface ScrollToTopProps {}

interface ScrollToTopState {
  show: boolean;
}

class ScrollToTop extends React.Component<ScrollToTopProps, ScrollToTopState> {
  private readonly threshold: number = 50;
  private readonly scrollListener: () => void = (): void =>
    this.setState({
      show: window.scrollY > this.threshold,
    });

  constructor(props: ScrollToTopProps) {
    super(props);
    this.state = {
      show: window.scrollY > this.threshold,
    };
  }

  private scrollTop(): void {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  public componentDidMount(): void {
    window.addEventListener("scroll", this.scrollListener);
  }

  public componentWillUnmount(): void {
    window.removeEventListener("scroll", this.scrollListener);
  }

  render() {
    return (
      <button className={"scrollToTop" + (this.state.show ? " show" : "")} onClick={() => this.scrollTop()}>
        <i className="fas fa-arrow-up" />
      </button>
    );
  }
}

export default ScrollToTop;
