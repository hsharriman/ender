import React from "react";
import { NavLink } from "react-router-dom";
import ender from "../assets/ender.png";

export class Home extends React.Component {
  render() {
    return (
      <div>
        <div
          className="sticky top-0 left-0 p-3 h-10 z-30 flex bg-gradient-to-r from-violet-500 via-30% via-blue-500"
          id="header"
        >
          <NavLink to={"/ender"} className="px-3 text-sm h-8">
            <img src={ender} className="h-12 w-auto shadow-sm" />
          </NavLink>
          <div className="text-white italic tracking-widest">Ender</div>
        </div>
        <div className="flex w-screen h-screen justify-center items-center">
          <div className="flex flex-row w-[1100px] h-32 justify-center">
            <NavLink
              to="/ender/examples"
              className="py-4 px-8 m-4 text-3xl bg-blue-700 rounded-lg text-white flex items-center"
            >
              Examples
            </NavLink>

            <NavLink
              to="/ender/procedures"
              className="py-4 px-8 m-4 text-3xl border-4 border-blue-500 rounded-lg text-blue-500 flex items-center"
            >
              Experiment Procedure
            </NavLink>
          </div>
        </div>
      </div>
    );
  }
}
