import React, { useEffect, useState } from "react";
import styled from 'styled-components';

const ChatContainer = styled.div`
  max-width: 400px;
  margin: auto;
  padding: 20px;
  background-color: #f0f0f0;
  border-radius: 8px;
`;

const MessagesContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 10px;
`;

const Message = styled.div`
  padding: 8px;
  margin: 4px 0;
  border-radius: 5px;
  background-color: ${props => (props.isUser ? '#007bff' : '#e1e1e1')};
  color: ${props => (props.isUser ? 'white' : 'black')};
  align-self: ${props => (props.isUser ? 'flex-end' : 'flex-start')};
  max-width: 75%;
`;

const InputContainer = styled.div`
  display: flex;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

const Button = styled.button`
  margin-left: 8px;
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const Chatbot = () => {
  const [messages, setMessages] = useState([]); 
  const [input, setInput] = useState(""); 
  const [step, setStep] = useState(0); 
  const [ticketData, setTicketData] = useState({
    ticketId: "",
    email: "",
    comments: ""
  });

  useEffect(() => {
    // Use the Azure WebSocket endpoint
    const ws = new WebSocket("wss://zendeskendpoint-cadne9guf2g3bmf6.canadacentral-01.azurewebsites.net");

    ws.onopen = () => {
      console.log("WebSocket connected.");
    };

    ws.onmessage = (event) => {
      try {
        const receivedData = JSON.parse(event.data);
        const botMessage = receivedData.message || "Invalid message received";

        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botMessage, isUser: false }
        ]);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected.");
    };

    return () => {
      ws.close(); 
    };
  }, []);

  useEffect(() => {
    // Initial bot message
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: "Please provide your ticket ID:", isUser: false }
    ]);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, isUser: true }];
    setMessages(newMessages);

    if (step <= 2) {
      switch (step) {
        case 0:
          setTicketData((prev) => ({ ...prev, ticketId: input }));
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: "What is your email?", isUser: false }
          ]);
          setStep(1);
          break;
        case 1:
          setTicketData((prev) => ({ ...prev, email: input }));
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: "Please provide all comments regarding your ticket:", isUser: false }
          ]);
          setStep(2);
          break;
        case 2:
          setTicketData((prev) => ({ ...prev, comments: input }));
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: "Thank you! Submitting your ticket...", isUser: false }
          ]);

          const jsonPayload = {
            ticketId: ticketData.ticketId,
            email: ticketData.email,
            comments: input // Use final input as comments
          };

          fetch(
            "https://prod-43.westus.logic.azure.com:443/workflows/628b1ec150cb4327a0de421f74f7b5c9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dD2DMbJYEhQiIAj8Uooi1Mng3yXZdVH9tuHjKY7j-MI",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(jsonPayload)
            }
          )
            .then((response) => {
              if (response.ok) {
                setMessages((prevMessages) => [
                  ...prevMessages,
                  { text: "Your ticket has been submitted successfully!", isUser: false }
                ]);
              } else {
                throw new Error("Failed to submit the ticket.");
              }
            })
            .catch((error) => {
              setMessages((prevMessages) => [
                ...prevMessages,
                { text: `Error: ${error.message}`, isUser: false }
              ]);
            });

          setStep(3); 
          break;
        default:
          break;
      }
    }

    setInput(""); 
  };

  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.map((message, index) => (
          <Message key={index} isUser={message.isUser}>
            {message.text}
          </Message>
        ))}
      </MessagesContainer>
      <InputContainer>
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
        <Button onClick={handleSend}>Send</Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chatbot;
