import { faArrowDownAZ, faChartBar, faChartGantt, faFilter, faLayerGroup, 
    faMagnifyingGlass, faTable, faUserGroup, faObjectGroup, faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef, useState } from "react";
import { Dropdown, FormControl, Stack } from "react-bootstrap"
import { useSearchParams } from "react-router-dom";
import { useBoardParams } from "./Context/Project.context";
import './Project.Filters.component.scss'
import { useDepartmentOptions, useGroup, useGroupOptions, useDepartment } from "./Context/Project.Objects.context";
import { useBoardSortBy, useBoardView, useBoardReverseSorting, useBoardSearchFilter,
    useBoardGrouping } from "./Context/Project.Params.context";
import { SUSPENSE } from "@react-rxjs/core";

const ViewIconMap = {
    Table: faTable,
    Chart: faChartBar,
    Timeline: faChartGantt,
    Calendar: faCalendar
}

export const ProjectFilters = () => {
    const BoardView = useBoardView();
    const Department = useDepartment();
    const DepartmentOptions = useDepartmentOptions();
    const GroupOptions = useGroupOptions();
    const Group = useGroup();
    const Sorting = useBoardSortBy();
    const ReverseSorting = useBoardReverseSorting();
    const Grouping = useBoardGrouping();
    const Search = useBoardSearchFilter();
    const [searchParams, setSearchParams] = useSearchParams();
    const BoardParams = useBoardParams();
    const searchRef = useRef()

    const SetParameter = (p, key) => {
        if (p !== BoardParams[key]) {
            searchParams.set(key, p);
            setSearchParams(searchParams)
        }
    }

    if (Group === SUSPENSE || !GroupOptions || GroupOptions === SUSPENSE)
        return <></>

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
            <Dropdown.Toggle><FontAwesomeIcon icon={ViewIconMap[BoardView]} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        View as {BoardView}
                </Dropdown.Toggle>
                <Dropdown.Menu variant="light" id="sortMenu">
                    <Dropdown.Item onClick={() => SetParameter('Table', 'BoardView')}>
                        Table
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Calendar', 'BoardView')}>
                        Calendar
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Timeline', 'BoardView')}>
                        Timeline
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Chart', 'BoardView')}>
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
                    <Dropdown.Item onClick={() => SetParameter('Name', 'BoardSortBy')}>Name</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Status', 'BoardSortBy')}>Status</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Artist', 'BoardSortBy')}>Artist</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Director', 'BoardSortBy')}>Director</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Start Date', 'BoardSortBy')}>Start Date</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('End Date', 'BoardSortBy')}>End Date</Dropdown.Item>
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
                    <Dropdown.Item onClick={() => SetParameter('Element', 'BoardGrouping')}>Element</Dropdown.Item>
                    <Dropdown.Item onClick={() => SetParameter('Status', 'BoardGrouping')}>Status</Dropdown.Item>
                    {
                        Department == 'All Departments' ?
                        <Dropdown.Item onClick={() => SetParameter('Department', 'BoardGrouping')}>
                            Department
                        </Dropdown.Item> : null
                    }
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => SetParameter('None', 'BoardGrouping')}>None</Dropdown.Item>
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
                                onChange={(e) => SetParameter(e.target.value, 'BoardSearchFilter')}
                                placeholder="Search By Name.."
                                style={{width:'300px'}}
                            />
                        </Stack>
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