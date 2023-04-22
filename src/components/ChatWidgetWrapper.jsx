import Script from "next/script";
import { useUser } from "@clerk/nextjs";

export default function ChatWidgetWrapper() {
    const { user } = useUser();

    const initFreshChat = () => {
        window.fcWidget.init({
            token: "6e6a564b-d0e6-455a-916a-37d6722e6157",
            host: "https://raisemore.freshchat.com",
        });

        if (!user) return;

        window.fcWidget.setExternalId(user?.id);
        window.fcWidget.user.setFirstName(user?.firstName);
        window.fcWidget.user.setLastName(user?.lastName);
        window.fcWidget.user.setEmail(user?.primaryEmailAddress?.emailAddress);
        window.fcWidget.user.setProperties({
            orgId: user?.organizationMemberships?.[0]?.organization?.id,
            orgName: user?.organizationMemberships?.[0]?.organization?.name,
            profileImageUrl: user?.profileImageUrl,
        });
    };

    return (
        <Script
            src="https://raisemore.freshchat.com/js/widget.js"
            id="Freshchat-js-sdk"
            onLoad={initFreshChat}
        />
    );
}
