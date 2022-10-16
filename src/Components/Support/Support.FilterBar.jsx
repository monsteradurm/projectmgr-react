import { faArrowDownAZ, faFilter, faMagnifyingGlass, faUserGroup } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useRef, useState } from "react"
import { Dropdown, FormControl, Stack } from "react-bootstrap"
import { useSearchParams } from "react-router-dom"
import { SetSupportSearchFilter, SetSupportSortBy, SetSupportSortReversed, SupportSortOptions, useSupportGroups, useSupportSearchFilter, useSupportSortBy, useSupportSortReversed } from "./Support.context"

const OnGroupSelected = (group, searchParams, setSearchParams) => {
    searchParams.set('Group', group);
    setSearchParams(searchParams);
}

export const SupportFilterBar = ({Board, Group}) => {
    const Groups = useSupportGroups(Board);
    const Search = useSupportSearchFilter();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchRef = useRef();
    const SortByOptions = SupportSortOptions;
    const Reversed = useSupportSortReversed();
    const Sorting = useSupportSortBy();
    if (!Groups) return <></>
    return (
    <div key="search_filter" className="pm-filterbar">
        <Stack direction="horizontal">
            <Dropdown key="items_groups">
                <Dropdown.Toggle><FontAwesomeIcon icon={faUserGroup} 
                        style={{marginRight:'10px', color: 'gray'}}/>
                        {Group}
                </Dropdown.Toggle>
                <Dropdown.Menu variant="light">
                {
                    Groups.map((d) => 
                        <Dropdown.Item key={"Group_" + d.title} 
                        onClick= {() => OnGroupSelected(d.title, searchParams, setSearchParams)}>
                            {d.title}
                        </Dropdown.Item> 
                    )
                }
                    <Dropdown.Divider></Dropdown.Divider>
                    <Dropdown.Item key={"Group_AllGroups"} 
                        onClick= {() => OnGroupSelected('All Groups', searchParams, setSearchParams)}>
                            All Groups
                    </Dropdown.Item> 
                </Dropdown.Menu>
            </Dropdown>
            <Dropdown key="items_sorting">
                <Dropdown.Toggle><FontAwesomeIcon icon={faArrowDownAZ} 
                            style={{marginRight:'10px', color: 'gray'}}/>
                            Sort by {Sorting}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light" id="sortMenu">
                        
                        <Dropdown.Divider></Dropdown.Divider>
                        {
                            SortByOptions.map(s => <Dropdown.Item key={"Support_SortBY_" + s} onClick={() => SetSupportSortBy(s)}>{s}</Dropdown.Item>)
                        }
                        <Dropdown.Divider />
                        <Dropdown.Item key="Support_SortByReverse" onClick={() => SetSupportSortReversed(!Reversed)}>Reverse</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            <div className="mx-auto"></div>
            <Stack direction="horizontal">
                
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                    <FormControl
                            value={Search}
                            ref={searchRef}
                            onChange={(e) => SetSupportSearchFilter(e.target.value, searchParams, setSearchParams)}
                            placeholder="Search Tickets..."
                            style={{width:'400px', display: 'unset', borderRadius: 0, marginRight: 20}}
                        />
                    
            </Stack>
        </Stack>
    </div>)
}