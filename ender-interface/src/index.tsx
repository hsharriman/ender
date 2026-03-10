import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import {
  ProcedureA,
  ProcedureB,
  ProcedureHome,
} from "./components/procedure/ProcedureHome";
import "./index.css";
import { Examples } from "./routes/Examples";
import { Home } from "./routes/Home";

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
  {
    path: "/ender/procedures",
    element: <ProcedureHome />,
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
