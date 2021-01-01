import React from "react";
import API from "src/API";
import ScrollToTop from "src/scrollToTop/ScrollToTop";
import Question, { IQuestion } from "./Question";
import "./questions.scss";

interface QuestionsProps {
  ident: string;
}

interface QuestionsState {
  questions: null | IQuestion[];
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
      questions: null,
      currentQuestion: 0,
      loadingTime: 0,
      loadingDots: 0,
      switching: false,
      error: null,
    };

    this.loadQuestions();
  }

  protected async loadQuestions() {
    // Do api call
    const loadingStarted = new Date().getTime();

    const questions = API.POST<IQuestion[]>("api/questions/list/" + this.props.ident);
    questions.catch(e =>
      this.setState({
        error: e,
      })
    );

    await new Promise(x => setTimeout(x, 300));

    // Update state
    this.setState({
      questions: await questions,
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
            <div className="jumbotron bg-white shadow">
              <h1 className="display-4">Whoops!</h1>
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

    if (this.state.questions === null) {
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
            <div className="jumbotron bg-white shadow">
              <div className="spinner-border d-none d-sm-block float-right mt-5" />
              <h1 className="display-4">Booting up</h1>
              <p className="text-muted">Loading Questions..{new Array(this.state.loadingDots).fill(".")}</p>
            </div>
          </div>
        </div>
      );
    }
    if (this.state.questions.length === this.state.currentQuestion) {
      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <div className="stage shadow jumbotron bg-white pt-5 pb-1 mb-0">
              <h1 className="display-4">Done!</h1>
              <p className="text-muted">
                Thank you for answering the questions :)
                <br />
                You can find the results <a href={"stats/" + this.props.ident}>here</a>.
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
              question={this.state.questions[this.state.currentQuestion]}
              onNextQuestion={() => this.nextQuestion()}
            />
            {this.state.switching && this.state.questions.length > this.state.currentQuestion + 1 && <Question switching="in" question={this.state.questions[this.state.currentQuestion + 1]} />}
            {this.state.switching && this.state.questions.length === this.state.currentQuestion + 1 && (
              <div className="stage shadow switching in">
                <div className="jumbotron pt-5 pb-1 mb-0">
                  <h1 className="display-4">Done!</h1>
                  <p className="text-muted">
                    Thank you for answering the questions :)
                    <br />
                    You can find the results <a href={"stats/" + this.props.ident}>here</a>.
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
