const InsetInput = ({ label, placeholder = "", className = "", disabled = false, ...props }) => (
    <div className={"relative mt-6 " + className}>
        <label
            htmlFor={props?.name || label}
            className={
                "absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900 bg-opacity-70 "
            }
        >
            {label}
        </label>
        <input
            type="text"
            name={props?.name || label}
            id={props?.name || label}
            className={
                "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 " +
                (disabled && "bg-gray-100")
            }
            placeholder={placeholder}
            disabled={disabled}
            {...props}
        />
    </div>
);
export default InsetInput;
