import { ajax } from "rxjs/ajax";
import { httpOptions, MissingSyncsketchProject, SyncsketchConfig, SyncsketchPosts, SyncsketchQueries } from "../Environment/Syncsketch.environment";
import * as _ from 'underscore';
import { take, map, tap, forkJoin, switchMap, from, concatMap, of, concatAll, Subject, merge, Observable, BehaviorSubject, combineLatest, delay, delayWhen, EMPTY, timer, expand } from "rxjs";
import moment from 'moment'
import { ReviewItemName } from "../Helpers/ProjectItem.helper";

const QueryHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Authorization': `apikey ${SyncsketchConfig.user}:${SyncsketchConfig.token}`
}
const UploadHeaders = {
    'Authorization': `apikey ${SyncsketchConfig.user}:${SyncsketchConfig.token}`,
    "Access-Control-Allow-Origin": "*",
}

export class SyncsketchService {
    static MissingSyncsketchProject = { error: 'Project Not Found!' }

    static Query$ = (addr) => {
        const start = moment();
        return ajax.get(addr, QueryHeaders).pipe(
            tap(t => {
                const end = moment();
                console.log(`Syncsketch -- Query Fetch Time ${end.diff(start, 'seconds')} seconds`)
            }),
            map(result => result.response),
            take(1) 
        )
      }

    static RenameItem$ = (itemId, name) => {

    }

    static SortItems$ = (reviewId) => {
        return SyncsketchService.ItemsByReview$(reviewId).pipe(
            take(1),
            tap(t => console.log("Sorting Items From Review", reviewId)),
            map(items => _.sortBy(items, (i) => i.name)),
            map(items => _.reduce(items, (acc, i) => {
                acc.push({id: i.id, sortOrder: acc.length});
                return acc;
            }, [])),
            tap(t => console.log("ORDERED ITEMS: ", t)),
            switchMap(sortedItems => ajax({
                url: SyncsketchPosts.UpdateItemSort(reviewId),
                method: 'PUT',
                headers: {...UploadHeaders, 'Content-Type': 'application/json'},
                body: JSON.stringify({ items: sortedItems })
            })),
            tap(t => console.log("SORT RESPONSE", t)),
            tap(t => console.log("Sorted SS Items", t)),
            take(1)
        )
    }

    static UploadItems$ = (reviewId, dep, index, name, files, artist) => {
        return _.reduce(files, (acc, f) => {

                const formdata = new FormData();
                const fname = ReviewItemName(dep, index, name, f.name, files.length, acc.length + 1)
                let fnameArr = fname.split('.')
                fnameArr.pop();
                const ssname = fnameArr.join('.');

                formdata.append("reviewFile", f, fname);
                formdata.append("artist", artist);
                formdata.append("description", f.name);
                const req$ =  ajax({
                                url: SyncsketchPosts.UploadFile(reviewId),
                                method: 'POST',
                                headers: UploadHeaders,
                                body: formdata,
                                crossDomain: true,
                                includeUploadProgress: true,
                    });

                acc.push({index: acc.length, item: ssname, orig: f.name, $: req$})
                return acc;
            }, []);
    }

    static AllProjects$ = SyncsketchService.Query$(SyncsketchQueries.ActiveProjects).pipe(
        map(response => response.objects),
        take(1)
    )

    static FindProject$ = (name) => SyncsketchService.AllProjects$.pipe(
        map(projects => _.find(projects, p => p.name.indexOf(name) > -1)),
        map(project => project ? project : SyncsketchService.MissingSyncsketchProject)
    )

    static FindReview$ = (name, ssGroupId) => 
    {
        console.log("Searching Reviews for: ", name, ssGroupId);
        const addr = SyncsketchQueries.ReviewsByName(name);
        console.log(addr);
        return SyncsketchService.Query$(addr).pipe(
            take(1),
            map(response => {
                const {total_count, limit} = response.meta;
                console.log(`Syncsketch -- returned ${total_count} with ${limit} limit`);
                return response.objects.filter(r => r.group == ssGroupId);
            }),
        );
    }
    
    static ItemsByReview$ = (id) => SyncsketchService.Query$(SyncsketchQueries.ItemsByReview(id)).pipe(
        map(response => response.objects),
        take(1)
    )

    static ItemByName$ = (reviewId, name, doWait=false) => {
        console.log("RETRIEVING ITEM BY NAME", name, reviewId)
        return SyncsketchService.ItemsByReview$(reviewId).pipe(
            tap(console.log),
            map(items => _.filter(items, i => i.name == name)),
            map(filtered => filtered.length > 0 ? filtered[filtered.length - 1] : null),
            switchMap((item, i) => {
                if (item === null && doWait)
                    return of(null).pipe(
                        delay(5000),
                        switchMap(x => SyncsketchService.ItemByName$(reviewId, name, doWait))
                    )

                if (item !== null)
                    return of(item);

                return EMPTY;
            }),
            take(1),
            tap(t => console.log("FOUND ITEM BY NAME$", t))
        )
    }

    static ItemById$ = (id) => {
        console.log("Calling SS Item By ID: ", id);
        return SyncsketchService.Query$(SyncsketchQueries.ItemById(id)).pipe(
            tap(console.log)
        );
    }

    static AllUsers$ = SyncsketchService.Query$(SyncsketchQueries.AllUsers).pipe(
        tap(t => console.log(t)),
        map((account) => account.connections),
        map((connections) => _.map(connections, c=> c.user)),
      )  
      
    static AllFeedback$ = (id) => SyncsketchService.Query$(SyncsketchQueries.AllFeedback(id)).pipe(
        map(result => result.objects)
    );
}