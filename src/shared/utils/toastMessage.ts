import { toast, Bounce } from "react-toastify";

export const notify = ({
  message,
  type,
}: {
  message: string;
  type: "info" | "success" | "warning" | "error";
}) =>
  toast[type](message, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    transition: Bounce,
  });