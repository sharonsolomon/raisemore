"use strict";

import { useState } from "react";
import { RadioGroup } from "@headlessui/react";
import { CreateOrganization, useAuth, useOrganization } from "@clerk/nextjs";
import request from "lib/request";
import SetCallerIDForm from "./SetCallerIDForm";
const classNames = (...classes) => classes.filter(Boolean).join(" ");

const orgTypeOptions = [
    { name: "Congressional campaign" },
    { name: "State legislature campaign" },
    { name: "Municipal campaign" },
    { name: "Statewide office" },
    { name: "Other federal campaign" },
    { name: "Nonprofit" },
    { name: "Other" },
];

const Onboarding = (props) => {
    const requirements = {
        hasOrg: <CreateOrgPrompt {...props} />,
        hasOrgType: <SetOrgType {...props} />,
        callerID: <SetCallerID {...props} />,
    };
    return requirements[Object.entries(props).find(([key, value]) => !value)[0]];
};
export default Onboarding;

const CreateOrgPrompt = (props) => (
    <div className="block min-h-full flex-col justify-center">
        <div className="sm:mx-auto w-75 mt-5">
            <CreateOrganization />
        </div>
    </div>
);

const SetOrgType = () => {
    const [orgTypeSelected, setSelectedOrgType] = useState(orgTypeOptions[0]);
    const { organization } = useOrganization();
    const changeOrgType = async (e) => {
        e.preventDefault();
        await request("/api/organization/updateMetadata", {
            type: orgTypeSelected?.name,
        });
        // we've updated the org type on the backend, so we need to force clerk to refresh
        await organization.reload();
    };
    return (
        <div className="block min-h-full flex-col justify-center sm:px-6 lg:px-8">
            <div className="sm:mx-auto w-75 mt-16">
                <h1>Your organization type?</h1>
                <p>We need this to tweak settings like maximum contribution per cycle.</p>
                <form onSubmit={changeOrgType}>
                    <RadioGroup
                        value={orgTypeSelected}
                        onChange={setSelectedOrgType}
                        className="mt-6"
                    >
                        <RadioGroup.Label className="sr-only">
                            Pricing orgTypeOptions
                        </RadioGroup.Label>
                        <div className="relative -space-y-px rounded-md bg-white">
                            {orgTypeOptions.map((option, optionIdx) => (
                                <RadioGroup.Option
                                    key={option?.name}
                                    value={option}
                                    className={({ checked }) =>
                                        classNames(
                                            optionIdx === 0 ? "rounded-tl-md rounded-tr-md" : "",
                                            optionIdx === orgTypeOptions.length - 1
                                                ? "rounded-bl-md rounded-br-md"
                                                : "",
                                            checked
                                                ? "z-10 border-blue-200 bg-blue-50"
                                                : "border-gray-200",
                                            "relative flex cursor-pointer flex-col border p-4 focus:outline-none md:grid md:grid-cols-2 md:pl-4 md:pr-6"
                                        )
                                    }
                                >
                                    {({ active, checked }) => (
                                        <>
                                            <span className="flex items-center text-sm">
                                                <span
                                                    className={classNames(
                                                        checked
                                                            ? "bg-blue-600 border-transparent"
                                                            : "bg-white border-gray-300",
                                                        active
                                                            ? "ring-2 ring-offset-2 ring-blue-600"
                                                            : "",
                                                        "h-4 w-4 rounded-full border flex items-center justify-center"
                                                    )}
                                                    aria-hidden="true"
                                                >
                                                    <span className="rounded-full bg-white w-1.5 h-1.5" />
                                                </span>
                                                <RadioGroup.Label
                                                    as="span"
                                                    className={classNames(
                                                        checked ? "text-blue-900" : "text-gray-900",
                                                        "ml-3 font-medium"
                                                    )}
                                                >
                                                    {option?.name}
                                                </RadioGroup.Label>
                                            </span>
                                            {/* <RadioGroup.Description
                                                as="span"
                                                className="ml-6 pl-1 text-sm md:ml-0 md:pl-0 md:text-center"
                                            >
                                                 <span
                                    className={classNames(
                                        checked
                                            ? "text-blue-900"
                                            : "text-gray-900",
                                        "font-medium"
                                    )}
                                >
                                    ${option?.priceMonthly} / mo
                                </span>{" "}
                                <span
                                    className={
                                        checked
                                            ? "text-blue-700"
                                            : "text-gray-500"
                                    }
                                >
                                    (${option?.priceYearly} / yr)
                                </span>
                                            </RadioGroup.Description> */}
                                            <RadioGroup.Description
                                                as="span"
                                                className={classNames(
                                                    checked ? "text-blue-700" : "text-gray-500",
                                                    "ml-6 pl-1 text-sm md:ml-0 md:pl-0 md:text-right"
                                                )}
                                            >
                                                {option?.limit}
                                            </RadioGroup.Description>
                                        </>
                                    )}
                                </RadioGroup.Option>
                            ))}
                        </div>
                    </RadioGroup>
                    {/* submit button */}
                    <button type="submit" className="btn-primary mt-6">
                        Next
                    </button>
                </form>
            </div>
        </div>
    );
};

const SetCallerID = () => (
    <div className="block min-h-full flex-col justify-center sm:px-6 lg:px-8">
        <div className="sm:mx-auto w-75 mt-16">
            <h1>Set your dialer caller ID</h1>
            <p>
                Pick an area code for your dialer caller ID. This is the number that will show up
                when you call donors.
            </p>
            <SetCallerIDForm submitButtonText="Set area code" />
        </div>
    </div>
);
