import { Suspense, useEffect, useState } from "react"
import { take } from "rxjs";
import { DeferredContent } from "primereact/deferredcontent";
import { Skeleton } from "primereact/skeleton";
import { NavigationService } from "../../Services/Navigation.service";
import { SUSPENSE } from "@react-rxjs/core";

export const Thumbnail = ({thumbnail, width, height, url, borderRadius, border}) => {
    const [visible, setVisible] = useState(false);
    
    console.log("HERE", thumbnail);
    const onClickHandler = (e) => {
        if (!url)
            return;
        
        NavigationService.OpenNewTab(url, e);
    }

    const fallback = <Skeleton width={width} height={height}/>;
    return(
        <>
            <DeferredContent onLoad={() => setVisible(true)}>
            {
                thumbnail ?
                <Suspense fallback={fallback}>
                    <img src={thumbnail} className={url ? "pm-thumbnail-link" : null}
                    style={{width: width, height:height, cursor: url ? 'pointer' : null, objectFit: 'cover',
                        borderRadius: borderRadius ? borderRadius : null, border: border ? border : null}} 
                        onClick={onClickHandler} />  
                </Suspense>  : fallback
            }
            </DeferredContent>
            {
                !visible ? fallback : null
            }
        </>
    )
}