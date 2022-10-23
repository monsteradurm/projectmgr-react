import { bind, SUSPENSE } from "@react-rxjs/core";
import * as _ from 'underscore';
import { BoxService } from "../../Services/Box.service";

export const [useGalleryFolders, GalleryFolders$] = bind(
    BoxService.GalleryFolders$, SUSPENSE
)