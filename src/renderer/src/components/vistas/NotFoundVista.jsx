import { Link, useNavigate } from "react-router-dom";
import { Button } from "@nextui-org/react";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";
const NotFoundVista = () => {
    const navigate = useNavigate(); // Hook de navegación

    return (
        <div className="bg-gray-200 dark:bg-gray-900 w-full px-16 md:px-0 h-screen flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center px-4 md:px-8 lg:px-24 py-8 rounded-lg shadow-2xl">
                <p className="text-6xl md:text-7xl lg:text-9xl font-bold tracking-wider text-gray-300 dark:text-gray-400">404</p>
                <p className="text-2xl md:text-3xl lg:text-5xl font-bold tracking-wider text-gray-500 dark:text-gray-300 mt-4">Page Not Found</p>
                <p className="text-gray-500 dark:text-gray-300 mt-4 pb-4 border-b-2 dark:border-gray-500 text-center">
                    Sorry, the page you are looking for could not be found.
                </p>

                <Button
                    as={Link}
                    to="/home"
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-gray-100 dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-gray-200 px-4 py-2 mt-6 rounded transition duration-150"
                >
                    <FlechaReturnIcon className="w-6 h-6" />
                    Return Home
                </Button>
                <Button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-gray-100 dark:bg-blue-500 dark:hover:bg-blue-600 dark:text-gray-200 px-4 py-2 mt-6 rounded transition duration-150"
                >
                    <FlechaReturnIcon className="w-6 h-6" />
                    Return to Previous Page
                </Button>
            </div>
        </div>
    );
};

export default NotFoundVista;
