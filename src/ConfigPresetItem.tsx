import React, { useEffect, useRef } from "react";
import { Button, ButtonGroup, ListGroup } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { LLMConfig } from "./LLMConfig"; // Adjust import path as needed
import { isMobile } from 'react-device-detect';
import Marquee from 'react-double-marquee';

const ConfigPresetItem: React.FC<{
    config: LLMConfig;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: (config: LLMConfig) => void;
    onDelete: () => void;
}> = ({ config, isSelected, onSelect, onEdit, onDelete }) => {
    const containerRef = useRef(null);
    useEffect(() => {
        if (isSelected) {
            const element = containerRef.current;
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [isSelected]);
    
    let btnP = "p-2";
    if(isMobile) btnP = "py-2 px-3";
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
                <Button
                    variant={isSelected ? "warning" : "secondary-outline"}
                    onClick={onSelect}
                    onKeyDown={(e) => e.key === 'Enter' && onSelect()}
                    className={"me-auto w-100 text-start" + (!isSelected ? " border-0" : "")}
                    style={{ 
                        flexGrow: 1,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        width: '100%', 
                    }}
                >
                    <div style={{ width: 'auto', whiteSpace: "nowrap", overflow: 'hidden'}}>
                    {/* {config.name || "Untitled Preset"} */}
                    <Marquee style={{width: 'auto'}} scrollWhen={"overflow"}  direction={"left"}>{config.name || "Untitled Preset"}</Marquee>
                    </div>
                </Button>

                <Button
                    variant={isSelected ? "success" : "secondary-outline"}
                    className={btnP + (!isSelected ? " bg-transparent border-0" : "")}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(config);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                >
                    <FontAwesomeIcon icon={faPencil} className="fa-sm" />
                </Button>
                
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

export default ConfigPresetItem;