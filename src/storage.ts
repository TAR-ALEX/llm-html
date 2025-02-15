import { LLMConfig } from "./LLMConfig";
import { LLMChatProps } from "./LLMChat";

export interface Chat {
    configId: string; // Reference to the LLMConfig id
    id: string;
    name: string;
    messages: LLMChatProps['initialMessages'];
}

// Utility function to safely parse JSON
const safeJsonParse = <T>(data: string | null): T | null => {
    try {
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to parse JSON:', error);
        return null;
    }
};

// Load all chats from localStorage
export const loadChats = (): Chat[] => {
    // console.log('Loading chats from localStorage...');
    const loadedChats = safeJsonParse<Chat[]>(localStorage.getItem('llm-chats'));
    // console.log('Loaded chats:', loadedChats);
    return loadedChats || [];
};

// Save all chats to localStorage
export const saveChats = (chats: Chat[]) => {
    // console.log('Saving chats to localStorage...');
    // console.log('Chats to save:', chats);
    localStorage.setItem('llm-chats', JSON.stringify(chats));
    // console.log('Chats saved successfully.');
};

// Add a new chat to localStorage
export const addChat = (chat: Chat) => {
    const chats = loadChats();
    chats.push(chat);
    saveChats(chats);
    console.log('Chat added successfully:', chat);
};

// Delete a chat from localStorage by ID
export const deleteChat = (chatId: string) => {
    const chats = loadChats();
    const updatedChats = chats.filter(chat => chat.id !== chatId);
    saveChats(updatedChats);
    console.log('Chat deleted successfully:', chatId);
};

// Modify an existing chat or create a new one if not found
export const modifyChat = (updatedChat: Chat) => {
    if (!updatedChat || !updatedChat.id) return;
    const chats = loadChats();
    const chatIndex = chats.findIndex(chat => chat.id === updatedChat.id);
    if (chatIndex !== -1) {
        chats[chatIndex] = { ...chats[chatIndex], ...updatedChat };
    } else {
        chats.push(updatedChat);
    }
    saveChats(chats);
    console.log(chatIndex !== -1 ? 'Chat modified successfully:' : 'Chat created successfully:', updatedChat.id);
};

// Load the selected chat ID from localStorage
export const loadSelectedChatId = (): string | null => {
    console.log('Loading selected chat ID from localStorage...');
    const savedId = localStorage.getItem('llm-selected-chat-id');
    console.log('Selected chat ID:', savedId);
    return savedId || null;
};

// Save the selected chat ID to localStorage
export const saveSelectedChatId = (selectedChatId: string | null) => {
    console.log('Saving selected chat ID to localStorage...');
    console.log('Selected chat ID to save:', selectedChatId);
    if (selectedChatId) {
        localStorage.setItem('llm-selected-chat-id', selectedChatId);
        console.log('Selected chat ID saved successfully.');
    } else {
        localStorage.removeItem('llm-selected-chat-id');
        console.log('Selected chat ID removed successfully.');
    }
};

// Load all config presets from localStorage
export const loadConfigPresets = (): LLMConfig[] => {
    // console.log('Loading config presets from localStorage...');
    const loadedConfigs = safeJsonParse<LLMConfig[]>(localStorage.getItem('llm-config-presets'));
    // console.log('Loaded config presets:', loadedConfigs);
    return loadedConfigs || [];
};

// Save all config presets to localStorage
export const saveConfigPresets = (configPresets: LLMConfig[]) => {
    // console.log('Saving config presets to localStorage...');
    // console.log('Config presets to save:', configPresets);
    localStorage.setItem('llm-config-presets', JSON.stringify(configPresets));
    // console.log('Config presets saved successfully.');
};

// Add a new config preset to localStorage
export const addConfigPreset = (config: LLMConfig) => {
    const configPresets = loadConfigPresets();
    configPresets.push(config);
    saveConfigPresets(configPresets);
    console.log('Config preset added successfully:', config);
};

// Delete a config preset from localStorage by ID
export const deleteConfigPreset = (configId: string) => {
    const configPresets = loadConfigPresets();
    const updatedConfigs = configPresets.filter(config => config.id !== configId);
    saveConfigPresets(updatedConfigs);
    console.log('Config preset deleted successfully:', configId);
};

// Modify an existing config preset or create a new one if not found
export const modifyConfigPreset = (updatedConfig: LLMConfig) => {
    if (!updatedConfig || !updatedConfig.id) return;
    const configPresets = loadConfigPresets();
    const configIndex = configPresets.findIndex(config => config.id === updatedConfig.id);
    if (configIndex !== -1) {
        configPresets[configIndex] = { ...updatedConfig };
    } else {
        configPresets.push(updatedConfig);
    }
    saveConfigPresets(configPresets);
    console.log(configIndex !== -1 ? 'Config preset modified successfully:' : 'Config preset created successfully:', updatedConfig.id);
};

// Load the selected config ID from localStorage
export const loadSelectedConfigId = (): string | null => {
    console.log('Loading selected config ID from localStorage...');
    const savedId = localStorage.getItem('llm-selected-config-id');
    console.log('Selected config ID:', savedId);
    return savedId || null;
};

// Save the selected config ID to localStorage
export const saveSelectedConfigId = (selectedConfigId: string | null) => {
    console.log('Saving selected config ID to localStorage...');
    console.log('Selected config ID to save:', selectedConfigId);
    if (selectedConfigId) {
        localStorage.setItem('llm-selected-config-id', selectedConfigId);
        console.log('Selected config ID saved successfully.');
    } else {
        localStorage.removeItem('llm-selected-config-id');
        console.log('Selected config ID removed successfully.');
    }
};