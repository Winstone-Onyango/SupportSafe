import { createContext, useContext, useEffect, useRef, useState } from "react";

// Point this at your avatar backend. For local dev the default works; for
// production set VITE_BACKEND_URL (e.g. in a .env file in this folder).
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // Queue of AI replies waiting to be spoken (the 3D avatar plays them in order).
  const [queue, setQueue] = useState([]);
  // The reply currently being spoken.
  const [message, setMessage] = useState();
  // Full conversation log, rendered as the readable transcript panel.
  const [transcript, setTranscript] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  // Monotonic counter so transcript entries have stable React keys.
  const nextEntryId = useRef(0);

  const addEntry = (role, text) => {
    nextEntryId.current += 1;
    setTranscript((entries) => [
      ...entries,
      { id: nextEntryId.current, role, text },
    ]);
  };

  // Sends the user's message to the avatar backend and queues up the replies.
  const chat = async (userText) => {
    const text = (userText || "").trim();
    if (!text) return;

    addEntry("user", text);
    setLoading(true);

    try {
      const data = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!data.ok) {
        const errorBody = await data.json().catch(() => ({}));
        console.error("Chat request failed:", data.status, errorBody);
        setQueue((queue) => [
          ...queue,
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
      if (Array.isArray(resp) && resp.length > 0) {
        setQueue((queue) => [...queue, ...resp]);
      }
    } catch (error) {
      console.error("Could not reach the avatar backend at", backendUrl, error);
      setQueue((queue) => [
        ...queue,
        {
          text: "I can't reach my voice server right now. Please make sure it is running and try again.",
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
  // The head of the queue is the reply the avatar should speak next.
  useEffect(() => {
    setMessage(queue.length > 0 ? queue[0] : null);
  }, [queue]);

  // Log each AI reply in the transcript as soon as it is spoken.
  useEffect(() => {
    if (!message || !message.text) return;
    addEntry("assistant", message.text);
  }, [message]);

  // Dropping the head of the queue advances to the next reply.
  const onMessagePlayed = () => {
    setQueue((queue) => queue.slice(1));
  };

  // True while the avatar has an audible reply to deliver.
  const speaking = Boolean(message && message.audio);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        speaking,
        transcript,
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
