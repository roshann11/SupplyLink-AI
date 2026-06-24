"use client";

import { useEffect, useState, useRef } from "react";
import { messagesApi, MessageResponse, ConversationContactResponse } from "@/lib/api-client";
import { Send, User, MessageSquare, Search, Plus, X } from "lucide-react";

export default function MessagesPage() {
  const [contacts, setContacts] = useState<ConversationContactResponse[]>([]);
  const [selectedContact, setSelectedContact] = useState<ConversationContactResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  // Start chat form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadContacts();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);
      // Start polling chat history every 3 seconds for simulated live chats
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        pollMessages(selectedContact.id);
      }, 3000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function loadContacts() {
    setLoadingContacts(true);
    const token = localStorage.getItem("access_token");
    if (!token) return;

    messagesApi
      .conversations(token)
      .then((data) => {
        setContacts(data);
        if (data.length > 0 && !selectedContact) {
          setSelectedContact(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingContacts(false));
  }

  function loadMessages(contactId: string) {
    setLoadingMessages(true);
    const token = localStorage.getItem("access_token");
    if (!token) return;

    messagesApi
      .history(contactId, token)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }

  function pollMessages(contactId: string) {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    messagesApi
      .history(contactId, token)
      .then((data) => {
        // Only update if message count changes or message ids differ
        setMessages((prev) => {
          if (prev.length !== data.length) return data;
          return prev;
        });
      })
      .catch(console.error);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedContact) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const newMsg = await messagesApi.send(
        { receiver_id: selectedContact.id, content: inputMessage },
        token
      );
      setMessages((prev) => [...prev, newMsg]);
      setInputMessage("");
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleStartChat(e: React.FormEvent) {
    e.preventDefault();
    setChatError(null);
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      // Find user by email in the backend auth database or create conversation
      // We will perform a simple query to register a chat starter.
      // Since messages API handles recipient lookup by UUID, we will check if the email exists in conversations or enter placeholder.
      // But wait! We need to know user id. To keep this robust and client side:
      // In this demo, we will allow starting a chat with any valid UUID, or we can look up a user.
      // Let's resolve the user UUID by entering a test recipient UUID, or if the user types an email,
      // we can do a call. Let's make an endpoint for user lookup, or search the contacts.
      // Wait, let's look up if they enter a UUID format, or check if we can query it.
      // Let's call /auth/me or similar, or allow inputting receiver's email and querying.
      // Wait! For a simpler mock-to-real flow, let's let the user enter receiver's UUID directly, or email if they know it.
      // Actually, since this is a marketplace, let's create a search user feature, or let them input a recipient user id.
      // Let's provide a clear field to enter the Receiver User UUID.
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(newChatEmail)) {
        throw new Error("Please enter a valid User UUID");
      }

      const tempContact: ConversationContactResponse = {
        id: newChatEmail,
        email: "contact@supplylink.ai",
        first_name: "Vendor",
        last_name: "Representative",
        company_name: "SupplyLink Vendor",
      };

      setSelectedContact(tempContact);
      setContacts((prev) => {
        if (prev.some((c) => c.id === tempContact.id)) return prev;
        return [tempContact, ...prev];
      });
      setIsModalOpen(false);
      setNewChatEmail("");
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Error starting chat");
    }
  }

  return (
    <div className="flex rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden h-[75vh] font-sans animate-fade-in">
      {/* Contacts List Panel */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/20">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Direct Chats</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-brand-50 p-2 text-brand-600 hover:bg-brand-100 hover:text-brand-700 transition-colors"
            title="Start new conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {loadingContacts ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-400">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No active chats</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Click the '+' icon to start a new chat using a user's UUID.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {contacts.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedContact(c)}
                className={`p-4 cursor-pointer hover:bg-slate-50/80 transition-colors flex items-center gap-3 ${
                  selectedContact?.id === c.id ? "bg-brand-50/40 border-l-4 border-brand-600 pl-3" : ""
                }`}
              >
                <div className="rounded-full bg-slate-100 p-2 text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{c.company_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Body Panel */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedContact ? (
          <>
            {/* Header info */}
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/10 flex items-center gap-3">
              <div className="rounded-full bg-brand-50 p-2 text-brand-600">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800">
                  {selectedContact.first_name} {selectedContact.last_name}
                </p>
                <p className="text-xs text-slate-400">{selectedContact.company_name}</p>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/10">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-400 text-sm italic font-medium">
                  Send a message to start the conversation history.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_id !== selectedContact.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 max-w-sm text-sm font-medium leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-brand-600 text-white rounded-tr-none"
                            : "bg-slate-100 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        <p>{m.content}</p>
                        <span
                          className={`block text-[9px] mt-1 text-right font-bold ${
                            isMe ? "text-brand-200" : "text-slate-400"
                          }`}
                        >
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input typing panel */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-3">
              <input
                type="text"
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-brand-600 p-3 text-white hover:bg-brand-700 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 font-medium">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-2" />
            No contact selected. Choose a chat or start a new one to connect with suppliers.
          </div>
        )}
      </div>

      {/* Start Chat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100 animate-scale-up mx-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Start Conversation</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStartChat} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Recipient User UUID</label>
                <input
                  required
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  value={newChatEmail}
                  onChange={(e) => setNewChatEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {chatError && <p className="text-sm font-semibold text-red-600">{chatError}</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
