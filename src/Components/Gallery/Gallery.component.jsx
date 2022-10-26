import { useGalleryItems } from "./Gallery.context";
import { useState, useEffect } from "react";
import { SUSPENSE } from "@react-rxjs/core";
import { Loading } from "../General/Loading";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import * as _ from 'underscore';
import { Stack } from "react-bootstrap";
import { PanoramicVideo } from "./PanoramicVideo.component";
import { BoxService } from "../../Services/Box.service";
import { take } from "rxjs";

export const GalleryComponent = ({headerHeight}) => {
    const [item, setItem] = useState(SUSPENSE);
    const [title, setTitle] = useState(null);
    const [id, setId] = useState(SUSPENSE);
    const items = useGalleryItems();
    const [searchParams, setSearchParams] = useSearchParams();

    SetNavigationHandler(useNavigate());

    useEffect(() => {
        setId(searchParams.get('id'));
        setTitle(searchParams.get('title'));
    }, [searchParams])

    useEffect(() => {
        if (items === SUSPENSE || id === SUSPENSE || id === null || items === null)
            return;

        const entry = _.find(items, i => i.id.toString() === id.toString());
        const parent = entry?.parent?.id;
        if (parent) {
            BoxService.FolderContents$(parent).pipe(take(1)).subscribe((contents) => {
                const entries = contents?.entries;
                if (!entries)
                    return;
                const result = _.find(entries, i => i.id.toString() === id.toString());
                if (result)
                    setItem({...result, nesting: entry.nesting});
            })
        }
    }, [items, id])

    useEffect(() => {
        let titles = ['Gallery'];

        if (item?.nesting) {
            titles = titles.concat(item.nesting);
        } 

        if (title) {
            titles.push(title);
        }

        SetTitles(titles);
    }, [item])

    if ([item, id].indexOf(SUSPENSE) >= 0)
        return <Loading text="Retrieving Gallery Item..." />

    return <Stack direction="horizontal" style={{justifyContent: 'center', height: 'calc(100vh - 150px)', marginTop: 25}}>
        {
            item?.tags?.includes('360Video') ? <iframe src={"/video360?id=" + id} style={{width: '100%', height: '100%', paddingLeft: 25, paddingRight: 25}}></iframe> 
            : <video src={item?.shared_link?.download_url} style={{objectFit: 'fill', height: '100%', width: 'auto'}} controls />
        }
        
    </Stack>
}