
import { Link } from "react-router-dom";

export default function RecuperarPassword() {
    return (
        <div className="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
            <h1>Recuperar Password</h1>
            <div className="text-right mt-2">
                <Link to="/" className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-700">
                    Regresar
                </Link>
            </div>
        </div>
    )
}