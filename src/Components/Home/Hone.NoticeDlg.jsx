import { Dialog } from 'primereact/dialog'
import React, { useRef, useState } from 'react'
import { createEditor } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { DialogHeader } from '../General/DialogHeader'
import { ShowCreateNoticeDlg, useCreateNoticeDlg } from './Home.Notices.context'

const header = (
    <DialogHeader color="rgb(0, 156, 194)" Header="Create New Notice" onClose={() => ShowCreateNoticeDlg(false)}/>
)

export const CreateNoticeDlg = ({}) => {
    const visible = useCreateNoticeDlg();
    const createNoticeRef = useRef();
    const [editor] = useState(() => withReact(createEditor()));
    const initialValue = [
        {
          type: 'paragraph',
          children: [{ text: 'A line of text in a paragraph.' }],
        },
      ]
      
    return (<Dialog id="pm-upload-review" showHeader={true} visible={visible} style={{overflowY: 'hidden'}}
        header={header} closable={true}
        className="pm-dialog" ref={createNoticeRef} onHide={() => ShowCreateNoticeDlg(false)}>
            <Slate editor={editor} value={initialValue}>
                <Editable />
            </Slate>
    </Dialog>)
}

export const EditNoticeDlg = ({}) => {
    const visible = useEditNoticeDlg();
    const [editor] = useState(() => withReact(createEditor()));
    const editNoticeRef = useRef();
    return (<Dialog id="pm-upload-review" showHeader={true} visible={!!visible} style={{overflowY: 'hidden'}}
        header={header} closable={true}
        className="pm-dialog" ref={editNoticeRef} onHide={() => ShowEditNoticeDlg(null)}>
            
    </Dialog>)
}