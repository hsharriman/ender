import React from "react";

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
        <button
          onClick={this.handleContinue}
          className="bg-green-500 hover:bg-green-700 text-2xl text-white font-bold py-2 pl-2 pr-3 rounded-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-7 mr-2">
            <polygon
              strokeWidth={2}
              points="10,8 26,18 10,28"
              className="fill-current text-white"
            />
          </svg>
          Continue
        </button>
      </div>
    );
  }
}
