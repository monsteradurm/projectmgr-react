import { DeferredContent } from "primereact/deferredcontent";
import { Skeleton } from "primereact/skeleton";
import { useEffect, useState } from "react"
import { Stack } from "react-bootstrap"
import { BoxService } from "../../Services/Box.service";
import { NavigationService } from "../../Services/Navigation.service";
import { ToastService } from "../../Services/Toast.service";
import { LazyThumbnail } from "../General/LazyThumbnail";

export const BoxFile = ({file, primary}) => {
    const [thumbnail$, setThumbnail$] = useState(null);
    const [visible, setVisible] = useState(false);

    const onClickHandler = (evt) => {
        
        if (file?.shared_link?.url) {
            NavigationService.OpenNewTab(file.shared_link.url);
            return;
        }

        ToastService.SendInfo("One moment..", "Retrieving URL to selected Box File...")
        BoxService.SharedFile$(file.id).subscribe((link) => {
            if (link)
                NavigationService.OpenNewTab(link);
            else {
                ToastService.SendError("Could not retrieve Box File URL.")
            }
        })
    }
    useEffect(() => {
        if (file && file.id && visible)
            setThumbnail$(BoxService.Thumbnail$(file.id))
    }, [file, visible])

    return (
        <DeferredContent onLoad={() => setVisible(true)}>
            <Stack className="box-file-row" direction="horizontal" gap={3}
                onClick={onClickHandler}
                style={{borderLeftColor: primary, 
                borderRightColor:  primary}}>

                <LazyThumbnail thumbnail$={thumbnail$} width={60} height={60} />
                <div key={file.id}>
                    {file.name}
                </div>
            </Stack>
        </DeferredContent>
    )
}