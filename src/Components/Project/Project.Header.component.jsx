import { useEffect, useState } from "react";
import { Stack } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";
import { useBoardItemsCount, useTagOptions } from "./Context/Project.Objects.context"
import { useBoardFilters } from "./Context/Project.Params.context";
import { toggleArrFilter } from "./Overview.filters";
import * as _ from 'underscore';

const ClearSearch = (evt, searchParams, setSearchParams) => {
    evt.preventDefault();
    searchParams.set('BoardSearchFilter', '');
    setSearchParams(searchParams);
}

const SetFilter = (filterState, display, setDisplay, type, searchParams, setSearchParams) => {
    const hasFilter = filterState && filterState.length > 0;
    if (!hasFilter && display) {
        setDisplay(null);
        return;
    } else if(!hasFilter)
        return;

    setDisplay(_.uniq(filterState.split(','))
        .map((t) =>
            <div key={`${type}Header_${t}`} className="pm-tag-filter" 
                onClick={(evt) => toggleArrFilter(t, `Board${type}Filter`, 
                searchParams, setSearchParams)}>
            {'#' + t}
            </div>
        )
    )
}
export const ProjectHeader = () => {
    const BoardItemCount = useBoardItemsCount();
    const BoardFilters = useBoardFilters();
    const [artistFilters, setArtistFilters] = useState(null);
    const [tagFilters, setTagFilters] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [feedbackDepartmentFilter, setFeedbackDepartmentFilter] = useState(null);
    const [badgeFilters, setBadgeFilters] = useState(null);
    const [searchFilter, setSearchFilter] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    
    useEffect(() => {
        const hasSearchFilter = BoardFilters.Search && BoardFilters.Search.trim().length > 0;

        if (!hasSearchFilter && searchFilter) {
            setSearchFilter(null);
            return
        } else if (!hasSearchFilter) return;

        setSearchFilter(
            <div className="pm-tag-filter" key="SearchFilter" onClick={(evt) => ClearSearch(evt, searchParams, setSearchParams)} 
                style={{color: '#aaa', fontWeight: 400}}>(Searched: {BoardFilters.Search})
            </div>
        )
    }, [BoardFilters.Search])

    useEffect(() =>
        SetFilter(BoardFilters.Tags, tagFilters, setTagFilters, "Tag", searchParams, setSearchParams)
    , [BoardFilters.Tags])

    useEffect(() =>
        SetFilter(BoardFilters.Badges, badgeFilters, setBadgeFilters, "Badge", searchParams, setSearchParams)
    , [BoardFilters.Badges])

    useEffect(() =>
        SetFilter(BoardFilters.Status, statusFilter, setStatusFilter, "Status", searchParams, setSearchParams)
    , [BoardFilters.Status])

    useEffect(() =>
        SetFilter(BoardFilters.Artists, artistFilters, setArtistFilters, "Artist", searchParams, setSearchParams)
    , [BoardFilters.Artists])

    useEffect(() => 
        SetFilter(BoardFilters.FeedbackDepartment, feedbackDepartmentFilter, 
            setFeedbackDepartmentFilter, "FeedbackDepartment", searchParams, setSearchParams)
    , [BoardFilters.FeedbackDepartment])

    return (
    <Stack direction="horizontal" gap={3}>
        <div className="pm-tag-filter" style={{color: '#aaa', fontWeight: 400}}>
            {BoardItemCount} tasks...
        </div>
        {
            [searchFilter, artistFilters, statusFilter, feedbackDepartmentFilter, tagFilters, badgeFilters]
        }
    </Stack>)
}