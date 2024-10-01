import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Examples } from "./routes/Examples";
import { Home } from "./routes/Home";
import { Procedure } from "./routes/Procedure";

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
    path: "/ender/procedure",
    element: <Procedure />,
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
