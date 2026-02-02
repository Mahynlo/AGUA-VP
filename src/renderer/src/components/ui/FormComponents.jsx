import React from "react";

// Componente de Input Personalizado con Validaciones
export const CustomInput = ({
    label,
    value,
    onChange,
    icon,
    type = "text",
    color = "blue",
    description,
    min,
    max,
    placeholder,
    suffix,
    isInvalid,
    errorMessage,
    isValid,
    required,
    className
}) => {
    // Definir colores de borde y foco según estado
    const getBorderClass = () => {
        if (isInvalid) return "border-red-500 focus:ring-red-500 focus:border-red-500";
        if (isValid) return "border-green-500 focus:ring-green-500 focus:border-green-500";
        return `border-gray-300 focus:ring-${color}-600 focus:border-${color}-500`;
    };

    return (
        <div className={className}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative w-full flex">
                {icon && (
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-2 pr-2">
                        {icon}
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    className={`border text-gray-600 rounded-xl ${icon ? 'pl-12' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'} py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all ${getBorderClass()}`}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium text-sm pointer-events-none">
                        {suffix}
                    </span>
                )}
            </div>
            {isInvalid && errorMessage && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errorMessage}</p>
            )}
            {!isInvalid && description && (
                <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
        </div>
    );
};

// Componente de Textarea Personalizado con Validaciones
export const CustomTextarea = ({
    label,
    value,
    onChange,
    icon,
    color = "blue",
    description,
    minRows = 3,
    isInvalid,
    errorMessage,
    isValid,
    required,
    placeholder,
    className
}) => {
    const getBorderClass = () => {
        if (isInvalid) return "border-red-500 focus:ring-red-500 focus:border-red-500";
        if (isValid) return "border-green-500 focus:ring-green-500 focus:border-green-500";
        return `border-gray-300 focus:ring-${color}-600 focus:border-${color}-500`;
    };

    return (
        <div className={className}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative w-full flex items-start">
                {icon && (
                    <span className={`absolute left-2 top-3 text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600 py-1 pr-2 z-10`}>
                        {icon}
                    </span>
                )}
                <textarea
                    value={value}
                    onChange={onChange}
                    rows={minRows}
                    placeholder={placeholder}
                    className={`border text-gray-600 rounded-xl ${icon ? 'pl-12' : 'pl-4'} pr-4 py-2 w-full focus:outline-none focus:ring-2 dark:bg-neutral-800 dark:hover:bg-neutral-600 hover:bg-neutral-200 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all resize-none ${getBorderClass()}`}
                />
            </div>
            {isInvalid && errorMessage && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errorMessage}</p>
            )}
            {!isInvalid && description && (
                <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
        </div>
    );
};
