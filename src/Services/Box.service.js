import { switchMap, map, retry, shareReplay, delay, BehaviorSubject, 
    tap, of, EMPTY, expand, concatMap, concat, reduce, take } from "rxjs";
import { ajax } from "rxjs/ajax";
import { authOptions, BoxAuthorizationString, BoxEndPoints } from "../Environment/Box.environment";
import { Buffer } from 'buffer';

const BufferToBase64 = (buffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

export class BoxService {
   
      static SubFolder$ = (root, folder) => {
        /*  root should be box id for this folder, eg. 0 (for the root)
            folder should be the folder name, ie. LADUS_DisneyUS */

        return ajax.get(BoxEndPoints.Subfolder(root, folder)).pipe(take(1))
      }

      
      static Thumbnail$ = (id) => {
        if (!id) return of(null);

        return ajax.get(BoxEndPoints.Thumbnail(id)).pipe(
            map(result => result?.response ? result.response : null),
            map(res => res?.file.data ? `data:image/png;base64,${BufferToBase64(res.file.data)}` : 
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
              tap(console.log)
          )
      }
      static FolderContents$ = (folderId) => {
          if (!folderId)
            return of(null);

        return ajax.get(BoxEndPoints.FolderContents(folderId)).pipe(
            map(result => result?.response ? result.response : null),
            take(1)
        )
      }

      static FindFolderRecursively$ = (folderArr) => {
        if (!folderArr || folderArr.length < 1)
            return of(null);

        return of(null).pipe(
            expand((result, i) => {
                if (result === null)
                    return BoxService.SubFolder$(0, folderArr[0]);

                else if (i >= folderArr.length)
                    return EMPTY
                
                return BoxService.SubFolder$(result.response.id, folderArr[i]);
            }),
            reduce((acc, v) => v ? v.response : null)
        )
      }

      static ElementFolder$ = (projectContainer, project, board, group, element) => {
          console.log(projectContainer, project, board, group, element)
      }

    
}