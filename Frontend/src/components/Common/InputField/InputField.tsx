import React, { useState, forwardRef } from 'react';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import correct from "@/assets/correct.png";
import deleteIcon from "@/assets/delete.png";

interface InputProps {
  className?: string;
  type: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  name: string;
  svg?: JSX.Element;
  id?: string
}

const InputField = forwardRef<HTMLInputElement, InputProps>(({
  className,
  type,
  placeholder,
  value,
  id,
  onChange,
  name,
  svg
}, ref) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isPasswordType = type === 'password';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (onChange) {
      onChange(e);
    }

    if (type === 'email') {
      const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
      setIsEmailValid(emailRegex.test(newValue));
    }
  };

  return (
    <div className="flex flex-col justify-center w-full">
      <div className="relative flex items-center">
        <div className='flex flex-col w-full space-y-1'>
          <label htmlFor={id} className="block font-semibold text-sm font-manrope">
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </label>
          <input
            ref={ref}
            className={`w-full font-manrope text-black placeholder:text-gray-500 rounded-lg border border-gray-200 text-sm pl-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-800 ${className}`}
            value={inputValue}
            name={name}
            onChange={handleInputChange}
            type={isPasswordType && showPassword ? 'text' : type}
            placeholder={placeholder}
          />
        </div>
        {type === 'email' && inputValue.length > 0 && (
          <img
            src={isEmailValid ? correct : deleteIcon}
            alt={isEmailValid ? "correct" : "delete"}
            className="absolute right-3 top-[70%] transform -translate-y-1/2"
            style={{ width: '16px', height: '16px' }}
          />
        )}
        {isPasswordType && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-[70%] transform -translate-y-1/2 text-gray-600 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <IoMdEye size={18} />
            ) : (
              <IoMdEyeOff size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
});

export default InputField;
