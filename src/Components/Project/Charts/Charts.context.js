import { bind, SUSPENSE } from "@react-rxjs/core";
import { combineLatest, map, startWith, switchMap, tap } from "rxjs";
import { DepartmentBoardItems$, FilteredBoardItemIds$ } from "../Context/Project.Objects.context";
import * as _ from 'underscore';
import { RandomRGB, SelectColor } from "../../../Helpers/Colors.helper";
import { createSignal } from "@react-rxjs/utils";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
  

export const [,FilteredItems$] = bind(
    combineLatest([DepartmentBoardItems$, FilteredBoardItemIds$]).pipe(
        map(([items, filteredIds]) => items.filter(i => filteredIds.indexOf(i.id) >= 0))
    )
)

const GroupByTags = (items) => {
    return _.reduce(items,
        (acc, i) => {
            let tags = i.Tags.value;
            tags.forEach(a => {
                if (!acc[a]) acc[a] = [];
                acc[a].push(i.id);
            })
            return acc;
        }, {}
    );
}

export const [, ItemTagsData$] = bind(
    FilteredItems$.pipe(
        map(items => items.filter(i => i.Tags?.value?.length)),
        map(items => GroupByTags(items)),
    ), []
)

export const [, ReviewTagsData$] = bind(
    FilteredItems$.pipe(
        map(items => items.filter(i => i.subitems?.length)),
        map(items => items.map(i => _.sortBy(i.subitems, i => i.Index?.text ? i.Index.text : -1).reverse()[0])),
        map(items => GroupByTags(items)),
    ), []
)

const CombinedTagsData$ = combineLatest([ItemTagsData$, ReviewTagsData$]).pipe(
    map(([itemTags, reviewTags]) => {
        const data = {...itemTags};

        Object.keys(reviewTags).forEach(k => {
            if (data[k])
                data[k] = _data[k].concat(reviewTags[k])
            else 
                data[k] = reviewTags[k]
        });

        return data;
    })
);

export const [useTagsData, TagsData$] = bind(
    CombinedTagsData$.pipe(
        map(data => {
            const labels = Object.keys(data);
            let backgroundColor = labels.map(k => SelectColor(labels.indexOf(k), labels.length));
            return {labels, datasets:[{backgroundColor, data: Object.values(data).map(d => d.length), 
                borderColor: 'black', borderWidth: 1}]}
        })
    )
)

const GroupByStatus = (items) => {
    let notstarted = [];

    const grouped = _.reduce(items, (acc, i) => {
        let status = i.Status?.text || 'Not Started';
        let color = i.Status?.info?.color || 'black'
        acc[status + '_COLOR'] = color;
        if (!acc[status])
            acc[status] = [];
        acc[status].push(i.id);
        return acc;
    }, {});


    return grouped; 
} 

export const [useStatusData, StatusData$] = bind(
    FilteredItems$.pipe(
        map(items => GroupByStatus(items)),
        map(status => {
            const labels = Object.keys(status)
                .filter(k => k.indexOf('_COLOR') < 0);
            const backgroundColor = Object.keys(status)
                .filter(k => k.indexOf('_COLOR') >= 0)
                .map(k => status[k]);
            const data = labels.map(k => status[k].length);
            return {labels, datasets:[{backgroundColor, data, borderColor: 'black', borderWidth: 1}]}
        }),
    ), []
)

const GroupByArtist = (items) => {
    let unassigned = [];

    const grouped = _.reduce(items, (acc, i) => {
        let artists = i.Artist?.value;

        if (i.subitems?.length) {
            const current = _.sortBy(i.subitems, s => s.Index?.text || -1).reverse()[0];
            const reassigned = i.subitems.filter(s => s.Artist?.value?.length).length > 0;
            const currentArtist = current.Artist?.value;
            artists = reassigned? currentArtist : artists;
        }

        if (!artists || artists.length < 1) {
            if (!acc['Unassigned']) acc['Unassigned'] = [];
            acc['Unassigned'].push(i.id);
            return acc;
        }

        artists.forEach(a => {
            if (!acc[a]) acc[a] = [];
            acc[a].push(i.id);
        })
        return acc;
    }, {});

    return grouped; 
} 

