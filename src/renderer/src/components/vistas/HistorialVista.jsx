import { Link, useNavigate } from "react-router-dom";
import { Button, Timeline } from "flowbite-react";
import { HiArrowNarrowRight, HiCalendar } from "react-icons/hi";
import { FlechaReturnIcon } from "../../IconsApp/IconsAppSystem";

const Historial = () => {
  const navigate = useNavigate(); // Hook de navegación
  return (
    <div class="mt-16 h-[calc(100vh-4rem)] overflow-auto p-4 sm:ml-64">
      <div className="w-full h-full bg-white overflow-x-hidden gap-4 p-4 rounded-lg shadow-md dark:bg-gray-800">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          <Button color="gray" className="mb-4" onClick={() => navigate(-1)}>
            <FlechaReturnIcon className="w-6 h-6" />
            <span className="mr-2">Volver</span>
          </Button>
          Historial de Actividades
        </div>

        <Timeline className="mt-4 p-4 gap-4">
          <Timeline.Item>
            <Timeline.Point icon={HiCalendar} />
            <Timeline.Content>
              <Timeline.Time>February 2022</Timeline.Time>
              <Timeline.Title>Application UI code in Tailwind CSS</Timeline.Title>
              <Timeline.Body>
                Get access to over 20+ pages including a dashboard layout, charts, kanban board, calendar, and pre-order
                E-commerce & Marketing pages.
              </Timeline.Body>
              <Button color="gray">
                Learn More
                <HiArrowNarrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Timeline.Content>
          </Timeline.Item>
          <Timeline.Item>
            <Timeline.Point icon={HiCalendar} />
            <Timeline.Content>
              <Timeline.Time>March 2022</Timeline.Time>
              <Timeline.Title>Marketing UI design in Figma</Timeline.Title>
              <Timeline.Body>
                All of the pages and components are first designed in Figma and we keep a parity between the two versions
                even as we update the project.
              </Timeline.Body>
            </Timeline.Content>
          </Timeline.Item>
          <Timeline.Item>
            <Timeline.Point icon={HiCalendar} />
            <Timeline.Content>
              <Timeline.Time>April 2022</Timeline.Time>
              <Timeline.Title>E-Commerce UI code in Tailwind CSS</Timeline.Title>
              <Timeline.Body>
                Get started with dozens of web components and interactive elements built on top of Tailwind CSS.
              </Timeline.Body>
            </Timeline.Content>
          </Timeline.Item>
        </Timeline>
      </div>

    </div>
  )
};

export default Historial;
