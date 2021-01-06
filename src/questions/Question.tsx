import classNames from "classnames";
import Fuse from "fuse.js";
import isMobile from "is-mobile";
import React from "react";
import API from "src/API";

export interface Option {
  ident: string;
  selected: boolean;
  name: string;
}

interface IQuestionRange {
  min?: number;
  max?: number;
}

interface IQuestionExactly {
  exactly?: number;
}

export type IQuestion = {
  title: string;
  description?: string;
  options: Option[];
  ident: string;
  // skippable?: boolean;
  // text?: boolean;
} & XOR<IQuestionRange, IQuestionExactly>;

interface QuestionProps {
  question: IQuestion;
  first?: boolean;
  onNextQuestion?: () => void;
  onAnimationDone?: () => void;
  switching?: "out" | "in";
  nrQuestions: number;
  index: number;
}

interface QuestionState {
  filterText: string;
  selectedIndices: number[];
  nope: boolean;
}

class Question extends React.Component<QuestionProps, QuestionState> {
  private filterRef: React.RefObject<HTMLInputElement> = React.createRef();
  private btnNextRef: React.RefObject<HTMLButtonElement> = React.createRef();

  private readonly optionsIndexed: (Option & { index: number })[];

  constructor(props: QuestionProps) {
    super(props);

    this.optionsIndexed = this.props.question.options.map((op, index) => ({
      ...op,
      index: index,
    }));

    this.state = {
      filterText: "",
      selectedIndices: [...this.optionsIndexed].filter(op => op.selected).map(op => op.index),
      nope: false,
    };
  }

  /**
   * Toggle the option by the specified index
   * @param index The option's index determined by its index in ```this.props.question.options```
   */
  protected toggleOption(index: number) {
    if (!this.state.selectedIndices.includes(index) && this.isMax()) {
      this.setState({
        nope: true,
      });
      // Don't you dare edit this!
      // Backend may break :(
    }

    if (this.filterRef.current !== null) {
      this.filterRef.current.value = "";
    }

    API.POST("api/questions/option/" + this.props.question.ident + "/" + this.props.question.options[index].ident, {
      status: !this.state.selectedIndices.includes(index) ? "1" : "0",
    });

    this.setState(oldState => ({
      filterText: oldState.selectedIndices.includes(index) ? oldState.filterText : "",
      selectedIndices: oldState.selectedIndices.includes(index) ? oldState.selectedIndices.filter(i => i !== index) : [...oldState.selectedIndices, index],
    }));
  }

  /**
   * Update ```this.state.filterText``` to the current filter input
   */
  protected filterInput() {
    if (this.filterRef.current !== null) {
      this.setState({
        filterText: this.filterRef.current.value,
      });
    }
  }

  /**
   * Returns whether a valid number of options have been selected
   */
  protected isValidSelection() {
    const question = this.props.question;
    if ((question as IQuestionExactly).exactly !== undefined) {
      const q = { ...question } as IQuestionExactly;
      return this.state.selectedIndices.length === q.exactly;
    }

    const q = { ...question } as IQuestionRange;
    q.min = q.min === undefined ? 1 : q.min;
    return this.state.selectedIndices.length >= q.min && (q.max === undefined ? true : this.state.selectedIndices.length <= q.max);
  }

  /**
   * Returns whether the maximum number of options has been selected and more must not be selected
   */
  protected isMax() {
    const question = this.props.question;
    if ((question as IQuestionExactly).exactly !== undefined) {
      const q = { ...question } as IQuestionExactly;
      return this.state.selectedIndices.length === q.exactly;
    }

    const q = { ...question } as IQuestionRange;
    return q.max === undefined ? false : this.state.selectedIndices.length === q.max;
  }

  componentDidUpdate() {
    if (this.props.switching === undefined) {
      if (this.isValidSelection()) {
        if (this.filterRef?.current !== document.activeElement && !isMobile()) {
          this.btnNextRef?.current?.focus();
        }
      } else {
        this.filterRef?.current?.focus();
      }
    }
  }

  protected nextQuestion() {
    API.POST("api/questions/next/" + this.props.question.ident);
    if (this.props.onNextQuestion !== undefined) {
      this.props.onNextQuestion();
    }
  }

