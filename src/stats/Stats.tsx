import React from "react";
import { Doughnut } from "react-chartjs-2";
import API from "src/API";

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
  set: {
    name: string;
  };
  questions: ({
    title: string;
    answers: number;
    description?: string;
    options: {
      option: {
        name: string;
      };
      count: number;
    }[];
  } & XOR<IQuestionRange, IQuestionExactly>)[];
}

interface StatsState {
  stats: null | ISetStats;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: null | any;
  loadingTime: number;
}

class Stats extends React.Component<StatsProps, StatsState> {
  private comingo = false;

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
    const minS = 30;
    const maxS = 50;
    const minL = 60;
    const maxL = 80;
    this.h += Math.floor(Math.random() * 35) + 15;
    if (this.h > 255) {
      this.h %= 255;
    }

    return "hsl(" + this.h + "," + (Math.floor(Math.random() * (maxS - minS)) + minS) + "%," + (Math.floor(Math.random() * (maxL - minL)) + minL) + "%)";
  }

  /**
   * Genrate random colors
   */
  public colors(length: number): string[] {
    const r: string[] = [];
    for (let i = 0; i < length; i++) {
      let c;
      do {
        c = this.color();
        console.log(c);
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
    if (this.comingo) {
      return (
        <>
          <h1 className="display-4 text-center mt-5">Comingo Sooningo</h1>
          <p className="text-muted text-center">Stay tuned.</p>
        </>
      );
    } else {
      if (this.state.error !== null) {
        return (
          <div className="p-3 p-md-5 container">
            <div className="col-md-8 mx-auto p-0">
              <div className="jumbotron shadow">
                <h1 className="display-4">Uh-Oh!</h1>
                <p className="text-muted">
                  An error occured whilst loading the page: <span className="text-danger">{this.state.error.toString()}</span>
                </p>
                <p className="text-muted">
                  Please <a href="mailto:jesper.engberg@gmx.at">report this</a>!
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
              <div className="jumbotron bg-white shadow">
                <div className="spinner-border d-none d-sm-block float-right mt-5" />
                <h1 className="display-4">Fetching data</h1>
                <p className="text-muted">Hang on, this may take a second.</p>
              </div>
            </div>
          </div>
        );
      }

      const questions = this.state.stats.questions.map((question, index) => (
        <div key={question.title} className={"w-100 jumbotron shadow bg-white " + (index + 1 === this.state.stats?.questions.length ? "mb-0" : "")}>
          <h3>{question.title}</h3>
          {question.options.length === 0 ? (
            <p className="text-muted text-center mt-5">No Data</p>
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
              <p className="figure-caption mt-3 text-right">{question.answers} answers</p>
            </>
          )}
        </div>
      ));

      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <h1 className="w-100 display-4 mb-5 text-center">Statistics for {this.state.stats.set.name}</h1>
            {questions}
          </div>
        </div>
      );
    }
  }
}

export default Stats;
