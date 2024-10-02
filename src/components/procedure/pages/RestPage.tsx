import React from "react";
import { logEvent } from "../../../core/testinfra/testUtils";

interface RestPageProps {
  onNext: (direction: number) => void;
}

interface RestPageStates {
  timeLeft: number;
  isTimeUp: boolean;
  formattedTime: string;
  animateButton: boolean;
}

export class RestPage extends React.Component<RestPageProps, RestPageStates> {
  timer: NodeJS.Timeout | null;

  constructor(props: RestPageProps) {
    super(props);
    this.state = {
      timeLeft: 180, // 3 minutes in seconds
      isTimeUp: false,
      formattedTime: this.formatTime(180),
      animateButton: false,
    };
    this.timer = null;
  }

  componentDidMount() {
    this.timer = setInterval(this.countDown, 1000);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  countDown = () => {
    this.setState((prevState) => {
      if (prevState.timeLeft > 1) {
        return {
          timeLeft: prevState.timeLeft - 1,
          formattedTime: this.formatTime(prevState.timeLeft - 1),
          isTimeUp: false,
          animateButton: false,
        };
      } else {
        if (this.timer) {
          clearInterval(this.timer);
        }
        return {
          timeLeft: 0,
          isTimeUp: true,
          formattedTime: "00:00",
          animateButton: true,
        };
      }
    });
  };

  handleContinue = () => {
    logEvent("n", {
      c: "i",
      v: "",
    });
    this.props.onNext(1);
  };

  render() {
    const buttonClasses = `bg-green-500 hover:bg-green-700 text-4xl text-white font-bold py-3 px-5 rounded-lg flex items-center justify-center transition-transform duration-100 ${
      this.state.animateButton
        ? "bg-red-500 hover:bg-red-700 animate-pulse"
        : "bg-green-500 hover:bg-green-700"
    }`;

    return (
      <div className="flex items-center justify-center flex-col pt-40 w-screen font-notoSans text-slate-800 text-xl">
        <span>
          Congratulations, you're more than halfway through the experiment! :)
        </span>
        <p className="max-w-[900px] text-center">
          <br />
          Now, you can choose to relax for 3 minutes, get some water, go to the
          bathroom, or walk around.
        </p>
        <br />
        <p className="max-w-[900px] text-center">
          Or you can continue with the experiment.
        </p>
        <br />

        <p className="max-w-[900px] text-center">
          In the next section, you will be asked to check if there are any
          mistakes in a proof. Again, some of the proofs will have a static
          layout and others will be interactive.
        </p>
        <br />

        <div className="text-3xl font-bold">
          Time Left: {this.state.formattedTime}
        </div>
        <br />
        <button onClick={this.handleContinue} className={buttonClasses}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-2">
            <polygon
              strokeWidth={2}
              points="10,5 34,20 10,35"
              className="fill-current text-white"
            />
          </svg>
          Continue
        </button>
      </div>
    );
  }
}
