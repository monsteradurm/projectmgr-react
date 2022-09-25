import { ajax } from "rxjs/ajax";
import { httpOptions, MissingSyncsketchProject, SyncsketchConfig, SyncsketchPosts, SyncsketchQueries } from "../Environment/Syncsketch.environment";
import * as _ from 'underscore';
import { take, map, tap, forkJoin, switchMap, from, concatMap, of, concatAll, Subject, merge, Observable, BehaviorSubject, combineLatest, delay, delayWhen, EMPTY, timer, expand, reduce } from "rxjs";
import moment from 'moment'
import { ReviewItemName } from "../Helpers/ProjectItem.helper";
import { SUSPENSE } from "@react-rxjs/core";
import { FirebaseService } from "./Firebase.service";
import { SendToastError } from "../App.Toasts.context";

const QueryHeaders = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Authorization': `apikey ${SyncsketchConfig.user}:${SyncsketchConfig.token}`
}
const UploadHeaders = {
    'Authorization': `apikey ${SyncsketchConfig.user}:${SyncsketchConfig.token}`,
    "Access-Control-Allow-Origin": "*",
}

const ReverseProxy = 'https://us-central1-pm-websocket.cloudfunctions.net/app/'
export class SyncsketchService {
    static MissingSyncsketchProject = { error: 'Project Not Found!' }

    static Post$ = (addr, body) => {
        return ajax.post(addr, body, QueryHeaders).pipe(
            map(result => result.response),
            take(1) 
        )
    }

    static Query$ = (addr) => {
        const start = moment();
        return ajax.get(addr, QueryHeaders).pipe(
            tap(t => {
                const end = moment();
                console.log(`Syncsketch -- Query Fetch Time ${end.diff(start, 'seconds')} seconds`, addr)
            }),
            map(result => result.response),
            take(1) 
        )
      }

    static Next$ = (addr) => {
        const nextAddr = addr.replace('/api/v1', '/syncsketch');
        return ajax.get(nextAddr, QueryHeaders).pipe(
            map(result => result.response),
            take(1))
    }

    static RenameItem$ = (itemId, name) => {

    }

    static DeleteItems$ = (itemArr) => {
        if (!Array.isArray(itemArr)) {
            //SendToastError("Item/s could not be removed from Syncsketch");
            return of(null);
        }

        const url = SyncsketchPosts.DeleteItems;
        return ajax.post(url, {"item_ids": itemArr.map(i => parseInt(i))}, QueryHeaders).pipe(
            tap(t => console.log("DELETE RESULT", t))
        )
    }

    static UploadItem$ = (reviewId, file, params, index, count, type) => {
       
        const url = SyncsketchPosts.UploadFile(reviewId, type);
        console.log("UPLOADING...", url, type)
        const formdata = new FormData();
        formdata.append("reviewFile", file, params.filename);
        formdata.append("artist", params.artist);
        formdata.append("description", params.description);
        return ajax({
            url,
            method: 'POST',
            headers: UploadHeaders,
            body: formdata,
            crossDomain: true,
            includeUploadProgress: true,
        }).pipe(
            tap(console.log),
            map(({loaded, total, type}) => {
                return {
                    progress:       total === 0 ? 100 : Math.round(100 * loaded / total),
                    index:          `${index + 1}/${count}`,
                    position:       index,
                    description:    file.name,
                    item:           params.filename,
                    // type:        uploadEvent.type,
                    complete:       (index + 1>= count && type === 'download_load'),
                };
            })
        );
    }

