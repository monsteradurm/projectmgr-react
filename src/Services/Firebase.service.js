import { FirebaseConfig } from "../Environment/Firebase.environment"
import * as firebase from 'firebase/app';
import { getFirestore, collection as fsCollection, doc as fsDoc, query, runTransaction, setDoc,
    deleteDoc, QuerySnapshot   } from 'firebase/firestore';
import { collectionChanges, doc, collection } from 'rxfire/firestore';
import * as _ from 'underscore';
import { BehaviorSubject, concatAll, concatMap, EMPTY, expand, scan, firstValueFrom, from, map,debounceTime, mergeMap, reduce, skip, switchMap, take, tap, toArray, withLatestFrom } from "rxjs";
import { ajax } from "rxjs/ajax";
import { ReverseProxy } from "../Environment/proxy.environment";
import moment from 'moment';
const app = firebase.initializeApp(FirebaseConfig);
export class FirebaseService {

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
        const col = 'Allocations/' + name + '/items';
        return FirebaseService.SubscribeToCollection$(col).pipe(
            concatMap(changes => from(changes).pipe(
                concatMap(change => FirebaseService.GetDocument$(col, change.doc.id).pipe(
                    map(d => ({...d.data(), action: change.type}))
                    ),
                ),
                take(changes.length),
                toArray()
                )
            )
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
                console.log("HERE A: ", a);
                return item$.pipe(
                    tap(console.log),
                    withLatestFrom(group$),
                    tap(console.log),
                    map(([item, group]) => ({...item, group})),
                    withLatestFrom(board$),
                    tap(console.log),
                    map(([item, board]) => ({...item, board})),
                    withLatestFrom(project$),
                    tap(console.log),
                    map(([item, project]) => ({...item, project})),
                    tap(t => console.log("HEEEERE", a, t))
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

