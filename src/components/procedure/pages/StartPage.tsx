import React from "react";
import { ContinueButton } from "./ContinueButton";

interface StartPageProps {
  onNext: (direction: number) => void;
}

interface StartPageState {
  id: string;
}

export class StartPage extends React.Component<StartPageProps, StartPageState> {
  constructor(props: StartPageProps) {
    super(props);
    this.state = {
      id: "",
    };
  }
  handleContinue = () => {
    this.props.onNext(1);
  };

  handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    this.setState({ id: value });
    localStorage.setItem("id", JSON.stringify(value));
  };

  render() {
    return (
      <div className="flex items-center justify-center flex-col pt-40 w-screen font-notoSans text-slate-800 text-xl">
        <span className="pb-3">Enter Participant ID:</span>
        <div className="text-base">
          <input
            type="text"
            name="participantId"
            className="border-2 border-black w-[100px] p-1.5 rounded-sm"
            value={this.state.id}
            onChange={(event) => this.handleInputChange(event)}
          />
        </div>
        <br />
        <br />
        <ContinueButton onNext={this.props.onNext} />
      </div>
    );
  }
}
