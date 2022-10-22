import { faArrowDownAZ, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef } from "react";
import { Dropdown, FormControl, Stack } from "react-bootstrap"
import { useSearchParams } from "react-router-dom";
import { AllocationsSortByOptions, SetAllocationsSearchFilter, SetAllocationsSortBy, SetAllocationsSortReversed, useAllocationsSearchFilter, useAllocationsSortBy, useAllocationsSortReversed } from "./Allocations.context"

export const AllocationsFilterBar = ({}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const SortByOptions = AllocationsSortByOptions;
    const Search = useAllocationsSearchFilter();
    const Reversed = useAllocationsSortReversed();
    const Sorting = useAllocationsSortBy();
    const searchRef = useRef();

    return <div key="search_filter" className="pm-filterbar">
        <Stack direction="horizontal">
            <Dropdown key="items_sorting">
                <Dropdown.Toggle><FontAwesomeIcon icon={faArrowDownAZ} 
                            style={{marginRight:'10px', color: 'gray'}}/>
                            Sort by {Sorting}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="light" id="sortMenu">
                        {
                            SortByOptions.map(s => <Dropdown.Item key={"Response_SortBY_" + s} onClick={() => SetAllocationsSortBy(s)}>{s}</Dropdown.Item>)
                        }
                        <Dropdown.Divider />
                        <Dropdown.Item key="Support_SortByReverse" onClick={() => SetAllocationsSortReversed(!Reversed)}>Reverse</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            <div className="mx-auto"></div>
            <Stack direction="horizontal">
        
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                    <FormControl
                            value={Search}
                            ref={searchRef}
                            onChange={(e) => SetAllocationsSearchFilter(e.target.value, searchParams, setSearchParams)}
                            placeholder="Search Allocations..."
                            style={{width:'400px', display: 'unset', borderRadius: 0, marginRight: 20}}
                        />
            </Stack>
        </Stack>
        </div>
}