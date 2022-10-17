import { faArrowDownAZ, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef } from "react";
import { Dropdown, FormControl, Stack } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { ResponseSortByOptions, SetResponseSearchFilter, SetResponseSortBy, SetResponseSortReversed, useResponseSearchFilter, useResponseSortBy, useResponseSortReversed } from "./Applications.context";

export const ApplicationsFilterBar = ({}) => {
    const Search = useResponseSearchFilter();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchRef = useRef();
    const SortByOptions = ResponseSortByOptions;
    const Reversed = useResponseSortReversed();
    const Sorting = useResponseSortBy();

    return <div key="search_filter" className="pm-filterbar">
        <Stack direction="horizontal">
            <Dropdown key="items_sorting">
                <Dropdown.Toggle><FontAwesomeIcon icon={faArrowDownAZ} 
                            style={{marginRight:'10px', color: 'gray'}}/>
                            Sort by {Sorting}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light" id="sortMenu">
                        {
                            SortByOptions.map(s => <Dropdown.Item key={"Response_SortBY_" + s} onClick={() => SetResponseSortBy(s)}>{s}</Dropdown.Item>)
                        }
                        <Dropdown.Divider />
                        <Dropdown.Item key="Support_SortByReverse" onClick={() => SetResponseSortReversed(!Reversed)}>Reverse</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            <div className="mx-auto"></div>
            <Stack direction="horizontal">
                
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                    <FormControl
                            value={Search}
                            ref={searchRef}
                            onChange={(e) => SetResponseSearchFilter(e.target.value, searchParams, setSearchParams)}
                            placeholder="Search Responses..."
                            style={{width:'400px', display: 'unset', borderRadius: 0, marginRight: 20}}
                        />
            </Stack>
        </Stack>
    </div>
}