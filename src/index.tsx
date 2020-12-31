import React from "react";
import ReactDOM from "react-dom";
import Questions from "./Questions";
import "bootstrap/dist/css/bootstrap.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.scss";

export const API_BASE = "http://localhost:83/";

interface AppState {}

class App extends React.Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
  }

  render(): JSX.Element {
    const path = location.pathname.substr(1).split("/");

    if (path.length === 1) {
      return <Questions ident={path[0]} />;
    } else if (path.length === 2) {
      switch (path[0]) {
        case "stats":
          // return <Stats ident={path[1]} />;
          return <div className="container">
            <div className="mt-5 mx-auto">
              <h1 className="text-center display-1">Coming Soon</h1>
            </div>
          </div>;
      }
    }
    return <h1>Invalid link!</h1>;
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
