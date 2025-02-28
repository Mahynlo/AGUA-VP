import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    useDisclosure,
    Select,
    SelectItem,
} from "@nextui-org/react";

import { AgregarClienteIcon } from "../../../IconsApp/IconsSidebar";

export default function RegistrarClientes() {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const pueblos = [
        { key: "Nacori Grande", label: "Nacori Grande" },
        { key: "Matape", label: "Matape" },
        { key: "Adivino", label: "Adivino" },

    ];
    return (
        <>

            <Button  aria-label="Editar" color="primary" className="ml-2 min-w-[50px] px-8 py-2" onPress={onOpen} >
                <AgregarClienteIcon />
                Nuevo Cliente
            </Button>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" backdrop="transparent"
                classNames={{
                    header: "dark:border-b-[1px] border-[#292f] border-b-[1px] border-gray-100 ",
                    footer: "dark:border-t-[1px] border-[#292f46] border-t-[1px] border-gray-100 "
                   
                }}
             >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-2xl font-bold text-gray-900 dark:text-white">Registrar Cliente</ModalHeader>
                            <ModalBody>
                                
                                <form>
                                    <div class="grid gap-6 mb-6 md:grid-cols-2 mt-2">
                                        <div>
                                            <label for="first_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombres</label>
                                            <input type="text" id="first_name" class="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="John" required />
                                        </div>
                                        <div>
                                            <label for="last_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Apellidos</label>
                                            <input type="text" id="last_name" class="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Doe" required />
                                        </div>
                                        <div>
                                            <label for="pueblo" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white ">Pueblo</label>
                                            <Select
                                                className="border rounded-xl border-gray-300 dark:border-gray-700"

                                                color="default"
                                                aria-label="Pueblo"
                                            >

                                                {pueblos.map((pueblo) => (
                                                    <SelectItem key={pueblo.key}>{pueblo.label}</SelectItem>
                                                ))}
                                            </Select>
                                        </div>
                                        <div>
                                            <label for="phone" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Phone number</label>
                                            <input type="tel" id="phone" className="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="123-45-678" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}" required />
                                        </div>
                                        <div class="mb-6">
                                            <label for="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email address</label>
                                            <input type="email" id="email" className="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="john.doe@company.com" required />
                                        </div>

                                        <div>
                                            <label for="visitors" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Direccion</label>
                                            <input type="number" id="visitors" className="bg-gray-50 border border-gray-400 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" required />
                                        </div>

                                    </div>



                                    <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-xl text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Registrar</button>
                                </form>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="" className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-xl text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>

                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
