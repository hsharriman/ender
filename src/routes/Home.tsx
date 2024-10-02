import React from "react";
import { NavLink } from "react-router-dom";
import ender from "../assets/ender.png";

export class Home extends React.Component {
  render() {
    return (
      <div>
        <div className="absolute top-0 left-0 my-3 mx-5 w-auto h-auto flex flex-row gap-3">
          <img src={ender} className="w-12 h-auto" />
          <div className="text-base self-center text-violet-500 font-bold">
            Ender
          </div>
        </div>
        <div className="flex w-screen h-screen justify-center items-center">
          <div className="flex flex-row w-[1100px] h-32 justify-center">
            <NavLink
              to="/ender/examples"
              className="py-4 px-8 m-4 text-3xl bg-violet-300 rounded-md text-white flex items-center"
            >
              Examples
            </NavLink>

            <NavLink
              to="/ender/procedureA"
              className="py-4 px-8 m-4 text-3xl bg-violet-500 rounded-md text-white flex items-center"
            >
              Procedure A
            </NavLink>
            <NavLink
              to="/ender/procedureB"
              className="py-4 px-8 m-4 text-3xl bg-violet-500 rounded-md text-white flex items-center"
            >
              Procedure B
            </NavLink>
          </div>
        </div>
      </div>
    );
  }
}
