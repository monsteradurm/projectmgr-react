import { switchMap, map, retry, shareReplay, delay, BehaviorSubject, 
    tap, of, EMPTY, expand, concatMap, concat, reduce, take, catchError } from "rxjs";
import { ajax } from "rxjs/ajax";
import { authOptions, BoxAuthorizationString, BoxEndPoints } from "../Environment/Box.environment";
import { Buffer } from 'buffer';

const BufferToBase64 = (buffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

const Headers = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
}

export class BoxService {
   
      static StreamDownload$ = (url) => {
          return ajax.get(url).pipe(
              tap(console.log)
          )
      }
      
      static SubFolder$ = (root, folder) => {
        /*  root should be box id for this folder, eg. 0 (for the root)
            folder should be the folder name, ie. LADUS_DisneyUS */

        return ajax.get(BoxEndPoints.Subfolder(root, folder)).pipe(take(1))
      }

      
      static Thumbnail$ = (id) => {
        if (!id) return of(null);

        return ajax.get(BoxEndPoints.Thumbnail(id)).pipe(
            map(result => result?.response ? result.response : null),
            map(res => res?.file?.data ? `data:image/png;base64,${BufferToBase64(res.file.data)}` : 
                res.location ? res.location : null),
            take(1),
        )
      }

      static SharedFile$ = (id) => {
          if (!id) return of(null);

          return ajax.get(BoxEndPoints.SharedFile(id)).pipe(
              map(result => result?.response?.shared_link?.url ? 
                result.response.shared_link.url : null),
              take(1),
              
          )
      }

      static FolderContents$ = (folderId) => {
          
          if (!folderId)
            return of(null);

        return ajax.get(BoxEndPoints.FolderContents(folderId), Headers).pipe(
            tap(console.log),
            map(result => result?.response ? result.response : null),
            take(1)
        )
      }

      static FindFolderRecursively$ = (folderArr) => {
        if (!folderArr || folderArr.length < 1)
            return of(null);

        return of(null).pipe(
            expand((result, i) => {
                if (result === null && i < 1)
                    return BoxService.SubFolder$(0, folderArr[0]);
                else if (!result.response)
                    return of(null);
                else if (result.response === null && i > 0)
                    throw 'Box Folder Not Found: ' + folderArr.splice(0, i).join('/');
                else if (i >= folderArr.length)
                    return EMPTY
                
                //console.log("Retrieving SubFolder: ", result.response.id, folderArr[i]);
                return BoxService.SubFolder$(result.response.id, folderArr[i]);
            }),
            reduce((acc, v) => v ? v.response : null),
            catchError(err => {
                console.log(err);
                return of(null);
            })
        )
      }

      static GalleryFolders$ = BoxService.FolderContents$(BoxEndPoints.GalleryFolder).pipe(
          tap(t => console.log("GALLERY FOLDERS$". t))
      )

    
}