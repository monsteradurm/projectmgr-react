import { Suspense, useEffect, useState } from "react"
import { take } from "rxjs";
import { DeferredContent } from "primereact/deferredcontent";
import { Skeleton } from "primereact/skeleton";
import { NavigationService } from "../../Services/Navigation.service";
import { SUSPENSE } from "@react-rxjs/core";

export const LazyThumbnail = ({thumbnail$, width, height, url, borderRadius, border, style, thumbnail}) => {
    const [observedThumbnail, setObservedThumbnail] = useState(null);
    const [visible, setVisible] = useState(false);
    
    const onClickHandler = (e) => {
        if (!url)
            return;
        
        NavigationService.OpenNewTab(url, e);
    }

    useEffect(() => {
        if (!visible || !thumbnail$)
            return;

        const sub = thumbnail$.subscribe((thumb) => {
            if (thumb && thumb !== SUSPENSE) {
                console.log("SETTING THUMBNAIL: " + thumb)
                setObservedThumbnail(thumb);
                setVisible(true);
            }
        });

        return () => sub.unsubscribe();
    }, [thumbnail$, visible])
    /*
    useEffect(() => {
        console.log("THUMBNAIL CHANGED", thumbnail);
    }, [thumbnail])
*/
    const fallback = <Skeleton width={width} height={height}/>;

    if (thumbnail && thumbnail !== SUSPENSE && !visible)
        setVisible(true);

    if (!visible)
        return fallback;

    return(
        <img src={thumbnail ? thumbnail : observedThumbnail} className={url ? "pm-thumbnail-link" : null}
        style={{width: width, height:height, cursor: url ? 'pointer' : null, objectFit: 'cover',
        borderRadius: borderRadius ? borderRadius : null, border: border ? border : null, ...style}} 
        onClick={onClickHandler} />
    )
}