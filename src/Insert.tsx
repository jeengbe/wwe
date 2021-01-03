import React, { FormEvent } from "react";
import API from "./API";
import ScrollToTop from "./scrollToTop/ScrollToTop";

interface ISet {
  name: string;
  questions: {
    title: string;
  }[];
}

interface InsertProps {
  ident: string;
}

interface InsertState {
  set: ISet | null;
  loadingTime: number;
  error: string | null;
}

class Insert extends React.Component<InsertProps, InsertState> {
  private questionRef: React.RefObject<HTMLInputElement> = React.createRef();

  constructor(props: InsertProps) {
    super(props);

    this.state = {
      set: null,
      loadingTime: 0,
      error: null,
    };

    this.loadSet();
  }

  protected async loadSet() {
    // Do api call
    const loadingStarted = new Date().getTime();

    const set = API.POST<ISet>("api/insert/question/set/" + this.props.ident);
    set.catch(e =>
      this.setState({
        error: e,
      })
    );

    await new Promise(x => setTimeout(x, 300));

    // Update state
    this.setState({
      set: await set,
      loadingTime: new Date().getTime() - loadingStarted,
    });
  }

  private submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (this.questionRef.current) {
      API.POST("api/insert/question/insert/" + this.props.ident, {
        question: this.questionRef.current.value,
      }).then(() => this.loadSet());
      this.questionRef.current.value = "";
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
                Bitte <a href="mailto:jesper.engberg@gmx.at">melden</a>!
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (this.state.set === null) {
      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <div className="jumbotron bg-light-gray shadow">
              <div className="spinner-border d-none d-sm-block float-right mt-5" />
              <h1 className="display-4">Geduld bitte!</h1>
              <p className="text-muted">Set wird geladen...</p>
            </div>
          </div>
        </div>
      );
    }

    const questions = this.state.set.questions.map(question => <h5 key={question.title}>{question.title}</h5>);

    return (
      <h4>
        <ScrollToTop />
        <div className="p-3 p-md-5 container">
          <div className="col-md-10 mx-auto p-0">
            <h1 className="w-100 display-4 text-center">Fragen für {this.state.set.name}</h1>
            <h4 className="mt-5">Frage hinzufügen:</h4>
            <form onSubmit={e => this.submit(e)}>
              <input className="form-control w-75 float-left" placeholder="Frage" ref={this.questionRef} />
              <button className="btn btn-success float-right" type="submit">
                Absenden
              </button>
            </form>
            <div className="clearfix" />
            <h4 className="mt-5">Fragen:</h4>
            {questions}
          </div>
        </div>
      </h4>
    );
  }
}

export default Insert;
