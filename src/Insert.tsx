import React from "react";
import API from "./API";

class Insert extends React.Component {
  private i: React.RefObject<HTMLInputElement> = React.createRef();

  private submit() {
    if (this.i.current) {
      API.POST("api/insert", {
        q: this.i.current.value,
      });
      this.i.current.value = "";
      alert("Success");
    }
  }

  render() {
    return (
      <div className="p-3 p-md-5 container">
        <div className="col-md-8 mx-auto p-0">
          <input className="form-control w-75 float-left" ref={this.i} placeholder="Frage" />
          <button className="btn btn-success w-25 float-right" onClick={() => this.submit()}>
            Einsenden
          </button>
        </div>
      </div>
    );
  }
}

export default Insert;
