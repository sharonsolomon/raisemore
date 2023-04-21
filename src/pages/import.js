import { useState, useEffect } from "react";
import { randomUUID } from "lib/randomUUID-polyfill";
import { CheckIcon } from "@heroicons/react/24/solid";
import { RadioGroup } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { useOrganization } from "@clerk/nextjs";
// import { FilePond } from "react-filepond";
// import "filepond/dist/filepond.min.css";
import { useSupabase } from "lib/supabaseHooks";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import PageTitle from "components/Layout/PageTitle";

export default function Import() {
    const [step, setStep] = useState(1);
    const [importType, setImportType] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);

    const nextStep = () => {
        if (step != 3) setStep(step + 1);
        if (step === 3) {
            setUploadResult(null);
            setImportType(null);
            setStep(1);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-2">
            <Breadcrumbs
                pages={[
                    {
                        name: "Import",
                        href: "/import",
                        current: true,
                    },
                ]}
            />{" "}
            <PageTitle
                title="Import"
                descriptor="Import donors, donation history, prospects, and pledges."
            />
            <Steps step={step} />
            {step == 1 && <Choices importType={importType} setImportType={setImportType} />}
            {step == 2 && (
                <Uploaders
                    importType={importType}
                    nextStep={nextStep}
                    setUploadResult={setUploadResult}
                />
            )}
            {step == 3 && <Results uploadResult={uploadResult} />}
            {/* A next step button */}
            {step !== 2 && (
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={nextStep}
                    disabled={!importType && "disabled"}
                >
                    {step == 3 ? "Upload another file" : "Next step"}
                </button>
            )}
        </div>
    );
}

const Results = ({ uploadResult }) => (
    <div className="">
        <div className="mx-auto max-w-7xl px-2 my-6 ">
            <h2>File upload results:</h2>
            <div>
                {uploadResult ? JSON.stringify(uploadResult, 0, 2) : "File still processing..."}
            </div>
        </div>
    </div>
);

