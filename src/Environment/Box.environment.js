import { ReverseProxy } from "./proxy.environment";

export const BoxEndPoints = {
    Subfolder: (root, folder) => ReverseProxy + 'liquidanimation.live/box-rest/subfolder?root=' + 
        root + '&folder=' + folder,

    FolderContents: (id) => ReverseProxy + 'liquidanimation.live/box-rest/folderItems?root=' + id,

    Thumbnail: (id) => ReverseProxy + `liquidanimation.live/box-rest/thumbnail?id=` + id,

    SharedFile: (id) => ReverseProxy + `liquidanimation.live/box-rest/sharedfile?id=` + id
}