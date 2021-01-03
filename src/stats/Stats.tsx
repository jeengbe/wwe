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

interface ISetStats {
  minAns: number;
  set: {
    name: string;
  };
  questions: ({
    title: string;
    answers: number;
    optNr: number;
    description?: string;
    options:
      | {
          option: {
            name: string;
          };
          count: number;
        }[]
      | "not enough data";
  } & XOR<IQuestionRange, IQuestionExactly>)[];
}

interface StatsState {
  stats: null | ISetStats;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: null | any;
  loadingTime: number;
}

class Stats extends React.Component<StatsProps, StatsState> {
  constructor(props: StatsProps) {
    super(props);
    this.state = {
      stats: null,
      error: null,
      loadingTime: 0,
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

    this.setState({
      stats: await stats,
      loadingTime: new Date().getTime() - loadingStarted,
    });
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
                Bitte <a href="mailto:jesper.engberg@gmx.at">melden</a>!
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
              <h1 className="display-4">Daten laden</h1>
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
        const q = question as IQuestionExactly;
        q.exactly = q.exactly === undefined ? 1 : q.exactly;
        selections = "Genau " + q.exactly + " Option" + (q.exactly === 1 ? "" : "en") + " wählbar.";
      } else {
        const q = question as IQuestionRange;

        q.min = q.min === undefined ? 1 : q.min;
        if (q.min !== 0) {
          if (q.max === undefined) {
            selections = "Mindestens " + q.min + " Option" + (q.min === 1 ? "" : "en") + " wählbar.";
          } else {
            selections = q.min + " bis " + q.max + " Optionen wählbar.";
          }
        } else {
          if (q.max === undefined) {
            selections = "Bis zu " + q.max + " Option" + (q.max === 1 ? "" : "en") + " wählbar.";
          } else {
            selections = "<p class='text-error'>Diese Bedingung sollte nicht erreicht werden können</p>";
          }
        }
      }

      return (
        <div key={question.title} className={"w-100 jumbotron py-4 shadow bg-white " + (index + 1 === this.state.stats?.questions.length ? "mb-0" : "")}>
          <h3 className="mb-3">{question.title}</h3>
          {question.description !== undefined && <p className="text-muted">{question.description}</p>}
          <p className="text-muted font-weight-light">{selections}</p>
          {question.options === "not enough data" ? (
            <p className="text-muted text-center mt-5">
              <abbr title={"Mindestens " + this.state.stats?.minAns + " Antwort" + (this.state.stats?.minAns !== 1 ? "en sind" : " ist") + " nötig, um Anonymität zu wahren."}>Nicht ausreichend Daten</abbr>
            </p>
          ) : (
            <>
              <Doughnut
                data={{
                  datasets: [
                    {
                      data: question.options.filter(op => op.count > 0).map(op => op.count),
                      backgroundColor: this.colors(question.options.filter(op => op.count > 0).length),
                    },
                  ],
                  labels: question.options.filter(op => op.count > 0).map(op => op.option.name),
                }}
              />
            </>
          )}
          <p className="figure-caption mt-3 text-right">
            {question.answers} Antwort{question.answers !== 1 ? "en" : ""}
            {question.optNr !== question.answers && (
              <>
                <br />
                {question.optNr} gewählte Option{question.answers !== 1 ? "en" : ""}
              </>
            )}
          </p>
        </div>
      );
    });

    return (
      <>
        <ScrollToTop />
        <div className="p-3 p-md-5 container">
          <div className="col-md-10 mx-auto p-0">
            <h1 className="w-100 display-4 mb-5 text-center">Statistiken von {this.state.stats.set.name}</h1>
            {questions}
          </div>
        </div>
      </>
    );
  }
}

export default Stats;
