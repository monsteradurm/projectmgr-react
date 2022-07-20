
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog'; // To use <ConfirmDialog> tag
import { useState } from 'react';
import "./WarningDlg.component.scss"

export const WarningDlg = ({message, visible}) => {

    const closeDlg = (evt) => {
        visible.setFalse();
    }

    return (
            <ConfirmDialog visible={visible.value} onHide={() => visible.setFalse()} 
            message={message} className="pm-warning-dlg" acceptLabel="Ok!"
            rejectClassName="pm-hide"
            header="Warning!" icon="pi pi-exclamation-triangle" />
    )
}