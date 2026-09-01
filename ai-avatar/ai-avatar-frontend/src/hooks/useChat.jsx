import { createContext, useContext, useEffect, useState } from "react";

// Point this at your avatar backend. For local dev the default works; for
// production set VITE_BACKEND_URL (e.g. in a .env file in this folder).
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (message) => {
    setLoading(true);
    try {
      const data = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (!data.ok) {
        const errorBody = await data.json().catch(() => ({}));
        console.error("Chat request failed:", data.status, errorBody);
        setMessages((messages) => [
          ...messages,
          {
            text: "Sorry, I'm having trouble responding right now. Please try again.",
            audio: "",
            lipsync: { metadata: { syncDataVersion: 1 }, mouthCues: [] },
            facialExpression: "sad",
            animation: "Idle",
          },
        ]);
        return;
      }
      const resp = (await data.json()).messages;
      setMessages((messages) => [...messages, ...resp]);
    } catch (error) {
      console.error("Could not reach the avatar backend at", backendUrl, error);
      setMessages((messages) => [
        ...messages,
        {
          text: "I can't reach the server right now. Is the avatar backend running on port 3000?",
          audio: "",
          lipsync: { metadata: { syncDataVersion: 1 }, mouthCues: [] },
          facialExpression: "sad",
          animation: "Idle",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
