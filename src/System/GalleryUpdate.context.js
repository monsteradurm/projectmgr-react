import { bind, SUSPENSE } from "@react-rxjs/core";
import { BehaviorSubject, combineLatest, of, EMPTY, catchError, distinctUntilChanged, from, scan, merge, combineLatestWith, debounceTime, withLatestFrom } from "rxjs";
import { switchMap, take, map, tap, concatMap } from "rxjs";
import { MondayService } from "@Services/Monday.service";
import { FirebaseService } from "@Services/Firebase.service";

import * as UserService from "@Services/User.service";
import * as _ from 'underscore';
import { combineKeys, createSignal, partitionByKey } from "@react-rxjs/utils";
import { BoxService } from "../Services/Box.service";

import "./GalleryUpdate.scss";
import { SendToastError } from "../App.Toasts.context";
import { SetNavigationHandler } from "../Application.context";
import { useNavigate } from "react-router-dom";

export const UpdateGalleryFolder = () => {
    
    SetNavigationHandler(useNavigate());
    GalleryFolderId$.pipe(take(1)).subscribe(folderId => {
        console.log("Updating Gallery Folder: ", folderId);
        if (!folderId) {
            SendToastError("Folder Id is not Valid!")
            return;
        }

        BoxService.FolderContents$(folderId).pipe(
            take(1)
        ).subscribe(res => {
            if (!res || !res.entries) {
                SendToastError("Folder Id is not Valid!")
                return;
            }
            else if (res.entries.length < 1) {
                SendToastError("Folder is empty!");
                return;
            }
            const entries = res.entries;
            if (entries[0].path_collection.entries[1].name !== '_LA.Gallery') {
                SendToastError('Folder is not a valid _LA.Gallery Folder!')
                return;
            }
            /*
            from(entries).pipe(
                concatMap(entry => BoxService.)
            )*/
        })
    })
}


export const [GalleryFolderIdChanged$, SetGalleryFolderId] = createSignal(n => n);
export const [useGalleryFolderId, GalleryFolderId$] = bind(
    GalleryFolderIdChanged$, ''
)