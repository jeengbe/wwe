import React from "react";
import { Doughnut } from "react-chartjs-2";
import API from "src/API";
import ScrollToTop from "src/scrollToTop/ScrollToTop";

interface StatsProps {
  ident: string;
}

interface IQuestionRange {
  min?: number;
  max?: number;
}

interface IQuestionExactly {
  exactly?: number;
}

type Question = {
  title: string;
  answers: number;
  optNr: number;
  description?: string;
  group: boolean;
} & XOR<IQuestionRange, IQuestionExactly> & {
    options: "not enough data";
  } & (
    | {
        group: true;
        options: {
          group: {
            label: string;
            count: number;
          }[];
          standard: {
            label: string;
            count: number;
          }[];
        };
      }
    | {
        group: false;
        options: {
          label: string;
          count: number;
        }[];
      }
  );

interface ISetStats {
  minAns: number;
  set: {
    name: string;
  };
  questions: Question[];
  email: boolean;
}

interface StatsState {
  stats: null | ISetStats;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: null | any;
  loadingTime: number;
  showGroups: number[];
  email: boolean;
}

class Stats extends React.Component<StatsProps, StatsState> {
  private emailRef = React.createRef<HTMLInputElement>();

  protected hints: {
    chartClick: boolean;
  } = {
    chartClick: false,
  };

  constructor(props: StatsProps) {
    super(props);
    this.state = {
      stats: null,
      error: null,
      loadingTime: 0,
      showGroups: [],
      email: false,
    };

    this.loadStats();
  }

  public h = 0;
  /**
   * Genrate a random color
   */
  public color(): string {
    const minS = 40;
    const maxS = 60;
    const minL = 60;
    const maxL = 90;
    this.h += Math.floor(Math.random() * 25) + 15;
    if (this.h > 360) {
      this.h %= 360;
    }

    return "hsl(" + this.h + "," + (Math.floor(Math.random() * (maxS - minS)) + minS) + "%," + (Math.floor(Math.random() * (maxL - minL)) + minL) + "%)";
  }

  /**
   * Genrate random colors
   */
  public colors(length: number): string[] {
    const r: string[] = [];
    this.h = Math.floor(Math.random() * 360);
    for (let i = 0; i < length; i++) {
      let c;
      do {
        c = this.color();
      } while (r.includes(c));
      r.push(c);
    }
    return r;
  }

  protected async loadStats() {
    const loadingStarted = new Date().getTime();

    const stats = API.POST<ISetStats>("api/stats/" + this.props.ident);
    stats.catch(e =>
      this.setState({
        error: e,
      })
    );

    await new Promise(x => setTimeout(x, 300));

    const statsR = await stats;
    document.title = "Stats: " + statsR.set.name;

    this.setState({
      stats: statsR,
      showGroups: statsR.questions
        .map((q, index) => ({ ...q, index: index }))
        .filter(q => q.group)
        .map(q => q.index),
      loadingTime: new Date().getTime() - loadingStarted,
      email: statsR.email,
    });
  }

  protected toggleShowGroups(index: number) {
    this.setState(oldState => ({
      showGroups: oldState.showGroups.includes(index) ? oldState.showGroups.filter(el => el !== index) : [...oldState.showGroups, index],
    }));
  }

  private submitEmail() {
    if (this.emailRef.current !== null) {
      API.POST("api/stats/email/" + this.props.ident, { email: this.emailRef.current.value });
      this.setState({
        email: true,
      });
    }
  }

  render(): JSX.Element {
    if (this.state.error !== null) {
      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <div className="jumbotron bg-light-gray shadow">
              <h1 className="display-4">Oh-Oh!</h1>
              <p className="text-muted">
                Beim Laden der Seite ist ein Fehler aufgetreten: <span className="text-danger">{this.state.error.toString()}</span>
              </p>
              <p className="text-muted">
                Bitte <a href={"mailto:jesper.engberg@gmx.at?subject=Error: " + encodeURIComponent(this.state.error.toString())}>melden</a>!
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.stats === null) {
      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <div className="jumbotron bg-light-gray shadow">
              <div className="spinner-border d-none d-sm-block float-right mt-5" />
              <h1 className="display-4">Daten werden geladen</h1>
              <p className="text-muted">Etwas Geduld bitte, dies kann einen Moment dauern.</p>
            </div>
          </div>
        </div>
      );
    }

