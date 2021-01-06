import React from "react";
import API from "src/API";
import ScrollToTop from "src/scrollToTop/ScrollToTop";
import Question, { IQuestion } from "./Question";
import "./questions.scss";

interface QuestionsProps {
  ident: string;
}

interface Set {
  name: string;
  startQuestionIndex: number;
  realNrQuestions: number;
  questions: IQuestion[];
}

interface QuestionsState {
  set: null | Set;
  currentQuestion: number;
  loadingTime: number;
  loadingDots: number;
  switching: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: null | any;
}

class Questions extends React.Component<QuestionsProps, QuestionsState> {
  constructor(props: QuestionsProps) {
    super(props);
    this.state = {
      set: null,
      currentQuestion: 0,
      loadingTime: 0,
      loadingDots: 0,
      switching: false,
      error: null,
    };

    this.loadSet();
  }

  protected async loadSet() {
    // Do api call
    const loadingStarted = new Date().getTime();

    const set = API.POST<Set>("api/set/load/" + this.props.ident);
    set.catch(e =>
      this.setState({
        error: e,
      })
    );

    await new Promise(x => setTimeout(x, 300));

    const setR = await set;
    document.title = setR.name;

    // Update state
    this.setState({
      set: setR,
      loadingTime: new Date().getTime() - loadingStarted,
    });
  }

  /**
   * Switch to the next question:
   * Handle switching animation and update ```this.currentQuestion```
   */
  public nextQuestion() {
    this.setState({
      switching: true,
    });
    // Fallback
    if (!("onanimationend" in window)) {
      setTimeout(
        () =>
          this.setState(oldState => ({
            currentQuestion: oldState.currentQuestion + 1,
            switching: false,
          })),
        1000
      );
    }
  }

  render() {
    if (this.state.error !== null) {
      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <div className="jumbotron bg-light-gray shadow">
              <h1 className="display-4">Oops!</h1>
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

    if (this.state.set === null) {
      setTimeout(
        () =>
          this.setState(oldState => ({
            loadingDots: oldState.loadingDots + 1,
          })),
        500
      );

      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <div className="jumbotron bg-light-gray shadow">
              <div className="spinner-border d-none d-sm-block float-right mt-5" />
              <h1 className="display-4">Los geht&apos;s!</h1>
              <p className="text-muted">Fragen werden geladen..{new Array(this.state.loadingDots).fill(".")}</p>
            </div>
          </div>
        </div>
      );
    }
    if (this.state.set.questions.length === this.state.currentQuestion) {
      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <div style={{ width: "100%", height: "3px" }}>
              <div style={{ width: "100%", height: "3px", backgroundColor: "#28a745" }} className="rounded-top" />
            </div>
            <div className="stage shadow jumbotron bg-light-gray pt-5 pb-1 mb-0">
              <h1 className="display-4">Fertig!</h1>
              <p className="text-muted">
                Danke, dass Du alle Fragen beantwortet hast :)
                <br />
                Du kannst die Ergebnisse <a href={"stats/" + this.props.ident}>hier</a> finden.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <ScrollToTop />
        <div className="p-3 p-md-5 container">
          {localStorage.getItem("anonym") !== "hide" && (
            <div className="col-md-8 mx-auto p-0">
              <div className="alert alert-info text-center alert-dismissible fade show align-center py-3 shadow-sm">
                Alle Angaben sind <b>anonym</b>.<br /><br />
                Es ist, sofern nicht anders angegenen, erlaubt, sich selbst zu wählen.
                <button
                  type="button"
                  className="close py-3"
                  onClick={() => {
                    localStorage.setItem("anonym", "hide");
                    this.forceUpdate();
                  }}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
            </div>
          )}
          <div className="col-md-8 mx-auto p-0">
            <Question
              onAnimationDone={() =>
                this.setState(oldState => ({
                  currentQuestion: oldState.currentQuestion + 1,
                  switching: false,
                }))
              }
              key={this.state.currentQuestion}
              first={this.state.loadingTime > 150 && this.state.currentQuestion === 0}
              switching={this.state.switching ? "out" : undefined}
              question={this.state.set.questions[this.state.currentQuestion]}
              onNextQuestion={() => this.nextQuestion()}
              index={this.state.set.startQuestionIndex + this.state.currentQuestion}
              nrQuestions={this.state.set.realNrQuestions}
            />
            {this.state.switching && this.state.set.questions.length > this.state.currentQuestion + 1 && <Question nrQuestions={this.state.set.realNrQuestions} index={this.state.set.startQuestionIndex + this.state.currentQuestion + 1} switching="in" question={this.state.set.questions[this.state.currentQuestion + 1]} />}
            {this.state.switching && this.state.set.questions.length === this.state.currentQuestion + 1 && (
              <div className="stage shadow switching in">
                <div style={{ width: "100%", height: "3px" }}>
                  <div style={{ width: "100%", height: "3px", backgroundColor: "#28a745" }} className="rounded-top" />
                </div>
                <div className="jumbotron bg-light-gray pt-5 pb-1 mb-0">
                  <h1 className="display-4">Fertig!</h1>
                  <p className="text-muted">
                    Danke, dass Du alle Fragen beantwortet hast :)
                    <br />
                    Du kannst die Ergebnisse <a href={"stats/" + this.props.ident}>hier</a> finden.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
}

export default Questions;
