import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./i18n";
import "./App.scss";
import router from "./routes/routes";
import { AuthProvider } from "./contexts/authContext";

function App() {
  return (
    <>
      <Suspense fallback="loading">
        <AuthProvider>
          <ToastContainer />
          <RouterProvider router={router} />
        </AuthProvider>
      </Suspense>
    </>
  );
}

export default App;
