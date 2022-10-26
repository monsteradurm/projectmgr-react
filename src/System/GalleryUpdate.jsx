import { Button, InputText } from "primereact";
import { Stack } from "react-bootstrap"
import { SetGalleryFolderId, UpdateGalleryFolder, useGalleryFolderId } from "./GalleryUpdate.context";

export const GalleryUpdateComponent = ({headerHeight}) => {
    const FolderId = useGalleryFolderId();

    return (<Stack className="pm-galleryUpdate" direction="vertical" style={{padding: 30}}>
        <div></div>
        <Stack direction="horizontal" style={{justifyContent: 'center'}} gap={3}>
            <span className="p-float-label" style={{width: 250}}>
                <InputText id="Folder Id" value={FolderId}  
                    style={{width:'100%'}} onChange={(e) => SetGalleryFolderId(e.target.value)}
                    placeholder="eg. 12344456" />
                <label htmlFor="FolderId">Folder Id</label> 
            </span>
            <Button label="Update" onClick={() => UpdateGalleryFolder(FolderId)}
                style={{width: 100}}/>
        </Stack>
    </Stack>)
}