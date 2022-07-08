import { faArrowDownAZ, faChartBar, faChartGantt, faFilter, faLayerGroup, faMagnifyingGlass, faTable, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Accordion, AccordionTab } from "primereact/accordion";
import { useMemo, useRef, useState } from "react";
import { Dropdown, FormControl, Stack } from "react-bootstrap"
import { useSearchParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import './ProjectFilterBar.component.scss'
const ViewIconMap = {
    Table: faTable,
    Chart: faChartBar,
    Gantt: faChartGantt
}

export const ProjectFilterBar = ({Group, GroupOptions, DepartmentOptions, params, filters}) => {
    const { Department, GroupId, View, Sorting, ReverseSorting } = params;
    const { Search } = filters;
    const [activeFilterIndex, setActiveFilterIndex] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchRef = useRef();

    const SetSearch = (d) => {
        if (d !== Search) {
            searchParams.set('Search', d);
            setSearchParams(searchParams);
        }
    }

    const SetDepartment = (d) => {
        if (d !== Department) {
            searchParams.set('Department', d);
            setSearchParams(searchParams);
        }
    }

    const SetGroupId = (id) => {
        if (id !== GroupId) {
            searchParams.set('GroupId', id);
            setSearchParams(searchParams);
        }
    }
    
    const SetView = (v) => {
        if (v !== View) {
            searchParams.set('View', v);
            setSearchParams(searchParams);
        }
    }

    const SetSorting = (s) => {
        if (s !== Sorting) {
            searchParams.set('Sorting', s);
            setSearchParams(searchParams);
        }
    }

    const ToggleReverseSorting = () => {
            searchParams.set('ReverseSorting', 
            ReverseSorting === 'true' ? 'false' : 'true');
            setSearchParams(searchParams);
    }

    return (
        <div key="overview_filter" className="pm-filterbar">
            <Stack direction="horizontal" gap={3}>
                <Dropdown key="department_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faUserGroup} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        {Department}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light">
                    {
                        DepartmentOptions.map((d) => 
                            <Dropdown.Item key={d} 
                            onClick= {() => SetDepartment(d)}>
                                {d}
                            </Dropdown.Item> 
                        )
                    }
                    </Dropdown.Menu>
                </Dropdown>
            
            <div style={{width:'100%'}}></div>
            <Dropdown key="items_viewing">
            <Dropdown.Toggle><FontAwesomeIcon icon={ViewIconMap[View]} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        View as {View}
                </Dropdown.Toggle>
                <Dropdown.Menu variant="light" id="sortMenu">
                    <Dropdown.Item onClick={() => SetView('Table')}>
                        Table
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetView('Gantt')}>
                        Gantt
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetView('Chart')}>
                        Chart
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <Dropdown key="items_sorting">
            <Dropdown.Toggle><FontAwesomeIcon icon={faArrowDownAZ} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        Sort by {Sorting}
                </Dropdown.Toggle>
                <Dropdown.Menu variant="light" id="sortMenu">
                    <Dropdown.Item onClick={() => SetSorting('Name')}>Name</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetSorting('Artist')}>Artist</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetSorting('Director')}>Director</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetSorting('Start Date')}>Start Date</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetSorting('End Date')}>End Date</Dropdown.Item>
                    <Dropdown.Divider></Dropdown.Divider>
                    <Dropdown.Item onClick={() => 
                        ToggleReverseSorting(ReverseSorting)}>
                            Reverse
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            { /*
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
                            value={Search}
                            ref={searchRef}
                            onChange={(e) => SetSearch(e.target.value)}
                            placeholder="Search By Name.."
                            style={{width:'300px'}}
                        />
                    </Stack>

                    <Accordion activeIndex={activeFilterIndex} onTabChange={(e) => setActiveFilterIndex(e.index) }>
                        <AccordionTab key="feedback" header="Timeline">
                            <DatePicker />
                        </AccordionTab>
                    </Accordion>
                        
                    </Dropdown.Menu>
                </Dropdown> 
                    */ }
            <Dropdown key="group_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faLayerGroup} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        {Group?.title}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light">
                    {
                        GroupOptions.map((g) => 
                            <Dropdown.Item key={g.id} 
                                onClick={() => SetGroupId(g.id)}>
                                {g.title}
                            </Dropdown.Item> 
                        )
                    }
                    </Dropdown.Menu>
                </Dropdown>   
            </Stack>
        </div>
    )
}