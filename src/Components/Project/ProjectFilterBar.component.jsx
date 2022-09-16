import { faArrowDownAZ, faChartBar, faChartGantt, faFilter, faLayerGroup, 
    faMagnifyingGlass, faTable, faUserGroup, faObjectGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";
import { Dropdown, FormControl, Stack } from "react-bootstrap"
import { useSearchParams } from "react-router-dom";
import './ProjectFilterBar.component.scss'

const ViewIconMap = {
    Table: faTable,
    Chart: faChartBar,
    Gantt: faChartGantt
}

export const ProjectFilterBar = ({Group, GroupOptions, DepartmentOptions, params, filters}) => {
    const { Department, GroupId, View, Sorting, ReverseSorting, Grouping } = params;
    const { Search } = filters;
    const [activeFilterIndex, setActiveFilterIndex] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchRef = useRef();

    const SetParameter = (p, key) => {
        if (p !== params[key]) {
            searchParams.set(key, p);
            setSearchParams(searchParams)
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
                            onClick= {() => SetParameter(d, 'Department')}>
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
                    <Dropdown.Item onClick={() => SetParameter('Table', 'View')}>
                        Table
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Gantt', 'View')}>
                        Gantt
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Chart', 'View')}>
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
                    <Dropdown.Item onClick={() => SetParameter('Name', 'Sorting')}>Name</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Status', 'Sorting')}>Status</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Artist', 'Sorting')}>Artist</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Director', 'Sorting')}>Director</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Start Date', 'Sorting')}>Start Date</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('End Date', 'Sorting')}>End Date</Dropdown.Item>
                    <Dropdown.Divider></Dropdown.Divider>
                    <Dropdown.Item onClick={() => 
                        ToggleReverseSorting(ReverseSorting)}>
                            Reverse
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <Dropdown key="grouping_filter">
                <Dropdown.Toggle><FontAwesomeIcon icon={faObjectGroup} 
                            style={{marginRight:'10px', color: 'gray'}}/>
                            Group By {Grouping}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item onClick={() => SetParameter('Element', 'Grouping')}>Element</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Status', 'Grouping')}>Status</Dropdown.Item>
                    {
                        Department == 'All Departments' ?
                        <Dropdown.Item onClick={() => SetParameter('Department', 'Grouping')}>
                            Department
                        </Dropdown.Item> : null
                    }
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => SetParameter('None', 'Grouping')}>None</Dropdown.Item>
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
                                value={Search}
                                ref={searchRef}
                                onChange={(e) => SetParameter(e.target.value, 'Search')}
                                placeholder="Search By Name.."
                                style={{width:'300px'}}
                            />
                        </Stack>
                    {
                    /*
                    <Accordion activeIndex={activeFilterIndex} onTabChange={(e) => setActiveFilterIndex(e.index) }>
                        <AccordionTab key="feedback" header="Timeline">
                            <DatePicker />
                        </AccordionTab>
                    </Accordion>
                    */
                    }   
                    </Dropdown.Menu>
                </Dropdown> 
            
            <Dropdown key="group_filter">
                    <Dropdown.Toggle><FontAwesomeIcon icon={faLayerGroup} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        {Group?.title}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light">
                    {
                        GroupOptions.map((g) => 
                            <Dropdown.Item key={g.id} 
                                onClick={() => SetParameter(g.id, 'GroupId')}>
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