    static UploadItemsArr$ = (reviewId, dep, index, name, files, artist) => {
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

    static ItemChangesByReview$ = (projectid, groupId, reviewId) => {
        if (!projectid) return of([]);

        
        const collection = `SyncsketchItems/${projectid}/groups/${groupId}/reviews/${reviewId}/items`;
        return FirebaseService.SubscribeToCollection$(collection)
        .pipe(
            concatMap(itemArr => from(itemArr).pipe(
                concatMap(change => {
                    if (change.type === 'removed')
                        return of({action: 'removed', id: change.doc.id});

                    return FirebaseService.GetDocument$(collection, change.doc.id)
                        .pipe(
                            map(doc => doc.data()),
                            map(item => ({...item, action: change.type, id: change.doc.id}))
                        )
                }),
            )),
        )
    }

    static ReviewsByProjectId$ = (id, groupId) => {
        if (!id) return of([]);

        console.log("Retrieving Project Reviews", {id, groupId});

        const collection = `SyncsketchItems/${id}/groups/${groupId}/reviews`;
        return FirebaseService.SubscribeToCollection$(collection)
        .pipe(
            concatMap(reviewArr => from(reviewArr).pipe(
                tap(change => console.log("CHANGE", change)),
                concatMap(change => {
                    if (change.type === 'removed')
                        return of({action: 'removed', uuid: change.doc.id});

                    return FirebaseService.GetDocument$(collection, change.doc.id)
                        .pipe(
                            map(doc => doc.data()),
                            map(review => ({...review, action: change.type}))
                        )
                }),
            )),
            tap(t => console.log("Review Changes", t))
        )
    }

    static CreateReview$ = (project_id, group_Id, itemId, review_name, department) => {
        const body = {
            "project": `/api/v1/project/${project_id}/`,
            "name": review_name,
            "description": JSON.stringify({pulse: itemId, department}),
            "group": group_Id,
            "isPublic" : true,
            "can_download" : true
        }
        return SyncsketchService.Post$(SyncsketchPosts.CreateReview, body);
    }

    static FindReviews$ = (groupTitle, element, ssGroupId) => 
    {
        const params = [groupTitle, element, ssGroupId];
        if (params.indexOf(SUSPENSE) >= 0)
            return of(SUSPENSE);
        else if (params.indexOf(null) >= 0 || params.indexOf(undefined) >= 0)
            return of([]);

        const name = groupTitle + '/' + element + ' (';

        console.log("Searching Reviews for: ", name, ssGroupId);
        const addr = SyncsketchQueries.ReviewsByName(name);
        
        return SyncsketchService.Query$(addr).pipe(
            take(1),
            map(response => {
                const {total_count, limit} = response.meta;
                console.log(`Syncsketch -- returned ${total_count} with ${limit} limit`);
                return response.objects;
            }),
            map(reviews => {
                if (!reviews) return []

                reviews.filter(r => r.group === ssGroupId)
                    .reduce((acc, rev) => {
                        if (!rev.description || rev.description.length > 0)
                            return acc;
                        try {
                            rev.description = JSON.parse(rev.description);
                            acc.push(rev);
                        } catch { }
                        return acc;
                    }, [])
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
    
    static ThumbnailFromId$ = (id) => {
        if (id === SUSPENSE) return of(SUSPENSE);
        if (!id) return of(null);

        return SyncsketchService.Query$(SyncsketchQueries.ThumbnailById(id)).pipe(
            map(item => {
                if (!item?.thumbnail_url) return null;
                
                return ReverseProxy + item.thumbnail_url.replace('https://', '')
            })
        );
    }

    static ItemByIds$ = (id, sketchId, groupId, projectId) => {
        return FirebaseService.GetDocument$(
            `SyncsketchItems/${projectId}/groups/${groupId}/reviews/${sketchId}/items`, id
        ).pipe(
            map(d => d.exists() ? d.data() : null),
            map(item => {
                if (!item || !item.thumbnail_url)
                    return item;

                item.thumbnail_url = ReverseProxy + item.thumbnail_url.replace('https://', '');

                return item;
            })
        )
        /*
        return SyncsketchService.Query$(SyncsketchQueries.ThumbnailById(id)).pipe(
            tap(console.log)
        );*/
    }

    static ReviewItemsByIds$ = (sketchId, groupId, projectId) => {
        const collection = `SyncsketchItems/${projectId}/groups/${groupId}/reviews/${sketchId}/items`
        return FirebaseService.AllDocsFromCollection$(collection);
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
      
    static AllFeedback$ = (id) => {
        if (!id || id === SUSPENSE)
            return of(SUSPENSE)

        return SyncsketchService.Query$(
                SyncsketchQueries.AllFeedback(id)
            ).pipe(map(result => result.objects)
        );
    }
}