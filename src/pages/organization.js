import { OrganizationProfile } from "@clerk/nextjs";
import Breadcrumbs from "components/Layout/Breadcrumbs";

const OrganizationProfilePage = () => {
    return (
        <div className="mx-auto max-w-7xl px-2">
            <Breadcrumbs
                pages={[
                    {
                        name: "Manage Organization",
                        href: "/organization",
                        current: true,
                    },
                ]}
            />
            <div class="erase-cl-styling">
                <OrganizationProfile hidePersonal={true} />
            </div>
        </div>
    );
};

export default OrganizationProfilePage;
