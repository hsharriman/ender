import React from "react";

export class SubmitQuestion extends React.Component {
  render() {
    return (
      <div className="font-bold text-base mt-4 text-slate-50">
        <button className="bg-[#9459d4] hover:bg-[#7644ad] focus:bg-[#623691] py-1.5 px-2 rounded-md">
          Submit
        </button>
      </div>
    )
  }
}