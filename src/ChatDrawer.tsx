import React, { useState, useEffect, useRef } from 'react';
import LLMChat, { LLMChatProps } from './LLMChat';
import { v4 as uuidv4 } from 'uuid';
import { Button, Navbar, Offcanvas, Stack, Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faExchangeAlt, faCaretDown, faGears } from '@fortawesome/free-solid-svg-icons';
import LLMConfigForm from './LLMConfigForm';
import { LLMConfig } from './LLMConfig';
import { Chat, loadConfigPresets, modifyChat, addConfigPreset, deleteConfigPreset, modifyConfigPreset, loadAppConfig, saveAppConfig, loadSelectedChat, loadConfigPreset, ChatListEntry } from './storage';
import AppConfigForm from './AppConfigForm';
import { AppConfig, defaultAppConfig } from './AppConfig';
import ChatListGroup from './ChatListGroup';
import ConfigPresetGroup, { getUniqueName } from './ConfigPresetGroup';
import OffcanvasNavigator, { OffcanvasNavigatorInstance } from './OffcanvasNavigator';

interface ChatDrawerInterface {
    onError?: (header: string, content: string) => void;
}

const ChatDrawer: React.FC<ChatDrawerInterface> = ({onError}) => {
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
    const [selectedChat, setSelectedChatPrivate] = useState<ChatListEntry | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<LLMConfig | null>(null);
    //NOTE: dont use setSelectedConfig, set it by setting the chats config via setSelectedChat
    
    const rightNavigatorRef = useRef<OffcanvasNavigatorInstance>(null);
    const leftNavigatorRef = useRef<OffcanvasNavigatorInstance>(null);

    const setSelectedChat = (c: Chat) => {
        setSelectedChatPrivate(c);
        setSelectedConfig(loadConfigPreset(c?.configId));
    };

    useEffect(()=> {
        var cfg = loadAppConfig();
        setAppConfig(cfg ?? defaultAppConfig);
        const chat = loadSelectedChat();
        setSelectedChat(chat);
    }, []);

    useEffect(()=> {
    }, [appConfig]);

    const handleEditConfig = (configToEdit: LLMConfig) => {
        if (configToEdit) {
            rightNavigatorRef?.current?.push(llmConfigEditView(configToEdit), {className:"responsive-offcanvas"});
        }
    };

    const handleFormEdit = (config: LLMConfig) => {
        const configPresets = loadConfigPresets();
        // Get the old name from configPresets
        const oldConfig = configPresets.find(c => c.id === config.id);
        const oldName = oldConfig ? oldConfig.name : '';
    
        if (config.name !== oldName) {
            config.name = getUniqueName(configPresets.map(c => c.name), config.name);
        }
        modifyConfigPreset(config);
        rightNavigatorRef?.current.pop();
    };

    const handleFormDuplicate = (config: LLMConfig) => {
        const configPresets = loadConfigPresets();
        config.id = uuidv4();
        config.name = getUniqueName(configPresets.map(c => c.name), config.name);
        addConfigPreset(config);
        rightNavigatorRef?.current.pop();
    };

    const handleAppSettingsSave = (config: AppConfig) => {
        saveAppConfig(config);
        setAppConfig(config);
        rightNavigatorRef?.current.pop()
    };

    const handleDeleteConfigPreset = (configId: string) => {
        deleteConfigPreset(configId);
    };

    const chatSelectionView = <ChatListGroup 
        onError={onError} 
        onClose={() => leftNavigatorRef?.current?.pop()} 
        onSelectedChat={(e) => {setSelectedChat(e);}}>
    </ChatListGroup>;
    
    const llmConfigSelectionView = <ConfigPresetGroup
        selectedChat={selectedChat}
        onClose={() => rightNavigatorRef?.current?.pop()}
        handleEditConfig={handleEditConfig}
        handleDeleteConfigPreset={handleDeleteConfigPreset} 
        onError={onError} 
        onSelectedChat={setSelectedChat} 
    />;

    const llmConfigEditView = (cfg: LLMConfig) =>
    <>
        <Offcanvas.Header closeButton>
            <Offcanvas.Title>LLM Config</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <LLMConfigForm
                initialState={cfg}
                onSubmit={(config: LLMConfig) => handleFormEdit(config)}
                onDuplicate={(config: LLMConfig) => handleFormDuplicate(config)}
                onCancel={() => rightNavigatorRef?.current.pop()}
            />
        </Offcanvas.Body>;
    </>

    const appConfigEditView = <>
         <Offcanvas.Header closeButton>
            <Offcanvas.Title>Settings</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <AppConfigForm
                initialState={appConfig}
                onSubmit={handleAppSettingsSave}
                onCancel={() => rightNavigatorRef?.current.pop()}
            />
        </Offcanvas.Body>
    </>;

    return (
        <div className="d-flex flex-column h-100 bg-body">
            {/* Top Navbar */}
            <Navbar className="border-bottom p-2 m-0">
                <Container fluid>
                    <Stack className='w-100' direction="horizontal" gap={0}>
                        <Button
                            variant="primary"
                            onClick={() => leftNavigatorRef?.current?.push(chatSelectionView)}
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
                            onClick={() => rightNavigatorRef?.current?.push(llmConfigSelectionView)}
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
                            onClick={() => rightNavigatorRef?.current?.push(appConfigEditView, {className:"responsive-offcanvas"})}
                            className="ms-2"
                        >
                            <FontAwesomeIcon icon={faGears} />
                        </Button>
                    </Stack>
                </Container>
            </Navbar>

            <OffcanvasNavigator ref={leftNavigatorRef} placement='start'/>
            <OffcanvasNavigator ref={rightNavigatorRef} placement='end'/>

            {/* Main Content */}
            <div className="flex-grow-1 position-relative bg-body-tertiary" style={{ minHeight: 0 }}>
                {selectedChat && selectedConfig ? (
                    <LLMChat
                        uuid={selectedChat.id}
                        appConfig={appConfig}
                        llmConfig={selectedConfig}
                        // initialMessages={selectedChat.messages}
                        // onMessagesChange={handleMessagesChange}
                        onError={onError}
                    />
                ) : selectedChat ? (
                    <div className="d-flex h-100 justify-content-center align-items-center text-body-secondary">
                        No configuration selected. <br /> Please select or create one.
                    </div>
                ) : (
                    <div className="d-flex h-100 justify-content-center align-items-center text-body-secondary">
                        Select a chat or create a new one
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ChatDrawer);