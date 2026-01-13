import {
	Route,
	createBrowserRouter,
	createRoutesFromElements,
	redirect,
} from "react-router-dom";
import LoginFlow from "../components/Login";


const router = createBrowserRouter([
	// Public routes
	{
		path: "/",
		//element: <PublicLayout />, // Layout for public pages (optional)
		children: [
			{
				path: "/",
				element: <LoginFlow />,
			}
		]
	}])
	
export default router;
