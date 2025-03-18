import React, { useState, useRef, useEffect } from 'react';
import { Button, ListGroup, Form, ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPencil, faSave } from '@fortawesome/free-solid-svg-icons';
import { Chat } from './storage';
import { isMobile } from 'react-device-detect';

const ChatListItem: React.FC<{
    chat: Chat;
    isSelected: boolean;
    onSelect: () => void;
    onRename: (newName: string) => void;
    onDelete: () => void;
}> = ({ chat, isSelected, onSelect, onRename, onDelete }) => {
    const containerRef = useRef(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(chat.name);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        if (isSelected) {
            const element = inputRef.current || saveButtonRef.current;
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [isSelected]);

    const handleRename = () => {
        if (editedName.trim()) {
            onRename(editedName.trim());
        }
        setIsEditing(false);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (saveButtonRef.current && saveButtonRef.current.contains(e.relatedTarget as Node)) {
            return;
        }
        handleRename();
    };

    let btnP = "p-2";
    if (isMobile) btnP = "py-2 px-3";

    return (
        <ListGroup.Item
            ref={containerRef}
            as="div"
            onClick={onSelect}
            role="button"
            tabIndex={0}
            className="d-flex pt-1 pb-0 px-2 justify-content-between align-items-center rounded-0 border-0 list-group-item-action"
            style={{ minWidth: 0 }}
        >
            <ButtonGroup className="w-100 m-0 p-0">
                {isEditing ? (
                    <Form.Control
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        autoFocus
                        className="me-2"
                        ref={inputRef} // Add ref to the input
                    />
                ) : (
                    <Button
                        variant={isSelected ? "primary" : "secondary-outline"}
                        onClick={onSelect}
                        onKeyDown={(e) => e.key === 'Enter' && onSelect()}
                        className={"me-auto w-100 text-start" + (!isSelected ? " bg-transparent border-0" : "")}
                    >
                        {chat.name}
                    </Button>
                )}
                {isEditing ? (
                    <Button
                        ref={saveButtonRef}
                        variant={isSelected ? "success" : "secondary-outline"}
                        className={btnP + (!isSelected ? " bg-transparent border-0" : "")}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRename();
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                    >
                        <FontAwesomeIcon icon={faSave} className="fa-sm" />
                    </Button>
                ) : (
                    <Button
                        variant={isSelected ? "success" : "secondary-outline"}
                        className={btnP + (!isSelected ? " bg-transparent border-0" : "")}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                    >
                        <FontAwesomeIcon icon={faPencil} className="fa-sm" />
                    </Button>
                )}
                <Button
                    variant={isSelected ? "danger" : "secondary-outline"}
                    className={btnP + (!isSelected ? " bg-transparent border-0" : "")}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <FontAwesomeIcon icon={faTrash} className="fa-sm" />
                </Button>
            </ButtonGroup>
        </ListGroup.Item>
    );
};

export default ChatListItem;