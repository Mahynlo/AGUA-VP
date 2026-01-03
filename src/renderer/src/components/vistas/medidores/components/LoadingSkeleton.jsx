import { Card, CardBody, CardHeader, Skeleton, Divider } from "@nextui-org/react";

const LoadingSkeleton = () => (
    <div className="h-full w-full"> {/* Adjusted container to fit inside Tab */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2">
                <Card className="h-[750px]">
                    <CardHeader>
                        <Skeleton className="w-48 h-6 rounded-lg" />
                    </CardHeader>
                    <CardBody className="p-4">
                        <Skeleton className="w-full h-full rounded-lg" />
                    </CardBody>
                </Card>
            </div>
            <div className="flex flex-col h-[750px]">
                <Card className="h-full">
                    <CardHeader>
                        <Skeleton className="w-40 h-6 rounded-lg" />
                    </CardHeader>
                    <CardBody className="space-y-4 h-full flex flex-col">
                        <div className="space-y-3 flex-none">
                            <Skeleton className="w-full h-10 rounded-lg" />
                            <Skeleton className="w-full h-10 rounded-lg" />
                        </div>
                        <Divider />
                        <div className="space-y-3 flex-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Card key={i} className="border">
                                    <CardBody className="p-3">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-8 h-8 rounded-full" />
                                            <div className="flex-1 space-y-1">
                                                <Skeleton className="w-3/4 h-4 rounded-lg" />
                                                <Skeleton className="w-1/2 h-3 rounded-lg" />
                                            </div>
                                            <Skeleton className="w-12 h-6 rounded-lg" />
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    </div>
);

export default LoadingSkeleton;
