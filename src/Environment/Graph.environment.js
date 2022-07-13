import { Configuration, PopupRequest } from "@azure/msal-browser";

// Config object to be passed to Msal on creation

export const MSALConfig = {

    auth: {

        clientId: 'aa68ec97-71ef-474a-a98c-60d2e987c2b9',

        authority: "https://login.microsoftonline.com/common/",

        redirectUri: "/",

        postLogoutRedirectUri: "/",

    },

    cache: {

        cacheLocation: "localStorage",

        storeAuthStateInCookie: false,

        secureCookies: true

    },

};

export const OAuthScopes = {

    scopes: [ "user.read.all",

    "user.readwrite.all",

    "calendars.read",

    "mail.read",

    "contacts.read",

    "openid"]

};

export const GraphEndpoints = {
    me: "https://graph.microsoft.com/v1.0/me",
    users: "https://graph.microsoft.com/v1.0/users"
}