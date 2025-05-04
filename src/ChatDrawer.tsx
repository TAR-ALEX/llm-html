import React, { useState, useEffect, useRef } from 'react';
import LLMChat, { LLMChatProps } from './LLMChat';
import { v4 as uuidv4 } from 'uuid';
import { Button, Navbar, Offcanvas, Stack, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faExchangeAlt, faCaretDown, faGears } from '@fortawesome/free-solid-svg-icons';
import LLMConfigForm from './LLMConfigForm';
import { LLMConfig } from './LLMConfig';
import { Chat, loadConfigPresets, modifyChat, addConfigPreset, deleteConfigPreset, modifyConfigPreset, loadAppConfig, saveAppConfig, loadSelectedChat } from './storage';
import AppConfigForm from './AppConfigForm';
import { AppConfig, defaultAppConfig } from './AppConfig';
import ChatListGroup from './ChatListGroup';
import ConfigPresetGroup, { getUniqueName } from './ConfigPresetGroup';

interface ChatDrawerInterface {
    onError?: (header: string, content: string) => void;
}

const ChatDrawer: React.FC<ChatDrawerInterface> = ({onError}) => {
    const [configPresets, setConfigPresets] = useState<LLMConfig[]>([]);
    const [showLeftDrawer, setShowLeftDrawer] = useState(false);
    const [showRightDrawer, setShowRightDrawer] = useState(false);
    const [rightDrawerView, setRightDrawerView] = useState("llm-presets");
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
    const [selectedChat, setSelectedChat] = useState<Chat | null>();
    const [configToEdit, setConfigToEdit] = useState<LLMConfig>();
    
    const selectedConfig = selectedChat ? configPresets.find(config => config.id === selectedChat.configId) : null;

    useEffect(()=> {
        var cfg = loadAppConfig();
        setAppConfig(cfg ?? defaultAppConfig);
        setSelectedChat(loadSelectedChat());
        setConfigPresets(loadConfigPresets());
    }, []);

    useEffect(()=> {
    }, [appConfig]);

    const handleMessagesChange = (newMessages: LLMChatProps['initialMessages']) => {
        if (!selectedChat) return;
        const updatedChat = { ...selectedChat, messages: newMessages };
        modifyChat(updatedChat);
        setSelectedChat(updatedChat);
    };

    const handleEditConfig = (configToEdit: LLMConfig) => {
        setConfigToEdit(configToEdit);

        if (configToEdit) {
            setShowRightDrawer(false);
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

    const handleAppSettingsCancel = () => {
        setShowRightDrawer(false);
    };
    const handleAppSettingsSave = (config: AppConfig) => {
        saveAppConfig(config);
        setAppConfig(config);
        setShowRightDrawer(false);
    };

    const handleDeleteConfigPreset = (configId: string) => {
        deleteConfigPreset(configId);
        setConfigPresets((configPresets) => configPresets.filter(c => c.id !== configId));
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
                            style={{
                                overflow: 'hidden',  // Ensure overflow is hidden
                                whiteSpace: 'nowrap', // Prevent line breaks
                            }}
                        >
                            <FontAwesomeIcon icon={faBars} /> Chats
                        </Button>
                        {/* TODO */}
                        {/* <Button
                            variant="success"
                            onClick={() => setShowLeftDrawer(true)}
                            className="ms-2"
                            style={{
                                overflow: 'hidden',  // Ensure overflow is hidden
                                whiteSpace: 'nowrap', // Prevent line breaks
                            }}
                        >
                            <FontAwesomeIcon icon={faExchangeAlt} /> Mode
                        </Button> */}
                        <Button
                            variant="warning"
                            onClick={() => { setShowRightDrawer(true); setRightDrawerView("llm-presets"); }}
                            className="ms-auto"
                            style={{
                                width: 'auto',       // Shrink-to-fit content
                                maxWidth: '150px',   // Never exceed 150px
                                minWidth: '50px',
                                flexShrink: 1,       // Allows shrinking (default)
                                flexGrow: 0,         // Prevents forced expansion
                                overflow: 'hidden',  // Ensure overflow is hidden
                                whiteSpace: 'nowrap', // Prevent line breaks
                            }}
                        >
                            <Stack style={{width: 'auto'}} direction="horizontal" gap={1}>
                                <FontAwesomeIcon icon={faCaretDown} />
                                <div style={{
                                    overflow: 'hidden',   // Ensure overflow is hidden
                                    whiteSpace: 'nowrap', // Prevent line breaks
                                    textOverflow: 'ellipsis' // Add ellipsis
                                }}>
                                    {selectedConfig ? selectedConfig.name : "None"}
                                </div>
                            </Stack>
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
                <ChatListGroup onError={onError} onClose={() => setShowLeftDrawer(false)} onSelectedChat={(e) => {setSelectedChat(e);}}></ChatListGroup>
            </Offcanvas>

            {/* Right Settings Drawer */}
            <Offcanvas
                show={showRightDrawer}
                onHide={() => setShowRightDrawer(false)}
                placement="end"
                className={rightDrawerView === 'llm-presets' ? '' : "responsive-offcanvas"}
            >
                {rightDrawerView === 'llm-presets' ? (
                    <></>
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
                            <AppConfigForm
                                initialState={appConfig}
                                onSubmit={handleAppSettingsSave}
                                onCancel={() => handleAppSettingsCancel()}
                            />
                        </Offcanvas.Body>
                    ) : (
                        <Offcanvas.Body>
                            <LLMConfigForm
                                initialState={configToEdit}
                                onSubmit={(config: LLMConfig) => handleFormEdit(config)}
                                onDuplicate={(config: LLMConfig) => handleFormDuplicate(config)}
                                onCancel={() => handleFormCancel()}
                            />
                        </Offcanvas.Body>
                    )
                ) : (
                        <ConfigPresetGroup
                            selectedChat={selectedChat}
                            updateConfigList={(presets) => {setConfigPresets(presets);}}
                            onClose={function (): void {
                                setShowRightDrawer(false);
                            }}
                            handleEditConfig={handleEditConfig}
                            handleDeleteConfigPreset={handleDeleteConfigPreset} 
                            onError={onError} 
                            onSelectedChat={setSelectedChat} 
                        />
                )}
            </Offcanvas>

            {/* Main Content */}
            <div className="flex-grow-1 position-relative bg-body-tertiary" style={{ minHeight: 0 }}>
                {selectedChat && selectedConfig ? (
                    <LLMChat
                        uuid={selectedChat.id}
                        appConfig={appConfig}
                        llmConfig={selectedConfig}
                        initialMessages={selectedChat.messages}
                        onMessagesChange={handleMessagesChange}
                        onError={onError}
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