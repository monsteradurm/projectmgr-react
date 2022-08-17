import { FirebaseConfig } from "../Environment/Firebase.environment"
import * as firebase from 'firebase/app';
import { getFirestore, collection as fsCollection, doc as fsDoc } from 'firebase/firestore';
import { collectionChanges, doc, collection } from 'rxfire/firestore';
import * as _ from 'underscore';
import { BehaviorSubject, concatAll, concatMap, expand, firstValueFrom, from, map, mergeMap, reduce, switchMap, take, tap, toArray } from "rxjs";
import { ajax } from "rxjs/ajax";
import { ReverseProxy } from "../Environment/proxy.environment";

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
    static SubscribeToCollection$(collection) {
        return collectionChanges(fsCollection(FirebaseService.db, collection));
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
        return FirebaseService.AllDocsFromCollection$('ProjectManager');
   }

   static MyBoards$(mondayId) {
       return FirebaseService.Collection$('ProjectManager').pipe(

        switchMap(docs => from(_.pluck(docs, 'id')).pipe(
            concatMap(ws_id => 
                FirebaseService.AllDocsFromCollection$(`ProjectManager/${ws_id}/Boards`).pipe(
                    take(1),
                    map(boards => _.filter(boards, 
                        b => b.state === 'active' && b.subscribers.indexOf(mondayId) > -1)),
                    map(boards => _.map(boards, b => ({projectId: ws_id, boardId: b.id})))
                    ),
                ),
                take(docs.length),
                toArray(),
                map(ws_boards => _.flatten(ws_boards))
            ),
        ),  
        take(1),
        tap(t => console.log("Subscriptions", t))
       )
   }
   static GetDocument$(col, id) {
        return doc(fsDoc(FirebaseService.db, col + '/' + id)).pipe(
            take(1)
        )
    }

    static BoardOptions$(projectId) {
        return FirebaseService.AllDocsFromCollection$(`ProjectManager/${projectId}/Boards`);
    }

    static GroupOptions$(projectId, boardId) {
        return FirebaseService.AllDocsFromCollection$(`ProjectManager/${projectId}/Boards/${boardId}/Groups`)
    }

    static _ItemsStore = new BehaviorSubject([]);
    static ItemsChanged$(projectId, boardId, groupId) {
        FirebaseService._ItemsStore.next([]);

        return FirebaseService
            .SubscribeToCollection$(
                `ProjectManager/${projectId}/Boards/${boardId}/Groups/${groupId}/Items`
            );
    }

    static Project$(projectId) {
        return doc(fsDoc(FirebaseService.db, 'ProjectManager/' + projectId)).pipe(
            map(doc => doc.exists ? doc.data() : null),
            take(1)
        )
    }


    ForceProjectItemRefresh(itemId) {
        ajax.post(`${ReverseProxy}us-central1-pm-websocket.cloudfunctions.net/PMItemUpdate`, 
            { event: { pulseId: itemId }}).pipe(
                take(1).subscribe((result) => {
                    console.log("Forced Refresh", result);
                })
            )
    }
    static Board$(projectId, boardId) {
        return FirebaseService
            .SubscribeToDocument$(
                `ProjectManager/${projectId}/Boards/${boardId}`
            ).pipe(
                map(snapshot => snapshot.data()),
            );
    }
}