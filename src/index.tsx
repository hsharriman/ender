import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Examples } from "./interface/routes/Examples";
import { ProofObjHarness } from "./interface/routes/ProofObjHarness";

const router = createBrowserRouter([
  {
    path: "/ender",
    element: <Examples />,
  },
  // {
  //   path: "/ender/examples",
  //   element: <Examples />,
  // },
  {
    path: "/ender/harness",
    element: <ProofObjHarness />,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
