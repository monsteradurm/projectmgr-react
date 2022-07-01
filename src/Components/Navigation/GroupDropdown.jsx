import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { take } from "rxjs";
import { FirebaseService } from "../../Services/Firebase";
import * as _ from 'underscore';
import { NestedDropdown } from "../General/NestedDropDown";
import DropdownItem from "react-bootstrap/esm/DropdownItem";

export function GroupDropdown({projectId, boardId, title}) {
    const [show, setShow] = useState(false);
    const [groupHTML, setGroupHTML] = useState(null);
    
    const showDropdown = (e)=>{
        const loadingHTML = <Dropdown.Item>Loading Groups...</Dropdown.Item>
        const emptyHTML = <Dropdown.Item>Empty Board...</Dropdown.Item>
        if (!projectId) setGroupHTML(null);

        FirebaseService.GroupOptions$(projectId, boardId)
        .pipe(take(1))
        .subscribe((groups) => {
            setGroupHTML(groups ?
                groups.length > 0 ? 
                    groups.map(g => <Dropdown.Item key={g.id}>{g.name}</Dropdown.Item>)
                    : emptyHTML : loadingHTML)
        });

        setShow(!show);
    }

    const hideDropdown = e => {
        setShow(false);
    }

    return (<Dropdown.Item as="div" onMouseEnter={showDropdown} onMouseLeave={hideDropdown}>
    <Dropdown variant="primary" drop="end" autoClose="outside"
    show={show}>
        <Dropdown.Toggle>{title}</Dropdown.Toggle>
        <Dropdown.Menu>
            {
                groupHTML
            }
        </Dropdown.Menu>
    </Dropdown>
</Dropdown.Item>)
}