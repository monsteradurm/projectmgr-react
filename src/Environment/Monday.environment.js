export const MondayConfig = {
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjEwNDEzNzg0NSwidWlkIjoxNjMzMzQ1LCJpYWQiOiIyMDIxLTAzLTI0VDA2OjA1OjAzLjU2MFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo2OTc5NzksInJnbiI6InVzZTEifQ.F33TvuwKuKzIyipXblbTRrlJ2aAtVA3C9ZPVCZKsIAc',
    client_id:  'ddc4de8eafde865ef1b2418acafa0acb',
    client_sec: '78278e7064170bfb9d305cef21aeb0f6',
    client_ss: '78278e7064170bfb9d305cef21aeb0f6',
    tokenURL: 'https://auth.monday.com/oauth2/authorize?client_id=ddc4de8eafde865ef1b2418acafa0acb'
}

export const MondayQueries = {
    ColumnSettings: (id) => 
    `query {
        boards (ids:${id}) {
         columns {
          settings_str id title
         }
        }
      }`
}