    const questions = this.state.stats.questions.map((question, index) => {
      // Formulate selections
      let selections;
      if ((question as IQuestionExactly).exactly !== undefined) {
        const q = { ...question } as IQuestionExactly;
        q.exactly = q.exactly === undefined ? 1 : q.exactly;
        selections = "Genau " + q.exactly + " Option" + (q.exactly === 1 ? "" : "en") + " wählbar.";
      } else {
        const q = { ...question } as IQuestionRange;

        if (q.min !== undefined) {
          if (q.max === undefined) {
            selections = "Mindestens " + q.min + " Option" + (q.min === 1 ? "" : "en") + " wählbar.";
          } else {
            selections = q.min + " bis " + q.max + " Optionen wählbar.";
          }
        } else {
          if (q.max === undefined) {
            selections = "1 bis " + q.max + " Option" + (q.max === 1 ? "" : "en") + " wählbar.";
          } else {
            selections = "Mindestens 1 Option wählbar.";
          }
        }
      }

      let graph: JSX.Element;
      if (question.options === "not enough data") {
        graph = (
          <p className="text-muted text-center mt-5">
            <abbr title={"Mindestens " + this.state.stats?.minAns + " Antwort" + (this.state.stats?.minAns !== 1 ? "en sind" : " ist") + " nötig, um Anonymität zu wahren."}>Nicht ausreichend Daten</abbr>
          </p>
        );
      } else if (question.group === true) {
        graph = (
          <>
            <Doughnut
              data={{
                datasets: [
                  {
                    data: question.options[this.state.showGroups.includes(index) ? "group" : "standard"].map(op => op.count),
                    backgroundColor: this.colors(question.options.group.length),
                  },
                ],
                labels: question.options[this.state.showGroups.includes(index) ? "group" : "standard"].map(op => op.label),
              }}
            />
            <button className="btn btn-primary float-left mt-5" onClick={() => this.toggleShowGroups(index)}>
              Gruppierungen {this.state.showGroups.includes(index) ? "ausblenden" : "anzeigen"}
            </button>
          </>
        );
      } else {
        graph = (
          <Doughnut
            data={{
              datasets: [
                {
                  data: question.options.map(op => op.count),
                  backgroundColor: this.colors(question.options.length),
                },
              ],
              labels: question.options.map(op => op.label),
            }}
          />
        );
      }

      return (
        <div key={question.title} className={"w-100 jumbotron py-4 shadow bg-white " + (index + 1 === this.state.stats?.questions.length ? "mb-0" : "")}>
          <h3 className="mb-3">{question.title}</h3>
          {question.description !== undefined && <p className="text-muted">{question.description}</p>}
          <p className="text-muted font-weight-light">{selections}</p>
          {graph}
          <p className="figure-caption mt-5 float-right">
            {question.answers} Antwort{question.answers !== 1 ? "en" : ""}
            {((question as IQuestionExactly).exactly !== undefined ? question.optNr !== ((question as IQuestionExactly).exactly || 0) * question.answers : question.optNr !== question.answers) && (
              <>
                <br />
                {question.optNr} gewählte Option{question.optNr !== 1 ? "en" : ""}
              </>
            )}
          </p>
          <div className="clearfix" />
          {((question as IQuestionExactly).exactly !== undefined ? question.optNr !== ((question as IQuestionExactly).exactly || 0) * question.answers : question.optNr !== question.answers) && localStorage.getItem("answersDifferentShown") !== "hide" && (
            <div className="alert alert-info text-center alert-dismissible fade show align-center py-3 mt-3">
              <b>Antworten</b> ist die Anzahl an Personen, die geantwortet haben, <b>gewählte Optionen</b> ist die Anzahl an gesamten gewählten Optionen.
              <button
                type="button"
                className="close py-3"
                onClick={() => {
                  localStorage.setItem("answersDifferentShown", "hide");
                  this.forceUpdate();
                }}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          )}
        </div>
      );
    });

    return (
      <>
        <ScrollToTop />
        <div className="p-3 p-md-5 container">
          <div className="col-md-10 mx-auto p-0">
            <h1 className="w-100 display-4 mb-5 text-center">Statistiken für {this.state.stats.set.name}</h1>
            {this.state.stats.questions.filter(q => q.options === "not enough data").length > 0 && !this.state.email && (
              <div className="jumbotron bg-white shadow">
                <h5>Ich möchte benachrichtigt werden, wenn ausreichend Daten für eine Auswertung vorhanden sind:</h5>
                <div className="form-row">
                  <div className="col-8 col-md-9 col-lg-10">
                    <input type="email" autoComplete="email" className="form-control" ref={this.emailRef} placeholder="E-Mail-Adresse" />
                  </div>
                  <div className="col-4 col-md-3 col-lg-2">
                    <button className="btn btn-success w-100" onClick={() => this.submitEmail()}>
                      Absenden
                    </button>
                  </div>
                </div>
              </div>
            )}
            {localStorage.getItem("chartClick") !== "hide" && (
              <div className="alert alert-info text-center alert-dismissible fade show align-center py-3 shadow-sm">
                Abschnitte der Diagramme können angeklickt werden, um den Datensatz mitsamt absolutem Wert anzuzeigen.
                <button
                  type="button"
                  className="close py-3"
                  onClick={() => {
                    localStorage.setItem("chartClick", "hide");
                    this.forceUpdate();
                  }}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
            )}
            {questions}
          </div>
        </div>
      </>
    );
  }
}

export default Stats;
