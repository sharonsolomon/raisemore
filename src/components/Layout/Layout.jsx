import { useSupabase } from "lib/supabaseHooks";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useState } from "react";
import { Dialog, Menu, Transition } from "@headlessui/react";
import Search from "components/Layout/Search";
import Brand from "components/Layout/Brand";
import {
    UserButton,
    SignUp,
    OrganizationSwitcher,
    SignedOut,
    SignedIn,
    useOrganization,
} from "@clerk/nextjs";
import {
    Bars3BottomLeftIcon,
    BellIcon,
    HomeIcon,
    XMarkIcon,
    UsersIcon,
    FolderIcon,
    PhoneIcon,
    ClockIcon,
    HandRaisedIcon,
    EnvelopeIcon,
    UserPlusIcon,
    CloudArrowDownIcon,
    ArrowUpOnSquareStackIcon,
    ArrowsRightLeftIcon,
    UserCircleIcon,
    CurrencyDollarIcon,
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import Onboarding from "components/Onboarding";
const classNames = (...classes) => classes.filter(Boolean).join(" ");
const navigation = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Create a List", href: "/people", icon: UsersIcon },
    { name: "Saved Lists", href: "/savedlists", icon: FolderIcon },
    { name: "Make Calls", href: "/dialer", icon: PhoneIcon },
    { name: "Call History", href: "/contacthistory", icon: ClockIcon, header: "Reporting" },
    { name: "Pledges", href: "/pledges", icon: HandRaisedIcon },
    { name: "Donations", href: "/donations", icon: CurrencyDollarIcon },
    { name: "Nightly Reports", href: "/reports", icon: EnvelopeIcon },
    { name: "Import", href: "/import", icon: ArrowUpOnSquareStackIcon, header: "Settings" },
    { name: "Export", href: "/export", icon: CloudArrowDownIcon },
    { name: "ActBlue Sync", href: "/sync", icon: ArrowsRightLeftIcon },
    { name: "My Caller ID", href: "/callerid", icon: QuestionMarkCircleIcon },
    { name: "Manage Organization", href: "/organization", icon: UserPlusIcon },
    { name: "Login & Security", href: "/user", icon: UserCircleIcon },
];

const Layout = ({ children }) => {
    const supabase = useSupabase();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();
    navigation.forEach((item) => (item.current = item.href === router.pathname));

    // dstructure org id and organization.publicMetadata
    const { organization } = useOrganization();

    const onboardingProps = {
        hasOrg: !!organization?.id,
        hasOrgType: !!organization?.publicMetadata?.type,
        callerID: !!organization?.publicMetadata?.callerID,
    };
    const onboarded = Object.values(onboardingProps).every((v) => v === true);

    return (
        <div id="wrapper">
            <Menu>
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
                        </Transition.Child>

                        <div className="fixed inset-0 z-40 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-gray-200 pt-5 pb-4">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                                            <button
                                                type="button"
                                                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                <span className="sr-only">Close sidebar</span>
                                                <XMarkIcon
                                                    className="h-6 w-6 text-white"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </div>
                                    </Transition.Child>
                                    <Brand />
                                    <div className="mt-5 h-0 flex-1 overflow-y-auto">
                                        <nav className="space-y-1 px-2">
                                            {navigation.map((item, index) => (
                                                <Link
                                                    onClick={() => setSidebarOpen(false)}
                                                    key={index}
                                                    href={item.href}
                                                    className={classNames(
                                                        item.current
                                                            ? "bg-gray-100 text-gray-900"
                                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                                        "group flex items-center px-2 py-2 text-base font-medium rounded-md"
                                                    )}
                                                >
                                                    <item.icon
                                                        className={classNames(
                                                            item.current
                                                                ? "text-gray-500"
                                                                : "text-gray-400 group-hover:text-gray-500",
                                                            "mr-4 flex-shrink-0 h-6 w-6"
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </nav>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                            <div className="w-14 flex-shrink-0" aria-hidden="true">
                                {/* Dummy element to force sidebar to shrink to fit close icon */}
                            </div>
                        </div>
                    </Dialog>
                </Transition.Root>
            </Menu>
            {/* Static sidebar for desktop */}
            <div className="desktop-sidebar">
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="desktop-sidebar-div-1 pt-5 flex flex-grow flex-col overflow-y-auto border-r border-gray-200">
                    <Brand />

                    <div className="desktop-sidebar-div-2 pt-5 flex flex-grow flex-col ">
                        <nav className="flex-1 space-y-1 px-2 pb-4">
                            {navigation.map((item, index) => (
                                <div key={index}>
                                    {item?.header && (
                                        <div className="py-2">
                                            <p className="font-semibold text-xs ml-6 pl-1 text-gray-500 -mb-1 mt-2">
                                                {item?.header}
                                            </p>
                                            <div className="flex-grow border-t border-gray-200"></div>
                                        </div>
                                    )}
                                    <Link
                                        href={item.href}
                                        className={item.current ? "nav-item current" : "nav-item"}
                                    >
                                        <item.icon aria-hidden="true" />
                                        {item.name}
                                    </Link>
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
            <div className="main-panel">
                <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b">
                    <button
                        type="button"
                        className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3BottomLeftIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex flex-1 justify-between pr-4">
                        <SignedIn>
                            <div className="flex flex-1">
                                <div className="mr-5 relative pt-3 w-full text-gray-400 focus-within:text-gray-600">
                                    <Search />
                                </div>
                            </div>
                            <div className="ml-4 flex items-center md:ml-6 gap-5">
                                <button
                                    type="button"
                                    className="rounded-full bg-gray-100 p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    <span className="sr-only">View notifications</span>
                                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                                <OrganizationSwitcher
                                    hidePersonal={true}
                                    afterSwitchOrganizationUrl="/"
                                />
                                <UserButton />
                            </div>
                        </SignedIn>
                    </div>
                </div>

                <main className="flex-1">
                    <div className="py-6">
                        <SignedIn>
                            {!onboarded ? (
                                <Onboarding {...onboardingProps} />
                            ) : (
                                supabase && children
                            )}
                        </SignedIn>
                        <SignedOut>
                            <div className="flex min-h-full flex-col justify-center  sm:px-6 lg:px-8">
                                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                                    <SignUp
                                        appearance={{
                                            variables: {
                                                colorPrimary: "#388bff",
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </SignedOut>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
