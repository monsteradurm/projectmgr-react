import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";

export const NestedDropdown = ({title, children}) => {
    const [show, setShow] = useState(false);
    const showDropdown = (e)=>{
        setShow(!show);
    }
    const hideDropdown = e => {
        setShow(false);
    }
    return (
        <Dropdown.Item as="div" onMouseEnter={showDropdown} onMouseLeave={hideDropdown}>
            <div>
                <Dropdown variant="primary" drop="end" autoClose="outside" show={show}>
                    <Dropdown.Toggle>{title}</Dropdown.Toggle>
                    <Dropdown.Menu>
                        { children }
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </Dropdown.Item>
    );
}