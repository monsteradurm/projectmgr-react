import { Skeleton } from "primereact/skeleton";
import { useEffect, useState } from "react"
import { Stack } from "react-bootstrap"
import { BoxService } from "../../Services/Box.service";
import { NavigationService } from "../../Services/Navigation.service";
import { ToastService } from "../../Services/Toast.service";
import { LazyThumbnail } from "../General/LazyThumbnail";

export const BoxFile = ({file, primary}) => {
    const [thumbnail$, setThumbnail$] = useState(null);
    const [hovering, setHovering] = useState(false);

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
        if (file && file.id)
            setThumbnail$(BoxService.Thumbnail$(file.id))
    }, [file])

    return (
        <Stack className="box-file-row" direction="horizontal" gap={3}
            onClick={onClickHandler}
            style={{borderLeftColor: primary, 
            borderRightColor:  primary}}>

            <LazyThumbnail thumbnail$={thumbnail$} width={100} height={60} />
            <div key={file.id}>
                {file.name}
            </div>
        </Stack>
    )
}