export const [useArtistData, ArtistData$] = bind(
    FilteredItems$.pipe(
        map(items => GroupByArtist(items)),
        map(artists => {
            
            const labels = Object.keys(artists).filter(a => a != 'Unassigned');
            const unassigned = artists['Unassigned'];
            const backgroundColor = labels
                .map(k => SelectColor(labels.indexOf(k), labels.length));
            const data = labels.map(k => artists[k].length);

            if (!!unassigned && unassigned.length) {
                labels.push('Unassigned');
                backgroundColor.push('black');
                data.push(unassigned.length);
            }
            return {labels, datasets:[{backgroundColor, data, borderColor: 'black', borderWidth: 1}]}
        })
    ), []
)

export const [useArtistByStatusData, ArtistByStatusData$] = bind(
    FilteredItems$.pipe(
        map(items => {
            const artists = GroupByArtist(items);
            const status = GroupByStatus(items);

            let keep = [];
            let datasets = [];
            const labels =  Object.keys(artists);

            Object.keys(status).filter(k => k.indexOf('_COLOR') < 0).forEach(s => {
                const statusIds = status[s];
                
                const data = _.map(Object.values(artists), 
                    artistIds => _.intersection(artistIds, statusIds).length);

                for(var x=0; x < data.length; x++){
                    if (data[x] > 0 && keep.indexOf(s) < 0)
                        keep.push(s)
                }
                const label = s;
                datasets.push({ label, data, backgroundColor: status[s + "_COLOR"], borderColor: 'black', borderWidth: 1 })
            });

            datasets = _.filter(datasets, d => keep.indexOf(d.label) >= 0);
            return {labels, datasets}
        })
    )
)

const GroupByElement = (items) => {
    const grouped = _.reduce(items, (acc, i) => {
        let element = i.name.indexOf('/') > 0 ?
            i.name.split('/')[0] : i.name;

        if (!acc[element]) acc[element] = [];
            acc[element].push(i.id);
        return acc;
    }, {});

    return grouped; 
}

export const [useElementsByStatusData, ElementsByStatusData$] = bind(
    FilteredItems$.pipe(
        map(items => {
            const elements = GroupByElement(items);
            const status = GroupByStatus(items);

            let keep = [];
            let datasets = [];
            const labels =  Object.keys(elements);

            Object.keys(status).forEach(s => {
                const statusIds = status[s];
                const data = _.map(Object.values(elements), 
                    elementIds => _.intersection(elementIds, statusIds).length);

                for(var x=0; x < data.length; x++){
                    if (data[x] > 0 && keep.indexOf(s) < 0)
                        keep.push(s)
                }

                const label = s;
                datasets.push({ label, data, backgroundColor: status[s + "_COLOR"], borderColor: 'black', borderWidth: 1 })
            });

            datasets = _.filter(datasets, d => keep.indexOf(d.label) >= 0);
            return {labels, datasets}
        })
    )
) 

export const [useStatusByArtist, StatusByArtistData$] = bind(
    FilteredItems$.pipe(
        map(items => {
            const artists = GroupByArtist(items);
            const status = GroupByStatus(items);
            let keep = [];
            let datasets = [];
            const labels =  Object.keys(status).filter(k => k.indexOf('_COLOR') < 0);
            const artistKeys = Object.keys(artists);
            artistKeys.forEach(a => {
                const artistIds = artists[a];
                const data = _.map(labels, 
                    s => _.intersection(artistIds, status[s]).length);

                for(var x=0; x < data.length; x++){
                    if (data[x] > 0 && keep.indexOf(a) < 0)
                        keep.push(a)
                }

                const label = a;
                datasets.push({ label, data, 
                    backgroundColor: a === 'Unassigned' ? 'black' : SelectColor(artistKeys.indexOf(a), artistKeys.length), 
                    borderColor: 'black', borderWidth: 1 })
            });

            datasets = _.filter(datasets, d => keep.indexOf(d.label) >= 0);
            return {labels, datasets}
        })
    )
)

