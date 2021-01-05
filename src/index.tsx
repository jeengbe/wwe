import React from "react";
import ReactDOM from "react-dom";
import Questions from "./questions/Questions";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./index.scss";
import Stats from "./stats/Stats";
import Insert from "./Insert";

export const API_BASE = "https://wwe.localhost/";

interface AppState {}

interface Path {
  path: string;
  handle: (path: string[]) => JSX.Element;
}

class App extends React.Component<{}, AppState> {
  private readonly paths: Path[] = [
    {
      path: "stats/_",
      handle: path => <Stats ident={path[1]} />,
    },
    {
      path: "insert/_",
      handle: path => <Insert ident={path[1]} />,
    },
    {
      path: "_",
      handle: path => <Questions ident={path[0]} />,
    },
  ];

  render(): JSX.Element {
    const path = location.pathname.substr(1).split("/");
    let handle: null | Path["handle"] = null as Path["handle"] | null;

    try {
      this.paths.forEach((p: Path) => {
        const ps = p.path.split("/");
        for (let i = 0; i < ps.length; i++) {
          if (path[i] === undefined || (ps[i] !== "_" && path[i] !== ps[i])) {
            return;
          }
        }
        handle = p.handle;
        throw new Error("Site found!");
      });
    } catch (expected) {
      console.log((expected as Error).message);
    }

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

(window as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Chart: any;
} & typeof window &
  typeof globalThis).Chart.defaults.global.defaultFontFamily = "'Nunito', sans-serif";
