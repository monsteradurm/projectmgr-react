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
    RenameItem: (id) => `${ReverseProxy}${apiv1}/item/${id}/`,
    UploadFile: (reviewId) => `/syncsketch-upload/${reviewId}/?noConvertFlag=0`
}

export const SyncsketchQueries = {
    AllUsers: `${ReverseProxy}${apiv2}/account/${SyncsketchConfig.account}/`,
    ActiveProjects: `${ReverseProxy}${apiv1}/project/?active=1&is_archived=0&account__active=1`,

    ReviewsByName: (name) => `${ReverseProxy}${apiv1}/review/?name__istartswith=${name}&active=1`,
    ItemById: (id) => `${ReverseProxy}${apiv1}/item/${id}/`,
    AllFeedback: (itemId) => `${ReverseProxy}${apiv1}/frame/?item__id=${itemId}`,
}
