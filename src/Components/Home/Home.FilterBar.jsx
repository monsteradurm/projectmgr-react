import { faFilter, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useRef, useState } from "react"
import { Dropdown, FormControl, Stack } from "react-bootstrap"
import { useSearchParams } from "react-router-dom"
import { SetHomeSearchFilter, useHomeSearchFilter, useHomeView } from "./Home.context"

export const HomeFilterBar = () => {
    const Search = useHomeSearchFilter();
    const [searhParams, setSearchParams] = useSearchParams();
    const searchRef = useRef();
    const View = useHomeView();

    return (
    <div key="home_filter" className="pm-filterbar">
        <Stack direction="horizontal">
        <div className="mx-auto"></div>

                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <FormControl
                        value={Search}
                        ref={searchRef}
                        onChange={(e) => SetHomeSearchFilter(e.target.value, searhParams, setSearchParams)}
                        placeholder={View === "Notices" ? "Search Content..." : "Search Name, Review or Department..."}
                        style={{width:'400px', display: 'unset', borderRadius: 0, marginRight: 20}}
                    />
                
        </Stack>
    </div>)
}