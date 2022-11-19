import { FirebaseConfig } from "../Environment/Firebase.environment"
import * as firebase from 'firebase/app';
import { getFirestore, collection as fsCollection, doc as fsDoc, query, runTransaction, setDoc, where,
    deleteDoc, QuerySnapshot, collectionGroup, getDocs, onSnapshot   } from 'firebase/firestore';
import { collectionChanges, doc, collection } from 'rxfire/firestore';
import * as _ from 'underscore';
import { BehaviorSubject, concatAll, concatMap, EMPTY, expand, scan, firstValueFrom, from, map,debounceTime, mergeMap, reduce, skip, switchMap, take, tap, toArray, withLatestFrom, of, catchError, Observable } from "rxjs";
import { ajax } from "rxjs/ajax";
import { ReverseProxy } from "../Environment/proxy.environment";
import moment from 'moment';
const app = firebase.initializeApp(FirebaseConfig);
export class FirebaseService {

    /* Start Testing */

    static GetProjectHours$() {
        const logs = query(collectionGroup(FirebaseService.db, 'LogEntries'), where('ProjectId', '==', "LAS0005_DWTD"));
        return from(getDocs(logs));
    }

    /* End Testing */



    static get db() {
        return getFirestore(app)
    }

    static Collection$(name) {
        const collectionRef = fsCollection(FirebaseService.db, name);
        return collection(collectionRef);
    }

    static AllDocsFromCollection$(name) {   
        return FirebaseService.Collection$(name)
            .pipe(
                map((docs) => _.map(docs, (d) => {
                    let data = d.data();
                    return data;
                })),
                take(1)
            );
    }

    static AllIdsFromCollection$(name) {   
        return FirebaseService.Collection$(name)
            .pipe(
                map((docs) => _.map(docs, (d) => d.id)),
                take(1)
            );
    }

    static AllDocsFromCollectionGroup$ (name, subcollection) {
        return FirebaseService.AllDocsFromCollection$(name).pipe(
            take(1),
            switchMap(async (data) => {
                for (let d of data) {
                    d[subcollection] = 
                    await firstValueFrom(
                        this.AllDocsFromCollection$(
                            name + '/' + d.name.replace('/', '_._') + '/' + subcollection
                            )
                        )
                }
                return data;
            })
        )
    }

    static DeleteSyncsketchItem(item) {
        const docRef = fsDoc(FirebaseService.db, 
            `SyncsketchItems/${item.project}/groups/${item.group}/reviews/${item.sketchId}/items/${item.id}`);

        return from(deleteDoc(docRef))
    }

    static SyncsketchItemsFromPulseId(projectId, pulse) {

        const itemsRef = collection(db, "SyncsketchItems")
            .doc(projectId.toString())
            .collection('items')

        const q = query(itemsRef, where("pulse", "==", pulse));
    }

    static SubscribeToCollection$(collection) {
        return collectionChanges(fsCollection(FirebaseService.db, collection))
    }

    static SubscribeToSupportGroup$(boardId) {
        console.log("Subscribing to Support Group", boardId);
        const collection_name = `SupportItems/${boardId}/items`;

        const collectionRef = fsCollection(FirebaseService.db, collection_name);

        const exists$ = collection(collectionRef).pipe(
            map(c => c?.length > 0)
        )
        return exists$.pipe(
            switchMap(exists => { 
                console.log("HERE", exists);
                if (!exists)
                    throw 'EMPTY';

                return collectionChanges(collectionRef).pipe(
                    concatMap(reviewArr => from(reviewArr).pipe(
                        concatMap(change => FirebaseService.GetDocument$(collection_name, change.doc.id).pipe(
                            map(d => d.data()),
                        )
                    )),
                )
            )
        }))
    }
    static SubscribeToDocument$(path) {
        return doc(fsDoc(FirebaseService.db, path));
    }

