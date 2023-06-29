import {createBrowserRouter} from "react-router-dom";
import App from "./App";
import Home from "./home.jsx";
import Register from "./Register.jsx";
import Resolve from "./Resolve.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: "/",
                element: <Home/>
            },
            {
                path: "/resolve",
                element: <Resolve/>
            },
            {
                path: "/register",
                element: <Register/>
            }
        ]
    }
])

export default router
