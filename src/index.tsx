import React from "react";
import ReactDOM from "react-dom";
import Questions from "./questions/Questions";
import "bootstrap/dist/css/bootstrap.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.scss";
import Stats from "./stats/Stats";

export const API_BASE = "http://localhost:83/";
// export const API_BASE = "https://h2880126.stratoserver.net/";

interface AppState {}

interface Path {
  path: string;
  handle: (path: string[]) => JSX.Element;
}

class App extends React.Component<{}, AppState> {
  private readonly paths: Path[] = [
    {
      path: "_",
      handle: path => <Questions ident={path[0]} />,
    },
    {
      path: "stats/_",
      handle: path => <Stats ident={path[1]} />,
    },
  ];

  render(): JSX.Element {
    const path = location.pathname.substr(1).split("/");
    let handle: null | Path["handle"] = null as Path["handle"] | null;

    this.paths.forEach((p: Path) => {
      const ps = p.path.split("/");
      for (let i = 0; i < ps.length; i++) {
        if (path[i] === undefined || (ps[i] !== "_" && path[i] !== ps[i])) {
          return;
        }
      }
      handle = p.handle;
    });

    if (handle !== null) {
      return handle(path);
    }
    return <h1>General Kenobi!</h1>;
  }
}

const appMount = () => {
  ReactDOM.render(<App />, document.getElementById("app"));
  window.scrollTo(0, 0);
};

appMount();

window.addEventListener("popstate", e => {
  alert("pop");
  appMount();
  e.preventDefault();
});
