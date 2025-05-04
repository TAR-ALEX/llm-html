import React, { useState, useEffect } from 'react';
import { Offcanvas, Button, ListGroup } from 'react-bootstrap';
import { loadChats, saveChats, addChat, deleteChat, modifyChat, loadSelectedChatId, saveSelectedChatId, Chat, ChatListEntry, listChatUUIDsAndNames, modifyChatName, loadChat, loadSelectedChatListEntry, loadSelectedChat, loadConfigPreset } from './storage';
import { v4 as uuidv4 } from 'uuid';
import ChatListItem from './ChatListItem';
import { LLMConfig } from './LLMConfig';

interface ChatListGroupProps {
    onClose: () => void;
    onError: (header: string, msg: string) => void;
    onSelectedChat: (chat: Chat) => void;
}

const ChatListGroup: React.FC<ChatListGroupProps> = ({ onClose, onError, onSelectedChat }) => {
    const [chats, setChats] = useState<ChatListEntry[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    useEffect(() => {
        const loadedChats = listChatUUIDsAndNames();
        setChats(loadedChats);

        const selectedChat = loadSelectedChat();

        setSelectedChat(selectedChat);
    }, []);

    const createNewChat = () => {
        let selectedConfig: LLMConfig | null = null;
        if(selectedChat){
            selectedConfig = loadConfigPreset(selectedChat.configId);
        }

        var sysprompt = [];

        if (selectedConfig?.defaultSystemPrompt ?? false) sysprompt = [{
            sender: 'system',
            content: selectedConfig.defaultSystemPrompt
        }];

        const newChat: Chat = {
            id: uuidv4(),
            name: getUniqueChatName(chats.map(c => c.name), "Chat"),
            messages: sysprompt,
            configId: selectedChat?.configId,
        };

        addChat(newChat);
        setChats([...chats, newChat]);
    };

    const updateChatName = (chatId: string, newName: string) => {
        const updatedChats = chats.map(chat =>
            chat.id === chatId ? { ...chat, name: newName } : chat
        );
        modifyChatName(updatedChats.find(chat => chat.id === chatId)!);
        setChats(updatedChats);
    };

    const handleDeleteChat = (chatId: string) => {
        deleteChat(chatId);
        if(selectedChat.id == chatId) onSelectedChat(null);
        setChats(chats.filter(chat => chat.id !== chatId));
    };

    return (
        <><Offcanvas.Header closeButton className="border-bottom p-2 w-100">
            <Button
                variant="primary"
                onClick={() => {
                    createNewChat();
                    if (window.innerWidth < 768) onClose();
                } }
                className="w-100"
            >
                New Chat
            </Button>
        </Offcanvas.Header><Offcanvas.Body className="p-0 d-flex flex-column">
                <ListGroup variant="flush" className="overflow-auto flex-grow-1">
                    {chats.map(chat => (
                        <ChatListItem
                            key={chat.id}
                            chat={chat}
                            isSelected={chat.id === (selectedChat?.id ?? "")}
                            onSelect={() => {
                                const fullChat = loadChat(chat.id);
                                setSelectedChat(fullChat);
                                saveSelectedChatId(fullChat.id);
                                onSelectedChat(fullChat)
                                if (window.innerWidth < 768) onClose();
                            } }
                            onRename={(newName) => updateChatName(chat.id, newName)}
                            onDelete={() => handleDeleteChat(chat.id)} />
                    ))}
                </ListGroup>
            </Offcanvas.Body></>
    );
};

function getUniqueChatName(existingNames: string[], newName: string): string {
    let copyNumber = 1;
    let uniqueName = `${newName} ${copyNumber}`;

    while (existingNames.includes(uniqueName)) {
        copyNumber++;
        uniqueName = `${newName} ${copyNumber}`;
    }

    return uniqueName;
}

export default ChatListGroup;