import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Examples } from "./routes/Examples";
import { Home } from "./routes/Home";
import { ProcedureA } from "./routes/ProcedureA";
import { ProcedureB } from "./routes/ProcedureB";

const router = createBrowserRouter([
  {
    path: "/ender",
    element: <Home />,
  },
  {
    path: "/ender/examples",
    element: <Examples />,
  },
  {
    path: "/ender/procedureA",
    element: <ProcedureA />,
  },
  {
    path: "/ender/procedureB",
    element: <ProcedureB />,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