  render() {
    if (this.state.nope) {
      return (
        <div className="p-3 p-md-5 container">
          <div className="col-md-8 mx-auto p-0">
            <div className="jumbotron bg-light-gray shadow">
              <h1 className="display-4 text-center">Nope</h1>
            </div>
          </div>
        </div>
      );
    }

    const question = this.props.question;

    // Formulate selections
    let selections;
    if ((question as IQuestionExactly).exactly !== undefined) {
      const q = { ...question } as IQuestionExactly;
      q.exactly = q.exactly === undefined ? 1 : q.exactly;
      selections = "Wähle " + q.exactly + " Option" + (q.exactly === 1 ? "" : "en") + ".";
    } else {
      const q = { ...question } as IQuestionRange;

      if (q.min !== undefined) {
        if (q.max === undefined) {
          selections = "Wähle mindestens " + q.min + " Option" + (q.min === 1 ? "" : "en") + ".";
        } else {
          selections = "Wähle " + q.min + " bis " + q.max + " Optionen.";
        }
      } else {
        if (q.max !== undefined) {
          selections = "Wähle 1 bis " + q.max + " Option" + (q.max === 1 ? "" : "en") + ".";
        } else {
          selections = "Wähle mindestens 1 Option.";
        }
      }
    }

    // Add index and filter options
    let optionsFiltered;

    if (this.state.filterText.length === 0) {
      optionsFiltered = [...this.optionsIndexed].sort((a, b) => (this.state.selectedIndices.includes(b.index) ? 1 : this.state.selectedIndices.includes(a.index) ? -1 : 0));
    } else {
      optionsFiltered = new Fuse(this.optionsIndexed, {
        threshold: 0.3,
        keys: ["name"],
      })
        .search(this.state.filterText)
        .map(searchResult => searchResult.item);
    }

    // Render Question
    const classes = classNames({
      question: true,
      stage: true,
      first: this.props.first,
      switching: this.props.switching !== undefined,
      out: this.props.switching === "out",
      in: this.props.switching === "in",
    });

    const valid = this.isValidSelection();
    const enough = this.isMax();

    return (
      <div className={classes} onAnimationEnd={this.props.switching === undefined ? undefined : this.props.onAnimationDone}>
        <button disabled={!valid} ref={this.btnNextRef} className={"shadow w-100 btn btn-" + (valid ? "success" : "secondary")} onClick={valid ? () => this.nextQuestion() : undefined} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, transition: "all .3s" }}>
          {valid ? (this.state.selectedIndices.length === 0 ? "Überspringen" : "Weiter") : "Weiter"}
        </button>
        <div style={{ width: "100%", height: "3px" }}>
          <div style={{ width: (100 / this.props.nrQuestions) * this.props.index + "%", height: "3px", backgroundColor: "#28a745", borderBottomRightRadius: ".175rem" }} />
        </div>
        <div className="jumbotron shadow bg-light-gray pt-5 pb-1 mb-0 rounded-0">
          <h2>{question.title}</h2>
          {question.description !== undefined && <p className="text-muted" dangerouslySetInnerHTML={{ __html: question.description }}></p>}
          <p className="text-muted font-weight-light pt-4" style={{ fontSize: "0.85rem" }}>
            {selections}
          </p>
        </div>
        <ul className="list-group shadow list-group-flush rounded-bottom" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <li className="list-group-item p-0" style={{ borderBottomWidth: "2px" }}>
            <div className="input-group has-search">
              <input className="form-control rounded-0 border-0" autoFocus={this.props.switching === undefined} placeholder="Filter" style={{ padding: "0.75rem 1.25rem", outline: "none" }} ref={this.filterRef} onInput={() => this.filterInput()} />
              <span className="fa fa-search search" />
            </div>
          </li>
          {optionsFiltered.map(option => (
            <label key={option.name} className="list-group-item mb-0 pt-3" style={{ cursor: "pointer" }}>
              <div className="form-check">
                <input type="checkbox" className="form-check-input" disabled={this.props.switching !== undefined || (!this.state.selectedIndices.includes(option.index) && enough)} checked={this.state.selectedIndices.includes(option.index)} onChange={() => this.toggleOption(option.index)} />
                <span className="notranslate form-check-label">{option.name}</span>
              </div>
            </label>
          ))}
          {optionsFiltered.length === 0 && <li className="list-group-item disabled py-1">Keine Treffer</li>}
        </ul>
      </div>
    );
  }
}

export default Question;