    static get AllBadges$() {
        return FirebaseService.AllDocsFromCollection$('Badges').pipe(
            map(result => _.reduce(result, (acc, t) => {
                acc[t.Title.replace(/\s/g, '')] = t;
                return acc;
            }, {})),
        )
    }

   static get AllWorkspaces$() {
        return FirebaseService.AllDocsFromCollection$('ProjectManager').pipe(
            tap(t => console.log("RETRIEVE WORKSPACES", t))
        );
   }

   static AllBoards$() {
        return FirebaseService.Collection$('ProjectManager').pipe(
            take(1),
            switchMap(docs => from(_.pluck(docs, 'id')).pipe(
                concatMap(ws_id => 
                    FirebaseService.AllDocsFromCollection$(`ProjectManager/${ws_id}/Boards`).pipe(
                        take(1),
                        map(boards => _.filter(boards, b => b.state === 'active' )),
                        map(boards => _.map(boards, b => ({projectId: ws_id, boardId: b.id, data: b})))
                        ),
                    ),
                    take(docs.length),
                    toArray(),
                    map(ws_boards => _.flatten(ws_boards))
                ),
            ),  
            take(1),
        )
   }
   static GetTimesheet$(artist, date) {
       console.log("Retrieving timesheet", artist, date)
        if (!artist || !date || artist.length < 1 || date.length < 1)
            return of(null);
        
        const sheetExists$ = FirebaseService.DocumentExists$('Timesheets/' + artist + '/Sheets/' + date).pipe(
            tap(t => console.log("Date Exists", t))
        );
        
        console.log("SheetPath: /" + 'Timesheets/' + artist + '/Sheets/' + date)
        return sheetExists$.pipe(
            switchMap(exists => exists ? FirebaseService.GetDocument$('Timesheets/' + artist + '/Sheets', date).pipe(
                map(d => d.data())
            ) : of(null))
        )
   }

   static StoreTimesheet$(sheet) {
       console.log("Storing sheet: ", sheet);

        if (!sheet)
            return of(null);
        const artistRef = fsDoc(FirebaseService.db, `Timesheets/${sheet.artist}`);
        const assertArtist$ = from(setDoc(artistRef, ({artist: sheet.artist})));

        const docRef = fsDoc(FirebaseService.db, `Timesheets/${sheet.artist}/Sheets/` + sheet.date);

        return assertArtist$.pipe(
            switchMap(() => from(setDoc(docRef, sheet))),
                concatMap(() => from(sheet.logs?.length ? sheet.logs : []).pipe(
                    switchMap(log => {
                        const logRef = fsDoc(FirebaseService.db, `Timesheets/${sheet.artist}/Sheets/` + sheet.date + '/LogEntries/' + log.ItemId);
                        return from(setDoc(logRef, log))
                    })
                )
            ),
            map(res => sheet),
            catchError(err => {
                console.log(err);
                return of(null);
            })
        )
   }

   static AllProjects$ = FirebaseService.AllDocsFromCollection$('ProjectManager').pipe(
       tap(t => console.log("All Projects", t))
   )

   static AllBoardsFromProject$ = (projectId) => FirebaseService.AllDocsFromCollection$('ProjectManager/' + projectId + '/Boards');
   static AllGroups$ = (projectId, boardId) => FirebaseService.AllDocsFromCollection$(
       `ProjectManager/${projectId}/Boards/${boardId}/Groups`
   )
   static AllItems$ = (projectId, boardId, groupId) => FirebaseService.AllDocsFromCollection$(
    `ProjectManager/${projectId}/Boards/${boardId}/Groups/${groupId}/Items`
)

   static GetBoardItem$({projectId, boardId, groupId, itemId}) {
        if (!projectId || !boardId || !groupId || !itemId) return of(null);
        const col = `ProjectManager/${projectId}/Boards/${boardId}/Groups/${groupId}/Items`;
        return FirebaseService.GetDocument$(col, itemId).pipe(
            map(d => d.data())
        )
   } 

