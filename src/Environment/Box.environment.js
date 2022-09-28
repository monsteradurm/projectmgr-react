import { ReverseProxy } from "./proxy.environment";

export const BoxEndPoints = {
    
    Subfolder: (root, folder) => '/liquidanimation-box/subfolder?root=' + 
        root + '&folder=' + folder,

    FolderContents: (id) =>'/liquidanimation-box/folderItems?root=' + id,

    Thumbnail: (id) => `/liquidanimation-box/thumbnail?id=` + id,

    SharedFile: (id) => `/liquidanimation-box/sharedfile?id=` + id

    /*
    Subfolder: (root, folder) => ReverseProxy + 'liquidanimation.live/box-rest/subfolder?root=' + 
        root + '&folder=' + folder,

    FolderContents: (id) => ReverseProxy + 'liquidanimation.live/box-rest/folderItems?root=' + id,

    Thumbnail: (id) => ReverseProxy + `liquidanimation.live/box-rest/thumbnail?id=` + id,

    SharedFile: (id) => ReverseProxy + `liquidanimation.live/box-rest/sharedfile?id=` + id
    */
}