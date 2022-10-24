import { useGalleryItems } from "./Gallery.context";
import { useState, useEffect } from "react";
import { SUSPENSE } from "@react-rxjs/core";
import { Loading } from "../General/Loading";
import { ScrollingPage } from "../General/ScrollingPage.component";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SetNavigationHandler, SetTitles } from "../../Application.context";
import * as _ from 'underscore';

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

        setItem(
            _.find(items, i => i.id.toString() === id.toString())
        )
    }, [items, id])

    useEffect(() => {
        let titles = ['Gallery'];

        if (item.nesting) {
            titles = titles.concat(item.nesting);
        } 
        if (title) {
            titles.push(title);
        }

        SetTitles(titles);
    }, [item])

    if ([item, id].indexOf(SUSPENSE) >= 0)
        return <Loading text="Retrieving Gallery Item..." />

    console.log(item);
    return <pre style={{textAlign: "left", padding: 20}}>{ JSON.stringify(item, null, 4)}</pre>
}