import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { DatasetProof } from "./interface/routes/DatasetProof";
import { Examples } from "./interface/routes/Examples";
import { Home } from "./interface/routes/Home";
import { ProofObjHarnessRoute } from "./interface/routes/ProofObjHarness";

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
    path: "/ender/harness",
    element: <ProofObjHarnessRoute />,
  },
  {
    path: "/ender/dataset/*",
    element: <DatasetProof />,
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
