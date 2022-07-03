import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { of } from "rxjs";
import { FirebaseService } from '../../Services/Firebase';
import { NavigationService } from '../../Services/Navigation';
import * as _ from 'underscore';
import { Dropdown, FormControl, Stack } from 'react-bootstrap';
import { faUserGroup, faLayerGroup, faFilter, faArrowDownAZ, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { Accordion, AccordionTab } from 'primereact/accordion';
import './Overview.scss';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ScrollingPage } from "../General/ScrollingPage";
import { Fieldset } from "primereact/fieldset";
import { BehaviorSubject, map, shareReplay } from "rxjs";
import { ProjectItem } from "./ProjectItem";

export const ProjectOverview = ({headerRef}) => {
    
    
    const [params] = useSearchParams();
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);

    const [observedItems, setObservedItems] = useState(of([]));
    const [observedBoard, setObservedBoard] = useState(of(null));

    const [department, setDepartment] = useState(null);
    const [departmentOptions, setDepartmentOptions] = useState(['All Departments']);
    const [groupOptions, setGroupOptions] = useState([]);
    const [group, setGroup] = useState(null);
    const [activeFilterIndex, setActiveFilterIndex] = useState(null);
    const filterBarRef = useRef();
    


    useEffect(() => {
        let filtered = items ? items : [];
        if (filtered && filtered.length > 0) {
            if (department !== 'All Departments')
            filtered = _.filter(items, i => i.Department.text.indexOf(department) >= 0);
        }
        let nested = _.groupBy(filtered, (i) => {
            if (i.name.indexOf('/'))
                return i.name.split('/')[0];
            return 'Other'
        })
        setFilteredItems(
            nested
        );
    }, [items, department]);

    useEffect(() => {
        const projectId = params.get("ProjectId");
        const boardId = params.get("BoardId");
        const groupId = params.get("GroupId");

        if (observedItems !== null)
            try { observedItems.unsubscribe() } catch { };
        if (observedBoard !== null)
            try { observedBoard.unsubscribe() } catch { };

        setObservedItems(FirebaseService.Items$(projectId, boardId, groupId));
        setObservedBoard(FirebaseService.Board$(projectId, boardId));
        return () => { }
    }, [params]);

    useEffect(() => {
        let itemsSub = observedItems.subscribe((data) => {
            const departments = _.uniq(_.flatten(_.map(data, i => i.Department.value)));
            departments.push('All Departments');
            setDepartmentOptions(departments);
            let currentDep = params.get("Department");
            if (!currentDep || departments.indexOf(currentDep) < 0) {
                setDepartment(departments[0]);
            } else {
                setDepartment(currentDep);
            }
            setItems(data);
        });
        let boardSub = observedBoard.subscribe((board)=> {
            if (board) {
                let group = null;
                setGroupOptions(board.groups);
                if (board.groups.length === 1)
                    group = board.groups[0].title;
                    
                else {
                    group = _.first(board.groups, (g) => g.id === params.get('GroupId')).title;
                }

                setGroup(group)
                NavigationService.SetTitles([
                    "Projects", "Overview",
                    params.get("ProjectId"),
                    board.name,
                    group
                ])
            }
        })
        return () => {
            itemsSub.unsubscribe();
            boardSub.unsubscribe();
        }
    }, [observedBoard, observedItems]);

    return (
    <>
        <div className="pm-filterbar" ref={filterBarRef}>
            <Stack direction="horizontal" gap={3}>
                <Dropdown key="department_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faUserGroup} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        {department}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light">
                    {
                        departmentOptions.map((d) => 
                            <Dropdown.Item key={d} onClick={() => { if (d !== department) setDepartment(d); }}>{d}</Dropdown.Item> 
                        )
                    }
                    </Dropdown.Menu>
                </Dropdown>
            
            <div style={{width:'100%'}}></div>
            <Dropdown key="items_sorting">
            <Dropdown.Toggle><FontAwesomeIcon icon={faArrowDownAZ} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        Sort by Name
                </Dropdown.Toggle>
                <Dropdown.Menu variant="light" id="sortMenu">
                    <Dropdown.Item>Name</Dropdown.Item>
                    <Dropdown.Item>Artist</Dropdown.Item>
                    <Dropdown.Item>Director</Dropdown.Item>
                    <Dropdown.Item>Start Date</Dropdown.Item>
                    <Dropdown.Item>End Date</Dropdown.Item>
                    <Dropdown.Divider></Dropdown.Divider>
                    <Dropdown.Item>Reverse</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <Dropdown key="items_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faFilter} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        Filters
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light" id="filtersMenu">
                    <Stack direction="horizontal" gap={3} className="search-tab"
                    style={{marginBottom:'10px', marginLeft:'10px'}}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        <FormControl
                            placeholder="Search By Name.."
                            style={{width:'300px'}}
                        />
                    </Stack>
                    <Accordion activeIndex={activeFilterIndex} onTabChange={(e) => setActiveFilterIndex(e.index) }>
                        <AccordionTab key="Status" header="Status">
                            Status A
                        </AccordionTab>
                        <AccordionTab key="artists" header="Artists">
                            Artist A
                        </AccordionTab>
                        <AccordionTab key="directors" header="Directors">
                            Director A
                        </AccordionTab>
                        <AccordionTab key="feedback" header="Timeline">
                            Range
                        </AccordionTab>
                        <AccordionTab key="feedback" header="Task">
                            Tag A
                        </AccordionTab>
                        <AccordionTab key="feedback" header="Feedback">
                            Tag A
                        </AccordionTab>
                        
                    </Accordion>
                        
                    </Dropdown.Menu>
                </Dropdown> 
            
            <Dropdown key="group_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faLayerGroup} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        {group}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light">
                    {
                        groupOptions.map((g) => 
                            <Dropdown.Item key={g.id} onClick={() => { }}>{g.title}</Dropdown.Item> 
                        )
                    }
                    </Dropdown.Menu>
                </Dropdown>   
            </Stack>
        </div>
        <ScrollingPage key="page_scroll" offsets={[headerRef, filterBarRef]}>
            <div id="Overview_Items">
            {
                _.filter(Object.keys(filteredItems), (i) => i !== 'Other').map( i => 
                   <div class="pm-item-container">
                       <div className="pm-element">{i}</div>
                        {
                        filteredItems[i].map(item => 
                            <div class="pm-task-conainer">
                                <ProjectItem key={item.id} item={item} />
                            </div>
                           )
                        }
                   </div>
                )
            }
            </div>
        </ScrollingPage>
            
    </>)
}