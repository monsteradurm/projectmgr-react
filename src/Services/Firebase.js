import { FirebaseConfig } from "../Environment/Firebase"
import * as firebase from 'firebase/app';
import { getFirestore, collection as fsCollection, doc as fsDoc } from 'firebase/firestore';
import { collectionChanges, doc, collection } from 'rxfire/firestore';
import * as _ from 'underscore';
import { firstValueFrom, map, switchMap, take } from "rxjs";

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
        return FirebaseService.AllDocsFromCollection$('Badges');
    }

   static get AllWorkspaces$() {
        return FirebaseService.AllDocsFromCollection$('ProjectManager');
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

    static Items$(projectId, boardId, groupId) {
        return FirebaseService
            .SubscribeToCollection$(
                `ProjectManager/${projectId}/Boards/${boardId}/Groups/${groupId}/Items`
            ).pipe(
                map(docs => docs.map(d => d.doc.data())),
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
}