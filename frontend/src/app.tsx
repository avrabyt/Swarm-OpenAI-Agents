import { ClinicHeader } from "@/components/ClinicHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import brain from "brain";
import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { DataAnalystProcessMessageResponse } from "types";
const defaultUserIcon =
  "image.jpg";
const medicalAdviceAgentIcon =
  "image2.png";
const appointmentSchedulingAgentIcon =
  "image3.png";

interface ChatMessage {
  role: string;
  content: string;
  agentName?: string;
  agentImage?: string;
  userImage?: string;
}

export default function AIDoctorPlanner() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getAgentImage = (agentName: string): string => {
    switch (agentName) {
      case "Triage Agent":
        return "image4.jpg";
      case "Specialist Agent":
        return "/images/specialist-agent.png";
      case "Medical Advice Agent":
        return medicalAdviceAgentIcon;
      case "Appointment Scheduling Agent":
        return appointmentSchedulingAgentIcon;
      default:
        return "/images/default-agent.png";
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      userImage: defaultUserIcon,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");

    try {
      const response = await brain.process_message_v1({
        message: input,
        history: messages,
      });
      const responseData =
        (await response.json()) as DataAnalystProcessMessageResponse;

      if (
        responseData.messages &&
        responseData.messages.length > 0 &&
        responseData.agent_name
      ) {
        const lastAgentMessage = responseData.messages[
          responseData.messages.length - 1
        ] as ChatMessage;
        const newAgentMessage: ChatMessage = {
          role: lastAgentMessage.role || "assistant",
          content: lastAgentMessage.content || "",
          agentName: responseData.agent_name,
          agentImage: getAgentImage(responseData.agent_name),
        };

        setMessages((prevMessages) => [...prevMessages, newAgentMessage]);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "system",
          content: "An error occurred. Please try again.",
          agentImage: "/images/error-icon.png",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen p-6 bg-background text-foreground">
      <ClinicHeader />
      <ScrollArea className="flex-grow mb-6 p-4 border rounded-md bg-card text-card-foreground">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded-lg ${
              msg.role === "user" ? "bg-primary/10" : "bg-secondary/10"
            } flex items-start`}
          >
            {msg.role === "user" ? (
              <img
                className="mr-2 w-8 h-8 rounded-full"
                src={msg.userImage || defaultUserIcon}
                alt="User"
              />
            ) : (
              msg.agentImage &&
              msg.agentName && (
                <img
                  className={`mr-2 w-8 h-8 rounded-full ${
                    msg.agentName === "Triage Agent"
                      ? "border-2 border-primary"
                      : ""
                  }`}
                  src={msg.agentImage}
                  alt={msg.agentName || "Agent"}
                />
              )
            )}
            <div className="flex-grow">
              <strong>
                {msg.role === "user" ? "You" : msg.agentName || "Agent"}:{" "}
              </strong>
              <div className="mt-1">
                <ReactMarkdown className="prose prose-sm dark:prose-invert">
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message here..."
          className="flex-grow bg-input text-foreground"
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? "Sending..." : "Send"}
        </Button>
        <Button
          onClick={clearChat}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Clear Chat
        </Button>
      </div>
    </div>
  );
}
