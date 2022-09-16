import { SUSPENSE } from "@react-rxjs/core";
import { Skeleton } from "primereact/skeleton";
import { Stack } from "react-bootstrap";
import { useSyncsketchComments } from "../../Context/Project.Syncsketch.context";

const loremComment = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
export const TableItemReviewComments = ({ItemId, Comments}) => {
    if (!Comments || Comments === SUSPENSE) return (
        <Stack direction="vertical" gap={2} style={{paddingLeft: 10}}>
            <Skeleton shape="rectangle" width="100%" />
            <Skeleton shape="rectangle" width="100%" />
            <Skeleton shape="rectangle" width={200} />
        </Stack>
    )

    if (Comments.length < 1)
        return (
        <div className="pm-review-comments" style={{paddingLeft: 10, paddingTop: 0}}>
            No Comments...
        </div>)

    return (
    <div className="pm-review-comments" style={{paddingLeft: 10, paddingTop: 0}}>
        {Comments[0].text.length > 400 ? Comments[0].text.slice(0, 397) + '...' : Comments[0].text}
    </div>)
}