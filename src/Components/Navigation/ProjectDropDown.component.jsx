import React, { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { take } from "rxjs";
import { useIsAdmin, useMyBoardIds, useSimulatedUser } from "../../App.Users.context";
import { SetCurrentRoute, useMyBoards } from "../../Application.context";
import { FirebaseService } from "../../Services/Firebase.service";
import { NestedDropdown } from "../General/NestedDropDown.component";
import * as _ from 'underscore';
import { useSearchParams } from "react-router-dom";

const loadingProjectHTML = <Dropdown.Item>Loading Project...</Dropdown.Item>
const emptyProjectHTML = <Dropdown.Item>Empty Project...</Dropdown.Item>
const loadingGroupHTML =<Dropdown.Item>Loading Group...</Dropdown.Item>
const emptyGroupHTML = <Dropdown.Item>Empty Group...</Dropdown.Item>

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

function NestedHierarchyToMenu(items, projectId, boardIds, searchParams, setSearchParams) {
    let result = [];
    _.sortBy(items, i => i[0]).forEach( entry => {
        let [title, val] = entry;
        let {boards, children} = val;
        if (children) {
            result.push(
                <NestedDropdown title={title} key={title}>
                    {
                        NestedHierarchyToMenu(Object.entries(children), projectId, boardIds, searchParams, setSearchParams)
                    }
                </NestedDropdown>
            )
        }
        
        const board_name = (name) => name.indexOf('/') >= 0 ? name.split('/').pop() : name;

        if (boards && boards.length > 0) {
            _.sortBy(boards, b => board_name(b.name)).forEach(b => {
                const name = board_name(b.name);
                
                result.push(
                    b.groups.length > 1 ?
                        <NestedDropdown key={b.id} title={name}>
                            {
                                b.groups ?
                                    b.groups.length > 0 ?
                                        _.sortBy(b.groups, g => g.title).map(g => 
                                            <Dropdown.Item key={g.id} 
                                            onClick={
                                                (e) =>
                                                    SetCurrentRoute(
                                                        `Projects?ProjectId=${projectId}&BoardId=${b.id}&GroupId=${g.id}`, searchParams, setSearchParams)}> {g.title}
                                            </Dropdown.Item>)
                                        : emptyGroupHTML
                                    : loadingGroupHTML
                            }
                        </NestedDropdown>
                    : <Dropdown.Item key={b.id} 
                        onClick={(e) => SetCurrentRoute(
                            `Projects?ProjectId=${projectId}&BoardId=${b.id}&GroupId=${b.groups[0].id}`, searchParams, setSearchParams
                        )}>{name}</Dropdown.Item>
                )
            })
        }
    });
    return result.length > 0 ? result : null;
}

export function ProjectDropdown({projectId, MyBoards, children}) {
    //const AllBoards = useAllBoards();

    const [show, setShow] = useState(false);
    const [boards, setBoards] = useState(null);
    const [displayHTML, setDisplayHTML] = useState(loadingProjectHTML);
    const isAdmin = useIsAdmin();
    const SimulatedUser = useSimulatedUser();
    const [searchParams, setSearchParams] = useSearchParams();

    const showDropdown = (e)=>{
        if (!projectId) setBoards(null);
        const boards = _.filter(MyBoards, b => b.projectId === projectId).map(b => b.data);

        let result = {};
        boards.forEach(b => {
            result = NestHierarchyFromName(b, result);
        });

        const html = NestedHierarchyToMenu(Object.entries(result), projectId, searchParams, setSearchParams);
        setDisplayHTML(html);

        setShow(!show);
    }

    const hideDropdown = e => {
        setShow(false);
    }

    useEffect(() => {
        if (!boards) {
            setDisplayHTML(loadingProjectHTML);
            return
        }
        else if (boards.length < 1) {
            setDisplayHTML(emptyProjectHTML);
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