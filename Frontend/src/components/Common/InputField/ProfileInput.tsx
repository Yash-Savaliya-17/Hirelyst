import React from 'react';

interface ProfileInputProps {
    name: string;
    id: string;
    formData: {
        [key: string]: any;
    };
    handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isEditing: boolean;
    icon?: React.ReactNode;
    className?: string; 
}

const ProfileInput: React.FC<ProfileInputProps> = ({
    name,
    id,
    formData,
    handleChange,
    isEditing,
    icon,
    className = '', 
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            <label htmlFor={id} className="block text-sm font-manrope font-medium">
                {name}
            </label>
            <div className={id === 'address' ? 'relative sm: w-full  sm:w-[90%]' : 'sm:w-[80%] w-full relative'}>
                <input
                    type="text"
                    id={id}
                    name={id}
                    value={formData[id] || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder={`Enter your ${name.toLowerCase()}`}
                    className={`w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-5 py-3 focus:outline-none focus:ring-1 focus:ring-blue-800 ${className}`} // Merge with user-provided className
                />
                {icon && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileInput;
