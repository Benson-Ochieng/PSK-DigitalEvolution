import { useEffect } from "react";

/**
 * Petstore Kenya Communication Booth - Dynamic Live Widget Loader
 * 
 * Automatically loads the live-hosted Chatbot SDK from the backend repo.
 * When changes are pushed to the main branch of `PetstoreCommunicationBooth`,
 * the deployed backend automatically serves the updated widget at `/sdk/petstore-chat.js`,
 * updating this website instantly with ZERO code changes or rebuilds.
 */
export default function CommunicationBooth() {
  useEffect(() => {
    // Avoid duplicate script injection if already mounted
    if (document.getElementById("petstore-chat-sdk")) return;

    const defaultRemote = "https://connect.petstore.co.ke";
    const apiUrl = typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:3001"
      : defaultRemote;

    const script = document.createElement("script");
    script.id = "petstore-chat-sdk";
    script.src = `${apiUrl}/sdk/petstore-chat.js`;
    script.async = true;
    script.setAttribute("data-api-url", apiUrl);
    script.setAttribute("data-socket-url", apiUrl);

    script.onerror = () => {
      // If localhost backend is offline in dev, fall back to production remote
      if (apiUrl !== defaultRemote) {
        console.warn("⚠️ Local Petstore backend unreachable, falling back to production SDK...");
        script.src = `${defaultRemote}/sdk/petstore-chat.js`;
        script.setAttribute("data-api-url", defaultRemote);
        script.setAttribute("data-socket-url", defaultRemote);
      }
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount if component is unmounted
      const existingScript = document.getElementById("petstore-chat-sdk");
      if (existingScript) {
        existingScript.remove();
      }
      const trigger = document.querySelector(".petstore-chat-trigger");
      if (trigger) trigger.remove();
      const container = document.querySelector(".petstore-chat-container");
      if (container) container.remove();
    };
  }, []);

  return null;
}
