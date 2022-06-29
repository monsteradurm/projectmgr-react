import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";

export function NestedDropdown({title, children}) {
    const [show, setShow] = useState(false);
    const showDropdown = (e)=>{
        setShow(!show);
    }
    const hideDropdown = e => {
        setShow(false);
    }
    return (
        <Dropdown.Item as="div">
            <Dropdown variant="primary" drop="end" autoClose="outside" as="div"
            show={show} onMouseEnter={showDropdown} onMouseLeave={hideDropdown}>
                <Dropdown.Toggle>{title}</Dropdown.Toggle>
                <Dropdown.Menu>
                    { children }
                </Dropdown.Menu>
            </Dropdown>
        </Dropdown.Item>
    );
}