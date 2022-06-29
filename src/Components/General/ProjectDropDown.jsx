import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { take } from "rxjs";
import { FirebaseService } from "../../Services/Firebase";
import * as _ from 'underscore';
import { NestedDropdown } from "./NestedDropDown";

const loadingHTML = <Dropdown.Item>Loading...</Dropdown.Item>
const emptyHTML = <Dropdown.Item>Empty Project...</Dropdown.Item>
/*
export function BoardDropdown(boardArr, parent) {

    if (b.name.indexOf('/') < 0) {
        tags.push(<Dropdown.Item>{b.name}</Dropdown.Item>)
    }
    else {
        const nameArr = b.name.split('/');
        if (index == nameArr.length - 1) {
            return (<Dropdown.Item>{nameArr[index]}</Dropdown.Item>)
        }
     }
}
*/
export function ProjectDropdown({projectId, children}) {
    const [show, setShow] = useState(false);
    const [boards, setBoards] = useState(null);
    const [displayHTML, setDisplayHTML] = useState(loadingHTML);

    const showDropdown = (e)=>{
        if (!projectId) setBoards(null);

        FirebaseService.AllDocsFromCollection$('ProjectManager/' + projectId + '/Boards')
        .pipe(take(1))
        .subscribe((boards) => {
            let result = [];

            boards.forEach(b => {
                return (<Dropdown.Item>{b.name}</Dropdown.Item>)
                if (b.name.indexOf('/') < 0) {
                    b.parent = b.name;
                    b.title = b.name;
                }
                else {
                    let nesting = b.name.split('/');
                    let title = nesting.pop();
                    b.parent = nesting.join('/');
                    b.title = title;
                }
            });

            let nested = _.groupBy(boards, b => b.title);
            console.log(nested);    
        })
        setShow(!show);
    }

    const hideDropdown = e => {
        setShow(false);
    }

    useEffect(() => {
        if (!boards) {
            setDisplayHTML(loadingHTML);
            return
        }
        else if (boards.length < 1) {
            setDisplayHTML(emptyHTML);
            return;
        }  
    }, [boards])

    

    return (
        <Dropdown.Item as="div">
            <Dropdown variant="primary" drop="end" autoClose="outside" as="div"
            show={show} onMouseEnter={showDropdown} onMouseLeave={hideDropdown}>
                <Dropdown.Toggle>Overview</Dropdown.Toggle>
                <Dropdown.Menu>
                    {
                        displayHTML
                    }
                </Dropdown.Menu>
            </Dropdown>
        </Dropdown.Item>
    );
}