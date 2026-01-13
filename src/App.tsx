import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./i18n";
import "./App.scss";
import router from "./routes/routes";

function App() {
  return (
    <>
      <Suspense fallback="loading">
        <ToastContainer />
        <RouterProvider router={router} />
      </Suspense>
      a
    </>
  );
}

export default App;
