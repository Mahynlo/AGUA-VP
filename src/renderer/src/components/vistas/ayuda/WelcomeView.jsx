import React from "react";
import {
  Card,
  CardBody,
  Button,
  Chip
} from "@nextui-org/react";
import {
  HiBookOpen
} from "react-icons/hi";

const WelcomeView = ({ sections, sectionIcons, navegarA }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardBody className="text-center py-12">
          <HiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Bienvenido al Centro de Ayuda
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Selecciona una sección en el menú lateral para comenzar a explorar la documentación.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-lg mx-auto">
            {Object.entries(sections).map(([sectionKey, files]) => {
              const sectionConfig = sectionIcons[sectionKey];
              return (
                <Button
                  key={sectionKey}
                  variant="flat"
                  color={sectionConfig.color}
                  className="flex flex-col items-center p-4 h-auto"
                  onPress={() => {
                    if (files.length > 0) {
                      navegarA(sectionKey, files[0].fileName);
                    }
                  }}
                >
                  {sectionConfig.icon}
                  <span className="mt-2 text-sm">{sectionConfig.title}</span>
                  <Chip size="sm" variant="flat" color={sectionConfig.color} className="mt-1">
                    {files.length}
                  </Chip>
                </Button>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default WelcomeView;