export const [useTagsByStatus, TagsByStatusData$] = bind(
    combineLatest([FilteredItems$, CombinedTagsData$]).pipe(
        map(([items, tags]) => {
            const status = GroupByStatus(items);

            let datasets = [];
            const labels =  Object.keys(tags);

            const keep = [];
            Object.keys(status).filter(k => k.indexOf('_COLOR') < 0).forEach(s => {
                const statusIds = status[s];
                const data = _.map(Object.values(tags), 
                    tagIds => _.intersection(tagIds, statusIds).length);
                
                for(var x=0; x < data.length; x++){
                    if (data[x] > 0 && keep.indexOf(s) < 0)
                        keep.push(s)
                }

                const label = s;
                datasets.push({ label, data, backgroundColor: status[s + "_COLOR"], borderColor: 'black', borderWidth: 1 })
            });

            datasets = _.filter(datasets, d => keep.indexOf(d.label) >= 0);
            return {labels, datasets}
        })
    )
)


export const [useTagsByArtist, TagsByArtistData$] = bind(
    combineLatest([FilteredItems$, CombinedTagsData$]).pipe(
        map(([items, tags]) => {
            const artists = GroupByArtist(items);
            let datasets = [];
            let labels =  Object.keys(tags);

            const keep = []
            const artistKeys = Object.keys(artists);

            artistKeys.forEach(a => {
                const artistIds = artists[a];
                const data = _.map(labels, 
                    s => _.intersection(artistIds, tags[s]).length);

                for(var x=0; x < data.length; x++){
                    if (data[x] > 0 && keep.indexOf(a) < 0)
                        keep.push(a)
                }
                const label = a;
                datasets.push({ label, data, backgroundColor: 
                    a === 'Unassigned' ? 'black' : SelectColor(artistKeys.indexOf(a), artistKeys.length), 
                    borderColor: 'black', borderWidth: 1 })
            });

            datasets = _.filter(datasets, d => keep.indexOf(d.label) >= 0);
            return {labels, datasets}
        })
    )
)

export const [ChartTypeChanged$, SetChartType] = createSignal(type => type);
export const [useChartType, ChartType$] = bind(
    ChartTypeChanged$.pipe(
        startWith('Status')
    ), SUSPENSE
)

export const ChartTypes = ['Status', 'Artist', 'Tags', 'Element By Status', 'Artist By Status', 'Status By Artist', 
    'Tags By Status', 'Tags By Artist'];

export const [useChartData, ChartData$] = bind(
    ChartType$.pipe(
        switchMap(type => {
            switch(type) {
                case 'Artist': 
                    return ArtistData$;
                case 'Review Tags':
                    return ReviewTagsData$;
                case 'Artist By Status':
                    return ArtistByStatusData$;
                case 'Status By Artist':
                    return StatusByArtistData$;
                case 'Tags':
                    return TagsData$;
                case 'Tags By Status':
                    return TagsByStatusData$;
                case 'Tags By Artist':
                    return TagsByArtistData$;
                case 'Element By Status':
                    return ElementsByStatusData$;

                default:
                    return StatusData$;
            }
        }),
    ), SUSPENSE
)

export const [ChartClickEvent$, SetChartClicked] = createSignal();
export const [useChartClickEvents, ] = bind(
    ChartClickEvent$, null
)

export const [useChartOptions, ChartOptions$] = bind(
    ChartType$.pipe(
        map(type => {
            const isStacked = type.indexOf(' By ') >= 0;
            return ({
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                plugins: {
                    legend: { display: isStacked },
                    title: {
                        display: false,
                    }
                },
                scales: {
                    x: {
                        stacked: isStacked,
                        ticks: {
                            color: '#495057'
                        },
                        grid: {
                            color: '#ebedef'
                        }
                    },
                    y: {
                        stacked: isStacked,
                        ticks: {
                            color: '#495057'
                        },
                        grid: {
                            color: '#ebedef'
                        }
                    }
                }
              })
        })
    ), SUSPENSE
)