   static MyBoards$(mondayId) {
       return FirebaseService.Collection$('ProjectManager').pipe(
        take(1),
        switchMap(docs => from(_.pluck(docs, 'id')).pipe(
            concatMap(ws_id => 
                FirebaseService.AllDocsFromCollection$(`ProjectManager/${ws_id}/Boards`).pipe(
                    take(1),
                    map(boards => _.filter(boards, 
                        b => b.state === 'active' && b.subscribers.indexOf(mondayId) > -1)),
                    map(boards => _.map(boards, b => ({projectId: ws_id, boardId: b.id, data: b})))
                    ),
                ),
                take(docs.length),
                toArray(),
                map(ws_boards => _.flatten(ws_boards))
            ),
        ),  
        take(1),
       )
   }
   static GetDocument$(col, id) {
        return doc(fsDoc(FirebaseService.db, col + '/' + id)).pipe(
            take(1)
        )
    }

    static BoardOptions$(projectId) {
        console.log("Docs from Colection", projectId)
        return FirebaseService.AllDocsFromCollection$(`ProjectManager/${projectId}/Boards`).pipe(
            tap(console.log)
        );
    }

    static GroupOptions$(projectId, boardId) {
        return FirebaseService.AllDocsFromCollection$(`ProjectManager/${projectId}/Boards/${boardId}/Groups`)
    }

    static BoardItems$(projectId, boardId, groupId) {
        if (!projectId || !boardId || !groupId) return EMPTY;
        const collection = `ProjectManager/${projectId}/Boards/${boardId}/Groups/${groupId}/Items`;
        return FirebaseService.AllDocsFromCollection$(collection).pipe(
            //concatMap(reviewArr => from(reviewArr)),
        )
    }

    static AllocationsChanged$ = (name) => {
        const q = query(collectionGroup(FirebaseService.db, "Items"), where("CurrentArtist", "array-contains", name));
        return new Observable((obs) => {
            let init=false;
            onSnapshot(q, (snapshot) => {
                const result = [];
                
                if (!init) {
                    snapshot.forEach(doc => {
                        result.push({action: 'added', ...doc.data()})
                    });
                    init = true;
                }
                snapshot.docChanges().forEach((change) => {
                    result.push({action: change.type, ...change.doc.data()});
                });

                obs.next(result);
            })
        });
    }

    static GalleryItems$ = FirebaseService.AllDocsFromCollection$('Gallery').pipe(
        map(items => _.map(items, i => {
                const entries = i.path_collection.entries;
                let nesting = _.pluck(entries.splice(2, entries.length - 1), 'name');
                return { ...i, nesting}
            }),
        ),
        take(1)
    )
    static ProjectItemsFromIds$(ids) {
        const q = query(collectionGroup(FirebaseService.db, 'Items'), where('id', 'in', ids));
        return from(getDocs(items)).pipe(
            map(snapshot => {
                const result = [];
                snapshot.forEach(s => {
                    result.push(s.data());
                    return result;
                });
            })
        )
    }
    
    static GetItemLogs$(itemId) {
        const q = query(collectionGroup(FirebaseService.db, 'LogEntries'), where('ItemId', '==', itemId.toString()));
        return from(getDocs(q)).pipe(
            map(snapshot => {
                const result = [];
                snapshot.forEach(s => {
                    const logRef = s.ref;
                    const colRef = logRef.parent;
                    const dateRef = colRef.parent;
                    const sheetColRef = dateRef.parent;
                    const artistRef = sheetColRef.parent;
                    result.push({...s.data(), artist: artistRef.id, date: dateRef.id})
                });

                return result;
            }),
            map(entries => _.sortBy(entries, e => e.date))
        )
    }

