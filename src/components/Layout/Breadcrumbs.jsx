import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";
//import next router
import { useRouter } from "next/router";

export default function Breadcrumbs({ pages = [] }) {
    const router = useRouter();
    return (
        <nav className="mb-4 inline-flex rounded text-sm Breadcrumbs" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-1">
                <li>
                    <div>
                        <Link href="/" className="text-gray-400 hover:text-gray-700">
                            <HomeIcon className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </div>
                </li>
                {pages.map((page) => (
                    <li key={page.name}>
                        <div className="flex items-center">
                            <ChevronRightIcon
                                className="h-5 w-5 flex-shrink-0 text-gray-300"
                                aria-hidden="true"
                            />
                            <Link
                                href={page.href}
                                className={"ml-1 " + (page.current ? " current" : "")}
                                aria-current={page.current ? "page" : undefined}
                            >
                                {page.name}
                            </Link>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
