import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import LLMChat, { LLMChatProps } from './LLMChat';
import hash from 'object-hash';
import { v4 as uuidv4 } from 'uuid';
import { Button, ListGroup, Form, Navbar, Offcanvas, Stack, Row, Col, Container, ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPencil, faBars, faCaretDown, faGears, faGear, faSave, faChevronCircleLeft, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import LLMConfigForm from './LLMConfigForm';
import { LLMConfig } from './LLMConfig';
import ConfigPresetItem from './ConfigPresetItem';
import { Chat, loadChats, loadSelectedChatId, saveSelectedChatId, loadConfigPresets, addChat, deleteChat, modifyChat, addConfigPreset, deleteConfigPreset, modifyConfigPreset, loadSelectedConfigId, saveSelectedConfigId } from './storage';
import ChatListItem from './ChatListItem';

interface ChatDrawerInterface {}

function generateDefaultLLMConfig() {
    return {
        id: uuidv4(),
        name: `Default`,
        baseURL: "http://localhost:8080/v1/chat/completions",
        defaultSystemPrompt: "You are a helpful assistant.",
    };
}

const ChatDrawer: React.FC<ChatDrawerInterface> = ({}) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [configPresets, setConfigPresets] = useState<LLMConfig[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>();
    const [showLeftDrawer, setShowLeftDrawer] = useState(false);
    const [showRightDrawer, setShowRightDrawer] = useState(false);
    const [rightDrawerView, setRightDrawerView] = useState("llm-presets");
    const [defaultSelectedConfig, setDefaultSelectedConfig] = useState<LLMConfig>(configPresets[0]);

    const selectedChat = chats.find(chat => chat.id === selectedChatId);
    const selectedConfig = selectedChat ? configPresets.find(config => config.id === selectedChat.configId) : defaultSelectedConfig;
    const configHash = selectedConfig ? hash(selectedConfig) : 'default-hash';

    useEffect(()=> {
        setSelectedChatId(loadSelectedChatId());
        setConfigPresets(loadConfigPresets());
        setChats(loadChats());
    }, []);

    const createNewChat = () => {
        if (configPresets.length === 0 || !selectedConfig) {
            alert("Please select or create a configuration before creating a new chat.");
            return;
        }

        var sysprompt = [];

        if (selectedConfig.defaultSystemPrompt) sysprompt = [{
            sender: 'system',
            content: selectedConfig.defaultSystemPrompt
        }];

        const newChat: Chat = {
            id: uuidv4(),
            configId: selectedConfig.id, // Assign the selected config
            name: getUniqueChatName(chats.map(c => c.name), "Chat"),
            messages: sysprompt
        };
        addChat(newChat);
        setChats([...chats, newChat]);
        setSelectedChatId(newChat.id);
        saveSelectedChatId(newChat.id);
    };

    const createNewPreset = () => {
        const newConfig = generateDefaultLLMConfig();
        newConfig.name = getUniqueName(configPresets.map(c => c.name), newConfig.name);
        addConfigPreset(newConfig);
        setConfigPresets([...configPresets, newConfig]);
    };

    const updateChatName = (chatId: string, newName: string) => {
        const updatedChat = { ...chats.find(chat => chat.id === chatId), name: newName };
        modifyChat(updatedChat);
        setChats(chats.map(chat => chat.id === chatId ? updatedChat : chat));
    };

    const handleDeleteChat = (chatId: string) => {
        deleteChat(chatId);
        setChats(chats.filter(chat => chat.id !== chatId));
        if (selectedChatId === chatId) {
            setSelectedChatId(null);
            saveSelectedChatId(null);
        }
    };

    const handleMessagesChange = (newMessages: LLMChatProps['initialMessages']) => {
        if (!selectedChatId) return;
        const updatedChat = { ...chats.find(chat => chat.id === selectedChatId), messages: newMessages };
        modifyChat(updatedChat);
        setChats(chats.map(chat => chat.id === selectedChatId ? updatedChat : chat));
    };

    const handleEditConfig = (configId: string) => {
        const configToEdit = configPresets.find(config => config.id === configId);
        if (configToEdit) {
            setShowRightDrawer(false);
            setDefaultSelectedConfig(configToEdit);
            setTimeout(() => {
                setRightDrawerView("llm-config");
                setShowRightDrawer(true);
            }, 400);
        }
    };

    const handleFormEdit = (config: LLMConfig) => {
        // Get the old name from configPresets
        const oldConfig = configPresets.find(c => c.id === config.id);
        const oldName = oldConfig ? oldConfig.name : '';
    
        if (config.name !== oldName) {
            config.name = getUniqueName(configPresets.map(c => c.name), config.name);
        }
        modifyConfigPreset(config);
        setConfigPresets(prev => prev.map(c => c.id === config.id ? config : c));
        setShowRightDrawer(false);
        setTimeout(() => {
            setRightDrawerView("llm-presets");
            setShowRightDrawer(true);
        }, 400);
    };

    const handleFormDuplicate = (config: LLMConfig) => {
        config.id = uuidv4();
        config.name = getUniqueName(configPresets.map(c => c.name), config.name);
        addConfigPreset(config);
        setConfigPresets(prev => [...prev, config]);
        setShowRightDrawer(false);
        setTimeout(() => {
            setRightDrawerView("llm-presets");
            setShowRightDrawer(true);
        }, 400);
    };

    const handleFormCancel = () => {
        setShowRightDrawer(false);
        setTimeout(() => {
            setRightDrawerView("llm-presets");
            setShowRightDrawer(true);
        }, 400);
    };

    const handleDeleteConfigPreset = (configId: string) => {
        deleteConfigPreset(configId);
        setConfigPresets(configPresets.filter(c => c.id !== configId));
        setDefaultSelectedConfig(null);
    };

    return (
        <div className="d-flex flex-column h-100 bg-body">
            {/* Top Navbar */}
            <Navbar className="border-bottom p-2 m-0">
                <Container fluid>
                    <Stack className='w-100' direction="horizontal" gap={0}>
                        <Button
                            variant="primary"
                            onClick={() => setShowLeftDrawer(true)}
                            className="ms-2"
                        >
                            <FontAwesomeIcon icon={faBars} /> Chats
                        </Button>
                        <Button
                            variant="warning"
                            onClick={() => { setShowRightDrawer(true); setRightDrawerView("llm-presets"); }}
                            className="ms-auto"
                        >
                            <FontAwesomeIcon icon={faCaretDown} /> {selectedConfig ? selectedConfig.name : "None"}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            onClick={() => { setShowRightDrawer(true); setRightDrawerView("settings"); }}
                            className="ms-2"
                        >
                            <FontAwesomeIcon icon={faGears} />
                        </Button>
                    </Stack>
                </Container>
            </Navbar>

            {/* Left Chats Drawer */}
            <Offcanvas
                show={showLeftDrawer}
                onHide={() => setShowLeftDrawer(false)}
                placement="start"
            >
                <Offcanvas.Header closeButton className="border-bottom p-2 w-100">
                    <Button
                        variant="primary"
                        onClick={() => {
                            createNewChat();
                            if (window.innerWidth < 768) setShowLeftDrawer(false);
                        }}
                        className="w-100"
                    >
                        New Chat
                    </Button>
                </Offcanvas.Header>
                <Offcanvas.Body className="p-0 d-flex flex-column">
                    <ListGroup variant="flush" className="overflow-auto flex-grow-1">
                        {chats.map(chat => (
                            <ChatListItem
                                key={chat.id}
                                chat={chat}
                                isSelected={chat.id === selectedChatId}
                                onSelect={() => {
                                    setSelectedChatId(chat.id);
                                    saveSelectedChatId(chat.id);
                                    if (window.innerWidth < 768) setShowLeftDrawer(false);
                                }}
                                onRename={(newName) => updateChatName(chat.id, newName)}
                                onDelete={() => handleDeleteChat(chat.id)}
                            />
                        ))}
                    </ListGroup>
                </Offcanvas.Body>
            </Offcanvas>

            {/* Right Settings Drawer */}
            <Offcanvas
                show={showRightDrawer}
                onHide={() => setShowRightDrawer(false)}
                placement="end"
                className={rightDrawerView === 'llm-presets' ? '' : "responsive-offcanvas"}
            >
                {rightDrawerView === 'llm-presets' ? (
                    <Offcanvas.Header closeButton className="border-bottom p-2 w-100">
                        <Button
                            variant="warning"
                            onClick={() => {
                                createNewPreset()
                            }}
                            className="w-100"
                        >
                            New Config
                        </Button>
                    </Offcanvas.Header>
                ) : <></>}
                {rightDrawerView === 'llm-config' ? (
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title>LLM Config</Offcanvas.Title>
                    </Offcanvas.Header>
                ) : <></>}
                {rightDrawerView === 'settings' ? (
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title>Settings</Offcanvas.Title>
                    </Offcanvas.Header>
                ) : <></>}

                {rightDrawerView !== 'llm-presets' ? (
                    rightDrawerView === 'settings' ? (
                        <Offcanvas.Body>
                            TODO: this will have themes, various settings such as hiding/showing thinking tabs by default and maybe some other gui configurations
                        </Offcanvas.Body>
                    ) : (
                        <Offcanvas.Body>
                            <LLMConfigForm
                                initialState={defaultSelectedConfig}
                                onSubmit={(config: LLMConfig) => handleFormEdit(config)}
                                onDuplicate={(config: LLMConfig) => handleFormDuplicate(config)}
                                onCancel={() => handleFormCancel()}
                            />
                        </Offcanvas.Body>
                    )
                ) : (
                    <Offcanvas.Body className="p-0 d-flex flex-column">
                        <ListGroup variant="flush" className="overflow-auto flex-grow-1">
                            {configPresets.map(config => (
                                <ConfigPresetItem
                                    key={config.id}
                                    config={config}
                                    isSelected={selectedChat ? selectedChat.configId === config.id : (selectedConfig && config.id === selectedConfig.id)}
                                    onSelect={() => {
                                        if (selectedChat) {
                                            const updatedChat = { ...selectedChat, configId: config.id };
                                            modifyChat(updatedChat);
                                            setChats(chats.map(chat => chat.id === selectedChat.id ? updatedChat : chat));
                                        } else {
                                            setDefaultSelectedConfig(config);
                                        }
                                        if (window.innerWidth < 768) setShowRightDrawer(false);
                                    }}
                                    onEdit={(config) => handleEditConfig(config.id)}
                                    onDelete={() => handleDeleteConfigPreset(config.id)}
                                />
                            ))}
                        </ListGroup>
                    </Offcanvas.Body>
                )}
            </Offcanvas>

            {/* Main Content */}
            <div className="flex-grow-1 position-relative bg-body-tertiary" style={{ minHeight: 0 }}>
                {selectedChat && selectedConfig ? (
                    <LLMChat
                        key={`${selectedChatId}-${configHash}`}
                        llmConfig={selectedConfig}
                        initialMessages={selectedChat.messages}
                        onMessagesChange={handleMessagesChange}
                    />
                ) : selectedConfig ? (
                    <div className="d-flex h-100 justify-content-center align-items-center text-body-secondary">
                        Select a chat or create a new one
                    </div>
                ) : (
                    <div className="d-flex h-100 justify-content-center align-items-center text-body-secondary">
                        No configuration selected. <br /> Please select or create one.
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ChatDrawer);


function getUniqueChatName(existingNames: string[], newName: string): string {
    let copyNumber = 1;
    let uniqueName = `${newName} ${copyNumber}`;

    while (existingNames.includes(uniqueName)) {
        copyNumber++;
        uniqueName = `${newName} ${copyNumber}`;
    }

    return uniqueName;
}

function getUniqueName(existingNames: string[], newName: string): string {
    if (!existingNames.includes(newName)) {
        return newName;
    }

    // Regular expression to match the (copy X) pattern at the end of the string
    const copyPattern = / \(copy \d+\)$/;

    // Check if the newName already has a (copy X) suffix
    if (copyPattern.test(newName)) {
        // Extract the base name and the current copy number
        const baseName = newName.replace(copyPattern, '');
        const currentCopyNumber = parseInt(newName.match(copyPattern)[0].match(/\d+/)[0], 10);
        let copyNumber = currentCopyNumber + 1;
        let uniqueName = `${baseName} (copy ${copyNumber})`;

        while (existingNames.includes(uniqueName)) {
            copyNumber++;
            uniqueName = `${baseName} (copy ${copyNumber})`;
        }

        return uniqueName;
    } else {
        let copyNumber = 1;
        let uniqueName = `${newName} (copy ${copyNumber})`;

        while (existingNames.includes(uniqueName)) {
            copyNumber++;
            uniqueName = `${newName} (copy ${copyNumber})`;
        }

        return uniqueName;
    }
}