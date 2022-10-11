import { SUSPENSE } from "@react-rxjs/core";
import { VirtualScroller } from "primereact/virtualscroller";
import { Stack } from "react-bootstrap";
import { SetHomeSearchFilter, useHomeSearchFilter, useProjectsByStatus, useStatusItemGroups } from "./Home.context";
import { HomeStatusItem } from "./Home.StatusItem";
import * as _ from 'underscore';
import { useEffect, useReducer, useRef, useState } from "react";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { useSearchParams } from "react-router-dom";
import { onArtistClick } from "../Project/Overview.filters";

const reducer = (state, action) => {
    switch(action.type) {
        case 'add' : 
            if (state.indexOf(action.value) < 0)
                return [...state, action.value]
            else
                return state;
        case 'minus' :
            if (state.indexOf(action.value) > 0)
                return state;
            return state.filter(x => x != action.value);
    }
}
export const HomeStatus = ({Status}) => {
    const groups = useStatusItemGroups()
    const [searchParams, setSearchParams] = useSearchParams();
    const Search = useHomeSearchFilter();
    const [FilteredUsers, setFilteredUsers] = useState(null);
    const [items, setItems] = useState([])
    const [range, setRange] = useState([0, 4]);
    const itemTemplate = (item) => {
        return <Stack direction="horizontal" style={{width: '100%', justifyContent: 'center', padding: 20}}>
                <HomeStatusItem key={item.group_title + "_" + item.id} statusItem={item} maxIndex={range[1]}
                 dispatchFilter={dispatchFilter} filtered={filtered} />
            </Stack>
    }

    useEffect(() => {
        const search = Search && Search.length > 0 ? Search.toLowerCase() : null;
        const UserFilter = searchParams.get('Users');    
        const Users = UserFilter ? UserFilter.indexOf(',') > 0 ? 
            UserFilter.split(',') : [UserFilter] : null;

        if (Users !== FilteredUsers)
            setFilteredUsers(Users);

        if (groups && groups.length > 0)
            setItems(
                    _.flatten(
                        groups.map(
                            ([group_title, group_items]) => group_items
                            .filter(item => {
                                if (!Search && !Users) return true;

                                let result = false;

                                if (Search && Search.length > 0)  {
                                    [item.item_name, item.review_name, item.department, item.board_name, item.group_title]
                                        .forEach(query => {
                                            if (!result && query && query.toLowerCase().indexOf(search) >= 0)
                                                result = true;
                                    })
                                }

                                if (Users && !result && item.artists?.length > 0) {
                                    const artists = item.artists.replace(/\s/g, '' );
                                    Users.forEach(a => {
                                        if (artists.indexOf(a.replace(/\s/g, '' )) >= 0)
                                            result = true;
                                    });
                                }

                                if (Users && !result && item.directors?.length > 0) {
                                    const directors = item.directors.replace(/\s/g, '' );
                                    Users.forEach(a => {
                                        if (directors.indexOf(a.replace(/\s/g, '' )) >= 0)
                                            result = true;
                                    });
                                }

                                return result;
                            })
                            .map(i => ({group_title, ...i}))
                        )
                    ).map((i, index) => ({...i, index}))
            )
    }, [groups, Search])

    if (groups === SUSPENSE || items.length < 1)
        return <div></div>;

    const onScroll = (evt) => { 
        const index = Math.ceil((evt.target.scrollTop + evt.target.clientHeight) / 300);

        if (range[1] < index)
            setRange([0, index]);
    }

    

    return (<div style={{height: 'calc(100vh - 95px)', overflowY: 'auto', paddingTop: 20}} onScroll={onScroll}>
             <Stack direction="horizontal" gap={3} style={{marginLeft: 20}}>
                <div className="pm-tag-filter" style={{color: '#888', fontWeight: 400, fontSize: 20}}>
                    {items?.length} tasks...
                </div>
                {
                    Search && Search.length > 0 ?
                    <div className="pm-tag-filter" key="SearchFilter" onClick={(evt) => 
                        SetHomeSearchFilter('', searchParams, setSearchParams)} 
                        style={{color: '#888', fontWeight: 400, fontSize: 20, cursor: 'pointer'}}>(Searched: {Search})
                    </div> : null
                }
                {
                    FilteredUsers && FilteredUsers.length > 0 ? 
                    FilteredUsers.map(a => <div className="pm-tag-filter" key={"userFilter_" + a}
                    onClick={(evt) => onArtistClick(a, searchParams, setSearchParams, true, 'Users')}>#{a}</div>)
                    : null
                }
            </Stack>
            {               
                items.map(item => <Stack direction="horizontal" key={item.group_title + "_" + item.id} 
                    style={{width: '100%', justifyContent: 'center', padding: 20, position: 'relative'}}>
                    <HomeStatusItem  statusItem={item} maxIndex={range[1]}/>
                </Stack>)
            }
            </div>)
}