const Uploaders = ({ importType, nextStep, setUploadResult }) => {
    const supabase = useSupabase();
    const { organization } = useOrganization();
    const server = (apiRoute) => ({
        process: (file, load) => {
            console.log("start process", file);
            console.time("upload and process");

            // Create a root reference
            var filepath = `${[Date.now().toString(), randomUUID(), organization.id].join(
                "_"
            )}.csv`;

            // Supabase upload!
            supabase.storage
                .from("imports")
                .upload(filepath, file, {
                    cacheControl: "3600",
                    upsert: false,
                })
                .then(({ data, error }) => {
                    console.log(data, error);
                    console.log("File available at", data.path);
                    // load("done");

                    let fileProcessRequest = fetch(
                        "/api/import/" + apiRoute + "?fileName=" + encodeURIComponent(data.path)
                    );

                    nextStep();

                    fileProcessRequest
                        .then((res) => res.text())
                        .then((data) => {
                            console.log(data);
                            console.timeEnd("upload and process");
                            setUploadResult(data);
                        });
                });

            // Should expose an abort method so the request can be cancelled
            return {
                // abort: () => {
                //     // This function is entered if the user has tapped the cancel button
                //     request.abort();
                //     // Let FilePond know the request has been cancelled
                //     abort();
                // },
            };
        },
    });
    const loadDonationsCSV = server("donations");
    const loadProspectsCSV = server("pledges");
    const loadPledgesCSV = server("pledges");
    return (
        <>
            {importType == "donations" && (
                <div>
                    <div className="mx-auto max-w-7xl px-2 ">
                        <h2 className="mt-8 mb-0">
                            Upload your Actblue alltime donations file to sync: (
                            <a
                                href="https://support.actblue.com/campaigns/the-dashboard/download-contribution-data/#downloads"
                                className="text-blue-700 underline"
                            >
                                actblue guide
                            </a>
                            )
                        </h2>
                        <div className="md:grid md:grid-cols-2">
                            <div className="col-span-1">
                                <FilePond
                                    allowMultiple={false}
                                    allowRevert={false}
                                    maxFiles={1}
                                    server={loadDonationsCSV}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {importType == "prospects" && (
                <div className="">
                    <div className="mx-auto max-w-7xl px-2 ">
                        <h2 className="mt-8 mb-0">Upload a prospect file for donor research:</h2>
                        <p className="font-light">
                            (required: first_name, last_name, and phone; other fields: zip, email,
                            bio, tags (comma seperated)){" "}
                        </p>
                        <div className="md:grid md:grid-cols-2">
                            <div className="col-span-1">
                                <FilePond
                                    allowMultiple={false}
                                    allowRevert={false}
                                    maxFiles={1}
                                    server={loadProspectsCSV}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {importType == "pledges" && (
                <div className="">
                    <div className="mx-auto max-w-7xl px-2 ">
                        <h2 className="mt-8 mb-0">Upload pledges</h2>
                        <p className="font-light">
                            (required: first_name, last_name, zip, amount){" "}
                        </p>
                        <div className="md:grid md:grid-cols-2">
                            <div className="col-span-1">
                                <FilePond
                                    allowMultiple={false}
                                    allowRevert={false}
                                    maxFiles={1}
                                    server={loadPledgesCSV}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

const steps = [
    { id: 1, name: "Select import type", href: "#", status: "current" },
    { id: 2, name: "Import file", href: "#", status: "upcoming" },
    { id: 3, name: "View results", href: "#", status: "upcoming" },
];

function Steps({ step: currentStepNum }) {
    return (
        <nav aria-label="Progress">
            <ol
                role="list"
                className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0 bg-white"
            >
                {steps.map((step, stepIdx) => (
                    <li key={step.name} className="relative md:flex md:flex-1">
                        {Number(step.id) < currentStepNum ? (
                            <a href={step.href} className="group flex w-full items-center">
                                <span className="flex items-center px-6 py-4 text-sm font-medium">
                                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                                        <CheckIcon
                                            className="h-6 w-6 text-white"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="ml-4 text-sm font-medium text-gray-900">
                                        {step.name}
                                    </span>
                                </span>
                            </a>
                        ) : Number(step.id) == currentStepNum ? (
                            <a
                                href={step.href}
                                className="flex items-center px-6 py-4 text-sm font-medium"
                                aria-current="step"
                            >
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                                    <span className="text-indigo-600">{step.id}</span>
                                </span>
                                <span className="ml-4 text-sm font-medium text-indigo-600">
                                    {step.name}
                                </span>
                            </a>
                        ) : (
                            <a href={step.href} className="group flex items-center">
                                <span className="flex items-center px-6 py-4 text-sm font-medium">
                                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                                        <span className="text-gray-500 group-hover:text-gray-900">
                                            {step.id}
                                        </span>
                                    </span>
                                    <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                                        {step.name}
                                    </span>
                                </span>
                            </a>
                        )}

                        {stepIdx !== steps.length - 1 ? (
                            <>
                                {/* Arrow separator for lg screens and up */}
                                <div
                                    className="absolute top-0 right-0 hidden h-full w-5 md:block"
                                    aria-hidden="true"
                                >
                                    <svg
                                        className="h-full w-full text-gray-300"
                                        viewBox="0 0 22 80"
                                        fill="none"
                                        preserveAspectRatio="none"
                                    >
                                        <path
                                            d="M0 -2L20 40L0 82"
                                            vectorEffect="non-scaling-stroke"
                                            stroke="currentcolor"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </>
                        ) : null}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

const importChoices = [
    {
        id: 1,
        title: "Donations",
        description: "Use ActBlue donations file",
        users: "621 users",
    },
    {
        id: 2,
        title: "Prospects",
        description: "Use any spreadsheet with first_name, last_name, and zip",
        users: "1200 users",
    },
    {
        id: 3,
        title: "Pledges",
        description: "Use a spreadsheet with first_name, last_name, zip, and amount",
        users: "2740 users",
    },
];

function Choices({ importType, setImportType }) {
    console.log({ importType });
    return (
        <RadioGroup
            value={importType}
            onChange={(e) => {
                setImportType(e.title.toLowerCase());
            }}
            className="mt-8"
        >
            <RadioGroup.Label className="text-base font-semibold leading-6 text-gray-900">
                Are you importing donations/donors, prospects, or pledges?
            </RadioGroup.Label>

            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
                {importChoices.map((importChoice) => (
                    <RadioGroup.Option
                        key={importChoice.id}
                        value={importChoice}
                        className={({ checked, active }) =>
                            classNames(
                                checked ? "border-transparent" : "border-gray-300",
                                active ? "border-indigo-500 ring-2 ring-indigo-500" : "",
                                "relative flex cursor-pointer rounded-lg border bg-white p-4 shadow hover:shadow-lg focus:outline-none"
                            )
                        }
                    >
                        {({ active }) => (
                            <>
                                <span className="flex flex-1">
                                    <span className="flex flex-col pt-1 pb-4">
                                        <RadioGroup.Label
                                            as="span"
                                            className="block text-sm font-medium text-gray-900"
                                        >
                                            {importChoice.title}
                                        </RadioGroup.Label>
                                        <RadioGroup.Description
                                            as="span"
                                            className="mt-1 flex items-center text-sm text-gray-500"
                                        >
                                            {importChoice.description}
                                        </RadioGroup.Description>
                                    </span>
                                </span>
                                <CheckCircleIcon
                                    className={classNames(
                                        !active ? "invisible" : "",
                                        "h-5 w-5 text-indigo-600"
                                    )}
                                    aria-hidden="true"
                                />
                                <span
                                    className={classNames(
                                        active ? "border" : "border-2",
                                        active ? "border-indigo-500" : "border-transparent",
                                        "pointer-events-none absolute -inset-px rounded-lg"
                                    )}
                                    aria-hidden="true"
                                />
                            </>
                        )}
                    </RadioGroup.Option>
                ))}
            </div>
        </RadioGroup>
    );
}

function FilePond({ server }) {
    const upload = (event) => {
        console.log("upload()");
        server.process(event.target.files[0]);
    };
    // return <input type="file" onChange={upload} />;
    return (
        <div className="col-span-full mt-4">
            <label htmlFor="cover-photo" className=" sr-only">
                File
            </label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                        >
                            <span className="font-bold">Click to upload a file</span>

                            <input
                                type="file"
                                id="file-upload"
                                name="file-upload"
                                className="sr-only"
                                onChange={upload}
                            />
                        </label>
                        {/* <p className="pl-1">or drag and drop</p> */}
                    </div>
                    <p className="text-xs leading-5 text-gray-600">.CSV only</p>
                </div>
            </div>
        </div>
    );
}
