
import RegistroApp from "../registroUsuarios/Registro"
import { Tabs, Tab, Chip} from "@nextui-org/react";

export default function Administrador() {
    return (
        <div class="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
                Administrador
            </div>
            <RegistroApp />
            

        </div>
    )
}