import { ReverseProxy } from "./proxy.environment";

export const BoxEndPoints = {
    Subfolder: (root, folder) => '/box-rest/subfolder?root=' + 
        root + '&folder=' + folder,

    FolderContents: (id) => '/box-rest/folderItems?root=' + id,

    Thumbnail: (id) => '/box-rest/thumbnail?id=' + id,

    SharedFile: (id) => '/box-rest/sharedfile?id=' + id
}