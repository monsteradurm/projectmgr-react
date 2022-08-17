import { ReverseProxy } from "./proxy.environment"

export const SyncsketchConfig = {
    token: 'b1bb92aa73acc60d25721172ba0f64db2654e5ca',
    user: 'acranchliquidanimationcom',
    url: 'https://syncsketch.com/api/v2/',
    account: '116681',
}
const apiv1 = 'syncsketch.com/api/v1'
const apiv2 = 'syncsketch.com/api/v2'
const upload = 'syncsketch.com/items/uploadToReview'

export const SyncsketchPosts = {
    RenameItem: (id) => `/syncsketch/item/${id}/`,
    UploadFile: (reviewId) => `/syncsketch-upload/${reviewId}/?noConvertFlag=0`,
    UpdateItemSort: (reviewId) => `/syncsketch-v2/review/${reviewId}/sort_items/`
}

export const SyncsketchQueries = {
    AllUsers: `/syncsketch-v2/account/${SyncsketchConfig.account}/`,
    ActiveProjects: `/syncsketch/project/?active=1&is_archived=0&account__active=1`,

    ReviewsByName: (name) => `/syncsketch/review/?name__istartswith=${name}&active=1`,
    ItemById: (id) => `/syncsketch/item/${id}/`,
    AllFeedback: (itemId) => `/syncsketch/frame/?item__id=${itemId}`,
    ItemsByReview: (reviewId) => `/syncsketch/item/?reviews__id=${reviewId}&active=1`
}
