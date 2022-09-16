import { ReverseProxy } from "./proxy.environment"

export const SyncsketchConfig = {
    token: 'b1bb92aa73acc60d25721172ba0f64db2654e5ca',
    user: 'acranchliquidanimationcom',
    url: 'https://syncsketch.com/api/v2/',
    account: '116681',
}
const apiv1 = 'syncsketch.com/api/v1'
const apiv2 = 'syncsketch.com/api/v2'
const upload =  'syncsketch.com/items/uploadToReview'

export const SyncsketchPosts = {
    RenameItem: (id) => `${ReverseProxy}${apiv1}/item/${id}/`,
    UploadFile: (reviewId, type) => `/syncsketch-upload/${reviewId}/?noConvertFlag=0${
        type === 'Standard' ? '' : (
            type === '360 video' ? '&type=video360' : '&type=image360'
        )
    }`,
    UpdateItemSort: (reviewId) => `${ReverseProxy}${apiv2}/review/${reviewId}/sort_items/`,
    
    CreateReview: `${apiv1}/review/`,
}

export const SyncsketchQueries = {
    AllUsers: `${ReverseProxy}${apiv2}/account/${SyncsketchConfig.account}/`,
    ActiveProjects: `${ReverseProxy}${apiv1}/project/?active=1&is_archived=0&account__active=1`,

    ReviewsByName: (name) => `${ReverseProxy}${apiv1}/review/?name__istartswith=${name}&active=1`,
    ItemById: (id) => `${ReverseProxy}${apiv1}/item/${id}/`,
    ThumbnailById: (id) => `${ReverseProxy}${apiv1}/item/${id}/?fields=id,thumbnail_url,name`,
    AllFeedback: (itemId) => `${ReverseProxy}${apiv1}/frame/?item__id=${itemId}`,
    ItemsByReview: (reviewId) => `${ReverseProxy}${apiv1}/item/?reviews__id=${reviewId}&active=1`,
    ReviewsByProjectId: (id) => `${ReverseProxy}${apiv1}/review/?project__id=${id}&active=1&fields=id,name,description,review_url,group`
}