    static ItemsByAllocations$ = (allocations) => from(allocations).pipe(
            concatMap(a => {
                const b = a.boardId.toString();
                const g = a.groupId.toString();
                const id = a.id.toString();
                const projectId = a.board_description.split('/')[1]
                console.log(`ProjectManager/${projectId}/Boards/${b}/Groups/${g}/Items`);
                const item$ = FirebaseService.GetDocument$(
                `ProjectManager/${projectId}/Boards/${b}/Groups/${g}/Items`, id).pipe(
                    map(d => d.data()),
                )
                const group$ = FirebaseService.GetDocument$(
                    `ProjectManager/${projectId}/Boards/${b}/Groups`, g).pipe(
                        map(d => d.data()),
                )
                const board$ = FirebaseService.GetDocument$(
                    `ProjectManager/${projectId}/Boards`, b).pipe(
                        map(d => d.data()),
                )
                const project$ = FirebaseService.GetDocument$(
                    `ProjectManager`, projectId).pipe(
                        map(d => d.data()),
                )

                return item$.pipe(
                    withLatestFrom(group$),
                    map(([item, group]) => ({...item, group})),
                    withLatestFrom(board$),
                    map(([item, board]) => ({...item, board})),
                    withLatestFrom(project$),
                    map(([item, project]) => ({...item, project})),
                )
            }),
            take(allocations.length),
            toArray(),
        )
    
    static BoardItemsChanged$(projectId, boardId, groupId) {
        if (!projectId || !boardId || !groupId) return EMPTY;
        const collection = `ProjectManager/${projectId}/Boards/${boardId}/Groups/${groupId}/Items`;
        return FirebaseService.SubscribeToCollection$(collection).pipe(
                skip(1),
                concatMap(reviewArr => from(reviewArr)),
                map(change => change.doc.id),
                switchMap(id => FirebaseService.GetDocument$(collection, id).pipe(
                    map(d => d.data())
                )),
            )
    }

    static ItemsByStatus$(Status) {
        const collection = `MondayStatus/${Status}/items`;
        return FirebaseService.SubscribeToCollection$(collection).pipe(
                concatMap(reviewArr => from(reviewArr)),
                concatMap(change => FirebaseService.GetDocument$(collection, change.doc.id).pipe(
                    map(doc => ({...doc.data(), change: change.type}))
                    )
                ),
            )
    }

    static Project$(projectId) {
        return doc(fsDoc(FirebaseService.db, 'ProjectManager/' + projectId)).pipe(
            map(doc => doc.exists ? doc.data() : null),
            take(1)
        )
    }

    static DocumentExists$(path) {
        return doc(fsDoc(FirebaseService.db, path)).pipe(
            map(doc => doc.exists()),
            take(1)
        )
    }

    static GetTimesheetSubmissions$(range) {
        console.log("Retrieving timesheet submissions", range)
        if (!range || range.length < 1)
            return of([]);  

            
        const col$ = FirebaseService.Collection$('Timesheets').pipe(
            tap(console.log),
        )
        return col$.pipe(
            take(1),
            map(docs => _.pluck(docs, 'id')),
            switchMap(artists => {
                const fs = getFirestore();
                const references = [];
                artists.forEach(artist => {
                    range.forEach(d => {
                        const path = `Timesheets/${artist}/Sheets/${d}`;
                        const ref = fsDoc(FirebaseService.db, path)
                        references.push(ref);
                    })
                });

                return runTransaction(FirebaseService.db, async (t) => {
                    const results = []
                    for(var i=0; i < references.length; i++) {
                        const sfDoc = await t.get(references[i]);
                        if (sfDoc.exists()) {
                            results.push(sfDoc.data())
                        } else {
                            results.push({date: references[i].id})
                        }
                    }
        
                    return Promise.all(results);
                })
            }),
            tap(t => console.log("HERE", t))
        )
    }

    static GetTimesheets$(artist, range) {
        console.log("Retrieving tmesheets", artist, range)
        if (!artist || !range || range.length < 1)
            return of([]);
            
        const fs = getFirestore();
        const references = [];

        range.forEach(d => {
            const path = `Timesheets/${artist}/Sheets/${d}`;
            const ref = fsDoc(FirebaseService.db, path)
            references.push(ref);
        })

        return runTransaction(FirebaseService.db, async (t) => {
            const results = []
            for(var i=0; i < references.length; i++) {
                const sfDoc = await t.get(references[i]);
                if (sfDoc.exists()) {
                    results.push(sfDoc.data())
                } else {
                    results.push({date: references[i].id})
                }
            }

            return Promise.all(results);
        })
    }

