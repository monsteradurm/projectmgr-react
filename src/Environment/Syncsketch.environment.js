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
    RenameItem: (id) => `/syncsketch/item/${id}/`,
    UploadFile: (reviewId, type) => `/syncsketch-upload/${reviewId}/?noConvertFlag=0${
        type === 'Standard' ? '' : (
            type === '360 video' ? '&type=video360' : '&type=image360'
        )
    }`,
    UpdateItemSort: (reviewId) => `/syncsketch-v2/review/${reviewId}/sort_items/`,
    
    CreateReview: `/syncsketch/review/`,
    DeleteItems: `/syncsketch-v2/bulk-delete-items/`
}

export const SyncsketchQueries = {
    AllUsers: `/syncsketch-v2/account/${SyncsketchConfig.account}/`,
    ActiveProjects: `/syncsketch/project/?active=1&is_archived=0&account__active=1`,

    ReviewsByName: (name) => `/syncsketch/review/?name__istartswith=${name}&active=1`,
    ItemById: (id) => `/syncsketch/item/${id}/`,
    ThumbnailById: (id) => `/syncsketch/item/${id}/?fields=id,thumbnail_url,name`,
    AllFeedback: (itemId) => `/syncsketch/frame/?item__id=${itemId}`,
    ItemsByReview: (reviewId) => `$/syncsketch/item/?reviews__id=${reviewId}&active=1`,
    ReviewsByProjectId: (id) => `/syncsketch/review/?project__id=${id}&active=1&fields=id,name,description,review_url,group`
}
