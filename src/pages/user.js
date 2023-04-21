import { UserProfile } from "@clerk/nextjs";
import Breadcrumbs from "components/Layout/Breadcrumbs";

const OrganizationProfilePage = () => {
    return (
        <div className="mx-auto max-w-7xl px-2">
            <Breadcrumbs
                pages={[
                    {
                        name: "Login & Security",
                        href: "/user",
                        current: true,
                    },
                ]}
            />
            <div class="erase-cl-styling">
                <UserProfile />
            </div>
        </div>
    );
};

export default OrganizationProfilePage;