    static GetBatchedMondayItems(items) {
        const fs = getFirestore();
        const references = []

        items.forEach(i => {
            const { board_description, board, group, id } = i;
            let project = board_description;
            if (project.indexOf('/') >= 0)
                project = project.split('/')[1]
             
            const path = `ProjectManager/${project}/Boards/${board}/Groups/${group}/Items/${id}`;
            const ref = fsDoc(FirebaseService.db, path)
            references.push(ref);
        })
      
        return runTransaction(FirebaseService.db, async (t) => {
            const results = []
            for(var i=0; i < references.length; i++) {
                const sfDoc = await t.get(references[i]);
                if (sfDoc.exists()) {
                    results.push(sfDoc.data())
                }
            }

            return Promise.all(results);
        })
    }


    ForceProjectItemRefresh(itemId) {
        ajax.post(`${ReverseProxy}us-central1-pm-websocket.cloudfunctions.net/PMItemUpdate`, 
            { event: { pulseId: itemId }}).pipe(
                take(1).subscribe((result) => {
                    console.log("Forced Refresh", result);
                })
            )
    }
    static BoardItem$(projectId, boardId, groupId, itemId) {
        return FirebaseService.SubscribeToDocument$(
            `ProjectManager/${projectId}/Boards/${boardId}/Groups/${groupId}/Items/${itemId}`
        ).pipe(
            map(snapshot => snapshot.data()),
        );
    }
    static Board$(projectId, boardId) {
        return FirebaseService
            .SubscribeToDocument$(
                `ProjectManager/${projectId}/Boards/${boardId}`
            ).pipe(
                map(snapshot => snapshot.data()),
            );
    }

    static Notices$ = FirebaseService.SubscribeToCollection$('Noticeboard').pipe(
        concatMap(reviewArr => from(reviewArr).pipe(
            concatMap(change => FirebaseService.GetDocument$('Noticeboard', change.doc.id).pipe(
                        map(doc => ({...doc.data(), change: change.type, id: change.doc.id}))
                    )
                ),
            )
        ),
    )

    static DeleteNotice$ = (id) => {
        const docRef = fsDoc(FirebaseService.db, 'Noticeboard/' + id);
        return from(deleteDoc(docRef))
    }

    static StoreSyncsketchUpload$ = (id, data) => {
        const docRef = fsDoc(FirebaseService.db, 'SyncsketchUploads/' + id);
        const result = from(    setDoc(docRef, data)  )
        return result;
    }

    static StoreNotice$ = (notice, updateDate) => {
        const docRef = fsDoc(FirebaseService.db, 'Noticeboard/' + notice.id);
        const result = from(setDoc(docRef, 
            {id: notice.id, content: notice.content, updated_at: updateDate ? 
                moment(moment.now()).format('YYYY-MM-DD HH:mm') : notice.updated_at}
            )
        )

        return result;
    }

    static ApplicationResponseData$ = (form_id) => {
        const col = 'Typeforms/' + form_id + '/responses';
        return FirebaseService.SubscribeToCollection$(col).pipe(
            concatMap(reviewArr => from(reviewArr).pipe(
                concatMap(change => FirebaseService.GetDocument$(col, change.doc.id).pipe(
                            map(doc => ({...doc.data(), change: change.type, response_id: change.doc.id}))
                        )
                    ),
                )
            ),
            scan((acc, cur) => {
                let result = acc.filter(r => r.response_id !== cur.response_id);
                if (cur?.change === 'removed')
                    return result;
                return [...result, cur]
            }, []),
            debounceTime(250),
            map(data => _.reduce(data, (acc, cur) => {
                    acc[cur.response_id] = cur;
                    return acc;
                }, {})
            )
        )
    }
}

