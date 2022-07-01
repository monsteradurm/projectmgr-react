import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { take } from "rxjs";
import { FirebaseService } from "../../Services/Firebase";
import * as _ from 'underscore';
import { NestedDropdown } from "../General/NestedDropDown";
import { result } from "underscore";
import { GroupDropdown } from "./GroupDropdown";

const loadingHTML = <Dropdown.Item>Loading Project...</Dropdown.Item>
const emptyHTML = <Dropdown.Item>Empty Project...</Dropdown.Item>

function NestHierarchyFromName(board, nested) {
    if (board.name.indexOf('/') < 1) {
        if (!nested[board.name])
            nested[board.name] = {boards: [board]};
        else
            nested[board.name].boards.push(board);
    }

    else {
        const nameArr = board.name.split('/');
        let last = nested;
        for (var n=0; n<nameArr.length; n++) {
            if (n === nameArr.length - 1) {
                if (!last[nameArr[n]]) 
                    last[nameArr[n]] = {boards: [board]}
                else if (!last[nameArr[n]].boards)
                    last[nameArr[n]].boards = [board]
                else
                    last[board.name].boards.push(board);
            } else {
                if (!last[nameArr[n]]) 
                    last[nameArr[n]] = {children: {}}
                else if (!last[nameArr[n]].children)
                    last[nameArr[n]].children = {};
            }

            last = last[nameArr[n]].children;
        }
    }
    return nested;
}

function NestedHierarchyToMenu(items, projectId) {
    let result = [];
    items.forEach( entry => {

        let [title, val] = entry;
        let {boards, children} = val;
        if (children) {
            result.push(
                <NestedDropdown title={title} key={title}>
                    {
                        NestedHierarchyToMenu(Object.entries(children), projectId)
                    }
                </NestedDropdown>
            )
        }
        if (boards && boards.length > 0) {
            
            boards.forEach(b => {
                const name = b.name.split('/').pop();
                result.push(
                    <GroupDropdown key={b.id} projectId={projectId} boardId={b.id} title={name}></GroupDropdown>
                )
            })
        }
    });
    return result.length > 0 ? result : null;
}

export function ProjectDropdown({projectId, children}) {
    const [show, setShow] = useState(false);
    const [boards, setBoards] = useState(null);
    const [displayHTML, setDisplayHTML] = useState(loadingHTML);

    const showDropdown = (e)=>{
        if (!projectId) setBoards(null);

        FirebaseService.BoardOptions$(projectId)
        .pipe(take(1))
        .subscribe((boards) => {
            let result = {};

            boards.forEach(b => {
                result = NestHierarchyFromName(b, result);
            })
            const html = NestedHierarchyToMenu(Object.entries(result), projectId);
            setDisplayHTML(html);
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
        <Dropdown.Item as="div" onMouseEnter={showDropdown} onMouseLeave={hideDropdown}>
            <Dropdown variant="primary" drop="end" autoClose="outside"
            show={show}>
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