import React, { useEffect, useMemo, useRef, useState } from "react";
import defaultAvatar from "../../public/assets/default.jpg";
import { formatTimestamp } from "../utils/formatTimestamp";
import { RiSendPlaneFill } from "react-icons/ri";
import { messageData } from "../data/messageData";
import { auth, listenForMessages, sendMessage } from "../firebase/firebase";
import logo from "../../public/assets/logo.png";
import EmojiPicker from 'emoji-picker-react';
import { BsEmojiSmile } from "react-icons/bs";

const Chatbox = ({ selectedUser }) => {
    const [messages, setMessages] = useState([]);
    const [messageText, sendMessageText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const scrollRef = useRef(null);
    const emojiPickerRef = useRef(null);

    const chatId = auth?.currentUser?.uid < selectedUser?.uid
        ? `${auth?.currentUser?.uid}-${selectedUser?.uid}`
        : `${selectedUser?.uid}-${auth?.currentUser?.uid}`;

    const user1 = auth?.currentUser;
    const user2 = selectedUser;
    const senderEmail = auth?.currentUser?.email;

    // Закрытие пикера при клике вне его области
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        listenForMessages(chatId, setMessages);
    }, [chatId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => {
            const aTimestamp = a?.timestamp?.seconds + a?.timestamp?.nanoseconds / 1e9;
            const bTimestamp = b?.timestamp?.seconds + b?.timestamp?.nanoseconds / 1e9;
            return aTimestamp - bTimestamp;
        });
    }, [messages]);

    const handleEmojiClick = (emojiData) => {
        sendMessageText(prev => prev + emojiData.emoji);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        const newMessage = {
            sender: senderEmail,
            text: messageText,
            timestamp: {
                seconds: Math.floor(Date.now() / 1000),
                nanoseconds: 0,
            },
        };

        sendMessage(messageText, chatId, user1?.uid, user2?.uid);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        sendMessageText("");
        setShowEmojiPicker(false);
    };

    return (
        <>
            {selectedUser ? (
                <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image">
                    <header className="w-[100%] h-[82px] m:h-fit p-4 bg-white">
                        <main className="flex items-center gap-3">
                            <span>
                                <img
                                    src={selectedUser?.image || defaultAvatar}
                                    className="w-11 h-11 object-cover rounded-full"
                                    alt=""
                                />
                            </span>
                            <span>
                                <h3 className="font-semibold text-[#2A3D39] text-lg">
                                    {selectedUser?.fullName || "Пользователь Monogram"}
                                </h3>
                                <p className="font-light text-[#2A3D39] text-sm">
                                    @{selectedUser?.username || "Monogram"}
                                </p>
                            </span>
                        </main>
                    </header>

                    <main className="custom-scrollbar relative h-[100vh] w-[100%] flex flex-col justify-between">
                        <section className="px-3 pt-5 b-20 lg:pb-10">
                            <div ref={scrollRef} className="overflow-auto h-[80vh]">
                                {sortedMessages?.map((msg, index) => (
                                    <React.Fragment key={index}>
                                        {msg?.sender === senderEmail ? (
                                            <div className="flex flex-col items-end w-full">
                                                <span className="flex gap-3 me-10 h-auto">
                                                    <div>
                                                        <div className="flex items-center bg-white justify-center p-6 rounded-lg shadow-sm">
                                                            <h4>{msg.text}</h4>
                                                        </div>
                                                        <p className="text-gray-400 text-sx mt-3 text-right">
                                                            {formatTimestamp(msg?.timestamp)}
                                                        </p>
                                                    </div>
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start w-full">
                                                <span className="flex gap-3 w-[40%] h-auto ms-10">
                                                    <img
                                                        src={defaultAvatar}
                                                        className="h-11 w-11 object-cover rounded-full"
                                                        alt=""
                                                    />
                                                    <div>
                                                        <div className="flex items-center bg-white justify-center p-6 rounded-lg shadow-sm">
                                                            <h4>{msg.text}</h4>
                                                        </div>
                                                        <p className="text-gray-400 text-sx mt-3">
                                                            {formatTimestamp(msg?.timestamp)}
                                                        </p>
                                                    </div>
                                                </span>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </section>

                        <div className="sticky lg:bottom-0 bottom-[60px] p-3 h-fit w-[100%]">
                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-center bg-white h-[45px] w-[100%] px-2 rounded-lg relative shadow-lg"
                            >
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmojiPicker(v => !v)}
                                        className="p-2 text-teal-600 hover:bg-gray-100 rounded-full"
                                    >
                                        <BsEmojiSmile size={24} />
                                    </button>

                                    {showEmojiPicker && (
                                        <div className="absolute bottom-12 left-0 z-50">
                                            <EmojiPicker
                                                onEmojiClick={(e) => {
                                                    sendMessageText(prev => prev + e.emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                width={300}
                                                height={400}
                                            />
                                        </div>
                                    )}
                                </div>
                                <input
                                    value={messageText}
                                    onChange={(e) => sendMessageText(e.target.value)}
                                    className="h-full text-[#2A3D39] outline-none text-[16px] pl-3 pr-[50px] rounded-lg w-[100%]"
                                    type="text"
                                    placeholder="Написать сообщение..."
                                />

                                <button
                                    type="submit"
                                    className="flex items-center justify-center absolute right-3 p-2 rounded-full bg-[#D9f2ed] hover:bg-[#c8eae3]"
                                >
                                    <RiSendPlaneFill color="#01AA85" />
                                </button>
                            </form>
                        </div>
                    </main>
                </section>
            ) : (
                <section className="h-screen w-[100%] bg-[#e5f6f3]">
                    <div className="flex flex-col justify-center items-center h-[100vh]">
                        <img src={logo} alt="" width={100} />
                        <h1 className="text-[30px] font-bold text-teal-700 mt-5">
                            Добро пожаловать в Monogram!
                        </h1>
                        <p className="text-gray-500">
                            Общайтесь с друзьями быстро и надёжно!
                        </p>
                    </div>
                </section>
            )}
        </>
    );
};

export default Chatbox;