
import logoagua from '../../assets/images/logo_login.png'
import imagenLogin from '../../assets/images/LoginPrueba.jpg'
import imagenLogin2 from '../../assets/images/LoginPrueba2.jpg'
import imagenLogin3 from '../../assets/images/LoginPrueba3.jpg'
import { Avatar, Button, FloatingLabel, Carousel } from "flowbite-react";
function LoginApp() {
    return (
        <section class="flex flex-col md:flex-row h-screen items-center">

            <div className="bg-gray-300 dark:bg-indigo-800 hidden lg:block w-full md:w-1/2 xl:w-2/3 h-screen">
                <Carousel slideInterval={5000} className="h-full">
                    <img
                        src={imagenLogin}
                        alt="Logo"
                        className="w-full h-full object-contain"
                    />
                    <img
                        src={imagenLogin2}
                        alt="Logo"
                        className="w-full h-full object-contain"
                    />
                    <img
                        src={imagenLogin3}
                        alt="Logo"
                        className="w-full h-full object-contain"
                    />
                </Carousel>
            </div>


            <div class="bg-white dark:bg-gray-800 w-full md:max-w-md lg:max-w-full md:mx-auto md:mx-0 md:w-1/2 xl:w-1/3 h-screen px-6 lg:px-16 xl:px-12 flex items-center justify-center">

                <div class="w-full h-100">
                    <Avatar img={logoagua} size="xl" />

                    <h1 class="text-xl md:text-2xl font-bold leading-tight mt-12 text-black dark:text-white">Iniciar Secion</h1>

                    <form class="mt-6" action="#" method="POST">
                        <div>
                            <FloatingLabel variant="standard" label="Correo" />
                        </div>

                        <div class="mt-5">
                            <FloatingLabel variant="standard" label="Contraseña" type="password" />
                        </div>

                        <div class="text-right mt-2">
                            <a href="#" class="text-sm font-semibold text-gray-700 dark:text-gray-200 dark:hover:text-blue-700 hover:text-blue-700 focus:text-blue-700">Forgot Password?</a>

                        </div>

                        <Button color="blue" className="w-full py-3 mt-6">
                            Iniciar Secion
                        </Button>
                    </form>


                    <hr class="my-6 border-gray-300 w-full" />
                    



                </div>
            </div>

        </section>



    )
}

export default LoginApp;