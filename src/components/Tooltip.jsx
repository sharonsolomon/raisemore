import { useId, useState } from "react";
// export default function Tooltip({ title, children }) {
//     const id = useId();

//     return (
//         <>
//             <div data-tooltip-target={`tooltip-${id}`}>{children}</div>
//             <div
//                 id={`tooltip-${id}`}
//                 role="tooltip"
//                 class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
//             >
//                 {title}
//                 <div class="tooltip-arrow" data-popper-arrow></div>
//             </div>
//         </>
//     );
// }

const Tooltip = ({ title, children, delay = 400, direction = null }) => {
    let timeout;
    const [active, setActive] = useState(false);

    const showTip = () => {
        timeout = setTimeout(() => {
            setActive(true);
        }, delay || 400);
    };

    const hideTip = () => {
        clearInterval(timeout);
        setActive(false);
    };

    return (
        <div className="Tooltip-Wrapper" onMouseEnter={showTip} onMouseLeave={hideTip}>
            {children}
            {active && <div className={`Tooltip-Tip ${direction ?? "top"}`}>{title}</div>}
        </div>
    );
};

export default Tooltip;
