import { useGalleryItems } from "./Gallery.context";
import { useState, useEffect } from "react";
import { SUSPENSE } from "@react-rxjs/core";
import { Loading } from "../General/Loading";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import * as _ from 'underscore';
import { Stack } from "react-bootstrap";

export const GalleryComponent = ({headerHeight}) => {
    const [item, setItem] = useState(SUSPENSE);
    const [title, setTitle] = useState(null);
    const [id, setId] = useState(SUSPENSE);
    const items = useGalleryItems();
    const [searchParams, setSearchParams] = useSearchParams();
    const [url, setUrl] = useState(null);

    SetNavigationHandler(useNavigate());

    useEffect(() => {
        setId(searchParams.get('id'));
        setTitle(searchParams.get('title'));
    }, [searchParams])

    useEffect(() => {
        if (items === SUSPENSE || id === SUSPENSE || id === null || items === null)
            return;

        const result = _.find(items, i => i.id.toString() === id.toString());
        if (result)
            setItem(
                result
            )
    }, [items, id])

    useEffect(() => {
        let titles = ['Gallery'];

        if (item?.nesting) {
            titles = titles.concat(item.nesting);
        } 
        if (item?.shared_link?.download_url) {
            setUrl(item.shared_link.download_url);
        }

        if (title) {
            titles.push(title);
        }

        SetTitles(titles);
    }, [item])

    if ([item, id].indexOf(SUSPENSE) >= 0)
        return <Loading text="Retrieving Gallery Item..." />

    return <Stack direction="horizontal" style={{justifyContent: 'center', height: 'calc(100vh - 150px)', marginTop: 25}}>
        <video src={url} style={{objectFit: 'fill', height: '100%', width: 'auto'}} controls />
    </Stack>
}