import { Offcanvas, ListGroup, Button } from "react-bootstrap";
import ConfigPresetItem from "./ConfigPresetItem";
import { addConfigPreset, Chat, loadConfigPresets, modifyChat } from "./storage";
import React, { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { LLMConfig } from "./LLMConfig";


interface ConfigListGroupProps {
    selectedChat: Chat | null;
    onClose: () => void;
    handleEditConfig: (cfg: LLMConfig) => void;
    handleDeleteConfigPreset: (configId: string) => void;
    onError: (header: string, msg: string) => void;
    onSelectedChat: (chat: Chat) => void;
}

const ConfigPresetGroup: React.FC<ConfigListGroupProps> = ({ selectedChat, onClose, onError, handleEditConfig, handleDeleteConfigPreset, onSelectedChat }) => {
    const [selectedConfig, setSelectedConfig] = useState(selectedChat?.configId);
    const [configPresets, setConfigPresets] = useState(loadConfigPresets());

    const handleDelete = (cfgID:string) => {
        if(cfgID == selectedConfig){
            const updatedChat = { ...selectedChat, configId: null };
            modifyChat(updatedChat);
            onSelectedChat(updatedChat);
            setSelectedConfig(null);
        }
        handleDeleteConfigPreset(cfgID);
        let presets = loadConfigPresets();
        setConfigPresets(presets);
    };

    const createNewPreset = () => {
        const newConfig = generateDefaultLLMConfig();
        newConfig.name = getUniqueName(configPresets.map(c => c.name), newConfig.name);
        addConfigPreset(newConfig);
        let presets = loadConfigPresets();
        setConfigPresets(presets);
    };

    return <>
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
        <Offcanvas.Body className="p-0 d-flex flex-column">
            <ListGroup variant="flush" className="overflow-auto flex-grow-1">
                {configPresets.map(config => (
                    <ConfigPresetItem
                        key={config.id}
                        config={config}
                        isSelected={selectedConfig === config.id}
                        onSelect={() => {
                            if (selectedChat) {
                                const updatedChat = { ...selectedChat, configId: config.id };
                                modifyChat(updatedChat);
                                onSelectedChat(updatedChat);
                                setSelectedConfig(config.id);
                            }
                            if (window.innerWidth < 768) onClose();
                        }}
                        onEdit={(config) => handleEditConfig(config)}
                        onDelete={() => handleDelete(config.id)}
                    />
                ))}
            </ListGroup>
        </Offcanvas.Body>
    </>
}


export default ConfigPresetGroup;

export function getUniqueName(existingNames: string[], newName: string): string {
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


function generateDefaultLLMConfig() {
    return {
        id: uuidv4(),
        name: `Default`,
        baseURL: "http://localhost:8080",
        chatCompletionsPath: "/v1/chat/completions",
        defaultSystemPrompt: "You are a helpful assistant.",
    };
}