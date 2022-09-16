import { ReverseProxy } from "./proxy.environment"

export const SyncsketchConfig = {
    token: 'b1bb92aa73acc60d25721172ba0f64db2654e5ca',
    user: 'acranchliquidanimationcom',
    url: 'https://syncsketch.com/api/v2/',
    account: '116681',
}
const apiv1 = '/reverseProxy/syncsketch.com/api/v1'
const apiv2 = '/reverseProxy/syncsketch.com/api/v2'
const upload =  '/reverseProxy/syncsketch.com/items/uploadToReview'

export const SyncsketchPosts = {
    RenameItem: (id) => `${apiv1}/item/${id}/`,
    UploadFile: (reviewId) => `/syncsketch-upload/${reviewId}/?noConvertFlag=0`,
    UpdateItemSort: (reviewId) => `${apiv2}/review/${reviewId}/sort_items/`,
    
    CreateReview: `${apiv1}/review/`,
}

export const SyncsketchQueries = {
    AllUsers: `${apiv2}/account/${SyncsketchConfig.account}/`,
    ActiveProjects: `${apiv1}/project/?active=1&is_archived=0&account__active=1`,

    ReviewsByName: (name) => `${apiv1}/review/?name__istartswith=${name}&active=1`,
    ItemById: (id) => `${apiv1}/item/${id}/`,
    ThumbnailById: (id) => `${apiv1}/item/${id}/?fields=id,thumbnail_url,name`,
    AllFeedback: (itemId) => `${apiv1}/frame/?item__id=${itemId}`,
    ItemsByReview: (reviewId) => `${apiv1}/item/?reviews__id=${reviewId}&active=1`,
    ReviewsByProjectId: (id) => `${apiv1}/review/?project__id=${id}&active=1&fields=id,name,description,review_url,group`
}
