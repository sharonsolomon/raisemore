import { useUser, useAuth } from "@clerk/nextjs";
import Script from "next/script";

export default function ChatWidgetWrapper() {
    const { isSignedIn, user } = useUser();
    const { orgId } = useAuth();
    const customer = isSignedIn
        ? {
              name: user?.fullName,
              email: user?.primaryEmailAddress?.emailAddress,
              phone: user?.primaryPhoneNumber?.phoneNumber,
              external_id: user?.id,
              metadata: {
                  orgId,
              },
          }
        : null;

    const customerObject = customer
        ? `customer: {
                name: "${customer?.name}",
                email: "${customer?.email}",
                external_id: "${customer?.id}",
                metadata: {
                    orgId:"${customer?.metadata?.orgId}",
                },
            }`
        : "";

    // Bundle size
    return (
        <>
            <Script id="papercups-data" strategy="lazyOnload">
                {`window.Papercups = {
                    config: {
                      token: "19650de6-84fa-4da9-a8b9-78ffcadab983",
                      inbox: "1a5d07de-76b2-4430-a1c3-68507bb8b977",
                      title: "Welcome to Raise More",
                      subtitle: "Ask us anything in the chat window below 😊",
                      primaryColor: "#388bff",
                      greeting:"Hi there! Send us a message and we'll get back to you as soon as we can.",
                      newMessagePlaceholder: "Start typing...",
                      showAgentAvailability: false,
                      agentAvailableText: "We're online right now!",
                      agentUnavailableText: "We're away at the moment.",
                      requireEmailUpfront: false,
                      iconVariant: "outlined",
                      baseUrl: "https://app.papercups.io",
                      // Optionally include data about your customer here to identify them
                      ${customerObject}
                    },
                  };`}
            </Script>
            <Script strategy="lazyOnload" src="https://app.papercups.io/widget.js" />
        </>
    );
}
