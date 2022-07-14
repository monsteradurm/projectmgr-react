import { useEffect, useState } from "react"
import { BoxService } from "../../Services/Box.service";
import { ErrorLoading } from "../General/ErrorLoading";
import { Loading } from "../General/Loading";
import { BoxFile } from "./BoxFile";
import * as _ from 'underscore';
import { take } from "rxjs";

export const ReferenceViewer = ({ready, parent, tag, primary, element}) => {
    const [html, setHtml] = useState(null);
    const dTag = tag ? tag : 'All';
    const [root, setRoot] = useState(null);

    useEffect(() => {
        if (!ready) 
            setHtml( <Loading text="Fetching Project Box Folder..." />)
        else if (!parent) {
            setHtml(<ErrorLoading 
                text="Could not find a Box folder for either or all of this Project, Board and Group." />)
        } else {
            const folder = _.find(parent.entries, (f) => f.name === element);
            if (!folder) {
                setHtml(<ErrorLoading text={`Could not find a Box folder for ${element}`} />)
                return;
            }

            setHtml(<Loading text={`Fetching ${element} Box Folder...`} />);
            setRoot(folder.id);
        }
    }, [ready, parent, element])

    useEffect(() => {
        if (!root) return;

        BoxService.FolderContents$(root).pipe(take(1)).subscribe((contents) => {
            const entries = dTag.indexOf('All') === 0 ? contents.entries:
                _.filter(contents.entries.filter(e => e.tags && e.tags.indexOf(dTag) >= 0));
  
            if (entries.length < 1) 
                setHtml(<ErrorLoading text={`Box Folder "${element}" is Empty!`} />)
            else {
                setHtml(
                    entries.map((e) => <BoxFile key={e.id} file={e} primary={primary}/>)
                )
            }
        });

    }, [root])
    useEffect(() => console.log(html), [html])
    return html;
}