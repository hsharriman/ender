import React from "react";
import { NavLink } from "react-router-dom";
import { PageType } from "../../core/testinfra/pageOrder";
import { Procedure } from "./Procedure";
import { SubmitButton } from "./questions/SubmitButton";

interface ProcedureHomeState {
  id: string;
  showProcedures: boolean;
}
export class ProcedureHome extends React.Component<{}, ProcedureHomeState> {
  constructor(props: any) {
    super(props);
    this.state = {
      id: JSON.parse(localStorage.getItem("id") || ""),
      showProcedures: false,
    };
  }

  handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    this.setState({ id: value });
    localStorage.setItem("id", JSON.stringify(value));
  };

  handleSubmit = () => {
    if (!this.state.showProcedures) {
      this.setState({ showProcedures: true });
    }
  };

  render() {
    return (
      <div className="flex items-center justify-center flex-col pt-40 w-screen font-notoSans text-slate-800 text-xl">
        <div className="flex flex-row items-baseline gap-2">
          <div className="font-bold">Enter Participant ID:</div>
          <input
            type="text"
            name="participantId"
            className="border-2 border-black w-[200px] p-1.5 rounded-md mr-2"
            value={this.state.id}
            onChange={(event) => this.handleInputChange(event)}
          />
          <SubmitButton
            disabled={this.state.id === ""}
            onClick={this.handleSubmit}
          />
        </div>
        {this.state.showProcedures && (
          <div className="flex flex-row h-24 justify-center mt-8">
            <NavLink
              to="/ender/procedureA"
              className="py-2 px-4 m-4 text-xl border-4 border-blue-500 rounded-lg text-blue-500 flex items-center"
            >
              Procedure A
            </NavLink>
            <NavLink
              to="/ender/procedureB"
              className="py-2 px-4 m-4 text-xl border-4 border-blue-300 rounded-lg text-blue-300 flex items-center"
            >
              Procedure B
            </NavLink>
          </div>
        )}
      </div>
    );
  }
}

export const ProcedureB = () => {
  return <Procedure type={PageType.Static} />;
};

export const ProcedureA = () => {
  return <Procedure type={PageType.Interactive} />;
};
