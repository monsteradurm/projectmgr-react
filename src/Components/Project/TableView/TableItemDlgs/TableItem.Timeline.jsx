import { SUSPENSE } from "@react-rxjs/core";
import { Chips } from "primereact/chips";
import { Dialog } from "primereact/dialog";
import { useCallback, useContext, useEffect, useId, useRef, useState } from "react"
import { Stack } from "react-bootstrap";
import { DialogHeader } from "../../../General/DialogHeader";
import { useDepartment } from "../../Context/Project.context";
import { BoardItemContext, useBoardItemDepartment, useBoardItemName, useBoardItemStatus, useBoardItemTags } from "../../Context/Project.Item.context"
import { useReviewTags } from "../../Context/Project.Review.context";
import { CenteredSummaryContainer } from "../TableItemControls/TableItem.SummaryContainer";
import { SummaryText } from "../TableItemControls/TableItem.SummaryText";
import { ShowEditDescriptionDialog, useEditDescriptionDlg } from "./TableItem.EditDescription.context";
import "./TableItem.EditTags.scss";

export const TableItemTimeline = ({}) => {

}