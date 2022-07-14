import { Suspense, useEffect, useState } from "react"
import { take } from "rxjs";
import { DeferredContent } from "primereact/deferredcontent";
import { Skeleton } from "primereact/skeleton";
import { NavigationService } from "../../Services/Navigation.service";

export const LazyThumbnail = ({thumbnail$, width, height, url}) => {
    const [thumbnail, setThumbnail] = useState(null);
    const [visible, setVisible] = useState(false);

    const onClickHandler = (e) => {
        if (!url)
            return;
        
        NavigationService.OpenNewTab(url, e);
    }

    useEffect(() => {
        if (!visible || !thumbnail$)
            return;

        thumbnail$.pipe(take(1)).subscribe((thumb) => {
            if (thumb) setThumbnail(thumb);
        })

    }, [thumbnail$, visible])

    const fallback = <Skeleton width={width} height={height}/>;
    return(
        <DeferredContent onLoad={() => setVisible(true)}>
        {
            thumbnail ?
            <Suspense fallback={fallback}>
                <img src={thumbnail} className={url ? "pm-thumbnail-link" : null}
                style={{width: width, height:height, cursor: url ? 'pointer' : null}} 
                    onClick={onClickHandler} />  
            </Suspense>  : fallback
        }
        </DeferredContent>
    )
}