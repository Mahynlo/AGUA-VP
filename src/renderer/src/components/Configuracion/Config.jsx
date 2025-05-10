import ModoTema from "../temaApp/modoTema";
import {
    Card, CardBody,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    useDisclosure,
    Tooltip
} from "@nextui-org/react";
import { ConfiguracionIcon } from "../../IconsApp/IconsAppSystem";

export function Config() {

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return (
        <>
            <Tooltip content="Configuracion" delay={2000}>
                <Button onPress={onOpen} radius="full" variant="light" className="text-gray-200" isIconOnly ><ConfiguracionIcon className="" /></Button>
            </Tooltip>


            <Drawer
                isOpen={isOpen}
                backdrop="transparent"
                onOpenChange={onOpenChange}
                classNames={{
                    base: " top-[80px] rounded-medium",
                }}
            >
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="text-2xl font-bold text-gray-900 dark:text-white"><ConfiguracionIcon /> Configuaracion</DrawerHeader>
                            <DrawerBody>


                                <Card className="w-80 mt-2 block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow  dark:bg-gray-800 dark:border-gray-700 ">
                                    <CardBody>
                                        <p className="text-xl">Tema de Aplicacion

                                        </p>
                                    </CardBody>
                                    <ModoTema />
                                </Card>

                                <Card className="w-80 mt-2 block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow  dark:bg-gray-800 dark:border-gray-700 ">
                                    <CardBody>
                                        <p className="text-xl">Info Aplicacion</p>
                                        v 1.1.4
                                      
                                    </CardBody>
                                </Card>
                               
                            </DrawerBody>
                            <DrawerFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>

                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );


}

