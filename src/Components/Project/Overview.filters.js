import { formatTimeline } from "../../Helpers/Timeline.helper";
import * as _ from 'underscore';
import moment from 'moment';

export const toggleArrFilter = (t, key, searchParams, setSearchParams) => {
    let filter = t.replace(/\s+/g, '');
    let tagStr = searchParams.get(key);
    tagStr = tagStr === null ? '' : tagStr;

    let arr = tagStr.trim().replace(/\s+/g, '').split(',')
        .filter(t => t != null && t !== 'null' && t.length > 0);

    if (arr.indexOf(filter) < 0)
        arr.push(filter);
    else
        arr = arr.filter(tag => tag != filter);
        
    searchParams.set(key, arr.join(','))
    setSearchParams(searchParams);
}

export const toggleStatusFilter = (status, searchParams, setSearchParams) => {
    let current = searchParams.get('BoardStatusFilter');

    if (current !== null && current.length > 0)
        searchParams.set('BoardStatusFilter', '')
    else 
        searchParams.set('BoardStatusFilter', status.replace(/\s+/g, ''))

    setSearchParams(searchParams);
}

export const filterBadges = (filtered, badges) => {
    if (badges == null || badges.length < 1) return filtered;

    const BadgeArr = badges.split(',').filter(b => b.length > 0 && b !== null);
    return _.filter(filtered, i => {
        if (!i.Badges?.value?.length)
            return false;
        return _.intersection(i.Badges.value, BadgeArr).length > 0
    });
}
export const filterArtists = (filtered, artists) => {
    if (artists == null || artists.length < 1) return filtered;

    const arr = artists.split(',').filter(b => b.length > 0 && b !== null);

    return _.filter(filtered, i => {
        if (!i.Artist?.value?.length && arr.indexOf('Unassigned') < 0)
            return false;

        let values;
        if (!i.Artist?.value?.length)
            values = ['Unassigned'];
        else 
            values = i.Artist.value.map(a => a.replace(/\s+/g, ''));
        return _.intersection(values, arr).length > 0
    });
}

export const filterTags = (filtered, tags) => {
    if (tags === null || tags.length < 1) return filtered;

    const TagArr = tags.split(',').filter(t => t && t.length > 0 && t !== null);

    return _.filter(filtered, i => {
        if (i.Tags?.value?.length > 0 && _.intersection(i.Tags.value, TagArr).length > 0)
            return true;

        if (i.subitems.length > 0) {
            const last = _.last(i.subitems);
            
            if (!last.Tags || !last.Tags.value) return false;

            if (last.Tags.value.length < 1)
                return false;

            return _.intersection(last.Tags.value, TagArr).length > 0;
        }
        return false;
    });
}
export const sortFilteredItems = (filtered, params) => {
    let sorted = _.sortBy(filtered, (i) => i.name);

    if (params.Sorting === 'Artist') {
        const unassigned = _.filter(sorted, (i) => i.Artist.text.length < 1);
        const assigned = _.filter(sorted, (i) => i.Artist.text.length > 0);

        let result = _.sortBy(assigned, (i) => {
            if (i.Artist.text.length > 0)
                return i.Artist.text
        });

        sorted = params.ReverseSorting === 'true' ? 
            unassigned.concat(result) : result.concat(unassigned); 
    }
    else if (params.Sorting === 'Status') { 
        sorted = _.sortBy(filtered, (i) => 
            i.Status && i.Status.text ? i.Status.text : 'Not Started'
        )
    }

    else if (params.Sorting === 'Director'){
        const unassigned = _.filter(sorted, (i) => i.Director.text.length < 1);
        const assigned = _.filter(sorted, (i) => i.Director.text.length > 0);

        let result = _.sortBy(assigned, (i) => {
            if (i.Director.text.length > 0)
                return i.Director.text
        });

        sorted = params.ReverseSorting === 'true' ? 
            unassigned.concat(result) : result.concat(unassigned); 
    }

    else if (params.Sorting === 'Start Date') {
        const noDate = _.filter(sorted, (i) => i.Timeline.text.indexOf(' - ') < 0);
        const dated = _.filter(sorted, (i) => i.Timeline.text.indexOf(' - ') >= 0);

        let result = _.sortBy(dated, (i) =>  moment(i.Timeline.text.split(' - ')[0]));

        sorted = params.ReverseSorting === 'true' ? 
            noDate.concat(result) : result.concat(noDate); 
    }
    else if (params.Sorting === 'End Date'){
        const noDate = _.filter(sorted, (i) => i.Timeline.text.indexOf(' - ') < 0);
        const dated = _.filter(sorted, (i) => i.Timeline.text.indexOf(' - ') >= 0);

        let result = _.sortBy(dated, (i) => moment(i.Timeline.text.split(' - ')[1]));

        sorted = params.ReverseSorting === 'true' ? 
            noDate.concat(result) : result.concat(noDate); 
    }
    
    if (params.ReverseSorting === 'true')
        sorted = sorted.reverse();

    return sorted;
}

export const filterStatus = (filtered, status) => {
    if (status === null || status.trim().length < 1)
        return filtered;

    const statusSearch = status.replace(/\s+/g, '')
    return _.filter(filtered, (i) => {
            const s = i.Status && i.Status.text ? 
                i.Status.text.replace(/\s+/g, '') : 'NotStarted'
            return s === statusSearch;
        });
}
export const filterDepartments = (filtered, dep) => {
    if (filtered && filtered.length > 0) {
        if (dep !== 'All Departments' && !!dep)
        filtered = _.filter(filtered, i => i.Department.text.indexOf(dep) >= 0);
    }
    return filtered;
}

export const filterSearch = (filtered, Search) => {
    if (Search && Search.length > 0 && Search.trim().length > 0)
            filtered = _.filter(filtered, i => {
                // search should be case insensitive
                const s = Search.toLowerCase();

                const itemQueries = 
                    [i.name.toLowerCase(),

                        // consider only most recent review (monday subitem)
                        i.CurrentReview ? i.CurrentReview.name.toLowerCase() : '',
                        i.CurrentReview ? i.CurrentReview.Artist.text.toLowerCase() : '',
                        i.CurrentReview ? formatTimeline(i.CurrentReview.Timeline).toLowerCase() : '',
                        i.CurrentReview && i.CurrentReview.Tags ? i.CurrentReview.Tags.text.toLowerCase() : '',

                        //  base item
                        i.Artist.text.toLowerCase(),
                        i.Director.text.toLowerCase(),
                        i.Status && i.Status.text ? i.Status.text.toLowerCase() : 'Not Started',
                        formatTimeline(i.Timeline).toLowerCase(),
                        i.Badges && i.Badges.text ? i.Badges.text.toLowerCase() : '',
                        (i.Tags ? i.Tags.text.toLowerCase() : '')
                    ]

                return !!_.find(itemQueries, (q) => q.indexOf(s) >-1)
        })
    return filtered;
}


export const onTagClick = (evt, tag, searchParams, setSearchParams) => {
    toggleArrFilter(tag, "BoardTagsFilter", searchParams, setSearchParams);
    if (evt?.stopPropagation)
        evt.stopPropagation();
}

export const onArtistClick = (artist, searchParams, setSearchParams, affectFilters) => {
    if (!affectFilters) return;
    
    console.log(artist, artist.replace(/\s+/g, ''))
    if (artist.indexOf('+') > -1)
        return;

    toggleArrFilter(artist.replace(/\s+/g, ''), 
        'BoardArtistFilter', searchParams, setSearchParams);
}